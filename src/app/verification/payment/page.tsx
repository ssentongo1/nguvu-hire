"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Shield, CheckCircle, Lock, ArrowLeft } from "lucide-react";

// Stripe would be integrated here - using mock for now
const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'paypal', name: 'PayPal', icon: '🔵' },
  { id: 'momo', name: 'Mobile Money', icon: '📱' },
];

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useTheme();
  
  const [plan, setPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const planDetails = {
    basic_verification: {
      name: 'Basic Verification',
      price: 9.99,
      duration: '12 months'
    },
    premium_verification: {
      name: 'Premium Verification',
      price: 19.99,
      duration: '24 months'
    }
  };

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (!planParam || !['basic_verification', 'premium_verification'].includes(planParam)) {
      router.push('/pricing?verify=true');
      return;
    }
    setPlan(planParam);

    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/?auth=signup');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
        
        // Check if user is already verified
        if (profile.is_verified) {
          alert('You are already verified!');
          router.push('/profile');
        }
      }
    };

    getCurrentUser();
  }, [router, searchParams]);

  const handlePayment = async () => {
    if (!user || !plan) return;

    setProcessing(true);

    try {
      // 1. Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('verification_payments')
        .insert({
          user_id: user.id,
          amount: planDetails[plan as keyof typeof planDetails].price,
          payment_method: selectedMethod,
          status: 'completed' // In real app, this would be pending until Stripe confirms
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Create verification request (FIXED: This was missing)
      const { data: verificationRequest, error: requestError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          payment_id: payment.id,
          status: 'pending' // Wait for documents to be submitted
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 3. Send notification to admin (FIXED: This was missing)
      await sendAdminNotification(verificationRequest.id, profile);

      // 4. Redirect to document upload
      router.push(`/verification/documents?request=${verificationRequest.id}`);

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // NEW FUNCTION: Send notification to admin when verification request is created
  const sendAdminNotification = async (requestId: string, userProfile: any) => {
    try {
      // Get admin users (users with role 'admin')
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0) {
        const adminUserId = adminUsers[0].id;
        const userName = userProfile.role === 'employer' 
          ? userProfile.company_name || `${userProfile.first_name} ${userProfile.last_name}`
          : `${userProfile.first_name} ${userProfile.last_name}`;

        await supabase
          .from('notifications')
          .insert({
            user_id: adminUserId,
            title: '📋 New Verification Payment Received',
            message: `${userName} has paid for ${planDetails[plan as keyof typeof planDetails].name} and needs to submit documents.`,
            type: 'verification_payment_received',
            related_id: requestId,
            is_read: false,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't block the flow if notification fails
    }
  };

  if (!plan) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={darkMode ? "text-white" : "text-gray-900"}>Loading...</p>
        </div>
      </div>
    );
  }

  const currentPlan = planDetails[plan as keyof typeof planDetails];

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black" : "bg-gray-50"
    }`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/pricing?verify=true')}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-white/10" : "hover:bg-gray-200"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Complete Verification
            </h1>
            <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
              Final step to get your blue verification badge
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className={`lg:col-span-2 rounded-xl p-6 ${
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
                <span className={darkMode ? "text-white" : "text-gray-900"}>
                  {currentPlan.name}
                </span>
                <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  ${currentPlan.price}
                </span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Valid for {currentPlan.duration} • One-time payment
              </p>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Payment Method
              </h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition ${
                      selectedMethod === method.id
                        ? darkMode 
                          ? "border-blue-500 bg-blue-500/20" 
                          : "border-blue-500 bg-blue-50"
                        : darkMode 
                          ? "border-white/10 hover:border-white/20" 
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="hidden"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <span className={darkMode ? "text-white" : "text-gray-900"}>
                      {method.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Card Details (show only for card payment) */}
            {selectedMethod === 'card' && (
              <div className="mb-6">
                <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Card Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 text-white placeholder-gray-400" 
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 text-white placeholder-gray-400" 
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 text-white placeholder-gray-400" 
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-white/5 border-white/10 text-white placeholder-gray-400" 
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                processing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ${currentPlan.price} Now
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="flex items-center gap-2 mt-4 text-center justify-center">
              <Shield className="w-4 h-4 text-green-500" />
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Your payment is secure and encrypted
              </span>
            </div>
          </div>

          {/* Benefits Sidebar */}
          <div className={`rounded-xl p-6 ${
            darkMode ? "bg-white/10 backdrop-blur-lg" : "bg-white shadow-xl"
          }`}>
            <h3 className={`font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Verification Benefits
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Blue verification badge
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Priority in search results
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Increased trust from users
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Higher response rates
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Valid for {currentPlan.duration}
                </span>
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
          <p className="text-gray-900">Loading payment...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}