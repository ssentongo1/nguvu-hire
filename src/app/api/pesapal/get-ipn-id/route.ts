import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const PESAPAL_BASE_URL = process.env.PESAPAL_API_URL!
    const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!
    const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!

    // 1️⃣ Authenticate with Pesapal
    const authRes = await fetch(`${PESAPAL_BASE_URL}/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
      }),
    })

    if (!authRes.ok) {
      const text = await authRes.text()
      return NextResponse.json(
        { error: 'Failed to authenticate', authData: text },
        { status: 500 }
      )
    }

    const authData = await authRes.json()

    if (!authData.token) {
      return NextResponse.json(
        { error: 'Authentication failed, no token returned', authData },
        { status: 500 }
      )
    }

    // 2️⃣ Fetch registered IPNs
    const ipnRes = await fetch(`${PESAPAL_BASE_URL}/URLSetup/GetIpnList`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authData.token}`,
      },
    })

    if (!ipnRes.ok) {
      const text = await ipnRes.text()
      return NextResponse.json(
        { error: 'Failed to fetch IPN list', ipnData: text },
        { status: 500 }
      )
    }

    const ipnData = await ipnRes.json()

    return NextResponse.json({
      success: true,
      ipns: ipnData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
