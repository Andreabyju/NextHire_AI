import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

const API_BASE = 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blueAccent/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violetAccent/8 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            <HiSparkles className="text-white text-lg" />
          </div>
          <span className="font-space font-bold text-xl text-white tracking-tight">
            NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white/3 backdrop-blur-xl border border-white/8 rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.5)]">

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="mb-7">
                  <h1 className="text-2xl font-bold font-space text-white mb-1">Forgot Password?</h1>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    No worries. Enter your email and we'll send you a reset link.
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-5"
                    >
                      <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blueAccent-light transition-colors text-lg pointer-events-none" />
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blueAccent/50 focus:ring-1 focus:ring-blueAccent/30 hover:border-white/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white shadow-glow-mixed hover:shadow-glow-violet transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Sending Reset Link...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                </form>

                {/* Back to sign in */}
                <div className="mt-6 text-center">
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    <FiArrowLeft size={14} />
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
                  <FiCheckCircle className="text-emerald-400 text-3xl" />
                </div>
                <h2 className="text-xl font-bold font-space text-white mb-2">Check Your Inbox</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  If an account with <span className="text-white font-medium">{email}</span> exists,
                  we've sent a password reset link. It expires in <strong className="text-white">15 minutes</strong>.
                </p>
                <p className="text-xs text-slate-600 mb-6">
                  Didn't receive it? Check your spam folder or try again.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    id="try-again-btn"
                    onClick={() => { setSuccess(false); setEmail(''); }}
                    className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-300 hover:text-white transition-all duration-200"
                  >
                    Try a Different Email
                  </button>
                  <Link
                    to="/sign-in"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white hover:shadow-glow-mixed transition-all duration-300"
                  >
                    <FiArrowLeft size={14} />
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
