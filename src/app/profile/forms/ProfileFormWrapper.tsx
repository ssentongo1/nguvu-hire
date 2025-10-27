"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import JobSeekerForm from "./JobSeekerForm";
import CompanyForm from "./CompanyForm";
import AgencyForm from "./AgencyForm";
import RecruiterForm from "./RecruiterForm";
import FreelancerForm from "./FreelancerForm";
import { useTheme } from "@/context/ThemeContext";

interface ProfileFormWrapperProps {
  profile: any;
}

export default function ProfileFormWrapper({ profile }: ProfileFormWrapperProps) {
  const { darkMode } = useTheme();
  const [editing, setEditing] = useState(!profile?.first_name && !profile?.company_name);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [userPosts, setUserPosts] = useState<{ jobs: any[]; availabilities: any[] }>({ jobs: [], availabilities: [] });
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const loadUserPosts = async () => {
      if (!currentProfile?.id) return;
      
      try {
        setLoadingPosts(true);
        
        // Fetch jobs posted by user
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("created_by", currentProfile.id)
          .order("created_at", { ascending: false });

        // Fetch availabilities posted by user
        const { data: availabilitiesData, error: availabilitiesError } = await supabase
          .from("availabilities")
          .select("*")
          .eq("created_by", currentProfile.id)
          .order("created_at", { ascending: false });

        if (jobsError) console.error("Error fetching jobs:", jobsError);
        if (availabilitiesError) console.error("Error fetching availabilities:", availabilitiesError);

        setUserPosts({
          jobs: jobsData || [],
          availabilities: availabilitiesData || []
        });
      } catch (error) {
        console.error("Error loading user posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    if (!editing) {
      loadUserPosts();
    }
  }, [currentProfile?.id, editing]);

  const handleSave = (updatedProfile: any) => {
    setCurrentProfile(updatedProfile);
    setEditing(false);
  };

  const handleDeletePost = async (postType: 'job' | 'availability', postId: string) => {
    if (!confirm(`Are you sure you want to delete this ${postType}?`)) return;

    try {
      const tableName = postType === 'job' ? 'jobs' : 'availabilities';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", postId);

      if (error) throw error;

      // Remove from local state
      if (postType === 'job') {
        setUserPosts(prev => ({
          ...prev,
          jobs: prev.jobs.filter(job => job.id !== postId)
        }));
      } else {
        setUserPosts(prev => ({
          ...prev,
          availabilities: prev.availabilities.filter(avail => avail.id !== postId)
        }));
      }

      alert(`${postType.charAt(0).toUpperCase() + postType.slice(1)} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting ${postType}:`, error);
      alert(`Error deleting ${postType}`);
    }
  };

  const handleEditPost = (postType: 'job' | 'availability', postId: string) => {
    if (postType === 'job') {
      window.location.href = `/post-job?edit=${postId}`;
    } else {
      window.location.href = `/post-availability?edit=${postId}`;
    }
  };

  if (!currentProfile) {
    return <p className="text-center p-4">No profile found.</p>;
  }

  // If not editing, show profile view with posts
  if (!editing) {
    // Determine what name to display
    let displayName = "No name";
    if (currentProfile.role === "job_seeker") {
      displayName = `${currentProfile.first_name || ""} ${currentProfile.last_name || ""}`.trim();
    } else {
      // For employers, try company_name first, then first_name + last_name
      displayName = currentProfile.company_name || 
                   `${currentProfile.first_name || ""} ${currentProfile.last_name || ""}`.trim();
    }
    
    if (displayName === "") displayName = "No name";

    // ONLY CHANGE: Removed max-w-4xl to make it full width
    const cardClass = `mx-auto p-8 rounded-2xl shadow-xl border transition-colors duration-300 ${
      darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
    }`;

    const textClass = darkMode ? "text-gray-200" : "text-gray-700";
    const mutedTextClass = darkMode ? "text-gray-400" : "text-gray-500";
    const sectionClass = `p-4 rounded-xl ${
      darkMode ? "bg-gray-800" : "bg-gray-50"
    }`;

    const postCardClass = `rounded-xl border transition-all duration-300 overflow-hidden hover:shadow-lg ${
      darkMode ? "bg-gray-800 border-gray-600 hover:bg-gray-750" : "bg-white border-gray-200 hover:bg-gray-50"
    }`;

    return (
      <div className="space-y-8 px-4 sm:px-6 lg:px-8"> {/* Added horizontal padding to container */}
        {/* Profile Card */}
        <div className={cardClass}>
          <div className="flex flex-col items-center mb-8">
            {currentProfile.profile_picture_url && (
              <img
                src={currentProfile.profile_picture_url}
                alt="Profile"
                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg mb-4"
              />
            )}
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{displayName}</h1>
            <p className={`text-sm capitalize mt-2 ${mutedTextClass}`}>
              {currentProfile.role?.replace('_', ' ')} 
              {currentProfile.employer_type && ` • ${currentProfile.employer_type}`}
            </p>
            {currentProfile.bio && (
              <p className={`mt-4 text-center text-lg leading-relaxed ${textClass}`}>{currentProfile.bio}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Common Fields */}
            {currentProfile.country && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>📍 Country</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.country}</p>
              </div>
            )}
            
            {currentProfile.phone_number && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>📞 Phone</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.phone_number}</p>
              </div>
            )}

            {currentProfile.skills && (
              <div className={`${sectionClass} md:col-span-2`}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>💼 Skills</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.skills}</p>
              </div>
            )}

            {/* Role-specific Fields */}
            {currentProfile.specialization && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>🎯 Specialization</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.specialization}</p>
              </div>
            )}

            {currentProfile.years_of_experience && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>📊 Experience</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.years_of_experience} years</p>
              </div>
            )}

            {currentProfile.website && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>🌐 Website</strong>
                <p className={`mt-1 truncate ${textClass}`}>{currentProfile.website}</p>
              </div>
            )}

            {currentProfile.industry && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>🏭 Industry</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.industry}</p>
              </div>
            )}

            {currentProfile.company_size && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>👥 Company Size</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.company_size}</p>
              </div>
            )}

            {currentProfile.linkedin && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>💼 LinkedIn</strong>
                <p className={`mt-1 truncate ${textClass}`}>{currentProfile.linkedin}</p>
              </div>
            )}

            {currentProfile.hourly_rate && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>💰 Hourly Rate</strong>
                <p className={`mt-1 ${textClass}`}>${currentProfile.hourly_rate}/hour</p>
              </div>
            )}

            {currentProfile.portfolio && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>🎨 Portfolio</strong>
                <p className={`mt-1 truncate ${textClass}`}>{currentProfile.portfolio}</p>
              </div>
            )}

            {currentProfile.experience && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>📈 Experience Level</strong>
                <p className={`mt-1 capitalize ${textClass}`}>{currentProfile.experience}</p>
              </div>
            )}

            {currentProfile.education && (
              <div className={sectionClass}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>🎓 Education</strong>
                <p className={`mt-1 ${textClass}`}>{currentProfile.education}</p>
              </div>
            )}

            {currentProfile.company_description && (
              <div className={`${sectionClass} md:col-span-2`}>
                <strong className={`${darkMode ? "text-white" : "text-gray-900"}`}>📝 Description</strong>
                <p className={`mt-1 leading-relaxed ${textClass}`}>{currentProfile.company_description}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setEditing(true)}
            className={`w-full py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${
              darkMode 
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700" 
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
            }`}
          >
            Edit Profile
          </button>
        </div>

        {/* User Posts Section */}
        <div className={cardClass}>
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
            My Posts
          </h2>

          {loadingPosts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className={`mt-4 ${mutedTextClass}`}>Loading your posts...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Posts (for employers) */}
              {userPosts.jobs.length > 0 && (
                <div>
                  <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Job Posts ({userPosts.jobs.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userPosts.jobs.map((job) => (
                      <div key={job.id} className={postCardClass}>
                        {/* Cover Photo */}
                        {job.cover_photo && (
                          <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <img 
                              src={job.cover_photo} 
                              alt={job.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="p-4">
                          <h4 className={`font-semibold text-lg mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {job.title}
                          </h4>
                          <p className={`text-sm ${mutedTextClass} mb-2`}>
                            {job.company} • {job.location}, {job.country}
                          </p>
                          
                          {/* Job Details */}
                          {job.job_type && (
                            <p className={`text-sm ${textClass} mb-1`}>
                              <strong>Type:</strong> {job.job_type}
                            </p>
                          )}
                          {job.salary && (
                            <p className={`text-sm ${textClass} mb-1`}>
                              <strong>Salary:</strong> {job.salary}
                            </p>
                          )}
                          
                          <p className={`text-sm ${textClass} line-clamp-2 mb-4`}>
                            {job.description}
                          </p>

                          <div className="flex justify-between items-center">
                            <div className={`text-xs ${mutedTextClass}`}>
                              Posted on {new Date(job.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPost('job', job.id)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  darkMode 
                                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePost('job', job.id)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  darkMode 
                                    ? "bg-red-600 text-white hover:bg-red-700" 
                                    : "bg-red-500 text-white hover:bg-red-600"
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability Posts (for job seekers) */}
              {userPosts.availabilities.length > 0 && (
                <div>
                  <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Availability Posts ({userPosts.availabilities.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userPosts.availabilities.map((availability) => (
                      <div key={availability.id} className={postCardClass}>
                        {/* Cover Photo */}
                        {availability.cover_photo && (
                          <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <img 
                              src={availability.cover_photo} 
                              alt={availability.desired_job}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="p-4">
                          <h4 className={`font-semibold text-lg mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {availability.desired_job}
                          </h4>
                          <p className={`text-sm ${mutedTextClass} mb-2`}>
                            {availability.name} • {availability.location}, {availability.country}
                          </p>
                          
                          {availability.availability && (
                            <p className={`text-sm ${textClass} mb-4`}>
                              <strong>Availability:</strong> {availability.availability}
                            </p>
                          )}
                          
                          <p className={`text-sm ${textClass} line-clamp-2 mb-4`}>
                            {availability.description}
                          </p>

                          <div className="flex justify-between items-center">
                            <div className={`text-xs ${mutedTextClass}`}>
                              Posted on {new Date(availability.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPost('availability', availability.id)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  darkMode 
                                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                }`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePost('availability', availability.id)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  darkMode 
                                    ? "bg-red-600 text-white hover:bg-red-700" 
                                    : "bg-red-500 text-white hover:bg-red-600"
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Posts Message */}
              {userPosts.jobs.length === 0 && userPosts.availabilities.length === 0 && (
                <div className="text-center py-8">
                  <p className={`text-lg ${mutedTextClass} mb-4`}>You haven't posted anything yet.</p>
                  <div className="space-x-4">
                    {currentProfile.role === "employer" ? (
                      <button
                        onClick={() => window.location.href = "/post-job"}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                          darkMode 
                            ? "bg-green-600 text-white hover:bg-green-700" 
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        Post Your First Job
                      </button>
                    ) : (
                      <button
                        onClick={() => window.location.href = "/post-availability"}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                          darkMode 
                            ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                            : "bg-indigo-500 text-white hover:bg-indigo-600"
                        }`}
                      >
                        Post Your Availability
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show appropriate form based on role AND employer_type
  if (currentProfile.role === "employer") {
    switch (currentProfile.employer_type) {
      case "company":
        return <CompanyForm profile={currentProfile} onSave={handleSave} />;
      case "agency":
        return <AgencyForm profile={currentProfile} onSave={handleSave} />;
      case "recruiter":
        return <RecruiterForm profile={currentProfile} onSave={handleSave} />;
      case "freelancer":
        return <FreelancerForm profile={currentProfile} onSave={handleSave} />;
      default:
        return <CompanyForm profile={currentProfile} onSave={handleSave} />;
    }
  }

  // For job seekers
  if (currentProfile.role === "job_seeker") {
    return <JobSeekerForm profile={currentProfile} onSave={handleSave} />;
  }

  // Default fallback
  return <JobSeekerForm profile={currentProfile} onSave={handleSave} />;
}