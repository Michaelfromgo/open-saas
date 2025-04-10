// Define types without importing from wasp to avoid conflicts
export interface AgentTask {
  id: string;
  goalText: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  finalOutput: string | null;
  errorMessage: string | null;
  subtasks: AgentSubTask[];
}

export interface AgentSubTask {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  stepNumber: number;
  tool: string;
  toolInput: any;
  toolOutput: any;
  status: string;
  agentThought: string | null;
}

export type AgentStatus = 'idle' | 'planning' | 'executing' | 'completed' | 'error' | 'stopped';

// CrewAI Types
export enum AgentRole {
  PLANNER = "planner",
  RESEARCHER = "researcher",
  ANALYST = "analyst",
  WRITER = "writer",
  EXECUTOR = "executor"
}

export interface CrewTask {
  id: string;
  description: string;
  context?: string;
  expectedOutput?: string;
  assignedTo?: string; // Agent name/ID
  dependencies?: string[]; // IDs of tasks that must be completed before this one
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrewAgent {
  id: string;
  name: string;
  role: AgentRole;
  goal: string;
  description: string;
  backstory?: string;
  allowDelegation?: boolean;
  verbose?: boolean;
  maxIterations?: number;
  maxRPM?: number;
  consecutiveTimeoutsAllowed?: number;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  agents: CrewAgent[];
  tasks: CrewTask[];
  goalText: string;
  status: AgentStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  finalOutput?: string;
  errorMessage?: string;
} 