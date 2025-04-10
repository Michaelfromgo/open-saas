import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getAgentTasks } from 'wasp/client/operations';
import { AgentTask } from './types';
import AgentSubHeader from './components/AgentSubHeader';

export default function AgentTasksPage() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const agentTasks = await getAgentTasks();
      setTasks(agentTasks as AgentTask[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agent Tasks</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">View and manage your research tasks</p>
      
      <AgentSubHeader />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Tasks</h2>
        <Link
          to="/agent"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors duration-150 hover:shadow-md dark:hover:shadow-blue-500/20 text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20">
          <p className="text-gray-500 dark:text-gray-400">No tasks found. Create a new task to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Goal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white line-clamp-1 max-w-[200px]">{task.goalText}</div>
                      <div className="sm:hidden mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {new Date(task.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Link
                        to={`/agent?taskId=${task.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-150"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'planning':
      return 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300';
    case 'executing':
      return 'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300';
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