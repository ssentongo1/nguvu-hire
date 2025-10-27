"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import ApplyForm from "@/components/ApplyForm";

type Job = {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferred_location?: string; 
  location: string;
  country: string;
  cover_photo?: string | null;
  deadline?: string;  
  created_at: string;
  created_by: string;
  company?: string;
};

type Props = {
  job: Job;
  onClose: () => void;
  readOnly?: boolean;
};

export default function JobModal({ job, onClose, readOnly = false }: Props) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const { darkMode } = useTheme();

  // Text color utilities - matching dashboard gradient
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-700";
  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const bgPrimary = darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white";
  const bgSecondary = darkMode ? "bg-purple-500/30" : "bg-gray-50";
  const borderColor = darkMode ? "border-purple-500" : "border-gray-200";

  // Deadline functions
  const isDeadlineApproaching = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return deadlineDate <= threeDaysFromNow && deadlineDate >= today;
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isApplyDisabled = job.deadline ? isDeadlinePassed(job.deadline) : false;

  const handleApplicationSuccess = () => {
    console.log("Application submitted successfully!");
    setShowApplyForm(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${bgPrimary} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
          {/* Header */}
          <div className={`p-6 border-b ${borderColor}`}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className={`text-2xl font-bold ${textPrimary}`}>
                  {job.title}
                </h2>
                <p className={`${textSecondary} mt-2`}>
                  {job.company} • {job.location}, {job.country}
                </p>
              </div>
              <button
                onClick={onClose}
                className={`${textMuted} hover:${textSecondary} text-2xl`}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Cover Photo - INCREASED SIZE */}
            {job.cover_photo && (
              <div className="w-full h-80 bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden"> {/* INCREASED: from h-64 to h-80 */}
                <img
                  src={job.cover_photo}
                  alt={job.title}
                  className="w-full h-80 object-cover rounded-lg"  /* INCREASED: from h-64 to h-80 */
                />
              </div>
            )}

            {/* Deadline */}
            {job.deadline && (
              <div className={`p-4 rounded-lg border ${
                isDeadlinePassed(job.deadline)
                  ? darkMode 
                    ? 'bg-red-500/30 border-red-400' 
                    : 'bg-red-50 border-red-200'
                  : isDeadlineApproaching(job.deadline)
                  ? darkMode
                    ? 'bg-yellow-500/30 border-yellow-400'
                    : 'bg-yellow-50 border-yellow-200'
                  : darkMode
                    ? 'bg-green-500/30 border-green-400'
                    : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center">
                  <span className={`mr-2 ${
                    isDeadlinePassed(job.deadline)
                      ? 'text-red-400'
                      : isDeadlineApproaching(job.deadline)
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}>⏰</span>
                  <span className={`font-medium ${
                    isDeadlinePassed(job.deadline)
                      ? darkMode ? 'text-red-300' : 'text-red-800'
                      : isDeadlineApproaching(job.deadline)
                      ? darkMode ? 'text-yellow-300' : 'text-yellow-800'
                      : darkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    Deadline: {formatDeadline(job.deadline)}
                    {isDeadlinePassed(job.deadline) && ' (Expired)'}
                    {isDeadlineApproaching(job.deadline) && !isDeadlinePassed(job.deadline) && ' (Soon)'}
                  </span>
                </div>
              </div>
            )}

            {/* Job Description */}
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>
                Job Description
              </h3>
              <p className={`${textSecondary} whitespace-pre-line`}>
                {job.description}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>
                  Key Responsibilities
                </h3>
                <p className={`${textSecondary} whitespace-pre-line`}>
                  {job.responsibilities}
                </p>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>
                  Requirements
                </h3>
                <p className={`${textSecondary} whitespace-pre-line`}>
                  {job.requirements}
                </p>
              </div>
            )}

            {/* Preferred Location */}
            {job.preferred_location && (
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>
                  Preferred Location
                </h3>
                <p className={`${textSecondary}`}>
                  {job.preferred_location}
                </p>
              </div>
            )}
          </div>

          {/* Footer with Apply Button */}
          <div className={`p-6 border-t ${borderColor} ${bgSecondary} rounded-b-xl`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${textMuted}`}>
                Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => setShowApplyForm(true)}
                disabled={isApplyDisabled}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  isApplyDisabled
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : darkMode
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isApplyDisabled ? 'Application Closed' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Form Modal */}
      {showApplyForm && (
        <ApplyForm
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.company}
          onClose={() => setShowApplyForm(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </>
  );
}