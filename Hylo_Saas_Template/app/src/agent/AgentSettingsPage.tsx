import React, { useState, useEffect } from 'react';
import { getEnabledTools, updateEnabledTools } from 'wasp/client/operations';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Agent Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Enabled Tools</h2>
        <div className="space-y-4">
          {tools.map(tool => (
            <div key={tool.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{tool.toolName}</h3>
                <p className="text-sm text-gray-500">
                  {getToolDescription(tool.toolName)}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
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