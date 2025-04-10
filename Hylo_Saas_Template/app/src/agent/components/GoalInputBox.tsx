import React, { useState } from 'react';

interface GoalInputBoxProps {
  onSubmit: (goal: string) => void;
  isLoading: boolean;
}

export default function GoalInputBox({ onSubmit, isLoading }: GoalInputBoxProps) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim() && !isLoading) {
      onSubmit(goal);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">What would you like me to help you with?</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              dark:focus:ring-blue-400 dark:focus:border-blue-400 
              dark:bg-gray-700 dark:text-white 
              placeholder-gray-400 dark:placeholder-gray-500
              hover:border-gray-400 dark:hover:border-gray-500 
              transition-colors duration-150"
            placeholder="Enter your research goal or question..."
            rows={3}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!goal.trim() || isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium 
              ${!goal.trim() || isLoading 
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-md dark:hover:shadow-blue-500/20'
              } 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800
              transition-all duration-150`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 