import React, { useState } from 'react';
import { AgentTask } from '../types';

interface TaskBreakdownViewerProps {
  task: AgentTask;
  onToolPermissionRequest: (toolName: string) => void;
}

export default function TaskBreakdownViewer({
  task,
  onToolPermissionRequest,
}: TaskBreakdownViewerProps) {
  // Track which steps are expanded
  const [expandedSteps, setExpandedSteps] = useState<{[key: string]: boolean}>({});
  
  if (!task) {
    return (
      <div className="p-4">
        <div className="text-gray-500">No task selected</div>
      </div>
    );
  }

  // Format the final output if it exists
  const formatFinalOutput = (output: string) => {
    if (!output) return null;
    
    // Try to determine if the output is a list
    if (output.includes('1.') || output.includes('•') || output.includes('-')) {
      // Split by common list markers
      const lines = output.split(/\n+/);
      return (
        <ul className="list-disc pl-5 space-y-2">
          {lines.map((line, index) => {
            // Clean up the line by removing list markers
            const cleanLine = line.replace(/^(\d+\.|\-|\•|\*)\s*/, '').trim();
            if (cleanLine) {
              return <li key={index} className="text-gray-800">{cleanLine}</li>;
            }
            return null;
          }).filter(Boolean)}
        </ul>
      );
    }
    
    // For paragraphs
    const paragraphs = output.split(/\n\n+/);
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-gray-800">{paragraph}</p>
        ))}
      </div>
    );
  };

  // Simplify agent thought to a brief summary
  const simplifyAgentThought = (thought: string | null | undefined): string => {
    if (!thought) return '';
    
    // If thought is already short, return it
    if (thought.length < 60) return thought;
    
    // Try to extract the first sentence or a brief summary
    const firstSentence = thought.split(/\.\s+/)[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence + '.';
    }
    
    // Otherwise just truncate
    return thought.substring(0, 80) + '...';
  };

  // Convert tool name to a more conversational step description
  const getStepDescription = (tool: string, index: number, goal: string): string => {
    const goalLower = (goal || '').toLowerCase();
    
    // Map common tools to more user-friendly descriptions
    switch (tool) {
      case 'CrewAI-Research':
        return 'Researching information';
      case 'CrewAI-Planning':
        return 'Planning an approach';
      case 'CrewAI-Execution':
        return 'Analyzing results';
      case 'CrewAI-Synthesis':
        return 'Summarizing findings';
      case 'Search':
        if (goalLower.includes('restaurant') || goalLower.includes('food') || goalLower.includes('crawfish')) {
          return 'Finding top rated places';
        } else if (goalLower.includes('book') || goalLower.includes('reading')) {
          return 'Searching for recommended titles';
        } else {
          return 'Searching for relevant information';
        }
      default:
        return `Processing step ${index + 1}`;
    }
  };

  // Toggle expanded state for a step
  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Task Breakdown</h2>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <p className="font-semibold">Goal:</p>
          <p className="mt-1">{task.goalText}</p>
        </div>

        {/* Display final output with better formatting if task is completed or stopped */}
        {task.finalOutput && (task.status === 'completed' || task.status === 'stopped') && (
          <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">Results</h3>
            <div className="prose max-w-none">
              {formatFinalOutput(task.finalOutput)}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Progress:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ 
                    width: `${task.subtasks.filter(st => st.status === 'completed').length / task.subtasks.length * 100}%` 
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 ml-2">
                {task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length}
              </span>
            </div>
          </div>
        )}

        {/* Show steps if the task is in progress or if we want to display them for completed tasks */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Process Steps</h3>
          {task.subtasks.map((subtask, index) => (
            <div
              key={subtask.id}
              className={`p-3 rounded ${
                subtask.status === 'completed'
                  ? 'bg-green-50'
                  : subtask.status === 'error'
                  ? 'bg-red-50'
                  : subtask.status === 'stopped'
                  ? 'bg-orange-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold flex items-center cursor-pointer" onClick={() => toggleStep(subtask.id)}>
                    <span className="mr-1">
                      {expandedSteps[subtask.id] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </span>
                    {getStepDescription(subtask.tool, index, task.goalText)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${getStatusColor(subtask.status)}`}
                >
                  {subtask.status}
                </span>
              </div>
              
              {subtask.status === 'executing' && (
                <div className="mt-1">
                  <div className="animate-pulse flex space-x-2 items-center">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-blue-600">Processing...</span>
                  </div>
                </div>
              )}
              
              {/* Expanded content */}
              {expandedSteps[subtask.id] && (
                <div className="mt-2 pl-4 border-l-2 border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">
                    {subtask.agentThought || 'No details available'}
                  </p>
                  
                  {subtask.toolOutput && (
                    <div className="mt-2 p-2 bg-white rounded border text-xs">
                      <p className="max-h-40 overflow-y-auto">
                        {typeof subtask.toolOutput === 'string' 
                          ? subtask.toolOutput 
                          : JSON.stringify(subtask.toolOutput, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {subtask.status === 'pending' && (
                <button
                  onClick={() => onToolPermissionRequest(subtask.tool)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Request permission for {subtask.tool}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {task.errorMessage && (
        <div className="mt-4 p-4 bg-red-50 rounded border border-red-100">
          <h3 className="font-medium text-red-700">Error</h3>
          <p className="mt-1 text-sm text-red-600">{task.errorMessage}</p>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'processing':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'stopped':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 