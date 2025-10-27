"use client";

import React from "react";
import { X, ExternalLink } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

type AdPlacement = {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'image' | 'video';
  link?: string;
};

type Props = {
  ad: AdPlacement;
  onClose: () => void;
};

export default function AdModal({ ad, onClose }: Props) {
  const { darkMode } = useTheme();

  // Text color utilities for consistent theming
  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-200" : "text-gray-700";

  const handleLearnMore = () => {
    window.open(ad.link || '#', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative ${
          darkMode ? "bg-gradient-to-br from-blue-700 via-purple-600 to-purple-800" : "bg-white"  // LIGHTER: More vibrant purple
        }`}
      >
        <button
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
            darkMode 
              ? "bg-purple-500 text-white hover:bg-purple-600" 
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ad Image/Video */}
        <div className="w-full h-64 bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          {ad.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center">
              <video 
                className="w-full h-full object-cover"
                controls
                autoPlay
                poster={ad.image}
              >
                <source src={ad.image} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : ad.image ? (
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`text-center ${textSecondary}`}>
              <div className="text-6xl mb-4">📢</div>
              <p className="text-lg">Sponsored Content</p>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Ad Badge */}
          <div className="inline-flex items-center px-3 py-1 bg-yellow-500 text-black text-sm font-semibold rounded-full mb-4">
            ADVERTISEMENT
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold mb-4 ${textPrimary}`}>
            {ad.title}
          </h2>

          {/* Description */}
          <div className="mb-6">
            <h3 className={`font-semibold text-lg mb-3 ${textSecondary}`}>
              About This Ad
            </h3>
            <p className={`text-lg leading-relaxed ${textSecondary}`}>
              {ad.description}
            </p>
          </div>

          {/* Additional Information */}
          <div className={`p-4 rounded-lg mb-6 ${
            darkMode ? "bg-purple-500/30" : "bg-gray-100"
          }`}>
            <p className={`text-sm ${textSecondary}`}>
              <strong className={textPrimary}>Note:</strong> This is a sponsored advertisement. Clicking "Learn More" will take you to the advertiser's website.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-purple-500 dark:border-purple-500">
            <button
              onClick={handleLearnMore}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition text-lg"
            >
              <ExternalLink className="w-5 h-5" />
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}