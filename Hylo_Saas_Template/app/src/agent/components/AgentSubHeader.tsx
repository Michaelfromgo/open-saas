import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Agent', path: '/agent' },
  { name: 'Tasks', path: '/agent/tasks' },
  { name: 'Settings', path: '/agent/settings' },
];

export default function AgentSubHeader() {
  const location = useLocation();
  
  return (
    <div className="w-full mb-6">
      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow dark:shadow-gray-700/20 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Research Assistant</h1>
        <nav className="flex space-x-1 md:space-x-4 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === item.path || 
                (item.path === '/agent' && location.pathname.startsWith('/agent') && 
                 location.pathname !== '/agent/tasks' && location.pathname !== '/agent/settings')
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
} 