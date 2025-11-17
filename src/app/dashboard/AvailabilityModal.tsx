"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";

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
};

type Props = {
  availability: Availability;
  onClose: () => void;
  readOnly?: boolean;
  onHire?: (availability: Availability) => void; // NEW: Add this prop
};

export default function AvailabilityModal({ availability, onClose, readOnly = false, onHire }: Props) {
  const { darkMode } = useTheme();
  const [isPosterVerified, setIsPosterVerified] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(true);
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
      alert("Get verified to build trust with employers and get priority visibility in search results. Click 'Verify Now' to proceed.");
    } else {
      // Non-owner clicking - show "User not verified" message
      alert("This job seeker is not verified. Verified job seekers have a blue checkmark and are prioritized in search results.");
    }
  };

  // Function to format text with bullet points (same as JobModal)
  const renderTextWithBullets = (text: string) => {
    if (!text) return <p className="text-gray-500 italic text-sm">No information provided</p>;
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
          
          if (isBullet) {
            const content = trimmedLine.substring(1).trim();
            return (
              <div key={index} className="flex items-start">
                <span className="mr-2 mt-0.5 text-sm">•</span>
                <span className="text-sm">{content}</span>
              </div>
            );
          }
          
          return (
            <div key={index} className="text-sm">
              {trimmedLine}
            </div>
          );
        })}
      </div>
    );
  };

  // UPDATED: Handle hire button click - use the onHire prop instead of immediate action
  const handleHireClick = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user) {
        alert("Please log in to hire candidates");
        return;
      }

      // Get employer profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, company_name, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "employer") {
        alert("Only employers can hire candidates");
        return;
      }

      if (availability.created_by === user.id) {
        alert("You cannot hire yourself");
        return;
      }

      // If onHire prop is provided, use it (this will open the HireModal)
      if (onHire) {
        onHire(availability);
        onClose(); // Close the availability modal
      }
      
    } catch (error: any) {
      console.error("Error checking hire permission:", error);
      alert("Failed to initiate hire request: " + error.message);
    }
  };

  // Check if current user is an employer and not the owner of this availability
  const canHire = async (): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      if (!user) return false;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      return profile?.role === "employer" && availability.created_by !== user.id;
    } catch (error) {
      console.error("Error checking hire permission:", error);
      return false;
    }
  };

  const [isEmployer, setIsEmployer] = React.useState(false);

  React.useEffect(() => {
    const checkHirePermission = async () => {
      const canHireResult = await canHire();
      setIsEmployer(canHireResult);
    };
    
    checkHirePermission();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative ${
          darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white"
        }`}
      >
        <button
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
            darkMode 
              ? "bg-purple-500 text-white hover:bg-purple-600"
              : "bg-gray-200 text-gray-500 hover:bg-gray-300"
          }`}
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Image - INCREASED SIZE */}
        {availability.cover_image && (
          <div className="w-full h-80 bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            <img
              src={availability.cover_image}
              alt={availability.desired_job}
              className="w-full h-80 object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {availability.desired_job}
              </h2>
              {/* FIXED: Verification Badge in Modal - ALWAYS VISIBLE */}
              {!loadingVerification && hasProfile && (
                <div 
                  className={`text-xs px-2 py-1 rounded font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    isPosterVerified 
                      ? 'bg-blue-500 text-white' 
                      : darkMode 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                  } ${!isPosterVerified ? 'hover:scale-105' : ''}`}
                  onClick={handleVerificationClick}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span>{isPosterVerified ? 'Verified' : 'Verify'}</span>
                </div>
              )}
            </div>
            <p className={`text-lg mb-1 font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
              {availability.name}
            </p>
            <p className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
              📍 {availability.location}, {availability.country}
            </p>
          </div>

          {/* Skills */}
          {availability.skills && (
            <div className="mb-6">
              <h3 className={`font-semibold text-sm mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Skills & Expertise
              </h3>
              <div className={`text-sm leading-relaxed ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}>
                {renderTextWithBullets(availability.skills)}
              </div>
            </div>
          )}

          {/* Availability Details */}
          {availability.availability && (
            <div className="mb-6">
              <h3 className={`font-semibold text-sm mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Availability
              </h3>
              <div className={`text-sm leading-relaxed ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}>
                {renderTextWithBullets(availability.availability)}
              </div>
            </div>
          )}

          {/* Description */}
          {availability.description && (
            <div className="mb-6">
              <h3 className={`font-semibold text-sm mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Additional Information
              </h3>
              <div className={`text-sm leading-relaxed ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}>
                {renderTextWithBullets(availability.description)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 border-t border-purple-500 dark:border-purple-500 flex gap-4">
            {/* CV Download */}
            {availability.cv && (
              <a
                href={availability.cv}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm transition ${
                  darkMode 
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                📄 Download CV/Resume
              </a>
            )}

            {/* UPDATED: Hire Button - Now uses the onHire prop to open the HireModal */}
            {isEmployer && (
              <button
                onClick={handleHireClick}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm transition ${
                  darkMode 
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                💼 Hire This Candidate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}