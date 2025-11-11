"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import ApplyForm from "@/components/ApplyForm";
import { countries } from "@/utils/countries";

type Job = {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferred_location?: string; 
  location: string;
  country: string;
  preferred_candidate_countries?: string[]; // CHANGED: Made optional
  cover_photo?: string | null;
  deadline?: string;  
  created_at: string;
  created_by: string;
  company?: string;
  work_location_type?: "remote" | "onsite" | "hybrid";
  remote_work_countries?: string[];
  job_type?: string;
  salary?: string;
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

  // Get country info
  const jobCountry = countries.find(c => c.code === job.country);
  const preferredCountries = job.preferred_candidate_countries?.map(code => 
    countries.find(c => c.code === code)
  ).filter(Boolean);

  // Work location type display
  const getWorkLocationDisplay = () => {
    if (job.work_location_type === "remote") return "🌍 Remote";
    if (job.work_location_type === "hybrid") return "🔀 Hybrid";
    return "🏢 On-site";
  };

  // Remote work countries display
  const getRemoteWorkCountries = () => {
    if (!job.remote_work_countries || job.remote_work_countries.length === 0) return null;
    
    return job.remote_work_countries.map(code => {
      const country = countries.find(c => c.code === code);
      return country ? `${country.flag} ${country.name}` : '';
    }).filter(Boolean).join(', ');
  };

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

  // Function to format text with bullet points
  const formatTextWithBullets = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
      
      return (
        <div key={index} className="flex items-start mb-2">
          {isBullet && <span className="mr-3 text-sm">•</span>}
          <span className={`${isBullet ? "flex-1" : ""} text-sm`}>{trimmedLine}</span>
        </div>
      );
    });
  };

  const handleApplyClick = () => {
    if (isApplyDisabled) {
      alert(`This job has expired. The application deadline was ${job.deadline ? formatDeadline(job.deadline) : 'already passed'}.`);
      return;
    }
    setShowApplyForm(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${bgPrimary} rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
          {/* Header */}
          <div className={`p-6 border-b ${borderColor}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${textPrimary}`}>
                  {job.title}
                </h2>
                <p className={`${textSecondary} mt-2 text-sm`}>
                  {job.company} • {job.location}, {jobCountry?.flag} {jobCountry?.name}
                </p>
                
                {/* Job Type and Salary */}
                <div className="flex flex-wrap gap-4 mt-3">
                  {job.job_type && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-purple-500/40 text-purple-100' : 'bg-purple-100 text-purple-800'
                    }`}>
                      💼 {job.job_type}
                    </span>
                  )}
                  
                  {job.salary && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-green-500/40 text-green-100' : 'bg-green-100 text-green-800'
                    }`}>
                      💰 {job.salary}
                    </span>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-blue-500/40 text-blue-100' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getWorkLocationDisplay()}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`${textMuted} hover:${textSecondary} text-2xl ml-4`}
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Cover Photo */}
            {job.cover_photo && (
              <div className="w-full h-80 bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden rounded-xl">
                <img
                  src={job.cover_photo}
                  alt={job.title}
                  className="w-full h-80 object-cover rounded-xl"
                />
              </div>
            )}

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preferred Candidate Countries */}
              {preferredCountries && preferredCountries.length > 0 && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-purple-500/20 border-purple-400' : 'bg-purple-50 border-purple-200'}`}>
                  <h4 className={`font-semibold mb-2 text-sm ${textPrimary}`}>🌍 Hiring From</h4>
                  <div className="flex flex-wrap gap-1">
                    {preferredCountries.map((country, index) => (
                      <span 
                        key={index}
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          darkMode ? 'bg-purple-400/40 text-purple-100' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {country?.flag} {country?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Remote Work Countries */}
              {getRemoteWorkCountries() && (
                <div className={`p-4 rounded-lg border ${darkMode ? 'bg-blue-500/20 border-blue-400' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className={`font-semibold mb-2 text-sm ${textPrimary}`}>📍 Remote Work Available In</h4>
                  <p className={`text-xs ${textSecondary}`}>{getRemoteWorkCountries()}</p>
                </div>
              )}
            </div>

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
                  <span className={`font-medium text-sm ${
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
                {isDeadlinePassed(job.deadline) && (
                  <p className={`text-xs mt-2 ${
                    darkMode ? 'text-red-300' : 'text-red-700'
                  }`}>
                    This job is no longer accepting applications.
                  </p>
                )}
              </div>
            )}

            {/* Job Description */}
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
                📝 Job Description
              </h3>
              <div className={`${textSecondary} whitespace-pre-line leading-relaxed text-sm`}>
                {formatTextWithBullets(job.description) || job.description}
              </div>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
                  🎯 Key Responsibilities
                </h3>
                <div className={`${textSecondary} leading-relaxed text-sm`}>
                  {formatTextWithBullets(job.responsibilities)}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
                  ✅ Requirements & Qualifications
                </h3>
                <div className={`${textSecondary} leading-relaxed text-sm`}>
                  {formatTextWithBullets(job.requirements)}
                </div>
              </div>
            )}

            {/* Preferred Location */}
            {job.preferred_location && (
              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>
                  📍 Preferred Location
                </h3>
                <p className={`${textSecondary} text-sm`}>
                  {job.preferred_location}
                </p>
              </div>
            )}
          </div>

          {/* Footer with Apply Button */}
          <div className={`p-6 border-t ${borderColor} ${bgSecondary} rounded-b-xl`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${textMuted}`}>
                Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={handleApplyClick}
                disabled={isApplyDisabled}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 ${
                  isApplyDisabled
                    ? 'bg-gray-400 text-white cursor-not-allowed hover:scale-100'
                    : darkMode
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isApplyDisabled ? 'Application Closed' : '🚀 Apply Now'}
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