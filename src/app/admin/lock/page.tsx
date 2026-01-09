"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { Eye, EyeOff, Lock } from "lucide-react"; 

export default function AdminLockPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { darkMode } = useTheme();

  
  const ADMIN_PASSWORD = "0751101662.Com"; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    
    if (password === ADMIN_PASSWORD) {
      
      sessionStorage.setItem("admin_authenticated", "true");
      router.push("/admin");
    } else {
      setError("Invalid password. Please try again.");
    }
    setLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      darkMode 
        ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" 
        : "bg-gray-50 text-gray-900"
    }`}>
      <div className={`max-w-md w-full rounded-xl p-8 shadow-2xl ${
        darkMode ? "bg-white/5 backdrop-blur-sm" : "bg-white"
      }`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <Lock className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Enter the admin password to continue to the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-gray-200" : "text-gray-700"
            }`}>
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Enter admin password..."
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              darkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
            }`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              loading || !password
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Access Admin Dashboard
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            🔐 Protected Admin Area • Unauthorized access is prohibited
          </p>
        </div>
      </div>
    </div>
  );
}