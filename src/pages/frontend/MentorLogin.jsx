import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiArrowRight, FiArrowLeft,
} from 'react-icons/fi';
import { HiBriefcase } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { mentorApi } from '../../services/mentorApi';
import { validateEmail, validatePassword } from '../../utils/validations';

// ==========================================
// REUSABLE INPUT FIELD WITH INLINE ERROR
// ==========================================

const InputField = ({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  rightElement,
  id,
  name,
  autoComplete,
  error,
}) => {
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <div className="relative group">
        <Icon
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 text-lg pointer-events-none ${
            hasError
              ? 'text-red-400'
              : 'text-slate-500 group-focus-within:text-violetAccent-light'
          }`}
        />

        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 hover:border-white/20 transition-all duration-200 ${
            hasError
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
              : 'border-white/10 focus:border-violetAccent/50 focus:ring-violetAccent/30'
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

// ==========================================
// MENTOR LOGIN
// ==========================================

export default function MentorLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isAuthenticated, user, loading, sessionExpired } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const [errors, setErrors]   = useState({
    email: '',
    password: '',
    general: location.state?.message || '',
  });
  const [touched, setTouched] = useState({ email: false, password: false });

  // ==========================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ==========================================

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'mentor') {
        navigate('/mentor/dashboard', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading || isAuthenticated) return null;

  // ==========================================
  // FIELD VALIDATION
  // ==========================================

  const validateField = (field, value) => {
    switch (field) {
      case 'email':    return validateEmail(value).message;
      case 'password': return validatePassword(value, 6).message;
      default: return '';
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', e.target.value) }));
    }
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });

    const emailErr   = validateField('email', email);
    const passwordErr = validateField('password', password);

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr, general: '' });
      setTouched({ email: true, password: true });
      return;
    }

    setSubmitting(true);

    try {
      const data = await mentorApi.login({
        email: email.trim(),
        password,
      });

      if (!data?.token) {
        throw new Error('No authentication token was returned by the server.');
      }

      if (!data?.user) {
        throw new Error('No user information was returned by the server.');
      }

      if (data.user.role !== 'mentor') {
        throw new Error('This account is not registered as a mentor/recruiter account.');
      }

      login(data.user, data.token);

      navigate('/mentor/dashboard', { replace: true });

    } catch (err) {
      console.error('Mentor login failed:', err);

      const msg = err?.message || 'Unable to sign in. Please check your credentials.';

      if (msg.toLowerCase().includes('too many')) {
        setErrors((prev) => ({ ...prev, general: msg }));
      } else {
        setErrors((prev) => ({ ...prev, general: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violetAccent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blueAccent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to portal */}
      <Link
        to="/portal"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200 group z-10"
      >
        <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Portals
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className="relative rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(10,10,30,0.98) 100%)',
            boxShadow: '0 0 80px rgba(124,58,237,0.12)',
          }}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-violetAccent/60 to-transparent" />

          <div className="px-8 pt-8 pb-10">

            {/* Header */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                <HiBriefcase className="text-2xl" />
              </div>

              <h1 className="text-2xl font-bold font-space text-white">
                Mentor / Recruiter Login
              </h1>

              <p className="text-sm text-slate-400 mt-1.5">
                Sign in to manage your company and discover candidates.
              </p>
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

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              noValidate
              className="space-y-4"
            >
              {/* Dummy fields to intercept Chrome autofill */}
              <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                <input type="text" name="prevent_autofill_email" autoComplete="new-password" tabIndex="-1" />
                <input type="password" name="prevent_autofill_password" autoComplete="new-password" tabIndex="-1" />
              </div>

              {/* Email */}
              <InputField
                id="mentor-email"
                name="email"
                icon={FiMail}
                type="email"
                placeholder="Company Email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email', email)}
                autoComplete="new-password"
                error={touched.email ? errors.email : ''}
              />

              {/* Password */}
              <InputField
                id="mentor-password"
                name="password"
                icon={FiLock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password', password)}
                autoComplete="new-password"
                error={touched.password ? errors.password : ''}
                rightElement={{
                  icon: showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                  onClick: () => setShowPassword((prev) => !prev),
                }}
              />

              {/* Forgot password */}
              <div className="flex justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-violetAccent-light hover:text-white transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* General error (API) */}
              {errors.general && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
                >
                  {errors.general}
                </motion.p>
              )}

              {/* Sign in */}
              <button
                id="mentor-login-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all duration-300 disabled:opacity-50 mt-1"
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
                  <>
                    SIGN IN
                    <FiArrowRight />
                  </>
                )}
              </button>

            </form>

            {/* Footer */}
            <div className="mt-6 flex flex-col gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Don&apos;t have a mentor account?
                </p>
                <Link
                  to="/mentor/register"
                  className="text-xs font-semibold text-violetAccent-light hover:text-white transition-colors uppercase tracking-wide"
                >
                  CREATE MENTOR ACCOUNT
                </Link>
              </div>

              <div className="h-px bg-white/10 w-1/2 mx-auto" />

              <Link
                to="/sign-in"
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                Candidate / Student Login
              </Link>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}