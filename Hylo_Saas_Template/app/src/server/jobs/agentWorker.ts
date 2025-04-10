import { prisma } from 'wasp/server';
import { OpenAI } from 'openai';
import { HttpError } from 'wasp/server';
import { logger } from '../utils/logger';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Serper API configuration
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_SEARCH_URL = 'https://google.serper.dev/search';

// This job processes a subtask
export async function processAgentSubTask(): Promise<void> {
  logger.info(`Processing agent subtasks job started`);
  
  // Find all subtasks that are in "pending" status
  const pendingSubtasks = await prisma.agentSubTask.findMany({
    where: { 
      status: 'pending'
    },
    include: { task: true },
    orderBy: { 
      createdAt: 'asc'  // Process oldest subtasks first
    },
    take: 5  // Process up to 5 subtasks per job run to avoid overload
  });
  
  logger.info(`Found ${pendingSubtasks.length} pending subtasks`);
  
  // If no pending subtasks, job is done
  if (pendingSubtasks.length === 0) {
    return;
  }
  
  // Process each pending subtask
  for (const subtask of pendingSubtasks) {
    logger.info(`Processing subtask ${subtask.id} for task ${subtask.taskId}`);
    
    try {
      // Update status to processing
      await prisma.agentSubTask.update({
        where: { id: subtask.id },
        data: { status: 'processing' }
      });

      // Get previous subtasks to build context
      const previousSubtasks = await prisma.agentSubTask.findMany({
        where: {
          taskId: subtask.taskId,
          stepNumber: { lt: subtask.stepNumber },
          status: 'completed'
        },
        orderBy: { stepNumber: 'asc' }
      });

      // Build context from previous subtasks
      let context = "";
      if (previousSubtasks.length > 0) {
        context = "# Previous results\n\n";
        for (const prevSubtask of previousSubtasks) {
          let output = "";
          try {
            if (typeof prevSubtask.toolOutput === 'string') {
              const parsed = JSON.parse(prevSubtask.toolOutput);
              output = parsed.result || JSON.stringify(parsed);
            } else if (prevSubtask.toolOutput) {
              output = JSON.stringify(prevSubtask.toolOutput);
            }
          } catch (e) {
            output = String(prevSubtask.toolOutput || "");
          }
          
          context += `## ${prevSubtask.tool} output (Step ${prevSubtask.stepNumber}):\n`;
          context += `${output}\n\n`;
        }
        
        logger.info(`Built context from ${previousSubtasks.length} previous subtasks`);
      }

      // Prepare enhanced input with context
      let inputWithContext: any;
      if (typeof subtask.toolInput === 'string') {
        try {
          const parsedInput = JSON.parse(subtask.toolInput);
          inputWithContext = {
            ...parsedInput,
            context,
            originalTask: subtask.task.goalText
          };
        } catch (e) {
          inputWithContext = {
            query: subtask.toolInput,
            context,
            originalTask: subtask.task.goalText
          };
        }
      } else {
        inputWithContext = {
          ...(subtask.toolInput as any),
          context,
          originalTask: subtask.task.goalText
        };
      }

      // Execute the tool with enhanced context
      const toolResponse = await executeTool(subtask.tool, inputWithContext);

      // Update subtask with result
      await prisma.agentSubTask.update({
        where: { id: subtask.id },
        data: {
          status: 'completed',
          toolOutput: typeof toolResponse === 'object' ? toolResponse : JSON.stringify(toolResponse)
        }
      });

      logger.info(`Subtask ${subtask.id} completed successfully`);

      // Find next subtask in sequence
      const nextSubtask = await prisma.agentSubTask.findFirst({
        where: {
          taskId: subtask.taskId,
          stepNumber: subtask.stepNumber + 1,
          status: 'pending'
        }
      });

      if (nextSubtask) {
        logger.info(`Found next subtask ${nextSubtask.id} - will be processed in next job run`);
      }

      // Check if all subtasks are completed
      const remainingSubtasks = await prisma.agentSubTask.count({
        where: {
          taskId: subtask.taskId,
          status: { not: 'completed' }
        }
      });

      if (remainingSubtasks === 0) {
        // All subtasks completed, generate a final summary output
        logger.info(`All subtasks completed for task ${subtask.taskId}, generating final output`);
        
        // Get all completed subtasks for this task
        const allCompletedSubtasks = await prisma.agentSubTask.findMany({
          where: {
            taskId: subtask.taskId,
            status: 'completed'
          },
          orderBy: {
            stepNumber: 'asc'
          }
        });
        
        // Extract the outputs from each subtask
        const subtaskOutputs = allCompletedSubtasks.map((st: any) => {
          let output = '';
          try {
            if (typeof st.toolOutput === 'string') {
              const parsed = JSON.parse(st.toolOutput);
              output = parsed.result || parsed;
            } else if (st.toolOutput && typeof st.toolOutput === 'object') {
              // Check if it's an object with a result property
              const toolOutput = st.toolOutput as Record<string, any>;
              output = toolOutput.result ? String(toolOutput.result) : JSON.stringify(st.toolOutput);
            } else {
              output = String(st.toolOutput || '');
            }
          } catch (e) {
            output = String(st.toolOutput || '');
          }
          return {
            tool: st.tool,
            thought: st.agentThought || '',
            output
          };
        });
        
        // Generate a summary
        let finalOutput = `# Results for "${subtask.task.goalText}"\n\n`;
        
        const typedResults = subtaskOutputs as Array<{
          tool: string;
          thought: string;
          output: string;
        }>;
        
        typedResults.forEach((result: any, index: number) => {
          finalOutput += `## ${result.tool.replace('CrewAI-', '')}\n`;
          if (result.thought) {
            finalOutput += `${result.thought}\n\n`;
          }
          finalOutput += `${result.output}\n\n`;
        });
        
        // Update main task with final output and completed status
        await prisma.agentTask.update({
          where: { id: subtask.taskId },
          data: { 
            status: 'completed',
            finalOutput: finalOutput
          }
        });
        
        logger.info(`Task ${subtask.taskId} marked as completed with final output`);
      }
    } catch (error) {
      logger.error(`Error processing subtask ${subtask.id}:`, error);

      // Update subtask with error
      await prisma.agentSubTask.update({
        where: { id: subtask.id },
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
    }
  }
  
  logger.info(`Processing agent subtasks job completed`);
}

async function executeTool(tool: string, toolInput: any): Promise<any> {
  logger.info(`Executing tool: ${tool} with input: ${JSON.stringify(toolInput)}`);
  
  // Parse input if it's a JSON string
  let parsedInput: any;
  try {
    parsedInput = typeof toolInput === 'string' ? JSON.parse(toolInput) : toolInput;
  } catch (error) {
    parsedInput = toolInput; // Keep as string if not valid JSON
  }

  // Tool execution with multiple tool support
  switch (tool.toLowerCase()) {
    case 'search':
      return await executeSearchTool(parsedInput);
    case 'serper-search':
    case 'serpersearch':
      return await executeSerperSearchTool(parsedInput);
    case 'crewai-research':
      return await executeResearchTool(parsedInput);
    case 'crewai-analysis':
      return await executeAnalysisTool(parsedInput);
    case 'crewai-writer':
      return await executeWriterTool(parsedInput);
    case 'crewai-execution':
      return await executeExecutionTool(parsedInput);
    default:
      logger.warn(`Unknown tool type: ${tool}, using default handler`);
      // For any other tool, use a default handler
      return {
        status: "executed",
        message: `Executed ${tool} tool with: ${JSON.stringify(parsedInput)}`,
        results: [`Used tool ${tool}`]
      };
  }
}

// Original OpenAI-based search tool
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

// New Serper-based search tool
async function executeSerperSearchTool(input: string | { query: string, country?: string, location?: string, locale?: string, n_results?: number }): Promise<any> {
  // Extract search parameters
  let searchQuery: string;
  let country: string | undefined;
  let location: string | undefined;
  let locale: string | undefined;
  let n_results: number = 10; // Default to 10 results

  if (typeof input === 'string') {
    searchQuery = input;
  } else {
    searchQuery = input.query;
    country = input.country;
    location = input.location;
    locale = input.locale;
    n_results = input.n_results || 10;
  }

  logger.info(`Executing Serper search for: "${searchQuery}"`);

  if (!SERPER_API_KEY) {
    logger.error("Serper API key not found. Please set the SERPER_API_KEY environment variable.");
    return {
      error: "API key not configured",
      message: "The Serper API key is not configured. Contact your administrator.",
      results: []
    };
  }

  try {
    // Prepare request to Serper API
    const requestData: any = {
      q: searchQuery
    };

    // Add optional parameters if provided
    if (country) requestData.gl = country;
    if (location) requestData.location = location;
    if (locale) requestData.hl = locale;

    const response = await axios.post(SERPER_SEARCH_URL, requestData, {
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Process and format the results
    const serperResults = response.data;
    const formattedResults: {
      query: string;
      results: Array<{
        title: string;
        link: string;
        snippet: string;
        source: string;
      }>;
      knowledgeGraph?: any;
      answerBox?: any;
    } = {
      query: searchQuery,
      results: []
    };

    // Process organic results
    if (serperResults.organic && serperResults.organic.length > 0) {
      const limitedResults = serperResults.organic.slice(0, n_results);
      
      formattedResults.results = limitedResults.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: 'Serper Search'
      }));
    }

    // Add knowledge graph if available
    if (serperResults.knowledgeGraph) {
      formattedResults.knowledgeGraph = serperResults.knowledgeGraph;
    }

    // Add answer box if available
    if (serperResults.answerBox) {
      formattedResults.answerBox = serperResults.answerBox;
    }

    logger.info(`Serper search completed with ${formattedResults.results.length} results`);
    return formattedResults;
  } catch (error) {
    logger.error("Error executing Serper search tool:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      logger.error(`Serper API responded with status: ${error.response.status}`);
      logger.error(`Response data:`, error.response.data);
      
      return {
        error: `API Error (${error.response.status})`,
        message: error.response.data?.message || "An error occurred while calling the Serper API",
        results: []
      };
    }
    
    throw new Error(`Serper search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions for CrewAI tools
async function executeResearchTool(input: any): Promise<any> {
  const query = typeof input === 'string' ? input : input.query;
  const originalTask = input.originalTask || query;
  
  try {
    // Use OpenAI to search and gather information
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a research specialist. Research the topic thoroughly and provide comprehensive information. Structure your response as a detailed research document with clear sections."
        },
        {
          role: "user",
          content: `Research task: ${query}\nFocus on finding recent, accurate information about: ${originalTask}`
        }
      ]
    });
    
    return {
      result: response.choices[0].message.content,
      source: "AI Research"
    };
  } catch (error) {
    logger.error("Error executing research tool:", error);
    throw new Error(`Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function executeAnalysisTool(input: any): Promise<any> {
  const query = typeof input === 'string' ? input : input.query;
  const context = input.context || '';
  const originalTask = input.originalTask || query;
  
  try {
    // Use OpenAI to analyze information
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an analysis specialist. Analyze the provided information and extract key insights, patterns, and implications. Structure your response with clear analysis sections."
        },
        {
          role: "user",
          content: `Analysis task: ${query}\n\nOriginal question: ${originalTask}\n\nResearch information to analyze:\n${context}`
        }
      ]
    });
    
    return {
      result: response.choices[0].message.content,
      source: "AI Analysis"
    };
  } catch (error) {
    logger.error("Error executing analysis tool:", error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function executeWriterTool(input: any): Promise<any> {
  const query = typeof input === 'string' ? input : input.query;
  const context = input.context || '';
  const originalTask = input.originalTask || query;
  
  try {
    // Use OpenAI to create content
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional writer. Synthesize the information and create well-structured, coherent content that directly addresses the original question. Your writing should be clear, engaging, and based on facts from the provided research and analysis."
        },
        {
          role: "user",
          content: `Writing task: ${query}\n\nOriginal question: ${originalTask}\n\nResearch and analysis to use:\n${context}\n\nPlease create a comprehensive, fact-based answer to the original question based on the provided information.`
        }
      ]
    });
    
    return {
      result: response.choices[0].message.content,
      source: "AI Writer"
    };
  } catch (error) {
    logger.error("Error executing writer tool:", error);
    throw new Error(`Writing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function executeExecutionTool(input: any): Promise<any> {
  const query = typeof input === 'string' ? input : input.query;
  const context = input.context || '';
  const originalTask = input.originalTask || query;
  
  try {
    // Use OpenAI to create an execution plan
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an implementation specialist. Create a brief, focused summary of the key facts and findings that directly answer the original question. Focus only on relevant information, not on generic implementation plans."
        },
        {
          role: "user",
          content: `Implementation task: ${query}\n\nOriginal question: ${originalTask}\n\nResearch, analysis, and content to summarize:\n${context}\n\nPlease create a concise summary of the most important facts and findings that directly answer the original question.`
        }
      ]
    });
    
    return {
      result: response.choices[0].message.content,
      source: "AI Execution Planner"
    };
  } catch (error) {
    logger.error("Error executing implementation tool:", error);
    throw new Error(`Implementation planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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