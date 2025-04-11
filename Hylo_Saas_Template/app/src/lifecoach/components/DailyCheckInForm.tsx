import React, { useState } from 'react';

type DailyCheckInFormProps = {
  goalDescription: string;
  onSubmit: (actionCompleted: boolean, comments?: string) => void;
  hasCheckedInToday: boolean;
};

const DailyCheckInForm: React.FC<DailyCheckInFormProps> = ({
  goalDescription,
  onSubmit,
  hasCheckedInToday
}) => {
  const [actionCompleted, setActionCompleted] = useState(false);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate the question dynamically based on the goal
  const generateQuestion = () => {
    const goalWords = goalDescription.toLowerCase().split(' ');
    const keyVerbs = ['lose', 'learn', 'read', 'exercise', 'practice', 'write', 'develop', 'build', 'run', 'workout', 'meditate'];
    
    for (const verb of keyVerbs) {
      if (goalWords.includes(verb)) {
        switch (verb) {
          case 'lose':
            return 'Did you follow your diet/exercise plan today?';
          case 'learn':
          case 'practice':
            return 'Did you practice or study your skill today?';
          case 'read':
            return 'Did you read today?';
          case 'exercise':
          case 'workout':
          case 'run':
            return 'Did you exercise today?';
          case 'write':
            return 'Did you write today?';
          case 'develop':
          case 'build':
            return 'Did you work on your project today?';
          case 'meditate':
            return 'Did you meditate today?';
        }
      }
    }
    
    // Default question if no specific verb is found
    return 'Did you work toward your goal today?';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(actionCompleted, comments);
      setActionCompleted(false);
      setComments('');
      
      // Show success feedback (you could add a state variable and toast notification here)
      alert('Check-in recorded successfully!');
      
    } catch (err) {
      console.error('Error in check-in:', err);
      alert('There was an error recording your check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasCheckedInToday) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-700">
        <div className="flex items-center mb-2">
          <svg className="w-6 h-6 text-green-500 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p className="font-medium text-green-800 dark:text-green-300">You've already checked in today!</p>
        </div>
        <p className="text-green-700 dark:text-green-400">Great job keeping up with your goal tracking.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <p className="font-medium mb-2 text-gray-800 dark:text-gray-200">{generateQuestion()}</p>
        <div className="flex space-x-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="actionCompleted"
              checked={actionCompleted === true}
              onChange={() => setActionCompleted(true)}
              className="form-radio h-5 w-5 text-blue-600 dark:text-blue-500"
            />
            <span className="ml-2 text-gray-800 dark:text-gray-200">Yes</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              name="actionCompleted"
              checked={actionCompleted === false}
              onChange={() => setActionCompleted(false)}
              className="form-radio h-5 w-5 text-blue-600 dark:text-blue-500"
            />
            <span className="ml-2 text-gray-800 dark:text-gray-200">No</span>
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="comments" className="block font-medium mb-2 text-gray-800 dark:text-gray-200">
          Comments (optional)
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add any notes about your progress today..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          rows={3}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Log Today\'s Check-In'}
      </button>
    </form>
  );
};

export default DailyCheckInForm; 