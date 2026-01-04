'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shield, CheckCircle, Zap, TrendingUp, Search, Target, Star, Users, Lock, BadgeCheck, Eye, MessageSquare, Clock } from 'lucide-react'

interface BoostPlan {
  id: string
  name: string
  description: string
  price: number
  duration_days: number
  features: string[]
  popular?: boolean
  savings?: string
  type: 'boost'
  buttonText: string
  icon: React.ReactNode
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

function PricingContent() {
  const [activeTab, setActiveTab] = useState<'boost' | 'verification'>('boost')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') as 'job_seeker' | 'employer' || 'job_seeker'
  const verifyParam = searchParams.get('verify')
  const postId = searchParams.get('postId')

  useEffect(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (verifyParam === 'true') {
      setActiveTab('verification')
    }
  }, [verifyParam])

  // Boost Plans - OPTIMIZED PRICING
  const boostPlans: BoostPlan[] = [
    {
      id: 'boost_7days',
      name: 'Starter Boost',
      description: 'Get noticed for a week',
      price: 29,
      duration_days: 7,
      type: 'boost',
      features: [
        'Top position in relevant feeds',
        '2x more views than regular posts',
        'Verified boost badge',
        'Basic performance analytics',
        'Email support',
        '7-day duration'
      ],
      buttonText: 'Start Boosting - $29',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'boost_15days',
      name: 'Popular Boost',
      description: 'Extended visibility with premium features',
      price: 39,
      duration_days: 15,
      type: 'boost',
      popular: true,
      savings: 'Save 35% vs weekly',
      features: [
        'Everything in Starter Boost',
        'Premium position in feeds',
        '3x more views than regular posts',
        'Priority in search results',
        'Advanced analytics dashboard',
        '15-day duration',
        'Performance insights report',
        'Priority email support'
      ],
      buttonText: 'Most Popular - $39',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'boost_30days',
      name: 'Max Boost',
      description: 'Maximum exposure with VIP benefits',
      price: 59,
      duration_days: 30,
      type: 'boost',
      savings: 'Save 48% vs weekly',
      features: [
        'Everything in Popular Boost',
        'Highest priority placement',
        '4x more views than regular posts',
        'Featured in homepage spotlight',
        'Premium analytics + insights',
        '30-day duration',
        'Weekly performance reports',
        'Dedicated support contact',
        'Competitor analysis',
        'Renewal discount (20% off)'
      ],
      buttonText: 'Maximize Reach - $59',
      icon: <Zap className="w-5 h-5" />
    }
  ]

  // Single Lifetime Verification Plan - BETTER PRICING
  const verificationPlan: VerificationPlan = {
    id: 'lifetime_verification',
    name: 'Lifetime Trust Badge',
    description: 'One-time payment • Permanent verified status',
    price: 49,
    duration: 'Lifetime',
    type: 'verification',
    popular: true,
    features: [
      'Permanent blue verification badge',
      'Priority in all search results',
      'Up to 3x more profile views',
      'Enhanced credibility with employers',
      'Featured in "Verified Professionals"',
      'Identity protection & validation',
      'Priority customer support',
      'No monthly fees - one payment',
      'Transferable to future job changes'
    ],
    buttonText: 'Get Verified - $49 Once'
  }

  // Real results statistics
  const boostResults = [
    { icon: <Eye className="w-4 h-4" />, text: 'Boosted posts get 200-400% more views' },
    { icon: <MessageSquare className="w-4 h-4" />, text: '3-5x more messages/interviews' },
    { icon: <Clock className="w-4 h-4" />, text: 'Results start within 24 hours' }
  ]

  const getPageTitle = () => {
    if (activeTab === 'verification') {
      return "Get Verified & Stand Out"
    }
    return "Boost Your Visibility"
  }

  const getPageDescription = () => {
    if (activeTab === 'verification') {
      return "Join trusted professionals with a permanent verification badge"
    }
    return "Get more views, messages, and opportunities with our proven boost system"
  }

  const handleBoostSelect = (plan: BoostPlan) => {
    const params = new URLSearchParams({
      type: 'boost',
      planId: plan.id,
      amount: plan.price.toString(),
      duration: plan.duration_days.toString(),
      userType
    })
    
    if (postId) {
      params.append('postId', postId)
    }
    
    window.location.href = `/payments/checkout?${params.toString()}`
  }

