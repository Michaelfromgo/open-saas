import React from 'react';
import { Link } from 'react-router-dom';

const LifeCoachInsightsPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover patterns and opportunities for growth
          </p>
        </div>
        
        <div>
          <Link
            to="/life-coach"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-400">
            Insights will be generated automatically after you've made several check-ins.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your personal AI coach will analyze your check-ins and provide helpful insights.
          </p>
          <div className="mt-6">
            <Link
              to="/life-coach/check-in"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
            >
              Go to Daily Check-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeCoachInsightsPage; 