import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

interface BoostRequest {
  postId: string
  postType: 'job' | 'availability'
  boostType: string
}

export async function POST(request: Request) {
  try {
    const { postId, postType, boostType = 'standard' }: BoostRequest = await request.json()

    console.log('Boosting post:', { postId, postType, boostType })

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'You must be logged in to boost posts' }, { status: 401 })
    }

    // Verify the post exists and belongs to the user
    let postTable, postField;
    if (postType === 'job') {
      postTable = 'jobs';
      postField = 'id';
    } else {
      postTable = 'availabilities';
      postField = 'id';
    }

    const { data: post, error: postError } = await supabase
      .from(postTable)
      .select('id, created_by')
      .eq(postField, postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only boost your own posts' }, { status: 403 })
    }

    // Check available credits
    const { data: credits } = await supabase
      .from('user_boost_credits')
      .select('credits_available, credits_used')
      .eq('user_id', user.id)
      .single()

    if (!credits || credits.credits_available < 1) {
      return NextResponse.json({ error: 'Insufficient boost credits' }, { status: 400 })
    }

    // Check if post is already boosted and active
    const { data: existingBoost } = await supabase
      .from('boosted_posts')
      .select('*')
      .eq('post_id', postId)
      .eq('is_active', true)
      .single()

    if (existingBoost) {
      return NextResponse.json({ error: 'This post is already boosted' }, { status: 400 })
    }

    // Calculate boost duration
    const boostDuration = {
      standard: 7,
      premium: 14,
      ultra: 30
    }[boostType] || 7

    const boostEnd = new Date()
    boostEnd.setDate(boostEnd.getDate() + boostDuration)

    // Insert boosted post record
    const { error: boostError } = await supabase
      .from('boosted_posts')
      .insert({
        post_id: postId,
        user_id: user.id,
        post_type: postType,
        boost_type: boostType,
        credits_used: 1,
        boost_end: boostEnd.toISOString()
      })

    if (boostError) {
      console.error('Error creating boosted post:', boostError)
      return NextResponse.json({ error: boostError.message }, { status: 500 })
    }

    // Deduct credit
    const { error: updateError } = await supabase
      .from('user_boost_credits')
      .update({
        credits_available: credits.credits_available - 1,
        credits_used: credits.credits_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Post boosted successfully',
      boostEnd: boostEnd.toISOString(),
      creditsRemaining: credits.credits_available - 1
    })

  } catch (error: unknown) {
    console.error('Unexpected error boosting post:', error)
    
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