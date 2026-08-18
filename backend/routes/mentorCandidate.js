const express = require("express");

const router = express.Router();

// ======================================================
// MIDDLEWARE
// ======================================================

const protect = require("../middleware/authMiddleware");

const mentorOnly = require("../middleware/mentorMiddleware");

// ======================================================
// CONTROLLER
// ======================================================

const {
    getCandidates,
    getCandidateById,
} = require(
    "../controllers/mentorCandidateController"
);

// ======================================================
// GET ALL CANDIDATES
// GET /api/mentor/candidates
// ======================================================
//
// Security:
//
// protect
//     ↓
// Valid JWT
//
// mentorOnly
//     ↓
// role === mentor
//
// Controller
//     ↓
// approved + active subscription
//
// ======================================================

router.get(
    "/",
    protect,
    mentorOnly,
    getCandidates
);

// ======================================================
// GET SINGLE CANDIDATE
// GET /api/mentor/candidates/:id
// ======================================================

router.get(
    "/:id",
    protect,
    mentorOnly,
    getCandidateById
);

// ======================================================
// MATCH CANDIDATE WITH JOB DESCRIPTION (AI evaluation)
// POST /api/mentor/candidates/:id/match
// ======================================================

const { matchCandidate } = require("../controllers/jobController");
router.post(
    "/:id/match",
    protect,
    mentorOnly,
    matchCandidate
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;