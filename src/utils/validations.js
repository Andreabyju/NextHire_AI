// ==========================================
// SHARED VALIDATION UTILITIES
// ==========================================
//
// Pure functions — no side effects.
// Used across all auth pages.
//
// ==========================================

/**
 * Validates an email address.
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  const trimmed = (email || "").trim();

  if (!trimmed) {
    return { valid: false, message: "Email address is required." };
  }

  // RFC 5322-inspired pattern (practical subset)
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!pattern.test(trimmed)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  return { valid: true, message: "" };
};

/**
 * Validates a display / full name.
 * @param {string} name
 * @param {string} [label="Name"]
 * @returns {{ valid: boolean, message: string }}
 */
export const validateName = (name, label = "Name") => {
  const trimmed = (name || "").trim();

  if (!trimmed) {
    return { valid: false, message: `${label} is required.` };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: `${label} must be at least 2 characters.` };
  }

  if (trimmed.length > 80) {
    return { valid: false, message: `${label} must be 80 characters or fewer.` };
  }

  return { valid: true, message: "" };
};

/**
 * Validates a password for minimum presence.
 * (strength is a separate concern — see passwordStrength())
 * @param {string} password
 * @param {number} [minLength=6]
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return { valid: false, message: "Password is required." };
  }

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters.`,
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validates that confirm password matches password.
 * @param {string} password
 * @param {string} confirm
 * @returns {{ valid: boolean, message: string }}
 */
export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) {
    return { valid: false, message: "Please confirm your password." };
  }

  if (password !== confirm) {
    return { valid: false, message: "Passwords do not match." };
  }

  return { valid: true, message: "" };
};

/**
 * Computes password strength score + checklist.
 * @param {string} pwd
 * @returns {{
 *   score: number,        // 0–4
 *   label: string,        // "Weak" | "Fair" | "Good" | "Strong"
 *   checks: {
 *     length: boolean,
 *     uppercase: boolean,
 *     number: boolean,
 *     special: boolean,
 *   }
 * }}
 */
export const passwordStrength = (pwd) => {
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const label = labels[score] || "";

  return { score, label, checks };
};

/**
 * Validates an optional phone number.
 * Only validates if a value is provided.
 * Accepts 7–15 digit numbers, optional leading +, spaces/dashes.
 * @param {string} phone
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    // Optional field — empty is fine
    return { valid: true, message: "" };
  }

  const digits = phone.replace(/[\s\-().+]/g, "");

  if (!/^\d{7,15}$/.test(digits)) {
    return {
      valid: false,
      message: "Please enter a valid phone number (7–15 digits).",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Validates an optional URL.
 * Only validates if a value is provided.
 * Must begin with http:// or https://
 * @param {string} url
 * @returns {{ valid: boolean, message: string }}
 */
export const validateUrl = (url) => {
  if (!url || !url.trim()) {
    // Optional field — empty is fine
    return { valid: true, message: "" };
  }

  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        valid: false,
        message: "Website URL must start with http:// or https://",
      };
    }
    return { valid: true, message: "" };
  } catch {
    return {
      valid: false,
      message: "Please enter a valid website URL (e.g. https://example.com).",
    };
  }
};

/**
 * Validates a company size string.
 * Accepts patterns like: "1-10", "50-200", "500+", "1000"
 * @param {string} size
 * @returns {{ valid: boolean, message: string }}
 */
export const validateCompanySize = (size) => {
  if (!size || !size.trim()) {
    return { valid: false, message: "Company size is required." };
  }

  const pattern = /^\d+(\s*[-–]\s*\d+|\+)?$/;
  if (!pattern.test(size.trim())) {
    return {
      valid: false,
      message: 'Enter a valid size (e.g. "1-10", "50-200", "500+").',
    };
  }

  return { valid: true, message: "" };
};
