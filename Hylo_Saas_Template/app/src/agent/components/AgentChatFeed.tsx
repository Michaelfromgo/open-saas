import React from 'react';
import { AgentTask } from '../types';

interface AgentChatFeedProps {
  task: AgentTask | null;
}

export default function AgentChatFeed({ task }: AgentChatFeedProps) {
  if (!task) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">No active task</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Task Progress</h2>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <p className="font-semibold">Goal:</p>
          <p className="mt-1">{task.goalText}</p>
        </div>
        
        {task.subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={`p-4 rounded ${
              subtask.status === 'completed'
                ? 'bg-green-50'
                : subtask.status === 'error'
                ? 'bg-red-50'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">Tool: {subtask.tool}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {subtask.agentThought}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  subtask.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : subtask.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {subtask.status}
              </span>
            </div>
            {subtask.toolOutput && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-sm">{JSON.stringify(subtask.toolOutput)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 