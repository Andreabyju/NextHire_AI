import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { HiShieldCheck } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validations';
import { API_BASE } from '../../services/api';

const InputField = ({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  rightElement,
  id,
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
              : 'text-slate-500 group-focus-within:text-red-400'
          }`}
        />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete="new-password"
          className={`w-full bg-white/5 border rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 hover:border-white/20 transition-all duration-200 ${
            hasError
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
              : 'border-white/10 focus:border-red-500/50 focus:ring-red-500/30'
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

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Field errors
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'mentor') {
        navigate('/mentor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading || isAuthenticated) return null;

  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        return validateEmail(value).message;
      case 'password':
        return validatePassword(value, 6).message;
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateField('email', val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });

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
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          general: data.error || 'Authentication failed. Please verify admin credentials.',
        }));
        return;
      }

      if (data.user?.role !== 'admin') {
        setErrors((prev) => ({
          ...prev,
          general: 'Access denied. This account does not have administrator privileges.',
        }));
        return;
      }

      login(data.user, data.token);
      navigate('/admin/dashboard', { replace: true });
    } catch {
      setErrors((prev) => ({
        ...prev,
        general: 'Could not connect to the server. Please check your backend connection.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Link
        to="/portal"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200 group"
      >
        <FiArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Portals
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="relative rounded-2xl border border-red-500/20 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20,10,10,0.95) 0%, rgba(10,5,5,0.98) 100%)',
            boxShadow: '0 0 80px rgba(239,68,68,0.1)',
          }}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
          <div className="px-8 pt-8 pb-10">
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                <HiShieldCheck className="text-2xl" />
              </div>
              <h1 className="text-2xl font-bold font-space text-white">Administrator Login</h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Manage users, mentors, subscriptions and platform activity.
              </p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4" noValidate>
              {/* Dummy fields to intercept Chrome autofill */}
              <div
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <input type="text" name="prevent_autofill_email" autoComplete="new-password" tabIndex="-1" />
                <input type="password" name="prevent_autofill_password" autoComplete="new-password" tabIndex="-1" />
              </div>

              <InputField
                id="admin-email"
                icon={FiMail}
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : ''}
              />

              <InputField
                id="admin-password"
                icon={FiLock}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : ''}
                rightElement={{
                  icon: showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                  onClick: () => setShowPassword(!showPassword),
                }}
              />

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
                id="admin-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 mt-1 cursor-pointer"
              >
                {submitting ? 'Authenticating...' : <>LOGIN <FiArrowRight /></>}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
