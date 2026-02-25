"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, User, Briefcase, X, Crown, CheckCircle, Search, Filter, Globe, MapPin, Building2, Sparkles } from "lucide-react";
import JobCard from "./JobCard";
import JobModal from "./JobModal";
import AvailabilityCard from "./AvailabilityCard";
import AvailabilityModal from "./AvailabilityModal";
import AdModal from "./AdModal";
import NotificationsBell from "@/components/NotificationsBell";
import { countries } from "@/utils/countries";
import Pagination from "@/components/Pagination";

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
  work_location_type?: "remote" | "onsite" | "hybrid";
  remote_work_countries?: string[];
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
  profiles?: {
    username: string;
    avatar_url: string;
    full_name: string;
    company_name: string;
    is_verified: boolean;
  } | null;
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
  work_location_type?: "remote" | "onsite" | "hybrid";
  remote_work_countries?: string[];
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
  profiles?: {
    username: string;
    avatar_url: string;
    full_name: string;
    is_verified: boolean;
  } | null;
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

// Memoized Hire Modal Component
const HireModal = memo(function HireModal({ availability, onClose, onConfirm }: HireModalProps) {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-hidden ${
        darkMode ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700" : "bg-white border border-gray-200"
      }`}>
        <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"} sticky top-0 bg-inherit`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Hire {availability.name}
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                For: <span className="font-medium">{availability.desired_job}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all hover:scale-105 ${
                darkMode 
                  ? "hover:bg-gray-700 text-gray-400 hover:text-white" 
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2.5 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Message to Candidate *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${
                  darkMode 
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Tell the candidate why you want to hire them..."
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2.5 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Your Contact Information *
              </label>
              <textarea
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                rows={2}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all ${
                  darkMode 
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Provide your email, phone number, or preferred way to be contacted..."
                required
              />
              <p className={`text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                This information will be shared with the candidate
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-5 py-3.5 rounded-xl font-medium transition-all text-sm ${
                darkMode 
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600 active:scale-95" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || !contactInfo.trim()}
              className={`flex-1 px-5 py-3.5 rounded-xl font-medium text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-95 shadow-lg shadow-blue-500/20"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95 shadow-lg shadow-blue-500/30"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : "Send Hire Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// Memoized Optimized Image Component
const OptimizedImage = memo(function OptimizedImage({ 
  src, 
  alt, 
  className, 
  onClick 
}: { 
  src: string; 
  alt: string; 
  className: string; 
  onClick?: () => void 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-xs">Loading...</div>
        </div>
      )}
      {imageError ? (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <div className="text-lg mb-1">📷</div>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } ${className}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function DashboardPage() {
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<"jobs" | "talent" | "services">("jobs");
  const [profile, setProfile] = useState<{ 
    id?: string; 
    first_name?: string; 
    last_name?: string;
    company_name?: string;
    profile_picture?: string | null; 
    profile_picture_url?: string | null;
    role?: string;
    employer_type?: string;
    country?: string;
    is_verified?: boolean;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  // Real ad placements from database
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);

  // Debounced search values
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Text color utilities
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-700";

  // Determine user type based on their profile or role
  const userType = useMemo(() => profile?.role === "employer" ? 'employer' : 'job_seeker', [profile?.role]);

  // Get user's country code from profile country name
  const getUserCountryCode = useCallback(() => {
    if (!profile?.country) return "";
    const country = countries.find(c => 
      c.name.toLowerCase() === profile.country?.toLowerCase() || 
      c.code.toLowerCase() === profile.country?.toLowerCase()
    );
    return country?.code || "";
  }, [profile?.country]);

  // Set default tab based on user role when profile loads
  useEffect(() => {
    if (profile?.role === "employer") {
      setActiveTab("talent");
    } else if (profile?.role === "job_seeker") {
      setActiveTab("jobs");
    }
  }, [profile?.role]);

  // Calculate pagination values
  const isEmployer = useMemo(() => profile?.role === "employer", [profile?.role]);
  
  // Determine which items to display based on active tab
  const displayItems = useMemo(() => {
    if (activeTab === "jobs") {
      return isEmployer ? [] : jobs;
    } else if (activeTab === "talent") {
      return isEmployer ? availabilities : [];
    }
    return [];
  }, [activeTab, isEmployer, jobs, availabilities]);
  
  // Calculate total pages based on actual posts (not including ads in count)
  const totalPages = useMemo(() => Math.ceil(displayItems.length / postsPerPage), [displayItems.length]);

  // Get current posts for the page
  const indexOfLastPost = useMemo(() => currentPage * postsPerPage, [currentPage]);
  const indexOfFirstPost = useMemo(() => indexOfLastPost - postsPerPage, [indexOfLastPost]);
  const currentPosts = useMemo(() => 
    displayItems.slice(indexOfFirstPost, indexOfLastPost), 
    [displayItems, indexOfFirstPost, indexOfLastPost]
  );

  // Auto-detect user's country and set filters
  useEffect(() => {
    if (profile?.country && !fromCountry && !toCountry) {
      const userCountryCode = getUserCountryCode();
      if (userCountryCode) {
        setFromCountry(userCountryCode);
        setToCountry(userCountryCode);
      }
    }
  }, [profile, fromCountry, toCountry, getUserCountryCode]);

  // Reset to page 1 when posts change
  useEffect(() => {
    setCurrentPage(1);
  }, [displayItems.length]);

  // Optimized fetchPosts function with parallel data fetching
  const fetchPosts = useCallback(async () => {
    if (!profile?.role) {
      console.log("No profile role, skipping fetchPosts");
      return;
    }

    setLoadingPosts(true);
    try {
      const role = profile.role;
      
      if (role === "employer") {
        // Fetch availabilities and profiles in parallel
        const [availabilitiesPromise, profilesPromise] = await Promise.all([
          supabase
            .from("availabilities")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, is_verified")
            .in("role", ["job_seeker"])
        ]);

        const { data: availabilitiesData, error: availabilitiesError } = availabilitiesPromise;
        const { data: profilesData } = profilesPromise;

        if (availabilitiesError) throw availabilitiesError;

        // Create profile map for quick lookup
        const profilesMap = new Map<string, any>();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Fetch all boost data in bulk
        const { data: boostData } = await supabase
          .from("boosted_posts")
          .select("*")
          .eq("post_type", "availability")
          .in("post_id", availabilitiesData?.map(a => a.id) || []);

        // Create boost map for quick lookup
        const boostMap = new Map<string, any>();
        boostData?.forEach(boost => {
          boostMap.set(boost.post_id, boost);
        });

        // Enrich availabilities data
        const enrichedAvailabilities = availabilitiesData?.map(availability => ({
          ...availability,
          profiles: profilesMap.get(availability.created_by) || null,
          boosted_posts: boostMap.get(availability.id) ? [boostMap.get(availability.id)] : []
        })) || [];

        // Sort by verification status
        const sortedAvailabilities = enrichedAvailabilities.sort((a, b) => {
          const aVerified = a.profiles?.is_verified ? 1 : 0;
          const bVerified = b.profiles?.is_verified ? 1 : 0;
          return bVerified - aVerified;
        });

        setAvailabilities(sortedAvailabilities);
        
        // Also fetch jobs in parallel
        const [jobsPromise, employerProfilesPromise] = await Promise.all([
          supabase
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, company_name, is_verified")
            .in("role", ["employer"])
        ]);

        const { data: jobsData } = jobsPromise;
        const { data: employerProfilesData } = employerProfilesPromise;

        const employerProfilesMap = new Map<string, any>();
        employerProfilesData?.forEach(profile => {
          employerProfilesMap.set(profile.id, profile);
        });

        // Fetch job boost data in bulk
        const { data: jobBoostData } = await supabase
          .from("boosted_posts")
          .select("*")
          .eq("post_type", "job")
          .in("post_id", jobsData?.map(j => j.id) || []);

        const jobBoostMap = new Map<string, any>();
        jobBoostData?.forEach(boost => {
          jobBoostMap.set(boost.post_id, boost);
        });

        const enrichedJobs = jobsData?.map(job => ({
          ...job,
          profiles: employerProfilesMap.get(job.created_by) || null,
          boosted_posts: jobBoostMap.get(job.id) ? [jobBoostMap.get(job.id)] : []
        })) || [];

        const sortedJobs = enrichedJobs.sort((a, b) => {
          const aVerified = a.profiles?.is_verified ? 1 : 0;
          const bVerified = b.profiles?.is_verified ? 1 : 0;
          return bVerified - aVerified;
        });

        setJobs(sortedJobs);
      } else {
        // Fetch jobs and profiles in parallel
        const [jobsPromise, profilesPromise] = await Promise.all([
          supabase
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, company_name, is_verified")
            .in("role", ["employer"])
        ]);

        const { data: jobsData, error: jobsError } = jobsPromise;
        const { data: profilesData } = profilesPromise;

        if (jobsError) throw jobsError;

        // Create profile map for quick lookup
        const profilesMap = new Map<string, any>();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Fetch all boost data in bulk
        const { data: boostData } = await supabase
          .from("boosted_posts")
          .select("*")
          .eq("post_type", "job")
          .in("post_id", jobsData?.map(j => j.id) || []);

        // Create boost map for quick lookup
        const boostMap = new Map<string, any>();
        boostData?.forEach(boost => {
          boostMap.set(boost.post_id, boost);
        });

        // Enrich jobs data
        const enrichedJobs = jobsData?.map(job => ({
          ...job,
          profiles: profilesMap.get(job.created_by) || null,
          boosted_posts: boostMap.get(job.id) ? [boostMap.get(job.id)] : []
        })) || [];

        // Sort by verification status
        const sortedJobs = enrichedJobs.sort((a, b) => {
          const aVerified = a.profiles?.is_verified ? 1 : 0;
          const bVerified = b.profiles?.is_verified ? 1 : 0;
          return bVerified - aVerified;
        });

        setJobs(sortedJobs);
        
        // Also fetch availabilities in parallel
        const [availabilitiesPromise, jobSeekerProfilesPromise] = await Promise.all([
          supabase
            .from("availabilities")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, is_verified")
            .in("role", ["job_seeker"])
        ]);

        const { data: availabilitiesData } = availabilitiesPromise;
        const { data: jobSeekerProfilesData } = jobSeekerProfilesPromise;

        const jobSeekerProfilesMap = new Map<string, any>();
        jobSeekerProfilesData?.forEach(profile => {
          jobSeekerProfilesMap.set(profile.id, profile);
        });

        // Fetch availability boost data in bulk
        const { data: availabilityBoostData } = await supabase
          .from("boosted_posts")
          .select("*")
          .eq("post_type", "availability")
          .in("post_id", availabilitiesData?.map(a => a.id) || []);

        const availabilityBoostMap = new Map<string, any>();
        availabilityBoostData?.forEach(boost => {
          availabilityBoostMap.set(boost.post_id, boost);
        });

        const enrichedAvailabilities = availabilitiesData?.map(availability => ({
          ...availability,
          profiles: jobSeekerProfilesMap.get(availability.created_by) || null,
          boosted_posts: availabilityBoostMap.get(availability.id) ? [availabilityBoostMap.get(availability.id)] : []
        })) || [];

        const sortedAvailabilities = enrichedAvailabilities.sort((a, b) => {
          const aVerified = a.profiles?.is_verified ? 1 : 0;
          const bVerified = b.profiles?.is_verified ? 1 : 0;
          return bVerified - aVerified;
        });

        setAvailabilities(sortedAvailabilities);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
      setJobs([]);
      setAvailabilities([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [profile?.role]);

  // Fetch profile and posts on load - FIXED VERSION
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setInitialLoading(true);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          router.push("/");
          return;
        }

        const user = userData?.user;
        
        if (!user) {
          console.log("No user found, redirecting to home");
          router.push("/");
          return;
        }

        console.log("Loading profile for user:", user.id);

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, company_name, profile_picture, profile_picture_url, role, employer_type, country, is_verified")
          .eq("id", user.id)
          .maybeSingle(); // Use maybeSingle instead of single to avoid error when no profile

        if (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        } else if (!data) {
          console.log("No profile found for user - profile may need to be created");
          setProfile(null);
        } else {
          console.log("Profile loaded successfully:", data);
          setProfile(data);
          
          // Only fetch posts if profile exists
          await fetchPosts();
        }
      } catch (err) {
        console.error("Error in loadProfile:", err);
        setProfile(null);
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [router]); // Removed fetchPosts from dependencies to prevent infinite loop

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
  const getDisplayName = useCallback(() => {
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
  }, [profile]);

  // Check both profile_picture and profile_picture_url
  const profileImageSrc = useCallback((profile: any) => {
    if (!profile) return null;
    
    const imagePath = profile.profile_picture_url || profile.profile_picture;
    
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    
    return supabase.storage.from("profile-pictures").getPublicUrl(imagePath).data?.publicUrl ?? null;
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  const handlePost = useCallback(() => {
    if (profile?.role === "employer") {
      router.push("/post-job");
    } else {
      router.push("/post-availability");
    }
  }, [profile?.role, router]);

  const handleViewApplications = useCallback(() => {
    router.push("/employer/applications");
  }, [router]);

  const handleViewHireRequests = useCallback(() => {
    router.push("/hire-requests");
  }, [router]);

  // Handle navigation to pricing page with correct user type
  const handleViewPricing = useCallback(() => {
    router.push(`/pricing?type=${userType}`);
  }, [router, userType]);

  // Handle navigation to verification page
  const handleGetVerified = useCallback(() => {
    router.push(`/pricing?type=${userType}&verify=true`);
  }, [router, userType]);

  const handleDeleteJob = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Failed to delete job");
    }
  }, []);

  const handleDeleteAvailability = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this availability post?")) return;
    try {
      const { error } = await supabase.from("availabilities").delete().eq("id", id);
      if (error) throw error;
      setAvailabilities((prev) => prev.filter((avail) => avail.id !== id));
    } catch (err) {
      console.error("Error deleting availability:", err);
      alert("Failed to delete availability post");
    }
  }, []);

  // Handle View Profile navigation
  const handleViewProfile = useCallback((userId: string) => {
    router.push(`/profile/${userId}`);
  }, [router]);

  // Hire function for employers
  const handleHireClick = useCallback((availability: Availability) => {
    setSelectedAvailabilityForHire(availability);
    setShowHireModal(true);
  }, []);

  const handleHireConfirm = useCallback(async (message: string, contactInfo: string) => {
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
  }, [profile, selectedAvailabilityForHire]);

  const sendHireNotification = useCallback(async (availability: Availability, hireId: string) => {
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
  }, [profile]);

  // Optimized search function with bulk profile fetching
  const handleSearch = useCallback(async () => {
    setLoadingResults(true);
    try {
      if (profile?.role === "employer") {
        const { data, error } = await supabase
          .from("availabilities")
          .select("*")
          .or(`desired_job.ilike.%${debouncedSearchQuery}%,skills.ilike.%${debouncedSearchQuery}%,name.ilike.%${debouncedSearchQuery}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Fetch profiles in bulk
          const userIds = [...new Set(data.map(d => d.created_by))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, is_verified")
            .in("id", userIds);

          const profilesMap = new Map<string, any>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Fetch boosts in bulk
          const postIds = data.map(d => d.id);
          const { data: boostData } = await supabase
            .from("boosted_posts")
            .select("*")
            .eq("post_type", "availability")
            .in("post_id", postIds);

          const boostMap = new Map<string, any>();
          boostData?.forEach(boost => {
            boostMap.set(boost.post_id, boost);
          });

          const enrichedData = data.map(availability => ({
            ...availability,
            profiles: profilesMap.get(availability.created_by) || null,
            boosted_posts: boostMap.get(availability.id) ? [boostMap.get(availability.id)] : []
          }));

          const sortedData = enrichedData.sort((a, b) => {
            const aVerified = a.profiles?.is_verified ? 1 : 0;
            const bVerified = b.profiles?.is_verified ? 1 : 0;
            return bVerified - aVerified;
          });
          
          setAvailabilities(sortedData);
        }
      } else {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .ilike("title", `%${debouncedSearchQuery}%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Fetch profiles in bulk
          const userIds = [...new Set(data.map(d => d.created_by))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, company_name, is_verified")
            .in("id", userIds);

          const profilesMap = new Map<string, any>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Fetch boosts in bulk
          const postIds = data.map(d => d.id);
          const { data: boostData } = await supabase
            .from("boosted_posts")
            .select("*")
            .eq("post_type", "job")
            .in("post_id", postIds);

          const boostMap = new Map<string, any>();
          boostData?.forEach(boost => {
            boostMap.set(boost.post_id, boost);
          });

          const enrichedData = data.map(job => ({
            ...job,
            profiles: profilesMap.get(job.created_by) || null,
            boosted_posts: boostMap.get(job.id) ? [boostMap.get(job.id)] : []
          }));

          const sortedData = enrichedData.sort((a, b) => {
            const aVerified = a.profiles?.is_verified ? 1 : 0;
            const bVerified = b.profiles?.is_verified ? 1 : 0;
            return bVerified - aVerified;
          });
          
          setJobs(sortedData);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoadingResults(false);
    }
  }, [profile?.role, debouncedSearchQuery]);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch();
    }
  }, [debouncedSearchQuery, handleSearch]);

  // Optimized location-based search with bulk fetching
  const handleRegionSearch = useCallback(async () => {
    setLoadingRegionResults(true);
    try {
      if (profile?.role === "employer") {
        // EMPLOYER VIEW: Find candidates based on location filters
        let query = supabase.from("availabilities").select("*");

        // Search for candidates FROM specific countries
        if (fromCountry) {
          const countryObj = countries.find(c => c.code === fromCountry);
          if (countryObj) {
            query = query.ilike("country", `%${countryObj.name}%`);
          }
        }

        // Search for candidates willing to work IN specific locations
        if (toCountry) {
          const countryObj = countries.find(c => c.code === toCountry);
          if (countryObj) {
            query = query.or(`location.ilike.%${countryObj.name}%,description.ilike.%${countryObj.name}%`);
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;

        if (data) {
          // Bulk fetch profiles
          const userIds = [...new Set(data.map(d => d.created_by))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, is_verified")
            .in("id", userIds);

          const profilesMap = new Map<string, any>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Bulk fetch boosts
          const postIds = data.map(d => d.id);
          const { data: boostData } = await supabase
            .from("boosted_posts")
            .select("*")
            .eq("post_type", "availability")
            .in("post_id", postIds);

          const boostMap = new Map<string, any>();
          boostData?.forEach(boost => {
            boostMap.set(boost.post_id, boost);
          });

          const enrichedData = data.map(availability => ({
            ...availability,
            profiles: profilesMap.get(availability.created_by) || null,
            boosted_posts: boostMap.get(availability.id) ? [boostMap.get(availability.id)] : []
          }));

          const sortedData = enrichedData.sort((a, b) => {
            const aVerified = a.profiles?.is_verified ? 1 : 0;
            const bVerified = b.profiles?.is_verified ? 1 : 0;
            return bVerified - aVerified;
          });

          setAvailabilities(sortedData);
        }
      } else {
        // JOB SEEKER VIEW: Location-based job search
        let query = supabase.from("jobs").select("*");

        // "I am from" = Jobs that want to hire FROM my country
        if (fromCountry) {
          const countryObj = countries.find(c => c.code === fromCountry);
          if (countryObj) {
            query = query.contains("preferred_candidate_countries", [countryObj.code]);
          }
        }
        
        // "I want to work in" = Jobs located IN specific country
        if (toCountry) {
          const countryObj = countries.find(c => c.code === toCountry);
          if (countryObj) {
            query = query.ilike("country", `%${countryObj.name}%`);
          }
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;

        if (data) {
          // Bulk fetch profiles
          const userIds = [...new Set(data.map(d => d.created_by))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, company_name, is_verified")
            .in("id", userIds);

          const profilesMap = new Map<string, any>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Bulk fetch boosts
          const postIds = data.map(d => d.id);
          const { data: boostData } = await supabase
            .from("boosted_posts")
            .select("*")
            .eq("post_type", "job")
            .in("post_id", postIds);

          const boostMap = new Map<string, any>();
          boostData?.forEach(boost => {
            boostMap.set(boost.post_id, boost);
          });

          const enrichedData = data.map(job => ({
            ...job,
            profiles: profilesMap.get(job.created_by) || null,
            boosted_posts: boostMap.get(job.id) ? [boostMap.get(job.id)] : []
          }));

          const sortedData = enrichedData.sort((a, b) => {
            const aVerified = a.profiles?.is_verified ? 1 : 0;
            const bVerified = b.profiles?.is_verified ? 1 : 0;
            return bVerified - aVerified;
          });

          setJobs(sortedData);
        }
      }
    } catch (err) {
      console.error("Region search error:", err);
      alert("Error searching: " + (err as Error).message);
    } finally {
      setLoadingRegionResults(false);
    }
  }, [profile?.role, fromCountry, toCountry]);

  // Optimized remote posts fetching
  const handleShowRemote = useCallback(async () => {
    setLoadingPosts(true);
    try {
      if (profile?.role === "employer") {
        const { data, error } = await supabase
          .from("availabilities")
          .select("*")
          .or(`work_location_type.eq.remote,location.ilike.%remote%,description.ilike.%remote%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Bulk fetch profiles
          const userIds = [...new Set(data.map(d => d.created_by))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, is_verified")
            .in("id", userIds);

          const profilesMap = new Map<string, any>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Bulk fetch boosts
          const postIds = data.map(d => d.id);
          const { data: boostData } = await supabase
            .from("boosted_posts")
            .select("*")
            .eq("post_type", "availability")
            .in("post_id", postIds);

          const boostMap = new Map<string, any>();
          boostData?.forEach(boost => {
            boostMap.set(boost.post_id, boost);
          });

          const enrichedData = data.map(availability => ({
            ...availability,
            profiles: profilesMap.get(availability.created_by) || null,
            boosted_posts: boostMap.get(availability.id) ? [boostMap.get(availability.id)] : []
          }));

          const sortedData = enrichedData.sort((a, b) => {
            const aVerified = a.profiles?.is_verified ? 1 : 0;
            const bVerified = b.profiles?.is_verified ? 1 : 0;
            return bVerified - aVerified;
          });
          
          setAvailabilities(sortedData);
        }
      } else {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .or(`work_location_type.eq.remote,location.ilike.%remote%,description.ilike.%remote%`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data) {
          // Bulk fetch profiles
          const userIds = [...new Set(data.map(d => d.created_by))];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, full_name, company_name, is_verified")
            .in("id", userIds);

          const profilesMap = new Map<string, any>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Bulk fetch boosts
          const postIds = data.map(d => d.id);
          const { data: boostData } = await supabase
            .from("boosted_posts")
            .select("*")
            .eq("post_type", "job")
            .in("post_id", postIds);

          const boostMap = new Map<string, any>();
          boostData?.forEach(boost => {
            boostMap.set(boost.post_id, boost);
          });

          const enrichedData = data.map(job => ({
            ...job,
            profiles: profilesMap.get(job.created_by) || null,
            boosted_posts: boostMap.get(job.id) ? [boostMap.get(job.id)] : []
          }));

          const sortedData = enrichedData.sort((a, b) => {
            const aVerified = a.profiles?.is_verified ? 1 : 0;
            const bVerified = b.profiles?.is_verified ? 1 : 0;
            return bVerified - aVerified;
          });
          
          setJobs(sortedData);
        }
      }
    } catch (err) {
      console.error("Error fetching remote posts:", err);
      alert("Error loading remote opportunities");
    } finally {
      setLoadingPosts(false);
    }
  }, [profile?.role]);

  // Optimized local posts fetching
  const handleShowLocal = useCallback(() => {
    const userCountryCode = getUserCountryCode();
    if (userCountryCode) {
      // Set both filters to user's country
      setFromCountry(userCountryCode);
      setToCountry(userCountryCode);
      
      // Wait for state to update, then trigger search
      setTimeout(() => {
        handleRegionSearch();
      }, 100);
    } else {
      alert("Please set your country in your profile to use this feature");
    }
  }, [getUserCountryCode, handleRegionSearch]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Open modals
  const openJobModal = useCallback((job: Job) => {
    setSelectedJob(job);
    setModalReadOnly(true);
  }, []);

  const openAvailabilityModal = useCallback((availability: Availability) => {
    setSelectedAvailability(availability);
    setModalReadOnly(true);
  }, []);

  const openAdModal = useCallback((ad: AdPlacement) => {
    setSelectedAd(ad);
  }, []);

  // Determine what to display based on user role and active tab
  const getNoPostsMessage = useCallback(() => {
    if (activeTab === "jobs") {
      return isEmployer ? "Switch to Job Seeker account to view jobs" : "No jobs found";
    } else if (activeTab === "talent") {
      return isEmployer ? "No job seekers found" : "Switch to Employer account to view talent";
    } else {
      return "Services coming soon";
    }
  }, [activeTab, isEmployer]);

  // Function to render ad placements
  const renderAdPlacement = useCallback((ad: AdPlacement) => (
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
            <div className="text-3xl mb-2">📢</div>
            <p className="text-xs">Sponsored Content</p>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className={`font-semibold text-sm line-clamp-1 mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
          {ad.title}
        </h3>
        
        <p className={`text-xs line-clamp-2 mb-4 leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {ad.description}
        </p>
        
        <div className="mt-auto flex justify-between items-center">
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} font-medium`}>
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
  ), [openAdModal, darkMode]);

  // Memoized function to render posts with ads
  const renderPostsWithAds = useMemo(() => {
    if (loadingPosts) {
      return (
        <div className="col-span-3 text-center py-12">
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 border-3 border-gray-300 dark:border-gray-600 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className={`text-sm mt-4 font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
            Loading {activeTab === "jobs" ? "jobs" : activeTab === "talent" ? "talent" : "services"}...
          </p>
          <p className={`text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Preparing the best opportunities for you
          </p>
        </div>
      );
    }

    if (currentPosts.length === 0) {
      return (
        <div className="col-span-3 text-center py-12">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-100"} mb-4`}>
            <div className="text-2xl">
              {activeTab === "jobs" ? "💼" : activeTab === "talent" ? "👥" : "🛠️"}
            </div>
          </div>
          <h3 className={`text-base font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {getNoPostsMessage()}
          </h3>
          <p className={`text-sm max-w-md mx-auto mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {activeTab === "services" 
              ? "We're working on bringing you professional services to enhance your experience."
              : (fromCountry || toCountry) ? "Try adjusting your search criteria" : "No posts available yet"
            }
          </p>
          {(fromCountry || toCountry) && activeTab !== "services" && (
            <button
              onClick={() => fetchPosts()}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                darkMode
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/30"
              }`}
            >
              Show All Opportunities
            </button>
          )}
        </div>
      );
    }

    const elements: React.JSX.Element[] = [];
    
    currentPosts.forEach((item, index) => {
      if (activeTab === "talent" || (activeTab === "jobs" && isEmployer)) {
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
            showHireButton={availability.created_by !== profile?.id && isEmployer}
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

      // Insert ads after every 9 posts
      if ((index + 1) % 9 === 0 && adPlacements.length > 0) {
        adPlacements.forEach((ad) => {
          elements.push(renderAdPlacement(ad));
        });
      }
    });

    return elements;
  }, [
    loadingPosts,
    currentPosts,
    activeTab,
    isEmployer,
    profile?.id,
    adPlacements,
    fromCountry,
    toCountry,
    darkMode,
    getNoPostsMessage,
    fetchPosts,
    openAvailabilityModal,
    handleDeleteAvailability,
    handleHireClick,
    handleViewProfile,
    openJobModal,
    handleDeleteJob,
    renderAdPlacement
  ]);

  // Show initial loading screen
  if (initialLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"} text-gray-900 dark:text-white`}>
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="w-14 h-14 border-3 border-gray-300 dark:border-gray-600 rounded-full"></div>
            <div className="absolute top-0 left-0 w-14 h-14 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-base font-semibold mb-2">Loading Dashboard...</h2>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Getting everything ready for you</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4 sm:gap-6">
        <div className="flex flex-col flex-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <span className="text-xl">💪🏿</span>
            <span className="leading-none">NguvuHire</span>
          </h1>
          {/* Role indicator */}
          <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {isEmployer ? "👔 Employer Dashboard" : "💼 Job Seeker Dashboard"}
          </p>
          
          {/* Location indicator */}
          {profile?.country && (
            <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              📍 Your location: <span className="font-medium">{profile.country}</span>
            </p>
          )}
        </div>

        {/* Profile + Action buttons */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            <div className={`text-sm hidden sm:block ${darkMode ? "text-white" : "text-gray-900"}`}>
              Welcome, <span className="font-semibold">{getDisplayName()}</span>
              {profile?.is_verified && (
                <span className="ml-1.5 text-blue-500" title="Verified User">
                  <CheckCircle className="w-3.5 h-3.5 inline" />
                </span>
              )}
            </div>

            <NotificationsBell />

            {profileImageSrc(profile) ? (
              <OptimizedImage
                src={profileImageSrc(profile) ?? ""}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-blue-500"
                onClick={() => router.push("/profile")}
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-400"} flex items-center justify-center text-white cursor-pointer`}
                onClick={() => router.push("/profile")}
              >
                <User className="w-4 h-4" />
              </div>
            )}

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                darkMode 
                  ? "bg-gray-700 text-yellow-300 hover:bg-gray-600" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
            {isEmployer ? (
              <>
                <button
                  onClick={handleViewApplications}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="sm:block hidden">Applications</span>
                  <span className="sm:hidden">Apps</span>
                </button>
                <button
                  onClick={handlePost}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Post Job
                </button>
                {/* VERIFICATION BUTTON - ONLY SHOW IF NOT VERIFIED */}
                {!profile?.is_verified && (
                  <button
                    onClick={handleGetVerified}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                      darkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Get Verified</span>
                  </button>
                )}
                {/* BOOST BUTTON FOR EMPLOYERS */}
                <button
                  onClick={handleViewPricing}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-yellow-400 text-black hover:bg-yellow-500"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Boost</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleViewHireRequests}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  <span className="sm:block hidden">Hire Requests</span>
                  <span className="sm:hidden">Requests</span>
                </button>
                <button
                  onClick={handlePost}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Post Availability
                </button>
                {/* VERIFICATION BUTTON - ONLY SHOW IF NOT VERIFIED */}
                {!profile?.is_verified && (
                  <button
                    onClick={handleGetVerified}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                      darkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Get Verified</span>
                  </button>
                )}
                {/* BOOST BUTTON FOR JOB SEEKERS */}
                <button
                  onClick={handleViewPricing}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto hover:scale-105 active:scale-95 ${
                    darkMode
                      ? "bg-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-yellow-400 text-black hover:bg-yellow-500"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Boost</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* VERIFICATION STATUS BANNER - ONLY SHOW IF NOT VERIFIED */}
      {!profile?.is_verified && (
        <div className={`rounded-xl p-4 mb-5 ${darkMode ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 ${darkMode ? "text-blue-300" : "text-blue-500"}`} />
              <div>
                <span className={`text-sm font-semibold ${darkMode ? "text-blue-200" : "text-blue-800"}`}>
                  Get verified to appear first in search results
                </span>
                <p className={`text-xs mt-0.5 ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                  Increase your visibility and credibility
                </p>
              </div>
            </div>
            <button
              onClick={handleGetVerified}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                darkMode 
                  ? "bg-blue-500 text-white hover:bg-blue-600" 
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Verify Now
            </button>
          </div>
        </div>
      )}

      {/* UNIFIED NAVIGATION TABS */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 ${
        darkMode ? "bg-gray-800" : "bg-gray-200"
      }`}>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "jobs"
              ? darkMode
                ? "bg-purple-500 text-white shadow"
                : "bg-white text-gray-900 shadow"
              : darkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-300"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>💼</span>
            <span>Jobs</span>
            {activeTab === "jobs" && !isEmployer && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                darkMode 
                  ? "bg-purple-600/50 text-white" 
                  : "bg-blue-100 text-blue-800 font-medium"
              }`}>
                {jobs.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("talent")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "talent"
              ? darkMode
                ? "bg-purple-500 text-white shadow"
                : "bg-white text-gray-900 shadow"
              : darkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-300"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>👥</span>
            <span>Talent</span>
            {activeTab === "talent" && isEmployer && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                darkMode 
                  ? "bg-purple-600/50 text-white" 
                  : "bg-blue-100 text-blue-800 font-medium"
              }`}>
                {availabilities.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "services"
              ? darkMode
                ? "bg-purple-500 text-white shadow"
                : "bg-white text-gray-900 shadow"
              : darkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-300"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>🛠️</span>
            <span>Services</span>
          </div>
        </button>
      </div>

      {/* SEARCH BARS ROW - Only show for jobs and talent tabs */}
      {(activeTab === "jobs" || activeTab === "talent") && (
        <div className="space-y-4 mb-6">
          {/* QUICK ACTION BUTTONS */}
          <div className="flex gap-2">
            <button
              onClick={handleShowRemote}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                darkMode 
                  ? "bg-purple-500 text-white hover:bg-purple-600 border border-purple-400"
                  : "bg-purple-500 text-white hover:bg-purple-600 border border-purple-400"
              }`}
            >
              Remote
            </button>
            <button
              onClick={handleShowLocal}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                darkMode 
                  ? "bg-green-500 text-white hover:bg-green-600 border border-green-400"
                  : "bg-green-500 text-white hover:bg-green-600 border border-green-400"
              }`}
            >
              Local
            </button>
            <button
              onClick={() => fetchPosts()}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                darkMode 
                  ? "bg-gray-500 text-white hover:bg-gray-600 border border-gray-400"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400 border border-gray-300"
              }`}
            >
              Show All
            </button>
          </div>

          {/* MAIN SEARCH BAR */}
          <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <input
                  type="text"
                  placeholder={
                    activeTab === "jobs" 
                      ? "Search jobs..." 
                      : "Search skills, roles, names..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? "bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600 border border-gray-600"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white border border-gray-300"
                  }`}
                />
              </div>
            </div>
          </div>
          
          {/* REGION SEARCH */}
          <div className={`rounded-xl p-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Country selects with external labels */}
              <div className="flex flex-col xs:flex-row gap-3 flex-1">
                {/* First dropdown */}
                <div className="flex-1">
                  <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {isEmployer ? "📍 Hire from" : "📍 I am from"}
                  </label>
                  <select
                    value={fromCountry}
                    onChange={(e) => setFromCountry(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700 text-white focus:bg-gray-600 border border-gray-600"
                        : "bg-gray-100 text-gray-900 focus:bg-white border border-gray-300"
                    }`}
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={`from-${country.code}`} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Second dropdown */}
                <div className="flex-1">
                  <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {isEmployer ? "🏢 Job location" : "💼 Work in"}
                  </label>
                  <select
                    value={toCountry}
                    onChange={(e) => setToCountry(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? "bg-gray-700 text-white focus:bg-gray-600 border border-gray-600"
                        : "bg-gray-100 text-gray-900 focus:bg-white border border-gray-300"
                    }`}
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={`to-${country.code}`} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Filter button */}
              <div className="flex items-end">
                <button
                  onClick={handleRegionSearch}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 sm:w-auto w-full ${
                    darkMode 
                      ? "bg-purple-500 text-white hover:bg-purple-600 border border-purple-400"
                      : "bg-blue-500 text-white hover:bg-blue-600 border border-blue-400"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Find</span>
                </button>
              </div>
            </div>
            
            {/* Help text */}
            <p className={`text-xs mt-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {isEmployer 
                ? "Find candidates from specific countries for jobs in specific locations"
                : "Find jobs that want to hire people from your country or jobs in specific locations"
              }
            </p>
          </div>
        </div>
      )}

      {/* Services Tab Content */}
      {activeTab === "services" && (
        <div className={`rounded-xl p-6 mb-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🛠️</div>
            <h3 className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Services Coming Soon</h3>
            <p className={`text-sm max-w-md mx-auto mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              We're working on bringing you professional services to enhance your hiring and job search experience.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <div className="text-xl mb-2">📊</div>
                <h4 className={`font-semibold text-sm mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>Analytics</h4>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Detailed insights and reporting</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <div className="text-xl mb-2">🎯</div>
                <h4 className={`font-semibold text-sm mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>Matching</h4>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Advanced candidate matching</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <div className="text-xl mb-2">⚡</div>
                <h4 className={`font-semibold text-sm mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>Tools</h4>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Productivity enhancements</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {renderPostsWithAds}
      </div>

      {/* Pagination Component */}
      {totalPages > 1 && activeTab !== "services" && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
          <div className={`text-center text-xs mt-4 font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Showing <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{indexOfFirstPost + 1}-{Math.min(indexOfLastPost, displayItems.length)}</span> of <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{displayItems.length}</span> {activeTab === "jobs" ? "jobs" : "job seekers"}
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={`fixed bottom-6 right-6 px-4 py-3 rounded-full text-sm font-medium shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
          darkMode
            ? "bg-purple-500 text-white hover:bg-purple-600"
            : "bg-gray-200 text-gray-900 hover:bg-gray-300"
        }`}
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
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