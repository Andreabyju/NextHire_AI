import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCreditCard,
  HiCheck,
  HiShieldCheck,
  HiLockClosed,
} from 'react-icons/hi';
import { mentorApi } from '../../services/mentorApi';

// ==========================================
// LOAD RAZORPAY CHECKOUT SCRIPT
// ==========================================

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () =>
        resolve(true)
      );

      existingScript.addEventListener('error', () =>
        resolve(false)
      );

      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://checkout.razorpay.com/v1/checkout.js';

    script.async = true;

    script.onload = () => resolve(true);

    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

// ==========================================
// SUBSCRIPTION PLANS
// ==========================================

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 499,
    description: 'For smaller recruiting needs',
    features: [
      'View Candidate Profiles',
      'Basic Candidate Search',
      'Resume Score Access',
    ],
  },

  {
    id: 'professional',
    name: 'Professional',
    price: 999,
    description: 'For growing recruitment teams',
    popular: true,
    features: [
      'Full Candidate Access',
      'Advanced AI Filtering',
      'View AI Resume Scores',
      'Candidate Talent Pool',
    ],
  },

  {
    id: 'premium',
    name: 'Premium',
    price: 1499,
    description: 'For high-volume hiring',
    features: [
      'Everything in Professional',
      'Advanced Recruitment Tools',
      'Priority Candidate Access',
      'Premium Recruiter Features',
    ],
  },
];

// ==========================================
// COMPONENT
// ==========================================

