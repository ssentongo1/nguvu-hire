"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

type ApplyFormProps = {
  jobId: string;
  jobTitle: string;
  companyName?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ApplyForm({ jobId, jobTitle, companyName, onClose, onSuccess }: ApplyFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    additional_notes: ""
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [jobDeadline, setJobDeadline] = useState<string | null>(null);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const { darkMode } = useTheme();

  // Check if user has already applied to this job and get job deadline
  useEffect(() => {
    checkExistingApplication();
    fetchJobDeadline();
  }, [jobId]);

  const fetchJobDeadline = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('deadline')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      if (data?.deadline) {
        setJobDeadline(data.deadline);
        // Check if deadline has passed
        const deadlineDate = new Date(data.deadline);
        const today = new Date();
        setIsDeadlinePassed(deadlineDate < today);
      }
    } catch (error) {
      console.error("Error fetching job deadline:", error);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single();

      if (data) {
        setHasApplied(true);
      }
    } catch (error) {
      // No existing application found
      setHasApplied(false);
    }
  };

  // Text color utilities
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-700";
  const bgPrimary = darkMode ? "bg-gray-800" : "bg-white";
  const bgSecondary = darkMode ? "bg-gray-700" : "bg-gray-100";
  const borderColor = darkMode ? "border-gray-600" : "border-gray-300";

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file for your resume');
        e.target.value = '';
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Resume file size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setResumeFile(file);
    }
  };

  const handleCoverLetterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file for your cover letter');
        e.target.value = '';
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Cover letter file size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setCoverLetterFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    console.log(`Uploading ${file.name} to ${bucket} as ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('File uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  };

  const createNotification = async (userId: string, title: string, message: string, type: string, relatedId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_id: relatedId,
          is_read: false
        });

      if (error) {
        console.error('Notification error:', error);
      } else {
        console.log('✅ Notification created successfully for user:', userId);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const getJobPosterId = async (jobId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('created_by')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job poster:', error);
        return null;
      }

      return data?.created_by || null;
    } catch (error) {
      console.error('Error getting job poster:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent applications if deadline has passed
    if (isDeadlinePassed) {
      alert('This job has expired and is no longer accepting applications.');
      return;
    }

    // Prevent duplicate applications
    if (hasApplied) {
      alert('You have already applied to this job. You cannot apply again.');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Starting application submission...');

      // Validate required files
      if (!resumeFile || !coverLetterFile) {
        throw new Error('Please upload both resume and cover letter');
      }

      // Double-check job deadline before proceeding
      const { data: jobData } = await supabase
        .from('jobs')
        .select('deadline')
        .eq('id', jobId)
        .single();

      if (jobData?.deadline) {
        const deadlineDate = new Date(jobData.deadline);
        const today = new Date();
        if (deadlineDate < today) {
          setIsDeadlinePassed(true);
          throw new Error('This job has expired and is no longer accepting applications.');
        }
      }

      // Check again for existing application (race condition protection)
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single();

      if (existingApp) {
        setHasApplied(true);
        throw new Error('You have already applied to this job.');
      }

      // Upload files
      console.log('Uploading resume...');
      const resumeUrl = await uploadFile(resumeFile, 'resumes');
      
      console.log('Uploading cover letter...');
      const coverLetterUrl = await uploadFile(coverLetterFile, 'cover-letters');

      // Create application record
      console.log('Creating application record...');
      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          email: formData.email,
          phone: formData.phone,
          resume_url: resumeUrl,
          cover_letter_url: coverLetterUrl,
          additional_notes: formData.additional_notes,
          status: 'pending',
          applied_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Application submitted successfully:', data);
      
      if (data && data[0]) {
        const applicationId = data[0].id;
        
        // 1. Create success notification for APPLICANT
        createNotification(
          user.id,
          'Application Submitted',
          `Your application for "${jobTitle}" has been received successfully! We will notify you when the employer reviews your application.`,
          'application_submitted',
          applicationId
        );

        // 2. Create notification for EMPLOYER (job poster)
        const jobPosterId = await getJobPosterId(jobId);
        if (jobPosterId) {
          // Get applicant name for the employer notification
          const { data: applicantProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          const applicantName = applicantProfile 
            ? `${applicantProfile.first_name} ${applicantProfile.last_name}`.trim()
            : 'A new applicant';

          createNotification(
            jobPosterId,
            'New Job Application',
            `${applicantName} has applied for your "${jobTitle}" position.`,
            'new_application',
            applicationId
          );
          
          console.log('✅ Employer notified about new application');
        }
      }

      alert('Application submitted successfully! You will be notified when the employer reviews your application.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.email && formData.phone && resumeFile && coverLetterFile && !hasApplied && !isDeadlinePassed;

  // Show different UI if user has already applied
  if (hasApplied) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${bgPrimary} rounded-xl p-6 w-full max-w-md text-center`}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>
            Already Applied
          </h2>
          <p className={`mb-6 text-sm ${textSecondary}`}>
            You have already applied to <strong>{jobTitle}</strong>. 
            You cannot submit another application for this position.
          </p>
          <p className={`text-xs mb-6 ${textSecondary}`}>
            We'll notify you when the employer reviews your application.
          </p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg text-sm ${
              darkMode 
                ? "bg-purple-600 hover:bg-purple-700" 
                : "bg-blue-500 hover:bg-blue-600"
            } text-white transition`}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show expired job UI
  if (isDeadlinePassed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${bgPrimary} rounded-xl p-6 w-full max-w-md text-center`}>
          <div className="text-6xl mb-4">⏰</div>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>
            Application Closed
          </h2>
          <p className={`mb-6 text-sm ${textSecondary}`}>
            The application deadline for <strong>{jobTitle}</strong> has passed.
          </p>
          {jobDeadline && (
            <p className={`text-xs mb-6 ${textSecondary}`}>
              The deadline was {new Date(jobDeadline).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
          <p className={`text-xs mb-6 ${textSecondary}`}>
            This job is no longer accepting applications.
          </p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg text-sm ${
              darkMode 
                ? "bg-gray-600 hover:bg-gray-700" 
                : "bg-gray-500 hover:bg-gray-600"
            } text-white transition`}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${bgPrimary} rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
        <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>Apply for {jobTitle}</h2>
        {companyName && (
          <p className={`text-xs mb-4 ${textSecondary}`}>at {companyName}</p>
        )}
        
        {/* Deadline warning if approaching */}
        {jobDeadline && (
          <div className={`mb-4 p-3 rounded-lg text-xs ${
            darkMode ? 'bg-yellow-500/20 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
          }`}>
            ⏰ Application deadline: {new Date(jobDeadline).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${textPrimary}`}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${bgSecondary} ${borderColor} ${textPrimary}`}
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${textPrimary}`}>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${bgSecondary} ${borderColor} ${textPrimary}`}
              placeholder="+1234567890"
            />
          </div>

          {/* Resume Upload */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${textPrimary}`}>
              Upload Resume/CV (PDF) *
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeFileChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold text-xs ${
                darkMode 
                  ? 'file:bg-gray-600 file:text-white' 
                  : 'file:bg-gray-200 file:text-gray-700'
              } ${bgSecondary} ${borderColor} ${textPrimary}`}
            />
            <p className={`text-xs mt-1 ${textSecondary}`}>
              Upload your resume or CV in PDF format (max 5MB)
            </p>
            {resumeFile && (
              <p className={`text-xs mt-1 text-green-600 dark:text-green-400`}>
                ✓ Selected: {resumeFile.name}
              </p>
            )}
          </div>

          {/* Cover Letter Upload */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${textPrimary}`}>
              Upload Cover Letter (PDF) *
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleCoverLetterFileChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold text-xs ${
                darkMode 
                  ? 'file:bg-gray-600 file:text-white' 
                  : 'file:bg-gray-200 file:text-gray-700'
              } ${bgSecondary} ${borderColor} ${textPrimary}`}
            />
            <p className={`text-xs mt-1 ${textSecondary}`}>
              Upload your cover letter in PDF format (max 5MB)
            </p>
            {coverLetterFile && (
              <p className={`text-xs mt-1 text-green-600 dark:text-green-400`}>
                ✓ Selected: {coverLetterFile.name}
              </p>
            )}
          </div>

          {/* Optional Additional Notes */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${textPrimary}`}>
              Additional Notes (Optional)
            </label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${bgSecondary} ${borderColor} ${textPrimary}`}
              placeholder="Any additional notes or comments for the employer..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm ${borderColor} ${textPrimary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`flex-1 px-4 py-2 rounded-lg transition text-sm ${
                loading || !isFormValid
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}