"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProfileSkeleton from "@/components/ProfileSkeleton";

const BUCKET = "profile-pictures";

type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  skills?: string | null;
  profile_picture?: string | null;
  role?: string | null;
  phone_number?: string | null;
  country?: string | null;
  email?: string | null;
  is_verified?: boolean;
  verified_at?: string;
};

export default function ProfileViewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };

    const fetchProfile = async () => {
      try {
        const userResp = await supabase.auth.getUser();
        const user = userResp.data?.user;

        if (!user) {
          router.push("/");
          return;
        }

        setUserEmail(user.email || "");
        setIsOwner(true); // This is the user's own profile view page

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, bio, skills, profile_picture, role, phone_number, country, is_verified, verified_at")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error.message);
        }

        if (!mounted) return;

        setProfile(data ?? null);

        if (data?.profile_picture) {
          const p = data.profile_picture;
          if (typeof p === "string" && p.startsWith("http")) {
            setImageUrl(p);
          } else if (typeof p === "string") {
            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(p);
            setImageUrl(urlData?.publicUrl ?? null);
          }
        } else {
          setImageUrl(null);
        }
      } catch (err: any) {
        console.error("Profile view fetch error:", err?.message ?? err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getCurrentUser();
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleProfilePictureClick = () => {
    if (profile?.is_verified) return; // Do nothing if already verified
    
    if (isOwner) {
      // Owner clicking - show "Get Verified" prompt
      setShowVerificationPrompt(true);
    } else {
      // Non-owner clicking - show "User not verified" message
      const userType = profile?.role === "employer" ? "employer" : "job seeker";
      alert(`This ${userType} is not verified. Verified ${userType}s have a blue checkmark and are prioritized in search results.`);
    }
  };

  const handleVerifyNow = () => {
    setShowVerificationPrompt(false);
    router.push("/pricing?verify=true");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="min-h-screen bg-white p-3 flex items-center justify-center">
        <div className="w-full max-w-lg bg-gray-50 rounded-lg p-6 text-center border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">No Profile Found</h3>
          <p className="text-xs text-gray-600 mb-6">Create your profile to get started</p>
          <button 
            onClick={() => router.push("/profile")} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Create Profile
          </button>
        </div>
      </div>
    );

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous User';

  return (
    <div className="min-h-screen bg-white p-3">
      {/* Zoomed-out Container - More desktop-like on mobile */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden">
        
        {/* Compact Header Row */}
        <div className="flex items-start p-4 border-b border-gray-200">
          <div className="flex-shrink-0 mr-4 relative">
            <div 
              className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={handleProfilePictureClick}
            >
              <img 
                src={imageUrl || "/default-icon.png"} 
                alt="Profile" 
                className="object-cover w-full h-full"
              />
            </div>
            {/* FIXED: ALWAYS VISIBLE Verification Badge - Blue if verified, White/Grey if not */}
            <div 
              className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white cursor-pointer transition-all ${
                profile.is_verified 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-400 hover:bg-gray-500'
              } ${!profile.is_verified ? 'hover:scale-110' : ''}`}
              onClick={handleProfilePictureClick}
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-gray-800 truncate">{fullName}</h1>
              {profile.is_verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-medium">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 capitalize mb-1">
              {profile.role?.replace('_', ' ') || 'User'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {profile.country && <span>📍 {profile.country}</span>}
              {profile.phone_number && <span>📞 {profile.phone_number}</span>}
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            <button 
              onClick={() => router.push("/profile")}
              className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Main Content Grid - Side by side layout */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column - Bio */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wide">About</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {profile.bio || "No bio provided yet."}
              </p>
            </div>

            {/* Right Column - Skills & Contact */}
            <div className="space-y-4">
              {/* Skills */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wide">Skills</h3>
                {profile.skills ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.split(',').map((skill, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No skills added</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wide">Contact</h3>
                <div className="space-y-2 text-xs">
                  {userEmail && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-20">Email:</span>
                      <span className="text-gray-700 font-medium truncate">{userEmail}</span>
                    </div>
                  )}
                  {profile.phone_number && (
                    <div className="flex items-center">
                      <span className="text-gray-500 w-20">Phone:</span>
                      <span className="text-gray-700 font-medium">{profile.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
            >
              Back to Dashboard
            </button>
            <div className="text-xs text-gray-500">
              Last updated: Today
            </div>
          </div>
        </div>
      </div>

      {/* Verification Prompt Modal - Only shown to owner */}
      {showVerificationPrompt && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Get Verified
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Verify your profile to build trust with other users and get priority visibility in search results.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-700">
                  Blue verification badge
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">↑</span>
                </div>
                <span className="text-sm text-gray-700">
                  Priority in search results
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">
                  Increased trust and credibility
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowVerificationPrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
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