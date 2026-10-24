const express = require("express");
const router = express.Router();

const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const {
    loginLimiter,
    registerLimiter,
} = require("../middleware/rateLimitMiddleware");

const {
    googleAuth,
    googleCallback,
    githubAuth,
    githubCallback,
} = require("../controllers/oauthController");

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================
router.post("/register", registerLimiter, register);

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================
router.post("/login", loginLimiter, login);

// ==========================================
// GET CURRENT USER
// GET /api/auth/me
// ==========================================
router.get("/me", protect, getMe);

// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ==========================================
router.post("/forgot-password", forgotPassword);

// ==========================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ==========================================
router.post("/reset-password/:token", resetPassword);

// ==========================================
// OAUTH — GOOGLE
// ==========================================
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// ==========================================
// OAUTH — GITHUB
// ==========================================
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

module.exports = router;