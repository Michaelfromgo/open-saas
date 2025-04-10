import React from 'react';
import { Link } from 'react-router-dom';
import { NavigationItem } from './NavBar';

export const contentSections: NavigationItem[] = [
  {
    name: 'Home',
    to: '/',
  },
  {
    name: 'Agent',
    to: '/agent',
  },
  {
    name: 'Tasks',
    to: '/agent/tasks',
  },
  {
    name: 'Settings',
    to: '/agent/settings',
  },
  {
    name: 'File Upload',
    to: '/file-upload',
  },
  {
    name: 'Meal Plan',
    to: '/meal-plan',
  },
  {
    name: 'Admin',
    to: '/admin',
  },
];

export function NavContent() {
  return (
    <nav className="flex space-x-4">
      {contentSections.map((section) => (
        <Link
          key={section.to}
          to={section.to}
          className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
        >
          {section.name}
        </Link>
      ))}
    </nav>
  );
} 