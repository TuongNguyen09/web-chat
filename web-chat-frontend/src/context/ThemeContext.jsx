import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      // User has saved preference
      setIsDark(savedTheme === 'dark');
    } else {
      // Fall back to system preference
      setIsDark(prefersDark);
    }
    
    setIsInitialized(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!isInitialized) return;
    
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme-mode', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme-mode', 'light');
    }
  }, [isDark, isInitialized]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const setTheme = (mode) => {
    setIsDark(mode === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, isInitialized }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
