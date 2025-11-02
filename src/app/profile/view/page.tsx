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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4 flex items-center justify-center">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">👤</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Profile Found</h3>
          <p className="text-gray-600 mb-6">Create your profile to get started</p>
          <button 
            onClick={() => router.push("/profile")} 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg active:scale-95"
          >
            Create Profile
          </button>
        </div>
      </div>
    );

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4 flex items-center justify-center">
      {/* Mobile-Optimized Profile Card */}
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header with Profile Image */}
        <div className="relative pt-8 px-6 text-center">
          <div className="relative">
            <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
              <img 
                src={imageUrl || "/default-icon.png"} 
                alt="Profile" 
                className="object-cover w-full h-full"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-1">{fullName}</h1>
          <p className="text-gray-500 text-sm capitalize mb-2">
            {profile.role?.replace('_', ' ') || 'User'}
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center space-x-6 mt-4 mb-2">
            <div className="text-center">
              <div className="text-gray-800 font-bold">12</div>
              <div className="text-gray-500 text-xs">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-gray-800 font-bold">48</div>
              <div className="text-gray-500 text-xs">Following</div>
            </div>
            <div className="text-center">
              <div className="text-gray-800 font-bold">127</div>
              <div className="text-gray-500 text-xs">Followers</div>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
          <div className="space-y-3">
            {userEmail && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600">✉️</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Email</p>
                  <p className="text-gray-800 text-sm font-medium truncate">{userEmail}</p>
                </div>
              </div>
            )}
            
            {profile.phone_number && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600">📱</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Phone</p>
                  <p className="text-gray-800 text-sm font-medium">{profile.phone_number}</p>
                </div>
              </div>
            )}
            
            {profile.country && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-green-600">🌍</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Location</p>
                  <p className="text-gray-800 text-sm font-medium">{profile.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></span>
            About Me
          </h3>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <p className="text-gray-700 text-sm leading-relaxed">
              {profile.bio || "No bio provided yet. Add a bio to tell others about yourself."}
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="px-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></span>
            Skills & Expertise
          </h3>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            {profile.skills ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(',').map((skill, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium shadow-sm"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-2">No skills added yet</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 mt-4">
          <div className="flex space-x-3">
            <button 
              className="flex-1 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              onClick={() => router.push("/profile")}
            >
              Edit
            </button>
            <button 
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 active:scale-95 transition-all shadow-lg"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}