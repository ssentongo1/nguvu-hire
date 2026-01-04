import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderTrackingId = searchParams.get('OrderTrackingId');
    
    console.log('🔔 IPN received:', { orderTrackingId });
    
    if (orderTrackingId) {
      // Update payment status
      await supabaseServer
        .from('verification_payments')
        .update({ 
          status: 'ipn_received', 
          updated_at: new Date().toISOString() 
        })
        .eq('pesapal_tracking_id', orderTrackingId);
      
      console.log('✅ Updated payment status for:', orderTrackingId);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'IPN received successfully',
      orderTrackingId 
    });
    
  } catch (error: any) {
    console.error('❌ IPN error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'IPN processing failed',
      message: error.message 
    }, { status: 500 });
  }
}

// Also handle POST requests
export async function POST(request: NextRequest) {
  return await GET(request);
}