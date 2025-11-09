"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function AgencyForm({ profile, onSave }: any) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    company_name: profile?.company_name || "",
    company_description: profile?.company_description || "",
    country: profile?.country || "",
    phone_number: profile?.phone_number || "",
    profile_picture_url: profile?.profile_picture_url || "",
    specialization: profile?.specialization || "",
    years_of_experience: profile?.years_of_experience || "",
    website: profile?.website || "",
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

      const filePath = `${user.id}/agency-${Date.now()}.${file.name.split(".").pop()}`;
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
        alert("Agency profile saved successfully!");
        onSave(data);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = `w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:border-transparent transition-all duration-200 ${
    darkMode 
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
  }`;

  const labelClasses = `block text-xs font-semibold mb-1 ${
    darkMode ? "text-gray-200" : "text-gray-700"
  }`;

  const cardClass = `max-w-2xl mx-auto p-4 sm:p-6 rounded-xl shadow-lg border transition-colors duration-300 ${
    darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
  }`;

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <div className="text-center mb-6">
        <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Agency Profile</h2>
        <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Complete your agency profile to attract the best talent</p>
      </div>

      <div className="space-y-4">
        {/* Agency Logo */}
        <div className="text-center">
          <div className="relative inline-block">
            {formData.profile_picture_url ? (
              <img
                src={formData.profile_picture_url}
                alt="Agency Logo"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-lg flex items-center justify-center ${
                darkMode ? "bg-gray-800" : "bg-gradient-to-br from-blue-100 to-purple-100"
              }`}>
                <span className="text-xl sm:text-2xl">🏢</span>
              </div>
            )}
          </div>
          <label className="block mt-3">
            <span className="sr-only">Choose agency logo</span>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className={`block w-full text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold ${
                darkMode 
                  ? "text-gray-300 file:bg-blue-900 file:text-blue-200 hover:file:bg-blue-800" 
                  : "text-gray-500 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              }`}
            />
          </label>
          {uploading && <p className={`text-xs mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Uploading logo...</p>}
        </div>

        {/* Agency Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClasses}>Agency Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter your agency name"
              required
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
              placeholder="e.g., IT Recruitment, Creative Staffing"
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
            <label className={labelClasses}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={inputClasses}
              placeholder="https://youragency.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Agency Description</label>
            <textarea
              name="company_description"
              value={formData.company_description}
              onChange={handleChange}
              className={inputClasses}
              rows={3}
              placeholder="Describe your agency services, expertise, and what makes you unique..."
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

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className={`w-full py-2 px-4 text-sm rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-md ${
              darkMode 
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700" 
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
            }`}
          >
            {saving ? (
              <span className="flex items-center justify-center text-xs sm:text-sm">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Agency Profile"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}