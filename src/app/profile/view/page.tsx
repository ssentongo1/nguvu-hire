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
};

export default function ProfileViewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const userResp = await supabase.auth.getUser();
        const user = userResp.data?.user;

        if (!user) {
          router.push("/");
          return;
        }

        setUserEmail(user.email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, bio, skills, profile_picture, role, phone_number, country")
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

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [router]);

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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Profile Found</h3>
          <p className="text-gray-600 mb-6">Create your profile to get started</p>
          <button 
            onClick={() => router.push("/profile")} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
          <div className="flex-shrink-0 mr-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
              <img 
                src={imageUrl || "/default-icon.png"} 
                alt="Profile" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 truncate">{fullName}</h1>
            <p className="text-gray-600 text-sm capitalize mb-1">
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
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">About</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {profile.bio || "No bio provided yet."}
              </p>
            </div>

            {/* Right Column - Skills & Contact */}
            <div className="space-y-4">
              {/* Skills */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Skills</h3>
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
                  <p className="text-gray-500 text-sm">No skills added</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Contact</h3>
                <div className="space-y-2 text-sm">
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
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </button>
            <div className="text-xs text-gray-500">
              Last updated: Today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}