import React from 'react';
import { Link } from 'react-router-dom';
import { NavigationItem } from './NavBar';

export const contentSections: NavigationItem[] = [
  {
    name: 'Agent',
    to: '/agent',
  },
  {
    name: 'Meal Plan',
    to: '/meal-plan',
  },
  {
    name: 'Life Coach',
    to: '/lifecoach',
  },
];

export function NavContent() {
  return (
    <nav className="flex space-x-4">
      {contentSections.map((section) => (
        <Link
          key={section.to}
          to={section.to}
          className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          {section.name}
        </Link>
      ))}
    </nav>
  );
} 