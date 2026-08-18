require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const geminiRoutes = require("./routes/geminiRoutes");
const resumeRoutes = require("./routes/resume");
const mentorRoutes = require("./routes/mentor");
const mentorCandidateRoutes = require("./routes/mentorCandidate");
const jobRoutes = require("./routes/job");

// ==========================================
// ADMIN SEED
// ==========================================

const seedAdmin = require("./scripts/seedAdmin");

// ==========================================
// APP INITIALIZATION
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// CORS
// ==========================================

app.use(
  cors({
    origin: "http://localhost:5173",
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

// ------------------------------------------
// Mentor Routes
// ------------------------------------------
//
// POST /api/mentor/register
// POST /api/mentor/login
// GET  /api/mentor/profile
// GET  /api/mentor/access
//
// ------------------------------------------

app.use("/api/mentor", mentorRoutes);
app.use("/api/mentor/jobs", jobRoutes);

// ------------------------------------------
// Mentor Candidate Database Routes
// ------------------------------------------
//
// GET /api/mentor/candidates
// GET /api/mentor/candidates/:id
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
// ------------------------------------------

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