// src/utils/payments.ts
export async function initiatePayment({
  type,
  amount,
  userId,
  postId,
}: {
  type: "verification" | "boost";
  amount: number;
  userId?: string;
  postId?: string;
}) {
  try {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, userId, postId }),
    });

    const data = await res.json();

    if (!res.ok || !data.checkoutUrl) {
      console.error("Failed to initiate payment:", data);
      throw new Error(data.error || "Payment initiation failed");
    }

    // Redirect user to Pesapal checkout
    window.location.href = data.checkoutUrl;
  } catch (err) {
    console.error("Payment error:", err);
    alert("Failed to initiate payment. Please try again.");
  }
}
