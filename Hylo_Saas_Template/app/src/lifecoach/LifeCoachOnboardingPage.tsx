import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useQuery, 
  getLifeCoachGoal, 
  createLifeCoachGoal as createLifeCoachGoalAction 
} from 'wasp/client/operations';
import { formatDate } from './utils';
import LoadingSpinner from '../shared/LoadingSpinner';

const LifeCoachOnboardingPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch existing goal if any
  const { data: existingGoal, isLoading, error } = useQuery(getLifeCoachGoal);

  // Form state
  const [goalDescription, setGoalDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [checkinFrequency, setCheckinFrequency] = useState('daily');

  // Populate form with existing goal data if available
  useEffect(() => {
    if (existingGoal) {
      setGoalDescription(existingGoal.goalDescription);
      
      // Format date to YYYY-MM-DD for input
      const date = new Date(existingGoal.targetDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setTargetDate(`${year}-${month}-${day}`);
      
      setCheckinFrequency(existingGoal.checkinFrequency);
    }
  }, [existingGoal]);

  // Calculate minimum date (today)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const minDate = `${year}-${month}-${day}`;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validate form
    if (!goalDescription.trim()) {
      setFormError('Please enter a goal');
      return;
    }
    
    if (!targetDate) {
      setFormError('Please select a target date');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createLifeCoachGoalAction({
        goalDescription: goalDescription.trim(),
        targetDate: new Date(targetDate),
        checkinFrequency
      });
      
      // Redirect to life coach dashboard
      navigate('/lifecoach');
    } catch (err) {
      console.error('Error creating goal:', err);
      setFormError('Failed to save goal. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        {existingGoal ? 'Edit Your Goal' : 'Set Your Life Coach Goal'}
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
        <form onSubmit={handleSubmit}>
          {/* Goal Description */}
          <div className="mb-6">
            <label htmlFor="goalDescription" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
              What's your goal?
            </label>
            <textarea
              id="goalDescription"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="e.g., Lose 10 pounds, Learn to play guitar, Read 12 books this year"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              required
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Be specific and realistic. A well-defined goal is easier to achieve.
            </p>
          </div>
          
          {/* Target Date */}
          <div className="mb-6">
            <label htmlFor="targetDate" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={minDate}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              When do you want to achieve this goal?
            </p>
          </div>
          
          {/* Check-in Frequency */}
          <div className="mb-8">
            <label htmlFor="checkinFrequency" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
              Check-in Frequency
            </label>
            <select
              id="checkinFrequency"
              value={checkinFrequency}
              onChange={(e) => setCheckinFrequency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              How often do you want to check in on your progress?
            </p>
          </div>
          
          {/* Form Error */}
          {formError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
              {formError}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/lifecoach')}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : existingGoal
                ? 'Update Goal'
                : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LifeCoachOnboardingPage; 