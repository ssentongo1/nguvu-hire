import { NextRequest, NextResponse } from "next/server";
import pesapalAPI from "@/utils/pesapal";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  try {
    const { type, amount, userId, postId } = await req.json();

    if (!type || !amount || (type === "verification" && !userId) || (type === "boost" && !postId)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Generate unique reference
    const reference = `NGUVU-${type.toUpperCase()}-${crypto.randomUUID()}`;

    // Save reference in Supabase
    if (type === "verification") {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_payment_id: reference, verification_fee_paid: amount })
        .eq("id", userId);

      if (error) {
        console.error("Supabase profile update error:", error);
        return NextResponse.json({ error: "Failed to store reference" }, { status: 500 });
      }
    } else if (type === "boost") {
      const { error } = await supabase
        .from("posts")
        .update({ boost_reference: reference })
        .eq("id", postId);

      if (error) {
        console.error("Supabase post update error:", error);
        return NextResponse.json({ error: "Failed to store reference" }, { status: 500 });
      }
    }

    // Prepare Pesapal order request
    const paymentRequest = {
      id: reference,
      currency: "USD",
      amount: Number(amount),
      description: type === "verification" ? "Account Verification" : "Post Boost",
      callback_url: PESAPAL_CALLBACK_URL,
      notification_id: "", // ✅ must be string, empty is fine
      billing_address: {
        email_address: "support@nguvuhire.com",
        country_code: "US",
        first_name: "Nguvu",
        last_name: "Hire",
      },
    };

    // Submit order using pesapalAPI wrapper
    const orderData = await pesapalAPI.submitOrder(paymentRequest);

    return NextResponse.json({
      success: true,
      checkoutUrl: orderData.redirect_url,
      reference,
      orderTrackingId: orderData.order_tracking_id,
    });
  } catch (err: any) {
    console.error("Create payment error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
