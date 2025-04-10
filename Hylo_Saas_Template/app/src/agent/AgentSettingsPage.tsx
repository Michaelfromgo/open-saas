import React, { useState, useEffect } from 'react';
import { getEnabledTools, updateEnabledTools } from 'wasp/client/operations';
import AgentSubHeader from './components/AgentSubHeader';

interface EnabledTool {
  id: string;
  toolName: string;
  enabled: boolean;
  userId: string;
}

export default function AgentSettingsPage() {
  const [tools, setTools] = useState<EnabledTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      const enabledTools = await getEnabledTools();
      setTools(enabledTools as EnabledTool[]);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setError('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    try {
      await updateEnabledTools({ toolName, enabled });
      setTools(tools.map(tool => 
        tool.toolName === toolName ? { ...tool, enabled } : tool
      ));
    } catch (error) {
      console.error('Error updating tool:', error);
      setError('Failed to update tool');
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Agent Settings</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Configure your AI assistant's tools and capabilities</p>
      
      <AgentSubHeader />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enabled Tools</h2>
        <div className="space-y-4">
          {tools.map(tool => (
            <div key={tool.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
              <div className="mb-3 sm:mb-0">
                <h3 className="font-medium text-gray-900 dark:text-white">{tool.toolName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getToolDescription(tool.toolName)}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={tool.enabled}
                  onChange={(e) => handleToolToggle(tool.toolName, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getToolDescription(toolName: string): string {
  switch (toolName) {
    case 'Search':
      return 'Search the web for information';
    case 'Browser':
      return 'Navigate and interact with web pages';
    case 'Docs':
      return 'Read and write documentation';
    case 'Webhook':
      return 'Send HTTP requests to external services';
    case 'FileWriter':
      return 'Create and modify files';
    default:
      return 'No description available';
  }
} 