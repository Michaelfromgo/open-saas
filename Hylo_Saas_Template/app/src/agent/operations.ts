import { HttpError } from 'wasp/server';
import { prisma } from 'wasp/server';
import { OpenAI } from 'openai';
import { logger } from '../server/utils/logger';
import { createCrew } from '../server/agent/crewAI';

// Add tracing log for debugging
logger.info("====== AGENT OPERATIONS MODULE LOADED ======");

// Define types directly to avoid import errors
type AgentTask = {
  id: string;
  goalText: string;
  status: string;
  userId: string;
  subtasks: AgentSubTask[];
  finalOutput?: string | null;
  errorMessage?: string | null;
};

type AgentSubTask = {
  id: string;
  taskId: string;
  tool: string;
  toolInput: any;
  status: string;
  toolOutput?: any;
  agentThought?: string | null;
  stepNumber: number;
};

type EnabledTools = {
  id: string;
  userId: string;
  toolName: string;
  enabled: boolean;
};

// Define type for the various operations
type CreateAgentTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type GetAgentTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type GetAgentTasks<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type UpdateAgentTaskStatus<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type UpdateAgentSubTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type GetEnabledTools<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type UpdateEnabledTools<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type StopAgentTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Agent roles and their prompts
const AGENT_ROLES = {
  planner: {
    system: "You are a planning agent specialized in breaking down research goals into specific search subtasks. For each goal, create a plan with 2-4 search queries that together will provide comprehensive information to achieve the goal. Return your plan as a JSON array where each item has 'tool' (which should be 'Search'), 'input' (the specific search query), and 'thought' (why this search is needed).",
    user: (goal: string) => goal
  },
  executor: {
    system: "You are a research agent that executes search queries to find relevant information.",
    user: (subtask: string) => subtask
  },
  reviewer: {
    system: "You are a review agent. Review the research results and provide a summary.",
    user: (results: string) => results
  }
};

