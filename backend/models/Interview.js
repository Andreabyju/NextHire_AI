const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true },
    questionText: { type: String, required: true },
    category: { type: String, default: "Technical" },
    candidateAnswer: { type: String, default: "" },
    audioUsed: { type: Boolean, default: false },
    evaluation: {
      score: { type: Number, default: 0 },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
      modelAnswer: { type: String, default: "" },
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["HR", "Technical", "Mixed"],
      default: "Mixed",
    },
    jobRole: {
      type: String,
      required: [true, "Job role is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    questionsCount: {
      type: Number,
      default: 5,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    overallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averagePostureScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    postureSummary: {
      stabilityRating: { type: String, default: "Good" },
      headTiltIssuesCount: { type: Number, default: 0 },
      leaningIssuesCount: { type: Number, default: 0 },
      framingIssuesCount: { type: Number, default: 0 },
      goodPosturePercentage: { type: Number, default: 100 },
      feedback: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned"],
      default: "completed",
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups: candidate's own interviews sorted newest first
interviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Interview", interviewSchema);
