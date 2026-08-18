const express = require("express");

const router = express.Router();

// ==========================================
// MIDDLEWARE
// ==========================================

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// ==========================================
// CONTROLLER
// ==========================================

const {
    getMentors,
    getMentorById,
    approveMentor,
    rejectMentor,
    updateMentorSubscription,
} = require("../controllers/adminMentorController");

// ==========================================
// GET ALL MENTORS
// GET /api/admin/mentors
// ==========================================

router.get(
    "/",
    protect,
    adminOnly,
    getMentors
);

// ==========================================
// GET SINGLE MENTOR
// GET /api/admin/mentors/:id
// ==========================================

router.get(
    "/:id",
    protect,
    adminOnly,
    getMentorById
);

// ==========================================
// APPROVE MENTOR
// PATCH /api/admin/mentors/:id/approve
// ==========================================

router.patch(
    "/:id/approve",
    protect,
    adminOnly,
    approveMentor
);

// ==========================================
// REJECT MENTOR
// PATCH /api/admin/mentors/:id/reject
// ==========================================

router.patch(
    "/:id/reject",
    protect,
    adminOnly,
    rejectMentor
);

// ==========================================
// UPDATE MENTOR SUBSCRIPTION
// PATCH /api/admin/mentors/:id/subscription
// ==========================================

router.patch(
    "/:id/subscription",
    protect,
    adminOnly,
    updateMentorSubscription
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;