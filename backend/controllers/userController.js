const User = require("../models/User");
const Activity = require("../models/Activity");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const Interview = require("../models/Interview");

// ── Helper ───────────────────────────────────────────────────────────────────
const logActivity = async (userId, activityType, description, metadata = {}) => {
  try {
    await Activity.create({ userId, activityType, description, metadata });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
};

// @desc    Get the authenticated user's own profile
// @route   GET /api/user/profile
// @access  Private (own data only — derived from JWT, not from request param)
const getProfile = async (req, res) => {
  try {
    // req.user.id comes from the JWT via authMiddleware — user cannot spoof this
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      memberSince: user.createdAt,
    });
  } catch (error) {
    console.error("getProfile error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Update the authenticated user's own profile (name only)
// @route   PATCH /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    await logActivity(req.user.id, "PROFILE_UPDATED", `${user.name} updated their profile`);

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("updateProfile error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Change the authenticated user's password
// @route   PATCH /api/user/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Fetch with password included for comparison
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    await logActivity(req.user.id, "PASSWORD_CHANGED", `${user.name} changed their password`);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("updatePassword error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get the authenticated user's own activity/history
// @route   GET /api/user/activity
// @access  Private (only returns current user's own activities)
const getMyActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    // SECURITY: filter by req.user.id — user can ONLY see their own events
    const activities = await Activity.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      count: activities.length,
      activities: activities.map((a) => ({
        id: a._id,
        activityType: a.activityType,
        description: a.description,
        timestamp: a.createdAt,
        metadata: a.metadata,
      })),
    });
  } catch (error) {
    console.error("getMyActivity error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get the authenticated user's own stats/progress
// @route   GET /api/user/stats
// @access  Private (only returns current user's own stats)
const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [loginCount, assessmentCount, resumeCount, latestResume, bestResume, interviews] = await Promise.all([
      Activity.countDocuments({ userId, activityType: "USER_LOGIN" }),
      Activity.countDocuments({ userId, activityType: "ASSESSMENT_COMPLETED" }),
      Activity.countDocuments({ userId, activityType: "RESUME_UPLOADED" }),
      ResumeAnalysis.findOne({ userId })
        .sort({ createdAt: -1 })
        .select("overallScore atsScore contentScore formatScore originalFileName createdAt"),
      ResumeAnalysis.findOne({ userId })
        .sort({ overallScore: -1 })
        .select("overallScore"),
      Interview.find({ userId }).select("overallScore averagePostureScore createdAt"),
    ]);

    const interviewCount = interviews.length;
    let averageScore = null;
    let highestScore = null;
    let averagePostureScore = null;

    if (interviewCount > 0) {
      const totalScore = interviews.reduce((sum, item) => sum + (item.overallScore || 0), 0);
      averageScore = Math.round(totalScore / interviewCount);
      highestScore = Math.max(...interviews.map((item) => item.overallScore || 0));

      const postureInterviews = interviews.filter((item) => typeof item.averagePostureScore === "number");
      if (postureInterviews.length > 0) {
        const postureSum = postureInterviews.reduce((sum, item) => sum + item.averagePostureScore, 0);
        averagePostureScore = Math.round(postureSum / postureInterviews.length);
      }
    }

    res.json({
      loginCount,
      interviewCount,
      assessmentCount,
      resumeCount,
      latestResumeScore:  latestResume?.overallScore ?? null,
      bestResumeScore:    bestResume?.overallScore ?? null,
      latestResumeAtsScore: latestResume?.atsScore ?? null,
      latestResumeFile:   latestResume?.originalFileName ?? null,
      latestResumeDate:   latestResume?.createdAt ?? null,
      averageScore,
      highestScore,
      averagePostureScore,
      overallProgress: Math.min(100, interviewCount * 10 + assessmentCount * 5 + (resumeCount > 0 ? 20 : 0)),
      technicalPerformance: averageScore || 0,
      communicationPerformance: averagePostureScore || 0,
      aptitudePerformance: bestResume?.overallScore || 0,
    });
  } catch (error) {
    console.error("getMyStats error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getProfile, updateProfile, updatePassword, getMyActivity, getMyStats };
