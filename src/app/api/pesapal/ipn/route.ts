import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PESAPAL_API_URL = process.env.PESAPAL_API_URL!;
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderTrackingId = body?.OrderTrackingId;
    const merchantReference = body?.OrderMerchantReference;

    if (!orderTrackingId || !merchantReference) {
      console.error("IPN missing parameters", body);
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1️⃣ Get token
    const token = await getPesapalToken();

    // 2️⃣ Verify payment status
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
    const paymentStatus = statusData.payment_status;

    console.log("IPN received:", {
      merchantReference,
      orderTrackingId,
      paymentStatus,
      statusData,
    });

    if (paymentStatus !== "COMPLETED") {
      // ignore failed / pending payments
      return NextResponse.json({ success: false, message: "Payment not completed" });
    }

    // 3️⃣ Parse merchantReference to know type
    // Example format: NGUVU-VERIFICATION-UUID or NGUVU-BOOST-UUID
    const [prefix, type] = merchantReference.split("-").slice(0, 2);

    if (type === "VERIFICATION") {
      // Update Supabase user verified status
      const { data, error } = await supabase
        .from("users")
        .update({ is_verified: true })
        .eq("verification_reference", merchantReference);

      if (error) {
        console.error("Supabase user update error:", error);
      } else {
        console.log("User verified:", data);
      }
    } else if (type === "BOOST") {
      // Update Supabase post boost status
      const { data, error } = await supabase
        .from("posts")
        .update({
          is_boosted: true,
          boost_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
        })
        .eq("boost_reference", merchantReference);

      if (error) {
        console.error("Supabase post boost update error:", error);
      } else {
        console.log("Post boosted:", data);
      }
    }

    // 4️⃣ Respond with 200 OK for Pesapal
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("IPN processing error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
