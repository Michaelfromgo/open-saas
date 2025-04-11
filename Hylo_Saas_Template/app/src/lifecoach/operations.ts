import type { LifeCoachGoal, DailyCheckin, WeeklySummary } from 'wasp/entities';
import type {
  CreateLifeCoachGoal,
  CreateDailyCheckin,
  GetLifeCoachGoal,
  GetWeeklySummary,
  GenerateWeeklySummary,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import OpenAI from 'openai';
import { getDateRangeForWeek } from './utils';

// OpenAI setup
const openai = setupOpenAI();
function setupOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Create a new life coach goal
export const createLifeCoachGoal: CreateLifeCoachGoal<
  {
    goalDescription: string;
    targetDate: Date;
    checkinFrequency: string;
  }, 
  LifeCoachGoal
> = async (goal, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.LifeCoachGoal.create({
    data: {
      goalDescription: goal.goalDescription,
      targetDate: goal.targetDate,
      checkinFrequency: goal.checkinFrequency,
      user: { connect: { id: context.user.id } }
    }
  });
};

// Get a user's life coach goal
export const getLifeCoachGoal: GetLifeCoachGoal<void, LifeCoachGoal | null> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.LifeCoachGoal.findFirst({
    where: { userId: context.user.id },
    include: {
      dailyCheckins: {
        orderBy: { checkinDate: 'desc' }
      }
    }
  });
};

// Create a daily check-in
export const createDailyCheckin: CreateDailyCheckin<
  {
    goalId: string;
    actionCompleted: boolean;
    comments?: string;
  },
  DailyCheckin
> = async (checkin, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Verify the goal belongs to the user
  const goal = await context.entities.LifeCoachGoal.findFirst({
    where: {
      id: checkin.goalId,
      userId: context.user.id
    }
  });

  if (!goal) {
    throw new HttpError(403, 'You do not have permission to access this goal');
  }

  return context.entities.DailyCheckin.create({
    data: {
      actionCompleted: checkin.actionCompleted,
      comments: checkin.comments,
      goal: { connect: { id: checkin.goalId } }
    }
  });
};

// Get the latest weekly summary
export const getWeeklySummary: GetWeeklySummary<void, WeeklySummary | null> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const goal = await context.entities.LifeCoachGoal.findFirst({
    where: { userId: context.user.id }
  });

  if (!goal) {
    return null;
  }

  return context.entities.WeeklySummary.findFirst({
    where: { goalId: goal.id },
    orderBy: { createdAt: 'desc' }
  });
};

// Generate a weekly summary
export const generateWeeklySummary: GenerateWeeklySummary<
  { goalId: string },
  WeeklySummary
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Check for OpenAI API key
  if (!openai) {
    throw new HttpError(500, 'OpenAI API is not configured');
  }

  // Verify the goal belongs to the user
  const goal = await context.entities.LifeCoachGoal.findFirst({
    where: {
      id: args.goalId,
      userId: context.user.id
    }
  });

  if (!goal) {
    throw new HttpError(403, 'You do not have permission to access this goal');
  }

  // Get date range for the current week
  const { startDate, endDate } = getDateRangeForWeek();

  // Fetch check-ins for the current week
  const checkins = await context.entities.DailyCheckin.findMany({
    where: {
      goalId: args.goalId,
      checkinDate: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Prepare check-in data for LLM
  const completedDays = checkins.filter(c => c.actionCompleted).length;
  const totalDays = checkins.length;
  const dailySummaryData = `Completed check-ins on ${completedDays} out of ${totalDays} days.`;

  // Generate summary using LLM
  const prompt = `
    User Goal: ${goal.goalDescription}
    Check-In Summary for the past week: ${dailySummaryData}
    Please provide:
    1. A concise summary of the user's progress (3-4 sentences)
    2. A motivational message based on their performance (2-3 sentences)
    3. One actionable tip for the coming week (1-2 sentences)
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive life coach helping users achieve their personal goals. Provide encouraging, actionable feedback based on their progress data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response into sections
    const sections = content.split(/\n\s*\n/);
    const summaryText = sections[0] || 'Summary not available.';
    const motivationalMessage = sections[1] || 'Keep up the good work!';
    const actionableTip = sections[2] || 'Try to maintain consistency in the coming week.';

    // Create the weekly summary
    return context.entities.WeeklySummary.create({
      data: {
        weekStartDate: startDate,
        weekEndDate: endDate,
        summaryText: summaryText.trim(),
        motivationalMessage: motivationalMessage.trim(),
        actionableTip: actionableTip.trim(),
        goal: { connect: { id: args.goalId } }
      }
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    throw new HttpError(500, 'Failed to generate weekly summary');
  }
}; 