export const createAgentTask: CreateAgentTask<{ goalText: string }, AgentTask> = async ({ goalText }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  try {
    logger.info(`Creating agent task for user ${context.user.id} with goal: ${goalText}`);
    
    // Create main task
    const task = await prisma.agentTask.create({
      data: {
        goalText,
        status: 'planning',
        userId: context.user.id
      }
    });

    // Initialize default tools if not already set up
    const existingTools = await prisma.enabledTools.findMany({
      where: { userId: context.user.id }
    });

    if (existingTools.length === 0) {
      // Enable both Search and SerperSearch tools by default
      await prisma.enabledTools.create({
        data: {
          toolName: 'Search',
          enabled: true,
          userId: context.user.id
        }
      });
      
      await prisma.enabledTools.create({
        data: {
          toolName: 'SerperSearch',
          enabled: true,
          userId: context.user.id
        }
      });
    }

    // Run CrewAI instead of the original agent logic
    try {
      logger.info(`Using CrewAI for task ${task.id} with goal: ${goalText}`);
      
      const crew = createCrew({
        name: "Task Crew",
        description: "Processing agent task",
        userId: context.user.id,
        goalText,
        apiKey: process.env.OPENAI_API_KEY || ''
      });
      
      logger.info(`Crew created with ID ${crew.id} for task ${task.id}`);
      
      // Create initial subtasks based on default plan to show in UI
      const defaultTasks = [
        {
          step: 1,
          tool: 'CrewAI-Research',
          thought: 'Collecting information about the topic',
          input: goalText,
          status: 'pending'
        },
        {
          step: 2,
          tool: 'CrewAI-Analysis',
          thought: 'Analyzing collected information',
          input: 'Analysis based on research',
          status: 'pending'
        },
        {
          step: 3,
          tool: 'CrewAI-Writer',
          thought: 'Synthesizing and structuring the analysis',
          input: 'Creating coherent content from analysis',
          status: 'pending'
        },
        {
          step: 4,
          tool: 'CrewAI-Execution',
          thought: 'Creating implementation plan',
          input: 'Implementation based on analysis',
          status: 'pending'
        }
      ];
      
      // Create the subtasks to display in UI
      const subtasks = await Promise.all(
        defaultTasks.map(async (t) => {
          return await prisma.agentSubTask.create({
            data: {
              taskId: task.id,
              stepNumber: t.step,
              tool: t.tool,
              toolInput: { query: t.input },
              status: t.status,
              agentThought: t.thought
            }
          });
        })
      );
      
      // Queue background job to execute the task
      const firstSubtask = subtasks.find(s => s.stepNumber === 1);
      if (firstSubtask) {
        logger.info(`Processing first subtask ${firstSubtask.id} directly`);
        try {
          // Update the task status to executing
          await prisma.agentTask.update({
            where: { id: task.id },
            data: { 
              status: 'executing' 
            }
          });
          
          // Actually perform the search for the first subtask instead of simulating
          if (firstSubtask.tool === 'CrewAI-Research') {
            logger.info(`Performing actual search for task with goal: ${goalText}`);
            
            // Create a search query from the goal text
            const toolInput = firstSubtask.toolInput as { query?: string } || {};
            const searchQuery = typeof toolInput.query === 'string' ? toolInput.query : goalText;
            
            // Import the search function directly
            const { default: axios } = await import('axios');
            const SERPER_API_KEY = process.env.SERPER_API_KEY;
            const SERPER_SEARCH_URL = 'https://google.serper.dev/search';
            
            if (!SERPER_API_KEY) {
              logger.warn("Serper API key not found, using OpenAI as fallback");
              
              // Use OpenAI as fallback
              const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
              });
              
              const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                  {
                    role: "system",
                    content: "You are a research specialist. Research the topic thoroughly and provide comprehensive information. Structure your response as a detailed research document with clear sections."
                  },
                  {
                    role: "user",
                    content: `Research task: ${searchQuery}`
                  }
                ]
              });
              
              await prisma.agentSubTask.update({
                where: { id: firstSubtask.id },
                data: { 
                  status: 'completed',
                  toolOutput: JSON.stringify({
                    result: response.choices[0].message.content,
                    source: "AI Research (OpenAI)"
                  })
                }
              });
            } else {
              // Use Serper for search
              try {
                logger.info(`Executing Serper search for: "${searchQuery}"`);
                
                const response = await axios.post(SERPER_SEARCH_URL, { q: searchQuery }, {
                  headers: {
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                  }
                });
                
                // Process results
                const serperResults = response.data;
                const formattedResults = {
                  query: searchQuery,
                  results: []
                };
                
                // Process organic results
                if (serperResults.organic && serperResults.organic.length > 0) {
                  const limitedResults = serperResults.organic.slice(0, 5);
                  
                  formattedResults.results = limitedResults.map((item: any) => ({
                    title: item.title || 'Untitled',
                    link: item.link || '#',
                    snippet: item.snippet || 'No description available',
                    source: 'Serper Search'
                  }));
                }
                
                // Extract useful information from search results
                let researchResults = "# Research Findings\n\n";
                
                // Type assertion for the results array
                const typedResults = formattedResults.results as Array<{
                  title: string;
                  link: string;
                  snippet: string;
                  source: string;
                }>;
                
                typedResults.forEach((result, index) => {
                  researchResults += `## Source ${index + 1}: ${result.title}\n`;
                  researchResults += `${result.snippet}\n\n`;
                  researchResults += `URL: ${result.link}\n\n`;
                });
                
                // Add the answer box if available
                if (serperResults.answerBox) {
                  researchResults += `## Key Information\n`;
                  researchResults += `${serperResults.answerBox.answer || serperResults.answerBox.snippet}\n\n`;
                  if (serperResults.answerBox.title) {
                    researchResults += `Source: ${serperResults.answerBox.title}\n\n`;
                  }
                }
                
                // Update the subtask with the real search results
                await prisma.agentSubTask.update({
                  where: { id: firstSubtask.id },
                  data: { 
                    status: 'completed',
                    toolOutput: JSON.stringify({
                      result: researchResults,
                      raw: formattedResults,
                      source: "Serper Search"
                    })
                  }
                });
                
                logger.info(`Serper search completed with ${formattedResults.results.length} results`);
              } catch (error) {
                logger.error(`Error executing Serper search: ${error}`);
                
                // If Serper fails, fall back to OpenAI
                const openai = new OpenAI({
                  apiKey: process.env.OPENAI_API_KEY
                });
                
                const response = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    {
                      role: "system",
                      content: "You are a research specialist. Research the topic thoroughly and provide comprehensive information. Structure your response as a detailed research document with clear sections."
                    },
                    {
                      role: "user",
                      content: `Research task: ${searchQuery}`
                    }
                  ]
                });
                
                await prisma.agentSubTask.update({
                  where: { id: firstSubtask.id },
                  data: { 
                    status: 'completed',
                    toolOutput: JSON.stringify({
                      result: response.choices[0].message.content,
                      source: "AI Research (OpenAI) - Serper Search Failed"
                    })
                  }
                });
              }
            }
          } else {
            // For non-research tools, just mark as completed
            await prisma.agentSubTask.update({
              where: { id: firstSubtask.id },
              data: { 
                status: 'completed',
                toolOutput: JSON.stringify({
                  result: `Initial processing of task with goal: ${goalText}`,
                  source: "AI Agent"
                })
              }
            });
          }
          
          logger.info(`Task status updated to executing. The scheduled job will pick up and process the remaining subtasks.`);
        } catch (error) {
          logger.error(`Failed to update subtask ${firstSubtask.id}: ${error}`);
          throw error;
        }
      }
      
      // Return the task with subtasks
      return {
        ...task,
        subtasks
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      logger.error(`Error in CrewAI setup: ${errorMessage}`);
      
      await prisma.agentTask.update({
        where: { id: task.id },
        data: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      
      throw error;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
    logger.error(`Error creating agent task: ${errorMessage}`);
    throw error;
  }
};

export const getAgentTask: GetAgentTask<{ taskId: string }, AgentTask | null> = async ({ taskId }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
    include: { subtasks: true }
  });

  if (!task) {
    return null;
  }

  if (task.userId !== context.user.id) {
    throw new HttpError(403, "Not authorized to access this task");
  }

  return task;
};

