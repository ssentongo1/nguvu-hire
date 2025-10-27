"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Briefcase, User, Search, Filter, Trash2, Eye, Calendar, AlertCircle } from "lucide-react";

type Post = {
  id: string;
  type: 'job' | 'availability';
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  author_name: string;
  author_email: string;
};

export default function AdminPostsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      fetchPosts();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching posts...");
      
      // Fetch jobs - SIMPLIFIED without joins
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error("Jobs error:", jobsError);
        throw jobsError;
      }

      // Fetch availabilities - SIMPLIFIED without joins
      const { data: availabilities, error: availabilitiesError } = await supabase
        .from('availabilities')
        .select('*')
        .order('created_at', { ascending: false });

      if (availabilitiesError) {
        console.error("Availabilities error:", availabilitiesError);
        throw availabilitiesError;
      }

      console.log("Jobs:", jobs);
      console.log("Availabilities:", availabilities);

      // Transform jobs - use data that definitely exists
      const jobPosts: Post[] = (jobs || []).map(job => ({
        id: job.id,
        type: 'job',
        title: job.title || 'Untitled Job',
        description: job.description || 'No description',
        created_by: job.created_by || 'unknown',
        created_at: job.created_at,
        author_name: 'User', // We'll fetch names separately if needed
        author_email: 'No email'
      }));

      // Transform availabilities - use data that definitely exists
      const availabilityPosts: Post[] = (availabilities || []).map(avail => ({
        id: avail.id,
        type: 'availability',
        title: avail.desired_job || 'Seeking Opportunities',
        description: avail.description || 'No description',
        created_by: avail.created_by || 'unknown',
        created_at: avail.created_at,
        author_name: avail.name || 'User',
        author_email: 'No email'
      }));

      // Combine and sort by date
      const allPosts = [...jobPosts, ...availabilityPosts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("All posts:", allPosts);
      setPosts(allPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts. Please check the console for details.");
      // Set empty array if there's an error
      setPosts([]);
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

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (post.title?.toLowerCase() || '').includes(searchLower) ||
      (post.description?.toLowerCase() || '').includes(searchLower) ||
      (post.author_name?.toLowerCase() || '').includes(searchLower);
    
    const matchesType = typeFilter === "all" || post.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const deletePost = async (postId: string, postType: 'job' | 'availability') => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const table = postType === 'job' ? 'jobs' : 'availabilities';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Refresh the list
      fetchPosts();
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post");
    }
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
            <h1 className="text-3xl font-bold mb-2">Post Management</h1>
            <p className={`${textMuted}`}>
              Manage all job and availability posts
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
                placeholder="Search posts by title, description, or author..."
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">All Posts</option>
                <option value="job">Jobs Only</option>
                <option value="availability">Availabilities Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className={`rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={textMuted}>Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
                {searchQuery || typeFilter !== "all" ? "No posts found" : "No posts created yet"}
              </h3>
              <p className={textMuted}>
                {searchQuery || typeFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "When users create job or availability posts, they will appear here."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 gap-0">
                {filteredPosts.map((post, index) => (
                  <div
                    key={`${post.type}-${post.id}`}
                    className={`p-6 border-b ${
                      darkMode ? "border-white/20" : "border-gray-200"
                    } ${index === filteredPosts.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {post.type === 'job' ? (
                            <Briefcase className="w-5 h-5 text-blue-500" />
                          ) : (
                            <User className="w-5 h-5 text-green-500" />
                          )}
                          <h3 className={`text-xl font-bold ${textPrimary}`}>
                            {post.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            post.type === 'job'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                          }`}>
                            {post.type === 'job' ? 'JOB' : 'AVAILABILITY'}
                          </span>
                        </div>
                        
                        <p className={`mb-3 line-clamp-2 ${textMuted}`}>
                          {post.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>By: {post.author_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => deletePost(post.id, post.type)}
                          className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition backdrop-blur-lg"
                          title="Delete Post"
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
        {!loading && filteredPosts.length > 0 && (
          <div className={`mt-4 p-4 rounded-lg backdrop-blur-lg ${
            darkMode ? "bg-white/10 border border-white/20" : "bg-white/80 border border-gray-200"
          }`}>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${textMuted}`}>
                Showing {filteredPosts.length} of {posts.length} posts
              </p>
              <div className="flex gap-4 text-sm">
                <span className={`px-2 py-1 rounded-full ${
                  darkMode ? "bg-blue-900/50 text-blue-200" : "bg-blue-100 text-blue-800"
                }`}>
                  Jobs: {posts.filter(p => p.type === 'job').length}
                </span>
                <span className={`px-2 py-1 rounded-full ${
                  darkMode ? "bg-green-900/50 text-green-200" : "bg-green-100 text-green-800"
                }`}>
                  Availabilities: {posts.filter(p => p.type === 'availability').length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {error && (
          <div className="mt-6 text-center">
            <button
              onClick={fetchPosts}
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