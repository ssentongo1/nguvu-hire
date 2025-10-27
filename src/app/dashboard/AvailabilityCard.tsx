"use client";

import React from "react";
import BoostButton from "@/components/BoostButton";

// Define Availability type locally
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
  boosted_posts?: {
    boost_end: string;
    is_active: boolean;
  }[];
};

type Props = {
  availability: Availability;
  onClick: () => void;
  canDelete: boolean;
  onDelete: () => void;
  onHire?: () => void;
  onViewProfile?: () => void;
  showHireButton?: boolean;
};

export default function AvailabilityCard({ 
  availability, 
  onClick, 
  canDelete, 
  onDelete,
  onHire,
  onViewProfile,
  showHireButton = false 
}: Props) {
  // Check if availability is boosted
  const isBoosted = availability.boosted_posts && availability.boosted_posts.length > 0 && availability.boosted_posts[0]?.is_active;

  return (
    <div
      className={`relative bg-white/10 dark:bg-white/5 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition flex flex-col ${
        isBoosted ? 'ring-2 ring-yellow-400' : ''
      }`}
      onClick={onClick}
    >
      {/* Boosted Badge */}
      {isBoosted && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded z-10 font-semibold flex items-center gap-1">
          <span>🚀</span>
          <span>Boosted</span>
        </div>
      )}

      {availability.cover_image && (
        <img
          src={availability.cover_image}
          alt={availability.desired_job}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg line-clamp-1">{availability.desired_job}</h3>
        <p className="text-sm line-clamp-2">
          {availability.name} • {availability.location}, {availability.country}
        </p>
        
        {/* Skills Preview */}
        {availability.skills && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              Skills: {availability.skills}
            </p>
          </div>
        )}
        
        {/* Bottom row: date + buttons */}
        <div className="mt-auto flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0">
          <span className="text-xs text-gray-400">
            {new Date(availability.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-2 w-full xs:w-auto">
            {/* View Profile Button */}
            <button
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition flex items-center justify-center flex-1 xs:flex-none min-w-[100px]"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewProfile) {
                  onViewProfile(); // Navigate to profile page
                } else {
                  onClick(); // Fallback to original behavior
                }
              }}
            >
              View Profile
            </button>
            
            {/* Hire Button - Only show for employers viewing others' profiles */}
            {showHireButton && onHire && (
              <button
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition flex items-center justify-center flex-1 xs:flex-none min-w-[70px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onHire();
                }}
              >
                Hire
              </button>
            )}
          </div>
        </div>

        {/* Boost Button Section - Only show for post owners */}
        {canDelete && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <BoostButton 
              postId={availability.id} 
              postType="availability"
              onBoostSuccess={() => {
                console.log('Availability boosted successfully!')
              }}
            />
          </div>
        )}
      </div>

      {canDelete && (
        <button
          className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </button>
      )}
    </div>
  );
}