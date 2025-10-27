"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function BodyWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { darkMode } = useTheme();

  return (
    <body
      className={`${className} min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900"
      }`}
    >
      {/* Main content container with proper responsive padding */}
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </body>
  );
}