'use client'

import Link from 'next/link'

interface BoostPromotionBannerProps {
  userType: 'job_seeker' | 'employer'
  postId?: string
}

export default function BoostPromotionBanner({ userType, postId }: BoostPromotionBannerProps) {
  const getPromotionText = () => {
    if (userType === 'job_seeker') {
      return {
        title: "🚀 Get Hired 3x Faster!",
        description: "Boost your profile to appear at the top of employer searches and get more interview requests",
        benefit: "Featured placement • 3x more visibility • Priority in search results"
      }
    } else {
      return {
        title: "🚀 Hire Better Candidates Faster!",
        description: "Boost your job post to reach more qualified applicants and fill positions quicker",
        benefit: "Featured placement • 5x more applications • Top search ranking"
      }
    }
  }

  const promotion = getPromotionText()

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex-1 mb-4 md:mb-0">
          <h3 className="text-xl font-bold mb-2">{promotion.title}</h3>
          <p className="text-purple-100 mb-2">{promotion.description}</p>
          <p className="text-yellow-300 font-semibold text-sm">✨ {promotion.benefit}</p>
        </div>
        <div className="flex space-x-3">
          {/* FIXED: Added userType parameter */}
          <Link
            href={`/pricing?type=${userType}`}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
          >
            View Plans
          </Link>
          {postId && (
            <button
              onClick={() => {
                alert('Boost functionality will be implemented next!')
              }}
              className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors duration-200 whitespace-nowrap"
            >
              Boost Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}