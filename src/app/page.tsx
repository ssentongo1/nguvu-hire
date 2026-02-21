"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { countries } from "@/utils/countries";
import { Mail, Lock, Globe, User, Building, ChevronRight, X, Sparkles, CheckCircle, ArrowRight, Search, ChevronDown } from "lucide-react";

function HomeContent() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");
  const [employerType, setEmployerType] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetMessage, setResetMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Check URL params for auth modal
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setShowAuthModal(true);
      if (authParam === 'signup') {
        setIsLogin(false);
      }
    }
  }, [searchParams]);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [router]);

  // Auto-focus email input when modal opens
  useEffect(() => {
    if (showAuthModal && emailRef.current) {
      setTimeout(() => {
        emailRef.current?.focus();
      }, 100);
    }
  }, [showAuthModal, isLogin]);

  // Animation for features carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleCloseModal();
      }
    };

    if (showAuthModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthModal]);

  const handleBrowseAsGuest = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push("/browse");
    }, 300);
  };

  const handleCloseModal = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowAuthModal(false);
      setError("");
      setResetMessage("");
      setIsAnimating(false);
    }, 200);
  };

  const handleOpenModal = (loginMode: boolean = true) => {
    setIsLogin(loginMode);
    setShowAuthModal(true);
    setError("");
    setResetMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    try {
      if (isLogin) {
        // Login
        console.log("🔑 Attempting login...");
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (signInError) {
          console.error("Login error:", signInError);
          
          // User-friendly error messages
          if (signInError.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. Please try again.");
          } else if (signInError.message.includes("Email not confirmed")) {
            setError("Please check your email for verification link.");
          } else if (signInError.message.includes("Invalid API key")) {
            setError("Server configuration issue. Please contact support.");
          } else if (signInError.message.includes("400")) {
            setError("Invalid email or password format.");
          } else {
            setError(signInError.message || "Login failed. Please try again.");
          }
          return;
        }
        
        console.log("✅ Login successful");
        router.push("/dashboard");
      } else {
        // Signup
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        if (!country) {
          setError("Please select your country");
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }

        console.log("📝 Attempting signup...");

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              role,
              employer_type: role === "employer" ? employerType : null,
              country: country,
            }
          },
        });

        if (signUpError) {
          console.error("Signup error:", signUpError);
          
          if (signUpError.message.includes("User already registered")) {
            setError("Email already registered. Please sign in instead.");
          } else if (signUpError.message.includes("Invalid email")) {
            setError("Please enter a valid email address.");
          } else if (signUpError.message.includes("Invalid API key")) {
            setError("Server configuration issue. Please try again later.");
          } else {
            setError(signUpError.message || "Signup failed. Please try again.");
          }
          return;
        }

        if (signUpData.user) {
          console.log("✅ Signup successful");
          
          // Try to create profile (non-critical operation)
          try {
            const response = await fetch("/api/create-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: signUpData.user.id,
                email: signUpData.user.email,
                role,
                employerType: role === "employer" ? employerType : null,
                country: country,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.warn("Profile creation warning:", errorData.error);
              // Don't fail signup if profile creation fails
            }
          } catch (profileError) {
            console.warn("Profile creation error (non-critical):", profileError);
          }

          setError("success|Check your email for verification link!");
          
          // Auto-close modal after success
          setTimeout(() => {
            setShowAuthModal(false);
            setError("");
            setIsLogin(true); // Switch back to login
          }, 3000);
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setResetMessage("");
    
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    
    try {
      console.log("📧 Sending password reset email...");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send reset email");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-12 h-12 border-3 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading NguvuHire...</p>
        </div>
      </div>
    );
  }

  const isSuccessMessage = error.startsWith("success|");
  const displayMessage = isSuccessMessage ? error.replace("success|", "") : error;

  const features = [
    {
      icon: "💼",
      title: "Find Jobs",
      description: "Discover opportunities locally and beyond",
      color: "bg-gradient-to-br from-blue-100 to-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-500"
    },
    {
      icon: "👥",
      title: "Find Talent",
      description: "Connect with skilled professionals worldwide",
      color: "bg-gradient-to-br from-purple-100 to-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-500"
    },
    {
      icon: "🚀",
      title: "No Commitment",
      description: "Browse freely, sign up only when needed",
      color: "bg-gradient-to-br from-amber-100 to-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-100/10 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          {/* Logo & Tagline */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg shadow-blue-500/30">
                💪🏿
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              NguvuHire
            </h1>
          </div>
          
          <p className="text-lg md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
            Find Jobs & Talent Worldwide -{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Browse Freely, Connect Smartly
            </span>
          </p>

          {/* Hero Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">10K+</div>
              <div className="text-sm text-gray-600">Active Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">50+</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">98%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handleBrowseAsGuest}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <Search className="w-5 h-5" />
              Browse Jobs & Talent
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleOpenModal(true)}
              className="group bg-white text-blue-600 hover:bg-blue-50 border-2 border-blue-500 hover:border-blue-600 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center gap-3 shadow-md hover:shadow-lg"
            >
              <User className="w-5 h-5" />
              Sign In / Join
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Features Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 border-2 ${
                    activeFeature === index 
                      ? `${feature.borderColor} bg-white shadow-xl scale-105` 
                      : 'border-gray-200 bg-white shadow-md hover:shadow-lg'
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`absolute inset-0 ${feature.color} opacity-30`}></div>
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl ${feature.color} border ${feature.borderColor} flex items-center justify-center text-xl mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    {activeFeature === index && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Feature Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeFeature === index 
                      ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`View feature ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isAnimating ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div 
            ref={modalRef}
            className="relative w-full max-w-md max-h-[90vh] overflow-hidden"
          >
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              {/* Modal Header */}
              <div className="relative p-6 border-b border-gray-100">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {isLogin ? "Welcome Back" : "Join NguvuHire"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {isLogin ? "Sign in to continue your journey" : "Start your global career journey"}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider">
                      <Mail className="w-3 h-3 inline-block mr-1" />
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 pl-11"
                        placeholder="you@example.com"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider">
                        <User className="w-3 h-3 inline-block mr-1" />
                        I Am A
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole("job_seeker")}
                          className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                            role === "job_seeker"
                              ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm"
                              : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600"
                          }`}
                        >
                          <User className="w-4 h-4" />
                          Job Seeker
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole("employer")}
                          className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                            role === "employer"
                              ? "bg-purple-50 border-purple-500 text-purple-600 shadow-sm"
                              : "bg-white border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600"
                          }`}
                        >
                          <Building className="w-4 h-4" />
                          Employer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Employer Type - Professional Dropdown */}
                  {!isLogin && role === "employer" && (
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider">
                        Employer Type
                      </label>
                      <div className="relative">
                        <select
                          value={employerType}
                          onChange={(e) => setEmployerType(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-gray-50/80 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer"
                        >
                          <option value="" className="text-gray-500">-- Select Type --</option>
                          <option value="company" className="text-gray-800">Company</option>
                          <option value="agency" className="text-gray-800">Agency</option>
                          <option value="recruiter" className="text-gray-800">Recruiter</option>
                          <option value="freelancer" className="text-gray-800">Freelancer</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Country Selection - Professional Dropdown */}
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider">
                        <Globe className="w-3 h-3 inline-block mr-1" />
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-gray-50/80 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer pr-10"
                        >
                          <option value="" className="text-gray-500">-- Select Your Country --</option>
                          {countries.map((c) => (
                            <option key={c.code} value={c.name} className="text-gray-800">
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Globe className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider">
                      <Lock className="w-3 h-3 inline-block mr-1" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 pl-11 pr-11"
                        placeholder="Enter your password"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <span className="text-gray-500 text-sm">🙈</span>
                        ) : (
                          <span className="text-gray-500 text-sm">👁️</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wider">
                        <Lock className="w-3 h-3 inline-block mr-1" />
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full px-4 py-3 bg-gray-50/80 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 pl-11 pr-11"
                          placeholder="Confirm your password"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <span className="text-gray-500 text-sm">🙈</span>
                          ) : (
                            <span className="text-gray-500 text-sm">👁️</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {displayMessage && (
                    <div className={`p-4 rounded-xl border ${
                      isSuccessMessage 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <div className="flex items-start gap-3">
                        {isSuccessMessage ? (
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500">⚠️</div>
                        )}
                        <div className="text-sm font-medium">{displayMessage}</div>
                      </div>
                    </div>
                  )}
                  
                  {resetMessage && (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium">{resetMessage}</div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="group relative w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] overflow-hidden shadow-md hover:shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="relative">
                      {isLogin ? "Sign In" : "Create Account"}
                    </span>
                  </button>
                </form>

                {/* Forgot Password */}
                {isLogin && (
                  <div className="mt-5 text-center">
                    <button 
                      onClick={handlePasswordReset}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Toggle Login/Signup */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError("");
                        setResetMessage("");
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-all duration-300 hover:underline"
                    >
                      {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                  </p>
                </div>

                {/* Guest Option */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      handleBrowseAsGuest();
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-all duration-300"
                  >
                    ← Continue browsing as guest
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.2s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-12 h-12 border-3 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading NguvuHire...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}