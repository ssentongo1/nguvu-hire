// src/app/profile/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import JobModal from "@/app/dashboard/JobModal"; 

// Define types
type Job = {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferred_location?: string; 
  location: string;
  country: string;
  preferred_candidate_countries?: string[]; 
  cover_photo?: string | null;
  deadline?: string;  
  created_at: string;
  created_by: string;
  company?: string;
  work_location_type?: "remote" | "onsite" | "hybrid";
  remote_work_countries?: string[];
  job_type?: string;
  salary?: string;
};

type Availability = {
  id: string;
  name: string;
  desired_job: string;
  skills: string;
  location: string;
  country: string;
  availability: string;
  description: string;
  cv?: string;
  cover_image?: string;
  created_at: string;
  created_by: string;
};

type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  bio?: string;
  skills?: string;
  profile_picture_url?: string;
  profile_picture?: string;
  role?: string;
  employer_type?: string;
  phone_number?: string;
  country?: string;
  company_description?: string;
  email?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  industry?: string;
  company_size?: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { darkMode } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [userAvailabilities, setUserAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null); // NEW: For job modal

  const profileId = params.id as string;

  // Deadline functions
  const isDeadlineApproaching = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return deadlineDate <= threeDaysFromNow && deadlineDate >= today;
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setError(null);
        console.log("🔄 Fetching profile for ID:", profileId);

        // Try to fetch profile - use maybeSingle to handle no results gracefully
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        console.log("📊 Profile fetch result:", { profileData, profileError });

        // If we get a 406 error, it's likely RLS blocking the request
        if (profileError && profileError.code === '406') {
          console.warn("⚠️ RLS might be blocking profile access, trying alternative approach...");
          
          // Try to create a minimal profile from available data
          const { data: userJobsData } = await supabase
            .from("jobs")
            .select("company, created_by")
            .eq("created_by", profileId)
            .limit(1);

          if (userJobsData && userJobsData.length > 0) {
            // Create a basic profile object from available data
            const minimalProfile: Profile = {
              id: profileId,
              company_name: "Employer", // Generic name since we can't access the actual profile
              role: "employer"
            };
            setProfile(minimalProfile);
            console.log("✅ Created minimal profile due to RLS restrictions");
          } else {
            throw new Error("Unable to access profile information");
          }
        } 
        // If it's a different error or no profile found
        else if (profileError || !profileData) {
          console.error("❌ Profile fetch error:", profileError);
          throw new Error("Profile not found or inaccessible");
        }
        // If we successfully got the profile
        else {
          setProfile(profileData);
          console.log("✅ Profile found with full data:", profileData);

          // Get profile picture URL
          const imagePath = profileData.profile_picture_url || profileData.profile_picture;
          if (imagePath) {
            if (imagePath.startsWith("http")) {
              setImageUrl(imagePath);
            } else {
              const { data: urlData } = supabase.storage
                .from("profile-pictures")
                .getPublicUrl(imagePath);
              setImageUrl(urlData?.publicUrl ?? null);
            }
          }
        }

        // Fetch user's posts (these should be publicly accessible)
        console.log("📝 Fetching user posts...");

        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .eq("created_by", profileId)
          .order("created_at", { ascending: false });

        const { data: availabilitiesData, error: availabilitiesError } = await supabase
          .from("availabilities")
          .select("*")
          .eq("created_by", profileId)
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Jobs fetch error:", jobsError);
        } else {
          setUserJobs(jobsData || []);
          console.log("✅ Jobs found:", jobsData?.length || 0);
        }

        if (availabilitiesError) {
          console.error("Availabilities fetch error:", availabilitiesError);
        } else {
          setUserAvailabilities(availabilitiesData || []);
          console.log("✅ Availabilities found:", availabilitiesData?.length || 0);
        }

      } catch (error: any) {
        console.error("❌ Error fetching profile data:", error);
        setError(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchProfileData();
    } else {
      setError("No profile ID provided");
      setLoading(false);
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
      }`}>
        <div className="max-w-6xl mx-auto text-center">
          <p className={`text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`min-h-screen p-6 ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
      }`}>
        <div className="max-w-6xl mx-auto text-center">
          <h1 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Profile Not Found
          </h1>
          <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {error || "This user hasn't set up their profile yet."}
          </p>
          <p className={`text-xs mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Profile ID: {profileId}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // Determine if this is an employer based on available data
  const isEmployer = profile.role === "employer" || userJobs.length > 0;
  const hasDetailedProfile = profile.first_name || profile.company_name || profile.bio;
  
  const displayName = isEmployer 
    ? profile.company_name || `${profile.first_name} ${profile.last_name}`.trim() || "Employer"
    : `${profile.first_name} ${profile.last_name}`.trim() || "Job Seeker";

  const userPosts = isEmployer ? userJobs : userAvailabilities;

  return (
    <div className={`min-h-screen p-6 ${
      darkMode
        ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white"
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className={`rounded-xl p-8 shadow-xl backdrop-blur-lg mb-8 ${
          darkMode ? "bg-white/5" : "bg-white"
        }`}>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Profile Picture */}
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-400 flex-shrink-0 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl">{isEmployer ? "🏢" : "👤"}</span>
              )}
            </div>
            
            {/* Profile Information */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl font-bold mb-2">{displayName}</h1>
              
              {/* Role and Type */}
              <div className="flex flex-wrap gap-4 mb-4 justify-center lg:justify-start">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  darkMode ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-800"
                }`}>
                  {isEmployer ? "🏢 Employer" : "👤 Job Seeker"}
                </span>
                {profile.employer_type && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    darkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                  }`}>
                    {profile.employer_type}
                  </span>
                )}
                {profile.country && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    darkMode ? "bg-green-600 text-white" : "bg-green-100 text-green-800"
                  }`}>
                    📍 {profile.country}
                  </span>
                )}
              </div>

              {/* Show message if minimal profile due to RLS */}
              {!hasDetailedProfile && (
                <div className="mt-4">
                  <p className={`text-sm ${darkMode ? "text-yellow-300" : "text-yellow-600"}`}>
                    ⚠️ Profile details are limited due to privacy settings.
                  </p>
                </div>
              )}

              {/* Detailed profile information */}
              {hasDetailedProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Contact Information */}
                  {(profile.phone_number || profile.email || profile.website) && (
                    <div>
                      <h2 className="text-sm font-semibold mb-3 text-purple-400">Contact Information</h2>
                      <div className="space-y-2">
                        {profile.phone_number && (
                          <p className="flex items-center gap-2 text-sm">
                            <span>📞</span>
                            <span>{profile.phone_number}</span>
                          </p>
                        )}
                        {profile.email && (
                          <p className="flex items-center gap-2 text-sm">
                            <span>📧</span>
                            <span>{profile.email}</span>
                          </p>
                        )}
                        {profile.website && (
                          <p className="flex items-center gap-2 text-sm">
                            <span>🌐</span>
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                              {profile.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {profile.bio && (
                    <div>
                      <h2 className="text-sm font-semibold mb-3 text-purple-400">About</h2>
                      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Company Description */}
                  {isEmployer && profile.company_description && (
                    <div className="md:col-span-2">
                      <h2 className="text-sm font-semibold mb-3 text-purple-400">Company Description</h2>
                      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {profile.company_description}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {!isEmployer && profile.skills && (
                    <div className="md:col-span-2">
                      <h2 className="text-sm font-semibold mb-3 text-purple-400">Skills & Expertise</h2>
                      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {profile.skills}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User's Posts Section - NOW CLICKABLE */}
        <div className={`rounded-xl p-6 shadow-xl backdrop-blur-lg ${
          darkMode ? "bg-white/5" : "bg-white"
        }`}>
          <h2 className="text-lg font-bold mb-6">
            {isEmployer ? "📋 Job Posts" : "💼 Availability Posts"} 
            <span className="text-xs font-normal opacity-75 ml-2">
              ({userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'})
            </span>
          </h2>

          {userPosts.length === 0 ? (
            <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              No posts yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className={`rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col ${
                    darkMode ? "bg-white/10" : "bg-white"
                  }`}
                  onClick={() => {
                    if (isEmployer) {
                      // Open the job in modal - JUST LIKE DASHBOARD
                      setSelectedJob(post as Job);
                    }
                    // For availabilities, you can add similar functionality
                  }}
                >
                  {/* Cover Image */}
                  {isEmployer ? (post as Job).cover_photo && (
                    <img
                      src={(post as Job).cover_photo || ""}
                      alt={(post as Job).title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (post as Availability).cover_image && (
                    <img
                      src={(post as Availability).cover_image || ""}
                      alt={(post as Availability).desired_job}
                      className="w-full h-40 object-cover"
                    />
                  )}

                  <div className="p-4 flex-1 flex flex-col">
                    {isEmployer ? (
                      // Job Post Card
                      <>
                        <h3 className="font-bold text-sm line-clamp-1 mb-2">{(post as Job).title}</h3>
                        <p className="text-xs line-clamp-2 mb-3">
                          {(post as Job).company} • {(post as Job).location}, {(post as Job).country}
                        </p>
                        
                        {/* Deadline */}
                        {(post as Job).deadline && (
                          <div className="mb-3">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isDeadlinePassed((post as Job).deadline!) 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : isDeadlineApproaching((post as Job).deadline!)
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              <span className="mr-1">⏰</span>
                              Deadline {formatDeadline((post as Job).deadline!)}
                              {isDeadlinePassed((post as Job).deadline!) && ' (Expired)'}
                              {isDeadlineApproaching((post as Job).deadline!) && !isDeadlinePassed((post as Job).deadline!) && ' (Soon)'}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      // Availability Post Card
                      <>
                        <h3 className="font-bold text-sm line-clamp-1 mb-2">{(post as Availability).desired_job}</h3>
                        <p className="text-xs line-clamp-2 mb-3">
                          {(post as Availability).name} • {(post as Availability).location}, {(post as Availability).country}
                        </p>
                        <p className="text-xs line-clamp-2 mb-3">
                          {(post as Availability).skills}
                        </p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          darkMode ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-800"
                        }`}>
                          <span className="mr-1">📅</span>
                          {(post as Availability).availability}
                        </div>
                      </>
                    )}
                    
                    {/* Bottom row: date */}
                    <div className="mt-auto pt-3">
                      <span className="text-xs text-gray-400">
                        Posted {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className={`px-8 py-3 rounded-lg font-semibold transition text-sm ${
              darkMode 
                ? "bg-white/10 hover:bg-white/20 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            }`}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Job Modal - REUSING EXISTING COMPONENT */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          readOnly={true} // Set to true since viewers can't edit others' jobs
        />
      )}
    </div>
  );
}