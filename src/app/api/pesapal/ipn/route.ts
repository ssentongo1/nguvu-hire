import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PESAPAL_BASE_URL = process.env.PESAPAL_API_URL!
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!

// Get Pesapal OAuth token
async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE_URL}/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pesapal auth failed: ${text}`)
  }

  const data = await res.json()
  if (!data.token) throw new Error('No token received from Pesapal')
  return data.token
}

// IPN endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const orderTrackingId = body?.OrderTrackingId
    const merchantReference = body?.OrderMerchantReference

    if (!orderTrackingId || !merchantReference) {
      return NextResponse.json({ error: 'Invalid IPN payload' }, { status: 400 })
    }

    // 1️⃣ Get Pesapal token
    const token = await getPesapalToken()

    // 2️⃣ Get payment status
    const statusRes = await fetch(
      `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }
    )

    if (!statusRes.ok) {
      const text = await statusRes.text()
      throw new Error(`Failed to fetch transaction status: ${text}`)
    }

    const statusData = await statusRes.json()

    if (statusData.payment_status_description !== 'Completed') {
      return NextResponse.json({ success: true, ignored: true })
    }

    // 3️⃣ Update Supabase records
    const [, type] = merchantReference.split('-')

    if (type === 'VERIFICATION') {
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('verification_reference', merchantReference)
    }

    if (type === 'BOOST') {
      await supabase
        .from('posts')
        .update({
          is_boosted: true,
          boost_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('boost_reference', merchantReference)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('IPN error:', err)
    return NextResponse.json({ error: err.message || 'IPN failure' }, { status: 500 })
  }
}
