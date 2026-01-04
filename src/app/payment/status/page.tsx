// src/app/payment/status/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState('');

  const trackingId = searchParams.get('trackingId');

  useEffect(() => {
    if (!trackingId) {
      setStatus('failed');
      setMessage('No tracking ID provided');
      return;
    }

    // Simulate checking payment status
    // In a real app, you would call your API to check with Pesapal
    const checkPaymentStatus = async () => {
      try {
        // TODO: Call your API to check payment status with Pesapal
        // For now, simulate a successful payment
        setTimeout(() => {
          setStatus('success');
          setMessage('Payment completed successfully! Your verification is being processed.');
          
          // Redirect to dashboard after 5 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 5000);
        }, 2000);
      } catch (error) {
        setStatus('failed');
        setMessage('Error checking payment status');
      }
    };

    checkPaymentStatus();
  }, [trackingId, router]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Payment Successful!',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Payment Failed',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Payment Pending',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: <AlertCircle className="w-16 h-16 text-blue-500 animate-pulse" />,
          title: 'Checking Payment Status',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className={`max-w-md w-full ${config.bgColor} border ${config.borderColor} rounded-2xl p-8 shadow-lg`}>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            {config.icon}
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${config.textColor}`}>
            {config.title}
          </h1>
          
          <p className={`mb-6 ${config.textColor}`}>
            {message || `Tracking ID: ${trackingId}`}
          </p>
          
          {status === 'loading' && (
            <div className="mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Checking with payment provider...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your verification badge will be activated within a few minutes.
              </p>
              <div className="text-sm text-gray-500">
                <p>You will be redirected to dashboard in 5 seconds...</p>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/pricing?verify=true')}
              className="w-full mt-3 text-blue-500 py-2 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Back to Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading payment status...</p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}