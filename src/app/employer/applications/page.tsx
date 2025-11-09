"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  email: string;
  phone: string;
  resume_url: string;
  cover_letter_url: string;
  additional_notes: string;
  status: string;
  applied_at: string;
  job_id: string;
  applicant_id: string;
  job: {
    id: string;
    title: string;
    company: string;
    created_by: string;
  };
  applicant: {
    first_name: string;
    last_name: string;
    profile_picture_url: string;
  };
};

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { darkMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      console.log("🔄 Fetching applications for employer:", user.id);

      // Get this employer's jobs
      const { data: employerJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, company, created_by')
        .eq('created_by', user.id);

      if (jobsError) {
        console.error("❌ Error fetching employer jobs:", jobsError);
        throw jobsError;
      }

      console.log("👔 Employer's jobs:", employerJobs);

      if (!employerJobs || employerJobs.length === 0) {
        console.log("ℹ️ This employer has no jobs posted");
        setApplications([]);
        setLoading(false);
        return;
      }

      const jobIds = employerJobs.map(job => job.id);
      console.log("🔍 Job IDs to search for:", jobIds);

      // Get applications with job and applicant data
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(
            id,
            title, 
            company,
            created_by
          ),
          applicant:profiles(
            first_name, 
            last_name, 
            profile_picture_url
          )
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (applicationsError) {
        console.error("❌ Error fetching applications:", applicationsError);
        throw applicationsError;
      }

      console.log("🎯 Applications for employer's jobs:", applicationsData);
      setApplications(applicationsData || []);

    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      
      // Send notification to applicant
      await sendStatusNotification(applicationId, status);
      
      alert('Application status updated successfully!');
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const sendStatusNotification = async (applicationId: string, status: string) => {
    try {
      // Get application details for notification - simplified query
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('applicant_id, job_id')
        .eq('id', applicationId)
        .single();

      if (appError) {
        console.error('Error fetching application for notification:', appError);
        return;
      }

      if (!application) return;

      // Get job title separately
      const { data: job } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', application.job_id)
        .single();

      // Create notification record
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: application.applicant_id,
          title: 'Application Status Update',
          message: `Your application for "${job?.title || 'the job'}" has been ${status}.`,
          type: 'application_status',
          related_id: applicationId,
          is_read: false
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      } else {
        console.log('✅ Notification sent to applicant');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      return;
    }

    setDeletingId(applicationId);

    try {
      console.log("🗑️ Deleting application:", applicationId);
      
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error("❌ Delete error:", error);
        throw error;
      }

      console.log("✅ Application deleted successfully");
      
      // Remove from local state AND refetch to ensure consistency
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      
      alert('Application deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'accepted': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold mb-6">Applications</h1>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-sm">Loading applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">Job Applications</h1>
            <p className="text-xs opacity-75 mt-1">
              Review and manage applications for your job postings
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchApplications}
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
        
        {applications.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="opacity-75 mb-4 max-w-md mx-auto text-sm">
              Applications will appear here when job seekers apply to your jobs.
            </p>
            <button
              onClick={() => router.push("/post-job")}
              className={`px-6 py-2 rounded-lg text-sm ${
                darkMode 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-green-500 hover:bg-green-600"
              } text-white transition`}
            >
              Post a Job
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-xs opacity-75">
                Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
              </p>
            </div>

            {applications.map((application) => (
              <div key={application.id} className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {application.applicant?.profile_picture_url ? (
                        <img 
                          src={application.applicant.profile_picture_url} 
                          alt="Applicant" 
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(application.applicant?.first_name, application.applicant?.last_name)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {application.applicant?.first_name} {application.applicant?.last_name}
                      </h3>
                      <p className="opacity-75 text-sm">{application.job?.title}</p>
                      <p className="text-xs opacity-60">{application.email} • {application.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                </div>

                {application.additional_notes && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    darkMode 
                      ? 'bg-blue-900/20 border-blue-800 text-blue-200' 
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <p className={`text-xs font-semibold mb-2 flex items-center gap-2 ${
                      darkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      <span>💬</span>
                      Additional Notes from Applicant
                    </p>
                    <p className="leading-relaxed text-sm">
                      {application.additional_notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                  <div>
                    <p className="font-medium opacity-75">Applied On</p>
                    <p>{new Date(application.applied_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <div>
                    <p className="font-medium opacity-75">Job Posted By</p>
                    <p>{application.job?.company || 'Your Company'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition text-xs ${
                        darkMode 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                    >
                      📄 View Resume
                    </a>
                    <a
                      href={application.cover_letter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition text-xs ${
                        darkMode 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                    >
                      📝 View Cover Letter
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium opacity-75">Status:</span>
                      <select
                        value={application.status}
                        onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                        className={`px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          darkMode 
                            ? 'bg-gray-700 text-white border-gray-600' 
                            : 'bg-white text-gray-900 border-gray-300'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => deleteApplication(application.id)}
                      disabled={deletingId === application.id}
                      className={`px-3 py-2 rounded-lg text-xs transition flex items-center gap-2 ${
                        deletingId === application.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : darkMode 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-red-500 hover:bg-red-600"
                      } text-white`}
                    >
                      {deletingId === application.id ? 'Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}