"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Settings, Save, RefreshCw, Database, Mail, Bell, Shield, Globe } from "lucide-react";

type SystemSetting = {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean';
  category: string;
  description: string;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      loadSettings();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router]);

  // Default system settings
  const defaultSettings: SystemSetting[] = [
    {
      key: 'platform_name',
      value: 'NguvuHire',
      type: 'string',
      category: 'general',
      description: 'The name of your platform'
    },
    {
      key: 'max_job_posts',
      value: 10,
      type: 'number',
      category: 'limits',
      description: 'Maximum job posts per user'
    },
    {
      key: 'max_availability_posts',
      value: 5,
      type: 'number',
      category: 'limits',
      description: 'Maximum availability posts per user'
    },
    {
      key: 'auto_approve_posts',
      value: true,
      type: 'boolean',
      category: 'moderation',
      description: 'Automatically approve new posts'
    },
    {
      key: 'require_email_verification',
      value: false,
      type: 'boolean',
      category: 'security',
      description: 'Require email verification for new users'
    },
    {
      key: 'allow_registrations',
      value: true,
      type: 'boolean',
      category: 'general',
      description: 'Allow new user registrations'
    },
    {
      key: 'ad_display_frequency',
      value: 9,
      type: 'number',
      category: 'ads',
      description: 'Show ads after every X posts'
    }
  ];

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd load these from a database
      // For now, we'll use the default settings
      setSettings(defaultSettings);
      
    } catch (error) {
      console.error("Error loading settings:", error);
      // Fallback to default settings
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, newValue: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value: newValue } : setting
    ));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      // In a real app, you'd save these to a database
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage("Settings saved successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const lockAdmin = () => {
    sessionStorage.removeItem("admin_authenticated");
    router.push("/admin/ads/lock");
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Globe className="w-5 h-5" />;
      case 'limits': return <Database className="w-5 h-5" />;
      case 'moderation': return <Shield className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      case 'ads': return <Bell className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

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

  if (!isAuthenticated) return null;

  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className={`${textMuted}`}>Platform configuration and settings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo("/admin")}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-base backdrop-blur-lg"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={lockAdmin}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-base backdrop-blur-lg"
            >
              🔒 Lock
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.includes('Error') 
              ? (darkMode ? "bg-red-500/20 border border-red-500/30" : "bg-red-50 border border-red-200")
              : (darkMode ? "bg-green-500/20 border border-green-500/30" : "bg-green-50 border border-green-200")
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              message.includes('Error') ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            <p className={message.includes('Error') ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}>
              {message}
            </p>
          </div>
        )}

        {loading ? (
          <div className={`p-8 rounded-xl backdrop-blur-lg border-2 text-center ${
            darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
          }`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={textMuted}>Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category} className={`rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="p-6 border-b border-gray-200 dark:border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    {getCategoryIcon(category)}
                    <h2 className="text-xl font-semibold">{getCategoryName(category)}</h2>
                  </div>
                  <p className={`text-sm ${textMuted}`}>
                    Configure {category} settings for the platform
                  </p>
                </div>
                
                <div className="p-6 space-y-6">
                  {getSettingsByCategory(category).map(setting => (
                    <div key={setting.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-white/5 dark:bg-white/5">
                      <div className="flex-1">
                        <label className={`block font-semibold mb-1 ${textPrimary}`}>
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <p className={`text-sm ${textMuted}`}>{setting.description}</p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {setting.type === 'boolean' ? (
                          <button
                            onClick={() => updateSetting(setting.key, !setting.value)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              setting.value
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-500 text-white hover:bg-gray-600'
                            }`}
                          >
                            {setting.value ? 'Enabled' : 'Disabled'}
                          </button>
                        ) : setting.type === 'number' ? (
                          <input
                            type="number"
                            value={setting.value}
                            onChange={(e) => updateSetting(setting.key, parseInt(e.target.value))}
                            className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 ${
                              darkMode
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={setting.value}
                            onChange={(e) => updateSetting(setting.key, e.target.value)}
                            className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 ${
                              darkMode
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save All Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}