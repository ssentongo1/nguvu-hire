// src/app/api/payments/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pesapalAPI from '@/utils/pesapal';
import { supabaseServer } from '@/utils/supabase/server'; // Use your existing server client

export async function POST(request: NextRequest) {
  try {
    // Get the user from the request (we need to handle auth differently)
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      // In a real app, you would verify the JWT token
      // For now, we'll get user from session or request body
    }
    
    const body = await request.json();
    const { amount, description, productId, type, userId: bodyUserId } = body;

    // For testing, allow userId from body, but in production use JWT
    userId = bodyUserId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!amount || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, description, type' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found', details: profileError?.message },
        { status: 404 }
      );
    }

    // Get user email from auth.users table
    const { data: authUser, error: authError } = await supabaseServer.auth.admin.getUserById(userId);
    
    if (authError || !authUser?.user?.email) {
      console.error('Error fetching user email:', authError);
    }

    // Create payment request
    const paymentRequest = {
      id: orderId,
      currency: 'KES', // Kenyan Shillings
      amount: parseFloat(amount),
      description,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/callback`,
      notification_id: process.env.PESAPAL_IPN_URL || '',
      billing_address: {
        email_address: authUser?.user?.email || profile.email || '',
        phone_number: profile.phone || '',
        country_code: profile.country_code || 'KE',
        first_name: profile.first_name || 'Customer',
        last_name: profile.last_name || 'User',
        line_1: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
      },
    };

    // Submit to Pesapal
    const paymentResponse = await pesapalAPI.submitOrder(paymentRequest);

    // Save to verification_payments table
    const { data: paymentData, error: dbError } = await supabaseServer
      .from('verification_payments')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        payment_method: 'pesapal',
        status: 'pending',
        pesapal_tracking_id: paymentResponse.order_tracking_id,
        order_id: orderId,
        description: description,
        product_id: productId,
        payment_type: type,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue even if database insert fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment initiated successfully',
      data: paymentResponse,
      orderId,
      paymentId: paymentData?.id,
    });

  } catch (error: any) {
    console.error('Error submitting payment:', error);
    
    let errorMessage = 'Failed to initiate payment';
    if (error.message?.includes('credentials')) {
      errorMessage = 'Pesapal credentials not configured. Please check environment variables.';
    } else if (error.message?.includes('consumer')) {
      errorMessage = 'Pesapal configuration error. Please check your API credentials.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    );
  }
}