import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validations';

const API_BASE = 'http://localhost:5000';

// ==========================================
// INPUT FIELD WITH INLINE ERROR
// ==========================================

const InputField = ({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  rightElement,
  id,
  autoComplete,
  error,
  onBlur,
}) => {
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <div className="relative group">
        <Icon
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 text-lg pointer-events-none ${
            hasError
              ? 'text-red-400'
              : 'text-slate-500 group-focus-within:text-blueAccent-light'
          }`}
        />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete || 'new-password'}
          className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 hover:border-white/20 transition-all duration-200 ${
            hasError
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
              : 'border-white/10 focus:border-blueAccent/50 focus:ring-blueAccent/30'
          }`}
        />
        {rightElement && (
          <button
            type="button"
            onClick={rightElement.onClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            {rightElement.icon}
          </button>
        )}
      </div>

      {/* Inline error message */}
      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 pl-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

const SocialButton = ({ icon, label, id }) => (
  <button
    id={id}
    type="button"
    className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-medium group"
  >
    {icon}
    <span className="text-slate-400 group-hover:text-white transition-colors">{label}</span>
  </button>
);

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading, sessionExpired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Per-field errors
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });

  // Track which fields have been touched (to show errors on blur)
  const [touched, setTouched] = useState({ email: false, password: false });

  // ==========================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ==========================================

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading || isAuthenticated) return null;

  // ==========================================
  // FIELD-LEVEL VALIDATION
  // ==========================================

  const validateField = (field, value) => {
    switch (field) {
      case 'email': {
        const result = validateEmail(value);
        return result.message;
      }
      case 'password': {
        const result = validatePassword(value, 6);
        return result.message;
      }
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errMsg = validateField(field, field === 'email' ? email : password);
    setErrors((prev) => ({ ...prev, [field]: errMsg }));
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (touched.email) {
      const errMsg = validateField('email', e.target.value);
      setErrors((prev) => ({ ...prev, email: errMsg }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (touched.password) {
      const errMsg = validateField('password', e.target.value);
      setErrors((prev) => ({ ...prev, password: errMsg }));
    }
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });

    // Run full validation on all fields
    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', password);

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr, general: '' });
      setTouched({ email: true, password: true });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setErrors((prev) => ({
            ...prev,
            general: data.error || 'Too many attempts. Please wait before trying again.',
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: data.error || 'Login failed. Please check your credentials.',
          }));
        }
        return;
      }

      // Persist auth state then redirect based on role
      login(data.user, data.token);

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: 'Could not reach the server. Make sure the backend is running.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blueAccent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violetAccent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violetAccent/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200 group"
      >
        <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="relative rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(10,10,30,0.98) 100%)',
            boxShadow: '0 0 80px rgba(124,58,237,0.12), 0 0 40px rgba(37,99,235,0.08), 0 25px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-violetAccent/60 to-transparent" />

          <div className="px-8 pt-8 pb-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <Link to="/" className="flex items-center gap-2.5 group mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-transform duration-300 group-hover:scale-105">
                  <HiSparkles className="text-white text-xl" />
                </div>
                <span className="font-space text-xl font-bold tracking-tight text-white">
                  NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
                </span>
              </Link>
              <h1 className="text-2xl font-bold font-space text-white">Welcome back</h1>
              <p className="text-sm text-slate-400 mt-1.5">Sign in to your account to continue</p>
            </div>

            {/* Session expired notice */}
            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5"
              >
                Your session has expired. Please sign in again.
              </motion.div>
            )}

            {/* Social Buttons */}
            <div className="flex gap-3 mb-6">
              <SocialButton id="signin-google-btn" icon={<FcGoogle size={18} />} label="Google" />
              <SocialButton id="signin-github-btn" icon={<FaGithub size={18} className="text-white" />} label="GitHub" />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="h-px bg-white/8" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 bg-[#0a0a1e] px-3">or sign in with email</span>
            </div>

            {/* Form */}
            <form id="signin-form" onSubmit={handleSubmit} autoComplete="off" className="space-y-4" noValidate>
              {/* Dummy fields to intercept Chrome autofill */}
              <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                <input type="text" name="prevent_autofill_email" autoComplete="new-password" tabIndex="-1" />
                <input type="password" name="prevent_autofill_password" autoComplete="new-password" tabIndex="-1" />
              </div>

              <InputField
                id="signin-email"
                icon={FiMail}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                autoComplete="new-password"
                error={touched.email ? errors.email : ''}
              />

              <InputField
                id="signin-password"
                icon={FiLock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                autoComplete="new-password"
                error={touched.password ? errors.password : ''}
                rightElement={{
                  icon: showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                  onClick: () => setShowPassword(!showPassword),
                }}
              />

              <div className="flex justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  id="forgot-password-btn"
                  className="text-xs text-blueAccent-light hover:text-violetAccent-light transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              {/* General error (from API) */}
              {errors.general && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
                >
                  {errors.general}
                </motion.p>
              )}

              <button
                id="signin-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blueAccent to-violetAccent hover:opacity-90 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_35px_rgba(124,58,237,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Sign In <FiArrowRight /></>
                )}
              </button>
            </form>

            {/* Footer link */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Don&apos;t have an account?{' '}
              <Link to="/sign-up" className="text-blueAccent-light hover:text-violetAccent-light transition-colors font-semibold">
                Create one free
              </Link>
            </p>
          </div>

          {/* Bottom accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blueAccent/40 to-transparent" />
        </div>

        {/* Bottom trust note */}
        <p className="text-center text-[11px] text-slate-600 mt-5">
          Secured with end-to-end encryption · NextHire AI © 2025
        </p>
      </motion.div>
    </div>
  );
}
