import React, { useState, useEffect, useRef } from 'react';
import { AgentTask } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Import the Marked class constructor to use synchronous parsing
import { Marked } from 'marked';

// Create a new instance with synchronous parsing
const synchronousMarked = new Marked({
  async: false
});

interface TaskBreakdownViewerProps {
  task: AgentTask;
  onToolPermissionRequest: (toolName: string) => void;
}

export default function TaskBreakdownViewer({
  task,
  onToolPermissionRequest,
}: TaskBreakdownViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<{[key: string]: boolean}>({});
  const resultsDivRef = useRef<HTMLDivElement>(null);
  
  // Effect to remove redundant title headings from rendered HTML
  useEffect(() => {
    if (resultsDivRef.current && task?.goalText) {
      const goalText = task.goalText.trim();
      const headings = resultsDivRef.current.querySelectorAll('h1, h2, h3');
      
      // Check the first heading to see if it matches our goal text
      if (headings.length > 0) {
        const firstHeading = headings[0];
        if (firstHeading.textContent?.trim().toLowerCase() === goalText.toLowerCase()) {
          (firstHeading as HTMLElement).style.display = 'none';
        }
      }
    }
  }, [task?.finalOutput, task?.goalText]);

  if (!task) {
    return (
      <div className="p-4">
        <div className="text-gray-500">No task selected</div>
      </div>
    );
  }

  // Format the final output if it exists
  const formatFinalOutput = (output: string) => {
    try {
      // Check if the output starts with a heading that matches the task goal
      // This helps remove the redundant title in the results section
      let processedOutput = output;
      const goalTextLower = task.goalText.toLowerCase().trim();
      const titlePattern = new RegExp(`^#\\s+${goalTextLower}`, 'i');
      const titlePattern2 = new RegExp(`^##\\s+${goalTextLower}`, 'i');
      const titlePattern3 = new RegExp(`^###\\s+${goalTextLower}`, 'i');
      
      // Check for various heading formats and remove if they match the goal text
      const lines = processedOutput.split('\n');
      if (
        lines[0] && (
          titlePattern.test(lines[0]) || 
          titlePattern2.test(lines[0]) || 
          titlePattern3.test(lines[0]) ||
          lines[0].toLowerCase().trim() === goalTextLower
        )
      ) {
        // Remove the first line and any blank lines immediately after
        let i = 1;
        while (i < lines.length && lines[i].trim() === '') {
          i++;
        }
        processedOutput = lines.slice(i).join('\n');
      }
      
      // Use synchronous marked instance and force type to string with double assertion
      const rawHtml = synchronousMarked.parse(processedOutput) as unknown as string;
      
      // Sanitize HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml, { 
        ADD_ATTR: ['target', 'rel'], 
        ADD_TAGS: ['iframe'] 
      });
      
      // Return HTML div with dangerouslySetInnerHTML for React
      return <div 
        className="markdown-content" 
        dangerouslySetInnerHTML={{ __html: cleanHtml }} 
      />;
    } catch (error) {
      // Fallback to simple text with line breaks for paragraphs
      const paragraphs = output.split(/\n\n+/);
      return (
        <div className="space-y-4">
          {paragraphs.map((paragraph: string, index: number) => (
            <p key={index} className="text-gray-800 dark:text-gray-200">{paragraph}</p>
          ))}
        </div>
      );
    }
  };

  // Generate a user-friendly task name based on the tool and goal
  const getTaskName = (tool: string, index: number, goal: string): string => {
    const goalLower = (goal || '').toLowerCase();
    
    // Map common CrewAI tools to more user-friendly task names
    switch (tool) {
      case 'CrewAI-Planning':
        return 'Create comprehensive task list';
      case 'CrewAI-Research':
        if (goalLower.includes('stock') || goalLower.includes('market')) {
          return 'Gather market data and company information';
        } else if (goalLower.includes('restaurant') || goalLower.includes('food')) {
          return 'Find top rated establishments';
        } else {
          return 'Research key information';
        }
      case 'CrewAI-Execution':
        if (goalLower.includes('stock') || goalLower.includes('market')) {
          return 'Analyze market trends and patterns';
        } else if (goalLower.includes('restaurant') || goalLower.includes('food')) {
          return 'Evaluate dining options';
        } else {
          return 'Process collected information';
        }
      case 'CrewAI-Synthesis':
        return 'Compile final report';
      case 'Search':
        if (goalLower.includes('stock') || goalLower.includes('market')) {
          return 'Collect financial data';
        } else if (goalLower.includes('restaurant') || goalLower.includes('food')) {
          return 'Search for popular dining options';
        } else {
          return 'Search for relevant information';
        }
      default:
        return `Complete step ${index + 1}`;
    }
  };

  // Get a concise summary of findings from the agent thought or tool output
  const getSummary = (subtask: any): string => {
    if (!subtask) return 'No information available';

    // For research tasks, try to extract key findings
    if (subtask.tool === 'CrewAI-Research' && subtask.toolOutput) {
      const output = typeof subtask.toolOutput === 'string' 
        ? subtask.toolOutput 
        : JSON.stringify(subtask.toolOutput);
      
      // If there are numbered items or bullets, extract them as findings
      if (output.includes('1.') || output.includes('•') || output.includes('-')) {
        const lines = output.split(/\n+/);
        const items = lines
          .filter((line: string) => /^(\d+\.|\-|\•|\*)/.test(line.trim()))
          .map((line: string) => line.replace(/^(\d+\.|\-|\•|\*)\s*/, '').trim())
          .slice(0, 3);
        
        if (items.length > 0) {
          return items.join('\n');
        }
      }
    }
    
    // For other tasks, extract the first sentence or a brief portion
    if (subtask.agentThought) {
      const firstSentence = subtask.agentThought.split(/\.\s+/)[0];
      if (firstSentence && firstSentence.length < 120) {
        return firstSentence.trim() + '.';
      }
      return subtask.agentThought.substring(0, 100).trim() + '...';
    }
    
    return 'Collecting information...';
  };

  // Toggle expanded state for a step
  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  // Get completed tasks
  const completedTasks = task.subtasks.filter(st => st.status === 'completed');
  const totalTasks = task.subtasks.length;
  const completedPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const renderMultilineText = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').map((line: string, i: number) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20">
      {/* Goal section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">Goal:</h3>
        <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{task.goalText}</p>
      </div>
      
      {/* Final results section - Moved to top */}
      {task.finalOutput && (task.status === 'completed' || task.status === 'stopped') && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-600">
          <div 
            ref={resultsDivRef}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800 prose dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-gray-300 max-w-none"
          >
            {formatFinalOutput(task.finalOutput)}
          </div>
        </div>
      )}
      
      {/* Task header section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Task Progress</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{completedTasks.length} of {totalTasks} tasks completed</p>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{completedPercentage}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{ width: `${completedPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Checklist of tasks */}
      <div className="p-4">
        <div className="space-y-2">
          {task.subtasks.map((subtask, index) => (
            <div 
              key={subtask.id} 
              className="flex items-start space-x-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors duration-150"
            >
              <div className="flex-shrink-0 pt-1">
                {subtask.status === 'completed' ? (
                  <svg className="h-5 w-5 text-green-500 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : subtask.status === 'executing' ? (
                  <svg className="animate-spin h-5 w-5 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : subtask.status === 'error' ? (
                  <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : subtask.status === 'stopped' ? (
                  <svg className="h-5 w-5 text-orange-500 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div 
                  className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex justify-between group"
                  onClick={() => toggleStep(subtask.id)}
                >
                  <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">{getTaskName(subtask.tool, index, task.goalText)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-150">
                    {expandedSteps[subtask.id] ? (
                      <svg className="h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </div>
                
                {/* Only show the expanded details if the user clicks to expand */}
                {expandedSteps[subtask.id] && subtask.status === 'completed' && (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 pl-1 ml-1 border-l-2 border-gray-200 dark:border-gray-600">
                    <p className="whitespace-pre-line pl-2">{getSummary(subtask)}</p>
                  </div>
                )}
                
                {/* For executing tasks, show a processing message */}
                {expandedSteps[subtask.id] && subtask.status === 'executing' && (
                  <div className="mt-3 text-sm text-blue-600 dark:text-blue-400 pl-1 ml-1">
                    <p>Processing...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error message if present */}
      {task.errorMessage && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800">
            <h3 className="font-medium text-red-700 dark:text-red-400">Error</h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">{task.errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    case 'processing':
    case 'in_progress':
      return 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300';
    case 'completed':
      return 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300';
    case 'error':
      return 'bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-300';
    case 'stopped':
      return 'bg-orange-100 dark:bg-orange-800/30 text-orange-800 dark:text-orange-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  }
}

function formatJSONOutput(text: string) {
  // Try to parse as JSON first
  try {
    const parsedJson = JSON.parse(text);
    return (
      <pre className="bg-gray-50 dark:bg-gray-800 rounded p-3 overflow-auto text-xs">
        {JSON.stringify(parsedJson, null, 2)}
      </pre>
    );
  } catch (e) {
    // Not valid JSON, check if it could be a markdown list
    if (text.includes('\n') && (text.includes('- ') || text.includes('* ') || /^\d+\./.test(text))) {
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0);
      
      // Check if it looks like a list
      const isListItem = (line: string) => line.trim().startsWith('- ') || 
                                           line.trim().startsWith('* ') || 
                                           /^\d+\./.test(line.trim());
      
      if (lines.some(isListItem)) {
        return (
          <ul className="list-disc pl-5 space-y-2">
            {lines.map((line: string, index: number) => {
              // Clean up the line by removing list markers
              const cleanLine = line.replace(/^(\d+\.|\-|\•|\*)\s*/, '').trim();
              return cleanLine ? <li key={index}>{cleanLine}</li> : null;
            }).filter(Boolean)}
          </ul>
        );
      }
    }
    
    // Default to paragraph formatting
    const paragraphs = text.split('\n\n');
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph: string, index: number) => (
          <p key={index} className="text-gray-800 dark:text-gray-200">{paragraph}</p>
        ))}
      </div>
    );
  }
} 