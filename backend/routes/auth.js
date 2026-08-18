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

module.exports = router;