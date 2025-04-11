import type { LifeCoachGoal, DailyCheckin, WeeklySummary, LifeCoachChatMessage } from 'wasp/entities';
import type {
  SendLifeCoachChatMessage,
  GetLifeCoachChatHistory,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from './utils';

// OpenAI setup
const openai = setupOpenAI();
function setupOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Send a message to the Life Coach and get a response
export const sendLifeCoachChatMessage: SendLifeCoachChatMessage<
  {
    content: string;
    sessionId?: string;
  },
  { userMessage: LifeCoachChatMessage; aiResponse: LifeCoachChatMessage }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Check for OpenAI API key
  if (!openai) {
    throw new HttpError(500, 'OpenAI API is not configured');
  }

  // Get the user's goal
  const goal = await context.entities.LifeCoachGoal.findFirst({
    where: { userId: context.user.id },
    include: {
      dailyCheckins: {
        orderBy: { checkinDate: 'desc' },
        take: 7
      },
      weeklySummaries: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!goal) {
    throw new HttpError(404, 'No goal found. Please set up your goal first.');
  }

  // Use existing session or create a new one
  const sessionId = args.sessionId || uuidv4();

  // Get previous messages for context (limited to last 10 messages)
  const previousMessages = await context.entities.LifeCoachChatMessage.findMany({
    where: {
      goalId: goal.id,
      sessionId
    },
    orderBy: { createdAt: 'asc' },
    take: 10
  });

  // Prepare context for the AI prompt
  const completedCheckIns = goal.dailyCheckins.filter(c => c.actionCompleted).length;
  const totalCheckIns = goal.dailyCheckins.length;
  
  // Format check-in data in a more detailed way
  let checkinSummary = `User has completed ${completedCheckIns} out of ${totalCheckIns || 7} check-ins.`;
  
  // Add more detailed check-in information
  if (goal.dailyCheckins.length > 0) {
    const recentCheckIns = goal.dailyCheckins.slice(0, 5).map(checkin => {
      const date = new Date(checkin.checkinDate);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `- ${dateStr}: ${checkin.actionCompleted ? 'Completed' : 'Not completed'}${checkin.comments ? ` (Comment: "${checkin.comments}")` : ''}`;
    }).join('\n');
    
    checkinSummary += `\n\nRecent check-ins:\n${recentCheckIns}`;
    
    // Add information about the latest check-in
    const latestCheckin = goal.dailyCheckins[0];
    const latestDate = new Date(latestCheckin.checkinDate);
    const today = new Date();
    const isToday = latestDate.toDateString() === today.toDateString();
    
    if (isToday) {
      checkinSummary += `\n\nThe user has checked in today and ${latestCheckin.actionCompleted ? 'completed' : 'did not complete'} their goal-related activity.`;
    } else {
      checkinSummary += `\n\nThe user has not checked in today yet. Their last check-in was on ${formatDate(latestDate)}.`;
    }
  }
  
  // Get the latest weekly summary if available
  const latestSummary = goal.weeklySummaries[0];
  
  // Create a new user message in the database
  const userMessage = await context.entities.LifeCoachChatMessage.create({
    data: {
      goalId: goal.id,
      sessionId,
      isUserMessage: true,
      content: args.content
    }
  });

  // Build the conversation history for context
  const conversationHistory = previousMessages.map(msg => ({
    role: msg.isUserMessage ? 'user' as const : 'assistant' as const,
    content: msg.content
  }));

  // Prepare the system message with context about the user's goal and progress
  const systemMessage = {
    role: 'system' as const,
    content: `You are a supportive AI Life Coach helping the user achieve their goal: "${goal.goalDescription}" (target date: ${formatDate(new Date(goal.targetDate))}). 
    
    Recent check-in data: ${checkinSummary}
    
    ${latestSummary ? `Last week's summary: ${latestSummary.summaryText}` : ''}
    ${latestSummary ? `Motivational message: ${latestSummary.motivationalMessage}` : ''}
    ${latestSummary ? `Actionable tip: ${latestSummary.actionableTip}` : ''}
    
    Provide personalized, motivational advice that acknowledges their progress. Be concise, supportive, and action-oriented. Avoid generic platitudes and focus on practical steps they can take.`
  };

  try {
    // Call the LLM with the context and user query
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        systemMessage,
        ...conversationHistory,
        { role: 'user' as const, content: args.content }
      ],
      temperature: 0.7,
    });

    const aiResponseContent = response.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.';

    // Save the AI response to the database
    const aiResponse = await context.entities.LifeCoachChatMessage.create({
      data: {
        goalId: goal.id,
        sessionId,
        isUserMessage: false,
        content: aiResponseContent,
        metadata: {
          model: 'gpt-4o',
          contextUsed: {
            goalDescription: goal.goalDescription,
            targetDate: goal.targetDate,
            checkinSummary
          }
        }
      }
    });

    return { userMessage, aiResponse };
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new HttpError(500, 'Failed to generate AI response');
  }
};

// Get chat history for a user's current goal
export const getLifeCoachChatHistory: GetLifeCoachChatHistory<
  { sessionId?: string; limit?: number },
  LifeCoachChatMessage[]
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Get the user's goal
  const goal = await context.entities.LifeCoachGoal.findFirst({
    where: { userId: context.user.id }
  });

  if (!goal) {
    return [];
  }

  // Default limit to 50 messages if not specified
  const limit = args.limit || 50;

  // Query parameters
  const queryParams: any = {
    where: { goalId: goal.id },
    orderBy: { createdAt: 'asc' },
    take: limit
  };

  // Add sessionId filter if provided
  if (args.sessionId) {
    queryParams.where.sessionId = args.sessionId;
  }

  return context.entities.LifeCoachChatMessage.findMany(queryParams);
}; 