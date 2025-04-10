import { ChatOpenAI } from "@langchain/openai";
import { logger } from "../utils/logger";
import { AgentRole, CrewAgent, CrewTask, Crew as CrewInterface } from "../../agent/types";
import { v4 as uuidv4 } from "uuid";

// Helper function to safely get agent ID
function getAgentId(agent: CrewAgent | undefined): string | undefined {
  return agent?.id;
}

// Define the crew structure (collection of agents)
export class Crew implements CrewInterface {
  id: string;
  name: string;
  description: string;
  agents: CrewAgent[] = [];
  tasks: CrewTask[] = [];
  goalText: string;
  status: 'idle' | 'planning' | 'executing' | 'completed' | 'error';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  finalOutput?: string;
  errorMessage?: string;
  private llmInstances: Map<string, any> = new Map();

  constructor(props: {
    name: string;
    description: string;
    userId: string;
    goalText: string;
    apiKey: string;
  }) {
    this.id = uuidv4();
    this.name = props.name;
    this.description = props.description;
    this.userId = props.userId;
    this.goalText = props.goalText;
    this.status = 'idle';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Create default agents if needed
    this.createDefaultAgents(props.apiKey);
  }

  // Create default set of agents
  private createDefaultAgents(apiKey: string): void {
    this.addAgent({
      id: uuidv4(),
      name: "Planning Agent",
      role: AgentRole.PLANNER,
      goal: "Create detailed task plans",
      description: "I break down complex goals into manageable tasks and create execution plans.",
      allowDelegation: true,
      verbose: true,
    }, apiKey);

    this.addAgent({
      id: uuidv4(),
      name: "Research Agent",
      role: AgentRole.RESEARCHER,
      goal: "Gather comprehensive information",
      description: "I collect and organize relevant information from various sources.",
      allowDelegation: false,
      verbose: true,
    }, apiKey);

    this.addAgent({
      id: uuidv4(),
      name: "Analysis Agent",
      role: AgentRole.ANALYST,
      goal: "Perform deep analysis of information",
      description: "I analyze data and information to extract insights, patterns, and implications.",
      allowDelegation: false,
      verbose: true,
    }, apiKey);

    this.addAgent({
      id: uuidv4(),
      name: "Writer Agent",
      role: AgentRole.WRITER,
      goal: "Articulate findings and recommendations clearly",
      description: "I synthesize information and craft well-structured, coherent content.",
      allowDelegation: false,
      verbose: true,
    }, apiKey);

    this.addAgent({
      id: uuidv4(),
      name: "Execution Agent",
      role: AgentRole.EXECUTOR,
      goal: "Execute tasks efficiently",
      description: "I implement solutions based on plans and research.",
      allowDelegation: false,
      verbose: true,
    }, apiKey);
  }

