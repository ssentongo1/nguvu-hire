// src/app/api/pesapal/ipn/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PESAPAL_API_URL = process.env.PESAPAL_API_URL!;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;

// -------------------------------
// Helper: Get Pesapal Token
// -------------------------------
async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_API_URL}/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Pesapal auth failed: ${errorText}`);
  }

  const data = await res.json();

  if (!data.token) {
    throw new Error(`Authentication failed, no token returned: ${JSON.stringify(data)}`);
  }

  return data.token;
}

// -------------------------------
// IPN POST Handler
// -------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderTrackingId = body?.OrderTrackingId;
    const merchantReference = body?.OrderMerchantReference;

    if (!orderTrackingId || !merchantReference) {
      return NextResponse.json({ error: 'Invalid IPN payload' }, { status: 400 });
    }

    // 1️⃣ Get Pesapal token
    const token = await getPesapalToken();

    // 2️⃣ Check payment status
    const statusRes = await fetch(
      `${PESAPAL_API_URL}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!statusRes.ok) {
      const errorText = await statusRes.text();
      throw new Error(`Failed to fetch payment status: ${errorText}`);
    }

    const statusData = await statusRes.json();

    if (statusData.payment_status_description !== 'Completed') {
      return NextResponse.json({ success: true, ignored: true });
    }

    // 3️⃣ Process merchant reference
    // Example: NGUVU-VERIFICATION-UUID or NGUVU-BOOST-UUID
    const [, type] = merchantReference.split('-');

    if (type === 'VERIFICATION') {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('verification_reference', merchantReference);

      if (error) console.error('Supabase update error (verification):', error);
    }

    if (type === 'BOOST') {
      const { error } = await supabase
        .from('posts')
        .update({
          is_boosted: true,
          boost_expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('boost_reference', merchantReference);

      if (error) console.error('Supabase update error (boost):', error);
    }

    // 4️⃣ Respond to Pesapal
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('IPN error:', err);
    return NextResponse.json(
      { error: err.message || 'IPN processing failed' },
      { status: 500 }
    );
  }
}
