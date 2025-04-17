import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow-sm">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 40 40" 
                className="h-8 w-auto mr-3"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="40" height="40" rx="8" fill="#00A0FF" />
                <path d="M12 14H28M12 20H28M12 26H20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="28" cy="26" r="3" fill="white" />
              </svg>
              <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                Healio
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to="/chat"
              className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400"
            >
              Start Consultation
            </Link>
            <Link
              to="/summary"
              className="text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400"
            >
              Patient History
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;