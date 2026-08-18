const User = require("../models/User");
const Activity = require("../models/Activity");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/emailService");

// ==========================================
// EMAIL VALIDATION PATTERN
// ==========================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ==========================================
// GENERATE JWT
// ==========================================

const generateToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ==========================================
// ACTIVITY LOGGER
// ==========================================

const logActivity = async (
  userId,
  activityType,
  description,
  metadata = {}
) => {
  try {
    await Activity.create({
      userId,
      activityType,
      description,
      metadata,
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
};

// ==========================================
// REGISTER NORMAL USER
// POST /api/auth/register
// ==========================================
//
// IMPORTANT:
// Normal registration can ONLY create "user"
// accounts.
//
// Users cannot submit:
// {
//   role: "admin"
// }
//
// or
//
// {
//   role: "mentor"
// }
//
// The role is always forced to "user".
//
// Mentor registration will be implemented
// separately with company verification and
// payment/subscription checks.
// ==========================================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please fill in all fields",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters long",
      });
    }

    if (trimmedName.length > 80) {
      return res.status(400).json({
        error: "Name must be 80 characters or fewer",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // ==========================================
    // CHECK EXISTING USER
    // ==========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    // ==========================================
    // CREATE NORMAL USER
    // ==========================================
    //
    // SECURITY:
    // Never take role from req.body.
    //
    // Every account created through the normal
    // registration endpoint is ALWAYS a user.
    // ==========================================

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user",
      accountStatus: "active",
    });

    // ==========================================
    // LOG ACTIVITY
    // ==========================================

    await logActivity(
      user._id,
      "USER_REGISTERED",
      `${user.name} registered an account`,
      {
        email: normalizedEmail,
        role: "user",
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({
      message: "Account created successfully",

      token: generateToken(user._id),

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);

    res.status(500).json({
      error: "Server error during registration",
    });
  }
};

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {
      return res.status(400).json({
        error: "Please provide email and password",
      });
    }

    // ==========================================
    // NORMALIZE EMAIL
    // ==========================================

    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    // ==========================================
    // CHECK CREDENTIALS
    // ==========================================

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        error: "Your account has been suspended",
      });
    }

    // ==========================================
    // UPDATE LAST LOGIN
    // ==========================================

    user.lastLogin = new Date();
    await user.save({
      validateBeforeSave: false,
    });

    // ==========================================
    // LOG LOGIN ACTIVITY
    // ==========================================

    await logActivity(
      user._id,
      "USER_LOGIN",
      `${user.name} logged in`,
      {
        email: user.email,
        role: user.role,
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      message: "Login successful",

      token: generateToken(user._id),

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      error: "Server error during login",
    });
  }
};

// ==========================================
// GET CURRENT USER
// GET /api/auth/me
// ==========================================

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        error: "Your account has been suspended",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("GetMe error:", error.message);

    res.status(500).json({
      error: "Server error",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ==========================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email) {
      return res.status(400).json({
        error: "Please provide your email address",
      });
    }

    // ==========================================
    // NORMALIZE EMAIL
    // ==========================================

    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+resetPasswordToken +resetPasswordExpire"
    );

    // ==========================================
    // SECURITY
    // ==========================================
    //
    // Do not reveal whether the email exists.
    // ==========================================

    if (!user) {
      return res.json({
        message:
          "If an account with that email exists, a password reset link will be sent.",
      });
    }

    // ==========================================
    // GENERATE SECURE RESET TOKEN
    // ==========================================

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // ==========================================
    // HASH TOKEN BEFORE STORING
    // ==========================================

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // ==========================================
    // TOKEN EXPIRATION
    // ==========================================

    user.resetPasswordExpire =
      Date.now() + 15 * 60 * 1000;

    await user.save({
      validateBeforeSave: false,
    });

    // ==========================================
    // CREATE RESET URL
    // ==========================================

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password/${resetToken}`;

    // ==========================================
    // SEND RESET EMAIL
    // ==========================================

    await sendPasswordResetEmail(
      user.email,
      resetUrl
    );

    console.log(
      "Password reset email sent to:",
      user.email
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.message
    );

    res.status(500).json({
      error:
        "Unable to send password reset email. Please try again later.",
    });
  }
};

// ==========================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!token) {
      return res.status(400).json({
        error: "Password reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "Please provide a new password",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error:
          "Password must be at least 6 characters long",
      });
    }

    // ==========================================
    // HASH RESET TOKEN
    // ==========================================

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // ==========================================
    // FIND USER WITH VALID TOKEN
    // ==========================================

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    }).select(
      "+password +resetPasswordToken +resetPasswordExpire"
    );

    // ==========================================
    // CHECK TOKEN
    // ==========================================

    if (!user) {
      return res.status(400).json({
        error:
          "Invalid or expired password reset token",
      });
    }

    // ==========================================
    // UPDATE PASSWORD
    // ==========================================

    user.password = password;

    // ==========================================
    // REMOVE RESET TOKEN
    // ==========================================

    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    // ==========================================
    // SAVE USER
    // ==========================================
    //
    // The pre-save middleware in User.js will
    // automatically hash the new password.
    // ==========================================

    await user.save();

    // ==========================================
    // LOG ACTIVITY
    // ==========================================

    await logActivity(
      user._id,
      "PASSWORD_RESET",
      `${user.name} reset their password`,
      {
        email: user.email,
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    res.status(500).json({
      error:
        "Server error while resetting password",
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};