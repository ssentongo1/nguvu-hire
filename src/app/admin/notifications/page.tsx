"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Bell, Plus, Edit, Trash2, Send, Calendar, Users, Eye } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: 'all' | 'employers' | 'job_seekers';
  is_active: boolean;
  scheduled_for?: string;
  created_at: string;
  sent_count: number;
  read_count: number;
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      fetchNotifications();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Platform Maintenance',
          message: 'Scheduled maintenance this weekend. The platform will be unavailable for 2 hours.',
          type: 'info',
          target_audience: 'all',
          is_active: true,
          created_at: '2024-01-20',
          sent_count: 150,
          read_count: 120
        },
        {
          id: '2',
          title: 'New Feature: Advanced Search',
          message: 'We have launched advanced search filters for better job matching.',
          type: 'success',
          target_audience: 'all',
          is_active: true,
          created_at: '2024-01-18',
          sent_count: 150,
          read_count: 95
        },
        {
          id: '3',
          title: 'Employer Webinar',
          message: 'Join our webinar on effective hiring strategies next Tuesday.',
          type: 'info',
          target_audience: 'employers',
          is_active: false,
          scheduled_for: '2024-02-01',
          created_at: '2024-01-15',
          sent_count: 45,
          read_count: 30
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const lockAdmin = () => {
    sessionStorage.removeItem("admin_authenticated");
    router.push("/admin/ads/lock");
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const createNotification = () => {
    setEditingNotification(null);
    setShowForm(true);
  };

  const editNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setShowForm(true);
  };

  const deleteNotification = (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    alert("Notification deleted successfully");
  };

  const toggleNotificationStatus = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_active: !n.is_active } : n
    ));
  };

  const sendNotification = (id: string) => {
    // In a real app, this would send the notification to all targeted users
    alert("Notification sent to all targeted users");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      case 'employers': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'job_seekers': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
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

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications Management</h1>
            <p className={`${textMuted}`}>Create and manage system notifications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo("/admin")}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-base backdrop-blur-lg"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={createNotification}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-base backdrop-blur-lg"
            >
              <Plus className="w-5 h-5" />
              Create Notification
            </button>
            <button
              onClick={lockAdmin}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-base backdrop-blur-lg"
            >
              🔒 Lock
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className={`rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={textMuted}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No notifications</h3>
              <p className={textMuted}>Create your first system notification</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 gap-0">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-6 border-b ${
                      darkMode ? "border-white/20" : "border-gray-200"
                    } ${index === notifications.length - 1 ? 'border-b-0' : ''} ${
                      !notification.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-bold ${textPrimary}`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAudienceColor(notification.target_audience)}`}>
                            {notification.target_audience.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            notification.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200'
                          }`}>
                            {notification.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        
                        <p className={`mb-3 ${textMuted}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>
                              Created: {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {notification.scheduled_for && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className={textMuted}>
                                Scheduled: {new Date(notification.scheduled_for).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Send className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>
                              Sent: {notification.sent_count} users
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>
                              Read: {notification.read_count} users
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => sendNotification(notification.id)}
                          className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition backdrop-blur-lg"
                          title="Send Notification"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => toggleNotificationStatus(notification.id)}
                          className={`p-3 rounded-lg transition backdrop-blur-lg ${
                            notification.is_active
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                          title={notification.is_active ? "Deactivate" : "Activate"}
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => editNotification(notification)}
                          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition backdrop-blur-lg"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
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
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && notifications.length > 0 && (
          <div className={`mt-4 p-4 rounded-lg backdrop-blur-lg ${
            darkMode ? "bg-white/10 border border-white/20" : "bg-white/80 border border-gray-200"
          }`}>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${textMuted}`}>
                Showing {notifications.length} notifications
              </p>
              <div className="flex gap-4 text-sm">
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                  Active: {notifications.filter(n => n.is_active).length}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  Total Sent: {notifications.reduce((sum, n) => sum + n.sent_count, 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notification Form (Simplified) */}
        {showForm && (
          <div className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>
            <div className={`rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
              darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white"
            }`}>
              <div className={`p-6 border-b ${
                darkMode ? "border-purple-500" : "border-gray-200"
              }`}>
                <div className="flex justify-between items-center">
                  <h2 className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {editingNotification ? "Edit Notification" : "Create New Notification"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className={`p-2 rounded-full transition ${
                      darkMode ? "hover:bg-purple-500" : "hover:bg-gray-200"
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}>
                      Notification Title
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-purple-500/20 border-purple-400 text-white placeholder-gray-400" 
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="Enter notification title..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}>
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-purple-500/20 border-purple-400 text-white placeholder-gray-400" 
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="Enter notification message..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                      }`}>
                        Type
                      </label>
                      <select className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-purple-500/20 border-purple-400 text-white" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}>
                        <option value="info">Information</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                      }`}>
                        Target Audience
                      </label>
                      <select className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-purple-500/20 border-purple-400 text-white" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}>
                        <option value="all">All Users</option>
                        <option value="employers">Employers Only</option>
                        <option value="job_seekers">Job Seekers Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowForm(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      darkMode 
                        ? "bg-purple-500 text-white hover:bg-purple-600" 
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                  >
                    {editingNotification ? "Update Notification" : "Create Notification"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}