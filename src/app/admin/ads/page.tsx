"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Link, Image as ImageIcon } from "lucide-react";

type Ad = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  target_url: string;
  ad_type: string;
  is_active: boolean;
  client_name: string;
  created_at: string;
};

export default function AdminAdsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  // 🔐 AUTHENTICATION CHECK - ADD THIS SECTION
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated as admin
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
    } else {
      // Redirect to lock page if not authenticated
      router.push("/admin/ads/lock");
    }
  }, [router]);

  // Your existing state variables
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    video_url: "",
    target_url: "",
    ad_type: "image",
    client_name: "",
    is_active: true
  });

  // Move your existing useEffect for fetching ads inside the authenticated check
  useEffect(() => {
    if (isAuthenticated) {
      fetchAds();
    }
  }, [isAuthenticated]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error: any) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 ADD LOCK ADMIN FUNCTION
  const lockAdmin = () => {
    sessionStorage.removeItem("admin_authenticated");
    router.push("/admin/ads/lock");
  };

  // KEEP ALL YOUR EXISTING FUNCTIONS EXACTLY AS THEY ARE:
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);
      
      const fileName = `${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("ads")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("ads")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        const { error } = await supabase
          .from("ads")
          .update(formData)
          .eq("id", editingAd.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ads")
          .insert([formData]);

        if (error) throw error;
      }

      resetForm();
      fetchAds();
      alert(editingAd ? "Ad updated successfully!" : "Ad created successfully!");
    } catch (error: any) {
      console.error("Error saving ad:", error);
      alert("Error: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      video_url: "",
      target_url: "",
      ad_type: "image",
      client_name: "",
      is_active: true
    });
    setEditingAd(null);
    setShowForm(false);
    setUploadError(null);
  };

  const editAd = (ad: Ad) => {
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url || "",
      video_url: ad.video_url || "",
      target_url: ad.target_url || "",
      ad_type: ad.ad_type,
      client_name: ad.client_name || "",
      is_active: ad.is_active
    });
    setEditingAd(ad);
    setShowForm(true);
  };

  const toggleAdStatus = async (ad: Ad) => {
    try {
      const { error } = await supabase
        .from("ads")
        .update({ is_active: !ad.is_active })
        .eq("id", ad.id);

      if (error) throw error;
      fetchAds();
    } catch (error: any) {
      console.error("Error updating ad status:", error);
      alert("Error: " + error.message);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    
    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchAds();
      alert("Ad deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting ad:", error);
      alert("Error: " + error.message);
    }
  };

  // Text color utilities
  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-700";

  // Updated input classes to match glassmorphism style
  const inputClasses = `w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:border-transparent transition-all text-base backdrop-blur-lg ${
    darkMode 
      ? "bg-white/10 border-white/20 text-white placeholder-white/70 focus:ring-purple-500 focus:border-purple-500" 
      : "bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
  }`;

  // Updated label classes
  const labelClasses = `block text-sm font-bold mb-3 ${textPrimary}`;

  // Updated button classes
  const buttonPrimary = `px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-base backdrop-blur-lg`;
  const buttonSecondary = `px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition text-base backdrop-blur-lg`;

  // 🔐 SHOW LOADING WHILE CHECKING AUTHENTICATION
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="mt-4">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // 🔐 ONLY SHOW CONTENT IF AUTHENTICATED
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="max-w-6xl mx-auto">
          <p className="text-lg">Loading ads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header - UPDATED WITH LOCK BUTTON */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-white mb-2">Ad Management</h1>
            <p className={`${textMuted}`}>
              Create and manage ads displayed in the dashboard
            </p>
          </div>
          <div className="flex gap-2">
            {/* 🔐 ADD LOCK ADMIN BUTTON */}
            <button
              onClick={lockAdmin}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-base backdrop-blur-lg"
              title="Lock Admin Panel"
            >
              🔒 Lock
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-base backdrop-blur-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Ad
            </button>
          </div>
        </div>

        {/* REST OF YOUR EXISTING CODE REMAINS EXACTLY THE SAME */}
        {/* Image Size Recommendation */}
        <div className={`mb-6 p-4 rounded-lg backdrop-blur-lg ${darkMode ? "bg-white/10 border border-white/20" : "bg-white/80 border border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className={`font-semibold ${textPrimary}`}>Recommended Image Size</h3>
              <p className={`text-sm ${textMuted}`}>
                For best results, use images with <strong className={textPrimary}>400×200 pixels</strong> (2:1 aspect ratio)
              </p>
            </div>
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg backdrop-blur-lg">
            <h3 className="font-semibold mb-2">Upload Error</h3>
            <p>{uploadError}</p>
          </div>
        )}

        {/* Ad Form */}
        {showForm && (
          <div className={`mb-8 p-8 rounded-2xl backdrop-blur-lg shadow-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white/80 border-gray-200 text-gray-900"}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                {editingAd ? "Edit Ad" : "Create New Ad"}
              </h2>
              {formData.image_url && (
                <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                  ✓ Image URL set
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Ad Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={inputClasses}
                    placeholder="Enter a compelling ad title"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Client/Brand Name</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className={inputClasses}
                    placeholder="Company or brand name"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Ad Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={inputClasses}
                  rows={3}
                  placeholder="Describe what this ad promotes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Ad Type</label>
                  <select
                    value={formData.ad_type}
                    onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                    className={inputClasses}
                  >
                    <option value="image">Image Ad</option>
                    <option value="video">Video Ad</option>
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Target URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.target_url}
                    onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                    className={inputClasses}
                    placeholder="https://example.com/landing-page"
                  />
                </div>
              </div>

              {formData.ad_type === 'image' ? (
                <div>
                  <label className={labelClasses}>
                    Image URL *
                    <span className={`text-sm font-normal ${textMuted} ml-2`}>
                      (Recommended: 400×200px)
                    </span>
                  </label>
                  <div className="space-y-3">
                    <input
                      type="url"
                      required
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className={inputClasses}
                      placeholder="https://i.imgur.com/example.jpg"
                    />
                    
                    {/* Image Preview */}
                    {formData.image_url && (
                      <div className={`p-4 rounded-lg backdrop-blur-lg ${darkMode ? "bg-white/10 border border-white/20" : "bg-white/80 border border-gray-200"}`}>
                        <p className={`text-sm font-semibold mb-2 ${textPrimary}`}>Preview:</p>
                        <img 
                          src={formData.image_url} 
                          alt="Ad preview" 
                          className="max-w-full max-h-48 object-contain rounded border border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <span className={`text-sm ${textMuted} flex items-center gap-1`}>
                        <Link className="w-4 h-4" />
                        Paste a direct image URL or
                      </span>
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition cursor-pointer backdrop-blur-lg">
                        <Upload className="w-4 h-4" />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleImageUpload(file);
                              if (url) {
                                setFormData({ ...formData, image_url: url });
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploading && <p className="text-sm text-blue-600 dark:text-blue-400">Uploading image...</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <label className={labelClasses}>Video URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className={inputClasses}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className={buttonPrimary}
                >
                  {editingAd ? "Update Ad" : "Create Ad"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ads List */}
        <div className={`rounded-2xl backdrop-blur-lg shadow-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white/80 border-gray-200 text-gray-900"}`}>
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                Your Ads
              </h2>
              <div className={`text-sm ${textMuted}`}>
                <span className={`font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  {ads.filter(ad => ad.is_active).length} active
                </span>
                <span className="mx-2">•</span>
                <span className="font-semibold">
                  {ads.length} total
                </span>
              </div>
            </div>
            
            {ads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-lg">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-xl font-semibold ${textPrimary} mb-2`}>No ads yet</h3>
                <p className={`${textMuted} mb-6`}>Create your first ad to get started</p>
                <button
                  onClick={() => setShowForm(true)}
                  className={buttonPrimary}
                >
                  Create Your First Ad
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className={`p-6 rounded-xl border-2 transition-all backdrop-blur-lg ${
                      darkMode 
                        ? "bg-white/10 border-white/20 hover:border-white/30 text-white" 
                        : "bg-white/80 border-gray-200 hover:border-gray-300 text-gray-900"
                    } ${!ad.is_active ? "opacity-70" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className={`text-xl font-bold truncate ${textPrimary}`}>
                            {ad.title}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full backdrop-blur-lg ${
                            ad.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                          }`}>
                            {ad.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        
                        {ad.client_name && (
                          <p className={`text-lg mb-3 font-medium ${textSecondary}`}>
                            Client: {ad.client_name}
                          </p>
                        )}
                        
                        <p className={`mb-4 leading-relaxed ${textSecondary}`}>
                          {ad.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 rounded-full font-medium backdrop-blur-lg">
                            {ad.ad_type.toUpperCase()}
                          </span>
                          <span className={`${textMuted}`}>
                            Created: {new Date(ad.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Image Preview in List */}
                        {ad.image_url && (
                          <div className={`mt-4 p-3 rounded-lg border backdrop-blur-lg ${darkMode ? "bg-white/10 border-white/20" : "bg-white/60 border-gray-200"}`}>
                            <p className={`text-sm font-semibold mb-2 ${textPrimary}`}>
                              Ad Preview:
                            </p>
                            <img 
                              src={ad.image_url} 
                              alt="Ad preview" 
                              className="max-w-xs max-h-32 object-contain rounded border border-gray-300 dark:border-gray-600"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleAdStatus(ad)}
                          className={`p-3 rounded-lg transition backdrop-blur-lg ${
                            ad.is_active 
                              ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                          title={ad.is_active ? "Deactivate" : "Activate"}
                        >
                          {ad.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => editAd(ad)}
                          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition backdrop-blur-lg"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition backdrop-blur-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}