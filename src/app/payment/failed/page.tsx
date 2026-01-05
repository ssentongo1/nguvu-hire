import React from "react";

interface Props {
  searchParams: { reason?: string; status?: string };
}

export default function PaymentFailed({ searchParams }: Props) {
  const { reason, status } = searchParams;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-red-50">
      <h1 className="text-3xl font-bold text-red-700">Payment Failed</h1>
      <p className="mt-4 text-lg text-red-800">
        {reason
          ? `Reason: ${reason}`
          : status
          ? `Payment status: ${status}`
          : "There was an error processing your payment."}
      </p>
      <a
        href="/"
        className="mt-6 px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800"
      >
        Go Back
      </a>
    </div>
  );
}
