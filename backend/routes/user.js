const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  updatePassword,
  getMyActivity,
  getMyStats,
} = require("../controllers/userController");

const {
  getCandidateInvitations,
  updateInvitationStatus,
} = require("../controllers/invitationController");

// All routes require authentication — data is scoped to req.user (the logged-in user)
// A user cannot access another user's data through these endpoints

// GET  /api/user/profile — get own profile
router.get("/profile", protect, getProfile);

// PATCH /api/user/profile — update own name
router.patch("/profile", protect, updateProfile);

// PATCH /api/user/password — change own password (requires current password)
router.patch("/password", protect, updatePassword);

// GET  /api/user/activity — own activity history
router.get("/activity", protect, getMyActivity);

// GET  /api/user/stats — own stats and progress
router.get("/stats", protect, getMyStats);

// GET  /api/user/invitations — own received invitations from recruiters
router.get("/invitations", protect, getCandidateInvitations);

// PATCH /api/user/invitations/:id/status — accept or decline recruiter invitation
router.patch("/invitations/:id/status", protect, updateInvitationStatus);

module.exports = router;
