const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    // Reference to the authenticated user who uploaded the resume
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // File metadata
    originalFileName: { type: String, required: true },
    fileName:         { type: String, required: true },
    fileType:         { type: String, required: true },
    fileSize:         { type: Number, required: true },

    // Top-level scores (as returned by Gemini)
    overallScore:      { type: Number, default: 0 },
    contentScore:      { type: Number, default: 0 },
    atsScore:          { type: Number, default: 0 },
    formatScore:       { type: Number, default: 0 },
    grammarScore:      { type: Number, default: 0 },
    completenessScore: { type: Number, default: 0 },

    // Detailed Gemini analysis fields
    sectionAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    strengths:       { type: [String], default: [] },
    contentIssues:   { type: [String], default: [] },
    formatIssues:    { type: [String], default: [] },
    atsIssues:       { type: [String], default: [] },
    grammarIssues:   { type: [String], default: [] },
    suggestions:     { type: [String], default: [] },

    // PDF format analysis (null for DOCX)
    formatAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true, // createdAt = time of upload + analysis
  }
);

// Fast lookups: user's own history sorted by newest first
resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });
// Admin-side global queries
resumeAnalysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
