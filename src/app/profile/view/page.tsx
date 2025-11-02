"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProfileSkeleton from "@/components/ProfileSkeleton";

const BUCKET = "profile-pictures";

type Profile = {
  id: string;
  bio?: string | null;
  skills?: string | null;
  profile_picture?: string | null;
};

export default function ProfileViewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

        const { data, error } = await supabase
          .from("profiles")
          .select("id, bio, skills, profile_picture")
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-4 sm:p-6 text-white">
        <div className="max-w-md w-full bg-white/5 p-4 sm:p-6 rounded-2xl shadow-lg">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="p-4 sm:p-6 text-white text-center">
        <div className="max-w-md mx-auto bg-white/5 p-6 rounded-2xl">
          <p>No profile found.</p>
          <button 
            onClick={() => router.push("/profile")} 
            className="mt-4 px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors w-full sm:w-auto"
          >
            Create Profile
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-4 sm:p-6 text-white">
      <div className="max-w-md w-full bg-white/5 p-4 sm:p-6 rounded-2xl shadow-lg">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-purple-400">
            <img 
              src={imageUrl || "/default-icon.png"} 
              alt="Profile" 
              className="object-cover w-full h-full"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mt-4">My Profile</h2>
        </div>

        {/* Profile Details */}
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm text-purple-300 font-semibold">Bio</h3>
            <p className="mt-2 text-white/90 text-sm sm:text-base">
              {profile.bio || "No bio provided."}
            </p>
          </div>

          <div>
            <h3 className="text-sm text-purple-300 font-semibold">Skills</h3>
            <p className="mt-2 text-white/90 text-sm sm:text-base">
              {profile.skills || "No skills added."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button 
            className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm sm:text-base flex-1"
            onClick={() => router.push("/profile")}
          >
            Edit Profile
          </button>
          <button 
            className="px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-sm sm:text-base flex-1"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}