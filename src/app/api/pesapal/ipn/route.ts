// src/app/api/pesapal/ipn/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ BASE URL ONLY — NEVER /api
const PESAPAL_BASE_URL = process.env.PESAPAL_API_URL!.replace(/\/api\/?$/, '');
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;

// =========================
// AUTH
// =========================
async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
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
    const err = await res.text();
    throw new Error(`Pesapal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.token;
}

// =========================
// IPN HANDLER
// =========================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderTrackingId = body?.OrderTrackingId;
    const merchantReference = body?.OrderMerchantReference;

    if (!orderTrackingId || !merchantReference) {
      return NextResponse.json({ error: 'Invalid IPN payload' }, { status: 400 });
    }

    const token = await getPesapalToken();

    const statusRes = await fetch(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    const statusData = await statusRes.json();

    if (statusData.payment_status_description !== 'Completed') {
      return NextResponse.json({ success: true, ignored: true });
    }

    // Merchant reference format:
    // NGUVU-VERIFICATION-UUID
    // NGUVU-BOOST-UUID
    const [, type] = merchantReference.split('-');

    if (type === 'VERIFICATION') {
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('verification_reference', merchantReference);
    }

    if (type === 'BOOST') {
      await supabase
        .from('posts')
        .update({
          is_boosted: true,
          boost_expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('boost_reference', merchantReference);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('IPN error:', err);
    return NextResponse.json(
      { error: err.message || 'IPN failure' },
      { status: 500 }
    );
  }
}
