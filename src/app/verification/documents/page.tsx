"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Upload, CheckCircle, ArrowLeft, Shield, X } from "lucide-react";

export default function VerificationDocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useTheme();
  
  const [requestId, setRequestId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<{[key: string]: { file: File | null; url: string | null } }>({
    id_front: { file: null, url: null },
    id_back: { file: null, url: null },
    selfie: { file: null, url: null }
  });
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const requestParam = searchParams.get('request');
    const testParam = searchParams.get('test');
    
    if (!requestParam) {
      router.push('/pricing?verify=true');
      return;
    }
    
    setRequestId(requestParam);
    setIsTestMode(testParam === 'true');

    // Get user profile for display
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    };

    getUserProfile();
  }, [router, searchParams]);

  // Simulate upload progress since Supabase doesn't provide it
  const simulateUploadProgress = (documentType: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({...prev, [documentType]: progress}));
    }, 200);
    
    return interval;
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!requestId || !file) return;

    setUploading(documentType);
    setUploadProgress(prev => ({...prev, [documentType]: 0}));

    // Start progress simulation
    const progressInterval = simulateUploadProgress(documentType);

    try {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload JPG, PNG, or PDF files only');
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}_${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `verification-documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);

      // Save document record
      const { error: docError } = await supabase
        .from('verification_documents')
        .insert({
          verification_request_id: requestId,
          document_type: documentType,
          document_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        });

      if (docError) {
        // If document record fails, delete the uploaded file
        await supabase.storage
          .from('verification-documents')
          .remove([filePath]);
        throw new Error(docError.message);
      }

      // Update local state
      setDocuments(prev => ({
        ...prev, 
        [documentType]: { file, url: publicUrl }
      }));

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload ${getDocumentTitle(documentType)}: ${error.message}`);
    } finally {
      clearInterval(progressInterval);
      setUploading(null);
      setUploadProgress(prev => ({...prev, [documentType]: 0}));
    }
  };

  const removeDocument = async (documentType: string) => {
    if (!requestId) return;

    try {
      const document = documents[documentType];
      if (document.url) {
        // Extract file path from URL and remove from storage
        const urlParts = document.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `verification-documents/${fileName}`;

        await supabase.storage
          .from('verification-documents')
          .remove([filePath]);

        // Delete document record
        await supabase
          .from('verification_documents')
          .delete()
          .eq('verification_request_id', requestId)
          .eq('document_type', documentType);
      }

      setDocuments(prev => ({
        ...prev, 
        [documentType]: { file: null, url: null }
      }));

    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!requestId) return;

    // Check if all required documents are uploaded
    const requiredDocs = ['id_front', 'id_back', 'selfie'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc].file);

    if (missingDocs.length > 0) {
      const missingTitles = missingDocs.map(doc => getDocumentTitle(doc)).join(', ');
      alert(`Please upload all required documents: ${missingTitles}`);
      return;
    }

    setSubmitting(true);

    try {
      // FIXED: Update verification request status to 'under_review' when documents are submitted
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({ 
          status: 'under_review',
          submitted_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // FIXED: Send notification to admin that documents are submitted
      await sendAdminNotification(requestId);

      // Create notifications for admin and user
      await createNotifications(requestId);

      // Redirect to success page
      router.push('/verification/success');

    } catch (error: any) {
      console.error('Submission error:', error);
      alert(`Failed to submit verification request: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // NEW FUNCTION: Send notification to admin when documents are submitted
  const sendAdminNotification = async (requestId: string) => {
    try {
      // Get admin users
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0) {
        const adminUserId = adminUsers[0].id;
        
        // Get user info for the notification
        const { data: request } = await supabase
          .from('verification_requests')
          .select('user_id')
          .eq('id', requestId)
          .single();

        if (request) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, company_name, role')
            .eq('id', request.user_id)
            .single();

          if (userProfile) {
            const userName = userProfile.role === 'employer' 
              ? userProfile.company_name || `${userProfile.first_name} ${userProfile.last_name}`
              : `${userProfile.first_name} ${userProfile.last_name}`;

            await supabase
              .from('notifications')
              .insert({
                user_id: adminUserId,
                title: '📄 Verification Documents Submitted',
                message: `${userName} has submitted all verification documents and is ready for review.`,
                type: 'verification_submitted',
                related_id: requestId,
                is_read: false,
                created_at: new Date().toISOString()
              });
          }
        }
      }
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't block submission if notification fails
    }
  };

  const createNotifications = async (requestId: string) => {
    try {
      // Get user info for notifications
      const { data: request, error: requestError } = await supabase
        .from('verification_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Get user profile separately
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, company_name, role')
        .eq('id', request.user_id)
        .single();

      if (profileError) throw profileError;

      if (userProfile) {
        const userName = userProfile.role === 'employer' 
          ? userProfile.company_name || `${userProfile.first_name} ${userProfile.last_name}`
          : `${userProfile.first_name} ${userProfile.last_name}`;

        // 1. NOTIFICATION FOR ADMIN - Alert admin that a new verification needs review
        const { data: adminUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1);

        if (adminUsers && adminUsers.length > 0) {
          const adminUserId = adminUsers[0].id;

          await supabase
            .from('notifications')
            .insert({
              user_id: adminUserId,
              title: '🔍 New Verification Request Ready for Review',
              message: `${userName} has submitted documents for verification review.`,
              type: 'verification_request',
              related_id: requestId,
              is_read: false,
              created_at: new Date().toISOString()
            });
        }

        // 2. NOTIFICATION FOR USER - Confirm submission
        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            title: '📋 Verification Submitted Successfully',
            message: 'Your verification documents have been received and are under review. You\'ll be notified when the process is complete (typically 3-5 business days).',
            type: 'verification_submitted',
            related_id: requestId,
            is_read: false,
            created_at: new Date().toISOString()
          });

        console.log('✅ Notifications created for verification request');
      }
    } catch (error) {
      console.error('Notification creation error:', error);
      // Don't show alert for notification errors as they're not critical
    }
  };

  const getDocumentTitle = (key: string) => {
    const types: {[key: string]: string} = {
      id_front: 'Government ID (Front)',
      id_back: 'Government ID (Back)', 
      selfie: 'Selfie with ID'
    };
    return types[key] || key;
  };

  const documentTypes = [
    {
      key: 'id_front',
      title: 'Government ID (Front)',
      description: 'Upload the front of your government-issued ID (Passport, Driver\'s License, National ID)',
      accept: 'image/*,.pdf',
      examples: 'Passport, Driver\'s License, National ID card'
    },
    {
      key: 'id_back', 
      title: 'Government ID (Back)',
      description: 'Upload the back of your government-issued ID',
      accept: 'image/*,.pdf',
      examples: 'Back of ID card (if applicable)'
    },
    {
      key: 'selfie',
      title: 'Selfie with ID',
      description: 'Upload a clear selfie photo holding your government ID next to your face',
      accept: 'image/*',
      examples: 'Your face clearly visible with ID held next to it'
    }
  ];

  const allDocumentsUploaded = Object.values(documents).every(doc => doc.file !== null);

  const getFilePreview = (file: File | null, url: string | null) => {
    if (!file && !url) return null;
    
    if (file?.type.startsWith('image/') || url?.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return (
        <img 
          src={url || URL.createObjectURL(file!)} 
          alt="Preview" 
          className="w-16 h-16 object-cover rounded-lg"
        />
      );
    } else {
      return (
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-600">PDF</span>
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(isTestMode ? '/verification/test' : '/verification/payment')}
            className={`p-2 rounded-lg transition ${
              darkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Upload Verification Documents
              {isTestMode && (
                <span className="ml-2 text-sm bg-yellow-500 text-black px-2 py-1 rounded-full">
                  TEST MODE
                </span>
              )}
            </h1>
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              Secure and confidential document upload for {userProfile?.role === 'employer' ? userProfile?.company_name : `${userProfile?.first_name} ${userProfile?.last_name}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Upload Section */}
          <div className={`lg:col-span-2 rounded-xl p-6 ${
            darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
          }`}>
            <h2 className={`text-lg font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Required Documents
            </h2>

            <div className="space-y-6">
              {documentTypes.map((docType) => (
                <div
                  key={docType.key}
                  className={`rounded-lg p-4 border-2 transition ${
                    documents[docType.key].file
                      ? darkMode ? "border-green-500 bg-green-500/10" : "border-green-500 bg-green-50"
                      : darkMode ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {docType.title}
                    </h3>
                    {documents[docType.key].file && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {docType.description}
                  </p>
                  
                  <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Examples: {docType.examples}
                  </p>

                  {!documents[docType.key].file ? (
                    <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      darkMode 
                        ? "border-white/20 hover:border-white/40 bg-white/5" 
                        : "border-gray-300 hover:border-gray-400 bg-gray-50"
                    } ${uploading === docType.key ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        accept={docType.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.key, file);
                        }}
                        disabled={uploading === docType.key}
                        className="hidden"
                      />
                      <Upload className={`w-8 h-8 mb-2 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`} />
                      <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                        {uploading === docType.key ? 'Uploading...' : 'Click to upload'}
                      </span>
                      <span className={`text-xs mt-1 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        PNG, JPG, PDF up to 5MB
                      </span>
                    </label>
                  ) : (
                    <div className={`p-4 rounded-lg ${
                      darkMode ? "bg-white/5" : "bg-gray-50"
                    }`}>
                      <div className="flex items-center gap-4">
                        {getFilePreview(documents[docType.key].file, documents[docType.key].url)}
                        <div className="flex-1">
                          <span className={darkMode ? "text-white" : "text-gray-900"}>
                            {documents[docType.key].file?.name}
                          </span>
                          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {documents[docType.key].file && 
                              `Size: ${(documents[docType.key].file!.size / 1024 / 1024).toFixed(2)} MB`
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => removeDocument(docType.key)}
                          className={`p-2 rounded-full transition ${
                            darkMode 
                              ? "hover:bg-white/10 text-red-400" 
                              : "hover:bg-gray-200 text-red-500"
                          }`}
                          disabled={submitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploading === docType.key && (
                    <div className="mt-3">
                      <div className={`w-full bg-gray-200 rounded-full h-2 ${
                        darkMode ? "bg-white/20" : "bg-gray-200"
                      }`}>
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[docType.key] || 0}%` }}
                        ></div>
                      </div>
                      <p className={`text-xs mt-1 text-center ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        Uploading... {Math.round(uploadProgress[docType.key] || 0)}%
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!allDocumentsUploaded || submitting}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition mt-8 flex items-center justify-center gap-2 ${
                !allDocumentsUploaded || submitting
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-105"
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Submit for Verification
                </>
              )}
            </button>

            {/* Help Text */}
            <p className={`text-xs text-center mt-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              By submitting, you agree to our verification process and confirm that all documents are authentic and belong to you.
            </p>
          </div>

          {/* Security Info Sidebar */}
          <div className={`rounded-xl p-6 ${
            darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
          }`}>
            <h3 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Security & Privacy
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>Bank-Level Security</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    All documents are encrypted with AES-256 encryption
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>Confidential Processing</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Only authorized verification staff can access your documents
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>Automatic Deletion</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Documents are automatically deleted 30 days after verification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>GDPR Compliant</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Your data is protected under global privacy regulations
                  </p>
                </div>
              </div>
            </div>

            {/* Processing Time */}
            <div className={`mt-6 p-4 rounded-lg ${
              darkMode ? "bg-blue-500/20" : "bg-blue-50"
            }`}>
              <h4 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-blue-900"}`}>
                ⏰ Processing Time
              </h4>
              <p className={`text-sm ${darkMode ? "text-blue-200" : "text-blue-800"}`}>
                Verification typically takes 3-5 business days. You'll receive an email notification once your verification is complete.
              </p>
            </div>

            {/* Support Info */}
            <div className={`mt-4 p-4 rounded-lg ${
              darkMode ? "bg-purple-500/20" : "bg-purple-50"
            }`}>
              <h4 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-purple-900"}`}>
                💬 Need Help?
              </h4>
              <p className={`text-sm ${darkMode ? "text-purple-200" : "text-purple-800"}`}>
                Contact our support team if you have questions about the verification process.
              </p>
            </div>

            {/* Test Mode Notice */}
            {isTestMode && (
              <div className={`mt-4 p-4 rounded-lg ${
                darkMode ? "bg-yellow-500/20" : "bg-yellow-50"
              }`}>
                <h4 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-yellow-900"}`}>
                  🧪 Test Mode Active
                </h4>
                <p className={`text-sm ${darkMode ? "text-yellow-200" : "text-yellow-800"}`}>
                  This is a development test. No real verification will occur.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}