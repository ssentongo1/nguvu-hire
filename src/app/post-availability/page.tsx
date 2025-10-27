"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import BoostPromotionBanner from "@/components/BoostPromotionBanner";

export default function PostAvailabilityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useTheme();

  const [profile, setProfile] = useState<{ role?: string } | null>(null);
  const [name, setName] = useState("");
  const [desiredJob, setDesiredJob] = useState("");
  const [country, setCountry] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setProfile(data ?? null);
    };
    fetchProfile();
  }, []);

  // Check if we're in edit mode and fetch availability data
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingAvailabilityId(editId);
      fetchAvailabilityData(editId);
    }
  }, [searchParams]);

  const fetchAvailabilityData = async (availabilityId: string) => {
    try {
      const { data: availability, error } = await supabase
        .from("availabilities")
        .select("*")
        .eq("id", availabilityId)
        .single();

      if (error) throw error;
      if (availability) {
        setName(availability.name || "");
        setDesiredJob(availability.desired_job || "");
        setCountry(availability.country || "");
        setSkills(availability.skills || "");
        setLocation(availability.location || "");
        setAvailability(availability.availability || "");
        setCvUrl(availability.cv || "");
        setCoverImage(availability.cover_image || "");
      }
    } catch (error) {
      console.error("Error fetching availability data:", error);
      alert("Error loading availability data");
    }
  };

  const handleUploadFile = async (file: File, bucket: string, setUrl: (url: string) => void) => {
    if (!file) return;
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      if (!data.publicUrl) throw new Error("Failed to get public URL");

      setUrl(data.publicUrl);
    } catch (err: any) {
      console.error(`Error uploading file to ${bucket}:`, err.message);
      alert(`Error uploading file: ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (profile?.role === "employer") {
        alert("Only job seekers can post availability");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      if (isEditing && editingAvailabilityId) {
        // Update existing availability
        console.log("=== DEBUG AVAILABILITY UPDATE ===");
        console.log("Availability ID:", editingAvailabilityId);
        console.log("User ID:", userId);
        console.log("Data:", {
          name,
          desired_job: desiredJob,
          country,
          skills,
          location,
          availability,
          cv: cvUrl || null,
          cover_image: coverImage || null,
          description: availability,
        });

        const { data, error } = await supabase
          .from("availabilities")
          .update({
            name: name,
            desired_job: desiredJob,
            country: country,
            skills: skills,
            location: location,
            availability: availability,
            cv: cvUrl || null,
            cover_image: coverImage || null,
            description: availability,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAvailabilityId)
          .eq("created_by", userId)
          .select(); // Add .select() to get the updated data back

        if (error) {
          console.error("Update error:", error);
          throw error;
        }

        console.log("Update successful, returned data:", data);
        
        alert("Availability updated successfully!");
        
        // Force refresh by redirecting to profile with cache busting
        router.push("/profile?refresh=" + Date.now());
        return;
      } else {
        // Create new availability
        const { error } = await supabase.from("availabilities").insert([
          {
            name,
            desired_job: desiredJob,
            country,
            skills,
            location,
            availability,
            cv: cvUrl || null,
            cover_image: coverImage || null,
            description: availability,
            created_by: userId,
          },
        ]);

        if (error) {
          console.error("Database error:", error);
          throw error;
        }
        alert("Availability posted successfully!");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Error posting availability:", err.message);
      alert("Error posting availability: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Form input classes for consistent styling
  const inputClasses = `w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all duration-200 ${
    darkMode 
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-indigo-500"
  }`;

  const labelClasses = `block text-sm font-semibold mb-2 ${
    darkMode ? "text-gray-200" : "text-gray-700"
  }`;

  const sectionClasses = `p-6 rounded-xl border-2 border-dashed ${
    darkMode ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
  }`;

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {isEditing ? "Edit Availability" : "Post Your Availability"}
          </h1>
          <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {isEditing ? "Update your availability information" : "Let employers know you're available and ready to work"}
          </p>
        </div>

        {/* Boost Promotion Banner */}
        <BoostPromotionBanner userType="job_seeker" />

        <form onSubmit={handleSubmit} className={`rounded-2xl shadow-xl p-8 border transition-colors duration-300 ${
          darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
        }`}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Desired Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Developer, Project Manager"
                  value={desiredJob}
                  onChange={(e) => setDesiredJob(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Country *</label>
                <input
                  type="text"
                  placeholder="Your country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Location / City *</label>
                <input
                  type="text"
                  placeholder="Your city or preferred work location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className={labelClasses}>Skills & Expertise</label>
              <textarea
                placeholder="List your key skills, technologies, and areas of expertise (e.g., JavaScript, React, Project Management, UI/UX Design)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>

            {/* Availability Details */}
            <div>
              <label className={labelClasses}>Availability Details</label>
              <textarea
                placeholder="Describe your availability, preferred work type (full-time, part-time, contract), start date, and any other relevant information..."
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CV Upload */}
              <div className={sectionClasses}>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>📄 Upload CV / Resume</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleUploadFile(e.target.files[0], "availability-cvs", setCvUrl)}
                  className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                    darkMode 
                      ? "text-gray-300 file:bg-indigo-900 file:text-indigo-200 hover:file:bg-indigo-800" 
                      : "text-gray-500 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  }`}
                />
                {cvUrl && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    darkMode ? "bg-green-900 text-green-200" : "bg-green-50 text-green-700"
                  }`}>
                    <p className="text-sm font-medium">✓ CV Uploaded Successfully</p>
                    <p className="text-xs truncate">{cvUrl.split("/").pop()}</p>
                  </div>
                )}
                {uploading && <p className={`text-sm mt-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Uploading CV...</p>}
              </div>

              {/* Cover Photo Upload */}
              <div className={sectionClasses}>
                <label className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>🖼️ Cover Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleUploadFile(e.target.files[0], "availability-covers", setCoverImage)}
                  className={`w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                    darkMode 
                      ? "text-gray-300 file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800" 
                      : "text-gray-500 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  }`}
                />
                {coverImage && (
                  <div className="mt-3">
                    <img src={coverImage} alt="Cover Preview" className="w-full h-32 object-cover rounded-lg shadow-md" />
                    <p className={`text-xs mt-2 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cover photo preview</p>
                  </div>
                )}
                {uploading && <p className={`text-sm mt-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Uploading photo...</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? "Updating Availability..." : "Posting Availability..."}
                  </span>
                ) : (
                  isEditing ? "Update Availability" : "Post Availability"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}