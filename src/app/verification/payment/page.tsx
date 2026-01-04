"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Shield, CheckCircle, Lock, ArrowLeft, Loader2, AlertCircle, CreditCard, Smartphone, ExternalLink } from "lucide-react";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useTheme();
  
  const [plan, setPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState('pesapal');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const planDetails = {
    basic_verification: {
      name: 'Basic Verification',
      price: 9.99,
      duration: '12 months',
      features: [
        'Blue verification badge',
        'Priority in search results',
        'Basic identity verification',
        'Valid for 12 months'
      ]
    },
    premium_verification: {
      name: 'Premium Verification',
      price: 19.99,
      duration: '24 months',
      features: [
        'Premium verification badge',
        'Top priority in search results',
        'Enhanced background check',
        'Featured in verified section',
        'Valid for 24 months',
        'Expedited processing'
      ]
    }
  };

  const paymentMethods = [
    { 
      id: 'pesapal', 
      name: 'Pesapal', 
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Pay with Card, M-Pesa, Airtel Money, T-Kash',
      methods: ['Visa/MasterCard', 'M-Pesa', 'Airtel Money', 'T-Kash']
    },
  ];

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (!planParam || !['basic_verification', 'premium_verification'].includes(planParam)) {
      router.push('/pricing?verify=true');
      return;
    }
    setPlan(planParam);

    const getCurrentUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          setError('Authentication error. Please login again.');
          setIsLoading(false);
          return;
        }
        
        if (!user) {
          router.push('/?auth=signup');
          setIsLoading(false);
          return;
        }
        setUser(user);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          setError('Could not load profile information.');
          setIsLoading(false);
          return;
        }

        if (profile) {
          setProfile(profile);
          
          // Check if user is already verified
          if (profile.is_verified) {
            alert('You are already verified!');
            router.push('/profile');
          }
        }
      } catch (error: any) {
        console.error('Error loading user:', error);
        setError('Failed to load user information.');
      } finally {
        setIsLoading(false);
      }
    };

    getCurrentUser();
  }, [router, searchParams]);

  const handlePesapalPayment = async () => {
    if (!user || !plan || !profile) {
      setError("Please complete your profile information first.");
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);

    try {
      const currentPlan = planDetails[plan as keyof typeof planDetails];
      
      console.log('🚀 Initiating payment for user:', user.id);
      console.log('💰 Amount:', currentPlan.price);
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('🔗 API Endpoint:', '/api/payments/submit');
      
      // Submit payment request to OUR backend API
      const response = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currentPlan.price,
          description: `${currentPlan.name} - Verification`,
          productId: plan,
          type: 'verification',
          userId: user.id,
        }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      let result;
      try {
        result = await response.json();
        console.log('📥 Response data:', result);
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      // Store debug info
      setDebugInfo({
        request: {
          amount: currentPlan.price,
          description: `${currentPlan.name} - Verification`,
          userId: user.id,
        },
        response: {
          status: response.status,
          ok: response.ok,
          data: result
        },
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        
        let errorMessage = 'Payment initiation failed';
        if (result?.error) {
          errorMessage = result.error;
        } else if (result?.details) {
          errorMessage = result.details;
        } else if (response.status === 401) {
          errorMessage = 'Please login to continue';
          router.push('/auth/login');
          return;
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status === 404) {
          errorMessage = 'Payment service not available. Please contact support.';
        }
        
        throw new Error(errorMessage);
      }

      // Check if we have a redirect URL
      if (!result.data?.redirect_url) {
        console.error('❌ No redirect URL in response:', result);
        throw new Error('No payment gateway URL received. Please contact support.');
      }

      // Show success message and redirect
      setSuccess(`Redirecting to secure Pesapal payment page...`);
      
      // Small delay to show success message
      setTimeout(() => {
        console.log('🔗 Redirecting to:', result.data.redirect_url);
        window.location.href = result.data.redirect_url;
      }, 1500);

    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      // Format error message
      let errorMessage = 'Payment failed. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (selectedMethod === 'pesapal') {
      await handlePesapalPayment();
    } else {
      setError(`${selectedMethod} payment method is not yet available. Please use Pesapal.`);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'Not provided';
    // Format Kenyan phone number
    if (phone.startsWith('0')) {
      return `+254${phone.substring(1)}`;
    }
    if (phone.startsWith('254')) {
      return `+${phone}`;
    }
    return phone;
  };

  const testBackendConnection = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/payments/test');
      const data = await response.json();
      alert(`Backend test: ${data.success ? 'SUCCESS' : 'FAILED'}\nMessage: ${data.message}`);
    } catch (error) {
      alert('Backend test failed: ' + error);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={darkMode ? "text-white" : "text-gray-900"}>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className={`text-lg mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Invalid verification plan
          </p>
          <button
            onClick={() => router.push('/pricing?verify=true')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = planDetails[plan as keyof typeof planDetails];

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/pricing?verify=true')}
            className={`p-2 rounded-lg transition ${
              darkMode 
                ? "hover:bg-white/10 text-white" 
                : "hover:bg-gray-200 text-gray-700"
            }`}
            disabled={processing}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Complete Verification Payment
            </h1>
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              Secure payment via Pesapal • Get your blue verification badge
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            darkMode ? "bg-red-500/20 border border-red-500/30" : "bg-red-50 border border-red-200"
          }`}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className={`font-medium ${darkMode ? "text-red-300" : "text-red-600"}`}>
                Payment Error
              </p>
              <p className={`text-sm mt-1 ${darkMode ? "text-red-200" : "text-red-700"}`}>
                {error}
              </p>
              <div className="mt-3 space-y-2">
                <button
                  onClick={testBackendConnection}
                  disabled={processing}
                  className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
                >
                  Test Backend Connection
                </button>
                {error.includes('credentials') && (
                  <p className={`text-xs ${darkMode ? "text-red-300" : "text-red-600"}`}>
                    Tip: Check if Pesapal credentials are configured on Vercel
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            darkMode ? "bg-green-500/20 border border-green-500/30" : "bg-green-50 border border-green-200"
          }`}>
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`font-medium ${darkMode ? "text-green-300" : "text-green-600"}`}>
                Success!
              </p>
              <p className={`text-sm mt-1 ${darkMode ? "text-green-200" : "text-green-700"}`}>
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-800 text-gray-200 rounded-lg text-xs">
            <details>
              <summary className="cursor-pointer font-mono">Debug Information</summary>
              <pre className="mt-2 overflow-auto p-2 bg-gray-900 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Order & Payment */}
          <div className={`lg:col-span-2 space-y-6`}>
            {/* Order Summary */}
            <div className={`rounded-xl p-6 ${
              darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
            }`}>
              <h2 className={`text-lg font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Order Summary
              </h2>

              {/* Plan Details */}
              <div className={`rounded-lg p-4 mb-6 ${
                darkMode ? "bg-white/5" : "bg-gray-50"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {currentPlan.name}
                    </span>
                    <p className={`text-xs mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Valid for {currentPlan.duration} • One-time payment
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      ${currentPlan.price}
                    </span>
                    <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      ≈ KES {Math.round(currentPlan.price * 150)}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              {profile && (
                <div className={`mb-6 p-4 rounded-lg ${
                  darkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"
                }`}>
                  <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Billing Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Name:</span>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {profile.first_name} {profile.last_name}
                      </p>
                    </div>
                    <div>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Email:</span>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {user?.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Phone:</span>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {formatPhoneNumber(profile.phone)}
                      </p>
                    </div>
                    <div>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Location:</span>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {profile.city || 'Nairobi'}, Kenya
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className={`rounded-xl p-6 ${
              darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
            }`}>
              <h2 className={`text-lg font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Payment Method
              </h2>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedMethod === method.id
                        ? darkMode 
                          ? "border-blue-500 bg-blue-500/20" 
                          : "border-blue-500 bg-blue-50"
                        : darkMode 
                          ? "border-white/10" 
                          : "border-gray-200"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="w-4 h-4 text-blue-500"
                        disabled={processing}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            darkMode ? "bg-white/10" : "bg-gray-100"
                          }`}>
                            {method.icon}
                          </div>
                          <div>
                            <span className={`block font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {method.name}
                            </span>
                            <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {method.description}
                            </span>
                          </div>
                        </div>
                        
                        {/* Payment methods icons */}
                        <div className="flex flex-wrap gap-2 mt-3 ml-11">
                          {method.methods?.map((pm, index) => (
                            <span
                              key={index}
                              className={`text-xs px-2 py-1 rounded ${
                                darkMode ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {pm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Payment Instructions */}
              <div className={`mt-6 p-4 rounded-lg ${
                darkMode ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"
              }`}>
                <h4 className={`font-semibold mb-2 ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                  How Payment Works:
                </h4>
                <ol className={`text-sm space-y-2 list-decimal list-inside ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}>
                  <li>Click "Pay Now with Pesapal" button</li>
                  <li>Your request goes to our secure backend</li>
                  <li>We connect to Pesapal and get a payment link</li>
                  <li>You're redirected to Pesapal's secure payment page</li>
                  <li>Choose payment method (Card, M-Pesa, etc.)</li>
                  <li>Complete payment on Pesapal</li>
                  <li>You'll be redirected back to Nguvuhire</li>
                  <li>Your verification is activated immediately</li>
                </ol>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-500/20">
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-xs">
                    All payments are processed securely by Pesapal
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processing || !user || !profile}
                className={`w-full mt-6 py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                  processing || !user || !profile
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : !user || !profile ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay ${currentPlan.price} Now with Pesapal
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Shield className="w-4 h-4 text-green-500" />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Secured by Pesapal • Bank-level encryption • PCI DSS compliant
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Benefits */}
          <div className={`space-y-6`}>
            {/* Plan Benefits */}
            <div className={`rounded-xl p-6 ${
              darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
            }`}>
              <h3 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                {currentPlan.name} Benefits
              </h3>
              <div className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Info */}
            <div className={`rounded-xl p-6 ${
              darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
            }`}>
              <h3 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Need Help?
              </h3>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    For payment issues or questions:
                  </p>
                  <p className={`text-sm font-medium mt-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    📧 support@nguvuhire.com
                  </p>
                  <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                    📞 +254 7XX XXX XXX
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Business hours:
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Mon-Fri: 8:00 AM - 5:00 PM EAT
                  </p>
                </div>
              </div>
            </div>

            {/* Vercel Deployment Notice */}
            <div className={`rounded-xl p-6 ${
              darkMode ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-yellow-50 border border-yellow-200"
            }`}>
              <h3 className={`font-bold mb-2 ${darkMode ? "text-yellow-300" : "text-yellow-800"}`}>
                Deployment Required
              </h3>
              <p className={`text-sm mb-3 ${darkMode ? "text-yellow-200" : "text-yellow-700"}`}>
                This payment system requires your backend to be deployed to Vercel for Pesapal to work properly.
              </p>
              <div className="text-xs space-y-1">
                <p className={darkMode ? "text-yellow-300" : "text-yellow-600"}>✓ Deploy to Vercel</p>
                <p className={darkMode ? "text-yellow-300" : "text-yellow-600"}>✓ Set environment variables</p>
                <p className={darkMode ? "text-yellow-300" : "text-yellow-600"}>✓ Test from live domain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading payment page...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}