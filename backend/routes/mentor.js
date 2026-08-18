const express = require("express");

const router = express.Router();

// ==========================================
// MIDDLEWARE
// ==========================================

const protect = require("../middleware/authMiddleware");
const mentorOnly = require("../middleware/mentorMiddleware");

const {
    loginLimiter,
    registerLimiter,
} = require("../middleware/rateLimitMiddleware");

// ==========================================
// MENTOR CONTROLLERS
// ==========================================

const {
    registerMentor,
    loginMentor,
    getMentorProfile,
    getMentorAccessStatus,
    resetMentorPassword,
} = require("../controllers/mentorController");

const {
    sendInvitation,
    getMentorInvitations,
} = require("../controllers/invitationController");

// ==========================================
// SUBSCRIPTION ROUTES
// ==========================================

const subscriptionRoutes = require("./subscription");

// ==========================================
// SHORTLIST ROUTES
// ==========================================

const shortlistRoutes = require("./shortlist");

// ==========================================
// MENTOR REGISTRATION
// POST /api/mentor/register
// ==========================================

router.post(
    "/register",
    registerLimiter,
    registerMentor
);

// ==========================================
// MENTOR LOGIN
// POST /api/mentor/login
// ==========================================

router.post(
    "/login",
    loginLimiter,
    loginMentor
);

// ==========================================
// TEMPORARY DEVELOPMENT PASSWORD RESET
// POST /api/mentor/reset-password
// ==========================================

router.post(
    "/reset-password",
    resetMentorPassword
);

// ==========================================
// GET MENTOR PROFILE
// GET /api/mentor/profile
// ==========================================

router.get(
    "/profile",
    protect,
    mentorOnly,
    getMentorProfile
);

// ==========================================
// GET MENTOR ACCESS STATUS
// GET /api/mentor/access
// ==========================================

router.get(
    "/access",
    protect,
    mentorOnly,
    getMentorAccessStatus
);

// ==========================================
// MENTOR SUBSCRIPTION ROUTES
// ==========================================
//
// Because server.js mounts:
//
// app.use("/api/mentor", mentorRoutes);
//
// these become:
//
// GET  /api/mentor/subscription
// POST /api/mentor/subscription/create-order
// POST /api/mentor/subscription/verify-payment
//
// ==========================================

router.use(
    "/subscription",
    subscriptionRoutes
);

// ==========================================
// MENTOR SHORTLIST ROUTES
// ==========================================
//
// These become:
//
// GET    /api/mentor/shortlists
// POST   /api/mentor/shortlists/:candidateId
// DELETE /api/mentor/shortlists/:candidateId
//
// ==========================================

router.use(
    "/shortlists",
    shortlistRoutes
);

// ==========================================
// MENTOR INVITATION ROUTES
// ==========================================
//
// These become:
//
// POST /api/mentor/invitations
// GET  /api/mentor/invitations
//
// ==========================================

router.post(
    "/invitations",
    protect,
    mentorOnly,
    sendInvitation
);

router.get(
    "/invitations",
    protect,
    mentorOnly,
    getMentorInvitations
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;