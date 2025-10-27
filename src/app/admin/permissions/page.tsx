"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Shield, User, Users, Save, RefreshCw, Search, Filter, Check, X, AlertCircle } from "lucide-react";

type UserRole = {
  id: string;
  email: string;
  current_role: 'job_seeker' | 'employer' | 'admin';
  new_role?: 'job_seeker' | 'employer' | 'admin';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  post_count: number;
  profile_picture?: string;
  profile_picture_url?: string;
};

export default function AdminPermissionsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      fetchUsers();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching users for permissions...");
      
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Profiles error:", error);
        throw error;
      }

      console.log("Profiles data:", profiles);

      // Transform users with safe data access
      const usersWithRoles: UserRole[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || 'no-email@example.com', // Ensure email always exists
        current_role: (profile.role as 'job_seeker' | 'employer' | 'admin') || 'job_seeker',
        first_name: profile.first_name,
        last_name: profile.last_name,
        company_name: profile.company_name,
        profile_picture: profile.profile_picture,
        profile_picture_url: profile.profile_picture_url,
        post_count: 0
      }));

      console.log("Processed users:", usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please check the console for details.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole['current_role']) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, new_role: newRole } : user
    ));
  };

  const saveRoleChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const changes = users.filter(user => user.new_role && user.new_role !== user.current_role);
      
      if (changes.length === 0) {
        setMessage("No changes to save");
        return;
      }

      console.log("Saving role changes:", changes);

      // Update roles in database
      for (const user of changes) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: user.new_role })
          .eq('id', user.id);

        if (error) {
          console.error(`Error updating user ${user.id}:`, error);
          throw error;
        }
      }

      // Refresh the data
      await fetchUsers();
      setMessage(`Successfully updated ${changes.length} user roles`);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating roles:", error);
      setError("Error updating user roles. Check console for details.");
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

  const getDisplayName = (user: UserRole) => {
    if (user.current_role === "employer" && user.company_name) {
      return user.company_name;
    }
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email || 'Unknown User';
  };

  const getProfileImageSrc = (user: UserRole) => {
    const imagePath = user.profile_picture_url || user.profile_picture;
    
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    
    return supabase.storage.from("profile-pictures").getPublicUrl(imagePath).data?.publicUrl ?? null;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'employer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'job_seeker': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  // FIXED: Safe filtering with proper null checks
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.first_name?.toLowerCase() || '').includes(searchLower) ||
      (user.last_name?.toLowerCase() || '').includes(searchLower) ||
      (user.company_name?.toLowerCase() || '').includes(searchLower);
    
    const matchesRole = roleFilter === "all" || user.current_role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const hasChanges = users.some(user => user.new_role && user.new_role !== user.current_role);

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
            <h1 className="text-3xl font-bold mb-2">Permissions Management</h1>
            <p className={`${textMuted}`}>Manage user roles and permissions</p>
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

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            darkMode ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"
          }`}>
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className={`mb-6 p-6 rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">All Roles</option>
                <option value="job_seeker">Job Seekers</option>
                <option value="employer">Employers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={saveRoleChanges}
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
                  Save Role Changes
                </>
              )}
            </button>
          </div>
        )}

        {/* Users List */}
        <div className={`rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={textMuted}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No users found</h3>
              <p className={textMuted}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 gap-0">
                {filteredUsers.map((user, index) => {
                  const profileImageSrc = getProfileImageSrc(user);
                  
                  return (
                    <div
                      key={user.id}
                      className={`p-6 border-b ${
                        darkMode ? "border-white/20" : "border-gray-200"
                      } ${index === filteredUsers.length - 1 ? 'border-b-0' : ''} ${
                        user.new_role && user.new_role !== user.current_role ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Profile Picture */}
                            {profileImageSrc ? (
                              <img
                                src={profileImageSrc}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            
                            <div>
                              <h3 className={`text-xl font-bold ${textPrimary}`}>
                                {getDisplayName(user)}
                              </h3>
                              <p className={`text-sm ${textMuted}`}>{user.email}</p>
                            </div>
                            
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.current_role)}`}>
                              {user.current_role.toUpperCase()}
                            </span>
                            {user.new_role && user.new_role !== user.current_role && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                → {user.new_role.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <select
                            value={user.new_role || user.current_role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole['current_role'])}
                            className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              darkMode
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          >
                            <option value="job_seeker">Job Seeker</option>
                            <option value="employer">Employer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredUsers.length > 0 && (
          <div className={`mt-4 p-4 rounded-lg backdrop-blur-lg ${
            darkMode ? "bg-white/10 border border-white/20" : "bg-white/80 border border-gray-200"
          }`}>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${textMuted}`}>
                Showing {filteredUsers.length} of {users.length} users
                {hasChanges && ` • ${users.filter(u => u.new_role && u.new_role !== u.current_role).length} pending changes`}
              </p>
              <div className="flex gap-4 text-sm">
                <span className={`px-2 py-1 rounded-full ${getRoleColor('admin')}`}>
                  Admins: {users.filter(u => u.current_role === 'admin').length}
                </span>
                <span className={`px-2 py-1 rounded-full ${getRoleColor('employer')}`}>
                  Employers: {users.filter(u => u.current_role === 'employer').length}
                </span>
                <span className={`px-2 py-1 rounded-full ${getRoleColor('job_seeker')}`}>
                  Job Seekers: {users.filter(u => u.current_role === 'job_seeker').length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {error && (
          <div className="mt-6 text-center">
            <button
              onClick={fetchUsers}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}