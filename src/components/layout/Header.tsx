
import React from 'react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const getInitials = (displayName: string | null, email: string | null) => {
    if (displayName && displayName.trim()) {
      const names = displayName.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const displayName = user.displayName || user.email || 'User';
  const initials = getInitials(user.displayName, user.email);

  return (
    <header className="flex items-center justify-end h-16 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="sr-only">View notifications</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">{displayName}</span>
          {user.photoURL ? (
            <img src={user.photoURL} alt={displayName || 'User'} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
