import React from 'react';
import { formatDate } from '../utils';

type WeeklySummaryCardProps = {
  summary: {
    weekStartDate: Date;
    weekEndDate: Date;
    summaryText: string;
    motivationalMessage: string;
    actionableTip: string;
  };
};

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ summary }) => {
  return (
    <div className="space-y-4">
      {/* Date Range */}
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        <span>Week of {formatDate(new Date(summary.weekStartDate))} to {formatDate(new Date(summary.weekEndDate))}</span>
      </div>
      
      {/* Progress Summary */}
      <div>
        <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Progress Summary</h3>
        <p className="text-gray-700 dark:text-gray-300">{summary.summaryText}</p>
      </div>
      
      {/* Motivational Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-4 rounded-sm">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Motivation</h3>
        <p className="text-blue-700 dark:text-blue-400 italic">{summary.motivationalMessage}</p>
      </div>
      
      {/* Actionable Tip */}
      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 p-4 rounded-sm">
        <h3 className="font-medium text-green-800 dark:text-green-300 mb-1">This Week's Tip</h3>
        <p className="text-green-700 dark:text-green-400">{summary.actionableTip}</p>
      </div>
    </div>
  );
};

export default WeeklySummaryCard; 