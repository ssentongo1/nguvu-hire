"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  phone_number?: string;
  country?: string;
  role?: "job_seeker" | "employer";
  bio?: string;
  skills?: string;
  profile_picture?: string | null;
};

const roleDisplayMap: Record<string, string> = {
  job_seeker: "Job Seeker",
  employer: "Employer",
};

export default function EditProfilePage() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") console.error(error);

        if (!mounted) return;

        setProfile(
          data ?? {
            first_name: "",
            last_name: "",
            age: null,
            phone_number: "",
            country: "",
            role: "job_seeker",
            bio: "",
            skills: "",
            profile_picture: null,
          }
        );
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (mounted) {
          setInitialLoading(false);
          setTimeout(() => setVisible(true), 50);
        }
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const profileImageSrc = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return supabase.storage.from("profile-pictures").getPublicUrl(path).data?.publicUrl ?? null;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not logged in");

      let profilePath = profile?.profile_picture;

      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        profilePath = filePath;
      }

      const payload = {
        id: user.id,
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        age: profile?.age ?? null,
        phone_number: profile?.phone_number ?? "",
        country: profile?.country ?? "",
        role: profile?.role ?? "job_seeker",
        bio: profile?.bio ?? "",
        skills: profile?.skills ?? "",
        profile_picture: profilePath ?? null,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert([payload]);
      if (error) throw error;

      router.push("/profile");
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err?.message ?? "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Not logged in");

      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err?.message ?? "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"}`}>
        <div className={`max-w-3xl mx-auto rounded-2xl p-6 shadow-2xl backdrop-blur-lg ${darkMode ? "bg-white/5 text-white" : "bg-white text-gray-900"}`}>
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-gray-400" />
              <div className="h-6 bg-gray-400 w-32 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-400 rounded" />
              <div className="h-10 bg-gray-400 rounded" />
              <div className="h-10 bg-gray-400 rounded" />
              <div className="h-10 bg-gray-400 rounded" />
              <div className="h-16 bg-gray-400 rounded col-span-2" />
              <div className="h-10 bg-gray-400 rounded col-span-2" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-400 rounded" />
              <div className="h-10 w-24 bg-gray-400 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return <p className="p-6 text-center text-sm">No profile found.</p>;

  return (
    <div className={`min-h-screen p-6 flex justify-center items-center ${darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"}`}>
      <div className={`w-full max-w-3xl rounded-2xl p-6 shadow-2xl backdrop-blur-lg transition-all duration-300 transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${darkMode ? "bg-white/5 text-white" : "bg-white text-gray-900"}`}>
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

        <div className="flex items-center gap-6 mb-4">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500">
            {profile.profile_picture ? (
              <img src={profileImageSrc(profile.profile_picture) ?? ""} className="object-cover w-full h-full" alt="profile" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs">Change picture</span>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={profile.first_name ?? ""} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} placeholder="First Name" className={`p-3 rounded text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} />
          <input value={profile.last_name ?? ""} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} placeholder="Last Name" className={`p-3 rounded text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} />
          <input type="number" value={profile.age ?? ""} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} placeholder="Age" className={`p-3 rounded text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} />
          <input value={profile.phone_number ?? ""} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} placeholder="Phone Number" className={`p-3 rounded text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} />
          <input value={profile.country ?? ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} placeholder="Country" className={`p-3 rounded text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} />
          <select value={profile.role ?? "job_seeker"} onChange={(e) => setProfile({ ...profile, role: e.target.value as any })} className={`p-3 rounded text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`}>
            <option value="job_seeker">Job Seeker</option>
            <option value="employer">Employer</option>
          </select>
        </div>

        <textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio" className={`mt-4 p-3 rounded w-full text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} rows={4} />

        <input value={profile.skills ?? ""} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} placeholder="Skills (comma separated)" className={`mt-4 p-3 rounded w-full text-sm ${darkMode ? "bg-transparent border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-900"}`} />

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 px-5 py-2.5 rounded-lg font-semibold text-sm shadow transition-transform duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg ${
              darkMode
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-blue-300 hover:bg-blue-200 text-gray-900"
            }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className={`flex-1 px-5 py-2.5 rounded-lg font-semibold text-sm shadow transition-transform duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg ${
              darkMode
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-red-300 hover:bg-red-200 text-gray-900"
            }`}
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>

          <button
            onClick={() => router.push("/availability")}
            className={`flex-1 px-5 py-2.5 rounded-lg font-semibold text-sm shadow transition-transform duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg ${
              darkMode
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-green-300 hover:bg-green-200 text-gray-900"
            }`}
          >
            Post Availability
          </button>
        </div>
      </div>
    </div>
  );
}