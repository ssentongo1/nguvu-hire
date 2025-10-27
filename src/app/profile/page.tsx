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
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();
  const router = useRouter();

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
              skills: ""
            };
            setProfile(defaultProfile);
            return;
          }
        }
        
        if (!mounted) return;
        setProfile(data ?? null);
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

  if (loading) {
    return (
      <div
        className={`min-h-screen p-6 ${
          darkMode
            ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white"
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <div
          className={`max-w-xl mx-auto rounded-xl p-6 shadow-xl backdrop-blur-lg ${
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
      className={`min-h-screen p-6 ${
        darkMode
          ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      <div
        className={`max-w-2xl mx-auto rounded-xl p-6 shadow-xl backdrop-blur-lg ${
          darkMode ? "bg-white/5" : "bg-white"
        }`}
      >
        <ProfileFormWrapper profile={profile} />
      </div>
    </div>
  );
}