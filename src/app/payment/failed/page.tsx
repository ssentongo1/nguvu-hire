// src/app/payment/failed/page.tsx
import Link from "next/link";
import React from "react";

export default function PaymentFailedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
      <h1 className="text-3xl font-bold text-red-700 mb-4">Payment Failed</h1>
      <p className="text-lg text-red-800 mb-6">
        Unfortunately, your payment could not be processed. Please try again.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
