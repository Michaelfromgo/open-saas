import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  useQuery, 
  getLifeCoachGoal, 
  getWeeklySummary,
  createDailyCheckin as createDailyCheckinAction,
  generateWeeklySummary as generateWeeklySummarAction
} from 'wasp/client/operations';
import { formatDate, calculateCompletionPercentage } from './utils';
import LoadingSpinner from '../shared/LoadingSpinner';
import DailyCheckInForm from './components/DailyCheckInForm';
import WeeklySummaryCard from './components/WeeklySummaryCard';
import ProgressTracker from './components/ProgressTracker';

// Define types for the goal data
type DailyCheckin = {
  id: string;
  createdAt: Date;
  goalId: string;
  checkinDate: Date;
  actionCompleted: boolean;
  comments?: string;
};

type Goal = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  goalDescription: string;
  targetDate: Date;
  checkinFrequency: string;
  notificationPreferences: string;
  dailyCheckins?: DailyCheckin[];
};

const LifeCoachPage = () => {
  const navigate = useNavigate();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Fetch the user's goal and check-ins
  const { 
    data: goal, 
    isLoading: isLoadingGoal, 
    error: goalError,
    refetch: refetchGoal 
  } = useQuery(getLifeCoachGoal) as { 
    data: Goal | null; 
    isLoading: boolean; 
    error: Error | null;
    refetch: () => Promise<any>;
  };
  
  // Fetch weekly summary
  const { 
    data: weeklySummary, 
    isLoading: isLoadingSummary, 
    error: summaryError,
    refetch: refetchSummary
  } = useQuery(getWeeklySummary);

  // If the user doesn't have a goal yet, redirect to onboarding
  useEffect(() => {
    if (!isLoadingGoal && !goalError && !goal) {
      navigate('/lifecoach/onboarding');
    }
  }, [isLoadingGoal, goalError, goal, navigate]);

  // Handle daily check-in form submission
  const handleCheckIn = async (actionCompleted: boolean, comments?: string) => {
    if (!goal) return;
    try {
      await createDailyCheckinAction({
        goalId: goal.id,
        actionCompleted,
        comments
      });
      // Force a refresh of the goal data
      await refetchGoal();
      // Add a small delay to ensure the data is updated
      setTimeout(() => {
        refetchGoal();
      }, 500);
    } catch (err) {
      console.error('Error creating check-in:', err);
    }
  };

  // Generate weekly summary
  const handleGenerateSummary = async () => {
    if (!goal) return;
    setIsGeneratingSummary(true);
    try {
      await generateWeeklySummarAction({ goalId: goal.id });
      await refetchSummary();
      setIsGeneratingSummary(false);
    } catch (err) {
      console.error('Error generating summary:', err);
      setIsGeneratingSummary(false);
    }
  };

  // Show loading state
  if (isLoadingGoal) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  // Show error state
  if (goalError) {
    return <div className="text-red-500">Error loading goal: {goalError.message}</div>;
  }

  // If no goal exists, this should redirect to onboarding
  if (!goal) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Calculate progress stats
  const completedCheckIns = goal.dailyCheckins?.filter(c => c.actionCompleted).length || 0;
  const totalCheckIns = goal.dailyCheckins?.length || 0;
  const completionPercentage = calculateCompletionPercentage(completedCheckIns, totalCheckIns || 1);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Life Coach</h1>
        <div className="flex space-x-3">
          <Link 
            to="/lifecoach/chat" 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition dark:bg-green-700 dark:hover:bg-green-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Chat with Coach
          </Link>
          <Link 
            to="/lifecoach/onboarding" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Edit Goal
          </Link>
        </div>
      </div>

      {/* Goal Info Card */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Your Goal</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{goal.goalDescription}</p>
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">Target Date</span>
            <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(new Date(goal.targetDate))}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">Check-in Frequency</span>
            <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">{goal.checkinFrequency}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <ProgressTracker
        goalDescription={goal.goalDescription}
        targetDate={goal.targetDate}
        completedCheckIns={completedCheckIns}
        totalCheckIns={totalCheckIns}
        completionPercentage={completionPercentage}
        dailyCheckins={goal.dailyCheckins || []}
      />

      {/* Daily Check-in */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Daily Check-in</h2>
        <DailyCheckInForm 
          goalDescription={goal.goalDescription} 
          onSubmit={handleCheckIn}
          hasCheckedInToday={goal.dailyCheckins?.some(
            c => new Date(c.checkinDate).toDateString() === new Date().toDateString()
          ) || false}
        />
      </div>

      {/* Weekly Summary */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Weekly Summary</h2>
          <button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
          >
            {isGeneratingSummary ? 'Generating...' : 'Generate New Summary'}
          </button>
        </div>
        
        {isLoadingSummary ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : summaryError ? (
          <div className="text-red-500 dark:text-red-400">Error loading summary: {summaryError.message}</div>
        ) : weeklySummary ? (
          <WeeklySummaryCard summary={weeklySummary} />
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No weekly summary available yet. Click "Generate New Summary" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeCoachPage; 