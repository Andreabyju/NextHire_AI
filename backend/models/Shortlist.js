const mongoose = require("mongoose");

const shortlistSchema = new mongoose.Schema(
    {
        // Mentor who shortlisted the candidate
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mentor",
            required: true,
            index: true,
        },

        // Candidate/User being shortlisted
        candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["active", "removed"],
            default: "active",
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate active shortlist entries
shortlistSchema.index(
    {
        mentorId: 1,
        candidateId: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "Shortlist",
    shortlistSchema
);