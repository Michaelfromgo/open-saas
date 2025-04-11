import { LifeCoachAchievement, LifeCoachCheckIn, LifeCoachInsight, LifeCoachProfile, LifeCoachReflection, User } from '@wasp/entities';
import { HttpError } from '@wasp/errors';
import { useUser } from '@wasp/auth/useUser';
import { type GetLifeCoachProfileInput, type GetLifeCoachCheckInsInput, type CreateLifeCoachCheckInInput, 
  type GetLifeCoachReflectionsInput, type GenerateLifeCoachReflectionInput, type GetLifeCoachAchievementsInput, 
  type CreateLifeCoachAchievementInput, type GetLifeCoachInsightsInput, type UpdateLifeCoachInsightStatusInput,
  type CreateOrUpdateLifeCoachProfileInput } from '@wasp/actions/types';
import { type GetUserInput } from '@wasp/queries/types';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get profile or create default if it doesn't exist
export const getLifeCoachProfile = async (args: GetUserInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  let profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id },
    include: { user: true }
  });

  if (!profile) {
    // Create a default profile if none exists
    profile = await context.entities.LifeCoachProfile.create({
      data: {
        user: { connect: { id: context.user.id } },
      }
    });
  }

  return profile;
};

// Create or update Life Coach profile
export const createOrUpdateLifeCoachProfile = async (input: CreateOrUpdateLifeCoachProfileInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { goals, focusAreas, personalValues, checkInFrequency, preferredCheckInTime } = input;

  // Check if profile exists
  const existingProfile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (existingProfile) {
    // Update existing profile
    return await context.entities.LifeCoachProfile.update({
      where: { id: existingProfile.id },
      data: {
        goals,
        focusAreas,
        personalValues,
        checkInFrequency,
        preferredCheckInTime
      }
    });
  } else {
    // Create new profile
    return await context.entities.LifeCoachProfile.create({
      data: {
        user: { connect: { id: context.user.id } },
        goals,
        focusAreas,
        personalValues,
        checkInFrequency,
        preferredCheckInTime
      }
    });
  }
};

// Get check-ins with pagination
export const getLifeCoachCheckIns = async (input: GetLifeCoachCheckInsInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { page = 1, limit = 10, startDate, endDate } = input;
  const skip = (page - 1) * limit;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  // Build filter conditions
  const whereConditions: any = {
    profileId: profile.id
  };

  if (startDate && endDate) {
    whereConditions.checkInDate = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // Get check-ins with pagination
  const checkIns = await context.entities.LifeCoachCheckIn.findMany({
    where: whereConditions,
    orderBy: { checkInDate: 'desc' },
    skip,
    take: limit
  });

  // Get total count for pagination
  const totalCheckIns = await context.entities.LifeCoachCheckIn.count({
    where: whereConditions
  });

  return {
    checkIns,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCheckIns / limit),
      totalItems: totalCheckIns
    }
  };
};

// Create a new check-in and generate AI analysis
export const createLifeCoachCheckIn = async (input: CreateLifeCoachCheckInInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { mood, energy, focus, stress, sleep, dailyWin, dailyChallenge, gratitude, intentions, tags } = input;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id },
    include: { user: true }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  try {
    // Generate AI analysis of the check-in
    const aiAnalysis = await generateCheckInAnalysis({
      user: profile.user,
      profile,
      checkInData: {
        mood, energy, focus, stress, sleep, dailyWin, dailyChallenge, gratitude, intentions, tags
      }
    });

    // Create new check-in with AI analysis
    const newCheckIn = await context.entities.LifeCoachCheckIn.create({
      data: {
        profile: { connect: { id: profile.id } },
        mood,
        energy,
        focus,
        stress,
        sleep,
        dailyWin,
        dailyChallenge,
        gratitude,
        intentions,
        tags,
        aiAnalysis
      }
    });

    return newCheckIn;
  } catch (error) {
    console.error('Error creating check-in:', error);
    throw new HttpError(500, 'Failed to create check-in');
  }
};

