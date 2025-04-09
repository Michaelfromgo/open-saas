import type { UserMealPreferences, MealPlan } from 'wasp/entities';
import type {
  GenerateMealPlan,
  GetUserMealPreferences,
  GetLatestMealPlan,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import OpenAI from 'openai';

// OpenAI setup
const openai = setupOpenAI();
function setupOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is not set');
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Types for meal plan data
export type Day = {
  day: string;
  meals: Meal[];
};

export type Meal = {
  title: string;
  ingredients: string[];
  instructions: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

export type MealPlanData = {
  days: Day[];
};

// Operations
export const generateMealPlan: GenerateMealPlan<
  {
    calorieTarget: number;
    mealsPerDay: number;
    dietType: string[];
    allergies: string[];
    cuisines: string[];
    prepTime: string;
  },
  MealPlan
> = async (preferences, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Check for OpenAI API key
  if (!openai) {
    throw new HttpError(500, 'OpenAI API is not configured');
  }

  // Save or update user preferences
  const userMealPreferences = await context.entities.UserMealPreferences.upsert({
    where: {
      userId: context.user.id,
    },
    update: {
      calorieTarget: preferences.calorieTarget,
      mealsPerDay: preferences.mealsPerDay,
      dietType: preferences.dietType,
      allergies: preferences.allergies,
      cuisines: preferences.cuisines,
      prepTime: preferences.prepTime,
    },
    create: {
      userId: context.user.id,
      calorieTarget: preferences.calorieTarget,
      mealsPerDay: preferences.mealsPerDay,
      dietType: preferences.dietType,
      allergies: preferences.allergies,
      cuisines: preferences.cuisines,
      prepTime: preferences.prepTime,
    },
  });

  // Calculate calories per meal
  const caloriesPerMeal = Math.floor(preferences.calorieTarget / preferences.mealsPerDay);

  // Check if user has enough credits
  if (context.user.credits <= 0) {
    throw new HttpError(402, 'Not enough credits to generate a meal plan');
  }

  try {
    // Generate meal plan using AI
    const prompt = generateMealPlanPrompt(preferences, caloriesPerMeal);
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a meal planning assistant that creates personalized meal plans.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    // Deduct one credit from the user
    await context.entities.User.update({
      where: { id: context.user.id },
      data: { credits: { decrement: 1 } },
    });

    // Parse the AI response
    const content = response.choices[0].message.content || '';
    let mealPlanData: MealPlanData;
    
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json([\s\S]*?)```/) || content.match(/```([\s\S]*?)```/);
      const jsonStringRaw = jsonMatch ? jsonMatch[1].trim() : content;
      
      // Clean the JSON string by removing any comments and ensuring it's valid JSON
      const jsonString = jsonStringRaw
        .replace(/\/\/.*$/gm, '') // Remove single line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      
      mealPlanData = JSON.parse(jsonString);
      
      // Validate the structure of the meal plan data
      if (!mealPlanData.days || !Array.isArray(mealPlanData.days)) {
        throw new Error('Invalid meal plan data structure');
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new HttpError(500, 'Failed to parse AI response');
    }

    // Save the meal plan to the database
    const mealPlan = await context.entities.MealPlan.create({
      data: {
        userId: context.user.id,
        planData: mealPlanData,
      },
    });

    return mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new HttpError(500, 'Failed to generate meal plan');
  }
};

export const getUserMealPreferences: GetUserMealPreferences<void, UserMealPreferences | null> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.UserMealPreferences.findUnique({
    where: {
      userId: context.user.id,
    },
  });
};

export const getLatestMealPlan: GetLatestMealPlan<void, MealPlan | null> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.MealPlan.findFirst({
    where: {
      userId: context.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Helper function to generate the prompt for the AI
function generateMealPlanPrompt(
  preferences: {
    calorieTarget: number;
    mealsPerDay: number;
    dietType: string[];
    allergies: string[];
    cuisines: string[];
    prepTime: string;
  },
  caloriesPerMeal: number
): string {
  const { dietType, allergies, cuisines, prepTime } = preferences;
  
  const dietTypeStr = dietType.length > 0 ? dietType.join(', ') : 'No specific diet';
  const allergiesStr = allergies.length > 0 ? allergies.join(', ') : 'No allergies';
  const cuisinesStr = cuisines.length > 0 ? cuisines.join(', ') : 'Any cuisine';
  
  return `Generate a 7-day meal plan based on the following preferences:
- Target calories per day: ${preferences.calorieTarget} kcal
- Meals per day: ${preferences.mealsPerDay} (approximately ${caloriesPerMeal} kcal per meal)
- Diet type: ${dietTypeStr}
- Allergies to avoid: ${allergiesStr}
- Preferred cuisines: ${cuisinesStr}
- Maximum preparation time: ${prepTime}

The response should be a JSON object matching this structure exactly:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "title": "Meal Name",
          "ingredients": ["Ingredient 1", "Ingredient 2"],
          "instructions": "Step-by-step cooking instructions",
          "macros": {
            "calories": 300,
            "protein": 20,
            "carbs": 30,
            "fat": 10
          }
        }
      ]
    }
  ]
}

IMPORTANT: Return VALID JSON only. Do not include any comments, trailing commas, or non-JSON syntax in your response.

For each day, provide exactly ${preferences.mealsPerDay} meals.
Ensure the total calories for each day are approximately ${preferences.calorieTarget} kcal.
Keep preparation time for all meals within ${prepTime}.
Provide accurate macronutrient information (protein, carbs, fat) for each meal.
Make the meal plan varied and interesting throughout the week.`;
} 