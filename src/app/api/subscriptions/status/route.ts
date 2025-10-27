import { supabaseServer } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = supabaseServer
    
    console.log('Fetching subscription status...')
    
    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('No user found, returning null data')
      return NextResponse.json({ 
        subscription: null, 
        credits: { credits_available: 0, credits_used: 0 }
      })
    }

    console.log('User found:', user.id)

    // Get user's active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Get user's boost credits (create if doesn't exist)
    let { data: credits } = await supabase
      .from('user_boost_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no credits record exists, create one with free plan defaults
    if (!credits) {
      console.log('Creating new credits record for user:', user.id)
      const { data: newCredits, error: insertError } = await supabase
        .from('user_boost_credits')
        .insert({
          user_id: user.id,
          credits_available: 1, // Free plan default
          credits_used: 0
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating credits record:', insertError)
      } else {
        credits = newCredits
      }
    }

    console.log('Subscription data:', { 
      hasSubscription: !!subscription,
      creditsAvailable: credits?.credits_available 
    })
    
    return NextResponse.json({
      subscription: subscription || null,
      credits: credits || { credits_available: 1, credits_used: 0 }
    })
    
  } catch (error: unknown) {
    console.error('Error fetching subscription status:', error)
    
    let errorMessage = 'Failed to fetch subscription status'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}