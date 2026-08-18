const mongoose = require("mongoose");

// Supported activity types
const ACTIVITY_TYPES = [
  "USER_REGISTERED",
  "USER_LOGIN",
  "USER_LOGOUT",
  "INTERVIEW_STARTED",
  "INTERVIEW_COMPLETED",
  "ASSESSMENT_COMPLETED",
  "RESUME_UPLOADED",
  "PROFILE_UPDATED",
  "PASSWORD_CHANGED",
  "MENTOR_REGISTERED",
  "MENTOR_LOGIN",
  "MENTOR_APPROVED",
  "MENTOR_REJECTED",
  "SUBSCRIPTION_ACTIVATED",
  "JOB_CREATED",
  "JOB_DELETED",
  "CANDIDATE_MATCHED",
  "INVITATION_SENT",
  "INVITATION_ACCEPTED",
  "INVITATION_DECLINED",
];

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityType: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt = timestamp of the event
  }
);

// Index for fast lookups by user and by time
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
