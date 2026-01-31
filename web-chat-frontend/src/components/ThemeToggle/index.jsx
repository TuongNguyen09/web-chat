import React from 'react';
import { BsSun, BsMoon } from 'react-icons/bs';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-10 h-10 rounded-full
        transition-all duration-300 ease-in-out
        ${
          isDark
            ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark ? 'focus:ring-yellow-400' : 'focus:ring-gray-400'}
      `}
      title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <BsSun className="w-5 h-5" />
      ) : (
        <BsMoon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
