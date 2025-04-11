import React from 'react';

type ChatMessageProps = {
  content: string;
  isUserMessage: boolean;
  timestamp: Date;
};

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isUserMessage, timestamp }) => {
  // Format the timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUserMessage
            ? 'bg-blue-600 dark:bg-blue-700 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">{content}</div>
        <div
          className={`text-xs mt-1 ${
            isUserMessage ? 'text-blue-200 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 