export const getAgentTasks: GetAgentTasks<void, AgentTask[]> = async (_, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const tasks = await prisma.agentTask.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' }
  });

  // Map tasks to include empty subtasks array
  return tasks.map(task => ({
    ...task,
    subtasks: []
  })) as AgentTask[];
};

export const updateAgentTaskStatus: UpdateAgentTaskStatus<
  {
    taskId: string;
    status: string;
    finalOutput?: string;
    errorMessage?: string;
  },
  AgentTask
> = async ({ taskId, status, finalOutput, errorMessage }, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const task = await prisma.agentTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new HttpError(404, 'Task not found');
    }

    if (task.userId !== context.user.id) {
      throw new HttpError(403, 'Forbidden');
    }

    const updatedTask = await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status,
        finalOutput: finalOutput || task.finalOutput,
        errorMessage: errorMessage || task.errorMessage,
      },
      include: {
        subtasks: true,
      },
    });

    return updatedTask;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
    logger.error(`Error updating task status: ${errorMessage}`);
    throw error; 
  }
};

export const updateAgentSubTask: UpdateAgentSubTask<
  {
    id: string;
    status: string;
    toolOutput?: any;
  },
  AgentSubTask
> = async ({ id, status, toolOutput }, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const subtask = await prisma.agentSubTask.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!subtask) {
      throw new HttpError(404, 'Subtask not found');
    }

    if (subtask.task.userId !== context.user.id) {
      throw new HttpError(403, 'Forbidden');
    }

    // Update the subtask
    return await prisma.agentSubTask.update({
      where: { id },
      data: {
        status,
        toolOutput: toolOutput !== undefined ? toolOutput : subtask.toolOutput,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
    logger.error(`Error updating subtask: ${errorMessage}`);
    throw error;
  }
};

export const getEnabledTools: GetEnabledTools<void, EnabledTools[]> = async (_, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return await prisma.enabledTools.findMany({
    where: { userId: context.user.id }
  });
};

export const updateEnabledTools: UpdateEnabledTools<{ toolName: string; enabled: boolean }, EnabledTools> = async ({ toolName, enabled }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return await prisma.enabledTools.upsert({
    where: {
      userId_toolName: {
        userId: context.user.id,
        toolName
      }
    },
    update: { enabled },
    create: {
      toolName,
      enabled,
      userId: context.user.id
    }
  });
};

export const stopAgentTask: StopAgentTask<{ taskId: string }, { success: boolean }> = async ({ taskId }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
    include: { subtasks: true }
  });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  if (task.userId !== context.user.id) {
    throw new HttpError(403, "Not authorized to stop this task");
  }

  // Check if the task is running
  if (task.status !== 'planning' && task.status !== 'executing') {
    return { success: false }; // Task is not running
  }

  logger.info(`User ${context.user.id} is stopping task ${taskId}`);

  // Update any in-progress or pending subtasks to stopped
  await prisma.agentSubTask.updateMany({
    where: {
      taskId: task.id,
      status: { in: ['pending', 'in_progress'] }
    },
    data: { status: 'stopped' }
  });

  // Update the main task
  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: 'stopped',
      finalOutput: "Task was manually stopped by the user"
    }
  });

  logger.info(`Task ${taskId} has been stopped by user ${context.user.id}`);
  return { success: true };
}; 