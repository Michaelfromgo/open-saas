import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Routes, Route } from 'react-router-dom';
import { createAgentTask, getAgentTask, updateAgentTaskStatus, updateEnabledTools, stopAgentTask } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import GoalInputBox from './components/GoalInputBox';
import AgentChatFeed from './components/AgentChatFeed';
import ExecutionLogPanel from './components/ExecutionLogPanel';
import TaskBreakdownViewer from './components/TaskBreakdownViewer';
import ToolPermissionModal from './components/ToolPermissionModal';
import AgentSubHeader from './components/AgentSubHeader';
import { AgentTask, AgentStatus } from './types';

export default function AgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [isToolPermissionModalOpen, setIsToolPermissionModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [isStoppingTask, setIsStoppingTask] = useState(false);

  // Get task ID from URL
  useEffect(() => {
    const taskId = new URLSearchParams(location.search).get('taskId');
    if (taskId) {
      fetchTaskDetails(taskId);
    }
  }, [location]);

  // Poll for task updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentTask && ['planning', 'executing'].includes(status)) {
      interval = setInterval(() => {
        fetchTaskDetails(currentTask.id);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [currentTask, status]);

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const task = await getAgentTask({ taskId });
      if (task) {
        setCurrentTask(task as AgentTask);
        setStatus((task as AgentTask).status as AgentStatus);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      setStatus('error');
    }
  };

  const handleGoalSubmit = async (goal: string) => {
    setStatus('planning');
    try {
      const task = await createAgentTask({ goalText: goal });
      setCurrentTask(task as AgentTask);
      setStatus('executing');
      navigate(`/agent?taskId=${(task as AgentTask).id}`);
    } catch (error) {
      console.error('Error creating task:', error);
      setStatus('error');
    }
  };

  const handleStopTask = async () => {
    if (!currentTask) return;
    
    setIsStoppingTask(true);
    try {
      const result = await stopAgentTask({ taskId: currentTask.id });
      if (result.success) {
        fetchTaskDetails(currentTask.id);
      }
    } catch (error) {
      console.error('Error stopping task:', error);
    } finally {
      setIsStoppingTask(false);
    }
  };

  const handleToolPermissionRequest = (toolName: string) => {
    setSelectedTool(toolName);
    setIsToolPermissionModalOpen(true);
  };

  const handleToolPermissionConfirm = async (toolName: string) => {
    setIsToolPermissionModalOpen(false);
    try {
      await updateEnabledTools({ toolName, enabled: true });
      if (currentTask) {
        await updateAgentTaskStatus({ taskId: currentTask.id, status: 'executing' });
        fetchTaskDetails(currentTask.id);
      }
    } catch (error) {
      console.error('Error updating tool permissions:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Research Assistant</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Enter a research goal and the AI will break it down into search tasks and find relevant information</p>
      
      <AgentSubHeader />
      
      <div className="w-full">
        <GoalInputBox
          onSubmit={handleGoalSubmit}
          isLoading={status !== 'idle'}
        />
        
        {currentTask && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Breakdown</h2>
              {['planning', 'executing'].includes(status) && (
                <button
                  onClick={handleStopTask}
                  disabled={isStoppingTask}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
                >
                  {isStoppingTask ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Stopping...
                    </>
                  ) : (
                    <>Stop</>
                  )}
                </button>
              )}
            </div>
            <TaskBreakdownViewer
              task={currentTask}
              onToolPermissionRequest={handleToolPermissionRequest}
            />
          </div>
        )}
      </div>

      <div className="hidden">
        <ExecutionLogPanel logs={executionLog} />
        <AgentChatFeed task={currentTask} />
      </div>

      <ToolPermissionModal
        isOpen={isToolPermissionModalOpen}
        onClose={() => setIsToolPermissionModalOpen(false)}
        tools={[
          { name: 'Search', enabled: true },
          { name: 'SerperSearch', enabled: true },
        ]}
        onToggleTool={handleToolPermissionConfirm}
      />
    </div>
  );
} 