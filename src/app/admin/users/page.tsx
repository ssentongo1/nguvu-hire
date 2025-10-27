"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Users, Search, Filter, Eye, EyeOff, Trash2, Mail, Calendar, User, ExternalLink, AlertCircle } from "lucide-react";

type User = {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  created_at: string;
  last_login?: string;
  post_count?: number;
  profile_picture?: string;
  profile_picture_url?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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
      
      console.log("Fetching users from profiles table...");
      
      // Fetch all users - let's see what fields actually exist
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Profiles data:", profiles);

      // For each user, count their posts
      const usersWithPostCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          let postCount = 0;
          
          if (profile.role === 'employer') {
            const { count } = await supabase
              .from('jobs')
              .select('id', { count: 'exact' })
              .eq('created_by', profile.id);
            postCount = count || 0;
          } else if (profile.role === 'job_seeker') {
            const { count } = await supabase
              .from('availabilities')
              .select('id', { count: 'exact' })
              .eq('created_by', profile.id);
            postCount = count || 0;
          }

          return {
            id: profile.id,
            email: profile.email || 'No email', // Ensure email always exists
            role: profile.role || 'unknown',
            first_name: profile.first_name,
            last_name: profile.last_name,
            company_name: profile.company_name,
            created_at: profile.created_at,
            profile_picture: profile.profile_picture,
            profile_picture_url: profile.profile_picture_url,
            post_count: postCount
          };
        })
      );

      console.log("Processed users:", usersWithPostCounts);
      setUsers(usersWithPostCounts);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please check the console for details.");
      setUsers([]);
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

  // Filter users based on search and role - SAFE VERSION
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      user.email.toLowerCase().includes(searchLower) ||
      (user.first_name?.toLowerCase() || '').includes(searchLower) ||
      (user.last_name?.toLowerCase() || '').includes(searchLower) ||
      (user.company_name?.toLowerCase() || '').includes(searchLower);
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their posts and cannot be undone.")) {
      return;
    }

    try {
      // First delete user's posts
      await supabase.from('jobs').delete().eq('created_by', userId);
      await supabase.from('availabilities').delete().eq('created_by', userId);
      
      // Then delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Refresh the list
      fetchUsers();
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  const getDisplayName = (user: User) => {
    if (user.role === "employer" && user.company_name) {
      return user.company_name;
    }
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email;
  };

  const viewUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const getProfileImageSrc = (user: User) => {
    const imagePath = user.profile_picture_url || user.profile_picture;
    
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    
    return supabase.storage.from("profile-pictures").getPublicUrl(imagePath).data?.publicUrl ?? null;
  };

  // Loading and authentication checks
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

  if (!isAuthenticated) {
    return null;
  }

  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className={`${textMuted}`}>
              Manage all users and their accounts
            </p>
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

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            darkMode ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"
          }`}>
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className={`mb-6 p-6 rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or company..."
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
              </select>
            </div>
          </div>
        </div>

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
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
                {searchQuery || roleFilter !== "all" ? "No users found" : "No users registered yet"}
              </h3>
              <p className={textMuted}>
                {searchQuery || roleFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "When users register, they will appear here."
                }
              </p>
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
                      } ${index === filteredUsers.length - 1 ? 'border-b-0' : ''}`}
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
                            
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'employer'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            }`}>
                              {user.role === 'employer' ? 'EMPLOYER' : 'JOB SEEKER'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className={textMuted}>
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span className={textMuted}>
                                Posts: {user.post_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => viewUserProfile(user.id)}
                            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition backdrop-blur-lg"
                            title="View Profile"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition backdrop-blur-lg"
                            title="Delete User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
              </p>
              <div className="flex gap-4 text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"
                }`}>
                  Employers: {users.filter(u => u.role === 'employer').length}
                </span>
                <span className={`px-2 py-1 rounded-full ${
                  darkMode ? "bg-green-900/50 text-green-200" : "bg-green-100 text-green-800"
                }`}>
                  Job Seekers: {users.filter(u => u.role === 'job_seeker').length}
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