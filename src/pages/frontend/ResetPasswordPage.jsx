import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { API_BASE } from '../../services/api';


// Password strength meter
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters',     pass: password.length >= 8 },
    { label: 'Contains a number',          pass: /\d/.test(password) },
    { label: 'Contains a letter',          pass: /[a-zA-Z]/.test(password) },
    { label: 'Contains special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const strength = passed <= 1 ? 'Weak' : passed === 2 ? 'Fair' : passed === 3 ? 'Good' : 'Strong';
  const colors   = { Weak: 'bg-red-500', Fair: 'bg-amber-500', Good: 'bg-blue-500', Strong: 'bg-emerald-500' };
  const widths   = { Weak: 'w-1/4', Fair: 'w-2/4', Good: 'w-3/4', Strong: 'w-full' };

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${colors[strength]} ${widths[strength]}`} />
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${
          strength === 'Weak' ? 'text-red-400' : strength === 'Fair' ? 'text-amber-400' : strength === 'Good' ? 'text-blue-400' : 'text-emerald-400'
        }`}>
          {strength}
        </span>
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, pass }) => (
          <div key={label} className={`flex items-center gap-1.5 text-[10px] ${pass ? 'text-emerald-400' : 'text-slate-600'}`}>
            <div className={`w-1 h-1 rounded-full flex-shrink-0 ${pass ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { token }       = useParams();
  const navigate        = useNavigate();

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  // Redirect to sign-in 3s after success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate('/sign-in'), 3000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirm) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. The link may have expired.');
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
                  <div className="w-12 h-12 rounded-xl bg-blueAccent/15 border border-blueAccent/25 flex items-center justify-center mb-4">
                    <FiShield className="text-blueAccent-light text-xl" />
                  </div>
                  <h1 className="text-2xl font-bold font-space text-white mb-1">Set New Password</h1>
                  <p className="text-sm text-slate-400">
                    Choose a strong password for your NextHire AI account.
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
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">
                      New Password
                    </label>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blueAccent-light transition-colors text-lg pointer-events-none" />
                      <input
                        id="reset-password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blueAccent/50 focus:ring-1 focus:ring-blueAccent/30 hover:border-white/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blueAccent-light transition-colors text-lg pointer-events-none" />
                      <input
                        id="reset-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 hover:border-white/20 transition-all duration-200 ${
                          confirm && confirm !== password
                            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                            : confirm && confirm === password
                            ? 'border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20'
                            : 'border-white/10 focus:border-blueAccent/50 focus:ring-blueAccent/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {/* Match indicator */}
                    {confirm && (
                      <p className={`text-[11px] mt-1.5 ml-1 ${confirm === password ? 'text-emerald-400' : 'text-red-400'}`}>
                        {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <button
                    id="reset-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white shadow-glow-mixed hover:shadow-glow-violet transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Resetting Password...
                      </>
                    ) : 'Reset Password'}
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
                <h2 className="text-xl font-bold font-space text-white mb-2">Password Reset!</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Your password has been reset successfully.
                  You'll be redirected to sign in automatically in a few seconds.
                </p>
                <Link
                  to="/sign-in"
                  id="go-signin-btn"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white hover:shadow-glow-mixed transition-all duration-300"
                >
                  Sign In Now
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
