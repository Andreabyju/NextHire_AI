const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  // ========================================
  // USER MANAGEMENT
  // ========================================

  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,

  // ========================================
  // ACTIVITY
  // ========================================

  getActivity,

  // ========================================
  // STATS
  // ========================================

  getStats,

  // ========================================
  // MENTOR MANAGEMENT
  // ========================================

  getMentors,
  getMentorById,
  approveMentor,
  rejectMentor,
  updateMentorSubscription,
} = require("../controllers/adminController");

// ==========================================
// USER MANAGEMENT
// ==========================================

// GET /api/admin/users
router.get(
  "/users",
  protect,
  adminOnly,
  getUsers
);

// GET /api/admin/users/:id
router.get(
  "/users/:id",
  protect,
  adminOnly,
  getUserById
);

// PATCH /api/admin/users/:id/status
router.patch(
  "/users/:id/status",
  protect,
  adminOnly,
  updateUserStatus
);

// DELETE /api/admin/users/:id
router.delete(
  "/users/:id",
  protect,
  adminOnly,
  deleteUser
);

// ==========================================
// ACTIVITY
// ==========================================

// GET /api/admin/activity
router.get(
  "/activity",
  protect,
  adminOnly,
  getActivity
);

// ==========================================
// STATS
// ==========================================

// GET /api/admin/stats
router.get(
  "/stats",
  protect,
  adminOnly,
  getStats
);

// ==========================================
// MENTOR MANAGEMENT
// ==========================================

// GET /api/admin/mentors
router.get(
  "/mentors",
  protect,
  adminOnly,
  getMentors
);

// GET /api/admin/mentors/:id
router.get(
  "/mentors/:id",
  protect,
  adminOnly,
  getMentorById
);

// PATCH /api/admin/mentors/:id/approve
router.patch(
  "/mentors/:id/approve",
  protect,
  adminOnly,
  approveMentor
);

// PATCH /api/admin/mentors/:id/reject
router.patch(
  "/mentors/:id/reject",
  protect,
  adminOnly,
  rejectMentor
);

// PATCH /api/admin/mentors/:id/subscription
router.patch(
  "/mentors/:id/subscription",
  protect,
  adminOnly,
  updateMentorSubscription
);

module.exports = router;