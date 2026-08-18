const mongoose = require("mongoose");

// ==========================================
// MENTOR / COMPANY SCHEMA
// ==========================================
//
// This collection stores information specific
// to mentors and companies.
//
// Authentication information such as:
// - name
// - email
// - password
// - role
//
// remains inside the User collection.
//
// This model stores:
// - company information
// - mentor information
// - verification
// - subscription
// - payment/access information
//
// ==========================================

const mentorSchema = new mongoose.Schema(
    {
        // ==========================================
        // LINK TO USER ACCOUNT
        // ==========================================
        //
        // Every mentor has a corresponding User
        // account.
        //
        // User collection:
        // role = "mentor"
        //
        // Mentor collection:
        // company + subscription information
        //
        // ==========================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        // ==========================================
        // MENTOR / CONTACT PERSON
        // ==========================================

        mentorName: {
            type: String,
            required: [true, "Mentor name is required"],
            trim: true,
        },

        // ==========================================
        // COMPANY INFORMATION
        // ==========================================

        companyName: {
            type: String,
            required: [true, "Company name is required"],
            trim: true,
        },

        companyEmail: {
            type: String,
            required: [true, "Company email is required"],
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            trim: true,
            default: null,
        },

        website: {
            type: String,
            trim: true,
            default: null,
        },

        industry: {
            type: String,
            trim: true,
            default: null,
        },

        companyDescription: {
            type: String,
            trim: true,
            default: null,
        },

        // ==========================================
        // COMPANY LOCATION
        // ==========================================

        location: {
            type: String,
            trim: true,
            default: null,
        },

        // ==========================================
        // COMPANY SIZE
        // ==========================================

        companySize: {
            type: String,
            enum: [
                "1-10",
                "11-50",
                "51-200",
                "201-500",
                "501-1000",
                "1000+",
                null,
            ],
            default: null,
        },

        // ==========================================
        // VERIFICATION STATUS
        // ==========================================
        //
        // New mentors start as "pending".
        //
        // Admin can change this to:
        //
        // approved
        // rejected
        //
        // ==========================================

        verificationStatus: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
            ],
            default: "pending",
        },

        // ==========================================
        // VERIFICATION INFORMATION
        // ==========================================

        verifiedAt: {
            type: Date,
            default: null,
        },

        verificationNotes: {
            type: String,
            default: null,
        },

        // ==========================================
        // SUBSCRIPTION
        // ==========================================

        subscription: {
            // ========================================
            // PLAN
            // ========================================

            plan: {
                type: String,
                enum: [
                    "none",
                    "basic",
                    "professional",
                    "premium",
                ],
                default: "none",
            },

            // ========================================
            // STATUS
            // ========================================

            status: {
                type: String,
                enum: [
                    "inactive",
                    "active",
                    "expired",
                    "cancelled",
                ],
                default: "inactive",
            },

            // ========================================
            // PAYMENT ID
            // ========================================

            paymentId: {
                type: String,
                default: null,
            },

            // ========================================
            // SUBSCRIPTION START
            // ========================================

            startDate: {
                type: Date,
                default: null,
            },

            // ========================================
            // SUBSCRIPTION EXPIRY
            // ========================================

            expiresAt: {
                type: Date,
                default: null,
            },
        },

        // ==========================================
        // CANDIDATE ACCESS
        // ==========================================
        //
        // This controls whether the mentor can
        // access the candidate talent pool.
        //
        // This should NEVER be trusted from the
        // frontend.
        //
        // Backend will determine this based on:
        //
        // 1. Mentor verification
        // 2. Active subscription
        // 3. Payment status
        //
        // ==========================================

        candidateAccess: {
            type: Boolean,
            default: false,
        },

        // ==========================================
        // TOTAL CANDIDATE VIEWS
        // ==========================================
        //
        // Useful for future subscription limits.
        //
        // ==========================================

        candidateViews: {
            type: Number,
            default: 0,
        },

        // ==========================================
        // LAST CANDIDATE SEARCH
        // ==========================================

        lastCandidateSearch: {
            type: Date,
            default: null,
        },

        // ==========================================
        // ACCOUNT CREATION / UPDATE
        // ==========================================

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },

    {
        timestamps: true,
    }
);

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
    "Mentor",
    mentorSchema
);