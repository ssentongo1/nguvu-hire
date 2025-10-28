"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    
    // Detect if it's an older browser (Samsung Note 4)
    const isOlderBrowser = !CSS.supports('display', 'grid');
    
    if (isOlderBrowser) {
      // Older browser - force light mode but don't override styles
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
      // Add a class to identify older browsers
      document.documentElement.classList.add('older-browser');
    } else if (storedTheme === "light") {
      // Modern browser with light mode preference
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (storedTheme === "dark") {
      // Modern browser with dark mode preference
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    // No else - keep default dark mode for modern browsers
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
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};