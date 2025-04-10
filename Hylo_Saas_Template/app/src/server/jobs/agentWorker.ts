import { prisma } from 'wasp/server';
import { OpenAI } from 'openai';
import { HttpError } from 'wasp/server';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function processAgentSubTask(args: { subtaskId: string }): Promise<void> {
  const { subtaskId } = args;

  // Get the subtask
  const subtask = await prisma.agentSubTask.findUnique({
    where: { id: subtaskId },
    include: { task: true }
  });

  if (!subtask) {
    throw new HttpError(404, `Subtask ${subtaskId} not found`);
  }

  // Skip if already processed
  if (subtask.status !== 'pending') {
    return;
  }

  try {
    // Update status to processing
    await prisma.agentSubTask.update({
      where: { id: subtaskId },
      data: { status: 'processing' }
    });

    // Execute the tool
    const toolResponse = await executeTool(subtask.tool, subtask.toolInput);

    // Update subtask with result
    await prisma.agentSubTask.update({
      where: { id: subtaskId },
      data: {
        status: 'completed',
        toolOutput: JSON.stringify(toolResponse)
      }
    });

    // Check if all subtasks are completed
    const remainingSubtasks = await prisma.agentSubTask.count({
      where: {
        taskId: subtask.taskId,
        status: { not: 'completed' }
      }
    });

    if (remainingSubtasks === 0) {
      // All subtasks completed, update main task
      await prisma.agentTask.update({
        where: { id: subtask.taskId },
        data: { status: 'completed' }
      });
    }
  } catch (error) {
    logger.error(`Error processing subtask ${subtaskId}:`, error);

    // Update subtask with error
    await prisma.agentSubTask.update({
      where: { id: subtaskId },
      data: {
        status: 'error',
        toolOutput: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    // Update main task status
    await prisma.agentTask.update({
      where: { id: subtask.taskId },
      data: { status: 'error' }
    });

    throw error;
  }
}

async function executeTool(tool: string, toolInput: any): Promise<any> {
  logger.info(`Executing tool: ${tool} with input: ${toolInput}`);
  
  // Parse input if it's a JSON string
  let parsedInput: any;
  try {
    parsedInput = typeof toolInput === 'string' ? JSON.parse(toolInput) : toolInput;
  } catch (error) {
    parsedInput = toolInput; // Keep as string if not valid JSON
  }

  // Simplified tool execution - only Search tool is active
  switch (tool.toLowerCase()) {
    case 'search':
      return await executeSearchTool(parsedInput);
    default:
      // For any other tool, return a message that only search is available
      return {
        status: "limited_functionality",
        message: "Currently, only the Search tool is enabled. Other tools will be available in future updates.",
        results: []
      };
  }
}

// Only implement the Search tool, comment out others
async function executeSearchTool(input: string | { query: string }): Promise<any> {
  const query = typeof input === 'string' ? input : input.query;
  
  try {
    // Use the OpenAI API to simulate search results
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a research assistant. Based on the search query, provide detailed information in JSON format. Include sources where possible. Structure your response as an array of research findings with title, content, and source fields."
        },
        {
          role: "user",
          content: `Research query: ${query}`
        }
      ]
    });
    
    // Parse the response to ensure it's valid JSON
    const content = response.choices[0].message.content;
    try {
      return JSON.parse(content || '{"results": []}');
    } catch (e) {
      // Return formatted response if not valid JSON
      return {
        results: [
          {
            title: "Research Results",
            content: content,
            source: "AI Research Assistant"
          }
        ]
      };
    }
  } catch (error) {
    logger.error("Error executing search tool:", error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/* 
// Other tools commented out to simplify implementation
async function executeBrowserTool(input: string | { url: string }): Promise<any> {
  // Commented out
}

async function executeDocsTool(input: string | { topic: string }): Promise<any> {
  // Commented out
}

async function executeWebhookTool(input: string | { url: string; method?: string; body?: any; headers?: Record<string, string> }): Promise<any> {
  // Commented out
}

async function executeFileWriterTool(input: string | { content: string; filename: string; path?: string }): Promise<any> {
  // Commented out
}
*/