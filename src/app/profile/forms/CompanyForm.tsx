"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function CompanyForm({ profile, onSave }: any) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    company_name: profile?.company_name || "",
    company_description: profile?.company_description || "",
    country: profile?.country || "",
    phone_number: profile?.phone_number || "",
    profile_picture_url: profile?.profile_picture_url || "",
    industry: profile?.industry || "",
    company_size: profile?.company_size || "",
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

      const filePath = `${user.id}/company-${Date.now()}.${file.name.split(".").pop()}`;
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
        alert("Company profile saved successfully!");
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
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500"
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
        <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Company Profile</h2>
        <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Complete your company profile to attract top talent</p>
      </div>

      <div className="space-y-4">
        {/* Company Logo */}
        <div className="text-center">
          <div className="relative inline-block">
            {formData.profile_picture_url ? (
              <img
                src={formData.profile_picture_url}
                alt="Company Logo"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-lg flex items-center justify-center ${
                darkMode ? "bg-gray-800" : "bg-gradient-to-br from-green-100 to-blue-100"
              }`}>
                <span className="text-xl sm:text-2xl">🏢</span>
              </div>
            )}
          </div>
          <label className="block mt-3">
            <span className="sr-only">Choose company logo</span>
            <input 
              type="file" 
              onChange={handleFileChange} 
              className={`block w-full text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold ${
                darkMode 
                  ? "text-gray-300 file:bg-green-900 file:text-green-200 hover:file:bg-green-800" 
                  : "text-gray-500 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              }`}
            />
          </label>
          {uploading && <p className={`text-xs mt-1 ${darkMode ? "text-green-400" : "text-green-600"}`}>Uploading logo...</p>}
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClasses}>Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter your company name"
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Industry</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Technology, Healthcare"
            />
          </div>

          <div>
            <label className={labelClasses}>Company Size</label>
            <select
              name="company_size"
              value={formData.company_size}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Select company size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={inputClasses}
              placeholder="https://yourcompany.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Company Description</label>
            <textarea
              name="company_description"
              value={formData.company_description}
              onChange={handleChange}
              className={inputClasses}
              rows={3}
              placeholder="Describe your company, mission, values, and what you do..."
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
                ? "bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700" 
                : "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
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
              "Save Company Profile"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}