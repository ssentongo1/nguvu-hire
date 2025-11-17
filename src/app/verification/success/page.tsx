"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { CheckCircle, Shield, Mail, Clock } from "lucide-react";

export default function VerificationSuccessPage() {
  const router = useRouter();
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
    }`}>
      <div className={`max-w-md w-full rounded-2xl p-8 text-center ${
        darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
      }`}>
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            darkMode ? "bg-green-500/20" : "bg-green-100"
          }`}>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
          Verification Submitted!
        </h1>
        
        <p className={`mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Your verification request has been submitted successfully and is now under review.
        </p>

        {/* Next Steps */}
        <div className={`rounded-lg p-4 mb-6 ${
          darkMode ? "bg-white/5" : "bg-gray-50"
        }`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            What happens next?
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Our team will review your documents
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                You'll receive an email notification
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Get your blue verification badge
              </span>
            </div>
          </div>
        </div>

        {/* Processing Time - UPDATED to show 3-5 days */}
        <div className={`mb-6 p-3 rounded-lg ${
          darkMode ? "bg-yellow-500/20" : "bg-yellow-50"
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <p className={`text-sm font-semibold ${darkMode ? "text-yellow-200" : "text-yellow-800"}`}>
              Processing Time: 3-5 Business Days
            </p>
          </div>
          <p className={`text-xs ${darkMode ? "text-yellow-200" : "text-yellow-800"}`}>
            Our team will review your documents and notify you once the verification is complete.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
              darkMode 
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/profile')}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
              darkMode 
                ? "bg-white/10 hover:bg-white/20 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            }`}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}