  // Add an agent to the crew
  addAgent(agent: Omit<CrewAgent, "llm">, apiKey: string): CrewAgent {
    const llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-4",
      temperature: 0.7,
    });

    const newAgent = { ...agent };
    this.agents.push(newAgent);
    this.llmInstances.set(agent.id, llm);
    this.updatedAt = new Date();
    return newAgent;
  }

  // Add a task to be performed by the crew
  addTask(task: Omit<CrewTask, "id" | "status" | "createdAt" | "updatedAt">): CrewTask {
    const newTask: CrewTask = {
      id: uuidv4(),
      description: task.description,
      context: task.context,
      expectedOutput: task.expectedOutput,
      assignedTo: task.assignedTo,
      dependencies: task.dependencies || [],
      status: 'pending',
      result: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.tasks.push(newTask);
    this.updatedAt = new Date();
    return newTask;
  }

  // Get all tasks in the crew
  getTasks(): CrewTask[] {
    return this.tasks;
  }

  // Get a task by ID
  getTask(taskId: string): CrewTask | undefined {
    return this.tasks.find(task => task.id === taskId);
  }

  // Update a task's status and result
  updateTaskStatus(taskId: string, status: CrewTask['status'], result?: string): CrewTask | undefined {
    const task = this.tasks.find(task => task.id === taskId);
    if (task) {
      task.status = status;
      if (result !== undefined) {
        task.result = result;
      }
      task.updatedAt = new Date();
      this.updatedAt = new Date();
    }
    return task;
  }

  // Check if all task dependencies are completed
  private areTaskDependenciesMet(task: CrewTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    return task.dependencies.every(depId => {
      const depTask = this.tasks.find(t => t.id === depId);
      return depTask && depTask.status === 'completed';
    });
  }

  // Get tasks that are ready to execute (dependencies met and status pending)
  getExecutableTask(): CrewTask | null {
    for (const task of this.tasks) {
      if (task.status === 'pending' && this.areTaskDependenciesMet(task)) {
        return task;
      }
    }
    return null;
  }

  // Execute all tasks with the crew
  async run(): Promise<{ result: string; plan: string }> {
    try {
      logger.info(`===== STARTING CrewAI execution for goal: ${this.goalText} =====`);
      this.status = 'planning';
      this.updatedAt = new Date();
      
      // 1. Planning phase - create tasks if none exist
      if (this.tasks.length === 0) {
        logger.info(`Planning phase: No tasks exist, creating plan...`);
        const plan = await this.createPlan();
        logger.info(`Plan created with ${this.tasks.length} tasks`);
      } else {
        logger.info(`Planning phase: Using ${this.tasks.length} existing tasks`);
      }
      
      // We don't actually execute tasks here - that's handled by the job system
      // Just return a plan
      logger.info(`Returning plan with ${this.tasks.length} tasks`);
      
      // Return plan details
      const planDetails = JSON.stringify(this.tasks.map(t => ({
        id: t.id,
        description: t.description,
        status: t.status
      })));
      
      return {
        result: `Plan created with ${this.tasks.length} tasks`,
        plan: planDetails
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      logger.error(`!!!ERROR!!! in crew execution: ${errorMessage}`);
      this.status = 'error';
      this.errorMessage = error instanceof Error ? error.message : String(error);
      this.updatedAt = new Date();
      throw error;
    }
  }

  // Create a plan for the given goal
  private async createPlan(): Promise<string> {
    logger.warn("TESTING FIX: Using default plan immediately for testing");
    return this.defaultPlan();
    
    /* Temporarily disabled for testing
    const planner = this.agents.find(agent => agent.role === AgentRole.PLANNER);
    
    if (!planner) {
      logger.warn("No dedicated planner found. Using default planning.");
      return this.defaultPlan();
    }
    
    const llm = this.llmInstances.get(planner.id);
    if (!llm) {
      throw new Error("LLM instance not found for planner agent");
    }
    
    // Use the planner agent to create a plan
    const messages = [
      { 
        role: "system", 
        content: `You are ${planner.name}, a ${planner.role}. ${planner.description}
        Your job is to break down the goal into specific tasks with clear dependencies.
        Each task should have a clear description and expected output.`
      },
      { 
        role: "user", 
        content: `Create a detailed plan for the following goal: ${this.goalText}. 
        Break down into sequential tasks that can be assigned to specialized agents including a researcher, analyst, and executor.
        For each task, specify:
        1. A clear description
        2. The expected output
        3. Any dependencies on other tasks
        4. Which agent role should handle it
        
        Use this exact format for each task:

        Task X: [Task Title]
        Description: [Detailed task description]
        Expected Output: [What the task should produce]
        Agent: [researcher/analyst/executor]
        Dependencies: [List of task numbers this depends on, or 'None']`
      }
    ];
    
    const response = await llm.invoke(messages);
    const planContent = response.content;
    
    // Log the raw plan for debugging
    logger.info(`Raw plan content (first 500 chars): ${planContent.substring(0, 500)}...`);
    
    // Parse the plan and create tasks
    try {
      // Simple parsing logic - in a real app, this would be more robust
      const taskRegex = /Task\s+(\d+):\s*([^\n]+)\nDescription:\s*([^\n]+)\nExpected Output:\s*([^\n]+)\nAgent:\s*([^\n]+)/gi;
      let match;
      const taskMap = new Map<string, string>(); // Map of task number to task ID
      
      while ((match = taskRegex.exec(planContent)) !== null) {
        const taskNum = match[1];
        const taskTitle = match[2].trim();
        const description = match[3].trim();
        const expectedOutput = match[4].trim();
        const agentRole = match[5].trim().toLowerCase();
        
        // Find the appropriate agent
        let assignedTo: string | undefined = undefined;
        if (agentRole.includes("research")) {
          assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.RESEARCHER));
        } else if (agentRole.includes("analy")) {
          assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.ANALYST));
        } else if (agentRole.includes("execut")) {
          assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.EXECUTOR));
        } else if (agentRole.includes("writ")) {
          assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.WRITER));
        }
        
        const task = this.addTask({
          description: `${taskTitle}: ${description}`,
          expectedOutput,
          assignedTo,
          dependencies: [] // Will be populated after all tasks are created
        });
        
        taskMap.set(taskNum, task.id);
      }
      
      // If no tasks matched with the first regex, try a simpler alternative pattern
      if (taskMap.size === 0) {
        logger.info("Primary task pattern didn't match any tasks, trying simpler pattern");
        
        // Simpler pattern to match tasks with basic structure
        const simpleTaskRegex = /Task\s*(\d+)[:\s]+([^\n]+)[\s\S]*?(?=Task\s*\d+|$)/gi;
        
        while ((match = simpleTaskRegex.exec(planContent)) !== null) {
          const taskNum = match[1];
          const taskTitle = match[2].trim();
          
          // Get the full task text to extract other details if possible
          const fullTaskText = match[0];
          
          // Try to extract other fields with basic patterns (optional matches)
          const descriptionMatch = /Description:?\s*([^\n]+)/i.exec(fullTaskText);
          const outputMatch = /(?:Expected )?Output:?\s*([^\n]+)/i.exec(fullTaskText);
          const agentMatch = /Agent:?\s*([^\n]+)/i.exec(fullTaskText);
          
          const description = descriptionMatch ? descriptionMatch[1].trim() : taskTitle;
          const expectedOutput = outputMatch ? outputMatch[1].trim() : "Completed task output";
          const agentRole = agentMatch ? agentMatch[1].trim().toLowerCase() : "";
          
          // Find the appropriate agent
          let assignedTo: string | undefined = undefined;
          
          // Determine agent based on keywords in task title or agent field
          if (agentRole.includes("research") || taskTitle.toLowerCase().includes("research")) {
            assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.RESEARCHER));
          } else if (agentRole.includes("analy") || taskTitle.toLowerCase().includes("analy")) {
            assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.ANALYST));
          } else if (agentRole.includes("execut") || taskTitle.toLowerCase().includes("execut") || 
                    taskTitle.toLowerCase().includes("implement")) {
            assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.EXECUTOR));
          } else {
            // Default to researcher for first task, analyst for middle tasks, executor for last task
            const taskNumInt = parseInt(taskNum);
            if (taskNumInt === 1) {
              assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.RESEARCHER));
            } else if (taskNumInt === taskMap.size + 1) {
              assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.EXECUTOR));
            } else {
              assignedTo = getAgentId(this.agents.find(a => a.role === AgentRole.ANALYST));
            }
          }
          
          const task = this.addTask({
            description: `${taskTitle}: ${description !== taskTitle ? description : ""}`,
            expectedOutput,
            assignedTo,
            dependencies: [] // Will be populated after all tasks are created
          });
          
          taskMap.set(taskNum, task.id);
          logger.info(`Created task ${taskNum} using simpler pattern: ${taskTitle}`);
        }
      }
      
      // Second pass to set dependencies
      const depRegex = /Task\s+(\d+):.*\nDependencies:\s*([^\n]+)/gi;
      while ((match = depRegex.exec(planContent)) !== null) {
        const taskNum = match[1];
        const depText = match[2].trim();
        const taskId = taskMap.get(taskNum);
        
        if (taskId) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            const depNums = depText.match(/\d+/g) || [];
            task.dependencies = depNums
              .map(num => taskMap.get(num))
              .filter(id => id !== undefined) as string[];
          }
        }
      }
      
      // If dependencies couldn't be parsed, try to infer them sequentially
      let hasSetDependencies = this.tasks.some(t => t.dependencies && t.dependencies.length > 0);
      if (!hasSetDependencies && this.tasks.length > 1) {
        logger.info("No dependencies found, setting sequential dependencies");
        // Sort tasks by task number
        const sortedTasks = [...taskMap.entries()]
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(entry => entry[1]);
        
        // Set sequential dependencies
        for (let i = 1; i < sortedTasks.length; i++) {
          const task = this.tasks.find(t => t.id === sortedTasks[i]);
          const prevTaskId = sortedTasks[i-1];
          if (task) {
            task.dependencies = [prevTaskId];
            logger.info(`Set task ${i+1} to depend on task ${i}`);
          }
        }
      }
      
      // If no tasks were created by parsing, fall back to default plan
      if (this.tasks.length === 0) {
        logger.warn("Plan parsing created 0 tasks, using default plan instead");
        return this.defaultPlan();
      }
      
      return planContent;
    } catch (error) {
      logger.error(`Error parsing plan: ${error}`);
      return this.defaultPlan();
    }
    */
  }
  
  // Default planning method if no planner agent is available
  private defaultPlan(): string {
    // Create basic tasks
    this.addTask({
      description: "Research: Collect information about the goal",
      expectedOutput: "Comprehensive research data",
      assignedTo: getAgentId(this.agents.find(a => a.role === AgentRole.RESEARCHER)) || undefined
    });
    
    const researchTaskId = this.tasks[this.tasks.length - 1].id;
    
    this.addTask({
      description: "Analysis: Analyze the collected information",
      expectedOutput: "Analysis report with insights",
      assignedTo: getAgentId(this.agents.find(a => a.role === AgentRole.ANALYST)) || undefined,
      dependencies: [researchTaskId]
    });
    
    const analysisTaskId = this.tasks[this.tasks.length - 1].id;
    
    this.addTask({
      description: "Execution: Implement the solution",
      expectedOutput: "Implemented solution",
      assignedTo: getAgentId(this.agents.find(a => a.role === AgentRole.EXECUTOR)) || undefined,
      dependencies: [analysisTaskId]
    });
    
    return `
      1. Research: Collect information about ${this.goalText}
      2. Analysis: Analyze the collected information
      3. Execution: Implement the solution
    `;
  }
  
  // Execute the tasks in dependency order
  private async executeTasks(): Promise<any[]> {
    logger.info(`==== Starting executeTasks with ${this.tasks.length} tasks ====`);
    const completed = new Set<string>();
    const results: any[] = [];
    
    // Keep trying to execute tasks until no more can be executed
    let progress = true;
    while (progress) {
      progress = false;
      
      for (const task of this.tasks) {
        // Skip tasks that are already completed or failed
        if (task.status !== 'pending') continue;
        
        // Check if all dependencies are completed
        const allDependenciesMet = (task.dependencies || []).every(depId => completed.has(depId));
        if (!allDependenciesMet) continue;
        
        logger.info(`Executing task ${task.id}: ${task.description}`);
        task.status = 'in_progress';
        task.updatedAt = new Date();
        
        try {
          const result = await this.executeTask(task);
          task.result = result;
          task.status = 'completed';
          completed.add(task.id);
          results.push({
            id: task.id,
            description: task.description,
            result
          });
          progress = true;
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.stack || e.message : String(e);
          logger.error(`Task execution failed: ${errorMessage}`);
          task.status = 'failed';
          task.result = `Error: ${e instanceof Error ? e.message : String(e)}`;
        }
        
        task.updatedAt = new Date();
      }
    }
    
    return results;
  }

  // Execute a single task
  private async executeTask(task: CrewTask): Promise<string> {
    // Get the agent for this task
    logger.info(`> executeTask start for task ID ${task.id}`);
    const agent = task.assignedTo 
      ? this.agents.find(a => a.id === task.assignedTo) 
      : this.agents.find(a => a.role === AgentRole.EXECUTOR);
      
    if (!agent) {
      const errorMsg = `No agent found to execute task ${task.id}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    logger.info(`> Using agent: ${agent.name} (${agent.role}) for task ${task.id}`);
    
    const llm = this.llmInstances.get(agent.id);
    if (!llm) {
      const errorMsg = `LLM instance not found for agent ${agent.id}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Get context from dependencies
    logger.info(`> Gathering context from dependencies for task ${task.id}`);
    let context = "";
    if (task.dependencies && task.dependencies.length > 0) {
      logger.info(`> Task ${task.id} has ${task.dependencies.length} dependencies`);
      const depResults = task.dependencies
        .map(depId => {
          const depTask = this.tasks.find(t => t.id === depId);
          logger.info(`> Dependency ${depId} status: ${depTask?.status}, has result: ${!!depTask?.result}`);
          return depTask && depTask.result 
            ? `Task "${depTask.description}" result: ${depTask.result}` 
            : null;
        })
        .filter(Boolean)
        .join("\n\n");
        
      if (depResults) {
        context = `Here are the results from prerequisite tasks:\n\n${depResults}\n\n`;
        logger.info(`> Context gathered from dependencies, length: ${context.length} chars`);
      } else {
        logger.warn(`> No context found from dependencies despite having ${task.dependencies.length} deps!`);
      }
    }
    
    // Create the prompt for the agent
    logger.info(`> Creating prompt for agent ${agent.name} for task ${task.id}`);
    const messages = [
      { 
        role: "system", 
        content: `You are ${agent.name}, a ${agent.role}. ${agent.description}
        You are working on a task as part of a larger goal: ${this.goalText}`
      },
      { 
        role: "user", 
        content: `${context}Your task is: ${task.description}
        
        Expected output: ${task.expectedOutput || "A comprehensive result"}
        
        Please complete this task and provide your output in a clear, structured format.`
      }
    ];
    
    logger.info(`> About to call LLM API for task ${task.id}`);
    try {
      const response = await llm.invoke(messages);
      const errorMessage = response instanceof Error ? response.stack || response.message : String(response);
      logger.info(`> LLM API call successful for task ${task.id}, response length: ${response.content.length} chars`);
      return response.content;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.stack || e.message : String(e);
      logger.error(`> !!!ERROR!!! LLM API call failed for task ${task.id}: ${errorMessage}`);
      throw e;
    }
  }
  
  // Synthesize all results into a final output
  private async synthesizeResults(results: any[]): Promise<string> {
    logger.info(`==== Starting synthesizeResults with ${results.length} results ====`);
    
    // If no results, return empty string
    if (results.length === 0) {
      logger.warn("No tasks were completed, returning empty synthesis.");
      return "No tasks were completed.";
    }
    
    // Try to find a writer agent, otherwise use the planner
    const writer = this.agents.find(a => a.role === AgentRole.WRITER);
    const synthesizer = writer || this.agents.find(a => a.role === AgentRole.PLANNER);
    
    logger.info(`Using ${synthesizer ? synthesizer.name : 'no'} agent for synthesis`);
    
    if (!synthesizer) {
      // If no synthesizer agent, just combine the results
      logger.warn("No synthesis agent found. Combining results manually.");
      return results
        .map(r => `TASK: ${r.description}\n\nRESULT: ${r.result}`)
        .join("\n\n---\n\n");
    }
    
    const llm = this.llmInstances.get(synthesizer.id);
    if (!llm) {
      const errorMsg = `LLM instance not found for synthesizer agent ${synthesizer.id}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const combinedResults = results
      .map(r => `TASK: ${r.description}\n\nRESULT: ${r.result}`)
      .join("\n\n---\n\n");
    
    logger.info(`Created combined results for synthesis, length: ${combinedResults.length} chars`);
    try {
      // Format combined results for input to LLM
      const messages = [
        { 
          role: "system", 
          content: `You are ${synthesizer.name}, a ${synthesizer.role}. ${synthesizer.description}
          Your job is to synthesize the results of multiple tasks into a coherent final output.`
        },
        { 
          role: "user", 
          content: `Synthesize the following results into a comprehensive response for the goal: "${this.goalText}"
    
          ${combinedResults}
          
          Create a well-structured, comprehensive response that integrates all the information.
          Format it properly with clear sections and provide a summary at the beginning.`
        }
      ];
      
      const response = await llm.invoke(messages);
      logger.info(`Successfully generated synthesis response`);
      return response.content as string;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.stack || e.message : String(e);
      logger.error(`Error in synthesis: ${errorMessage}`);
      // Fall back to manual combination if synthesis fails
      return `Goal: ${this.goalText}\n\n${combinedResults}`;
    }
  }
}

// Factory function to create a new crew
export function createCrew(props: {
  name: string;
  description: string;
  userId: string;
  goalText: string;
  apiKey: string;
}): Crew {
  return new Crew(props);
} 