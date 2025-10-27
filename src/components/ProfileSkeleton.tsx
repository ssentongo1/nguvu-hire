"use client";
import React from "react";

export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse min-h-[400px] p-6 space-y-4">
      <div className="flex items-center gap-6">
        <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-700" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 w-32 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-16 bg-gray-300 dark:bg-gray-700 rounded col-span-2" />
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded col-span-2" />
      </div>
      <div className="flex gap-3 mt-4">
        <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
