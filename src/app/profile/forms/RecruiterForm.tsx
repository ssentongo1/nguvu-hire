"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function RecruiterForm({ profile, onSave }: any) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    company_name: profile?.company_name || "",
    specialization: profile?.specialization || "",
    country: profile?.country || "",
    phone_number: profile?.phone_number || "",
    profile_picture_url: profile?.profile_picture_url || "",
    years_of_experience: profile?.years_of_experience || "",
    linkedin: profile?.linkedin || "",
    bio: profile?.bio || "",
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

      const filePath = `${user.id}/recruiter-${Date.now()}.${file.name.split(".").pop()}`;
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
        alert("Recruiter profile saved successfully!");
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
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-purple-500"
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
        <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Recruiter Profile</h2>
        <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Complete your recruiter profile to connect with top talent</p>
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
                darkMode ? "bg-gray-800" : "bg-gradient-to-br from-purple-100 to-pink-100"
              }`}>
                <span className="text-2xl">👔</span>
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
                  ? "text-gray-300 file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800" 
                  : "text-gray-500 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              }`}
            />
          </label>
          {uploading && <p className={`text-sm mt-2 ${darkMode ? "text-purple-400" : "text-purple-600"}`}>Uploading photo...</p>}
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

          <div className="md:col-span-2">
            <label className={labelClasses}>Company/Agency</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Your recruitment agency or company"
            />
          </div>

          <div>
            <label className={labelClasses}>Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Tech Recruitment, Executive Search"
            />
          </div>

          <div>
            <label className={labelClasses}>Years of Experience</label>
            <input
              type="number"
              name="years_of_experience"
              value={formData.years_of_experience}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., 5"
              min="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>LinkedIn Profile</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleChange}
              className={inputClasses}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className={inputClasses}
              rows={3}
              placeholder="Tell us about your recruiting experience, specialties, and approach..."
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
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
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
              "Save Recruiter Profile"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}