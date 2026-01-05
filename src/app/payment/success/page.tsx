'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentSuccessWrapper() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return <PaymentSuccess />
}

function PaymentSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Example: Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-700">Payment Successful!</h1>
        <p className="mt-2 text-gray-700">
          Thank you for your payment. You will be redirected shortly.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Go Home Now
        </button>
      </div>
    </div>
  )
}
