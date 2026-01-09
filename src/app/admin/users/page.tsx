"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Search, 
  Trash2, 
  Mail, 
  Calendar, 
  User, 
  ExternalLink, 
  AlertCircle,
  Lock,
  MapPin,
  Phone,
  Building,
  Briefcase,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Globe,
  GraduationCap,
  Award,
  MessageSquare,
  Heart,
  ChevronDown,
  ChevronUp,
  BarChart,
  Target
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
  
  // Basic profile fields
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  profile_picture?: string;
  profile_picture_url?: string;
  company_name?: string;
  
  // Additional fields
  country?: string;
  city?: string;
  bio?: string;
  job_title?: string;
  years_of_experience?: number;
  education_level?: string;
  skills?: string[] | string;
  certifications?: string[] | string;
  languages?: string[] | string;
  
  // Status fields
  is_verified?: boolean;
  is_active?: boolean;
  last_login_at?: string;
  
  // Post counts
  post_count?: number;
  job_post_count?: number;
  availability_post_count?: number;
  total_posts_accurate?: number;
};

type CountryStats = {
  country: string;
  count: number;
  percentage: number;
  users: UserProfile[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"basic" | "detailed">("basic");
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [totalPostsAccurate, setTotalPostsAccurate] = useState(0);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      fetchUsers();
    } else {
      router.push("/admin/lock");
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching users and posts...");
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw profilesError;
      }

      console.log("Total profiles found:", profiles?.length || 0);

      // Fetch ALL jobs and availabilities in single queries for efficiency
      const { data: allJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, created_by");

      const { data: allAvailabilities, error: availabilitiesError } = await supabase
        .from("availabilities")
        .select("id, created_by");

      if (jobsError) console.warn("Jobs fetch warning:", jobsError);
      if (availabilitiesError) console.warn("Availabilities fetch warning:", availabilitiesError);

      // Create maps for post counts
      const jobCountMap = new Map<string, number>();
      const availabilityCountMap = new Map<string, number>();
      const postCountMap = new Map<string, number>();

      // Count all jobs per user
      allJobs?.forEach(job => {
        if (job.created_by) {
          jobCountMap.set(job.created_by, (jobCountMap.get(job.created_by) || 0) + 1);
          postCountMap.set(job.created_by, (postCountMap.get(job.created_by) || 0) + 1);
        }
      });

      // Count all availabilities per user
      allAvailabilities?.forEach(availability => {
        if (availability.created_by) {
          availabilityCountMap.set(availability.created_by, (availabilityCountMap.get(availability.created_by) || 0) + 1);
          postCountMap.set(availability.created_by, (postCountMap.get(availability.created_by) || 0) + 1);
        }
      });

      // Fetch auth users for status info
      const { data: authData } = await supabase.auth.admin.listUsers();
      const authUserMap = new Map();
      if (authData?.users) {
        authData.users.forEach(user => {
          authUserMap.set(user.id, user);
        });
      }

      // Process each profile
      const usersWithData: UserProfile[] = [];
      let totalPosts = 0;

      for (const profile of (profiles || [])) {
        const authUser = authUserMap.get(profile.id);
        
        // Get counts from maps (much faster than individual queries)
        const jobCount = jobCountMap.get(profile.id) || 0;
        const availabilityCount = availabilityCountMap.get(profile.id) || 0;
        const userTotalPosts = postCountMap.get(profile.id) || 0;
        
        totalPosts += userTotalPosts;

        // Safely parse array fields
        const safeParseArray = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              // If it's not valid JSON, try splitting by comma
              return field.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          return [];
        };

        const userData: UserProfile = {
          id: profile.id,
          email: profile.email || authUser?.email || 'No email',
          role: profile.role || 'unknown',
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          
          // Basic fields
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          phone_number: profile.phone_number,
          profile_picture: profile.profile_picture,
          profile_picture_url: profile.profile_picture_url,
          company_name: profile.company_name,
          
          // Additional fields
          country: profile.country,
          city: profile.city,
          bio: profile.bio,
          job_title: profile.job_title,
          years_of_experience: profile.years_of_experience,
          education_level: profile.education_level,
          skills: safeParseArray(profile.skills),
          certifications: safeParseArray(profile.certifications),
          languages: safeParseArray(profile.languages),
          
          // Status
          is_verified: profile.is_verified || false,
          is_active: authUser ? !authUser.banned_at : true,
          last_login_at: authUser?.last_sign_in_at,
          
          // Post counts
          post_count: userTotalPosts,
          job_post_count: jobCount,
          availability_post_count: availabilityCount,
          total_posts_accurate: userTotalPosts
        };

        usersWithData.push(userData);
      }

      console.log("Total posts calculated:", totalPosts);
      console.log("Processed users:", usersWithData.length);
      
      setUsers(usersWithData);
      setTotalPostsAccurate(totalPosts);
      
      // Calculate country statistics
      calculateCountryStats(usersWithData);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
      setUsers([]);
      setCountryStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCountryStats = (userList: UserProfile[]) => {
    const countryMap = new Map<string, { count: number, users: UserProfile[] }>();
    let totalWithCountries = 0;

    // Count users by country
    userList.forEach(user => {
      if (user.country) {
        totalWithCountries++;
        const current = countryMap.get(user.country) || { count: 0, users: [] };
        countryMap.set(user.country, {
          count: current.count + 1,
          users: [...current.users, user]
        });
      }
    });

    // Convert to array and sort by count (descending)
    const stats: CountryStats[] = Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        percentage: totalWithCountries > 0 ? (data.count / totalWithCountries) * 100 : 0,
        users: data.users
      }))
      .sort((a, b) => b.count - a.count);

    console.log("Country stats calculated:", stats);
    setCountryStats(stats);
  };

  const lockAdmin = () => {
    sessionStorage.removeItem("admin_authenticated");
    router.push("/admin/lock");
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      user.email.toLowerCase().includes(searchLower) ||
      (user.full_name?.toLowerCase() || '').includes(searchLower) ||
      (user.company_name?.toLowerCase() || '').includes(searchLower) ||
      (user.job_title?.toLowerCase() || '').includes(searchLower) ||
      (user.country?.toLowerCase() || '').includes(searchLower) ||
      (user.city?.toLowerCase() || '').includes(searchLower);
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesCountry = countryFilter === "all" || 
      (user.country && user.country.toLowerCase() === countryFilter.toLowerCase());
    
    return matchesSearch && matchesRole && matchesCountry;
  });

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their posts and cannot be undone.")) {
      return;
    }

    try {
      // Delete user's posts
      await supabase.from('jobs').delete().eq('created_by', userId);
      await supabase.from('availabilities').delete().eq('created_by', userId);
      
      // Delete the profile
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

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      // Update user ban status
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          ban_duration: currentStatus ? '87600h' : 'none' // 10 years for deactivation
        }
      );

      if (error) throw error;

      fetchUsers();
      alert(`User ${currentStatus ? 'deactivated' : 'reactivated'} successfully`);
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert("Error updating user status");
    }
  };

  const getDisplayName = (user: UserProfile) => {
    if (user.role === "employer" && user.company_name) {
      return user.company_name;
    }
    return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  };

  const viewUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const getProfileImageSrc = (user: UserProfile) => {
    const imagePath = user.profile_picture_url || user.profile_picture;
    
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    
    return supabase.storage.from("profile-pictures").getPublicUrl(imagePath).data?.publicUrl ?? null;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSkillsArray = (skills: any): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') {
      try {
        const parsed = JSON.parse(skills);
        return Array.isArray(parsed) ? parsed : [skills];
      } catch {
        return skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
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
  const bgCard = darkMode ? "bg-white/10" : "bg-white/80";
  const borderColor = darkMode ? "border-white/20" : "border-gray-200";

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className={`${textMuted}`}>
              Manage all users and their accounts • {users.length} total users
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigateTo("/admin")}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-base backdrop-blur-lg"
            >
              ← Dashboard
            </button>
            <button
              onClick={lockAdmin}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-base backdrop-blur-lg"
            >
              <Lock className="w-4 h-4" /> Lock
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
        <div className={`mb-6 p-6 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, company, job title, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">All Roles</option>
                <option value="job_seeker">Job Seekers</option>
                <option value="employer">Employers</option>
              </select>

              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">All Countries</option>
                {countryStats.map(stat => (
                  <option key={stat.country} value={stat.country}>
                    {stat.country} ({stat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("basic")}
                className={`px-4 py-2 rounded-lg border ${
                  viewMode === "basic" 
                    ? "bg-blue-500 text-white border-blue-600" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                }`}
              >
                Basic View
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-4 py-2 rounded-lg border ${
                  viewMode === "detailed" 
                    ? "bg-blue-500 text-white border-blue-600" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                }`}
              >
                Detailed View
              </button>
            </div>
            
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className={`p-4 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className={`text-sm ${textMuted}`}>Total Users</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'employer').length}</p>
                <p className={`text-sm ${textMuted}`}>Employers</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'job_seeker').length}</p>
                <p className={`text-sm ${textMuted}`}>Job Seekers</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPostsAccurate}</p>
                <p className={`text-sm ${textMuted}`}>Total Posts</p>
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{countryStats.length}</p>
                <p className={`text-sm ${textMuted}`}>Countries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Countries Distribution */}
        {countryStats.length > 0 && (
          <div className={`mb-6 p-6 rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Users by Country
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {countryStats.slice(0, 8).map((stat, index) => (
                <div key={stat.country} className={`p-4 rounded-lg ${
                  index === 0 
                    ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30' 
                    : index === 1
                    ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30'
                    : index === 2
                    ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                    : 'bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{stat.country}</div>
                      <div className="text-sm text-gray-500">
                        {stat.count} user{stat.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{stat.percentage.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">of users</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {stat.users.filter(u => u.role === 'employer').length} employers • 
                    {stat.users.filter(u => u.role === 'job_seeker').length} job seekers
                  </div>
                </div>
              ))}
            </div>
            
            {countryStats.length > 8 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {countryStats.slice(8).map(stat => (
                    <div key={stat.country} className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="font-medium">{stat.country}</div>
                      <div className="text-sm text-gray-500">{stat.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users List */}
        <div className={`rounded-xl backdrop-blur-lg border-2 ${bgCard} border-${borderColor}`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={textMuted}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
                {searchQuery || roleFilter !== "all" || countryFilter !== "all" ? "No users found" : "No users registered yet"}
              </h3>
              <p className={textMuted}>
                {searchQuery || roleFilter !== "all" || countryFilter !== "all" 
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
                  const skillsArray = getSkillsArray(user.skills);
                  const languagesArray = getSkillsArray(user.languages);
                  
                  return (
                    <div
                      key={user.id}
                      className={`p-6 border-b ${
                        darkMode ? "border-white/20" : "border-gray-200"
                      } ${index === filteredUsers.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-6">
                        {/* Left Column - User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Profile Picture */}
                            {profileImageSrc ? (
                              <img
                                src={profileImageSrc}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                            
                            <div className="min-w-0">
                              <h3 className={`text-xl font-bold ${textPrimary} truncate`}>
                                {getDisplayName(user)}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'employer'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                }`}>
                                  {user.role === 'employer' ? 'EMPLOYER' : 'JOB SEEKER'}
                                </span>
                                
                                {user.is_verified && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                    ✓ Verified
                                  </span>
                                )}
                                
                                {!user.is_active && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                    Inactive
                                  </span>
                                )}
                                
                                {user.country && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                                    {user.country}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Contact Info */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className={`text-sm ${textMuted} break-all`}>{user.email}</span>
                            </div>
                            
                            {user.phone_number && (
                              <div className="flex items-center gap-2 mb-1">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${textMuted}`}>{user.phone_number}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Location Info */}
                          {(user.country || user.city) && (
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className={`text-sm ${textMuted}`}>
                                {user.city && `${user.city}, `}{user.country}
                              </span>
                            </div>
                          )}
                          
                          {/* Post Counts */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className={`text-sm ${textPrimary}`}>
                              <span className="font-semibold">{user.post_count || 0}</span> total posts
                            </div>
                            {user.job_post_count && user.job_post_count > 0 && (
                              <div className={`text-sm ${textMuted}`}>
                                {user.job_post_count} job{user.job_post_count !== 1 ? 's' : ''}
                              </div>
                            )}
                            {user.availability_post_count && user.availability_post_count > 0 && (
                              <div className={`text-sm ${textMuted}`}>
                                {user.availability_post_count} availability{user.availability_post_count !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          
                          {/* Professional Info (Detailed View) */}
                          {viewMode === "detailed" && (
                            <div className="space-y-2 mt-3">
                              {user.job_title && (
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${textPrimary}`}>{user.job_title}</span>
                                </div>
                              )}
                              
                              {user.years_of_experience && (
                                <div className={`text-sm ${textMuted}`}>
                                  {user.years_of_experience} years of experience
                                </div>
                              )}
                              
                              {user.education_level && (
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${textMuted}`}>{user.education_level}</span>
                                </div>
                              )}
                              
                              {/* Skills */}
                              {skillsArray.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {skillsArray.slice(0, 3).map((skill, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                                        {skill}
                                      </span>
                                    ))}
                                    {skillsArray.length > 3 && (
                                      <span className="px-2 py-1 text-gray-500 text-xs">
                                        +{skillsArray.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Languages */}
                              {languagesArray.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {languagesArray.slice(0, 3).map((lang, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-800 dark:text-green-200 rounded-full text-xs">
                                        {lang}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Timestamps */}
                          <div className="flex items-center gap-4 text-sm mt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className={textMuted}>
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {user.last_login_at && (
                              <div className={`text-xs ${textMuted}`}>
                                Last active: {formatDate(user.last_login_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Right Column - Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => viewUserProfile(user.id)}
                            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition backdrop-blur-lg flex items-center gap-2"
                            title="View Profile"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          
                          <button
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition backdrop-blur-lg flex items-center gap-2"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Details</span>
                          </button>
                          
                          <button
                            onClick={() => toggleUserStatus(user.id, user.is_active || false)}
                            className={`p-3 rounded-lg transition backdrop-blur-lg flex items-center gap-2 ${
                              user.is_active
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            title={user.is_active ? "Deactivate" : "Activate"}
                          >
                            {user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            <span className="hidden sm:inline">{user.is_active ? 'Deactivate' : 'Activate'}</span>
                          </button>
                          
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition backdrop-blur-lg flex items-center gap-2"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedUser === user.id && (
                        <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bio */}
                            {user.bio && (
                              <div>
                                <h4 className="font-semibold mb-2">Bio</h4>
                                <p className={`text-sm ${textMuted}`}>{user.bio}</p>
                              </div>
                            )}
                            
                            {/* Full Skills List */}
                            {skillsArray.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-1">
                                  {skillsArray.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Full Languages List */}
                            {languagesArray.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Languages</h4>
                                <div className="flex flex-wrap gap-1">
                                  {languagesArray.map((lang, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-800 dark:text-green-200 rounded-full text-xs">
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Additional Info */}
                            <div>
                              <h4 className="font-semibold mb-2">Account Info</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className={textMuted}>User ID: </span>
                                  <code className="text-xs">{user.id}</code>
                                </div>
                                <div>
                                  <span className={textMuted}>Created: </span>
                                  <span>{formatDate(user.created_at)}</span>
                                </div>
                                <div>
                                  <span className={textMuted}>Last Updated: </span>
                                  <span>{formatDate(user.updated_at)}</span>
                                </div>
                                <div>
                                  <span className={textMuted}>Last Login: </span>
                                  <span>{formatDate(user.last_login_at)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Post Statistics */}
                            <div>
                              <h4 className="font-semibold mb-2">Post Statistics</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                  <div className="text-lg font-bold">{user.job_post_count || 0}</div>
                                  <div className="text-xs text-gray-500">Job Posts</div>
                                </div>
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                                  <div className="text-lg font-bold">{user.availability_post_count || 0}</div>
                                  <div className="text-xs text-gray-500">Availability Posts</div>
                                </div>
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'} col-span-2`}>
                                  <div className="text-lg font-bold">{user.post_count || 0}</div>
                                  <div className="text-xs text-gray-500">Total Posts</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredUsers.length > 0 && (
          <div className={`mt-6 p-6 rounded-xl backdrop-blur-lg ${bgCard} border-${borderColor}`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <p className={`text-lg font-semibold ${textPrimary}`}>
                  Showing {filteredUsers.length} of {users.length} users
                </p>
                <p className={`text-sm ${textMuted} mt-1`}>
                  {countryFilter === "all" 
                    ? `Across ${countryStats.length} countries` 
                    : `In ${countryFilter} (${countryStats.find(c => c.country === countryFilter)?.count || 0} users)`
                  }
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className={`px-3 py-2 rounded-lg ${
                  darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"
                }`}>
                  <div className="font-bold">{users.filter(u => u.role === 'employer').length}</div>
                  <div className="text-xs">Employers</div>
                </div>
                
                <div className={`px-3 py-2 rounded-lg ${
                  darkMode ? "bg-green-900/50 text-green-200" : "bg-green-100 text-green-800"
                }`}>
                  <div className="font-bold">{users.filter(u => u.role === 'job_seeker').length}</div>
                  <div className="text-xs">Job Seekers</div>
                </div>
                
                <div className={`px-3 py-2 rounded-lg ${
                  darkMode ? "bg-orange-900/50 text-orange-200" : "bg-orange-100 text-orange-800"
                }`}>
                  <div className="font-bold">{totalPostsAccurate}</div>
                  <div className="text-xs">Total Posts</div>
                </div>
                
                <div className={`px-3 py-2 rounded-lg ${
                  darkMode ? "bg-purple-900/50 text-purple-200" : "bg-purple-100 text-purple-800"
                }`}>
                  <div className="font-bold">{countryStats.length}</div>
                  <div className="text-xs">Countries</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}