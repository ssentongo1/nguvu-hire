import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.PESAPAL_API_URL!;
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY!;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET!;

    // 1️⃣ Authenticate
    const authRes = await fetch(`${baseUrl}/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    });

    const authData = await authRes.json();

    if (!authRes.ok || !authData.token) {
      return NextResponse.json(
        { error: 'Failed to authenticate', authData },
        { status: 500 }
      );
    }

    // 2️⃣ Get registered IPNs
    const ipnRes = await fetch(`${baseUrl}/URLSetup/GetIpnList`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
    });

    const ipnData = await ipnRes.json();

    return NextResponse.json({
      success: true,
      ipns: ipnData,
    });
  } catch (error: any) {
    console.error('Get IPN ID error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch IPNs' },
      { status: 500 }
    );
  }
}
