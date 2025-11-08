"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { countries } from "@/utils/countries";

export default function Home() {
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

  const router = useRouter();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        router.push("/dashboard");
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  const handleBrowseAsGuest = () => {
    router.push("/browse");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    try {
      if (isLogin) {
        // Login
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
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

        const {
          data: { user },
          error: signUpError,
        } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });

        if (signUpError) throw signUpError;

        if (user) {
          // Create default profile with chosen role/employerType and country
          const response = await fetch("/api/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              role,
              employerType: role === "employer" ? employerType : null,
              country: country,
            }),
          });

          if (!response.ok) {
            const profileData = await response.json();
            console.error("Profile Creation Error:", profileData.error);
            setError(profileData.error || "Failed to create profile");
            return;
          }

          setError("Check your email for verification link!");
        }
      }
    } catch (err: any) {
      console.error("Sign-Up/Login Error:", err.message, "Code:", err.code);
      setError(err.message || "An unexpected error occurred");
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setResetMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            💪🏿 NguvuHire
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Find Jobs & Talent Across Africa - Browse Freely, Connect Smartly
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <button
              onClick={handleBrowseAsGuest}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🔍 Browse Jobs & Talent
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200"
            >
              👤 Sign In / Join
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="text-2xl mb-3">💼</div>
              <h3 className="font-semibold text-sm mb-2">Find Jobs</h3>
              <p className="text-xs text-gray-600">Discover opportunities across Africa and beyond</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="text-2xl mb-3">👥</div>
              <h3 className="font-semibold text-sm mb-2">Find Talent</h3>
              <p className="text-xs text-gray-600">Connect with skilled professionals</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-semibold text-sm mb-2">No Commitment</h3>
              <p className="text-xs text-gray-600">Browse freely, sign up only when needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">{isLogin ? "Welcome Back" : "Create Account"}</h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your email"
                />
              </div>

              {/* Role */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-700">I am a</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "job_seeker" | "employer")}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="job_seeker">Job Seeker</option>
                    <option value="employer">Employer</option>
                  </select>
                </div>
              )}

              {/* Employer Type */}
              {!isLogin && role === "employer" && (
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-700">Employer Type</label>
                  <select
                    value={employerType}
                    onChange={(e) => setEmployerType(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="company">Company</option>
                    <option value="agency">Agency</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>
              )}

              {/* Country Selection */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-700">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">-- Select Your Country --</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password */}
              <div className="relative">
                <label className="block text-xs font-medium mb-2 text-gray-700">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-500 hover:text-blue-600 transition text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Confirm Password */}
              {!isLogin && (
                <div className="relative">
                  <label className="block text-xs font-medium mb-2 text-gray-700">Confirm Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-8 text-gray-500 hover:text-blue-600 transition text-sm"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-center text-xs font-medium">{error}</p>}
              {resetMessage && <p className="text-green-500 text-center text-xs font-medium">{resetMessage}</p>}

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.02] shadow-md"
              >
                {isLogin ? "Log In" : "Create Account"}
              </button>
            </form>

            {isLogin && (
              <p className="mt-4 text-center text-xs text-gray-600">
                <button onClick={handlePasswordReset} className="text-blue-600 hover:text-blue-700 font-medium transition">
                  Forgot Password?
                </button>
              </p>
            )}

            <p className="mt-4 text-center text-xs text-gray-600 border-t border-gray-200 pt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>

            <div className="mt-4 text-center">
              <button
                onClick={handleBrowseAsGuest}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium transition"
              >
                ← Continue browsing as guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}