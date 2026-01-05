// src/app/payment/success/page.tsx
import Link from "next/link";
import React from "react";

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful!</h1>
      <p className="text-lg text-green-800 mb-6">
        Thank you for completing your payment. Your account or post has been updated.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Return Home
      </Link>
    </div>
  );
}
