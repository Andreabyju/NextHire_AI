const express = require("express");
const multer = require("multer");
const path = require("path");

const extractResumeText = require("../services/resumeParser");
const { analyzePDFFormat } = require("../services/formatAnalyzer");
const { analyzeResume } = require("../services/geminiService");
const protect = require("../middleware/authMiddleware");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const Activity = require("../models/Activity");

const router = express.Router();

// ==========================================
// Multer Storage Configuration
// ==========================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads"));
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    },
});

// ==========================================
// File Type Validation
// ==========================================

const fileFilter = function (req, file, cb) {
    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only PDF and DOCX files are allowed."),
            false
        );
    }
};

// ==========================================
// Multer Configuration
// ==========================================

const upload = multer({
    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

// ==========================================
// RESUME UPLOAD + AI ANALYSIS
// POST /api/resume/upload  (requires auth)
// ==========================================

router.post(
    "/upload",
    protect,
    upload.single("resume"),
    async (req, res) => {
        try {

            // ==========================================
            // Check file
            // ==========================================

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please upload a PDF or DOCX resume.",
                });
            }

            console.log(
                "📄 Resume uploaded:",
                req.file.originalname
            );

            // ==========================================
            // STEP 1: Extract Resume Text
            // ==========================================

            console.log(
                "📖 Extracting resume text..."
            );

            const resumeText =
                await extractResumeText(
                    req.file.path,
                    req.file.mimetype
                );

            if (
                !resumeText ||
                resumeText.length < 20
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Unable to extract enough text from the resume. Please upload a text-based PDF or DOCX file.",
                });
            }

            console.log(
                "✅ Resume text extracted successfully."
            );

            // ==========================================
            // STEP 2: Format Analysis
            // ==========================================

            let formatAnalysis = null;

            // Format analyzer currently works with PDFs.
            // DOCX files will still go through Gemini analysis.

            if (
                req.file.mimetype ===
                "application/pdf"
            ) {
                console.log(
                    "📐 Analyzing resume format..."
                );

                formatAnalysis =
                    await analyzePDFFormat(
                        req.file.path,
                        resumeText
                    );

                console.log(
                    "✅ Resume format analysis completed."
                );
            } else {
                console.log(
                    "ℹ️ Format analyzer currently supports PDF files. Skipping PDF format analysis for DOCX."
                );
            }

            // ==========================================
            // STEP 3: Gemini AI Analysis
            // ==========================================

            console.log(
                "🤖 Sending resume to Gemini AI..."
            );

            const analysis =
                await analyzeResume(
                    resumeText
                );

            console.log(
                "✅ Gemini resume analysis completed."
            );

            // ==========================================
            // STEP 4: Save Analysis to MongoDB
            // ==========================================

            let savedRecord = null;
            try {
                savedRecord = await ResumeAnalysis.create({
                    userId:           req.user._id,
                    originalFileName: req.file.originalname,
                    fileName:         req.file.filename,
                    fileType:         req.file.mimetype,
                    fileSize:         req.file.size,
                    overallScore:     analysis.overallScore,
                    contentScore:     analysis.contentScore,
                    atsScore:         analysis.atsScore,
                    formatScore:      analysis.formatScore,
                    grammarScore:     analysis.grammarScore,
                    completenessScore: analysis.completenessScore,
                    sectionAnalysis:  analysis.sectionAnalysis,
                    strengths:        analysis.strengths || [],
                    contentIssues:    analysis.contentIssues || [],
                    formatIssues:     analysis.formatIssues || [],
                    atsIssues:        analysis.atsIssues || [],
                    grammarIssues:    analysis.grammarIssues || [],
                    suggestions:      analysis.suggestions || [],
                    formatAnalysis:   formatAnalysis,
                });

                // Log activity
                await Activity.create({
                    userId:       req.user._id,
                    activityType: "RESUME_UPLOADED",
                    description:  `${req.user.name} analyzed their resume: ${req.file.originalname}`,
                    metadata: {
                        originalFileName: req.file.originalname,
                        overallScore:     analysis.overallScore,
                        analysisId:       savedRecord._id,
                    },
                });

                console.log("✅ Analysis saved to MongoDB.");
            } catch (saveErr) {
                // Don't fail the request if DB save fails — still return the analysis
                console.error("⚠️ Failed to save analysis to MongoDB:", saveErr.message);
            }

            // ==========================================
            // STEP 5: Return Combined Result
            // ==========================================

            res.status(200).json({
                success: true,

                message:
                    "Resume uploaded and analyzed successfully!",

                analysisId: savedRecord?._id || null,

                file: {
                    originalName:
                        req.file.originalname,

                    fileName:
                        req.file.filename,

                    fileType:
                        req.file.mimetype,

                    size:
                        req.file.size,
                },

                analysis: analysis,

                formatAnalysis:
                    formatAnalysis,
            });

        } catch (error) {

            console.error(
                "❌ Resume analysis error:",
                error
            );

            res.status(500).json({
                success: false,

                message:
                    "Resume analysis failed.",

                error:
                    error.message,
            });
        }
    }
);

