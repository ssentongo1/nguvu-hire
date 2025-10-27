// src/app/profile/view/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ProfileSkeleton from "@/components/ProfileSkeleton";

const BUCKET = "profile-pictures"; // <-- keep in sync with the rest of your app

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

        // IMPORTANT: select id so our Profile type is satisfied
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

  // === SHOW THE SAME PROFILE SKELETON WHILE LOADING ===
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-6 text-white">
        <div className="max-w-md w-full bg-white/5 p-6 rounded-2xl shadow-lg">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="p-6">
        No profile found.{" "}
        <button onClick={() => router.push("/profile")} className="ml-2 underline">
          Create one
        </button>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black p-6 text-white">
      <div className="max-w-md w-full bg-white/5 p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-400">
            <img src={imageUrl || "/default-icon.png"} alt="Profile" className="object-cover w-full h-full" />
          </div>

          <h2 className="text-2xl font-bold mt-4">My Profile</h2>
        </div>

        <div className="mt-6">
          <h3 className="text-sm text-purple-300 font-semibold">Bio</h3>
          <p className="mt-2 text-white/90">{profile.bio || "No bio provided."}</p>

          <h3 className="text-sm text-purple-300 font-semibold mt-4">Skills</h3>
          <p className="mt-2 text-white/90">{profile.skills || "No skills added."}</p>
        </div>

        <div className="mt-6 flex justify-between">
          <button className="px-4 py-2 rounded-lg bg-white/5" onClick={() => router.push("/profile")}>
            Edit
          </button>
          <button className="px-4 py-2 rounded-lg bg-purple-600" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
