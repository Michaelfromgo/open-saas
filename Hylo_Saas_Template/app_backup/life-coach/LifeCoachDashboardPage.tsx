import React from 'react';
import { Link } from 'react-router-dom';

// A more simplified version of the dashboard to avoid import errors
const LifeCoachDashboardPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Life Coach Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Your personal AI coach to help you achieve your goals
          </p>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link
            to="/life-coach/check-in"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm"
          >
            Daily Check-in
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Check-in Streak</h3>
          </div>
          <div className="flex items-center justify-center flex-col">
            <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">0</span>
            <span className="text-gray-600 dark:text-gray-300 mt-2">days in a row</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Focus Areas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-100 text-xs rounded-full">
              Career
            </span>
            <span className="px-2 py-1 bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-100 text-xs rounded-full">
              Health
            </span>
            <span className="px-2 py-1 bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-100 text-xs rounded-full">
              Relationships
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Goals</h3>
          </div>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            <li className="truncate">Run a marathon</li>
            <li className="truncate">Learn to meditate daily</li>
            <li className="truncate">Improve work-life balance</li>
          </ul>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Last Check-in */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Latest Check-in</h3>
            <Link 
              to="/life-coach/check-in"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All
            </Link>
          </div>
          
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">No check-ins yet. Start your journey today!</p>
            <Link
              to="/life-coach/check-in"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Your First Check-in
            </Link>
          </div>
        </div>

        {/* New Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">New Insights</h3>
            <Link 
              to="/life-coach/insights"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All
            </Link>
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">
            No new insights yet. They'll appear after you've made a few check-ins.
          </p>
        </div>

        {/* Latest Reflection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Weekly Reflection</h3>
            <Link 
              to="/life-coach/reflections"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All
            </Link>
          </div>
          
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">No reflections generated yet. They're created automatically after sufficient check-ins.</p>
            <Link
              to="/life-coach/reflections"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-indigo-400 dark:hover:bg-gray-600"
            >
              Learn More About Reflections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeCoachDashboardPage; 