"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, User, Briefcase, X, Crown } from "lucide-react"; // Added Crown icon
import JobCard from "./JobCard";
import JobModal from "./JobModal";
import AvailabilityCard from "./AvailabilityCard";
import AvailabilityModal from "./AvailabilityModal";
import AdModal from "./AdModal";
import NotificationsBell from "@/components/NotificationsBell";
import { countries } from "@/utils/countries";

// Define types locally in this file
export type Job = {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferred_location?: string; 
  location: string;
  country: string;
  preferred_candidate_countries: string[];
  cover_photo?: string | null;
  deadline?: string;  
  created_at: string;
  created_by: string;
  company?: string;
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
};

export type Availability = {
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
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
};

// Ad placement type
type AdPlacement = {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'image' | 'video';
  link?: string;
};

// Hire Modal type
type HireModalProps = {
  availability: Availability;
  onClose: () => void;
  onConfirm: (message: string, contactInfo: string) => void;
};

function HireModal({ availability, onClose, onConfirm }: HireModalProps) {
  const { darkMode } = useTheme();
  const [message, setMessage] = useState(`Hello ${availability.name}! I'm interested in hiring you for the ${availability.desired_job} position. Let's connect!`);
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !contactInfo.trim()) {
      alert("Please provide both a message and contact information");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onConfirm(message, contactInfo);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* Improved modal container for mobile */}
      <div className={`rounded-xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto ${
        darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white"
      }`}>
        <div className={`p-4 sm:p-6 border-b ${darkMode ? "border-purple-500" : "border-gray-200"} sticky top-0 bg-inherit`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Hire {availability.name}
            </h2>
            <button
              onClick={onClose}
              className={`p-1 sm:p-2 rounded-full transition ${
                darkMode ? "hover:bg-purple-500" : "hover:bg-gray-200"
              }`}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            For: {availability.desired_job}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Message to Candidate *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                  darkMode 
                    ? "bg-purple-500/20 border-purple-400 text-white placeholder-gray-400" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Tell the candidate why you want to hire them..."
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Your Contact Information *
              </label>
              <textarea
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                  darkMode 
                    ? "bg-purple-500/20 border-purple-400 text-white placeholder-gray-400" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Provide your email, phone number, or preferred way to be contacted..."
                required
              />
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                This information will be shared with the candidate
              </p>
            </div>
          </div>

          {/* Improved button layout for mobile */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                darkMode 
                  ? "bg-purple-500 text-white hover:bg-purple-600" 
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || !contactInfo.trim()}
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition text-sm sm:text-base ${
                isSubmitting || !message.trim() || !contactInfo.trim()
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isSubmitting ? "Sending..." : "Send Hire Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Optimized Image Component
function OptimizedImage({ src, alt, className, onClick }: { src: string; alt: string; className: string; onClick?: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      )}
      {imageError ? (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-1">📷</div>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();

  const [profile, setProfile] = useState<{ 
    id?: string; 
    first_name?: string; 
    last_name?: string;
    company_name?: string;
    profile_picture?: string | null; 
    profile_picture_url?: string | null;
    role?: string;
    employer_type?: string;
    country?: string; // Added country field
  } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdPlacement | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromCountry, setFromCountry] = useState<string>("");
  const [toCountry, setToCountry] = useState<string>("");
  const [loadingResults, setLoadingResults] = useState<boolean>(false);
  const [loadingRegionResults, setLoadingRegionResults] = useState<boolean>(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedAvailabilityForHire, setSelectedAvailabilityForHire] = useState<Availability | null>(null);

  // Real ad placements from database
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);

  // Text color utilities
  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-700";

  // Determine user type based on their profile or role
  const userType = profile?.role === "employer" ? 'employer' : 'job_seeker';

  // Get user's country code from profile country name
  const getUserCountryCode = () => {
    if (!profile?.country) return "";
    const country = countries.find(c => 
      c.name.toLowerCase() === profile.country?.toLowerCase() || 
      c.code.toLowerCase() === profile.country?.toLowerCase()
    );
    return country?.code || "";
  };

  // Auto-detect user's country and set filters
  useEffect(() => {
    if (profile?.country && !fromCountry && !toCountry) {
      const userCountryCode = getUserCountryCode();
      if (userCountryCode) {
        setFromCountry(userCountryCode);
        setToCountry(userCountryCode);
      }
    }
  }, [profile, fromCountry, toCountry]);

  // Debug logging
  useEffect(() => {
    console.log("Current state:", {
      profile,
      jobsCount: jobs.length,
      availabilitiesCount: availabilities.length,
      userType,
      loadingPosts,
      initialLoading,
      userCountry: profile?.country,
      fromCountry,
      toCountry
    });
  }, [profile, jobs, availabilities, userType, loadingPosts, initialLoading, fromCountry, toCountry]);

  // Fetch profile and posts on load
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setInitialLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          setInitialLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, company_name, profile_picture, profile_picture_url, role, employer_type, country") // Added country
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile(data ?? null);
        
        if (data) {
          await fetchPosts(data.role);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, []);

  // SIMPLIFIED FETCH POSTS - WORKING VERSION
  const fetchPosts = async (userRole?: string) => {
    setLoadingPosts(true);
    try {
      const role = userRole || profile?.role;
      
      console.log("Fetching posts for role:", role);
      
      if (role === "employer") {
        // SIMPLE QUERY - Get availabilities first
        const { data, error } = await supabase
          .from("availabilities")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching availabilities:", error);
          throw error;
        }
        
        console.log("Availabilities raw data:", data);
        
        // If we have data, enrich it with profile information
        if (data && data.length > 0) {
          const enrichedAvailabilities = await Promise.all(
            data.map(async (availability) => {
              // Get profile data for each availability
              const { data: profileData } = await supabase
                .from("profiles")
                .select("username, avatar_url, full_name")
                .eq("id", availability.created_by)
                .single();
              
              // Get boost data if exists
              const { data: boostData } = await supabase
                .from("boosted_posts")
                .select("boost_end, is_active")
                .eq("post_id", availability.id)
                .eq("post_type", "availability")
                .single();

              return {
                ...availability,
                profiles: profileData || null,
                boosted_posts: boostData ? [boostData] : []
              };
            })
          );
          
          setAvailabilities(enrichedAvailabilities);
        } else {
          setAvailabilities([]);
        }
        setJobs([]);
      } else {
        // SIMPLE QUERY - Get jobs first
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching jobs:", error);
          throw error;
        }
        
        console.log("Jobs raw data:", data);
        
        // If we have data, enrich it with profile information
        if (data && data.length > 0) {
          const enrichedJobs = await Promise.all(
            data.map(async (job) => {
              // Get profile data for each job
              const { data: profileData } = await supabase
                .from("profiles")
                .select("username, avatar_url, full_name, company_name")
                .eq("id", job.created_by)
                .single();
              
              // Get boost data if exists
              const { data: boostData } = await supabase
                .from("boosted_posts")
                .select("boost_end, is_active")
                .eq("post_id", job.id)
                .eq("post_type", "job")
                .single();

              return {
                ...job,
                profiles: profileData || null,
                boosted_posts: boostData ? [boostData] : []
              };
            })
          );
          
          setJobs(enrichedJobs);
        } else {
          setJobs([]);
        }
        setAvailabilities([]);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
      // Set empty arrays on error to prevent infinite loading
      setJobs([]);
      setAvailabilities([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch real ads from database
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase
          .from("ads")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        
        const transformedAds: AdPlacement[] = (data || []).map(ad => ({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          image: ad.image_url,
          type: ad.ad_type as 'image' | 'video',
          link: ad.target_url
        }));
        
        setAdPlacements(transformedAds);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };

    fetchAds();
  }, []);

  // Function to get display name based on user type
  const getDisplayName = () => {
    if (!profile) return "User";
    
    if (profile.role === "job_seeker") {
      const firstName = profile.first_name || "";
      const lastName = profile.last_name || "";
      return `${firstName} ${lastName}`.trim() || "User";
    }
    
    if (profile.role === "employer") {
      if (profile.company_name) {
        return profile.company_name;
      }
      const firstName = profile.first_name || "";
      const lastName = profile.last_name || "";
      return `${firstName} ${lastName}`.trim() || "User";
    }
    
    return "User";
  };

  // Check both profile_picture and profile_picture_url
  const profileImageSrc = (profile: any) => {
    if (!profile) return null;
    
    const imagePath = profile.profile_picture_url || profile.profile_picture;
    
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    
    return supabase.storage.from("profile-pictures").getPublicUrl(imagePath).data?.publicUrl ?? null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handlePost = () => {
    if (profile?.role === "employer") {
      router.push("/post-job");
    } else {
      router.push("/post-availability");
    }
  };

  const handleViewApplications = () => {
    router.push("/employer/applications");
  };

  const handleViewHireRequests = () => {
    router.push("/hire-requests");
  };

  // ADD THIS FUNCTION: Handle navigation to pricing page with correct user type
  const handleViewPricing = () => {
    router.push(`/pricing?type=${userType}`);
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job");
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm("Are you sure you want to delete this availability post?")) return;
    try {
      const { error } = await supabase.from("availabilities").delete().eq("id", id);
      if (error) throw error;
      setAvailabilities((prev) => prev.filter((avail) => avail.id !== id));
    } catch (err) {
      console.error("Error deleting availability:", err);
      alert("Failed to delete availability post");
    }
  };

  // Handle View Profile navigation
  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Hire function for employers
  const handleHireClick = (availability: Availability) => {
    setSelectedAvailabilityForHire(availability);
    setShowHireModal(true);
  };

  const handleHireConfirm = async (message: string, contactInfo: string) => {
    if (!profile || !selectedAvailabilityForHire) return;
    
    if (profile.role !== "employer") {
      alert("Only employers can hire candidates");
      return;
    }
    
    if (selectedAvailabilityForHire.created_by === profile.id) {
      alert("You cannot hire yourself");
      return;
    }
    
    try {
      const fullMessage = `${message}\n\nContact Information:\n${contactInfo}`;

      const { data, error } = await supabase
        .from("hires")
        .insert([
          {
            employer_id: profile.id,
            job_seeker_id: selectedAvailabilityForHire.created_by,
            availability_id: selectedAvailabilityForHire.id,
            job_seeker_name: selectedAvailabilityForHire.name,
            desired_position: selectedAvailabilityForHire.desired_job,
            employer_message: fullMessage,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Hire error:", error);
        throw error;
      }

      await sendHireNotification(selectedAvailabilityForHire, data.id);
      
      alert(`Hire request sent to ${selectedAvailabilityForHire.name}! They will be notified.`);
      setShowHireModal(false);
      setSelectedAvailabilityForHire(null);
    } catch (error: any) {
      console.error("Error hiring candidate:", error);
      alert("Failed to send hire request: " + error.message);
    }
  };

  const sendHireNotification = async (availability: Availability, hireId: string) => {
    try {
      const employerName = profile?.company_name || `${profile?.first_name} ${profile?.last_name}` || 'An employer';
      
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: availability.created_by,
          title: 'New Hire Request!',
          message: `${employerName} wants to hire you for ${availability.desired_job}`,
          type: 'hire_request',
          related_id: hireId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notifError) {
        console.error('Error creating hire notification:', notifError);
      } else {
        console.log('✅ Hire notification sent to job seeker');
      }
    } catch (error) {
      console.error('Error sending hire notification:', error);
    }
  };

  // Search functions for both jobs and availabilities
  const handleSearch = async () => {
    setLoadingResults(true);
    try {
      if (profile?.role === "employer") {
        const { data, error } = await supabase
          .from("availabilities")
          .select("*")
          .or(`desired_job.ilike.%${searchQuery}%,skills.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAvailabilities(data ?? []);
      } else {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .ilike("title", `%${searchQuery}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setJobs(data ?? []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  // UPDATED: Improved Location-Based Search Function
  const handleRegionSearch = async () => {
    setLoadingRegionResults(true);
    try {
      if (profile?.role === "employer") {
        // EMPLOYER VIEW: Find candidates based on location filters
        let query = supabase.from("availabilities").select("*");

        if (fromCountry) {
          // Find candidates FROM specific country
          const countryObj = countries.find(c => c.code === fromCountry);
          if (countryObj) {
            query = query.ilike("country", `%${countryObj.name}%`);
          }
        }

        if (toCountry) {
          // Find candidates willing to work IN specific country
          const countryObj = countries.find(c => c.code === toCountry);
          if (countryObj) {
            query = query.ilike("location", `%${countryObj.name}%`);
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;

        setAvailabilities(data ?? []);
      } else {
        // JOB SEEKER VIEW: Enhanced location-based job search
        let query = supabase.from("jobs").select("*");

        // SCENARIO 1: Jobs located IN specific country (local jobs)
        if (toCountry) {
          const countryObj = countries.find(c => c.code === toCountry);
          if (countryObj) {
            query = query.ilike("country", `%${countryObj.name}%`);
          }
        }
        
        // SCENARIO 2: Jobs that are hiring FROM specific country (remote jobs targeting that country)
        if (fromCountry) {
          const countryObj = countries.find(c => c.code === fromCountry);
          if (countryObj) {
            // Search in preferred_candidate_countries array
            query = query.contains("preferred_candidate_countries", [countryObj.name]);
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;

        setJobs(data ?? []);
      }
    } catch (err) {
      console.error("Region search error:", err);
      alert("Error searching: " + (err as Error).message);
    } finally {
      setLoadingRegionResults(false);
    }
  };

  // NEW FUNCTION: Clear all filters and show all posts
  const handleClearFilters = async () => {
    setSearchQuery("");
    setFromCountry("");
    setToCountry("");
    setLoadingPosts(true);
    
    try {
      await fetchPosts(profile?.role);
    } finally {
      setLoadingPosts(false);
    }
  };

  // NEW FUNCTION: Show local jobs/candidates (user's country)
  const handleShowLocal = async () => {
    const userCountryCode = getUserCountryCode();
    if (userCountryCode) {
      setFromCountry(userCountryCode);
      setToCountry(userCountryCode);
      // Trigger search after a short delay to ensure state is updated
      setTimeout(() => {
        handleRegionSearch();
      }, 100);
    } else {
      alert("Please set your country in your profile to use this feature");
    }
  };

  // Open modals
  const openJobModal = (job: Job) => {
    setSelectedJob(job);
    setModalReadOnly(true);
  };

  const openAvailabilityModal = (availability: Availability) => {
    setSelectedAvailability(availability);
    setModalReadOnly(true);
  };

  const openAdModal = (ad: AdPlacement) => {
    setSelectedAd(ad);
  };

  // Determine what to display based on user role
  const isEmployer = profile?.role === "employer";
  const displayItems = isEmployer ? availabilities : jobs;
  const noPostsMessage = isEmployer 
    ? "No job seekers found" 
    : "No jobs found";

  // Function to render ad placements with same styling as JobCard
  const renderAdPlacement = (ad: AdPlacement) => (
    <div
      key={ad.id}
      className="relative bg-white/10 dark:bg-white/5 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col border-2 border-dashed border-yellow-400"
      onClick={() => openAdModal(ad)}
    >
      <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded z-10 font-semibold">
        AD
      </div>
      
      <div className="w-full h-40 bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
        {ad.type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center">
            <video 
              className="w-full h-full object-cover"
              controls
              poster={ad.image}
            >
              <source src={ad.image} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : ad.image ? (
          <OptimizedImage
            src={ad.image}
            alt={ad.title}
            className="w-full h-full"
          />
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-300">
            <div className="text-4xl mb-2">📢</div>
            <p className="text-sm">Sponsored Content</p>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className={`font-bold text-lg line-clamp-1 mb-2 ${textPrimary}`}>
          {ad.title}
        </h3>
        
        <p className={`text-sm line-clamp-2 mb-4 leading-relaxed ${textMuted}`}>
          {ad.description}
        </p>
        
        <div className="mt-auto flex justify-between items-center">
          <span className={`text-xs ${textMuted} font-medium`}>
            Sponsored
          </span>
          <button
            className="px-3 py-1 bg-yellow-500 text-black text-xs rounded hover:bg-yellow-600 transition font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              window.open(ad.link || '#', '_blank');
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );

  // Function to render posts with ads inserted after every 9 posts (3 rows)
  const renderPostsWithAds = () => {
    const items = isEmployer ? availabilities : jobs;
    
    console.log("Rendering items:", {
      isEmployer,
      itemsCount: items.length,
      jobsCount: jobs.length,
      availabilitiesCount: availabilities.length
    });

    if (loadingPosts) {
      return (
        <div className="col-span-3 text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${textMuted}`}>
            Loading {isEmployer ? "job seekers" : "jobs"}...
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="col-span-3 text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">
            {isEmployer ? "👥" : "💼"}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {noPostsMessage}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            {isEmployer 
              ? "When job seekers post their availability, they will appear here." 
              : "When employers post jobs, they will appear here."
            }
          </p>
          {(fromCountry || toCountry) && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      );
    }

    const elements: React.JSX.Element[] = [];
    
    // Insert ads after every 9 posts (after 3 rows)
    items.forEach((item, index) => {
      if (isEmployer) {
        const availability = item as Availability;
        elements.push(
          <AvailabilityCard
            key={availability.id}
            availability={availability}
            onClick={() => openAvailabilityModal(availability)}
            canDelete={availability.created_by === profile?.id}
            onDelete={() => handleDeleteAvailability(availability.id)}
            onHire={() => handleHireClick(availability)}
            onViewProfile={() => handleViewProfile(availability.created_by)}
            showHireButton={availability.created_by !== profile?.id}
          />
        );
      } else {
        const job = item as Job;
        elements.push(
          <JobCard
            key={job.id}
            job={job}
            onClick={() => openJobModal(job)}
            canDelete={job.created_by === profile?.id}
            onDelete={() => handleDeleteJob(job.id)}
            onViewProfile={() => handleViewProfile(job.created_by)}
          />
        );
      }

      if ((index + 1) % 9 === 0 && adPlacements.length > 0) {
        adPlacements.forEach((ad) => {
          elements.push(renderAdPlacement(ad));
        });
      }
    });

    return elements;
  };

  // Show initial loading screen
  if (initialLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode 
          ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800 text-white"
          : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
          <p className="text-gray-400">Getting everything ready for you</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800 text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4 sm:gap-6">
        <div className="flex flex-col flex-1">
          <h1 className="flex items-center gap-3 text-2xl font-semibold">
            <span className="text-2xl">💪🏿</span>
            <span className="leading-none">NguvuHire</span>
          </h1>
          {/* Role indicator */}
          <p className={`text-sm mt-1 ${textMuted}`}>
            {isEmployer ? "👔 Employer Dashboard - Find Talent" : "💼 Job Seeker Dashboard - Find Jobs"}
          </p>
          
          {/* Location indicator */}
          {profile?.country && (
            <p className={`text-xs mt-1 ${textMuted}`}>
              📍 Your location: {profile.country}
            </p>
          )}
          
          {/* SEARCH BARS ROW - MOBILE OPTIMIZED */}
          <div className="mt-4 space-y-3">
            {/* QUICK ACTION BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={handleShowLocal}
                className={`px-3 py-2 rounded-md text-xs font-medium transition ${
                  darkMode 
                    ? "bg-green-500 text-white hover:bg-green-600 border border-green-400"
                    : "bg-green-500 text-white hover:bg-green-600 border border-green-400"
                }`}
              >
                Show Local
              </button>
              <button
                onClick={handleClearFilters}
                className={`px-3 py-2 rounded-md text-xs font-medium transition ${
                  darkMode 
                    ? "bg-gray-500 text-white hover:bg-gray-600 border border-gray-400"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400 border border-gray-300"
                }`}
              >
                Clear Filters
              </button>
            </div>

            {/* MAIN SEARCH BAR - Full width on mobile */}
            <div className={`rounded-lg p-2 ${darkMode ? "bg-purple-500/20 backdrop-blur-sm border border-purple-400/30" : "bg-white border border-gray-200"}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isEmployer ? "Search skills, jobs, names..." : "Search jobs..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1 ${
                    darkMode
                      ? "bg-purple-600/30 text-white placeholder-purple-200 focus:ring-purple-300 focus:bg-purple-600/50 border border-purple-400/30"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-blue-400 focus:bg-white border border-gray-200"
                  }`}
                />
                <button
                  onClick={handleSearch}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    darkMode 
                      ? "bg-purple-500 text-white hover:bg-purple-600 border border-purple-400"
                      : "bg-blue-500 text-white hover:bg-blue-600 border border-blue-400"
                  }`}
                >
                  Search
                </button>
              </div>
            </div>
            
            {/* REGION SEARCH - Improved mobile responsive */}
            <div className={`rounded-lg p-2 ${darkMode ? "bg-purple-500/20 backdrop-blur-sm border border-purple-400/30" : "bg-white border border-gray-200"}`}>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Country selects - Stack on mobile, side by side on larger screens */}
                <div className="flex flex-col xs:flex-row gap-2 flex-1">
                  <select
                    value={fromCountry}
                    onChange={(e) => setFromCountry(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1 min-w-0 ${
                      darkMode
                        ? "bg-purple-600/30 text-white focus:ring-purple-300 focus:bg-purple-600/50 border border-purple-400/30"
                        : "bg-gray-100 text-gray-900 focus:ring-blue-400 focus:bg-white border border-gray-200"
                    }`}
                  >
                    <option value="">
                      {isEmployer ? "Candidates from" : "Jobs hiring from"}
                    </option>
                    {countries.map(country => (
                      <option key={`from-${country.code}`} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={toCountry}
                    onChange={(e) => setToCountry(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1 min-w-0 ${
                      darkMode
                        ? "bg-purple-600/30 text-white focus:ring-purple-300 focus:bg-purple-600/50 border border-purple-400/30"
                        : "bg-gray-100 text-gray-900 focus:ring-blue-400 focus:bg-white border border-gray-200"
                    }`}
                  >
                    <option value="">
                      {isEmployer ? "Candidates willing to work in" : "Jobs located in"}
                    </option>
                    {countries.map(country => (
                      <option key={`to-${country.code}`} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleRegionSearch}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition sm:w-auto w-full ${
                    darkMode 
                      ? "bg-purple-500 text-white hover:bg-purple-600 border border-purple-400"
                      : "bg-blue-500 text-white hover:bg-blue-600 border border-blue-400"
                  }`}
                >
                  Filter Region
                </button>
              </div>
              {/* Help text */}
              <p className={`text-xs mt-2 ${textMuted}`}>
                {isEmployer 
                  ? "Find candidates from specific countries or willing to work in specific locations"
                  : "Find remote jobs hiring from your country or local jobs in specific countries"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Profile + Action buttons - MOBILE OPTIMIZED */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <div className={`text-sm ${textPrimary} hidden sm:block`}>
              Welcome, <span className="font-medium">{getDisplayName()}</span>
            </div>

            <NotificationsBell />

            {profileImageSrc(profile) ? (
              <OptimizedImage
                src={profileImageSrc(profile) ?? ""}
                alt="Profile"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer border-2 border-purple-500"
                onClick={() => router.push("/profile")}
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-400 flex items-center justify-center text-white cursor-pointer"
                onClick={() => router.push("/profile")}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}

            <button
              onClick={toggleDarkMode}
              className={`p-1.5 sm:p-2 rounded-lg transition ${
                darkMode ? "bg-yellow-400" : "bg-gray-200"
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Action buttons - Stack on mobile - UPDATED WITH BOOST BUTTON */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isEmployer ? (
              <>
                <button
                  onClick={handleViewApplications}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                    darkMode
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="sm:block hidden">View Applications</span>
                  <span className="sm:hidden">Applications</span>
                </button>
                <button
                  onClick={handlePost}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                    darkMode
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Post Job
                </button>
                {/* ADDED BOOST BUTTON FOR EMPLOYERS */}
                <button
                  onClick={handleViewPricing}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                    darkMode
                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-yellow-400 text-black hover:bg-yellow-500"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Boost</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleViewHireRequests}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                    darkMode
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  <span className="sm:block hidden">View Hire Requests</span>
                  <span className="sm:hidden">Hire Requests</span>
                </button>
                <button
                  onClick={handlePost}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                    darkMode
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Post Availability
                </button>
                {/* ADDED BOOST BUTTON FOR JOB SEEKERS */}
                <button
                  onClick={handleViewPricing}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition w-full sm:w-auto ${
                    darkMode
                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-yellow-400 text-black hover:bg-yellow-500"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>Boost</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid - Clean and simple, only shows posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {renderPostsWithAds()}
      </div>

      {/* Logout Button - Mobile Optimized */}
      <button
        onClick={handleLogout}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-3 py-2 sm:px-4 sm:py-2 rounded-full font-medium shadow-xl transition ${
          darkMode
            ? "bg-purple-500 text-white hover:bg-purple-600"
            : "bg-gray-200 text-gray-900 hover:bg-gray-300"
        }`}
      >
        <LogOut className="inline w-4 h-4 mr-1 sm:mr-2" />
        <span className="sm:inline hidden">Logout</span>
      </button>

      {/* Modals */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          readOnly={modalReadOnly}
        />
      )}

      {selectedAvailability && (
        <AvailabilityModal
          availability={selectedAvailability}
          onClose={() => setSelectedAvailability(null)}
          readOnly={modalReadOnly}
          onHire={handleHireClick}
        />
      )}

      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
        />
      )}

      {/* Hire Modal */}
      {showHireModal && selectedAvailabilityForHire && (
        <HireModal
          availability={selectedAvailabilityForHire}
          onClose={() => {
            setShowHireModal(false);
            setSelectedAvailabilityForHire(null);
          }}
          onConfirm={handleHireConfirm}
        />
      )}
    </div>
  );
}