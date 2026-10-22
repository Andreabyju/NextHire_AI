const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    // ==========================================
    // MENTOR
    // ==========================================

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
      index: true,
    },

    // ==========================================
    // CANDIDATE
    // ==========================================

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // JOB
    // ==========================================

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    // ==========================================
    // MESSAGE FROM MENTOR
    // ==========================================

    message: {
      type: String,
      required: [true, "Invitation message is required"],
      trim: true,
    },

    // ==========================================
    // INVITATION STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },

    // ==========================================
    // MESSAGE FROM CANDIDATE
    // ==========================================

    candidateMessage: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // CANDIDATE RESPONSE DATE
    // ==========================================

    respondedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ==========================================
// PREVENT DUPLICATE INVITATIONS
// ==========================================

invitationSchema.index({
  candidateId: 1,
  jobId: 1,
  status: 1,
});

module.exports = mongoose.model(
  "Invitation",
  invitationSchema
);