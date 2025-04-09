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
  leftoverFor?: string; // Indicates if this meal generates leftovers for another meal
  isLeftoverFrom?: string; // Indicates if this meal uses leftovers from another meal
};

export type MealPlanData = {
  days: Day[];
};

// JSON Schema for OpenAI function calling
const mealPlanSchema = {
  type: 'object',
  properties: {
    days: {
      type: 'array',
      description: 'The 7 days of the meal plan',
      items: {
        type: 'object',
        properties: {
          day: {
            type: 'string',
            description: 'Day of the week (Monday, Tuesday, etc.)'
          },
          meals: {
            type: 'array',
            description: 'Meals for this day',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Name of the meal'
                },
                ingredients: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'List of ingredients with quantities'
                },
                instructions: {
                  type: 'string',
                  description: 'Step-by-step cooking instructions'
                },
                macros: {
                  type: 'object',
                  properties: {
                    calories: {
                      type: 'number',
                      description: 'Calories in kcal'
                    },
                    protein: {
                      type: 'number',
                      description: 'Protein in grams'
                    },
                    carbs: {
                      type: 'number',
                      description: 'Carbs in grams'
                    },
                    fat: {
                      type: 'number',
                      description: 'Fat in grams'
                    }
                  },
                  required: ['calories', 'protein', 'carbs', 'fat']
                },
                leftoverFor: {
                  type: 'string',
                  description: 'Which meal this will create leftovers for (e.g., "Tuesday Lunch")',
                  optional: true
                },
                isLeftoverFrom: {
                  type: 'string',
                  description: 'Which meal this uses leftovers from (e.g., "Monday Dinner")',
                  optional: true
                }
              },
              required: ['title', 'ingredients', 'instructions', 'macros']
            }
          }
        },
        required: ['day', 'meals']
      }
    }
  },
  required: ['days']
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
    useLeftovers?: boolean;
    repeatBreakfast?: boolean;
    breakfastOptions?: number;
    measurementSystem?: string;
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

  // Apply defaults to new preferences
  const processedPreferences = {
    ...preferences,
    useLeftovers: preferences.useLeftovers ?? true,
    repeatBreakfast: preferences.repeatBreakfast ?? true,
    breakfastOptions: preferences.breakfastOptions ?? 2,
    measurementSystem: preferences.measurementSystem ?? 'us',
  };

  // Save or update user preferences
  const userMealPreferences = await context.entities.UserMealPreferences.upsert({
    where: {
      userId: context.user.id,
    },
    update: {
      calorieTarget: processedPreferences.calorieTarget,
      mealsPerDay: processedPreferences.mealsPerDay,
      dietType: processedPreferences.dietType,
      allergies: processedPreferences.allergies,
      cuisines: processedPreferences.cuisines,
      prepTime: processedPreferences.prepTime,
      useLeftovers: processedPreferences.useLeftovers,
      repeatBreakfast: processedPreferences.repeatBreakfast,
      breakfastOptions: processedPreferences.breakfastOptions,
      measurementSystem: processedPreferences.measurementSystem,
    },
    create: {
      userId: context.user.id,
      calorieTarget: processedPreferences.calorieTarget,
      mealsPerDay: processedPreferences.mealsPerDay,
      dietType: processedPreferences.dietType,
      allergies: processedPreferences.allergies,
      cuisines: processedPreferences.cuisines,
      prepTime: processedPreferences.prepTime,
      useLeftovers: processedPreferences.useLeftovers,
      repeatBreakfast: processedPreferences.repeatBreakfast,
      breakfastOptions: processedPreferences.breakfastOptions,
      measurementSystem: processedPreferences.measurementSystem,
    },
  });

  // Calculate calories per meal
  const caloriesPerMeal = Math.floor(processedPreferences.calorieTarget / processedPreferences.mealsPerDay);

  // Check if user has enough credits
  if (context.user.credits <= 0) {
    throw new HttpError(402, 'Not enough credits to generate a meal plan');
  }

  try {
    // Generate meal plan using AI
    const prompt = generateMealPlanPrompt(processedPreferences, caloriesPerMeal);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional nutritionist and meal planner. Create a personalized 7-day meal plan based on the user's preferences.
          Your task is to generate a complete meal plan with the number of meals per day specified, with detailed recipes including ingredients, instructions, and macronutrient information.
          If requested, make use of leftovers in creative ways to reduce cooking time and food waste.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      functions: [
        {
          name: 'createMealPlan',
          description: 'Create a detailed meal plan for 7 days',
          parameters: mealPlanSchema
        }
      ],
      function_call: { name: 'createMealPlan' },
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
      // When using function calling, we need to extract the content from the function call result
      if (response.choices[0].message.function_call) {
        const functionCallArgs = response.choices[0].message.function_call.arguments;
        mealPlanData = JSON.parse(functionCallArgs);
      } else {
        // Fallback to parsing from content (legacy method)
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonStringRaw = jsonMatch ? jsonMatch[1].trim() : content;
        
        // Clean the JSON string by removing any comments and ensuring it's valid JSON
        const jsonString = jsonStringRaw
          .replace(/\/\/.*$/gm, '') // Remove single line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
          .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        
        mealPlanData = JSON.parse(jsonString);
      }
      
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
    useLeftovers: boolean;
    repeatBreakfast: boolean;
    breakfastOptions: number;
    measurementSystem: string;
  },
  caloriesPerMeal: number
): string {
  const { dietType, allergies, cuisines, prepTime, useLeftovers, repeatBreakfast, breakfastOptions, measurementSystem } = preferences;
  
  const dietTypeStr = dietType.length > 0 ? dietType.join(', ') : 'No specific diet';
  const allergiesStr = allergies.length > 0 ? allergies.join(', ') : 'No allergies';
  const cuisinesStr = cuisines.length > 0 ? cuisines.join(', ') : 'Any cuisine';
  const measurementUnit = measurementSystem === 'us' ? 'US units (oz, lb, cups)' : 'Metric units (g, kg, ml)';
  
  // Construct the meal plan prompt with practical considerations
  return `Generate a practical 7-day meal plan based on the following preferences:
- Target calories per day: ${preferences.calorieTarget} kcal
- Meals per day: ${preferences.mealsPerDay} (approximately ${caloriesPerMeal} kcal per meal)
- Diet type: ${dietTypeStr}
- Allergies to avoid: ${allergiesStr}
- Preferred cuisines: ${cuisinesStr}
- Maximum preparation time: ${prepTime}
- Measurement system: ${measurementUnit}
- Use leftovers: ${useLeftovers ? 'Yes' : 'No'}
- Repeat breakfast options: ${repeatBreakfast ? 'Yes, with ' + breakfastOptions + ' different options' : 'No'}

${useLeftovers ? `
Please incorporate leftovers into the meal plan by:
1. Planning some dinners with enough portions for the next day's lunch
2. Indicating in the meal which meal the leftovers will be used for
3. Making sure the recipe quantities are sufficient for multiple servings
` : ''}

${repeatBreakfast ? `
Please create ${breakfastOptions} breakfast options that repeat throughout the week (e.g., if ${breakfastOptions} = 2, create 2 different breakfast recipes and alternate them).
` : ''}

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
          },
          "leftoverFor": "Tuesday Lunch",
          "isLeftoverFrom": "Monday Dinner"
        }
      ]
    }
  ]
}

IMPORTANT: Return VALID JSON only. Do not include any comments, trailing commas, or non-JSON syntax in your response.

Special instructions:
1. For each day, provide exactly ${preferences.mealsPerDay} meals.
2. Ensure the total calories for each day are approximately ${preferences.calorieTarget} kcal.
3. Keep preparation time for all meals within ${prepTime}.
4. Provide accurate macronutrient information (protein, carbs, fat) for each meal.
5. Use ${measurementUnit} for all ingredients.
6. Make the meal plan varied and interesting throughout the week.
7. Include the "leftoverFor" field only when a meal is intended to generate leftovers.
8. Include the "isLeftoverFrom" field only when a meal uses leftovers from another meal.
9. If using leftovers, ensure recipe quantities are appropriate for multiple servings.`;
} 