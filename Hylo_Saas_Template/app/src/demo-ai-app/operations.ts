import type { Task, GptResponse } from 'wasp/entities';
import type {
  GenerateGptResponse,
  CreateTask,
  DeleteTask,
  UpdateTask,
  GetGptResponses,
  GetAllTasksByUser,
} from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { GeneratedSchedule } from './schedule';
import OpenAI from 'openai';

const openai = setupOpenAI();
function setupOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return new HttpError(500, 'OpenAI API key is not set');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

//#region Actions
type GptPayload = {
  hours: string;
};

export const generateGptResponse: GenerateGptResponse<GptPayload, GeneratedSchedule> = async ({ hours }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const tasks = await context.entities.Task.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
  });

  const parsedTasks = tasks.map(({ description, time }) => ({
    description,
    time,
  }));

  let usedCredits = false; // Flag to track if credits were used for this attempt

  try {
    // check if openai is initialized correctly with the API key
    if (openai instanceof Error) {
      throw openai;
    }

    const hasValidSubscription =
      !!context.user.subscriptionStatus &&
      context.user.subscriptionStatus !== 'deleted' &&
      context.user.subscriptionStatus !== 'past_due';

    // If user has a valid subscription, they can proceed without using credits
    if (hasValidSubscription) {
       console.log('User has valid subscription, proceeding without credit check.');
    } else {
       // No valid subscription, check credits
       if (context.user.credits <= 0) {
           throw new HttpError(402, 'User is out of credits and has no active subscription.');
       } else {
           // Has credits, decrement them
           console.log('User has credits, decrementing.');
           await context.entities.User.update({
               where: { id: context.user.id },
               data: {
                   credits: {
                       decrement: 1,
                   },
               },
           });
           usedCredits = true; // Mark that credits were used
       }
    }

    // --- OpenAI API Call ---
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // you can use any model here, e.g. 'gpt-3.5-turbo', 'gpt-4', etc.
      messages: [
        {
          role: 'system',
          content: `You help people break down their goals into step-by-step action plans.
          Your response should be clear, actionable, and motivational.`,
        },
        {
          role: 'user',
          content: `I will work ${hours} hours today. Here are the tasks I have to complete: ${JSON.stringify(
            parsedTasks
          )}. Please help me plan my day by breaking the tasks down into actionable subtasks with time and priority status.`,
        },
      ],
      functions: [
        {
          name: 'createStepByStepPlan',
          description: 'Create a step-by-step plan to achieve a specified goal',
          parameters: {
            type: 'object',
            properties: {
              mainTasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'The title of the main task',
                    },
                    description: {
                      type: 'string',
                      description: 'A brief description of the main task',
                    },
                    subTasks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: {
                            type: 'string',
                            description: 'The title of the sub-task',
                          },
                          description: {
                            type: 'string',
                            description: 'A brief description of the sub-task',
                          },
                        },
                        required: ['title', 'description'],
                      },
                      description: 'A list of sub-tasks that make up the main task',
                    },
                  },
                  required: ['title', 'description', 'subTasks'],
                },
                description: 'The list of main tasks that make up the step-by-step plan',
              },
            },
            required: ['mainTasks'],
          },
        },
      ],
      function_call: { name: 'createStepByStepPlan' },
    });
    // --- End OpenAI API Call ---

    const gptArgs = completion?.choices[0]?.message?.tool_calls?.[0]?.function.arguments;

    if (!gptArgs) {
      throw new HttpError(500, 'Bad response from OpenAI');
    }

    console.log('gpt function call arguments: ', gptArgs);

    await context.entities.GptResponse.create({
      data: {
        user: { connect: { id: context.user.id } },
        content: JSON.stringify(gptArgs),
      },
    });

    return JSON.parse(gptArgs);

  } catch (error: any) {
    // If an error occurred *after* credits were decremented (and it wasn't a 402 error), increment them back.
    if (usedCredits && error?.statusCode !== 402) {
      console.log('Error occurred after decrementing credits, incrementing back.');
      try {
           await context.entities.User.update({
               where: { id: context.user.id },
               data: {
                   credits: {
                       increment: 1,
                   },
               },
           });
       } catch (incrementError) {
           console.error("Failed to increment credits back after error:", incrementError);
           // Decide how to handle this - maybe log critical error
       }
    }

    console.error("Error in generateGptResponse:", error);
    const statusCode = error.statusCode || 500;
    // Ensure 402 error retains its specific message
    const errorMessage = error.statusCode === 402 ? error.message : (error.message || 'Internal server error');
    throw new HttpError(statusCode, errorMessage);
  }
};

export const createTask: CreateTask<Pick<Task, 'description'>, Task> = async ({ description }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.create({
    data: {
      description,
      user: { connect: { id: context.user.id } },
    },
  });

  return task;
};

export const updateTask: UpdateTask<Partial<Task>, Task> = async ({ id, isDone, time }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.update({
    where: {
      id,
    },
    data: {
      isDone,
      time,
    },
  });

  return task;
};

export const deleteTask: DeleteTask<Pick<Task, 'id'>, Task> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await context.entities.Task.delete({
    where: {
      id,
    },
  });

  return task;
};
//#endregion

//#region Queries
export const getGptResponses: GetGptResponses<void, GptResponse[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.GptResponse.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
  });
};

export const getAllTasksByUser: GetAllTasksByUser<void, Task[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Task.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
//#endregion
