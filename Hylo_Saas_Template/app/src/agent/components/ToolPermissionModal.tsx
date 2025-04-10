import React from 'react';

interface ToolPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: { name: string; enabled: boolean }[];
  onToggleTool: (toolName: string) => void;
}

export default function ToolPermissionModal({
  isOpen,
  onClose,
  tools,
  onToggleTool,
}: ToolPermissionModalProps) {
  if (!isOpen) return null;

  // Filter to only show the Search tool
  const searchTool = tools.find(tool => tool.name === 'Search') || { name: 'Search', enabled: true };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Research Tool Permission</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-700">Search</span>
              <p className="text-sm text-gray-500">
                Allows the agent to search the web for information
              </p>
            </div>
            <button
              onClick={() => onToggleTool('Search')}
              className={`px-4 py-2 rounded ${
                searchTool.enabled
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {searchTool.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          
          <div className="mt-2 p-3 bg-blue-50 rounded text-sm text-blue-800">
            <p>Note: Currently only the Search tool is available. Additional tools will be added in future updates.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 