// Helper function to generate AI analysis for check-ins
async function generateCheckInAnalysis({ user, profile, checkInData }: any) {
  try {
    const prompt = `
      As an AI life coach, analyze this daily check-in data:
      User Goals: ${profile.goals.join(', ')}
      Focus Areas: ${profile.focusAreas.join(', ')}
      Personal Values: ${profile.personalValues.join(', ')}
      
      Today's Check-in:
      - Mood: ${checkInData.mood}/10
      - Energy: ${checkInData.energy}/10
      - Focus: ${checkInData.focus}/10
      - Stress: ${checkInData.stress}/10
      - Sleep: ${checkInData.sleep ? `${checkInData.sleep} hours` : 'Not provided'}
      
      Win: ${checkInData.dailyWin || 'Not provided'}
      Challenge: ${checkInData.dailyChallenge || 'Not provided'}
      Gratitude: ${checkInData.gratitude || 'Not provided'}
      Intentions: ${checkInData.intentions || 'Not provided'}
      Tags: ${checkInData.tags.join(', ')}
      
      Provide a brief analysis with:
      1. Patterns and trends
      2. Actionable recommendations
      3. Positive reinforcement
      4. Areas for growth
      
      Return the response as JSON with keys: summary, patterns, recommendations, positiveReinforcement, areasForGrowth
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI life coach analyzing a user's daily check-in. Return only a JSON response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return analysis;
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return {
      summary: "Unable to generate analysis at this time.",
      patterns: [],
      recommendations: [],
      positiveReinforcement: [],
      areasForGrowth: []
    };
  }
}

// Get reflections with pagination
export const getLifeCoachReflections = async (input: GetLifeCoachReflectionsInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { page = 1, limit = 5, reflectionType } = input;
  const skip = (page - 1) * limit;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  // Build filter conditions
  const whereConditions: any = {
    profileId: profile.id
  };

  if (reflectionType) {
    whereConditions.reflectionType = reflectionType;
  }

  // Get reflections with pagination
  const reflections = await context.entities.LifeCoachReflection.findMany({
    where: whereConditions,
    orderBy: { endDate: 'desc' },
    skip,
    take: limit
  });

  // Get total count for pagination
  const totalReflections = await context.entities.LifeCoachReflection.count({
    where: whereConditions
  });

  return {
    reflections,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalReflections / limit),
      totalItems: totalReflections
    }
  };
};

// Generate a new reflection based on check-ins
export const generateLifeCoachReflection = async (input: GenerateLifeCoachReflectionInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { reflectionType, startDate, endDate } = input;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id },
    include: { user: true }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  // Get check-ins within the specified date range
  const checkIns = await context.entities.LifeCoachCheckIn.findMany({
    where: {
      profileId: profile.id,
      checkInDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    orderBy: { checkInDate: 'asc' }
  });

  if (checkIns.length === 0) {
    throw new HttpError(400, 'No check-ins found for the specified date range');
  }

  try {
    // Generate reflection using AI
    const reflectionData = await generateReflectionFromCheckIns({
      user: profile.user,
      profile,
      checkIns,
      reflectionType,
      startDate,
      endDate
    });

    // Create new reflection
    const newReflection = await context.entities.LifeCoachReflection.create({
      data: {
        profile: { connect: { id: profile.id } },
        reflectionType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        summary: reflectionData.summary,
        insights: reflectionData.insights,
        strengths: reflectionData.strengths,
        improvements: reflectionData.improvements,
        recommendations: reflectionData.recommendations
      }
    });

    return newReflection;
  } catch (error) {
    console.error('Error generating reflection:', error);
    throw new HttpError(500, 'Failed to generate reflection');
  }
};

// Helper function to generate reflection from check-ins
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

// Get achievements with pagination
export const getLifeCoachAchievements = async (input: GetLifeCoachAchievementsInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { page = 1, limit = 10, category } = input;
  const skip = (page - 1) * limit;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  // Build filter conditions
  const whereConditions: any = {
    profileId: profile.id
  };

  if (category) {
    whereConditions.category = category;
  }

  // Get achievements with pagination
  const achievements = await context.entities.LifeCoachAchievement.findMany({
    where: whereConditions,
    orderBy: { achievedDate: 'desc' },
    skip,
    take: limit
  });

  // Get total count for pagination
  const totalAchievements = await context.entities.LifeCoachAchievement.count({
    where: whereConditions
  });

  return {
    achievements,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalAchievements / limit),
      totalItems: totalAchievements
    }
  };
};

// Create a new achievement
export const createLifeCoachAchievement = async (input: CreateLifeCoachAchievementInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { title, description, achievedDate, category, celebrationType } = input;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  try {
    // Create new achievement
    const newAchievement = await context.entities.LifeCoachAchievement.create({
      data: {
        profile: { connect: { id: profile.id } },
        title,
        description,
        achievedDate: new Date(achievedDate),
        category,
        celebrationType
      }
    });

    return newAchievement;
  } catch (error) {
    console.error('Error creating achievement:', error);
    throw new HttpError(500, 'Failed to create achievement');
  }
};

// Get insights with pagination
export const getLifeCoachInsights = async (input: GetLifeCoachInsightsInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { page = 1, limit = 10, status, insightType } = input;
  const skip = (page - 1) * limit;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  // Build filter conditions
  const whereConditions: any = {
    profileId: profile.id
  };

  if (status) {
    whereConditions.status = status;
  }

  if (insightType) {
    whereConditions.insightType = insightType;
  }

  // Get insights with pagination
  const insights = await context.entities.LifeCoachInsight.findMany({
    where: whereConditions,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });

  // Get total count for pagination
  const totalInsights = await context.entities.LifeCoachInsight.count({
    where: whereConditions
  });

  return {
    insights,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalInsights / limit),
      totalItems: totalInsights
    }
  };
};

// Update insight status
export const updateLifeCoachInsightStatus = async (input: UpdateLifeCoachInsightStatusInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { insightId, status } = input;

  // Get the user's profile
  const profile = await context.entities.LifeCoachProfile.findFirst({
    where: { userId: context.user.id }
  });

  if (!profile) {
    throw new HttpError(404, 'Life Coach profile not found');
  }

  // Find the insight and verify ownership
  const insight = await context.entities.LifeCoachInsight.findFirst({
    where: {
      id: insightId,
      profileId: profile.id
    }
  });

  if (!insight) {
    throw new HttpError(404, 'Insight not found');
  }

  try {
    // Update insight status
    const updatedInsight = await context.entities.LifeCoachInsight.update({
      where: { id: insightId },
      data: { status }
    });

    return updatedInsight;
  } catch (error) {
    console.error('Error updating insight status:', error);
    throw new HttpError(500, 'Failed to update insight status');
  }
}; 