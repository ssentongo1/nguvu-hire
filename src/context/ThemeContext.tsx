"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(true);

  // Load theme from localStorage on mount with browser detection
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    
    // Check if browser supports modern CSS (older browsers will default to light mode)
    const isModernBrowser = typeof CSS !== 'undefined' && CSS.supports('color', 'var(--test)');
    
    if (!isModernBrowser) {
      // Older browser - force light mode for better compatibility
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
    } else if (storedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      // Default to system preference for modern browsers
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {/* Fallback container for older browsers */}
      <div className={darkMode ? '' : 'light-mode-fallback'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};