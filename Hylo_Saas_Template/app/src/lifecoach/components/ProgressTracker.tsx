import React from 'react';
import { formatDate } from '../utils';

interface ProgressTrackerProps {
  goalDescription: string;
  targetDate: Date;
  completedCheckIns: number;
  totalCheckIns: number;
  completionPercentage: number;
  dailyCheckins: Array<{
    id: string;
    checkinDate: Date;
    actionCompleted: boolean;
    comments?: string;
  }>;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  goalDescription,
  targetDate,
  completedCheckIns,
  totalCheckIns,
  completionPercentage,
  dailyCheckins
}) => {
  // Get the last 7 days of check-ins
  const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">Progress Tracker</h2>
      
      {/* Goal Info */}
      <div className="mb-4 sm:mb-6">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-1 sm:mb-2 line-clamp-2">{goalDescription}</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Target: {formatDate(new Date(targetDate))}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {completionPercentage}% Complete
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {completedCheckIns}/{totalCheckIns} check-ins
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-4">
          <div
            className="bg-green-500 h-2 sm:h-4 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Weekly Check-in Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {lastSevenDays.map((date) => {
          const checkin = dailyCheckins.find(
            (c) => new Date(c.checkinDate).toDateString() === date.toDateString()
          );
          
          return (
            <div
              key={date.toISOString()}
              className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition-colors duration-200 ${
                checkin?.actionCompleted
                  ? 'bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800'
                  : checkin
                  ? 'bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300">
                {date.getDate()}
              </span>
              <div className="mt-0.5 sm:mt-1">
                {checkin?.actionCompleted ? (
                  <span className="text-green-500 text-sm sm:text-base">✓</span>
                ) : checkin ? (
                  <span className="text-red-500 text-sm sm:text-base">✗</span>
                ) : (
                  <span className="text-gray-400 text-sm sm:text-base">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker; 