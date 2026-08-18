const Job = require("../models/Job");
const Mentor = require("../models/Mentor");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const Activity = require("../models/Activity");
const { matchCandidateWithJob } = require("../services/geminiService");

// ==========================================
// CREATE A NEW JOB DESCRIPTION
// POST /api/mentor/jobs
// ==========================================
const createJob = async (req, res) => {
  try {
    const { title, department, location, type, description, skillsRequired, experienceRequired } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }

    const mentor = await Mentor.findOne({ userId: req.user._id });
    if (!mentor) {
      return res.status(404).json({ error: "Mentor profile not found." });
    }

    const job = await Job.create({
      mentorId: mentor._id,
      title,
      department,
      location,
      type,
      description,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
      experienceRequired
    });

    // Log Activity
    await Activity.create({
      userId: req.user._id,
      activityType: "JOB_CREATED",
      description: `Mentor created job description: ${title}`,
      metadata: { jobId: job._id }
    });

    return res.status(201).json({ success: true, job });
  } catch (error) {
    console.error("Create job error:", error);
    return res.status(500).json({ error: "Server error creating job description." });
  }
};

// ==========================================
// GET ALL JOBS FOR CURRENT MENTOR
// GET /api/mentor/jobs
// ==========================================
const getJobs = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.user._id });
    if (!mentor) {
      return res.status(404).json({ error: "Mentor profile not found." });
    }

    const jobs = await Job.find({ mentorId: mentor._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return res.status(500).json({ error: "Server error fetching job descriptions." });
  }
};

// ==========================================
// DELETE A SAVED JOB DESCRIPTION
// DELETE /api/mentor/jobs/:id
// ==========================================
const deleteJob = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.user._id });
    if (!mentor) {
      return res.status(404).json({ error: "Mentor profile not found." });
    }

    const job = await Job.findOneAndDelete({ _id: req.params.id, mentorId: mentor._id });
    if (!job) {
      return res.status(404).json({ error: "Job description not found or unauthorized." });
    }

    // Log Activity
    await Activity.create({
      userId: req.user._id,
      activityType: "JOB_DELETED",
      description: `Mentor deleted job description: ${job.title}`,
      metadata: { jobId: job._id }
    });

    return res.json({ success: true, message: "Job description deleted successfully." });
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).json({ error: "Server error deleting job description." });
  }
};

// ==========================================
// MATCH CANDIDATE TO JOB (GEMINI AI MATCH)
// POST /api/mentor/candidates/:id/match
// ==========================================
const matchCandidate = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.user._id });
    if (!mentor) {
      return res.status(404).json({ error: "Mentor profile not found." });
    }

    const { jobId, rawDescription } = req.body;

    let targetDescription = rawDescription;
    let targetTitle = "Custom Search";

    if (jobId) {
      const job = await Job.findOne({ _id: jobId, mentorId: mentor._id });
      if (!job) {
        return res.status(404).json({ error: "Job description not found." });
      }
      targetDescription = `${job.description}\nSkills required: ${job.skillsRequired.join(", ")}`;
      targetTitle = job.title;
    }

    if (!targetDescription || !targetDescription.trim()) {
      return res.status(400).json({ error: "A job description must be provided." });
    }

    // Fetch candidate latest resume analysis
    const resume = await ResumeAnalysis.findOne({ userId: req.params.id }).sort({ createdAt: -1 });
    if (!resume) {
      return res.status(400).json({ error: "This candidate has not uploaded any resumes for analysis." });
    }

    // Run Gemini matching service
    const matchingResult = await matchCandidateWithJob(resume, targetDescription);

    // Log activity
    await Activity.create({
      userId: req.user._id,
      activityType: "CANDIDATE_MATCHED",
      description: `Mentor evaluated candidate fit for job: ${targetTitle}`,
      metadata: {
        candidateId: req.params.id,
        matchPercentage: matchingResult.matchPercentage
      }
    });

    return res.json({ success: true, match: matchingResult });

  } catch (error) {
    console.error("Match candidate error:", error);
    return res.status(500).json({ error: "Server error performing AI candidate matching." });
  }
};

module.exports = {
  createJob,
  getJobs,
  deleteJob,
  matchCandidate
};