// ==========================================
// GET USER'S OWN RESUME HISTORY
// GET /api/resume/history  (requires auth)
// ==========================================

router.get("/history", protect, async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

        const [records, total] = await Promise.all([
            ResumeAnalysis.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select(
                    "originalFileName fileType fileSize overallScore contentScore atsScore formatScore grammarScore completenessScore createdAt"
                ),
            ResumeAnalysis.countDocuments({ userId: req.user._id }),
        ]);

        res.json({
            total,
            page,
            pages: Math.ceil(total / limit),
            count: records.length,
            records: records.map((r) => ({
                id:               r._id,
                originalFileName: r.originalFileName,
                fileType:         r.fileType,
                fileSize:         r.fileSize,
                overallScore:     r.overallScore,
                contentScore:     r.contentScore,
                atsScore:         r.atsScore,
                formatScore:      r.formatScore,
                grammarScore:     r.grammarScore,
                completenessScore: r.completenessScore,
                createdAt:        r.createdAt,
            })),
        });
    } catch (error) {
        console.error("Resume history error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch resume history." });
    }
});

// ==========================================
// GET SINGLE ANALYSIS RECORD (own only)
// GET /api/resume/history/:id  (requires auth)
// ==========================================

router.get("/history/:id", protect, async (req, res) => {
    try {
        const record = await ResumeAnalysis.findOne({
            _id:    req.params.id,
            userId: req.user._id,   // SECURITY: user can only access their own record
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Analysis record not found.",
            });
        }

        res.json({ success: true, record });
    } catch (error) {
        console.error("Resume history fetch error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch analysis record." });
    }
});

// ==========================================
// DOWNLOAD RESUME FILE (secure)
// GET /api/resume/download/:filename
// ==========================================

router.get("/download/:filename", protect, async (req, res) => {
    try {
        const { filename } = req.params;

        // 1. Find the resume analysis record in DB
        const record = await ResumeAnalysis.findOne({ fileName: filename });
        if (!record) {
            return res.status(404).json({ success: false, message: "Resume file not found." });
        }

        // 2. Access control check
        let isAuthorized = false;

        // Admin: always allowed
        if (req.user.role === "admin") {
            isAuthorized = true;
        }
        // User/Candidate: only allowed to download their own resume
        else if (req.user.role === "user") {
            if (record.userId.toString() === req.user._id.toString()) {
                isAuthorized = true;
            }
        }
        // Mentor: allowed if they have candidate database access & professional/premium subscription
        else if (req.user.role === "mentor") {
            const Mentor = require("../models/Mentor");
            const mentor = await Mentor.findOne({ userId: req.user._id });
            
            const now = new Date();
            const subscriptionActive =
                mentor &&
                mentor.verificationStatus === "approved" &&
                mentor.subscription &&
                mentor.subscription.status === "active" &&
                mentor.subscription.expiresAt &&
                new Date(mentor.subscription.expiresAt) > now &&
                mentor.candidateAccess;

            const plan = mentor?.subscription?.plan;
            const hasEligiblePlan = ["professional", "premium"].includes(plan);

            if (subscriptionActive && hasEligiblePlan) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: "Access denied. Eligible subscription or ownership required." });
        }

        // 3. Resolve file path and send file
        const filePath = path.join(__dirname, "../uploads", filename);
        
        // Check if file exists on disk
        const fs = require("fs");
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: "Physical file not found on server." });
        }

        // Set attachment header with original filename
        res.setHeader("Content-Disposition", `attachment; filename="${record.originalFileName}"`);
        return res.sendFile(filePath);

    } catch (error) {
        console.error("Resume download error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to download file." });
    }
});

module.exports = router;