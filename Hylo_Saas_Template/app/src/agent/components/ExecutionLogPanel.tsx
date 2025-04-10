import React from 'react';

interface ExecutionLogPanelProps {
  logs: string[];
}

export default function ExecutionLogPanel({ logs }: ExecutionLogPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Execution Log</h2>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="p-2 bg-gray-50 rounded text-sm font-mono"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 