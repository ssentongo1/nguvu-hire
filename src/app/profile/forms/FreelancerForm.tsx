"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function FreelancerForm({ profile, onSave }: any) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    bio: profile?.bio || "",
    skills: profile?.skills || "",
    country: profile?.country || "",
    phone_number: profile?.phone_number || "",
    profile_picture_url: profile?.profile_picture_url || "",
    hourly_rate: profile?.hourly_rate || "",
    portfolio: profile?.portfolio || "",
    experience: profile?.experience || "",
    company_name: profile?.company_name || "", // ADDED: For project/job posting
    services_offered: profile?.services_offered || "", // ADDED: Types of jobs/projects available
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: any) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filePath = `${user.id}/freelancer-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("profile-pictures").upload(filePath, file, { upsert: true });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);
      setFormData((prev: any) => ({ ...prev, profile_picture_url: publicUrl }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data, error } = await supabase.from("profiles").update(formData).eq("id", profile.id).select().single();

      if (error) {
        console.error("Save error:", error);
        alert("Error saving profile: " + error.message);
      } else {
        alert("Freelancer profile saved successfully!");
        onSave(data);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all duration-200 ${
    darkMode 
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-orange-500"
  }`;

  const labelClasses = `block text-sm font-semibold mb-2 ${
    darkMode ? "text-gray-200" : "text-gray-700"
  }`;

  const cardClass = `max-w-2xl mx-auto p-8 rounded-2xl shadow-xl border transition-colors duration-300 ${
    darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
  }`;

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Project Owner Profile</h2> {/* CHANGED: Title */}
        <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Showcase your projects and find talented professionals</p> {/* CHANGED: Description */}
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="text-center">
          <div className="relative inline-block">
            {formData.profile_picture_url ? (
              <img
                src={formData.profile_picture_url}
                alt="Profile"
                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-32 h-32 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center ${
                darkMode ? "bg-gray-800" : "bg-gradient-to-br from-orange-100 to-red-100"
              }`}>
                <span className="text-2xl">💼</span> {/* CHANGED: Emoji */}
              </div>
            )}
          </div>
          <label className="block mt-4">
            <span className="sr-only">Choose profile picture</span>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                darkMode 
                  ? "text-gray-300 file:bg-orange-900 file:text-orange-200 hover:file:bg-orange-800" 
                  : "text-gray-500 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              }`}
            />
          </label>
          {uploading && <p className={`text-sm mt-2 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>Uploading photo...</p>}
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>First Name *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Your first name"
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Last Name *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Your last name"
              required
            />
          </div>

          {/* CHANGED: Added Company/Project Name */}
          <div className="md:col-span-2">
            <label className={labelClasses}>Project/Company Name</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Your project or company name (optional)"
            />
          </div>

          {/* CHANGED: Updated skills to project types */}
          <div className="md:col-span-2">
            <label className={labelClasses}>Project Types *</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Web Development, Mobile Apps, Graphic Design, Writing Projects"
              required
            />
          </div>

          {/* CHANGED: Added Services Offered */}
          <div className="md:col-span-2">
            <label className={labelClasses}>Services/Jobs Available</label>
            <input
              type="text"
              name="services_offered"
              value={formData.services_offered}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Hiring developers, Need writers, Looking for designers"
            />
          </div>

          <div>
            <label className={labelClasses}>Experience Level</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Select experience level</option>
              <option value="entry">Just Starting (0-2 years)</option>
              <option value="mid">Experienced (2-5 years)</option>
              <option value="senior">Seasoned (5+ years)</option>
              <option value="expert">Expert (10+ years)</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Budget Range</label> {/* CHANGED: From Hourly Rate */}
            <input
              type="text"
              name="hourly_rate"
              value={formData.hourly_rate}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., $500-$5000 per project"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Portfolio/Website</label>
            <input
              type="url"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              className={inputClasses}
              placeholder="https://yourportfolio.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className={inputClasses}
              rows={4}
              placeholder="Describe the types of projects you work on and what kind of talent you're looking for..."
            />
          </div>

          <div>
            <label className={labelClasses}>Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Your country"
            />
          </div>

          <div>
            <label className={labelClasses}>Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Your phone number"
            />
          </div>
        </div>

        {/* Submit Button - SMALLER SIZE */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving || uploading}
            className={`w-full py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg ${
              darkMode 
                ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700" 
                : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Project Owner Profile" 
            )}
          </button>
        </div>
      </div>
    </form>
  );
}