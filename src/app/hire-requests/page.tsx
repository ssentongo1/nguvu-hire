"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { Briefcase, Calendar, MapPin, Building, Check, X, MessageCircle, Trash2 } from "lucide-react";

type HireRequest = {
  id: string;
  employer_id: string;
  job_seeker_id: string;
  availability_id: string;
  job_seeker_name: string;
  desired_position: string;
  status: string;
  employer_message: string;
  job_seeker_response: string;
  created_at: string;
  updated_at: string;
  employer: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
    profile_picture_url: string;
    employer_type: string;
  };
  availability: {
    desired_job: string;
    location: string;
    country: string;
  };
};

export default function HireRequestsPage() {
  const [hireRequests, setHireRequests] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { darkMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchHireRequests();
  }, []);

  const fetchHireRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      console.log("🔄 Fetching hire requests for user:", user.id);

      const { data, error } = await supabase
        .from("hires")
        .select(`
          *,
          employer:profiles!hires_employer_id_fkey(
            id,
            first_name,
            last_name,
            company_name,
            profile_picture_url,
            employer_type
          ),
          availability:availabilities!hires_availability_id_fkey(
            desired_job,
            location,
            country
          )
        `)
        .eq("job_seeker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching hire requests:", error);
        throw error;
      }

      console.log("🎯 Hire requests:", data);
      setHireRequests(data || []);

    } catch (error) {
      console.error('Error fetching hire requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateHireStatus = async (hireId: string, status: string) => {
    setUpdatingId(hireId);
    
    try {
      const { data, error } = await supabase
        .from("hires")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", hireId)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      // Update local state
      setHireRequests(prev => prev.map(hire => 
        hire.id === hireId ? { ...hire, status } : hire
      ));

      // Send notification to employer
      await sendStatusNotification(hireId, status);
      
      alert(`Hire request ${status} successfully!`);
    } catch (error: any) {
      console.error('Error updating hire status:', error);
      alert('Failed to update hire request: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const sendStatusNotification = async (hireId: string, status: string) => {
    try {
      const hireRequest = hireRequests.find(hr => hr.id === hireId);
      if (!hireRequest) return;

      const statusMessage = {
        accepted: `🎉 ${hireRequest.job_seeker_name} accepted your hire request for ${hireRequest.desired_position}!`,
        rejected: `😞 ${hireRequest.job_seeker_name} declined your hire request for ${hireRequest.desired_position}.`
      }[status] || `Your hire request status has been updated to ${status}.`;

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: hireRequest.employer_id,
          title: 'Hire Request Update',
          message: statusMessage,
          type: 'hire_status_update',
          related_id: hireId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notifError) {
        console.error('Error creating status notification:', notifError);
      } else {
        console.log('✅ Status notification sent to employer');
      }
    } catch (error) {
      console.error('Error sending status notification:', error);
    }
  };

  const deleteHireRequest = async (hireId: string) => {
    if (!confirm("Are you sure you want to delete this hire request? This action cannot be undone.")) {
      return;
    }

    setDeletingId(hireId);

    try {
      const { error } = await supabase
        .from("hires")
        .delete()
        .eq("id", hireId);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Remove from local state immediately
      setHireRequests(prev => prev.filter(hire => hire.id !== hireId));
      
      console.log("✅ Hire request deleted successfully");
      
    } catch (error: any) {
      console.error('Error deleting hire request:', error);
      alert('Failed to delete hire request: ' + error.message);
      
      // Refresh to ensure consistency
      fetchHireRequests();
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'E';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-6">Hire Requests</h1>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-sm">Loading hire requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Hire Requests</h1>
            <p className="text-xs opacity-75 mt-1">
              Manage incoming job offers from employers
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={fetchHireRequests}
              className={`px-4 py-2 rounded-lg text-sm ${
                darkMode 
                  ? "bg-gray-700 hover:bg-gray-600" 
                  : "bg-gray-200 hover:bg-gray-300"
              } transition`}
            >
              Refresh
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className={`px-4 py-2 rounded-lg text-sm ${
                darkMode 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        {hireRequests.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-lg font-semibold mb-2">No hire requests yet</h3>
            <p className="opacity-75 mb-4 max-w-md mx-auto text-sm">
              When employers want to hire you, their requests will appear here.
            </p>
            <button
              onClick={() => router.push("/post-availability")}
              className={`px-6 py-2 rounded-lg text-sm ${
                darkMode 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-green-500 hover:bg-green-600"
              } text-white transition`}
            >
              Update Your Availability
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-xs opacity-75">
                Showing {hireRequests.length} hire request{hireRequests.length !== 1 ? 's' : ''}
              </p>
            </div>

            {hireRequests.map((hire) => (
              <div key={hire.id} className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {hire.employer?.profile_picture_url ? (
                        <img 
                          src={hire.employer.profile_picture_url} 
                          alt="Employer" 
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(hire.employer?.first_name, hire.employer?.last_name)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {hire.employer?.company_name || `${hire.employer?.first_name} ${hire.employer?.last_name}`}
                      </h3>
                      <p className="opacity-75 flex items-center gap-1 text-sm">
                        <Briefcase className="w-4 h-4" />
                        {hire.desired_position}
                      </p>
                      <p className="text-xs opacity-60 flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {hire.employer?.employer_type || 'Employer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hire.status)}`}>
                      <span className="mr-1">{getStatusIcon(hire.status)}</span>
                      {hire.status.charAt(0).toUpperCase() + hire.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Employer Message */}
                {hire.employer_message && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    darkMode 
                      ? 'bg-blue-900/20 border-blue-800 text-blue-200' 
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <p className={`text-xs font-semibold mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      <MessageCircle className="w-4 h-4" />
                      Message from Employer
                    </p>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {hire.employer_message}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-60" />
                    <div>
                      <p className="font-medium opacity-75">Received On</p>
                      <p>{formatDate(hire.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 opacity-60" />
                    <div>
                      <p className="font-medium opacity-75">Your Preferred Location</p>
                      <p>{hire.availability?.location}, {hire.availability?.country}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Only show for pending requests */}
                {hire.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t dark:border-gray-700">
                    <button
                      onClick={() => updateHireStatus(hire.id, 'accepted')}
                      className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-xs sm:text-sm ${
                        darkMode 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                      disabled={updatingId === hire.id}
                    >
                      <Check className="w-4 h-4" />
                      {updatingId === hire.id ? 'Accepting...' : 'Accept Offer'}
                    </button>
                    
                    <button
                      onClick={() => updateHireStatus(hire.id, 'rejected')}
                      disabled={updatingId === hire.id}
                      className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-xs sm:text-sm ${
                        darkMode 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-red-500 hover:bg-red-600"
                      } text-white`}
                    >
                      <X className="w-4 h-4" />
                      {updatingId === hire.id ? 'Declining...' : 'Decline Offer'}
                    </button>
                  </div>
                )}

                {/* Delete button for non-pending requests */}
                {hire.status !== 'pending' && (
                  <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                    <button
                      onClick={() => deleteHireRequest(hire.id)}
                      disabled={deletingId === hire.id}
                      className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-xs ${
                        deletingId === hire.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : darkMode 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-red-500 hover:bg-red-600"
                      } text-white`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === hire.id ? 'Deleting...' : 'Delete Request'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}