export default function MentorSubscription() {
  const [subscription, setSubscription] =
    useState(null);

  const [verificationStatus, setVerificationStatus] =
    useState(null);

  const [candidateAccess, setCandidateAccess] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [processingPlan, setProcessingPlan] =
    useState(null);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  // ==========================================
  // LOAD CURRENT SUBSCRIPTION
  // ==========================================

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError('');

      const data =
        await mentorApi.getSubscription();

      setSubscription(
        data.subscription || null
      );

      setVerificationStatus(
        data.verificationStatus || null
      );

      setCandidateAccess(
        Boolean(data.candidateAccess)
      );
    } catch (err) {
      console.error(
        'Subscription loading error:',
        err
      );

      setError(
        err.message ||
        'Failed to load subscription.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFY PAYMENT ON BACKEND
  // ==========================================

  const verifyPaymentOnBackend = async (paymentResponse, planId) => {
    try {
      setError('');
      setSuccess('');

      const verificationResponse =
        await mentorApi.verifySubscriptionPayment(
          {
            razorpay_order_id:
              paymentResponse.razorpay_order_id,

            razorpay_payment_id:
              paymentResponse.razorpay_payment_id,

            razorpay_signature:
              paymentResponse.razorpay_signature,

            plan: planId,
          }
        );

      setSuccess(
        verificationResponse.message ||
        'Payment verified successfully. Your subscription is now active.'
      );

      await fetchSubscription();

    } catch (verifyError) {
      console.error(
        'Payment verification error:',
        verifyError
      );

      setError(
        verifyError.message ||
        'Payment was received, but verification failed. Please contact support before trying again.'
      );
    } finally {
      setProcessingPlan(null);
    }
  };

  // ==========================================
  // OPEN RAZORPAY CHECKOUT
  // ==========================================

  const handlePurchase = async (plan) => {
    setError('');
    setSuccess('');
    setProcessingPlan(plan.id);

    try {
      // ========================================
      // CHECK VERIFICATION
      // ========================================

      if (
        verificationStatus &&
        verificationStatus !== 'approved'
      ) {
        throw new Error(
          'Your mentor account must be approved by the administrator before purchasing a subscription.'
        );
      }

      // ========================================
      // LOAD RAZORPAY SCRIPT
      // ========================================

      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          'Unable to load Razorpay Checkout. Please check your internet connection and try again.'
        );
      }

      // ========================================
      // CREATE BACKEND ORDER
      // ========================================

      const orderResponse =
        await mentorApi.createSubscriptionOrder(
          plan.id
        );

      const order =
        orderResponse.order;

      const razorpayKeyId =
        orderResponse.razorpayKeyId;

      if (!order?.id) {
        throw new Error(
          'Payment order was not created successfully.'
        );
      }

      if (!razorpayKeyId) {
        throw new Error(
          'Razorpay configuration is missing.'
        );
      }

      // ========================================
      // RAZORPAY CHECKOUT OPTIONS
      // ========================================

      const options = {
        key: razorpayKeyId,

        amount: order.amount,

        currency: order.currency || 'INR',

        name: 'NextHire AI',

        description:
          `${plan.name} Mentor Subscription - 30 Days`,

        order_id: order.id,

        theme: {
          color: '#7c3aed',
        },

        modal: {
          ondismiss: () => {
            setProcessingPlan(null);

            setError(
              'Payment window was closed. No subscription was activated.'
            );
          },
          handleback: false,
        },

        handler: function (paymentResponse) {
          verifyPaymentOnBackend(paymentResponse, plan.id);
        },
      };

      // ========================================
      // OPEN RAZORPAY
      // ========================================

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        'payment.failed',
        (response) => {
          console.error(
            'Razorpay payment failed:',
            response
          );

          setProcessingPlan(null);

          setError(
            response?.error?.description ||
            'Payment failed. Your subscription has not been activated.'
          );
        }
      );

      razorpay.open();

    } catch (err) {
      console.error(
        'Subscription purchase error:',
        err
      );

      setError(
        err.message ||
        'Unable to start the payment process.'
      );

      setProcessingPlan(null);
    }
  };

  // ==========================================
  // LOADING UI
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-24 bg-white/5 rounded-xl border border-white/10" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-pulse h-96 bg-white/5 rounded-2xl border border-white/10" />
          <div className="animate-pulse h-96 bg-white/5 rounded-2xl border border-white/10" />
          <div className="animate-pulse h-96 bg-white/5 rounded-2xl border border-white/10" />
        </div>
      </div>
    );
  }

  const isActive =
    subscription?.status === 'active';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="space-y-8"
    >
      {/* ======================================
          HEADER
          ====================================== */}

      <header>
        <h1 className="text-3xl font-space font-bold text-white">
          Subscription Plan
        </h1>

        <p className="text-slate-400 mt-2">
          Choose a plan to unlock the NextHire AI candidate talent pool.
        </p>
      </header>

      {/* ======================================
          DEVELOPMENT NOTICE
          ====================================== */}

      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
        <strong>Razorpay Test Mode:</strong>{' '}
        This is a development payment environment.
        No real money will be charged.
      </div>

      {/* ======================================
          ERROR
          ====================================== */}

      {error && (
        <motion.div
          initial={{
            opacity: 0,
            y: -5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* ======================================
          SUCCESS
          ====================================== */}

      {success && (
        <motion.div
          initial={{
            opacity: 0,
            y: -5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
        >
          {success}
        </motion.div>
      )}

      {/* ======================================
          CURRENT SUBSCRIPTION
          ====================================== */}

      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">

        <div className="flex gap-4 items-center">

          <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
            <HiOutlineCreditCard className="text-2xl" />
          </div>

          <div>
            <h3 className="text-slate-400 text-sm">
              Current Plan
            </h3>

            <p className="text-2xl font-bold text-white capitalize">
              {subscription?.plan &&
                subscription.plan !== 'none'
                ? subscription.plan
                : 'None'}
            </p>
          </div>

        </div>

        <div className="flex flex-col md:items-end gap-1">

          <div className="flex gap-2 text-sm">

            <span className="text-slate-400">
              Status:
            </span>

            <span
              className={`font-semibold ${subscription?.status ===
                  'active'
                  ? 'text-green-400'
                  : 'text-orange-400'
                }`}
            >
              {(
                subscription?.status ||
                'inactive'
              ).toUpperCase()}
            </span>

          </div>

          {subscription?.startDate && (
            <div className="text-xs text-slate-500">
              Started:{' '}
              {new Date(
                subscription.startDate
              ).toLocaleDateString()}
            </div>
          )}

          {subscription?.expiresAt && (
            <div className="text-xs text-slate-500">
              Expires:{' '}
              {new Date(
                subscription.expiresAt
              ).toLocaleDateString()}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs">
            {candidateAccess ? (
              <>
                <HiShieldCheck className="text-emerald-400" />
                <span className="text-emerald-400">
                  Candidate Access Active
                </span>
              </>
            ) : (
              <>
                <HiLockClosed className="text-orange-400" />
                <span className="text-orange-400">
                  Candidate Access Locked
                </span>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ======================================
          VERIFICATION WARNING
          ====================================== */}

      {verificationStatus &&
        verificationStatus !== 'approved' && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
            Your mentor/company account must be approved by an administrator before you can purchase a subscription.
          </div>
        )}

      {/* ======================================
          PLANS
          ====================================== */}

      <div className="pt-4">

        <div className="text-center mb-8">

          <h2 className="text-xl font-bold text-white">
            Choose Your Plan
          </h2>

          <p className="text-sm text-slate-400 mt-2">
            Select a subscription to access the candidate talent pool.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {plans.map((plan) => {

            const currentPlan =
              subscription?.plan ===
              plan.id;

            const processing =
              processingPlan ===
              plan.id;

            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border transition-all ${currentPlan &&
                    isActive
                    ? 'border-violet-500 bg-violet-500/10'
                    : plan.popular
                      ? 'border-violet-500/50 bg-white/5'
                      : 'border-white/10 bg-white/5'
                  }`}
              >

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-4 py-1 rounded-full font-semibold">
                    MOST POPULAR
                  </div>
                )}

                {currentPlan &&
                  isActive && (
                    <div className="absolute top-0 right-0 bg-violet-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-2xl font-medium">
                      CURRENT PLAN
                    </div>
                  )}

                <h3 className="text-xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                <p className="text-sm text-slate-400 mb-4">
                  {plan.description}
                </p>

                <p className="text-3xl font-bold text-white mb-6">
                  ₹{plan.price.toLocaleString('en-IN')}

                  <span className="text-sm text-slate-400 font-normal">
                    {' '}
                    / 30 days
                  </span>
                </p>

                <ul className="space-y-3 mb-8">

                  {plan.features.map(
                    (feature, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm text-slate-300"
                      >
                        <HiCheck className="text-violet-400 flex-shrink-0 text-lg" />

                        <span>
                          {feature}
                        </span>
                      </li>
                    )
                  )}

                </ul>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePurchase(plan);
                  }}
                  disabled={
                    processingPlan !== null ||
                    (currentPlan && isActive) ||
                    verificationStatus !==
                    'approved'
                  }
                  className="w-full py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {processing
                    ? 'Opening Payment...'
                    : currentPlan &&
                      isActive
                      ? 'Active'
                      : verificationStatus !==
                        'approved'
                        ? 'Awaiting Approval'
                        : `Pay ₹${plan.price.toLocaleString(
                          'en-IN'
                        )}`}
                </button>

              </div>
            );
          })}

        </div>
      </div>

      {/* ======================================
          SECURITY NOTE
          ====================================== */}

      <div className="text-center text-xs text-slate-500 pb-6">
        Payments are securely processed through Razorpay Test Mode.
        Candidate access is activated only after successful server-side payment verification.
      </div>
    </motion.div>
  );
}