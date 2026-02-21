'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        if (error) {
          console.error('Auth error:', errorDescription)
          router.push('/?error=auth_failed')
          return
        }

        if (accessToken && refreshToken) {
          // Set the session with Supabase
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            router.push('/?error=session_failed')
          } else {
            // Success! Redirect to dashboard
            console.log('Auth successful, redirecting to dashboard')
            router.push('/dashboard')
          }
        } else {
          console.log('No tokens found, redirecting to home')
          router.push('/')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        router.push('/?error=unexpected')
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing sign in...</h1>
        <p>Please wait while we redirect you.</p>
      </div>
    </div>
  )
}