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
    
    // Very simple detection - only add class if absolutely necessary
    const isVeryOldBrowser = !window.CSS || !CSS.supports('color', 'var(--test)');
    
    if (isVeryOldBrowser) {
      // Only add a class, don't change theme logic
      document.documentElement.classList.add('older-browser');
    }
    
    if (storedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    // Keep default dark mode for modern browsers
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