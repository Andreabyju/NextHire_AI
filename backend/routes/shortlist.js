const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const mentorOnly = require("../middleware/mentorMiddleware");

const {
    shortlistCandidate,
    removeFromShortlist,
    getShortlistedCandidates,
} = require("../controllers/shortlistController");

// ==========================================
// GET SHORTLISTED CANDIDATES
// GET /api/mentor/shortlists
// ==========================================

router.get(
    "/",
    protect,
    mentorOnly,
    getShortlistedCandidates
);

// ==========================================
// SHORTLIST CANDIDATE
// POST /api/mentor/shortlists/:candidateId
// ==========================================

router.post(
    "/:candidateId",
    protect,
    mentorOnly,
    shortlistCandidate
);

// ==========================================
// REMOVE FROM SHORTLIST
// DELETE /api/mentor/shortlists/:candidateId
// ==========================================

router.delete(
    "/:candidateId",
    protect,
    mentorOnly,
    removeFromShortlist
);

module.exports = router;