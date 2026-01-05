import React from "react";

interface Props {
  searchParams: { ref?: string };
}

export default function PaymentSuccess({ searchParams }: Props) {
  const ref = searchParams.ref;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-50">
      <h1 className="text-3xl font-bold text-green-700">Payment Successful!</h1>
      <p className="mt-4 text-lg text-green-800">
        {ref
          ? `Reference: ${ref}`
          : "Thank you for your payment. Your account/post has been updated."}
      </p>
      <a
        href="/"
        className="mt-6 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
