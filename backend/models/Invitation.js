const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, "Invitation message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending invitations for the same candidate and job
invitationSchema.index(
  {
    candidateId: 1,
    jobId: 1,
    status: 1,
  }
);

module.exports = mongoose.model("Invitation", invitationSchema);
