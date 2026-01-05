import { NextRequest, NextResponse } from "next/server";

const PESAPAL_API_URL = process.env.PESAPAL_API_URL!;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

/**
 * Get Pesapal OAuth Token
 */
async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

/**
 * Pesapal callback handler
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const orderTrackingId = searchParams.get("OrderTrackingId");
    const merchantReference = searchParams.get("OrderMerchantReference");

    if (!orderTrackingId || !merchantReference) {
      return NextResponse.redirect(
        `${BASE_URL}/payment/failed?reason=missing_params`
      );
    }

    // 1️⃣ Get OAuth token
    const token = await getPesapalToken();

    // 2️⃣ Verify transaction status with Pesapal
    const statusRes = await fetch(
      `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const statusData = await statusRes.json();

    if (!statusRes.ok) {
      console.error("Pesapal status error:", statusData);
      return NextResponse.redirect(
        `${BASE_URL}/payment/failed?reason=verification_failed`
      );
    }

    /**
     * Possible payment_status values:
     * COMPLETED
     * FAILED
     * INVALID
     */
    const paymentStatus = statusData.payment_status;

    console.log("Pesapal payment verified:", {
      merchantReference,
      orderTrackingId,
      paymentStatus,
      statusData,
    });

    // 3️⃣ Redirect user based on payment status
    if (paymentStatus === "COMPLETED") {
      return NextResponse.redirect(
        `${BASE_URL}/payment/success?ref=${merchantReference}`
      );
    }

    return NextResponse.redirect(
      `${BASE_URL}/payment/failed?status=${paymentStatus}`
    );
  } catch (err: any) {
    console.error("Callback error:", err);
    return NextResponse.redirect(
      `${BASE_URL}/payment/failed?reason=server_error`
    );
  }
}
