import { HttpError } from 'wasp/server';
import { prisma } from 'wasp/server';
import { OpenAI } from 'openai';
import { logger } from '../server/utils/logger';
import { createCrew } from '../server/agent/crewAI';

// Add tracing log for debugging
logger.info("====== AGENT OPERATIONS MODULE LOADED ======");

// Define the operation types
type CreateAgentTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type GetAgentTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type GetAgentTasks<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type UpdateAgentTaskStatus<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type UpdateAgentSubTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type GetEnabledTools<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type UpdateEnabledTools<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;
type StopAgentTask<TArgs, TResult> = (args: TArgs, context: any) => Promise<TResult>;

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

// Dummy service to replace the imported one
const processAgentSubTask = {
  submit: async ({ subtaskId }: { subtaskId: string }) => {
    console.log(`Submitting subtask for processing: ${subtaskId}`);
    // In a real implementation, this would queue the job
    return Promise.resolve();
  }
};

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
    // Only enable the Search tool by default
    await prisma.enabledTools.create({
      data: {
        toolName: 'Search',
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
        tool: 'CrewAI-Execution',
        thought: 'Creating implementation plan',
        input: 'Implementation based on analysis',
        status: 'pending'
      }
    ];
    
    // Create subtasks in DB to show progress
    for (let index = 0; index < defaultTasks.length; index++) {
      const subtask = defaultTasks[index];
      await prisma.agentSubTask.create({
        data: {
          taskId: task.id,
          tool: subtask.tool,
          toolInput: subtask.input,
          status: 'pending',
          agentThought: subtask.thought,
          stepNumber: subtask.step
        }
      });
    }
    
    // Run the crew asynchronously
    (async () => {
      try {
        // Update first subtask to in_progress
        await prisma.agentSubTask.updateMany({
          where: { 
            taskId: task.id,
            stepNumber: 1
          },
          data: { status: 'in_progress' }
        });
        
        // Execute the crew
        const crewResult = await crew.run();
        
        // Update all subtasks based on crew tasks
        const crewTasks = crew.getTasks();
        for (let i = 0; i < crewTasks.length; i++) {
          const crewTask = crewTasks[i];
          // Find the corresponding subtask and update it
          await prisma.agentSubTask.updateMany({
            where: {
              taskId: task.id,
              stepNumber: i + 1
            },
            data: {
              status: crewTask.status === 'completed' ? 'completed' : 'failed',
              toolOutput: crewTask.result || 'No output available'
            }
          });
        }
        
        // Update the main task with the final result
        await prisma.agentTask.update({
          where: { id: task.id },
          data: {
            status: 'completed',
            finalOutput: crewResult.result
          }
        });
        
        logger.info(`CrewAI completed task ${task.id} successfully`);
      } catch (error) {
        logger.error(`Error in CrewAI execution for task ${task.id}: ${error.stack || error.message || error}`);
        
        // Update the task status to failed
        await prisma.agentTask.update({
          where: { id: task.id },
          data: {
            status: 'error',
            errorMessage: `Error: ${error.message}`
          }
        });
        
        // Update all pending subtasks to failed
        await prisma.agentSubTask.updateMany({
          where: {
            taskId: task.id,
            status: 'pending'
          },
          data: { status: 'failed' }
        });
      }
    })();
    
    // Return the initial task (subtasks will be updated asynchronously)
    return {
      ...task,
      subtasks: [] // Initially empty, will be populated when client fetches again
    } as AgentTask;
  } catch (error) {
    logger.error(`Error setting up CrewAI for task ${task.id}: ${error.stack || error.message || error}`);
    
    // Fall back to original implementation with basic subtasks
    const subtasks = [
      {
        input: goalText,
        thought: 'General search for information about the topic'
      },
      {
        input: `${goalText} latest research`,
        thought: 'Finding the most recent information on the topic'
      }
    ];

    for (let index = 0; index < subtasks.length; index++) {
      const subtask = subtasks[index];
      // Ensure all subtasks are using the Search tool
      const toolName = 'Search';
      const createdSubtask = await prisma.agentSubTask.create({
        data: {
          taskId: task.id,
          tool: toolName,
          toolInput: subtask.input || goalText,
          status: 'pending',
          agentThought: subtask.thought || `Research: ${subtask.input || goalText}`,
          stepNumber: index + 1
        }
      });

      // Queue the subtask for processing
      await processAgentSubTask.submit({ subtaskId: createdSubtask.id });
    }

    // Update task status
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: 'executing' }
    });
  }

  // At the end, return the task with subtasks
  return {
    ...task,
    subtasks: [] // Initially empty, will be populated later
  } as AgentTask;
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

export const updateAgentTaskStatus: UpdateAgentTaskStatus<{ taskId: string; status: string }, AgentTask> = async ({ taskId, status }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const task = await prisma.agentTask.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  if (task.userId !== context.user.id) {
    throw new HttpError(403, "Not authorized to update this task");
  }

  const updatedTask = await prisma.agentTask.update({
    where: { id: taskId },
    data: { status }
  });

  // Return with subtasks field
  return {
    ...updatedTask,
    subtasks: []
  } as AgentTask;
};

export const updateAgentSubTask: UpdateAgentSubTask<{ subtaskId: string; status: string; output: string | null }, AgentSubTask> = async ({ subtaskId, status, output }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const subtask = await prisma.agentSubTask.findUnique({
    where: { id: subtaskId },
    include: { task: true }
  });

  if (!subtask) {
    throw new HttpError(404, "Subtask not found");
  }

  if (subtask.task.userId !== context.user.id) {
    throw new HttpError(403, "Not authorized to update this subtask");
  }

  // Handle the JSON value properly
  const outputValue = output ? JSON.parse(output) : undefined;

  return await prisma.agentSubTask.update({
    where: { id: subtaskId },
    data: { 
      status, 
      toolOutput: outputValue
    }
  });
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