"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { CreditCard, DollarSign, Users, TrendingUp, Calendar, Download, Eye } from "lucide-react";

type BillingRecord = {
  id: string;
  user_email: string;
  user_name: string;
  plan: 'basic' | 'premium' | 'enterprise';
  amount: number;
  status: 'active' | 'canceled' | 'pending';
  created_at: string;
  renews_at: string;
};

export default function AdminBillingPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyRecurring: 0,
    averageRevenue: 0
  });

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      loadBillingData();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Mock billing data - in a real app, this would come from your payment processor
      const mockData: BillingRecord[] = [
        {
          id: '1',
          user_email: 'company@example.com',
          user_name: 'Tech Solutions Ltd',
          plan: 'premium',
          amount: 99,
          status: 'active',
          created_at: '2024-01-15',
          renews_at: '2024-02-15'
        },
        {
          id: '2',
          user_email: 'startup@example.com',
          user_name: 'Startup Innovations',
          plan: 'basic',
          amount: 29,
          status: 'active',
          created_at: '2024-01-20',
          renews_at: '2024-02-20'
        },
        {
          id: '3',
          user_email: 'corp@example.com',
          user_name: 'Corporate Solutions',
          plan: 'enterprise',
          amount: 299,
          status: 'active',
          created_at: '2024-01-10',
          renews_at: '2024-02-10'
        }
      ];

      setBillingData(mockData);

      // Calculate stats
      const totalRevenue = mockData.reduce((sum, record) => sum + record.amount, 0);
      const activeSubscriptions = mockData.filter(record => record.status === 'active').length;
      const monthlyRecurring = mockData
        .filter(record => record.status === 'active')
        .reduce((sum, record) => sum + record.amount, 0);
      const averageRevenue = activeSubscriptions > 0 ? monthlyRecurring / activeSubscriptions : 0;

      setStats({
        totalRevenue,
        activeSubscriptions,
        monthlyRecurring,
        averageRevenue
      });
    } catch (error) {
      console.error("Error loading billing data:", error);
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

  const exportBillingReport = () => {
    alert("Billing report export would be implemented here");
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'premium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
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
            <h1 className="text-3xl font-bold mb-2">Billing & Subscriptions</h1>
            <p className={`${textMuted}`}>Subscription and payment management</p>
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

        {loading ? (
          <div className={`p-8 rounded-xl backdrop-blur-lg border-2 text-center ${
            darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
          }`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={textMuted}>Loading billing data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Monthly Revenue</h3>
                </div>
                <p className="text-3xl font-bold mb-2">${stats.monthlyRecurring}</p>
                <p className={`text-sm ${textMuted}`}>Recurring revenue</p>
              </div>

              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Active Subscriptions</h3>
                </div>
                <p className="text-3xl font-bold mb-2">{stats.activeSubscriptions}</p>
                <p className={`text-sm ${textMuted}`}>Paying customers</p>
              </div>

              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Average Revenue</h3>
                </div>
                <p className="text-3xl font-bold mb-2">${stats.averageRevenue.toFixed(2)}</p>
                <p className={`text-sm ${textMuted}`}>Per customer</p>
              </div>

              <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
                darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Total Revenue</h3>
                </div>
                <p className="text-3xl font-bold mb-2">${stats.totalRevenue}</p>
                <p className={`text-sm ${textMuted}`}>All time</p>
              </div>
            </div>

            {/* Subscription Plans Breakdown */}
            <div className={`p-6 rounded-xl backdrop-blur-lg border-2 ${
              darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
            }`}>
              <h3 className="font-semibold text-lg mb-4">Subscription Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Basic Plan</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">$29</p>
                  <p className="text-sm text-green-600 dark:text-green-300">per month</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    {billingData.filter(b => b.plan === 'basic').length} subscribers
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Premium Plan</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">$99</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">per month</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    {billingData.filter(b => b.plan === 'premium').length} subscribers
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">Enterprise Plan</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">$299</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">per month</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                    {billingData.filter(b => b.plan === 'enterprise').length} subscribers
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Records */}
            <div className={`rounded-xl backdrop-blur-lg border-2 ${
              darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
            }`}>
              <div className="p-6 border-b border-gray-200 dark:border-white/20 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Subscription Records</h3>
                <button
                  onClick={exportBillingReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
              
              <div className="overflow-hidden">
                {billingData.length === 0 ? (
                  <div className="p-8 text-center">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No billing records</h3>
                    <p className={textMuted}>No subscription data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-0">
                    {billingData.map((record, index) => (
                      <div
                        key={record.id}
                        className={`p-6 border-b ${
                          darkMode ? "border-white/20" : "border-gray-200"
                        } ${index === billingData.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-xl font-bold ${textPrimary}`}>
                                {record.user_name}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(record.plan)}`}>
                                {record.plan.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                {record.status.toUpperCase()}
                              </span>
                            </div>
                            
                            <p className={`text-sm ${textMuted} mb-3`}>{record.user_email}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className={textMuted}>Amount: ${record.amount}/month</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className={textMuted}>
                                  Started: {new Date(record.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className={textMuted}>
                                  Renews: {new Date(record.renews_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition backdrop-blur-lg"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
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
        )}
      </div>
    </div>
  );
}