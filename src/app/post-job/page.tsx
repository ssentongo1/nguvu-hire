"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { countries } from "@/utils/countries";
import BoostPromotionBanner from "@/components/BoostPromotionBanner";

// Create a separate component that uses useSearchParams
function PostJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useTheme();

  const [profile, setProfile] = useState<{ role?: string; country?: string } | null>(null);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("");
  const [salary, setSalary] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [preferredCandidateCountries, setPreferredCandidateCountries] = useState<string[]>([]);
  const [workLocationType, setWorkLocationType] = useState<"remote" | "onsite" | "hybrid">("onsite");
  const [remoteHiringScope, setRemoteHiringScope] = useState<"worldwide" | "specific">("worldwide");
  const [remoteHiringCountries, setRemoteHiringCountries] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role, country")
        .eq("id", user.id)
        .single();
      setProfile(data ?? null);
      
      // Auto-set country from profile if available
      if (data?.country && !isEditing) {
        setCountry(data.country);
      }
    };
    fetchProfile();
  }, [isEditing]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingJobId(editId);
      fetchJobData(editId);
    }
  }, [searchParams]);

  const fetchJobData = async (jobId: string) => {
    try {
      const { data: job, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;
      if (job) {
        setTitle(job.title || "");
        setCompany(job.company || "");
        setCountry(job.country || "");
        setLocation(job.location || "");
        setResponsibilities(job.responsibilities || "");
        setRequirements(job.requirements || "");
        setDescription(job.description || "");
        setJobType(job.job_type || "");
        setSalary(job.salary || "");
        setCoverUrl(job.cover_photo || "");
        setDeadline(job.deadline || "");
        setPreferredCandidateCountries(job.preferred_candidate_countries || []);
        
        // Determine work location type based on location data
        if (job.work_location_type) {
          setWorkLocationType(job.work_location_type);
        } else if (job.location?.toLowerCase().includes('remote')) {
          setWorkLocationType("remote");
        } else if (job.location?.toLowerCase().includes('hybrid')) {
          setWorkLocationType("hybrid");
        } else {
          setWorkLocationType("onsite");
        }
        
        // Extract remote hiring countries if available
        if (job.remote_work_countries) {
          setRemoteHiringCountries(job.remote_work_countries);
          setRemoteHiringScope("specific");
        }
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
      alert("Error loading job data");
    }
  };

  const handleUploadCover = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("job-covers").upload(fileName, file);
      if (error) throw error;

      const publicUrl = supabase.storage.from("job-covers").getPublicUrl(fileName).data.publicUrl;
      if (!publicUrl) throw new Error("Failed to get cover URL");

      setCoverUrl(publicUrl);
    } catch (err) {
      console.error("Error uploading cover photo:", err);
      alert("Error uploading cover photo");
    } finally {
      setUploading(false);
    }
  };

  const handleCountryToggle = (countryCode: string) => {
    setPreferredCandidateCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(code => code !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleRemoteCountryToggle = (countryCode: string) => {
    setRemoteHiringCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(code => code !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleWorkLocationChange = (type: "remote" | "onsite" | "hybrid") => {
    setWorkLocationType(type);
    // Auto-update location field based on selection
    if (type === "remote") {
      setLocation("Remote");
    } else if (type === "hybrid") {
      setLocation(prev => prev === "Remote" ? "" : prev);
    } else {
      setLocation(prev => prev === "Remote" ? "" : prev);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (profile?.role !== "employer") {
        alert("Only employers can post jobs");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const jobData = {
        title: title,
        company: company,
        country: country,
        location: location,
        responsibilities: responsibilities,
        requirements: requirements,
        description: description,
        job_type: jobType,
        salary: salary,
        preferred_candidate_countries: preferredCandidateCountries,
        work_location_type: workLocationType,
        remote_work_countries: workLocationType === "remote" && remoteHiringScope === "specific" ? remoteHiringCountries : null,
        cover_photo: coverUrl || null,
        deadline: deadline || null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editingJobId) {
        const { error } = await supabase
          .from("jobs")
          .update(jobData)
          .eq("id", editingJobId);

        if (error) throw error;
        alert("Job updated successfully!");
        router.push("/profile");
        return;
      } else {
        const { error } = await supabase.from("jobs").insert([
          {
            ...jobData,
            created_by: userId,
          },
        ]);

        if (error) throw error;
        alert("Job posted successfully!");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error posting job:", err);
      alert("Error posting job: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all duration-200 text-sm ${
    darkMode 
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-500"
  }`;

  const labelClasses = `block text-sm font-semibold mb-2 ${
    darkMode ? "text-gray-200" : "text-gray-700"
  }`;

  const sectionClasses = `p-6 rounded-xl border-2 border-dashed ${
    darkMode ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
  }`;

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"}`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            {isEditing ? "Edit Job Post" : "Post a Job Opportunity"}
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {isEditing ? "Update your job posting" : "Find the perfect candidate for your open position"}
          </p>
        </div>

        {/* Boost Promotion Banner */}
        <BoostPromotionBanner userType="employer" />

        <form onSubmit={handleSubmit} className={`rounded-2xl shadow-xl p-8 border transition-colors duration-300 ${
          darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
        }`}>
          <div className="space-y-6">
            {/* Job Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Frontend Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Company *</label>
                <input
                  type="text"
                  placeholder="Your company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Job Country *</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClasses}
                  required
                >
                  <option value="">Select a country</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Select job type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>Salary Range</label>
                <input
                  type="text"
                  placeholder="e.g., $50,000 - $70,000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Application Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={inputClasses}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Work Location Type */}
            <div>
              <label className={labelClasses}>Work Location Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleWorkLocationChange("onsite")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                    workLocationType === "onsite"
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : darkMode
                      ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="font-semibold">On-site</div>
                  <div className="text-xs mt-1">Work from office</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleWorkLocationChange("remote")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                    workLocationType === "remote"
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : darkMode
                      ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="font-semibold">Remote</div>
                  <div className="text-xs mt-1">Work from anywhere</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleWorkLocationChange("hybrid")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                    workLocationType === "hybrid"
                      ? "border-green-500 bg-green-500/10 text-green-600"
                      : darkMode
                      ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-2">🔀</div>
                  <div className="font-semibold">Hybrid</div>
                  <div className="text-xs mt-1">Mix of both</div>
                </button>
              </div>
            </div>

            {/* Remote Hiring Scope - Only show if remote is selected */}
            {workLocationType === "remote" && (
              <div>
                <label className={labelClasses}>Remote Hiring Scope *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setRemoteHiringScope("worldwide")}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                      remoteHiringScope === "worldwide"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600"
                        : darkMode
                        ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">🌍</div>
                    <div className="font-semibold">Worldwide</div>
                    <div className="text-xs mt-1">Hire from anywhere in the world</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRemoteHiringScope("specific")}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                      remoteHiringScope === "specific"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600"
                        : darkMode
                        ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">📍</div>
                    <div className="font-semibold">Specific Countries</div>
                    <div className="text-xs mt-1">Choose where to hire from</div>
                  </button>
                </div>

                {remoteHiringScope === "specific" && (
                  <div>
                    <label className={`${labelClasses} mb-3`}>
                      Select countries where you want to hire remote workers from:
                    </label>
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border max-h-60 overflow-y-auto ${
                      darkMode ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
                    }`}>
                      {countries.map(country => (
                        <label key={country.code} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-700/30 transition">
                          <input
                            type="checkbox"
                            checked={remoteHiringCountries.includes(country.code)}
                            onChange={() => handleRemoteCountryToggle(country.code)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className={`text-xs ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {country.flag} {country.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {remoteHiringCountries.length > 0 && (
                      <p className={`text-xs mt-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>
                        Will hire remote workers from: {remoteHiringCountries.map(code => {
                          const country = countries.find(c => c.code === code);
                          return country ? `${country.flag} ${country.name}` : '';
                        }).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Specific Location */}
            <div>
              <label className={labelClasses}>
                {workLocationType === "remote" ? "Remote Work Details" : "Specific Location *"}
              </label>
              <input
                type="text"
                placeholder={
                  workLocationType === "remote" 
                    ? "e.g., Fully remote, Remote with occasional meetings..."
                    : "e.g., New York, NY or London, UK"
                }
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClasses}
                required={workLocationType !== "remote"}
              />
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {workLocationType === "remote" 
                  ? "Provide details about remote work arrangements"
                  : "Enter the specific city, state, or office location"
                }
              </p>
            </div>

            {/* Preferred Candidate Countries */}
            <div>
              <label className={labelClasses}>
                Where are you hiring from? *
                <span className="text-xs font-normal ml-2 text-gray-500">
                  (Select countries where you want to find candidates)
                </span>
              </label>
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border max-h-60 overflow-y-auto ${
                darkMode ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
              }`}>
                {countries.map(country => (
                  <label key={country.code} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-700/30 transition">
                    <input
                      type="checkbox"
                      checked={preferredCandidateCountries.includes(country.code)}
                      onChange={() => handleCountryToggle(country.code)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-xs ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      {country.flag} {country.name}
                    </span>
                  </label>
                ))}
              </div>
              {preferredCandidateCountries.length > 0 && (
                <p className={`text-xs mt-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  Hiring from: {preferredCandidateCountries.map(code => {
                    const country = countries.find(c => c.code === code);
                    return country ? `${country.flag} ${country.name}` : '';
                  }).join(', ')}
                </p>
              )}
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Job seekers from these countries will see your job in their "Jobs hiring from" filter
              </p>
            </div>

            {/* Job Description */}
            <div>
              <label className={labelClasses}>Job Description *</label>
              <textarea
                placeholder="Describe the role, team, company culture, and what makes this position exciting..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClasses}
                required
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className={labelClasses}>Key Responsibilities *</label>
              <textarea
                placeholder="List the main duties and responsibilities of this role...
• Use bullet points for better readability
• Each point should start with a dash or asterisk
• Keep each point concise and clear"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                rows={4}
                className={inputClasses}
                required
              />
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Tip: Use bullet points (start each line with • or -) for better readability
              </p>
            </div>

            {/* Requirements */}
            <div>
              <label className={labelClasses}>Requirements & Qualifications *</label>
              <textarea
                placeholder="List the required skills, experience, education, and qualifications...
• Use bullet points for better readability
• Each point should start with a dash or asterisk
• Keep each point concise and clear"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                className={inputClasses}
                required
              />
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Tip: Use bullet points (start each line with • or -) for better readability
              </p>
            </div>

            {/* Cover Photo Upload */}
            <div className={sectionClasses}>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>🖼️ Job Cover Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleUploadCover(e.target.files[0])}
                className={`w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold ${
                  darkMode 
                    ? "text-gray-300 file:bg-green-900 file:text-green-200 hover:file:bg-green-800" 
                    : "text-gray-500 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                }`}
              />
              {coverUrl && (
                <div className="mt-4">
                  <img src={coverUrl} alt="Cover Preview" className="w-full h-40 object-cover rounded-lg shadow-md" />
                  <p className={`text-xs mt-2 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cover photo preview - This will make your job post stand out</p>
                </div>
              )}
              {uploading && <p className={`text-xs mt-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Uploading cover photo...</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? "Updating Job..." : "Posting Job..."}
                  </span>
                ) : (
                  isEditing ? "Update Job Post" : "Post Job Opportunity"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function PostJobPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PostJobContent />
    </Suspense>
  );
}