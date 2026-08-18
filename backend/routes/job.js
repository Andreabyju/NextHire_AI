const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const mentorOnly = require("../middleware/mentorMiddleware");
const { createJob, getJobs, deleteJob } = require("../controllers/jobController");

// ==========================================
// JOB DESCRIPTIONS CRUD ROUTES
// ==========================================

router.post("/", protect, mentorOnly, createJob);
router.get("/", protect, mentorOnly, getJobs);
router.delete("/:id", protect, mentorOnly, deleteJob);

module.exports = router;
