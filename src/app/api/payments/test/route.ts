import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Payment API is working',
    endpoints: {
      submit: 'POST /api/payments/submit',
      callback: 'GET /api/payments/callback',
      ipn: 'GET /api/pesapal/ipn'
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}