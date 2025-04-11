import { PgBoss } from 'pg-boss';
import { LifeCoachProfile, LifeCoachCheckIn, LifeCoachReflection, LifeCoachInsight, User } from '@wasp/entities';
import { OpenAI } from 'openai';
import prisma from '@wasp/dbClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type DateRange = {
  startDate: Date;
  endDate: Date;
};

// Generate insights from recent check-ins
export const generateDailyLifeCoachInsights = async (args: any, context: { entities: any }) => {
  try {
    console.log('Starting daily insights generation job');

    // Get all active users with life coach profiles
    const activeUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'active',
        lifeCoachProfile: {
          isNot: null
        }
      },
      include: {
        lifeCoachProfile: true
      }
    });

    console.log(`Found ${activeUsers.length} active users with life coach profiles`);

    for (const user of activeUsers) {
      try {
        await generateInsightsForUser(user);
      } catch (error) {
        console.error(`Error generating insights for user ${user.id}:`, error);
      }
    }

    console.log('Daily insights generation job completed');
    return { success: true };
  } catch (error) {
    console.error('Error in daily insights generation job:', error);
    return { success: false, error: String(error) };
  }
};

// Generate weekly reflections based on check-ins
export const generateWeeklyLifeCoachReflections = async (args: any, context: { entities: any }) => {
  try {
    console.log('Starting weekly reflections generation job');

    // Get all active users with life coach profiles
    const activeUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'active',
        lifeCoachProfile: {
          isNot: null
        }
      },
      include: {
        lifeCoachProfile: true
      }
    });

    console.log(`Found ${activeUsers.length} active users with life coach profiles`);

    // Calculate last week's date range (Sunday to Saturday)
    const lastWeekRange = getLastWeekDateRange();

    for (const user of activeUsers) {
      try {
        await generateWeeklyReflectionForUser(user, lastWeekRange);
      } catch (error) {
        console.error(`Error generating weekly reflection for user ${user.id}:`, error);
      }
    }

    console.log('Weekly reflections generation job completed');
    return { success: true };
  } catch (error) {
    console.error('Error in weekly reflections generation job:', error);
    return { success: false, error: String(error) };
  }
};

// Helper function to get recent check-ins for a user
async function getRecentCheckIns(profileId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await prisma.lifeCoachCheckIn.findMany({
    where: {
      profileId,
      checkInDate: {
        gte: startDate
      }
    },
    orderBy: {
      checkInDate: 'desc'
    }
  });
}

// Helper function to generate insights for a user
async function generateInsightsForUser(user: any) {
  if (!user.lifeCoachProfile) {
    console.log(`User ${user.id} does not have a life coach profile, skipping`);
    return;
  }

  const recentCheckIns = await getRecentCheckIns(user.lifeCoachProfile.id, 7);
  
  if (recentCheckIns.length < 3) {
    console.log(`User ${user.id} has fewer than 3 recent check-ins, skipping insights generation`);
    return;
  }

  try {
    // Prepare check-in data for AI analysis
    const checkInSummaries = recentCheckIns.map(checkIn => {
      return `
        Date: ${checkIn.checkInDate.toISOString().split('T')[0]}
        Mood: ${checkIn.mood}/10, Energy: ${checkIn.energy}/10, Focus: ${checkIn.focus}/10, Stress: ${checkIn.stress}/10
        Win: ${checkIn.dailyWin || 'Not provided'}
        Challenge: ${checkIn.dailyChallenge || 'Not provided'}
        Tags: ${checkIn.tags.join(', ')}
      `;
    }).join('\n');

    // Generate insights using AI
    const insights = await generateInsightsFromCheckIns({
      user,
      profile: user.lifeCoachProfile,
      checkIns: recentCheckIns,
      checkInSummaries
    });

    if (!insights || !insights.insights || insights.insights.length === 0) {
      console.log(`No meaningful insights generated for user ${user.id}, skipping`);
      return;
    }

    // Create insights in database
    for (const insightData of insights.insights) {
      await prisma.lifeCoachInsight.create({
        data: {
          profile: { connect: { id: user.lifeCoachProfile.id } },
          insightType: insightData.type,
          content: insightData.content,
          relatedCheckIns: recentCheckIns.map(c => c.id),
          status: 'new'
        }
      });
    }

    console.log(`Created ${insights.insights.length} insights for user ${user.id}`);
  } catch (error) {
    console.error(`Error generating insights for user ${user.id}:`, error);
  }
}

