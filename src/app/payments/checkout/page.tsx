'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface CheckoutParams {
  type: 'boost' | 'verification'
  planId: string
  amount: string
  duration?: string
  userType: 'job_seeker' | 'employer'
  postId?: string
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run if searchParams exist
    if (!searchParams) return

    async function createCheckout() {
      try {
        const typeParam = searchParams.get('type') as 'boost' | 'verification' | null
        const planIdParam = searchParams.get('planId')
        const amountParam = searchParams.get('amount')
        const userTypeParam = searchParams.get('userType') as 'job_seeker' | 'employer' | null
        const durationParam = searchParams.get('duration') || undefined
        const postIdParam = searchParams.get('postId') || undefined

        if (!typeParam || !planIdParam || !amountParam || !userTypeParam) {
          alert('Missing payment parameters. Redirecting home.')
          router.push('/')
          return
        }

        const params: CheckoutParams = {
          type: typeParam,
          planId: planIdParam,
          amount: amountParam,
          duration: durationParam,
          userType: userTypeParam,
          postId: postIdParam,
        }

        const res = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })

        const data = await res.json()

        if (res.ok && data.checkoutUrl) {
          // Redirect user to Pesapal checkout page
          window.location.href = data.checkoutUrl
        } else {
          console.error('Failed to initiate payment:', data)
          alert('Failed to initiate payment. Please try again.')
          router.push('/')
        }
      } catch (err) {
        console.error('Checkout error:', err)
        alert('Unexpected error. Please try again.')
        router.push('/')
      }
    }

    createCheckout()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-gray-700 text-sm">Redirecting to payment...</p>
      </div>
    </div>
  )
}
