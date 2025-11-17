"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import JobModal from "@/app/dashboard/JobModal"; 

// Define types based on your exact schema
type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  bio?: string;
  skills?: string;
  company_name?: string;
  company_description?: string;
  profile_picture_url?: string;
  phone_number?: string;
  profile_picture?: string;
  age?: number;
  country?: string;
  employer_type?: string;
  website?: string;
  linkedin?: string;
  resume_link?: string;
  portfolio_link?: string;
  specialization?: string;
  years_of_experience?: number;
  industry?: string;
  company_size?: string;
  hourly_rate?: number;
  portfolio?: string;
  experience?: string;
  experience_level?: string;
  education?: string;
  is_verified?: boolean;
  verified_at?: string;
};

// EXACTLY match the Job type from JobModal.tsx
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
  cover_image?: string;
  created_at: string;
  created_by: string;
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const profileId = params.id as string;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      setIsOwner(user?.id === profileId);
    };

    const fetchProfileData = async () => {
      try {
        setError(null);
        console.log("🔄 Fetching profile for ID:", profileId);

        // Fetch profile with ALL fields from your exact schema INCLUDING verification fields
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .maybeSingle();

        console.log("📊 Raw profile data:", profileData);

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw new Error("Unable to load profile information");
        }

        if (!profileData) {
          throw new Error("Profile not found");
        }

        setProfile(profileData);
        console.log("✅ Full profile loaded:", profileData);
        console.log("🔍 Verification status:", profileData.is_verified);

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

        // Fetch user's posts - ensure we get ALL job fields
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("*")
          .eq("created_by", profileId)
          .order("created_at", { ascending: false });

        // Transform the data to ensure all required fields have values
        const transformedJobs = (jobsData || []).map(job => ({
          ...job,
          responsibilities: job.responsibilities || "No responsibilities specified",
          requirements: job.requirements || "No requirements specified",
          location: job.location || "Location not specified",
          country: job.country || "US",
          description: job.description || "No description provided"
        }));

        const { data: availabilitiesData } = await supabase
          .from("availabilities")
          .select("*")
          .eq("created_by", profileId)
          .order("created_at", { ascending: false });

        setUserJobs(transformedJobs);
        setUserAvailabilities(availabilitiesData || []);

      } catch (error: any) {
        console.error("❌ Error fetching profile data:", error);
        setError(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      getCurrentUser();
      fetchProfileData();
    } else {
      setError("No profile ID provided");
      setLoading(false);
    }
  }, [profileId]);

  const handleProfilePictureClick = () => {
    if (profile?.is_verified) return; // Do nothing if already verified
    
    if (isOwner) {
      // Owner clicking - show "Get Verified" prompt
      alert("Get verified to build trust with other users and get priority visibility in search results. Click 'Verify Now' to proceed.");
    } else {
      // Non-owner clicking - show "User not verified" message
      const userType = profile?.role === "employer" ? "employer" : "job seeker";
      alert(`This ${userType} is not verified. Verified ${userType}s have a blue checkmark and are prioritized in search results.`);
    }
  };

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

  // Determine user type and display name
  const isEmployer = profile.role === "employer";
  const displayName = isEmployer 
    ? profile.company_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Employer"
    : `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Job Seeker";

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
            {/* Profile Picture with ALWAYS VISIBLE Verification Badge */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-400 bg-gray-300 dark:bg-gray-600 flex items-center justify-center cursor-pointer hover:border-purple-300 transition-colors"
                onClick={handleProfilePictureClick}
              >
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
              
              {/* ALWAYS VISIBLE Verification Badge - Blue if verified, Grey if not */}
              <div 
                className={`absolute -bottom-2 -right-2 rounded-full p-2 border-4 ${
                  darkMode ? "border-gray-800" : "border-white"
                } cursor-pointer transition-all ${
                  profile.is_verified 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : darkMode 
                      ? 'bg-gray-500 hover:bg-gray-400' 
                      : 'bg-gray-400 hover:bg-gray-500'
                } ${!profile.is_verified ? 'hover:scale-110' : ''}`}
                onClick={handleProfilePictureClick}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            </div>
            
            {/* Profile Information */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {profile.is_verified && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              
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

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* Contact Information */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 text-purple-400">Contact Information</h2>
                  <div className="space-y-2">
                    {profile.phone_number && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>📞</span>
                        <a href={`tel:${profile.phone_number}`} className="text-blue-400 hover:underline">
                          {profile.phone_number}
                        </a>
                      </p>
                    )}
                    {profile.website && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>🌐</span>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          Website
                        </a>
                      </p>
                    )}
                    {/* Use portfolio_link first, fallback to portfolio */}
                    {(profile.portfolio_link || profile.portfolio) && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>🎨</span>
                        <a href={profile.portfolio_link || profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          Portfolio
                        </a>
                      </p>
                    )}
                    {profile.linkedin && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>💼</span>
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          LinkedIn
                        </a>
                      </p>
                    )}
                    {profile.resume_link && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>📄</span>
                        <a href={profile.resume_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          Resume
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 text-purple-400">Professional Information</h2>
                  <div className="space-y-2">
                    {/* Use experience_level first, fallback to experience */}
                    {(profile.experience_level || profile.experience) && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>📈</span>
                        <span className="capitalize">{profile.experience_level || profile.experience}</span>
                      </p>
                    )}
                    {profile.years_of_experience && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>📊</span>
                        <span>{profile.years_of_experience} years experience</span>
                      </p>
                    )}
                    {profile.specialization && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>🎯</span>
                        <span>{profile.specialization}</span>
                      </p>
                    )}
                    {profile.hourly_rate && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>💰</span>
                        <span>${profile.hourly_rate}/hour</span>
                      </p>
                    )}
                    {profile.education && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>🎓</span>
                        <span>{profile.education}</span>
                      </p>
                    )}
                    {profile.industry && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>🏭</span>
                        <span>{profile.industry}</span>
                      </p>
                    )}
                    {profile.company_size && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>👥</span>
                        <span>{profile.company_size}</span>
                      </p>
                    )}
                    {profile.age && (
                      <p className="flex items-center gap-2 text-sm">
                        <span>🎂</span>
                        <span>{profile.age} years old</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio - Full Width */}
                {profile.bio && (
                  <div className="md:col-span-2">
                    <h2 className="text-sm font-semibold mb-3 text-purple-400">About</h2>
                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Company Description - Full Width */}
                {isEmployer && profile.company_description && (
                  <div className="md:col-span-2">
                    <h2 className="text-sm font-semibold mb-3 text-purple-400">Company Description</h2>
                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {profile.company_description}
                    </p>
                  </div>
                )}

                {/* Skills - Full Width */}
                {profile.skills && (
                  <div className="md:col-span-2">
                    <h2 className="text-sm font-semibold mb-3 text-purple-400">Skills & Expertise</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.split(',').map((skill, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs ${
                            darkMode ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts Section */}
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
                      setSelectedJob(post as Job);
                    }
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
                        <p className="text-xs line-clamp-2 mb-3 text-gray-600 dark:text-gray-300">
                          {(post as Job).description}
                        </p>
                        {(post as Job).job_type && (
                          <span className={`px-2 py-1 rounded-full text-xs self-start ${
                            darkMode ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-800"
                          }`}>
                            💼 {(post as Job).job_type}
                          </span>
                        )}
                      </>
                    ) : (
                      // Availability Post Card
                      <>
                        <h3 className="font-bold text-sm line-clamp-1 mb-2">{(post as Availability).desired_job}</h3>
                        <p className="text-xs line-clamp-2 mb-3">
                          {(post as Availability).name} • {(post as Availability).location}, {(post as Availability).country}
                        </p>
                        <p className="text-xs line-clamp-2 mb-3 text-gray-600 dark:text-gray-300">
                          {(post as Availability).description}
                        </p>
                        {(post as Availability).skills && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skills:</p>
                            <p className="text-xs line-clamp-2">{(post as Availability).skills}</p>
                          </div>
                        )}
                      </>
                    )}
                    
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

      {/* Job Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}