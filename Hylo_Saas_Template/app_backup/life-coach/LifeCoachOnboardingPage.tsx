import React from 'react';
import { Link } from 'react-router-dom';

const LifeCoachOnboardingPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Life Coach Setup</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Welcome to your AI Life Coach! Let's set up your profile to get the most personalized guidance.
          This information helps your coach understand your priorities and goals.
        </p>
        
        <form className="space-y-6">
          {/* Personal Goals */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              What are your personal goals? (comma separated)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Run a marathon, Learn to meditate, Improve work-life balance"
              rows={3}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              These are the big objectives you're working towards
            </p>
          </div>
          
          {/* Focus Areas */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Which life areas do you want to focus on?
            </label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Career">Career</option>
              <option value="Health">Health</option>
              <option value="Relationships">Relationships</option>
              <option value="Personal Growth">Personal Growth</option>
              <option value="Finances">Finances</option>
              <option value="Spirituality">Spirituality</option>
              <option value="Recreation">Recreation</option>
              <option value="Contribution">Contribution</option>
            </select>
          </div>
          
          {/* Personal Values */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              What values are most important to you?
            </label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Authenticity">Authenticity</option>
              <option value="Balance">Balance</option>
              <option value="Compassion">Compassion</option>
              <option value="Creativity">Creativity</option>
              <option value="Growth">Growth</option>
              <option value="Health">Health</option>
              <option value="Honesty">Honesty</option>
            </select>
          </div>
          
          {/* Check-in Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                How often would you like to check in?
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preferred time for check-ins
              </label>
              <input
                type="time"
                defaultValue="09:00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Link
              to="/life-coach"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save & Continue
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LifeCoachOnboardingPage; 