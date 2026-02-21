import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Fetching subscription plans...')
    
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly')

    if (error) {
      console.error('Error fetching subscription plans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription plans' },
        { status: 500 }
      )
    }

    console.log('Successfully fetched plans:', plans?.length)
    return NextResponse.json({ plans: plans || [] })
    
  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    
    let errorMessage = 'Internal server error'
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