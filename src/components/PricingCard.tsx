'use client'

import Link from 'next/link'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  boost_credits: number
  max_boost_duration: number
  features: string[]
}

interface PricingCardProps {
  plan: SubscriptionPlan
  isFeatured?: boolean
  userType: 'job_seeker' | 'employer'
}

export default function PricingCard({ plan, isFeatured = false, userType }: PricingCardProps) {
  const getBenefitText = () => {
    if (userType === 'job_seeker') {
      return "Get seen by top employers and increase your hiring chances"
    } else {
      return "Get more qualified applicants and fill positions faster"
    }
  }

  const getBoostLabel = () => {
    if (userType === 'job_seeker') {
      return "Profile Boost Credits"
    } else {
      return "Job Boost Credits"
    }
  }

  const getDurationLabel = () => {
    if (userType === 'job_seeker') {
      return "days per profile boost"
    } else {
      return "days per job boost"
    }
  }

  const getButtonText = () => {
    if (plan.price_monthly === 0) {
      return "Get Started Free"
    } else if (userType === 'job_seeker') {
      return "Upgrade Now"
    } else {
      return "Get Started"
    }
  }

  const getButtonHref = () => {
    if (plan.price_monthly === 0) {
      return "/dashboard"
    } else {
      return `/pricing?plan=${plan.id}&type=${userType}`
    }
  }

  const getButtonStyles = () => {
    if (plan.price_monthly === 0) {
      return "bg-gray-600 text-white hover:bg-gray-700"
    } else if (isFeatured) {
      return "bg-blue-600 text-white hover:bg-blue-700"
    } else {
      return "bg-blue-600 text-white hover:bg-blue-700"
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
      isFeatured ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      {isFeatured && (
        <div className="bg-blue-500 text-white py-2 text-center">
          <span className="font-semibold">Most Popular</span>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {plan.name}
        </h3>
        <p className="text-gray-600 mb-4">{getBenefitText()}</p>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            ${plan.price_monthly}
          </span>
          <span className="text-gray-600">/month</span>
        </div>

        {/* Boost Credits Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {plan.boost_credits} {getBoostLabel()}
              </p>
              <p className="text-sm text-gray-600">
                {plan.max_boost_duration} {getDurationLabel()}
              </p>
            </div>
            <div className="text-2xl">🚀</div>
          </div>
        </div>

        <ul className="space-y-3 mb-6">
          {Array.isArray(plan.features) ? (
            plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))
          ) : (
            <li className="text-gray-700">No features listed</li>
          )}
        </ul>

        <Link
          href={getButtonHref()}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 block text-center ${getButtonStyles()}`}
        >
          {getButtonText()}
        </Link>
      </div>
    </div>
  )
}