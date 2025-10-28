"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"job_seeker" | "employer">("job_seeker");
  const [employerType, setEmployerType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetMessage, setResetMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  // Redirect logged-in users
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) router.push("/dashboard");
      setLoading(false);
    };
    checkSession();
  }, [router]);

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
          // Create default profile with chosen role/employerType
          const response = await fetch("/api/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              role,
              employerType: role === "employer" ? employerType : null,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-100 px-4 py-8">
      {/* Mobile-responsive container */}
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md border border-gray-200 mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">NguvuHire</h1>
          <p className="text-gray-600 text-base sm:text-lg mt-2">Your Gateway to Opportunity</p>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center sm:text-2xl">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
              placeholder="Enter your email"
            />
          </div>

          {/* Role */}
          {!isLogin && (
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">I am a</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "job_seeker" | "employer")}
                className="w-full p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
              >
                <option value="job_seeker">Job Seeker</option>
                <option value="employer">Employer</option>
              </select>
            </div>
          )}

          {/* Employer Type (only if Employer selected) */}
          {!isLogin && role === "employer" && (
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Employer Type</label>
              <select
                value={employerType}
                onChange={(e) => setEmployerType(e.target.value)}
                required
                className="w-full p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
              >
                <option value="">-- Select Type --</option>
                <option value="company">Company</option>
                <option value="agency">Agency</option>
                <option value="recruiter">Recruiter</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>
          )}

          {/* Password */}
          <div className="relative">
            <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12 text-sm sm:text-base"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 sm:top-12 text-gray-500 hover:text-blue-600 transition text-lg"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Confirm Password */}
          {!isLogin && (
            <div className="relative">
              <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12 text-sm sm:text-base"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-10 sm:top-12 text-gray-500 hover:text-blue-600 transition text-lg"
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-center font-medium text-sm sm:text-base">{error}</p>}
          {resetMessage && <p className="text-green-500 text-center font-medium text-sm sm:text-base">{resetMessage}</p>}

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 sm:p-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md min-h-[44px]"
          >
            {isLogin ? "Log In" : "Create Account"}
          </button>
        </form>

        {isLogin && (
          <p className="mt-4 sm:mt-6 text-center text-gray-600 text-sm sm:text-base">
            <button onClick={handlePasswordReset} className="text-blue-600 hover:text-blue-700 font-medium transition">
              Forgot Password?
            </button>
          </p>
        )}

        <p className="mt-4 sm:mt-6 text-center text-gray-600 border-t border-gray-200 pt-4 sm:pt-6 text-sm sm:text-base">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}