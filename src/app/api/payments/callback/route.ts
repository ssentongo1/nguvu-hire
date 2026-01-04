// src/app/api/payments/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from Pesapal callback
    const searchParams = request.nextUrl.searchParams;
    const orderTrackingId = searchParams.get('OrderTrackingId');
    const orderMerchantReference = searchParams.get('OrderMerchantReference');

    console.log('🔄 Pesapal callback received:', {
      orderTrackingId,
      orderMerchantReference,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (!orderTrackingId) {
      console.error('Missing OrderTrackingId in callback');
      // Redirect to error page
      return NextResponse.redirect('https://www.nguvuhire.com/payment/error?reason=no_tracking_id');
    }

    // Redirect to payment status page
    const redirectUrl = `https://www.nguvuhire.com/payment/status?trackingId=${orderTrackingId}`;
    console.log('Redirecting to:', redirectUrl);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Error processing payment callback:', error);
    
    // Redirect to error page
    return NextResponse.redirect('https://www.nguvuhire.com/payment/error?reason=callback_error');
  }
}