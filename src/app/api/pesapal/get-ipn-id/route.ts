import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 1. Get access token
    const authRes = await fetch(
      `${process.env.PESAPAL_API_URL}/api/Auth/RequestToken`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consumer_key: process.env.PESAPAL_CONSUMER_KEY,
          consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
        })
      }
    )

    const authData = await authRes.json()

    if (!authRes.ok || !authData.token) {
      return NextResponse.json(
        { error: 'Failed to authenticate', authData },
        { status: 500 }
      )
    }

    // 2. Fetch IPN list
    const ipnRes = await fetch(
      `${process.env.PESAPAL_API_URL}/api/URLSetup/GetIpnList`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authData.token}`
        }
      }
    )

    const ipnData = await ipnRes.json()

    return NextResponse.json({
      success: true,
      ipns: ipnData
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
