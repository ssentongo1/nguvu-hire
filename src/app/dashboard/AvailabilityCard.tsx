"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BoostButton from "@/components/BoostButton";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

// Define Availability type locally
type Availability = {
  id: string;
  name: string;
  desired_job: string;
  skills: string;
  location: string;
  country: string;
  availability: string;
  description: string;
  cv?: string;
  cover_image?: string;
  created_at: string;
  created_by: string;
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
};

type Props = {
  availability: Availability;
  onClick: () => void;
  canDelete: boolean;
  onDelete: () => void;
  onHire?: () => void;
  onViewProfile?: () => void;
  showHireButton?: boolean;
};

export default function AvailabilityCard({ 
  availability, 
  onClick, 
  canDelete, 
  onDelete,
  onHire,
  onViewProfile,
  showHireButton = false 
}: Props) {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [isPosterVerified, setIsPosterVerified] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      setIsOwner(user?.id === availability.created_by);
    };

    const checkPosterVerification = async () => {
      try {
        if (!availability.created_by) {
          console.error("No created_by field found for availability:", availability.id);
          setHasProfile(false);
          return;
        }

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("is_verified")
          .eq("id", availability.created_by)
          .single();

        if (error) {
          console.error("Error checking poster verification:", error);
          setHasProfile(false);
          return;
        }

        if (profileData) {
          setIsPosterVerified(profileData.is_verified || false);
          setHasProfile(true);
        }
      } catch (error) {
        console.error("Error checking poster verification:", error);
        setHasProfile(false);
      } finally {
        setLoadingVerification(false);
      }
    };

    getCurrentUser();
    checkPosterVerification();
  }, [availability.created_by, availability.id]);

  // Handle verification badge click
  const handleVerificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPosterVerified) return; // Do nothing if already verified
    
    if (isOwner) {
      // Owner clicking - show "Get Verified" prompt
      setShowVerificationPrompt(true);
    } else {
      // Non-owner clicking - show "User not verified" message
      alert("This job seeker is not verified. Verified job seekers have a blue checkmark and are prioritized in search results.");
    }
  };

  const handleVerifyNow = () => {
    setShowVerificationPrompt(false);
    router.push("/pricing?verify=true");
  };

  // UPDATED: Handle View Profile with better error handling
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("🔍 View Profile clicked for availability:", availability.desired_job);
    console.log("🆔 Poster ID (created_by):", availability.created_by);
    
    if (!availability.created_by) {
      alert("Unable to view profile: No profile information available for this job seeker.");
      return;
    }

    if (!hasProfile) {
      alert("This job seeker hasn't set up their profile yet.");
      return;
    }

    if (onViewProfile) {
      onViewProfile();
    } else {
      router.push(`/profile/${availability.created_by}`);
    }
  };

  // Check if availability is boosted
  const isBoosted = availability.boosted_posts && availability.boosted_posts.length > 0 && availability.boosted_posts[0]?.is_active;

  return (
    <div
      className={`relative bg-white/10 dark:bg-white/5 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col ${
        isBoosted ? 'ring-2 ring-yellow-400' : ''
      }`}
      onClick={onClick}
    >
      {/* Boosted Badge */}
      {isBoosted && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded z-10 font-semibold flex items-center gap-1">
          <span>🚀</span>
          <span>Boosted</span>
        </div>
      )}

      {/* ALWAYS VISIBLE Verification Badge - Blue if verified, White/Grey if not */}
      {!loadingVerification && hasProfile && (
        <div 
          className={`absolute top-2 right-2 text-xs px-2 py-1 rounded z-10 font-semibold flex items-center gap-1 cursor-pointer transition-all ${
            isPosterVerified 
              ? 'bg-blue-500 text-white' 
              : darkMode 
                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } ${!isPosterVerified ? 'hover:scale-105' : ''}`}
          onClick={handleVerificationClick}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>{isPosterVerified ? 'Verified' : 'Verify'}</span>
        </div>
      )}

      {availability.cover_image && (
        <img
          src={availability.cover_image}
          alt={availability.desired_job}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-sm line-clamp-1">{availability.desired_job}</h3>
        <p className="text-xs line-clamp-2">
          {availability.name} • {availability.location}, {availability.country}
        </p>
        
        {/* Skills Preview */}
        {availability.skills && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              Skills: {availability.skills}
            </p>
          </div>
        )}
        
        {/* Bottom row: date + buttons */}
        <div className="mt-auto flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0">
          <span className="text-xs text-gray-400">
            {new Date(availability.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2 w-full xs:w-auto">
            {/* View Profile Button - Enhanced */}
            <button
              className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold flex items-center justify-center flex-1 xs:flex-none min-w-[100px]"
              onClick={handleViewProfile}
            >
              👤 View Profile
            </button>
            
            {/* Hire Button - Enhanced */}
            {showHireButton && onHire && (
              <button
                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold flex items-center justify-center flex-1 xs:flex-none min-w-[70px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onHire();
                }}
              >
                💼 Hire
              </button>
            )}
          </div>
        </div>

        {/* Boost Button Section - Only show for post owners */}
        {canDelete && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <BoostButton 
              postId={availability.id} 
              postType="availability"
              onBoostSuccess={() => {
                console.log('Availability boosted successfully!')
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

      {/* Verification Prompt Modal - Only shown to owner */}
      {showVerificationPrompt && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 max-w-md w-full ${
            darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white"
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Get Verified
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? "text-gray-200" : "text-gray-600"}`}>
              Verify your profile to build trust with other users and get priority visibility in search results.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Blue verification badge
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">↑</span>
                </div>
                <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Priority in search results
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Increased trust and credibility
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowVerificationPrompt(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  darkMode 
                    ? "bg-gray-600 text-white hover:bg-gray-700" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Maybe Later
              </button>
              <button
                onClick={handleVerifyNow}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
              >
                Verify Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}