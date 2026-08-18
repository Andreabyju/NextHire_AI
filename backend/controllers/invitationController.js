const Mentor = require("../models/Mentor");
const User = require("../models/User");
const Job = require("../models/Job");
const Invitation = require("../models/Invitation");
const Activity = require("../models/Activity");

// ==========================================
// CHECK RECRUITER ACCESS
// ==========================================

const checkRecruiterAccess = async (userId) => {
    const mentor = await Mentor.findOne({
        userId,
    });

    if (!mentor) {
        return {
            allowed: false,
            status: 404,
            message: "Mentor profile not found.",
        };
    }

    if (mentor.verificationStatus !== "approved") {
        return {
            allowed: false,
            status: 403,
            message:
                "Your mentor account must be approved before using recruitment features.",
        };
    }

    const subscriptionActive =
        mentor.subscription &&
        mentor.subscription.status === "active" &&
        mentor.subscription.expiresAt &&
        new Date(mentor.subscription.expiresAt) > new Date();

    if (!subscriptionActive) {
        return {
            allowed: false,
            status: 403,
            message:
                "An active subscription is required to use recruitment features.",
        };
    }

    if (!mentor.candidateAccess) {
        return {
            allowed: false,
            status: 403,
            message:
                "Candidate database access is currently disabled.",
        };
    }

    // Professional & Premium can send invitations
    if (
        !["professional", "premium"].includes(
            mentor.subscription.plan
        )
    ) {
        return {
            allowed: false,
            status: 403,
            message:
                "Sending invitations is available on Professional and Premium plans.",
        };
    }

    return {
        allowed: true,
        mentor,
    };
};

// ==========================================
// SEND INVITATION
// POST /api/mentor/invitations
// ==========================================

const sendInvitation = async (req, res) => {
    try {
        const { candidateId, jobId, message } = req.body || {};

        if (!candidateId || !jobId || !message) {
            return res.status(400).json({
                success: false,
                error: "Candidate ID, Job ID, and Message are required.",
            });
        }

        const access = await checkRecruiterAccess(req.user._id);

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        // Check candidate/user exists
        const candidate = await User.findOne({
            _id: candidateId,
            role: "user",
        });

        if (!candidate) {
            return res.status(444).json({
                success: false,
                error: "Candidate not found or role is incorrect.",
            });
        }

        // Check job exists and belongs to this mentor
        const job = await Job.findOne({
            _id: jobId,
            mentorId: access.mentor._id,
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                error: "Job description not found or does not belong to your account.",
            });
        }

        // Prevent duplicate pending invitation for the same candidate and job
        const existingInvite = await Invitation.findOne({
            candidateId,
            jobId,
            status: "pending",
        });

        if (existingInvite) {
            return res.status(409).json({
                success: false,
                error: "You already have a pending invitation sent to this candidate for this job position.",
            });
        }

        // Create Invitation
        const invitation = await Invitation.create({
            mentorId: access.mentor._id,
            candidateId,
            jobId,
            message,
            status: "pending",
        });

        // Log Recruiter Activity
        await Activity.create({
            userId: req.user._id,
            activityType: "INVITATION_SENT",
            description: `Sent recruitment invitation to candidate ${candidate.name} for position: ${job.title}`,
            metadata: {
                invitationId: invitation._id,
                candidateId,
                jobId,
            },
        });

        res.status(201).json({
            success: true,
            message: "Invitation sent successfully.",
            invitation,
        });
    } catch (err) {
        console.error("Error sending invitation:", err.message);
        res.status(500).json({
            success: false,
            error: "Server error during invitation sending.",
        });
    }
};

// ==========================================
// GET MENTOR INVITATIONS (Recruiter sent)
// GET /api/mentor/invitations
// ==========================================

const getMentorInvitations = async (req, res) => {
    try {
        const access = await checkRecruiterAccess(req.user._id);

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        const invitations = await Invitation.find({
            mentorId: access.mentor._id,
        })
            .populate("candidateId", "name email")
            .populate("jobId", "title department location")
            .sort({ createdAt: -1 });

        // Transform payload to match what frontend expects
        const mapped = invitations.map((inv) => ({
            id: inv._id,
            candidateId: inv.candidateId?._id || inv.candidateId,
            name: inv.candidateId?.name || "George",
            email: inv.candidateId?.email || "george@example.com",
            jobTitle: inv.jobId?.title || "Software Engineer",
            message: inv.message,
            status: inv.status,
            createdAt: inv.createdAt,
        }));

        res.json({
            success: true,
            candidates: mapped,
            invitations: mapped,
        });
    } catch (err) {
        console.error("Error getting mentor invitations:", err.message);
        res.status(500).json({
            success: false,
            error: "Server error retrieving invitations.",
        });
    }
};

// ==========================================
// GET CANDIDATE INVITATIONS (Candidate received)
// GET /api/user/invitations
// ==========================================

const getCandidateInvitations = async (req, res) => {
    try {
        // Ensure user is candidate (role="user")
        if (req.user.role !== "user") {
            return res.status(403).json({
                success: false,
                error: "Access denied. Only candidates can view received invitations.",
            });
        }

        const invitations = await Invitation.find({
            candidateId: req.user._id,
        })
            .populate("mentorId", "mentorName companyName companyEmail")
            .populate("jobId", "title")
            .sort({ createdAt: -1 });

        const mapped = invitations.map((inv) => ({
            id: inv._id,
            companyName: inv.mentorId?.companyName || "TechNova Solutions",
            mentorName: inv.mentorId?.mentorName || "Sarah Jenkins",
            mentorEmail: inv.mentorId?.companyEmail,
            jobTitle: inv.jobId?.title || "Backend Engineer",
            message: inv.message,
            dateSent: new Date(inv.createdAt).toLocaleDateString(),
            status: inv.status,
        }));

        res.json({
            success: true,
            invitations: mapped,
        });
    } catch (err) {
        console.error("Error getting candidate invitations:", err.message);
        res.status(500).json({
            success: false,
            error: "Server error retrieving candidate invitations.",
        });
    }
};

// ==========================================
// UPDATE INVITATION STATUS
// PATCH /api/user/invitations/:id/status
// ==========================================

const updateInvitationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        if (!status || !["accepted", "declined"].includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Invalid status value. Must be 'accepted' or 'declined'.",
            });
        }

        // Find invitation
        const invitation = await Invitation.findById(id).populate("jobId", "title");

        if (!invitation) {
            return res.status(404).json({
                success: false,
                error: "Invitation not found.",
            });
        }

        // Verify ownership
        if (invitation.candidateId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "Not authorized to update this invitation.",
            });
        }

        // Update status
        invitation.status = status;
        await invitation.save();

        // Log Candidate Activity
        const activityType = status === "accepted" ? "INVITATION_ACCEPTED" : "INVITATION_DECLINED";
        await Activity.create({
            userId: req.user._id,
            activityType,
            description: `${status === "accepted" ? "Accepted" : "Declined"} recruiter invitation for position: ${invitation.jobId?.title || "Job position"}`,
            metadata: {
                invitationId: invitation._id,
                status,
            },
        });

        res.json({
            success: true,
            message: `Invitation successfully ${status}.`,
            invitation,
        });
    } catch (err) {
        console.error("Error updating invitation status:", err.message);
        res.status(500).json({
            success: false,
            error: "Server error updating invitation status.",
        });
    }
};

module.exports = {
    sendInvitation,
    getMentorInvitations,
    getCandidateInvitations,
    updateInvitationStatus,
};
