"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { FileText, BarChart3, Users, Briefcase, Download, Calendar, TrendingUp, Eye } from "lucide-react";

type ReportData = {
  totalUsers: number;
  totalJobs: number;
  totalAvailabilities: number;
  newUsersThisWeek: number;
  newJobsThisWeek: number;
  userGrowth: number;
  jobGrowth: number;
  topCountries: { country: string; count: number }[];
  userActivity: { date: string; active_users: number }[];
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      fetchReportData();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch basic counts
      const { data: users } = await supabase.from("profiles").select("id, created_at");
      const { data: jobs } = await supabase.from("jobs").select("id, created_at");
      const { data: availabilities } = await supabase.from("availabilities").select("id, created_at");

      // Calculate weekly growth
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const newUsersThisWeek = users?.filter(u => new Date(u.created_at) > oneWeekAgo).length || 0;
      const newJobsThisWeek = jobs?.filter(j => new Date(j.created_at) > oneWeekAgo).length || 0;

      const usersLastWeek = users?.filter(u => new Date(u.created_at) > twoWeeksAgo && new Date(u.created_at) <= oneWeekAgo).length || 0;
      const jobsLastWeek = jobs?.filter(j => new Date(j.created_at) > twoWeeksAgo && new Date(j.created_at) <= oneWeekAgo).length || 0;

      const userGrowth = usersLastWeek > 0 ? ((newUsersThisWeek - usersLastWeek) / usersLastWeek) * 100 : 0;
      const jobGrowth = jobsLastWeek > 0 ? ((newJobsThisWeek - jobsLastWeek) / jobsLastWeek) * 100 : 0;

      // Mock data for demonstration
      const mockData: ReportData = {
        totalUsers: users?.length || 0,
        totalJobs: jobs?.length || 0,
        totalAvailabilities: availabilities?.length || 0,
        newUsersThisWeek,
        newJobsThisWeek,
        userGrowth,
        jobGrowth,
        topCountries: [
          { country: "Kenya", count: Math.floor((users?.length || 0) * 0.6) },
          { country: "Uganda", count: Math.floor((users?.length || 0) * 0.2) },
          { country: "Tanzania", count: Math.floor((users?.length || 0) * 0.1) },
          { country: "Rwanda", count: Math.floor((users?.length || 0) * 0.05) },
        ],
        userActivity: [
          { date: "Mon", active_users: 45 },
          { date: "Tue", active_users: 52 },
          { date: "Wed", active_users: 48 },
          { date: "Thu", active_users: 61 },
          { date: "Fri", active_users: 55 },
          { date: "Sat", active_users: 38 },
          { date: "Sun", active_users: 42 },
        ]
      };

      setReportData(mockData);
    } catch (error) {
      console.error("Error fetching report data:", error);
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

  const exportReport = () => {
    // In a real app, this would generate and download a CSV/PDF
    alert("Report export functionality would be implemented here");
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
            <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
            <p className={`${textMuted}`}>Platform analytics and performance reports</p>
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

        {/* Date Range Selector */}
        <div className={`mb-6 p-6 rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className={textPrimary}>Report Period:</span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={`p-8 rounded-xl backdrop-blur-lg border-2 text-center ${
            darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
          }`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={textMuted}>Loading report data...</p>
          </div>
        ) : reportData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Total Users</h3>
                </div>
                <p className="text-3xl font-bold mb-2">{reportData.totalUsers}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${reportData.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${reportData.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {reportData.userGrowth >= 0 ? '+' : ''}{reportData.userGrowth.toFixed(1)}%
                  </span>
                  <span className={`text-sm ${textMuted}`}>this week</span>
                </div>
              </div>

              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Job Posts</h3>
                </div>
                <p className="text-3xl font-bold mb-2">{reportData.totalJobs}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${reportData.jobGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${reportData.jobGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {reportData.jobGrowth >= 0 ? '+' : ''}{reportData.jobGrowth.toFixed(1)}%
                  </span>
                  <span className={`text-sm ${textMuted}`}>this week</span>
                </div>
              </div>

              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">New Users</h3>
                </div>
                <p className="text-3xl font-bold mb-2">{reportData.newUsersThisWeek}</p>
                <p className={`text-sm ${textMuted}`}>this week</p>
              </div>

              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">New Jobs</h3>
                </div>
                <p className="text-3xl font-bold mb-2">{reportData.newJobsThisWeek}</p>
                <p className={`text-sm ${textMuted}`}>this week</p>
              </div>
            </div>

            {/* Charts and Detailed Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity Chart */}
              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <h3 className="font-semibold text-lg mb-4">User Activity This Week</h3>
                <div className="space-y-2">
                  {reportData.userActivity.map((day, index) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="w-12 text-sm font-medium {textPrimary}">{day.date}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{ width: `${(day.active_users / 70) * 100}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-sm text-right {textPrimary}">{day.active_users}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Countries */}
              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <h3 className="font-semibold text-lg mb-4">Top Countries</h3>
                <div className="space-y-3">
                  {reportData.topCountries.map((country, index) => (
                    <div key={country.country} className="flex justify-between items-center">
                      <span className={textPrimary}>{country.country}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(country.count / reportData.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold w-8 text-right">{country.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
              >
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}