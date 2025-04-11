import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-gray-200"></div>
    </div>
  );
};

export default LoadingSpinner; 