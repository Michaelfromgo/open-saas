import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Simple placeholder version - no functionality yet
const LifeCoachCheckInPage = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Check-in</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track your well-being and reflect on your day
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            to="/life-coach"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">How are you feeling today?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mood (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Energy (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Focus (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stress (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    defaultValue="5"
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reflect on your day</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What went well today? (A win, big or small)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Completed a difficult task at work"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What was challenging today?
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Had difficulty focusing during meetings"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => window.location.href = '/life-coach'}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Check-in
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Check-ins</h3>
        
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <p className="text-gray-500 dark:text-gray-400">
            No check-ins yet. Start your journey today!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LifeCoachCheckInPage; 