  const handleVerificationSelect = (plan: VerificationPlan) => {
    window.location.href = `/payments/checkout?type=verification&planId=${plan.id}&amount=${plan.price}&userType=${userType}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            <span>Proven Results</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {getPageTitle()}
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            {getPageDescription()}
          </p>
          
          {postId && activeTab === 'boost' && (
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
              <Target className="w-3.5 h-3.5" />
              <span className="font-medium">Boosting specific post</span>
            </div>
          )}
        </div>

        {/* Results Stats - Only for Boost */}
        {activeTab === 'boost' && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {boostResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-blue-500">
                      {result.icon}
                    </div>
                    <span className="text-sm text-gray-700">{result.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="flex rounded-lg bg-white p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('boost')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'boost'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              Boost Posts
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'verification'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Get Verified
            </button>
          </div>
        </div>

        {/* Boost Plans */}
        {activeTab === 'boost' && (
          <div className="mt-6">
            {/* Pricing Comparison */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                  <span>Regular Post</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Boosted Post</span>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-6 md:gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
              {boostPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-xl md:rounded-2xl p-5 md:p-6 transition-all duration-300 hover:scale-[1.01] ${
                    plan.popular
                      ? "border-2 border-blue-500 bg-white shadow-xl" 
                      : "bg-white shadow-md border border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow">
                        RECOMMENDED
                      </span>
                    </div>
                  )}

                  {plan.savings && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                        {plan.savings}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4 md:mb-5">
                    <div className="flex justify-center mb-3">
                      <div className={`p-2.5 md:p-3 rounded-full ${
                        plan.popular ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-blue-100"
                      }`}>
                        <div className={plan.popular ? "text-white" : "text-blue-500"}>
                          {plan.icon}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className={`text-lg md:text-xl font-bold mb-1.5 ${
                      "text-gray-900"
                    }`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs md:text-sm mb-4 text-gray-600`}>
                      {plan.description}
                    </p>
                    
                    <div className="mb-1.5">
                      <span className={`text-3xl md:text-4xl font-bold text-gray-900`}>
                        ${plan.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{plan.duration_days} days • ${(plan.price/plan.duration_days).toFixed(2)}/day</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 md:space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 text-green-500`} />
                        <span className={`text-xs md:text-sm text-gray-700`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleBoostSelect(plan)}
                    className={`w-full py-3 px-4 md:py-3.5 md:px-5 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-[1.01]"
                        : "bg-gray-900 text-white hover:bg-black hover:shadow hover:scale-[1.01]"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Plan */}
        {activeTab === 'verification' && (
          <div className="mt-6">
            {/* Why Get Verified */}
            <div className="mb-8 md:mb-10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Why Professionals Get Verified</h2>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">For Job Seekers:</h3>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Get 3x more interview requests</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Higher salary offers (+15-25%)</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Stand out from hundreds of applicants</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">For Employers:</h3>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Build trust with top talent</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Attract 40% more qualified candidates</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Reduce hiring fraud risk</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Verification Plan Card */}
            <div className="max-w-md mx-auto">
              <div className="relative rounded-xl md:rounded-2xl p-6 md:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow">
                    ONE-TIME PAYMENT
                  </span>
                </div>

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                      <BadgeCheck className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    Lifetime Trust Badge
                  </h3>
                  <p className="text-gray-300 text-sm mb-5">
                    Verified forever • No monthly fees
                  </p>
                  
                  <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold">
                      $49
                    </span>
                    <span className="text-lg ml-2 text-gray-300">
                      one-time
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Equivalent to just $4/month for first year
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {verificationPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-400" />
                      <span className="text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Value Comparison */}
                <div className="mb-6 bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Other platforms:</span>
                    <span className="text-gray-400 line-through">$5-15/month</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold mt-2">
                    <span className="text-white">Nguvu Hire:</span>
                    <span className="text-green-400">$49 once</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleVerificationSelect(verificationPlan)}
                  className="w-full py-3.5 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transition-all duration-200"
                >
                  Get Verified Now - $49 Once
                </button>
                
                <p className="text-center text-xs text-gray-400 mt-3">
                  30-day money-back guarantee if not approved
                </p>
              </div>
            </div>

            {/* Security Assurance */}
            <div className="mt-10 md:mt-12 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Lock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">100% Secure Verification</h3>
                    <p className="text-sm text-gray-600">
                      Your documents are encrypted end-to-end and permanently deleted after verification. 
                      We use bank-level security and never share your personal information with third parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Money-Back Guarantee */}
        <div className="mt-12 md:mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">30-Day Results Guarantee</h3>
                    <p className="text-gray-600 text-sm">
                      If your boosted post doesn't get at least 2x more views than your average post, 
                      we'll credit your account for another boost of equal value.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-10 md:mt-12 max-w-3xl mx-auto">
          <h3 className="text-lg md:text-xl font-bold text-center text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="font-medium text-gray-900 text-sm md:text-base mb-1">How soon will I see results?</h4>
              <p className="text-gray-600 text-xs md:text-sm">
                Boosted posts typically show increased visibility within 2-4 hours. Most users see significant results within the first 24 hours.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="font-medium text-gray-900 text-sm md:text-base mb-1">Can I cancel or get a refund?</h4>
              <p className="text-gray-600 text-xs md:text-sm">
                Boost purchases are non-refundable but come with our 30-day results guarantee. Verification has a 30-day money-back guarantee if not approved.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="font-medium text-gray-900 text-sm md:text-base mb-1">How does the verification process work?</h4>
              <p className="text-gray-600 text-xs md:text-sm">
                After payment, you'll upload a government ID. Our team verifies it within 24-48 hours. Once approved, your verified badge appears immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}