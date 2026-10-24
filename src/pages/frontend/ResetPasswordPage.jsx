import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { validatePassword, validateConfirmPassword, passwordStrength } from '../../utils/validations';
import { API_BASE } from '../../services/api';

// Password strength meter
function PasswordStrength({ password }) {
  if (!password) return null;

  const { score, label, checks } = passwordStrength(password);
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  const textColors = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400'];
  const widths = ['w-0', 'w-1/4', 'w-2/4', 'w-3/4', 'w-full'];

  const checkItems = [
    { label: 'At least 8 characters', pass: checks.length },
    { label: 'Contains uppercase letter', pass: checks.uppercase },
    { label: 'Contains a number', pass: checks.number },
    { label: 'Contains special character', pass: checks.special },
  ];

  return (
    <div className="mt-2.5 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${colors[score]} ${widths[score]}`} />
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${textColors[score] || 'text-slate-500'}`}>
          {label || 'Weak'}
        </span>
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checkItems.map(({ label: itemLabel, pass }) => (
          <div key={itemLabel} className={`flex items-center gap-1.5 text-[10px] ${pass ? 'text-emerald-400' : 'text-slate-600'}`}>
            <div className={`w-1 h-1 rounded-full flex-shrink-0 ${pass ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            {itemLabel}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirm: '', general: '' });
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [success, setSuccess] = useState(false);

  // Redirect to sign-in 3s after success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate('/sign-in'), 3000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const validateField = (field, value) => {
    switch (field) {
      case 'password': {
        const base = validatePassword(value, 8).message;
        if (base) return base;
        const { score } = passwordStrength(value);
        return score < 2 ? 'Choose a stronger password.' : '';
      }
      case 'confirm':
        return validateConfirmPassword(password, value).message;
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'password' ? password : confirm;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
    if (touched.confirm) {
      setErrors((prev) => ({
        ...prev,
        confirm: validateConfirmPassword(val, confirm).message,
      }));
    }
  };

  const handleConfirmChange = (e) => {
    const val = e.target.value;
    setConfirm(val);
    if (touched.confirm) {
      setErrors((prev) => ({ ...prev, confirm: validateConfirmPassword(password, val).message }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ password: '', confirm: '', general: '' });

    const pwdErr = validateField('password', password);
    const confirmErr = validateConfirmPassword(password, confirm).message;

    if (pwdErr || confirmErr) {
      setErrors({ password: pwdErr, confirm: confirmErr, general: '' });
      setTouched({ password: true, confirm: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          general: data.error || 'Failed to reset password. The link may have expired or is invalid.',
        }));
        return;
      }

      setSuccess(true);
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: 'Network error. Please check your connection and try again.',
      }));
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

                {/* Error Banner */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-5"
                    >
                      <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                      <span>{errors.general}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* New password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                      New Password
                    </label>
                    <div className="relative group">
                      <FiLock
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-lg pointer-events-none ${
                          touched.password && errors.password
                            ? 'text-red-400'
                            : 'text-slate-500 group-focus-within:text-blueAccent-light'
                        }`}
                      />
                      <input
                        id="reset-password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Enter new password (min. 8 chars)"
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleBlur('password')}
                        autoComplete="new-password"
                        className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 hover:border-white/20 transition-all duration-200 ${
                          touched.password && errors.password
                            ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
                            : 'border-white/10 focus:border-blueAccent/50 focus:ring-blueAccent/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 pl-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <FiLock
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-lg pointer-events-none ${
                          touched.confirm && errors.confirm
                            ? 'text-red-400'
                            : 'text-slate-500 group-focus-within:text-blueAccent-light'
                        }`}
                      />
                      <input
                        id="reset-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat your new password"
                        value={confirm}
                        onChange={handleConfirmChange}
                        onBlur={() => handleBlur('confirm')}
                        autoComplete="new-password"
                        className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 hover:border-white/20 transition-all duration-200 ${
                          touched.confirm && errors.confirm
                            ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
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
                    {touched.confirm && errors.confirm && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 pl-1"
                      >
                        {errors.confirm}
                      </motion.p>
                    )}
                    {/* Match indicator */}
                    {confirm && !errors.confirm && (
                      <p className="text-[11px] mt-1.5 ml-1 text-emerald-400">
                        ✓ Passwords match
                      </p>
                    )}
                  </div>

                  <button
                    id="reset-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white shadow-glow-mixed hover:shadow-glow-violet transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
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
                <h2 className="text-xl font-bold font-space text-white mb-2">Password Reset Complete!</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Your password has been securely updated. Redirecting you to sign in...
                </p>
                <Link
                  to="/sign-in"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white hover:shadow-glow-mixed transition-all duration-300"
                >
                  <FiArrowLeft size={14} />
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
