import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiArrowRight, FiArrowLeft, FiUser,
  FiGlobe, FiPhone, FiBriefcase, FiMapPin,
  FiUsers, FiCheck, FiX,
} from 'react-icons/fi';
import { HiBriefcase as HiBriefcaseSolid } from 'react-icons/hi2';
import { mentorApi } from '../../services/mentorApi';
import {
  validateEmail,
  validateName,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
  validateUrl,
  validateCompanySize,
  passwordStrength,
} from '../../utils/validations';

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
  required = true,
  error,
}) => {
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <div className="relative group">
        <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 text-lg pointer-events-none ${
          hasError ? 'text-red-400' : 'text-slate-500 group-focus-within:text-violetAccent-light'
        }`} />

        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          autoComplete="off"
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
// PASSWORD STRENGTH HELPERS
// ==========================================

const strengthColors     = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-400', 'bg-emerald-500'];
const strengthTextColors = ['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400'];

const CheckItem = ({ met, label }) => (
  <div className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
    {met ? <FiCheck size={11} /> : <FiX size={11} />}
    <span>{label}</span>
  </div>
);

// ==========================================
// MENTOR REGISTRATION PAGE
// ==========================================

const INITIAL_FORM = {
  mentorName: '',
  companyName: '',
  companyEmail: '',
  password: '',
  confirmPassword: '',
  phone: '',
  website: '',
  industry: '',
  companyDescription: '',
  location: '',
  companySize: '',
};

const INITIAL_ERRORS = {
  mentorName: '', companyName: '', companyEmail: '',
  password: '', confirmPassword: '',
  phone: '', website: '', industry: '',
  location: '', companySize: '',
  general: '',
};

const INITIAL_TOUCHED = {
  mentorName: false, companyName: false, companyEmail: false,
  password: false, confirmPassword: false,
  phone: false, website: false, industry: false,
  location: false, companySize: false,
};

export default function MentorRegister() {
  const [formData, setFormData]   = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [errors, setErrors]   = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [success, setSuccess] = useState(false);

  // ==========================================
  // PASSWORD STRENGTH
  // ==========================================

  const { score: pwdScore, label: pwdLabel, checks: pwdChecks } = passwordStrength(formData.password);

  // ==========================================
  // FIELD VALIDATION MAP
  // ==========================================

  const validateField = (field, value) => {
    switch (field) {
      case 'mentorName':      return validateName(value, 'Mentor name').message;
      case 'companyName':     return validateName(value, 'Company name').message;
      case 'companyEmail':    return validateEmail(value).message;
      case 'password': {
        const base = validatePassword(value, 8).message;
        if (base) return base;
        const { score } = passwordStrength(value);
        return score < 2 ? 'Choose a stronger password.' : '';
      }
      case 'confirmPassword': return validateConfirmPassword(formData.password, value).message;
      case 'phone':           return validatePhone(value).message;
      case 'website':         return validateUrl(value).message;
      case 'industry':        return validateName(value, 'Industry').message;
      case 'location':        return validateName(value, 'Location').message;
      case 'companySize':     return validateCompanySize(value).message;
      default: return '';
    }
  };

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }

    // Revalidate confirm password when main password changes
    if (name === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, formData.confirmPassword).message,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ==========================================
  // HANDLE FORM SUBMISSION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(INITIAL_ERRORS);

    // Validate all required fields
    const requiredFields = [
      'mentorName', 'companyName', 'companyEmail',
      'password', 'confirmPassword',
      'industry', 'location', 'companySize',
    ];
    const optionalFields = ['phone', 'website'];

    const newErrors = { ...INITIAL_ERRORS };
    let hasErrors = false;

    for (const field of requiredFields) {
      const err = validateField(field, formData[field]);
      if (err) {
        newErrors[field] = err;
        hasErrors = true;
      }
    }

    for (const field of optionalFields) {
      const err = validateField(field, formData[field]);
      if (err) {
        newErrors[field] = err;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      // Mark all required fields as touched to show errors
      const allTouched = {};
      [...requiredFields, ...optionalFields].forEach((f) => (allTouched[f] = true));
      setTouched((prev) => ({ ...prev, ...allTouched }));
      return;
    }

    setSubmitting(true);

    try {
      // Confirm password is frontend-only — don't send it
      const { confirmPassword, ...dataToSend } = formData;

      await mentorApi.register(dataToSend);

      setSuccess(true);
    } catch (err) {
      console.error('Mentor registration error:', err);

      const msg = err?.message || 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('too many')) {
        setErrors((prev) => ({ ...prev, general: msg }));
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('exists')) {
        setErrors((prev) => ({ ...prev, companyEmail: msg }));
        setTouched((prev) => ({ ...prev, companyEmail: true }));
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
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violetAccent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blueAccent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to portals */}
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
        className="w-full max-w-2xl relative z-10"
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
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Header */}
                  <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                      <HiBriefcaseSolid className="text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold font-space text-white">
                      Create Mentor / Recruiter Account
                    </h1>
                    <p className="text-sm text-slate-400 mt-1.5">
                      Register your company to discover and hire top candidates.
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    autoComplete="off"
                    noValidate
                    className="space-y-4"
                  >
                    {/* Mentor + Company */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="reg-mentorName"
                        name="mentorName"
                        icon={FiUser}
                        type="text"
                        placeholder="Mentor Name *"
                        value={formData.mentorName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.mentorName ? errors.mentorName : ''}
                      />

                      <InputField
                        id="reg-companyName"
                        name="companyName"
                        icon={FiBriefcase}
                        type="text"
                        placeholder="Company Name *"
                        value={formData.companyName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.companyName ? errors.companyName : ''}
                      />
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="reg-email"
                        name="companyEmail"
                        icon={FiMail}
                        type="email"
                        placeholder="Company Email *"
                        value={formData.companyEmail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.companyEmail ? errors.companyEmail : ''}
                      />

                      <InputField
                        id="reg-phone"
                        name="phone"
                        icon={FiPhone}
                        type="tel"
                        placeholder="Phone Number (optional)"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required={false}
                        error={touched.phone ? errors.phone : ''}
                      />
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="reg-password"
                        name="password"
                        icon={FiLock}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (min 8 chars) *"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password ? errors.password : ''}
                        rightElement={{
                          icon: showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                          onClick: () => setShowPassword((prev) => !prev),
                        }}
                      />

                      <InputField
                        id="reg-confirm"
                        name="confirmPassword"
                        icon={FiLock}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm Password *"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.confirmPassword ? errors.confirmPassword : ''}
                        rightElement={{
                          icon: showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />,
                          onClick: () => setShowConfirm((prev) => !prev),
                        }}
                      />
                    </div>

                    {/* Password strength — shown if password field has any content */}
                    {formData.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5 px-0.5"
                      >
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-400 ${
                                i <= pwdScore ? strengthColors[pwdScore] : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Strength:{' '}
                          <span className={`font-semibold ${strengthTextColors[pwdScore]}`}>
                            {pwdLabel || 'Too weak'}
                          </span>
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <CheckItem met={pwdChecks.length}    label="At least 8 characters" />
                          <CheckItem met={pwdChecks.uppercase} label="One uppercase letter" />
                          <CheckItem met={pwdChecks.number}    label="One number" />
                          <CheckItem met={pwdChecks.special}   label="One special character" />
                        </div>
                      </motion.div>
                    )}

                    {/* Website + Industry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="reg-website"
                        name="website"
                        icon={FiGlobe}
                        type="url"
                        placeholder="Website URL (optional)"
                        value={formData.website}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required={false}
                        error={touched.website ? errors.website : ''}
                      />

                      <InputField
                        id="reg-industry"
                        name="industry"
                        icon={FiBriefcase}
                        type="text"
                        placeholder="Industry *"
                        value={formData.industry}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.industry ? errors.industry : ''}
                      />
                    </div>

                    {/* Location + Company Size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField
                        id="reg-location"
                        name="location"
                        icon={FiMapPin}
                        type="text"
                        placeholder="Location *"
                        value={formData.location}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.location ? errors.location : ''}
                      />

                      <InputField
                        id="reg-size"
                        name="companySize"
                        icon={FiUsers}
                        type="text"
                        placeholder='Company Size (e.g. "1-10") *'
                        value={formData.companySize}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.companySize ? errors.companySize : ''}
                      />
                    </div>

                    {/* Company Description */}
                    <div className="relative group">
                      <textarea
                        id="reg-companyDescription"
                        name="companyDescription"
                        placeholder="Company Description (optional)"
                        value={formData.companyDescription}
                        onChange={handleChange}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violetAccent/50 focus:ring-1 focus:ring-violetAccent/30 hover:border-white/20 transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* General error */}
                    {errors.general && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
                      >
                        {errors.general}
                      </motion.p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all duration-300 disabled:opacity-50 mt-4"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          Creating account...
                        </>
                      ) : (
                        <>
                          CREATE ACCOUNT
                          <FiArrowRight />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer links */}
                  <div className="mt-6 flex flex-col gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Already have a mentor account?
                      </p>
                      <Link
                        to="/mentor/login"
                        className="text-xs font-semibold text-violetAccent-light hover:text-white transition-colors uppercase tracking-wide"
                      >
                        SIGN IN
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
                </motion.div>
              ) : (
                /* ==========================================
                   SUCCESS STATE
                   ========================================== */

                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
                  >
                    <FiCheck className="text-emerald-400 text-3xl" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-white font-space mb-2">
                    Mentor account created successfully.
                  </h2>

                  <p className="text-sm text-slate-400 mb-6">
                    Your company registration has been submitted and is awaiting admin verification.
                  </p>

                  <div className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm mb-8 tracking-widest">
                    PENDING
                  </div>

                  <br />

                  <Link
                    to="/mentor/login"
                    className="px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all duration-300 inline-block"
                  >
                    Go to Mentor Login
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}