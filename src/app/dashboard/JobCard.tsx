"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";
import { countries } from "@/utils/countries";
import { useTheme } from "@/context/ThemeContext";
import BoostButton from "@/components/BoostButton";

// Define Job type locally
type Job = {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferred_location?: string; 
  location: string;
  country: string;
  preferred_candidate_countries: string[];
  cover_photo?: string | null;
  deadline?: string;  
  created_at: string;
  created_by: string;
  company?: string;
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
};

type Props = {
  job: Job;
  onClick: () => void; // Open modal
  canDelete: boolean;
  onDelete: () => void;
  onViewProfile?: () => void;
};

export default function JobCard({ job, onClick, canDelete, onDelete, onViewProfile }: Props) {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Function to check if deadline is approaching (within 3 days)
  const isDeadlineApproaching = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return deadlineDate <= threeDaysFromNow && deadlineDate >= today;
  };

  // Function to check if deadline has passed
  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  // Format date for display
  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if the Apply button should be disabled
  const isApplyDisabled = job.deadline ? isDeadlinePassed(job.deadline) : false;

  // Get country info for display
  const jobCountry = countries.find(c => c.code === job.country);
  const preferredCountries = job.preferred_candidate_countries?.map(code => 
    countries.find(c => c.code === code)
  ).filter(Boolean) as { code: string; name: string; flag: string; }[];

  // Text color classes based on theme - matching dashboard gradient
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-700";
  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";

  // Check if job is boosted
  const isBoosted = job.boosted_posts && job.boosted_posts.length > 0 && job.boosted_posts[0]?.is_active;

  // UPDATED: Handle View Profile with onViewProfile prop
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the job modal
    console.log("🔍 View Profile clicked for job:", job.title);
    console.log("🆔 Poster ID (created_by):", job.created_by);
    console.log("🏢 Company:", job.company);
    
    // Use the onViewProfile prop if provided, otherwise use router
    if (onViewProfile) {
      onViewProfile(); // Use the prop function from dashboard
    } else {
      // Fallback to direct router navigation
      router.push(`/profile/${job.created_by}`);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the job modal
    if (isApplyDisabled) return;
    console.log("📝 Apply clicked for job:", job.title);
    setShowApplyForm(true);
  };

  const handleApplicationSuccess = () => {
    console.log("✅ Application submitted successfully for job:", job.id);
    // You can add any post-application logic here
  };

  return (
    <>
      <div
        className={`relative rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col ${
          darkMode ? "bg-gradient-to-br from-blue-700/90 via-purple-600/90 to-purple-800/90" : "bg-white"  // LIGHTER: More vibrant purple
        } ${isBoosted ? 'ring-2 ring-yellow-400' : ''}`}
        onClick={onClick} // Clicking anywhere opens read-only modal
      >
        {/* Boosted Badge */}
        {isBoosted && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded z-10 font-semibold flex items-center gap-1">
            <span>🚀</span>
            <span>Boosted</span>
          </div>
        )}

        {job.cover_photo && (
          <div className="w-full h-48 bg-gray-300 dark:bg-gray-700">
            <img
              src={job.cover_photo}
              alt={job.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className={`font-bold text-lg line-clamp-2 mb-1 ${textPrimary}`}>
            {job.title}
          </h3>
          
          {/* Company and Location with Country Flag */}
          <div className="mb-1">
            <p className={`text-xs line-clamp-2 ${textSecondary}`}>
              {job.company} • {job.location}
            </p>
            {jobCountry && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${textSecondary}`}>
                <span>{jobCountry.flag}</span>
                <span>{jobCountry.name}</span>
              </div>
            )}
          </div>
          
          {/* Preferred Candidate Countries */}
          {preferredCountries && preferredCountries.length > 0 && (
            <div className="mb-1">
              <p className={`text-xs mb-1 ${textMuted}`}>
                Prefers candidates from:
              </p>
              <div className="flex flex-wrap gap-1">
                {preferredCountries.slice(0, 2).map((country) => (
                  <span 
                    key={country.code}
                    className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full ${
                      darkMode 
                        ? "bg-purple-500/40 text-purple-100" 
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {country.flag} {country.name}
                  </span>
                ))}
                {preferredCountries.length > 2 && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full ${
                    darkMode 
                      ? "bg-purple-400/40 text-purple-200" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    +{preferredCountries.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Display Deadline */}
          {job.deadline && (
            <div className="mt-1 mb-2">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isDeadlinePassed(job.deadline) 
                  ? darkMode 
                    ? 'bg-red-500/40 text-red-100' 
                    : 'bg-red-100 text-red-800'
                  : isDeadlineApproaching(job.deadline)
                  ? darkMode
                    ? 'bg-yellow-500/40 text-yellow-100'
                    : 'bg-yellow-100 text-yellow-800'
                  : darkMode
                    ? 'bg-green-500/40 text-green-100'
                    : 'bg-green-100 text-green-800'
              }`}>
                <span className="mr-1">⏰</span>
                Deadline {formatDeadline(job.deadline)}
                {isDeadlinePassed(job.deadline) && ' (Expired)'}
                {isDeadlineApproaching(job.deadline) && !isDeadlinePassed(job.deadline) && ' (Soon)'}
              </div>
            </div>
          )}
          
          {/* Bottom row: date + buttons */}
          <div className="mt-auto flex justify-between items-center pt-3">
            <span className={`text-xs ${textMuted}`}>
              {new Date(job.created_at).toLocaleDateString()}
            </span>
            <div className="flex gap-2">
              {/* UPDATED: View Profile button with vibrant styling */}
              <button
                className="px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold flex items-center justify-center min-w-[100px]"
                onClick={handleViewProfile}
              >
                👔 View Company
              </button>
              <button
                className={`px-3 py-2 text-xs rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold flex items-center justify-center min-w-[80px] ${
                  isApplyDisabled
                    ? 'bg-gray-400 text-white cursor-not-allowed hover:scale-100'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                }`}
                onClick={handleApplyClick}
                disabled={isApplyDisabled}
              >
                {isApplyDisabled ? '❌ Expired' : '🚀 Apply'}
              </button>
            </div>
          </div>

          {/* Boost Button Section - Only show for post owners */}
          {canDelete && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <BoostButton 
                postId={job.id} 
                postType="job"
                onBoostSuccess={() => {
                  console.log('Job boosted successfully!')
                }}
              />
            </div>
          )}
        </div>

        {canDelete && (
          <button
            className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        )}
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