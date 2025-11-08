"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { User, Briefcase, Crown, Search, MapPin, X } from "lucide-react";
import { countries } from "@/utils/countries";
import Pagination from "@/components/Pagination";

// Reuse the types from dashboard
type Job = {
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
  } | null;
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
  } | null;
};

type AdPlacement = {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'image' | 'video';
  link?: string;
};

// Optimized Image Component
function OptimizedImage({ src, alt, className, onClick }: { src: string; alt: string; className: string; onClick?: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
      {imageError ? (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-lg mb-1">📷</div>
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

// Job Card Component for Public View
function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const { darkMode } = useTheme();
  
  const isBoosted = job.boosted_posts?.[0]?.is_active;
  const companyName = job.profiles?.company_name || job.company || "Company";
  
  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:scale-[1.02] ${
        darkMode ? "bg-white/10 border border-white/20" : "bg-white border border-gray-200"
      } ${isBoosted ? 'ring-2 ring-yellow-400' : ''}`}
      onClick={onClick}
    >
      {isBoosted && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded z-10 font-semibold flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Boosted
        </div>
      )}
      
      <div className="w-full h-40 bg-gray-300 dark:bg-gray-600 overflow-hidden">
        {job.cover_photo ? (
          <OptimizedImage
            src={job.cover_photo}
            alt={job.title}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Briefcase className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">{companyName}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className={`font-semibold text-sm line-clamp-1 mb-2 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}>
          {job.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <MapPin className={`w-3 h-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {job.location}, {job.country}
          </span>
        </div>
        
        <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          {job.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {new Date(job.created_at).toLocaleDateString()}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            darkMode ? "bg-purple-500 text-white" : "bg-blue-500 text-white"
          }`}>
            {job.work_location_type || "On-site"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Availability Card Component for Public View
function AvailabilityCard({ availability, onClick }: { availability: Availability; onClick: () => void }) {
  const { darkMode } = useTheme();
  
  const isBoosted = availability.boosted_posts?.[0]?.is_active;
  const candidateName = availability.profiles?.full_name || availability.name;

  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:scale-[1.02] ${
        darkMode ? "bg-white/10 border border-white/20" : "bg-white border border-gray-200"
      } ${isBoosted ? 'ring-2 ring-yellow-400' : ''}`}
      onClick={onClick}
    >
      {isBoosted && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded z-10 font-semibold flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Boosted
        </div>
      )}
      
      <div className="w-full h-40 bg-gray-300 dark:bg-gray-600 overflow-hidden">
        {availability.cover_image ? (
          <OptimizedImage
            src={availability.cover_image}
            alt={candidateName}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">{candidateName}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className={`font-semibold text-sm line-clamp-1 mb-2 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}>
          {availability.desired_job}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <MapPin className={`w-3 h-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
          <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {availability.location}, {availability.country}
          </span>
        </div>
        
        <p className={`text-xs line-clamp-2 mb-2 leading-relaxed ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          {availability.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {availability.skills.split(',').slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded ${
                darkMode ? "bg-purple-500/30 text-purple-200" : "bg-blue-100 text-blue-800"
              }`}
            >
              {skill.trim()}
            </span>
          ))}
          {availability.skills.split(',').length > 3 && (
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              +{availability.skills.split(',').length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {new Date(availability.created_at).toLocaleDateString()}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            darkMode ? "bg-green-500 text-white" : "bg-green-500 text-white"
          }`}>
            Available
          </span>
        </div>
      </div>
    </div>
  );
}

// Ad Card Component
function AdCard({ ad, onClick }: { ad: AdPlacement; onClick: () => void }) {
  const { darkMode } = useTheme();

  return (
    <div
      className="relative bg-white/10 dark:bg-white/5 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col border-2 border-dashed border-yellow-400"
      onClick={onClick}
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
  );
}

export default function BrowsePage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<"jobs" | "talent" | "services">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdPlacement | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12; // 12 posts + 3 ads = 15 total cards per page

  // Text color utilities
  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";

  // Filter data based on search and location
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === "" || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter === "" || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
      job.country.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  const filteredAvailabilities = availabilities.filter(availability => {
    const matchesSearch = searchQuery === "" || 
      availability.desired_job.toLowerCase().includes(searchQuery.toLowerCase()) ||
      availability.skills.toLowerCase().includes(searchQuery.toLowerCase()) ||
      availability.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = locationFilter === "" || 
      availability.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
      availability.country.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  // Determine which items to display based on active tab
  const displayItems = activeTab === "jobs" ? filteredJobs : 
                      activeTab === "talent" ? filteredAvailabilities : [];
  
  // Calculate total pages based on actual posts (not including ads in count)
  const totalPages = Math.ceil(displayItems.length / postsPerPage);

  // Get current posts for the page
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = displayItems.slice(indexOfFirstPost, indexOfLastPost);

  // Fetch public data
  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      try {
        // Fetch jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (jobsError) throw jobsError;

        // Fetch availabilities
        const { data: availabilitiesData, error: availabilitiesError } = await supabase
          .from("availabilities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (availabilitiesError) throw availabilitiesError;

        // Enrich data with profile information
        const enrichedJobs = await Promise.all(
          (jobsData || []).map(async (job) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, avatar_url, full_name, company_name")
              .eq("id", job.created_by)
              .single();

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

        const enrichedAvailabilities = await Promise.all(
          (availabilitiesData || []).map(async (availability) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, avatar_url, full_name")
              .eq("id", availability.created_by)
              .single();

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

        setJobs(enrichedJobs);
        setAvailabilities(enrichedAvailabilities);

        // Fetch ads
        const { data: adsData } = await supabase
          .from("ads")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(3);

        setAdPlacements(adsData?.map(ad => ({
          id: ad.id,
          title: ad.title,
          description: ad.description,
          image: ad.image_url,
          type: ad.ad_type as 'image' | 'video',
          link: ad.target_url
        })) || []);

      } catch (error) {
        console.error("Error fetching public data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  // Reset to page 1 when posts change
  useEffect(() => {
    setCurrentPage(1);
  }, [displayItems.length, activeTab]);

  const handleSignUpPrompt = (action: string) => {
    const confirmed = confirm(`To ${action}, you'll need to create an account. Would you like to sign up now?`);
    if (confirmed) {
      router.push("/?auth=signup");
    }
  };

  const handleViewDetails = (item: Job | Availability) => {
    if (activeTab === "jobs") {
      handleSignUpPrompt("view job details and apply");
    } else if (activeTab === "talent") {
      handleSignUpPrompt("view candidate details and hire");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdModal = (ad: AdPlacement) => {
    setSelectedAd(ad);
  };

  // Function to render posts with ads inserted after every 9 posts
  const renderPostsWithAds = () => {
    if (loading) {
      return (
        <div className="col-span-3 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className={`text-sm ${textMuted}`}>
            Loading {activeTab === "jobs" ? "jobs" : activeTab === "talent" ? "talent" : "services"}...
          </p>
        </div>
      );
    }

    if (activeTab === "services") {
      return (
        <div className="col-span-3 text-center py-8">
          <div className="text-4xl mb-4">🛠️</div>
          <h3 className="text-base font-bold mb-3">Services Coming Soon</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            We're building a marketplace for freelance services including designers, developers, writers, photographers, and more!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className={`p-4 rounded-lg ${darkMode ? "bg-purple-500/20" : "bg-blue-50"}`}>
              <div className="text-lg mb-2">🎨</div>
              <h4 className="font-semibold text-sm mb-1">Designers</h4>
              <p className="text-xs">UI/UX, Graphic Design, Branding</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-purple-500/20" : "bg-blue-50"}`}>
              <div className="text-lg mb-2">💻</div>
              <h4 className="font-semibold text-sm mb-1">Developers</h4>
              <p className="text-xs">Web, Mobile, Full-stack</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? "bg-purple-500/20" : "bg-blue-50"}`}>
              <div className="text-lg mb-2">✍️</div>
              <h4 className="font-semibold text-sm mb-1">Writers</h4>
              <p className="text-xs">Content, Copy, Technical</p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => router.push("/?auth=signup")}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
                darkMode
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Get Notified When Services Launch
            </button>
          </div>
        </div>
      );
    }

    if (currentPosts.length === 0) {
      return (
        <div className="col-span-3 text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">
            {activeTab === "jobs" ? "💼" : "👥"}
          </div>
          <h3 className="text-sm font-medium mb-2">
            {activeTab === "jobs" ? "No jobs found" : "No talent found"}
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            {searchQuery || locationFilter 
              ? "Try adjusting your search criteria"
              : activeTab === "jobs" 
                ? "No jobs have been posted yet" 
                : "No candidates have posted availability yet"
            }
          </p>
        </div>
      );
    }

    const elements: React.JSX.Element[] = [];
    
    // Insert ads after every 9 posts
    currentPosts.forEach((item, index) => {
      if (activeTab === "jobs") {
        const job = item as Job;
        elements.push(
          <JobCard
            key={job.id}
            job={job}
            onClick={() => handleViewDetails(job)}
          />
        );
      } else {
        const availability = item as Availability;
        elements.push(
          <AvailabilityCard
            key={availability.id}
            availability={availability}
            onClick={() => handleViewDetails(availability)}
          />
        );
      }

      // Insert ads after every 9 posts
      if ((index + 1) % 9 === 0 && adPlacements.length > 0) {
        adPlacements.forEach((ad) => {
          elements.push(
            <AdCard
              key={`ad-${ad.id}`}
              ad={ad}
              onClick={() => openAdModal(ad)}
            />
          );
        });
      }
    });

    return elements;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode 
          ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800 text-white"
          : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <h2 className="text-base font-semibold mb-2">Loading Opportunities...</h2>
          <p className="text-sm text-gray-400">Discovering jobs and talent</p>
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push("/")}
              className={`p-2 rounded-lg transition ${
                darkMode ? "hover:bg-purple-500" : "hover:bg-gray-200"
              }`}
            >
              ←
            </button>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <span className="text-xl">💪🏿</span>
              <span className="leading-none">NguvuHire</span>
            </h1>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Browse {activeTab === "jobs" ? "job opportunities" : activeTab === "talent" ? "talented candidates" : "freelance services"} - Sign up to connect
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/?auth=login")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              darkMode
                ? "bg-purple-500 text-white hover:bg-purple-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/?auth=signup")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              darkMode
                ? "bg-white text-purple-600 hover:bg-gray-100"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            Join Free
          </button>
        </div>
      </div>

      {/* Tabs - UPDATED WITH SERVICES TAB */}
      <div className={`flex gap-1 p-1 rounded-lg mb-4 ${
        darkMode ? "bg-purple-500/20" : "bg-gray-200"
      }`}>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition ${
            activeTab === "jobs"
              ? darkMode
                ? "bg-purple-500 text-white shadow"
                : "bg-white text-gray-900 shadow"
              : darkMode
                ? "text-purple-200 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          }`}
        >
          💼 Jobs ({filteredJobs.length})
        </button>
        <button
          onClick={() => setActiveTab("talent")}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition ${
            activeTab === "talent"
              ? darkMode
                ? "bg-purple-500 text-white shadow"
                : "bg-white text-gray-900 shadow"
              : darkMode
                ? "text-purple-200 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          }`}
        >
          👥 Talent ({filteredAvailabilities.length})
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition ${
            activeTab === "services"
              ? darkMode
                ? "bg-purple-500 text-white shadow"
                : "bg-white text-gray-900 shadow"
              : darkMode
                ? "text-purple-200 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🛠️ Services
        </button>
      </div>

      {/* Search and Filter - Only show for jobs and talent tabs */}
      {(activeTab === "jobs" || activeTab === "talent") && (
        <div className={`rounded-lg p-3 mb-4 ${
          darkMode ? "bg-purple-500/20 backdrop-blur-sm border border-purple-400/30" : "bg-white border border-gray-200"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${textMuted}`} />
              <input
                type="text"
                placeholder={activeTab === "jobs" ? "Search jobs, companies..." : "Search skills, roles, names..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 ${
                  darkMode
                    ? "bg-purple-600/30 text-white placeholder-purple-200 focus:ring-purple-300 focus:bg-purple-600/50 border border-purple-400/30"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-blue-400 focus:bg-white border border-gray-200"
                }`}
              />
            </div>
            <div className="relative">
              <MapPin className={`absolute left-3 top-2.5 w-4 h-4 ${textMuted}`} />
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 ${
                  darkMode
                    ? "bg-purple-600/30 text-white placeholder-purple-200 focus:ring-purple-300 focus:bg-purple-600/50 border border-purple-400/30"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-blue-400 focus:bg-white border border-gray-200"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {renderPostsWithAds()}
      </div>

      {/* Pagination Component - Only show for jobs and talent tabs */}
      {totalPages > 1 && activeTab !== "services" && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
          <div className="text-center text-xs text-gray-600 dark:text-gray-300 mt-3">
            Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, displayItems.length)} of {displayItems.length} {activeTab === "jobs" ? "jobs" : "job seekers"}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className={`text-center mt-8 p-6 rounded-xl ${
        darkMode ? "bg-purple-500/20 border border-purple-400/30" : "bg-white border border-gray-200"
      }`}>
        <h2 className="text-base font-bold mb-3">Ready to Connect?</h2>
        <p className={`text-sm mb-4 max-w-2xl mx-auto ${textMuted}`}>
          Join NguvuHire to apply for jobs, hire talent, and unlock all features
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/?auth=signup")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
              darkMode
                ? "bg-white text-purple-600 hover:bg-gray-100"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            Join Free - Get Started
          </button>
          <button
            onClick={() => router.push("/?auth=login")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition ${
              darkMode
                ? "bg-purple-500 text-white hover:bg-purple-600 border border-purple-400"
                : "bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-300"
            }`}
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>

      {/* Ad Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto ${
            darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white"
          }`}>
            <div className={`p-4 sm:p-6 border-b ${darkMode ? "border-purple-500" : "border-gray-200"} sticky top-0 bg-inherit`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-base sm:text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {selectedAd.title}
                </h2>
                <button
                  onClick={() => setSelectedAd(null)}
                  className={`p-1 sm:p-2 rounded-full transition ${
                    darkMode ? "hover:bg-purple-500" : "hover:bg-gray-200"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Sponsored Content
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="w-full h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4 overflow-hidden">
                {selectedAd.type === 'video' ? (
                  <video 
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  >
                    <source src={selectedAd.image} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <OptimizedImage
                    src={selectedAd.image}
                    alt={selectedAd.title}
                    className="w-full h-full"
                  />
                )}
              </div>
              
              <p className={`text-sm leading-relaxed mb-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {selectedAd.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.open(selectedAd.link || '#', '_blank')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition text-sm ${
                    darkMode 
                      ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                      : "bg-yellow-500 text-black hover:bg-yellow-600"
                  }`}
                >
                  Learn More
                </button>
                <button
                  onClick={() => setSelectedAd(null)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition text-sm ${
                    darkMode 
                      ? "bg-purple-500 text-white hover:bg-purple-600" 
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}