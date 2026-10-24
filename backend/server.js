require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const adminMentorRoutes = require("./routes/adminMentor");
const userRoutes = require("./routes/user");
const geminiRoutes = require("./routes/geminiRoutes");
const resumeRoutes = require("./routes/resume");
const mentorRoutes = require("./routes/mentor");
const mentorCandidateRoutes = require("./routes/mentorCandidate");
const jobRoutes = require("./routes/job");
const shortlistRoutes = require("./routes/shortlist");
const interviewRoutes = require("./routes/interview");

// ==========================================
// ADMIN SEED
// ==========================================

const seedAdmin = require("./scripts/seedAdmin");

// ==========================================
// APP INITIALIZATION
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


// ==========================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

// ------------------------------------------
// Authentication Routes
// ------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/api/auth", authRoutes);

// ------------------------------------------
// Admin Routes
// ------------------------------------------

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);
app.use("/api/api/admin", adminRoutes);

app.use("/api/admin/mentors", adminMentorRoutes);
app.use("/admin/mentors", adminMentorRoutes);
app.use("/api/api/admin/mentors", adminMentorRoutes);

// ------------------------------------------
// User Routes
// ------------------------------------------

app.use("/api/user", userRoutes);
app.use("/user", userRoutes);
app.use("/api/api/user", userRoutes);

// ------------------------------------------
// Gemini AI Routes
// ------------------------------------------

app.use("/api/gemini", geminiRoutes);
app.use("/gemini", geminiRoutes);
app.use("/api/api/gemini", geminiRoutes);

// ------------------------------------------
// Resume Routes
// ------------------------------------------

app.use("/api/resume", resumeRoutes);
app.use("/resume", resumeRoutes);
app.use("/api/api/resume", resumeRoutes);

// ------------------------------------------
// Mentor Routes
// ------------------------------------------

app.use("/api/mentor", mentorRoutes);
app.use("/mentor", mentorRoutes);
app.use("/api/api/mentor", mentorRoutes);

app.use("/api/mentor/jobs", jobRoutes);
app.use("/mentor/jobs", jobRoutes);
app.use("/api/api/mentor/jobs", jobRoutes);

app.use("/api/mentor/shortlists", shortlistRoutes);
app.use("/mentor/shortlists", shortlistRoutes);
app.use("/api/api/mentor/shortlists", shortlistRoutes);

app.use("/api/mentor/candidates", mentorCandidateRoutes);
app.use("/mentor/candidates", mentorCandidateRoutes);
app.use("/api/api/mentor/candidates", mentorCandidateRoutes);

// ------------------------------------------
// Interview Routes
// ------------------------------------------

app.use("/api/interview", interviewRoutes);
app.use("/interview", interviewRoutes);
app.use("/api/api/interview", interviewRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NextHire AI backend is running 🚀",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

// ==========================================
// START SERVER
// ==========================================
//
// 1. Connect MongoDB
// 2. Seed admin
// 3. Start Express
//
// ==========================================

const startServer = async () => {
  try {
    // ========================================
    // CONNECT TO MONGODB
    // ========================================

    await connectDB();

    // ========================================
    // SEED ADMIN
    // ========================================

    await seedAdmin();

    // ========================================
    // START EXPRESS SERVER
    // ========================================

    app.listen(PORT, () => {
      console.log(
        `✅ NextHire AI backend running on http://localhost:${PORT}`
      );

      console.log(
        `✅ Mentor API available at http://localhost:${PORT}/api/mentor`
      );

      console.log(
        `✅ Admin Mentor API available at http://localhost:${PORT}/api/admin/mentors`
      );

      console.log(
        `✅ Mentor Subscription API available at http://localhost:${PORT}/api/mentor/subscription`
      );

      console.log(
        `✅ Mentor Candidate API available at http://localhost:${PORT}/api/mentor/candidates`
      );

      console.log(
        `✅ Mentor Shortlist API available at http://localhost:${PORT}/api/mentor/shortlists`
      );
    });
  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};

// ==========================================
// RUN SERVER
// ==========================================

startServer();