// Helper function to generate weekly reflection for a user
async function generateWeeklyReflectionForUser(user: any, dateRange: DateRange) {
  if (!user.lifeCoachProfile) {
    console.log(`User ${user.id} does not have a life coach profile, skipping`);
    return;
  }

  // Check if a weekly reflection already exists for this week
  const existingReflection = await prisma.lifeCoachReflection.findFirst({
    where: {
      profileId: user.lifeCoachProfile.id,
      reflectionType: 'weekly',
      startDate: {
        gte: dateRange.startDate
      },
      endDate: {
        lte: dateRange.endDate
      }
    }
  });

  if (existingReflection) {
    console.log(`Weekly reflection already exists for user ${user.id}, skipping`);
    return;
  }

  // Get check-ins for the past week
  const checkIns = await prisma.lifeCoachCheckIn.findMany({
    where: {
      profileId: user.lifeCoachProfile.id,
      checkInDate: {
        gte: dateRange.startDate,
        lte: dateRange.endDate
      }
    },
    orderBy: {
      checkInDate: 'asc'
    }
  });

  if (checkIns.length < 2) {
    console.log(`User ${user.id} has fewer than 2 check-ins for the week, skipping reflection generation`);
    return;
  }

  try {
    // Generate reflection using AI
    const reflectionData = await generateReflectionFromCheckIns({
      user,
      profile: user.lifeCoachProfile,
      checkIns,
      reflectionType: 'weekly',
      startDate: dateRange.startDate.toISOString().split('T')[0],
      endDate: dateRange.endDate.toISOString().split('T')[0]
    });

    // Create reflection in database
    await prisma.lifeCoachReflection.create({
      data: {
        profile: { connect: { id: user.lifeCoachProfile.id } },
        reflectionType: 'weekly',
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        summary: reflectionData.summary,
        insights: reflectionData.insights || [],
        strengths: reflectionData.strengths || [],
        improvements: reflectionData.improvements || [],
        recommendations: reflectionData.recommendations || []
      }
    });

    console.log(`Created weekly reflection for user ${user.id}`);
  } catch (error) {
    console.error(`Error generating weekly reflection for user ${user.id}:`, error);
  }
}

// Helper function to get last week's date range (Sunday to Saturday)
function getLastWeekDateRange(): DateRange {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate last Saturday
  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() - day - 1);
  lastSaturday.setHours(23, 59, 59, 999);
  
  // Calculate last Sunday
  const lastSunday = new Date(lastSaturday);
  lastSunday.setDate(lastSaturday.getDate() - 6);
  lastSunday.setHours(0, 0, 0, 0);
  
  return {
    startDate: lastSunday,
    endDate: lastSaturday
  };
}

// Helper function to generate insights from check-ins using AI
async function generateInsightsFromCheckIns({ user, profile, checkIns, checkInSummaries }: any) {
  try {
    const prompt = `
      As an AI life coach, analyze these recent check-ins:
      
      User Goals: ${profile.goals.join(', ')}
      Focus Areas: ${profile.focusAreas.join(', ')}
      Personal Values: ${profile.personalValues.join(', ')}
      
      Recent Check-ins:
      ${checkInSummaries}
      
      Based on these check-ins, identify meaningful patterns, provide suggestions, and make observations that can help the user.
      Focus on generating 3-5 high-quality insights that would be valuable to the user.
      
      Each insight should have:
      1. A type (pattern, suggestion, or observation)
      2. Detailed content explaining the insight
      
      Return the response as JSON with this structure:
      {
        "insights": [
          {
            "type": "pattern|suggestion|observation",
            "content": "Detailed explanation of the insight"
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI life coach analyzing recent check-ins. Return only a JSON response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const insights = JSON.parse(response.choices[0].message.content || "{}");
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      insights: []
    };
  }
}

// Helper function to generate reflection from check-ins using AI
async function generateReflectionFromCheckIns({ user, profile, checkIns, reflectionType, startDate, endDate }: any) {
  try {
    const checkInSummaries = checkIns.map((checkIn: any) => {
      return `
        Date: ${checkIn.checkInDate.toISOString().split('T')[0]}
        Mood: ${checkIn.mood}/10, Energy: ${checkIn.energy}/10, Focus: ${checkIn.focus}/10, Stress: ${checkIn.stress}/10
        Win: ${checkIn.dailyWin || 'Not provided'}
        Challenge: ${checkIn.dailyChallenge || 'Not provided'}
        Tags: ${checkIn.tags.join(', ')}
      `;
    }).join('\n');

    const prompt = `
      As an AI life coach, generate a ${reflectionType} reflection for the period from ${startDate} to ${endDate}.
      
      User Goals: ${profile.goals.join(', ')}
      Focus Areas: ${profile.focusAreas.join(', ')}
      Personal Values: ${profile.personalValues.join(', ')}
      
      Check-in summaries for this period:
      ${checkInSummaries}
      
      Generate a comprehensive reflection that includes:
      1. A thoughtful summary of the period
      2. Key insights discovered
      3. Areas of strength demonstrated
      4. Areas for improvement
      5. Actionable recommendations for the future
      
      Return the response as JSON with keys: summary, insights (array), strengths (array), improvements (array), recommendations (array)
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI life coach generating a reflection based on a user's check-ins. Return only a JSON response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const reflection = JSON.parse(response.choices[0].message.content || "{}");
    return reflection;
  } catch (error) {
    console.error('Error generating reflection:', error);
    return {
      summary: "Unable to generate reflection at this time.",
      insights: [],
      strengths: [],
      improvements: [],
      recommendations: []
    };
  }
} 