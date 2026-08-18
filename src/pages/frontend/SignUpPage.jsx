import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiUser, FiEye, FiEyeOff,
  FiArrowRight, FiArrowLeft, FiCheck, FiX,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  validateEmail,
  validateName,
  validatePassword,
  validateConfirmPassword,
  passwordStrength,
} from '../../utils/validations';

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

// ==========================================
// PASSWORD STRENGTH CHECKLIST
// ==========================================

const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-emerald-500'];
const strengthTextColors = ['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400'];

const CheckItem = ({ met, label }) => (
  <div className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
    {met ? <FiCheck size={11} /> : <FiX size={11} />}
    <span>{label}</span>
  </div>
);

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '', general: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirm: false });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading || isAuthenticated) return null;

  // ==========================================
  // PASSWORD STRENGTH
  // ==========================================

  const { score: strength, label: strengthLabel, checks } = passwordStrength(password);

  // ==========================================
  // FIELD VALIDATION
  // ==========================================

  const validateField = (field, value) => {
    switch (field) {
      case 'name':    return validateName(value, 'Full name').message;
      case 'email':   return validateEmail(value).message;
      case 'password': return validatePassword(value, 8).message || (strength < 2 ? 'Choose a stronger password.' : '');
      case 'confirm': return validateConfirmPassword(password, value).message;
      default: return '';
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleChange = (field, value, setter) => {
    setter(value);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
    // Revalidate confirm when password changes
    if (field === 'password' && touched.confirm) {
      setErrors((prev) => ({
        ...prev,
        confirm: validateConfirmPassword(value, confirm).message,
      }));
    }
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ name: '', email: '', password: '', confirm: '', general: '' });

    const nameErr    = validateField('name', name);
    const emailErr   = validateField('email', email);
    const pwdErr     = validateField('password', password);
    const confirmErr = validateField('confirm', confirm);

    if (nameErr || emailErr || pwdErr || confirmErr) {
      setErrors({ name: nameErr, email: emailErr, password: pwdErr, confirm: confirmErr, general: '' });
      setTouched({ name: true, email: true, password: true, confirm: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setErrors((prev) => ({
            ...prev,
            general: data.error || 'Too many registrations from this device. Please try again later.',
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            general: data.error || 'Registration failed. Please try again.',
          }));
        }
        return;
      }

      login(data.user, data.token);
      setRegisteredName(data.user.name);
      setSuccess(true);
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: 'Could not reach the server. Make sure the backend is running.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violetAccent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blueAccent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blueAccent/5 rounded-full blur-[150px] pointer-events-none" />

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
            boxShadow: '0 0 80px rgba(37,99,235,0.12), 0 0 40px rgba(124,58,237,0.08), 0 25px 60px rgba(0,0,0,0.7)',
          }}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blueAccent/60 to-transparent" />

          <div className="px-8 pt-8 pb-10">
            <AnimatePresence mode="wait">

              {/* ── SIGN UP FORM ── */}
              {!success && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
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
                    <h1 className="text-2xl font-bold font-space text-white">Create your account</h1>
                    <p className="text-sm text-slate-400 mt-1.5">Start your AI interview journey — it&apos;s free</p>
                  </div>

                  {/* Social Buttons */}
                  <div className="flex gap-3 mb-6">
                    <SocialButton id="signup-google-btn" icon={<FcGoogle size={18} />} label="Google" />
                    <SocialButton id="signup-github-btn" icon={<FaGithub size={18} className="text-white" />} label="GitHub" />
                  </div>

                  {/* Divider */}
                  <div className="relative mb-6">
                    <div className="h-px bg-white/8" />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 bg-[#0a0a1e] px-3">or sign up with email</span>
                  </div>

                  {/* Form */}
                  <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-4">

                    <InputField
                      id="signup-name"
                      icon={FiUser}
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => handleChange('name', e.target.value, setName)}
                      onBlur={() => handleBlur('name', name)}
                      error={touched.name ? errors.name : ''}
                    />

                    <InputField
                      id="signup-email"
                      icon={FiMail}
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => handleChange('email', e.target.value, setEmail)}
                      onBlur={() => handleBlur('email', email)}
                      error={touched.email ? errors.email : ''}
                    />

                    <InputField
                      id="signup-password"
                      icon={FiLock}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => handleChange('password', e.target.value, setPassword)}
                      onBlur={() => handleBlur('password', password)}
                      error={touched.password ? errors.password : ''}
                      rightElement={{
                        icon: showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                        onClick: () => setShowPassword(!showPassword),
                      }}
                    />

                    {/* Password strength bar + checklist */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5 px-0.5"
                      >
                        {/* Strength bar */}
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-400 ${
                                i <= strength ? strengthColors[strength] : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Strength:{' '}
                          <span className={`font-semibold ${strengthTextColors[strength]}`}>
                            {strengthLabel || 'Too weak'}
                          </span>
                        </p>

                        {/* Requirement checklist */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <CheckItem met={checks.length}    label="At least 8 characters" />
                          <CheckItem met={checks.uppercase} label="One uppercase letter" />
                          <CheckItem met={checks.number}    label="One number" />
                          <CheckItem met={checks.special}   label="One special character" />
                        </div>
                      </motion.div>
                    )}

                    <InputField
                      id="signup-confirm"
                      icon={FiLock}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirm}
                      onChange={(e) => handleChange('confirm', e.target.value, setConfirm)}
                      onBlur={() => handleBlur('confirm', confirm)}
                      error={touched.confirm ? errors.confirm : ''}
                      rightElement={{
                        icon: showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                        onClick: () => setShowConfirm(!showConfirm),
                      }}
                    />

                    {/* General API error */}
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
                      id="signup-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blueAccent to-violetAccent hover:opacity-90 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_35px_rgba(124,58,237,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Creating account...
                        </>
                      ) : (
                        <>Create Free Account <FiArrowRight /></>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/sign-in" className="text-blueAccent-light hover:text-violetAccent-light transition-colors font-semibold">
                      Sign in
                    </Link>
                  </p>

                  <p className="text-center text-[10px] text-slate-600 mt-3">
                    By signing up you agree to our{' '}
                    <span className="text-slate-500 hover:text-white cursor-pointer transition-colors">Terms</span>
                    {' '}&amp;{' '}
                    <span className="text-slate-500 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                  </p>
                </motion.div>
              )}

              {/* ── SUCCESS STATE ── */}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 14 }}
                    className="w-[72px] h-[72px] rounded-full bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                  >
                    <FiCheck className="text-emerald-400 text-4xl" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white font-space mb-2">You&apos;re all set! 🎉</h2>
                  <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                    Welcome to NextHire AI, <span className="text-white font-semibold">{registeredName}</span>!<br />
                    Your account has been created successfully.
                  </p>
                  <button
                    id="goto-dashboard-btn"
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blueAccent to-violetAccent shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_35px_rgba(124,58,237,0.5)] hover:opacity-90 transition-all duration-300"
                  >
                    Go to Dashboard →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-violetAccent/40 to-transparent" />
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-5">
          Secured with end-to-end encryption · NextHire AI © 2025
        </p>
      </motion.div>
    </div>
  );
}
