"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { CheckCircle, X, Clock, User, Building2, Mail, Bell, Trash2, FileText, CreditCard, Shield, AlertCircle, CreditCardIcon } from "lucide-react";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    company_name?: string;
    role: string;
    email: string;
  };
};

type VerificationRequest = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "under_review";
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  user_profile: {
    first_name: string;
    last_name: string;
    company_name?: string;
    role: "job_seeker" | "employer";
    email: string;
  };
  verification_documents?: Array<{
    document_type: string;
    document_url: string;
    file_name: string;
  }>;
  verification_payments?: {
    amount: number;
    payment_method: string;
    status: string;
  };
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "verification">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchAllNotifications(),
        fetchAllVerificationRequests()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please check your admin permissions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNotifications = async () => {
    try {
      console.log("🔍 Fetching ALL notifications for admin...");
      
      // First, get all notifications without joins
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (notificationsError) {
        console.error("❌ Error fetching notifications:", notificationsError);
        setNotifications([]);
        return;
      }

      console.log(`📢 Found ${notificationsData?.length || 0} notifications`);

      if (!notificationsData || notificationsData.length === 0) {
        setNotifications([]);
        return;
      }

      // Get unique user IDs from notifications
      const userIds = [...new Set(notificationsData.map(notif => notif.user_id).filter(Boolean))];
      console.log(`👥 Found ${userIds.length} unique users in notifications`);

      let profilesMap = new Map();

      if (userIds.length > 0) {
        // Fetch profiles one by one to avoid complex queries
        for (const userId of userIds) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, company_name, role, email")
              .eq("id", userId)
              .single();

            if (profileError) {
              console.warn(`⚠️ Could not fetch profile for user ${userId}:`, profileError);
              // Add fallback profile
              profilesMap.set(userId, {
                first_name: "Unknown",
                last_name: "User",
                role: "unknown",
                email: "unknown@example.com"
              });
            } else if (profile) {
              profilesMap.set(userId, profile);
            }
          } catch (error) {
            console.warn(`⚠️ Error fetching profile for user ${userId}:`, error);
            profilesMap.set(userId, {
              first_name: "Unknown",
              last_name: "User",
              role: "unknown",
              email: "unknown@example.com"
            });
          }
        }
      }

      // Combine notifications with profile data
      const enrichedNotifications = notificationsData.map(notif => ({
        ...notif,
        user_profile: profilesMap.get(notif.user_id) || {
          first_name: "Unknown",
          last_name: "User", 
          role: "unknown",
          email: "unknown@example.com"
        }
      }));

      setNotifications(enrichedNotifications);
      console.log("✅ Notifications loaded successfully");

    } catch (error) {
      console.error("❌ Error in fetchAllNotifications:", error);
      setNotifications([]);
      setError("Failed to load notifications. Please check admin permissions.");
    }
  };

  const fetchAllVerificationRequests = async () => {
    try {
      console.log("🔍 Fetching ALL verification requests for admin...");
      
      // UPDATED: Get ALL verification requests (not just pending/under_review) so admin can see complete history
      const { data: verificationData, error: verificationError } = await supabase
        .from("verification_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (verificationError) {
        console.error("❌ Error fetching verification requests:", verificationError);
        setVerificationRequests([]);
        return;
      }

      console.log(`📋 Found ${verificationData?.length || 0} verification requests`);

      if (!verificationData || verificationData.length === 0) {
        setVerificationRequests([]);
        return;
      }

      // Get user IDs and request IDs
      const userIds = verificationData.map(req => req.user_id).filter(Boolean);
      const requestIds = verificationData.map(req => req.id);

      // Fetch user profiles one by one
      const profilesMap = new Map();
      for (const userId of userIds) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, company_name, role, email")
            .eq("id", userId)
            .single();

          if (profileError) {
            console.warn(`⚠️ Could not fetch profile for user ${userId}:`, profileError);
            profilesMap.set(userId, {
              first_name: "Unknown",
              last_name: "User",
              role: "job_seeker",
              email: "unknown@example.com"
            });
          } else if (profile) {
            profilesMap.set(userId, profile);
          }
        } catch (error) {
          console.warn(`⚠️ Error fetching profile for user ${userId}:`, error);
          profilesMap.set(userId, {
            first_name: "Unknown",
            last_name: "User",
            role: "job_seeker",
            email: "unknown@example.com"
          });
        }
      }

      // Fetch documents for these requests
      const documentsMap = new Map();
      if (requestIds.length > 0) {
        const { data: documentsData } = await supabase
          .from("verification_documents")
          .select("*")
          .in("verification_request_id", requestIds);

        if (documentsData) {
          documentsData.forEach(doc => {
            if (!documentsMap.has(doc.verification_request_id)) {
              documentsMap.set(doc.verification_request_id, []);
            }
            documentsMap.get(doc.verification_request_id).push(doc);
          });
        }
      }

      // Fetch payments
      const paymentIds = verificationData.map(req => req.payment_id).filter(Boolean);
      const paymentsMap = new Map();
      if (paymentIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from("verification_payments")
          .select("*")
          .in("id", paymentIds);

        if (paymentsData) {
          paymentsData.forEach(payment => {
            paymentsMap.set(payment.id, payment);
          });
        }
      }

      // Combine all data
      const enrichedData = verificationData.map(request => {
        const profile = profilesMap.get(request.user_id) || {
          first_name: "Unknown",
          last_name: "User",
          role: "job_seeker" as const,
          email: "unknown@example.com"
        };

        const documents = documentsMap.get(request.id) || [];
        const payment = request.payment_id ? paymentsMap.get(request.payment_id) : undefined;

        return {
          ...request,
          user_profile: profile,
          verification_documents: documents,
          verification_payments: payment
        };
      });

      setVerificationRequests(enrichedData);
      console.log("✅ Verification requests loaded successfully");

    } catch (error) {
      console.error("❌ Error fetching verification requests:", error);
      setVerificationRequests([]);
      setError("Failed to load verification requests");
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      alert("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.is_read);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadNotifications.map(notif => notif.id));

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
      alert("Failed to mark all notifications as read");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setSelectedNotification(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Failed to delete notification");
    }
  };

  const handleApproveVerification = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this verification request?")) return;
    
    setProcessing(true);
    try {
      // Update verification request status
      const { error: requestError } = await supabase
        .from("verification_requests")
        .update({
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Update user profile to verified
      const request = verificationRequests.find(r => r.id === requestId);
      if (request) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            is_verified: true,
            verified_at: new Date().toISOString()
          })
          .eq("id", request.user_id);

        if (profileError) throw profileError;

        // Send notification to user
        await sendUserNotification(
          request.user_id,
          "🎉 Verification Approved!",
          "Congratulations! Your account has been verified. You now have priority visibility in search results and a blue verification badge.",
          "verification_approved",
          requestId
        );

        alert("Verification approved successfully!");
        await fetchAllVerificationRequests();
        setSelectedVerification(null);
      }
    } catch (error) {
      console.error("Error approving verification:", error);
      alert("Failed to approve verification");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectVerification = async (requestId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setProcessing(true);
    try {
      const { error: requestError } = await supabase
        .from("verification_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      const request = verificationRequests.find(r => r.id === requestId);
      if (request) {
        await sendUserNotification(
          request.user_id,
          "❌ Verification Request Rejected",
          `Your verification request was rejected. Reason: ${reason}. You can submit a new request with corrected documents.`,
          "verification_rejected",
          requestId
        );

        alert("Verification rejected successfully!");
        await fetchAllVerificationRequests();
        setSelectedVerification(null);
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
      alert("Failed to reject verification");
    } finally {
      setProcessing(false);
    }
  };

  const sendUserNotification = async (userId: string, title: string, message: string, type: string, relatedId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error sending user notification:", error);
      }
    } catch (error) {
      console.error("Error in notification system:", error);
    }
  };

  // UPDATED: Added new notification types for the verification flow
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "verification_request":
      case "verification_submitted":
        return <Shield className="w-5 h-5 text-blue-500" />;
      case "verification_payment_received":
        return <CreditCardIcon className="w-5 h-5 text-green-500" />;
      case "hire_request":
        return <User className="w-5 h-5 text-green-500" />;
      case "application":
        return <Mail className="w-5 h-5 text-purple-500" />;
      case "verification_approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "verification_rejected":
        return <X className="w-5 h-5 text-red-500" />;
      case "system_alert":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "under_review": 
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "approved": 
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": 
        return <X className="w-4 h-4 text-red-500" />;
      default: 
        return null;
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Awaiting Documents";
      case "under_review": return "Under Review";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case "pending": return darkMode ? "bg-yellow-600/20 text-yellow-300" : "bg-yellow-100 text-yellow-800";
      case "under_review": return darkMode ? "bg-blue-600/20 text-blue-300" : "bg-blue-100 text-blue-800";
      case "approved": return darkMode ? "bg-green-600/20 text-green-300" : "bg-green-100 text-green-800";
      case "rejected": return darkMode ? "bg-red-600/20 text-red-300" : "bg-red-100 text-red-800";
      default: return darkMode ? "bg-gray-600/20 text-gray-300" : "bg-gray-100 text-gray-800";
    }
  };

  // UPDATED: Filter to show actionable verification requests (pending and under_review)
  const actionableVerificationRequests = verificationRequests.filter(
    request => request.status === "pending" || request.status === "under_review"
  );

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "unread") return !notif.is_read;
    if (activeTab === "verification") return notif.type.includes("verification");
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.is_read).length;
  const verificationCount = actionableVerificationRequests.length;

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className={darkMode ? "text-white" : "text-gray-900"}>Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              Platform-wide notifications and verification management
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {unreadCount > 0 && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                darkMode ? "bg-red-600 text-white" : "bg-red-500 text-white"
              }`}>
                {unreadCount} unread notifications
              </div>
            )}
            {verificationCount > 0 && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                darkMode ? "bg-yellow-600 text-white" : "bg-yellow-500 text-white"
              }`}>
                {verificationCount} pending verifications
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            darkMode ? "bg-red-600/20 border border-red-500" : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className={darkMode ? "text-red-300" : "text-red-800"}>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className={`p-1 rounded ${
                  darkMode ? "hover:bg-red-500/20" : "hover:bg-red-100"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${
            darkMode ? "bg-blue-600/20 border border-blue-500" : "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Total Notifications</h3>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            darkMode ? "bg-yellow-600/20 border border-yellow-500" : "bg-yellow-50 border border-yellow-200"
          }`}>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold">Pending Verifications</h3>
                <p className="text-2xl font-bold">{verificationCount}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            darkMode ? "bg-green-600/20 border border-green-500" : "bg-green-50 border border-green-200"
          }`}>
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Active Users</h3>
                <p className="text-2xl font-bold">
                  {[...new Set(notifications.map(n => n.user_id))].length}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            darkMode ? "bg-purple-600/20 border border-purple-500" : "bg-purple-50 border border-purple-200"
          }`}>
            <div className="flex items-center gap-3">
              <CreditCardIcon className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Total Verifications</h3>
                <p className="text-2xl font-bold">{verificationRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-lg mb-6 ${
          darkMode ? "bg-gray-700" : "bg-gray-200"
        }`}>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              activeTab === "all"
                ? darkMode ? "bg-purple-600 text-white shadow" : "bg-white text-gray-900 shadow"
                : darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Platform Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              activeTab === "unread"
                ? darkMode ? "bg-purple-600 text-white shadow" : "bg-white text-gray-900 shadow"
                : darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("verification")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              activeTab === "verification"
                ? darkMode ? "bg-purple-600 text-white shadow" : "bg-white text-gray-900 shadow"
                : darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Verification Requests ({verificationCount})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              unreadCount === 0
                ? "bg-gray-400 cursor-not-allowed"
                : darkMode 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            Mark All as Read
          </button>
          <button
            onClick={fetchData}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              darkMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Refresh Dashboard
          </button>
        </div>

        {/* Content */}
        {activeTab === "verification" ? (
          /* Verification Requests - Platform Wide */
          <div className={`rounded-lg ${
            darkMode ? "bg-white/5" : "bg-white border border-gray-200"
          }`}>
            {actionableVerificationRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold mb-2">No Pending Verification Requests</h3>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  All verification requests across the platform have been processed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {actionableVerificationRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-6 hover:bg-opacity-50 cursor-pointer transition ${
                      darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedVerification(request)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          darkMode ? "bg-gray-700" : "bg-gray-200"
                        }`}>
                          {request.user_profile.role === "employer" ? (
                            <Building2 className="w-6 h-6" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">
                            {request.user_profile.role === "employer" 
                              ? request.user_profile.company_name 
                              : `${request.user_profile.first_name} ${request.user_profile.last_name}`
                            }
                          </h3>
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {request.user_profile.email} • {request.user_profile.role === "employer" ? "Employer" : "Job Seeker"}
                          </p>
                          <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            Submitted {new Date(request.created_at).toLocaleDateString()}
                            {request.submitted_at && ` • Documents submitted ${new Date(request.submitted_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getVerificationStatusColor(request.status)}`}>
                          {getVerificationStatusIcon(request.status)}
                          <span className="capitalize">{getVerificationStatusText(request.status)}</span>
                        </div>
                        
                        {request.verification_payments && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            darkMode ? "bg-green-600/20" : "bg-green-100"
                          }`}>
                            ${request.verification_payments.amount} • {request.verification_payments.payment_method}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {request.status !== "approved" && request.status !== "rejected" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveVerification(request.id);
                                }}
                                disabled={processing}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectVerification(request.id);
                                }}
                                disabled={processing}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Documents Preview */}
                    {request.verification_documents && request.verification_documents.length > 0 && (
                      <div className="mt-4">
                        <p className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Documents submitted: {request.verification_documents.length} file(s)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {request.verification_documents.map((doc, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                                darkMode ? "bg-blue-600/20 text-blue-300" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              {doc.document_type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status-specific messages */}
                    {request.status === "pending" && (
                      <div className={`mt-3 p-2 rounded text-xs ${
                        darkMode ? "bg-yellow-600/20 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        ⏳ Waiting for user to submit documents
                      </div>
                    )}
                    {request.status === "under_review" && (
                      <div className={`mt-3 p-2 rounded text-xs ${
                        darkMode ? "bg-blue-600/20 text-blue-300" : "bg-blue-100 text-blue-800"
                      }`}>
                        📋 Documents submitted - Ready for review
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Platform Notifications List */
          <div className={`rounded-lg ${
            darkMode ? "bg-white/5" : "bg-white border border-gray-200"
          }`}>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === "unread" ? "No Unread Notifications" : "No Platform Notifications"}
                </h3>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  {activeTab === "unread" 
                    ? "All platform notifications are read!" 
                    : "Platform notifications will appear here from all users"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-opacity-50 cursor-pointer transition ${
                      darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                    } ${!notification.is_read ? darkMode ? "bg-blue-600/10" : "bg-blue-50" : ""}`}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold text-lg ${!notification.is_read ? "font-bold" : ""}`}>
                              {notification.title}
                            </h3>
                            <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.is_read && (
                              <div className={`w-2 h-2 rounded-full ${
                                darkMode ? "bg-blue-400" : "bg-blue-500"
                              }`}></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className={`p-1 rounded transition ${
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(notification.created_at).toLocaleDateString()} at{" "}
                            {new Date(notification.created_at).toLocaleTimeString()}
                          </span>
                          
                          {notification.user_profile && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              darkMode ? "bg-gray-700" : "bg-gray-200"
                            }`}>
                              {notification.user_profile.role === "employer" 
                                ? notification.user_profile.company_name 
                                : `${notification.user_profile.first_name} ${notification.user_profile.last_name}`
                              }
                            </span>
                          )}
                          
                          <span className={`text-xs px-2 py-1 rounded capitalize ${
                            notification.type === "verification_request" 
                              ? darkMode ? "bg-blue-600/20 text-blue-300" : "bg-blue-100 text-blue-800"
                              : notification.type === "verification_payment_received"
                              ? darkMode ? "bg-green-600/20 text-green-300" : "bg-green-100 text-green-800"
                              : notification.type === "verification_submitted"
                              ? darkMode ? "bg-purple-600/20 text-purple-300" : "bg-purple-100 text-purple-800"
                              : notification.type === "hire_request"
                              ? darkMode ? "bg-green-600/20 text-green-300" : "bg-green-100 text-green-800"
                              : notification.type.includes("verification")
                              ? darkMode ? "bg-purple-600/20 text-purple-300" : "bg-purple-100 text-purple-800"
                              : darkMode ? "bg-gray-600/20 text-gray-300" : "bg-gray-100 text-gray-800"
                          }`}>
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className={`p-6 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } sticky top-0 bg-inherit`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Platform Notification Details</h2>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className={`p-2 rounded-full transition ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {getNotificationIcon(selectedNotification.type)}
                <div>
                  <h3 className="text-lg font-semibold">{selectedNotification.title}</h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    {new Date(selectedNotification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.user_profile && (
                <div className={`p-4 rounded-lg mb-6 ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <p>
                    {selectedNotification.user_profile.role === "employer" 
                      ? selectedNotification.user_profile.company_name 
                      : `${selectedNotification.user_profile.first_name} ${selectedNotification.user_profile.last_name}`
                    }
                  </p>
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    {selectedNotification.user_profile.email} • {selectedNotification.user_profile.role}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (!selectedNotification.is_read) {
                      markAsRead(selectedNotification.id);
                    }
                    setSelectedNotification(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    darkMode 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => deleteNotification(selectedNotification.id)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    darkMode 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className={`p-6 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } sticky top-0 bg-inherit`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Verification Request Details</h2>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className={`p-2 rounded-full transition ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Name
                      </label>
                      <p className={darkMode ? "text-white" : "text-gray-900"}>
                        {selectedVerification.user_profile.first_name} {selectedVerification.user_profile.last_name}
                      </p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Email
                      </label>
                      <p className={darkMode ? "text-white" : "text-gray-900"}>
                        {selectedVerification.user_profile.email}
                      </p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Role
                      </label>
                      <p className={darkMode ? "text-white" : "text-gray-900"}>
                        {selectedVerification.user_profile.role === "employer" ? "Employer" : "Job Seeker"}
                      </p>
                    </div>
                    {selectedVerification.user_profile.company_name && (
                      <div>
                        <label className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Company
                        </label>
                        <p className={darkMode ? "text-white" : "text-gray-900"}>
                          {selectedVerification.user_profile.company_name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Information */}
                  {selectedVerification.verification_payments && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Amount:</span>
                          <span className={darkMode ? "text-white" : "text-gray-900"}>
                            ${selectedVerification.verification_payments.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Method:</span>
                          <span className={darkMode ? "text-white" : "text-gray-900"}>
                            {selectedVerification.verification_payments.payment_method}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Status:</span>
                          <span className={darkMode ? "text-white" : "text-gray-900"}>
                            {selectedVerification.verification_payments.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Document Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
                  {selectedVerification.verification_documents && selectedVerification.verification_documents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVerification.verification_documents.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{doc.document_type}</h4>
                            <span className="text-sm text-gray-500">{doc.file_name}</span>
                          </div>
                          <div className="flex gap-2">
                            <img
                              src={doc.document_url}
                              alt={doc.document_type}
                              className="w-32 h-32 object-cover rounded border"
                            />
                            <a
                              href={doc.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="self-start px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                            >
                              View Full
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                      No documents uploaded yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedVerification.status !== "approved" && selectedVerification.status !== "rejected" && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApproveVerification(selectedVerification.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 font-semibold"
                  >
                    Approve Verification
                  </button>
                  <button
                    onClick={() => handleRejectVerification(selectedVerification.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 font-semibold"
                  >
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}