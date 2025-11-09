'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PricingCard from '@/components/PricingCard'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number | null
  boost_credits: number
  max_boost_duration: number
  features: string[]
  is_active: boolean
  created_at: string
}

// Create a separate component that uses useSearchParams
function PricingContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') as 'job_seeker' | 'employer' || 'job_seeker'

  useEffect(() => {
    const demoPlans = createDemoPlans(userType)
    setPlans(demoPlans)
    setLoading(false)
  }, [userType])

  const createDemoPlans = (type: 'job_seeker' | 'employer'): SubscriptionPlan[] => {
    if (type === 'job_seeker') {
      return [
        {
          id: 'free',
          name: 'Starter',
          description: 'Perfect for getting started',
          price_monthly: 0,
          price_yearly: 0,
          boost_credits: 1,
          max_boost_duration: 3,
          features: [
            'Basic profile visibility',
            'Apply to 10 jobs per month',
            'Standard search ranking',
            'Email support',
            'Resume upload',
            'Job alerts'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'pro',
          name: 'Pro Candidate',
          description: 'Get noticed by top employers',
          price_monthly: 19,
          price_yearly: 190,
          boost_credits: 5,
          max_boost_duration: 7,
          features: [
            'Priority profile ranking',
            'Unlimited job applications',
            '5 boost credits monthly',
            '7-day boost duration',
            'Advanced analytics',
            'Direct employer messaging',
            'Resume review tools',
            'Priority support'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'business',
          name: 'Elite Candidate',
          description: 'Maximum visibility and opportunities',
          price_monthly: 49,
          price_yearly: 490,
          boost_credits: 15,
          max_boost_duration: 14,
          features: [
            'Top-tier profile ranking',
            'Unlimited job applications',
            '15 boost credits monthly',
            '14-day boost duration',
            'Featured candidate status',
            'Direct recruiter access',
            'Career coaching session',
            'Interview preparation tools',
            'Salary negotiation guidance',
            '24/7 premium support'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
    } else {
      // EMPLOYER PLANS - Completely different from job seeker plans
      return [
        {
          id: 'free',
          name: 'Starter Employer',
          description: 'Basic hiring for small teams',
          price_monthly: 0,
          price_yearly: 0,
          boost_credits: 1,
          max_boost_duration: 3,
          features: [
            'Post 1 job at a time',
            'Basic candidate search',
            'Up to 50 applications per job',
            'Standard job visibility',
            'Email support',
            'Basic analytics'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'pro',
          name: 'Pro Employer',
          description: 'Advanced hiring for growing companies',
          price_monthly: 99,
          price_yearly: 990,
          boost_credits: 5,
          max_boost_duration: 7,
          features: [
            'Post up to 5 jobs simultaneously',
            'Advanced candidate filtering',
            'Unlimited applications',
            '5 boost credits monthly',
            '7-day boost duration',
            'AI-powered candidate matching',
            'Advanced analytics dashboard',
            'Branded career page',
            'Priority support',
            'Custom screening questions'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'business',
          name: 'Enterprise',
          description: 'Complete hiring solution for large organizations',
          price_monthly: 299,
          price_yearly: 2990,
          boost_credits: 20,
          max_boost_duration: 14,
          features: [
            'Unlimited job posts',
            '20 boost credits monthly',
            '14-day boost duration',
            'Premium job visibility',
            'AI candidate ranking',
            'Advanced analytics & reporting',
            'Dedicated account manager',
            'Custom integration support',
            'Team collaboration tools',
            'White-label options',
            'API access',
            '24/7 phone support'
          ],
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
    }
  }

  const getPageTitle = () => {
    if (userType === 'job_seeker') {
      return "Get Hired Faster with Boost"
    } else {
      return "Hire Top Talent Faster with Boost"
    }
  }

  const getPageDescription = () => {
    if (userType === 'job_seeker') {
      return "Boost your profile to stand out to employers and get more interview opportunities"
    } else {
      return "Boost your job posts to reach qualified candidates faster and fill positions efficiently"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            {getPageDescription()}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              userType={userType}
              isFeatured={index === 1}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">✓</div>
              <h3 className="font-semibold text-sm text-gray-900">No Hidden Fees</h3>
              <p className="text-gray-600 text-xs mt-1">Clear pricing with no surprises</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">🔄</div>
              <h3 className="font-semibold text-sm text-gray-900">Cancel Anytime</h3>
              <p className="text-gray-600 text-xs mt-1">No long-term contracts required</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">💳</div>
              <h3 className="font-semibold text-sm text-gray-900">Secure Payment</h3>
              <p className="text-gray-600 text-xs mt-1">Your data is always protected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading pricing...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}