import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  useQuery,
  getLifeCoachGoal,
  getLifeCoachChatHistory, 
  sendLifeCoachChatMessage as sendMessage
} from 'wasp/client/operations';
import { v4 as uuidv4 } from 'uuid';
import LoadingSpinner from '../shared/LoadingSpinner';
import ChatMessage from './components/ChatMessage';

const LifeCoachChatPage: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => {
    // Use existing session ID from localStorage or create a new one
    const savedSessionId = localStorage.getItem('lifecoach_session_id');
    const newSessionId = savedSessionId || uuidv4();
    if (!savedSessionId) {
      localStorage.setItem('lifecoach_session_id', newSessionId);
    }
    return newSessionId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the user's goal to ensure they have one
  const { data: goal, isLoading: isLoadingGoal, error: goalError } = useQuery(getLifeCoachGoal);
  
  // Fetch chat history
  const { 
    data: chatHistory = [], 
    isLoading: isLoadingHistory, 
    error: historyError,
    refetch: refetchHistory
  } = useQuery(getLifeCoachChatHistory, { sessionId });

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage({
        content: messageInput.trim(),
        sessionId
      });
      
      // Clear input and refetch messages
      setMessageInput('');
      await refetchHistory();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Create a new chat session
  const handleNewChat = () => {
    const newSessionId = uuidv4();
    localStorage.setItem('lifecoach_session_id', newSessionId);
    window.location.reload(); // Simple way to reset the entire component
  };

  // If goal is loading or there's an error
  if (isLoadingGoal) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If no goal is set, prompt the user to create one
  if (!goal) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Set Your Goal First</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Before chatting with your Life Coach, you need to set up your personal goal.
        </p>
        <Link
          to="/lifecoach/onboarding"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Set Up Your Goal
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Link 
            to="/lifecoach" 
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat with Your Life Coach</h1>
        </div>
        <button
          onClick={handleNewChat}
          className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          New Chat
        </button>
      </div>

      {/* Goal Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-3 mb-4 text-sm">
        <p className="text-blue-800 dark:text-blue-300">
          <span className="font-medium">Your Goal:</span> {goal.goalDescription}
        </p>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-inner">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
          </div>
        ) : historyError ? (
          <div className="text-red-500 dark:text-red-400 text-center">
            Error loading messages: {historyError.message}
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-10">
            <p className="mb-2">No messages yet!</p>
            <p>Send a message to start talking with your Life Coach.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chatHistory.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUserMessage={message.isUserMessage}
                timestamp={new Date(message.createdAt)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex items-center">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !messageInput.trim()}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-r-md hover:bg-blue-700 dark:hover:bg-blue-800 transition disabled:opacity-50 flex items-center"
        >
          {sending ? (
            <LoadingSpinner />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default LifeCoachChatPage; 