const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const Interview = require("../models/Interview");
const Activity = require("../models/Activity");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
} = require("../services/geminiService");

// All interview endpoints require candidate authentication
// Candidate ownership is strictly enforced

// ==========================================
// Check candidate resume analysis status
// GET /api/interview/resume-status
// ==========================================
router.get("/resume-status", protect, async (req, res) => {
  try {
    const resume = await ResumeAnalysis.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("originalFileName overallScore strengths sectionAnalysis createdAt");

    if (!resume) {
      return res.json({ success: true, hasResume: false });
    }

    res.json({
      success: true,
      hasResume: true,
      resume: {
        fileName: resume.originalFileName,
        overallScore: resume.overallScore,
        strengths: resume.strengths || [],
        skillsSummary: resume.sectionAnalysis?.skills?.feedback || "",
        analyzedAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error("Resume status error:", error);
    res.json({ success: true, hasResume: false });
  }
});

// ==========================================
// 1. Generate Interview Questions
// POST /api/interview/generate-questions
// ==========================================
router.post("/generate-questions", protect, async (req, res) => {
  try {
    const {
      category = "Mixed",
      jobRole = "Software Developer",
      difficulty = "Intermediate",
      count = 5,
      useResumeContext = false,
    } = req.body;

    const safeCount = Math.max(1, Math.min(parseInt(count) || 5, 10));

    let resumeContext = null;
    if (useResumeContext) {
      try {
        const resume = await ResumeAnalysis.findOne({ userId: req.user.id })
          .sort({ createdAt: -1 })
          .select("originalFileName overallScore strengths sectionAnalysis");

        if (resume) {
          resumeContext = {
            fileName: resume.originalFileName,
            strengths: resume.strengths || [],
            skillsFeedback: resume.sectionAnalysis?.skills?.feedback || "",
            projectsFeedback: resume.sectionAnalysis?.projects?.feedback || "",
          };
        }
      } catch (rErr) {
        console.warn("Could not retrieve resume context:", rErr.message);
      }
    }

    const questions = await generateInterviewQuestions({
      category: ["HR", "Technical", "Mixed"].includes(category) ? category : "Mixed",
      jobRole: String(jobRole).slice(0, 80).trim() || "Software Developer",
      difficulty: ["Beginner", "Intermediate", "Advanced"].includes(difficulty) ? difficulty : "Intermediate",
      count: safeCount,
      resumeContext,
    });

    res.json({
      success: true,
      jobRole,
      category,
      difficulty,
      questionsCount: questions.length,
      usedResume: Boolean(resumeContext),
      questions,
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate interview questions. Please try again.",
    });
  }
});

// ==========================================
// 2. Evaluate Candidate Answer
// POST /api/interview/evaluate-answer
// ==========================================
router.post("/evaluate-answer", protect, async (req, res) => {
  try {
    const {
      questionText,
      question,
      candidateAnswer = "",
      userAnswer = "",
      jobRole = "Software Developer",
      difficulty = "Intermediate",
      category = "Technical",
    } = req.body;

    const resolvedQuestionText = (questionText || question || "").trim();
    if (!resolvedQuestionText) {
      return res.status(400).json({
        success: false,
        error: "Interview question text is required.",
      });
    }

    // Limit maximum length to prevent payload overflow
    const safeAnswer = String(candidateAnswer || userAnswer || "").slice(0, 4000);

    const evaluation = await evaluateInterviewAnswer({
      questionText: resolvedQuestionText,
      candidateAnswer: safeAnswer,
      jobRole: String(jobRole).slice(0, 80),
      difficulty,
      category,
    });

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    res.status(500).json({
      success: false,
      error: "Failed to evaluate answer. Please try again.",
    });
  }
});

// ==========================================
// 3. Save Completed Mock Interview
// POST /api/interview/save
// ==========================================
router.post("/save", protect, async (req, res) => {
  try {
    const {
      category = "Mixed",
      jobRole = "Software Developer",
      difficulty = "Intermediate",
      questionsCount = 5,
      questions = [],
      overallScore = 0,
      averagePostureScore = null,
      postureSummary = {},
      durationSeconds = 0,
    } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot save an interview without completed questions.",
      });
    }

    // Recalculate average score server-side to prevent tampering
    let calculatedOverall = 0;
    if (questions.length > 0) {
      const totalScore = questions.reduce((sum, q) => {
        const s = q?.evaluation?.score;
        return sum + (typeof s === "number" && !isNaN(s) ? Math.max(0, Math.min(100, s)) : 0);
      }, 0);
      calculatedOverall = Math.round(totalScore / questions.length);
    }

    const finalOverallScore = Math.max(0, Math.min(100, calculatedOverall || Number(overallScore) || 0));

    // Normalize category and difficulty to valid schema enums
    const safeCategory = ["HR", "Technical", "Mixed"].includes(category) ? category : "Mixed";
    const safeDifficulty = ["Beginner", "Intermediate", "Advanced"].includes(difficulty) ? difficulty : "Intermediate";

    // Save record to MongoDB
    const interview = await Interview.create({
      userId: req.user.id,
      category: safeCategory,
      jobRole: String(jobRole).slice(0, 100),
      difficulty: safeDifficulty,
      questionsCount: questions.length,
      questions: questions.map((q, idx) => ({
        questionId: q.questionId || idx + 1,
        questionText: (q.questionText || q.question || `Question ${idx + 1}`).trim(),
        category: q.category || "Technical",
        candidateAnswer: q.candidateAnswer || "",
        audioUsed: Boolean(q.audioUsed),
        evaluation: {
          score: q.evaluation?.score || 0,
          strengths: q.evaluation?.strengths || [],
          weaknesses: q.evaluation?.weaknesses || [],
          suggestions: q.evaluation?.suggestions || [],
          modelAnswer: q.evaluation?.modelAnswer || "",
        },
      })),
      overallScore: finalOverallScore,
      averagePostureScore: typeof averagePostureScore === "number" ? Math.max(0, Math.min(100, Math.round(averagePostureScore))) : null,
      postureSummary: {
        stabilityRating: postureSummary?.stabilityRating || "Good",
        headTiltIssuesCount: postureSummary?.headTiltIssuesCount || 0,
        leaningIssuesCount: postureSummary?.leaningIssuesCount || 0,
        framingIssuesCount: postureSummary?.framingIssuesCount || 0,
        goodPosturePercentage: postureSummary?.goodPosturePercentage ?? 100,
        feedback: Array.isArray(postureSummary?.feedback) ? postureSummary.feedback : [],
      },
      status: "completed",
      durationSeconds: Math.max(0, parseInt(durationSeconds) || 0),
    });

    // Log Activity event for the user dashboard
    try {
      await Activity.create({
        userId: req.user.id,
        activityType: "INTERVIEW_COMPLETED",
        description: `${req.user.name || "Candidate"} completed a ${difficulty} ${jobRole} mock interview (${category}) with a score of ${finalOverallScore}%`,
        metadata: {
          interviewId: interview._id,
          jobRole,
          category,
          difficulty,
          overallScore: finalOverallScore,
          averagePostureScore,
        },
      });
    } catch (actErr) {
      console.warn("Failed to log interview activity:", actErr.message);
    }

    res.status(201).json({
      success: true,
      interviewId: interview._id,
      interview,
    });
  } catch (error) {
    console.error("Error saving interview:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save completed interview record.",
    });
  }
});

// ==========================================
// 4. Get Candidate Interview History
// GET /api/interview/history
// ==========================================
router.get("/history", protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("jobRole category difficulty overallScore averagePostureScore questionsCount durationSeconds createdAt");

    res.json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    console.error("Error fetching interview history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch interview history.",
    });
  }
});

// ==========================================
// 5. Get Specific Interview Details
// GET /api/interview/:id
// ==========================================
router.get("/:id", protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: "Interview record not found.",
      });
    }

    // Security check: Candidate can only access their own interview record
    if (interview.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own interview reports.",
      });
    }

    res.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Error fetching interview detail:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load interview report.",
    });
  }
});

module.exports = router;
