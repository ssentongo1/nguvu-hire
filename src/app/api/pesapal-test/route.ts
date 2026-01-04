import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Pesapal test endpoint',
    purpose: 'Test connection to Pesapal API',
    usage: 'This endpoint can be extended to test actual Pesapal API calls',
    timestamp: new Date().toISOString()
  });
}