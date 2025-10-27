'use client'

import { useState } from 'react'

interface BoostButtonProps {
  postId: string
  postType: 'job' | 'availability'
  onBoostSuccess?: () => void
}

interface CreditsData {
  credits_available: number
  credits_used: number
}

interface StatusResponse {
  subscription: any
  credits: CreditsData
}

interface BoostResponse {
  success: boolean
  message: string
  boostEnd: string
  creditsRemaining: number
  error?: string
}

export default function BoostButton({ postId, postType, onBoostSuccess }: BoostButtonProps) {
  const [isBoosting, setIsBoosting] = useState(false)

  const handleBoost = async () => {
    setIsBoosting(true)
    try {
      // First check if user is logged in and has credits
      const statusResponse = await fetch('/api/subscriptions/status')
      const statusData: StatusResponse = await statusResponse.json()
      
      if (!statusData.credits || statusData.credits.credits_available < 1) {
        alert('You need boost credits to boost this post. Please upgrade your plan.')
        window.location.href = '/pricing'
        return
      }

      // If user has credits, boost the post
      const boostResponse = await fetch('/api/boosts/boost-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId, 
          postType,
          boostType: 'standard' 
        })
      })

      const boostData: BoostResponse = await boostResponse.json()
      
      if (boostData.success) {
        const boostEndDate = new Date(boostData.boostEnd).toLocaleDateString()
        alert(`🎉 Post boosted successfully! It will be featured until ${boostEndDate}`)
        
        // Call the success callback if provided
        if (onBoostSuccess) {
          onBoostSuccess()
        }
        
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        alert(boostData.error || 'Failed to boost post')
      }
    } catch (error) {
      console.error('Error boosting post:', error)
      alert('Error boosting post. Please try again.')
    } finally {
      setIsBoosting(false)
    }
  }

  return (
    <button
      onClick={handleBoost}
      disabled={isBoosting}
      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
    >
      {isBoosting ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Boosting...
        </>
      ) : (
        <>
          <span>🚀</span>
          Boost Post
        </>
      )}
    </button>
  )
}