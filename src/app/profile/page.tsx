"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import ProfileFormWrapper from "./forms/ProfileFormWrapper";

interface Profile {
  id: string;
  role?: string;
  employer_type?: string | null;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  country?: string;
  bio?: string;
  skills?: string;
  company_name?: string;
  company_description?: string;
  profile_picture_url?: string;
  is_verified?: boolean;
  verified_at?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();
  const router = useRouter();
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          router.push("/");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Supabase error:", error);
          // If no profile exists, create a basic one with default role
          if (error.code === 'PGRST116') {
            const defaultProfile = {
              id: user.id,
              role: "job_seeker",
              first_name: "",
              last_name: "",
              phone_number: "",
              country: "",
              bio: "",
              skills: "",
              is_verified: false
            };
            setProfile(defaultProfile);
            return;
          }
        }
        
        if (!mounted) return;
        setProfile(data ?? null);

        // Get profile picture URL for display
        if (data?.profile_picture_url) {
          const imagePath = data.profile_picture_url;
          if (imagePath.startsWith("http")) {
            setImageUrl(imagePath);
          } else {
            const { data: urlData } = supabase.storage
              .from("profile-pictures")
              .getPublicUrl(imagePath);
            setImageUrl(urlData?.publicUrl ?? null);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleProfilePictureClick = () => {
    if (profile?.is_verified) return; // Do nothing if already verified
    
    // Owner clicking - show "Get Verified" prompt
    setShowVerificationPrompt(true);
  };

  const handleVerifyNow = () => {
    setShowVerificationPrompt(false);
    router.push("/pricing?verify=true");
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen p-4 sm:p-6 ${
          darkMode
            ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white"
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <div
          className={`max-w-2xl mx-auto rounded-xl p-4 sm:p-6 shadow-xl backdrop-blur-lg ${
            darkMode ? "bg-white/5" : "bg-white"
          }`}
        >
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 ${
        darkMode
          ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <div
        className={`max-w-2xl mx-auto rounded-xl p-4 sm:p-6 shadow-xl backdrop-blur-lg ${
          darkMode ? "bg-white/5" : "bg-white"
        }`}
      >
        {/* Profile Header with Verification Tick */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-400 bg-gray-300 dark:bg-gray-600 flex items-center justify-center cursor-pointer hover:border-purple-300 transition-colors"
              onClick={handleProfilePictureClick}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">{profile?.role === "employer" ? "🏢" : "👤"}</span>
              )}
            </div>
            
            {/* ALWAYS VISIBLE Verification Badge - Blue if verified, White/Grey if not */}
            <div 
              className={`absolute -bottom-1 -right-1 rounded-full p-1.5 border-2 ${
                darkMode ? "border-gray-800" : "border-white"
              } cursor-pointer transition-all ${
                profile?.is_verified 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : darkMode 
                    ? 'bg-gray-500 hover:bg-gray-400' 
                    : 'bg-gray-400 hover:bg-gray-500'
              } ${!profile?.is_verified ? 'hover:scale-110' : ''}`}
              onClick={handleProfilePictureClick}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {profile?.role === "employer" 
                  ? profile?.company_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || "Employer"
                  : `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || "User"
                }
              </h1>
              {profile?.is_verified && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {profile?.role === "employer" ? "🏢 Employer" : "👤 Job Seeker"}
              {profile?.country && ` • 📍 ${profile.country}`}
            </p>
          </div>
        </div>

        <ProfileFormWrapper profile={profile} />
      </div>

      {/* Verification Prompt Modal */}
      {showVerificationPrompt && (
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