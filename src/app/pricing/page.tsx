'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PricingCard from '@/components/PricingCard'
import { Crown, Shield, CheckCircle, Zap } from 'lucide-react'

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

interface VerificationPlan {
  id: string
  name: string
  description: string
  price: number
  duration: string
  features: string[]
  popular?: boolean
  type: 'verification'
  buttonText: string
}

// Create a separate component that uses useSearchParams
function PricingContent() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [activeTab, setActiveTab] = useState<'boost' | 'verification'>('boost')
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') as 'job_seeker' | 'employer' || 'job_seeker'
  const verifyParam = searchParams.get('verify')

  useEffect(() => {
    const demoPlans = createDemoPlans(userType)
    setPlans(demoPlans)
    setLoading(false)
  }, [userType])

  useEffect(() => {
    if (verifyParam === 'true') {
      setActiveTab('verification')
    }
  }, [verifyParam])

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

  // Verification plans (same for both user types)
  const verificationPlans: VerificationPlan[] = [
    {
      id: 'basic_verification',
      name: 'Basic Verification',
      description: 'Get verified with basic identity check',
      price: userType === 'employer' ? 14.99 : 9.99,
      duration: '12 months',
      type: 'verification',
      features: [
        'Blue verification badge',
        'Priority in search results',
        'Increased trust and credibility',
        'Basic identity verification',
        'Valid for 12 months',
        'Standard processing (3-5 days)'
      ],
      buttonText: 'Get Verified'
    },
    {
      id: 'premium_verification',
      name: 'Premium Verification',
      description: 'Enhanced verification with background check',
      price: userType === 'employer' ? 29.99 : 19.99,
      duration: '24 months',
      type: 'verification',
      popular: true,
      features: [
        'Everything in Basic',
        'Enhanced background check',
        'Featured in verified section',
        'Priority customer support',
        'Advanced trust indicators',
        'Valid for 24 months',
        'Expedited processing (1-2 days)',
        'Verification badge animation'
      ],
      buttonText: 'Get Premium Verified'
    }
  ]

  const getPageTitle = () => {
    if (activeTab === 'verification') {
      return "Get Verified & Build Trust"
    }
    if (userType === 'job_seeker') {
      return "Get Hired Faster with Boost"
    } else {
      return "Hire Top Talent Faster with Boost"
    }
  }

  const getPageDescription = () => {
    if (activeTab === 'verification') {
      return "Verify your profile to build trust with other users and get priority visibility in search results"
    }
    if (userType === 'job_seeker') {
      return "Boost your profile to stand out to employers and get more interview opportunities"
    } else {
      return "Boost your job posts to reach qualified candidates faster and fill positions efficiently"
    }
  }

  const handleVerificationSelect = (plan: VerificationPlan) => {
    // Redirect to verification payment page
    window.location.href = `/verification/payment?plan=${plan.id}&type=${userType}`
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {getPageTitle()}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {getPageDescription()}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mt-8">
          <div className="flex rounded-lg bg-white p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition ${
                activeTab === 'boost'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              Boost Posts
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition ${
                activeTab === 'verification'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Get Verified
            </button>
          </div>
        </div>

        {/* Boost Plans */}
        {activeTab === 'boost' && (
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
        )}

        {/* Verification Plans */}
        {activeTab === 'verification' && (
          <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:max-w-4xl mx-auto">
            {verificationPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 ring-2 ring-purple-400 text-white" 
                    : "bg-white shadow-xl border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-bold bg-yellow-400 text-black">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.popular 
                        ? "bg-white/20" 
                        : "bg-blue-100"
                    }`}>
                      <Shield className={`w-8 h-8 ${
                        plan.popular ? "text-white" : "text-blue-500"
                      }`} />
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-2 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    plan.popular ? "text-blue-100" : "text-gray-600"
                  }`}>
                    {plan.description}
                  </p>
                  
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${
                      plan.popular ? "text-white" : "text-gray-900"
                    }`}>
                      ${plan.price}
                    </span>
                    <span className={`text-sm ml-1 ${
                      plan.popular ? "text-blue-100" : "text-gray-600"
                    }`}>
                      one-time
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                        plan.popular ? "text-green-300" : "text-green-500"
                      }`} />
                      <span className={`text-sm ${
                        plan.popular ? "text-white" : "text-gray-700"
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleVerificationSelect(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? "bg-white text-blue-600 hover:bg-gray-100 hover:scale-105"
                      : "bg-blue-500 text-white hover:bg-blue-600 hover:scale-105"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Features Grid */}
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

        {/* Additional Info for Verification */}
        {activeTab === 'verification' && (
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">How Verification Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">1</div>
                  <p>Select Plan & Pay</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">2</div>
                  <p>Upload Documents</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">3</div>
                  <p>Manual Review</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">4</div>
                  <p>Get Verified Badge</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Verification typically takes 1-3 business days. All documents are securely encrypted and deleted after verification.
              </p>
            </div>
          </div>
        )}
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