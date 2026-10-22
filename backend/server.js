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
// Normal Authentication
// ------------------------------------------

app.use("/api/auth", authRoutes);

// ------------------------------------------
// Admin Routes
// ------------------------------------------

app.use("/api/admin", adminRoutes);
app.use("/api/admin/mentors", adminMentorRoutes);

// ------------------------------------------
// Normal User Routes
// ------------------------------------------

app.use("/api/user", userRoutes);

// ------------------------------------------
// Gemini AI Routes
// ------------------------------------------

app.use("/api/gemini", geminiRoutes);

// ------------------------------------------
// Resume Routes
// ------------------------------------------

app.use("/api/resume", resumeRoutes);

// ==========================================
// MENTOR ROUTES
// ==========================================
//
// POST /api/mentor/register
// POST /api/mentor/login
// GET  /api/mentor/profile
// GET  /api/mentor/access
//
// ==========================================

app.use("/api/mentor", mentorRoutes);

// ==========================================
// MENTOR JOB ROUTES
// ==========================================
//
// GET    /api/mentor/jobs
// POST   /api/mentor/jobs
// DELETE /api/mentor/jobs/:id
//
// ==========================================

app.use("/api/mentor/jobs", jobRoutes);

// ==========================================
// MENTOR SHORTLIST ROUTES
// ==========================================
//
// GET    /api/mentor/shortlists
// POST   /api/mentor/shortlists/:candidateId
// DELETE /api/mentor/shortlists/:candidateId
//
// ==========================================

app.use("/api/mentor/shortlists", shortlistRoutes);

// ==========================================
// MENTOR CANDIDATE DATABASE ROUTES
// ==========================================
//
// GET /api/mentor/candidates
// GET /api/mentor/candidates/:id
// POST /api/mentor/candidates/:id/match
//
// Security:
//
// JWT authentication
//        ↓
// mentor role
//        ↓
// admin approved
//        ↓
// active subscription
//        ↓
// candidate access
//
// ==========================================

app.use(
  "/api/mentor/candidates",
  mentorCandidateRoutes
);

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