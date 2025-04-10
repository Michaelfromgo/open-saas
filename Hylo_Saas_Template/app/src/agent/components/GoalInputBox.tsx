import React, { useState } from 'react';

interface GoalInputBoxProps {
  onSubmit: (goal: string) => void;
  isLoading: boolean;
}

export default function GoalInputBox({ onSubmit, isLoading }: GoalInputBoxProps) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      onSubmit(goal);
      setGoal('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-3">New Research Task</h2>
      <div className="flex flex-col space-y-4">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Enter a research topic or question (e.g., 'Latest advancements in renewable energy' or 'What are the health benefits of meditation?')"
          className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !goal.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Researching...' : 'Start Research'}
        </button>
        {isLoading && (
          <p className="text-sm text-gray-500 mt-2">
            The AI is breaking down your research goal into specific search tasks...
          </p>
        )}
      </div>
    </form>
  );
} 