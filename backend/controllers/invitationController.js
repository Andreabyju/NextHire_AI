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

    // ==========================================
    // ADMIN APPROVAL CHECK
    // ==========================================

    if (mentor.verificationStatus !== "approved") {
        return {
            allowed: false,
            status: 403,
            message:
                "Your mentor account must be approved before using recruitment features.",
        };
    }

    // ==========================================
    // SUBSCRIPTION CHECK
    // ==========================================

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

    // ==========================================
    // CANDIDATE ACCESS CHECK
    // ==========================================

    if (!mentor.candidateAccess) {
        return {
            allowed: false,
            status: 403,
            message:
                "Candidate database access is currently disabled.",
        };
    }

    // ==========================================
    // PLAN CHECK
    // ==========================================

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
        const {
            candidateId,
            jobId,
            message,
        } = req.body || {};

        // ==========================================
        // VALIDATION
        // ==========================================

        if (!candidateId || !jobId || !message) {
            return res.status(400).json({
                success: false,
                error:
                    "Candidate ID, Job ID, and Message are required.",
            });
        }

        // ==========================================
        // CHECK MENTOR ACCESS
        // ==========================================

        const access = await checkRecruiterAccess(
            req.user._id
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        // ==========================================
        // CHECK CANDIDATE
        // ==========================================

        const candidate = await User.findOne({
            _id: candidateId,
            role: "user",
        });

        if (!candidate) {
            return res.status(404).json({
                success: false,
                error:
                    "Candidate not found or role is incorrect.",
            });
        }

        // ==========================================
        // CHECK JOB
        // ==========================================

        const job = await Job.findOne({
            _id: jobId,
            mentorId: access.mentor._id,
        });

        if (!job) {
            return res.status(404).json({
                success: false,
                error:
                    "Job description not found or does not belong to your account.",
            });
        }

        // ==========================================
        // PREVENT DUPLICATE PENDING INVITATION
        // ==========================================

        const existingInvite =
            await Invitation.findOne({
                candidateId,
                jobId,
                status: "pending",
            });

        if (existingInvite) {
            return res.status(409).json({
                success: false,
                error:
                    "You already have a pending invitation sent to this candidate for this job position.",
            });
        }

        // ==========================================
        // CREATE INVITATION
        // ==========================================

        const invitation =
            await Invitation.create({
                mentorId: access.mentor._id,
                candidateId,
                jobId,
                message: message.trim(),
                status: "pending",

                // Candidate has not responded yet
                candidateMessage: "",
                respondedAt: null,
            });

        // ==========================================
        // LOG MENTOR ACTIVITY
        // ==========================================

        await Activity.create({
            userId: req.user._id,
            activityType: "INVITATION_SENT",
            description:
                `Sent recruitment invitation to candidate ${candidate.name} for position: ${job.title}`,
            metadata: {
                invitationId: invitation._id,
                candidateId,
                jobId,
            },
        });

        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(201).json({
            success: true,
            message:
                "Invitation sent successfully.",
            invitation,
        });
    } catch (err) {
        console.error(
            "Error sending invitation:",
            err.message
        );

        res.status(500).json({
            success: false,
            error:
                "Server error during invitation sending.",
        });
    }
};

// ==========================================
// GET MENTOR INVITATIONS
// GET /api/mentor/invitations
// ==========================================

const getMentorInvitations = async (
    req,
    res
) => {
    try {
        // ==========================================
        // CHECK MENTOR ACCESS
        // ==========================================

        const access =
            await checkRecruiterAccess(
                req.user._id
            );

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        // ==========================================
        // GET INVITATIONS BELONGING TO THIS MENTOR
        // ==========================================

        const invitations =
            await Invitation.find({
                mentorId: access.mentor._id,
            })
                .populate(
                    "candidateId",
                    "name email"
                )
                .populate(
                    "jobId",
                    "title department location"
                )
                .sort({
                    createdAt: -1,
                });

        // ==========================================
        // FORMAT RESPONSE
        // ==========================================

        const mapped =
            invitations.map((inv) => ({
                id: inv._id,

                candidateId:
                    inv.candidateId?._id ||
                    inv.candidateId,

                name:
                    inv.candidateId?.name ||
                    "Candidate",

                email:
                    inv.candidateId?.email ||
                    "candidate@example.com",

                jobTitle:
                    inv.jobId?.title ||
                    "Job Position",

                // Mentor's original message
                message:
                    inv.message,

                // Candidate's response message
                candidateMessage:
                    inv.candidateMessage ||
                    "",

                // Invitation status
                status:
                    inv.status,

                // Invitation sent date
                createdAt:
                    inv.createdAt,

                // Candidate response date
                respondedAt:
                    inv.respondedAt ||
                    null,
            }));

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({
            success: true,
            candidates: mapped,
            invitations: mapped,
        });
    } catch (err) {
        console.error(
            "Error getting mentor invitations:",
            err.message
        );

        res.status(500).json({
            success: false,
            error:
                "Server error retrieving invitations.",
        });
    }
};

// ==========================================
// GET CANDIDATE INVITATIONS
// GET /api/user/invitations
// ==========================================

const getCandidateInvitations = async (
    req,
    res
) => {
    try {
        // ==========================================
        // ENSURE USER IS A CANDIDATE
        // ==========================================

        if (req.user.role !== "user") {
            return res.status(403).json({
                success: false,
                error:
                    "Access denied. Only candidates can view received invitations.",
            });
        }

        // ==========================================
        // GET CANDIDATE INVITATIONS
        // ==========================================

        const invitations =
            await Invitation.find({
                candidateId: req.user._id,
            })
                .populate(
                    "mentorId",
                    "mentorName companyName companyEmail"
                )
                .populate(
                    "jobId",
                    "title"
                )
                .sort({
                    createdAt: -1,
                });

        // ==========================================
        // FORMAT RESPONSE
        // ==========================================

        const mapped =
            invitations.map((inv) => ({
                id: inv._id,

                companyName:
                    inv.mentorId?.companyName ||
                    "TechNova Solutions",

                mentorName:
                    inv.mentorId?.mentorName ||
                    "Mentor",

                mentorEmail:
                    inv.mentorId?.companyEmail,

                jobTitle:
                    inv.jobId?.title ||
                    "Job Position",

                // Mentor's invitation message
                message:
                    inv.message,

                // Candidate's own previous response
                candidateMessage:
                    inv.candidateMessage ||
                    "",

                dateSent:
                    new Date(
                        inv.createdAt
                    ).toLocaleDateString(),

                status:
                    inv.status,

                respondedAt:
                    inv.respondedAt ||
                    null,
            }));

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({
            success: true,
            invitations: mapped,
        });
    } catch (err) {
        console.error(
            "Error getting candidate invitations:",
            err.message
        );

        res.status(500).json({
            success: false,
            error:
                "Server error retrieving candidate invitations.",
        });
    }
};

// ==========================================
// UPDATE INVITATION STATUS
// PATCH /api/user/invitations/:id/status
// ==========================================
//
// Candidate can:
//
// ACCEPT + SEND MESSAGE
// OR
// DECLINE
//
// ==========================================

const updateInvitationStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const {
            status,
            candidateMessage = "",
        } = req.body || {};

        // ==========================================
        // VALIDATE STATUS
        // ==========================================

        if (
            !status ||
            !["accepted", "declined"].includes(
                status
            )
        ) {
            return res.status(400).json({
                success: false,
                error:
                    "Invalid status value. Must be 'accepted' or 'declined'.",
            });
        }

        // ==========================================
        // ACCEPTED INVITATION MUST HAVE MESSAGE
        // ==========================================

        if (
            status === "accepted" &&
            (!candidateMessage ||
                !candidateMessage.trim())
        ) {
            return res.status(400).json({
                success: false,
                error:
                    "Please enter a message before accepting the invitation.",
            });
        }

        // ==========================================
        // FIND INVITATION
        // ==========================================

        const invitation =
            await Invitation.findById(id)
                .populate(
                    "jobId",
                    "title"
                )
                .populate(
                    "mentorId",
                    "mentorName companyName companyEmail"
                );

        if (!invitation) {
            return res.status(404).json({
                success: false,
                error:
                    "Invitation not found.",
            });
        }

        // ==========================================
        // VERIFY CANDIDATE OWNERSHIP
        // ==========================================

        if (
            invitation.candidateId.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                error:
                    "Not authorized to update this invitation.",
            });
        }

        // ==========================================
        // PREVENT REPEATED RESPONSE
        // ==========================================

        if (
            invitation.status !==
            "pending"
        ) {
            return res.status(400).json({
                success: false,
                error:
                    `This invitation has already been ${invitation.status}.`,
            });
        }

        // ==========================================
        // UPDATE STATUS
        // ==========================================

        invitation.status =
            status;

        // ==========================================
        // ACCEPTED
        // ==========================================

        if (
            status === "accepted"
        ) {
            invitation.candidateMessage =
                candidateMessage.trim();

            invitation.respondedAt =
                new Date();
        }

        // ==========================================
        // DECLINED
        // ==========================================

        if (
            status === "declined"
        ) {
            invitation.candidateMessage =
                "";

            invitation.respondedAt =
                new Date();
        }

        // ==========================================
        // SAVE
        // ==========================================

        await invitation.save();

        // ==========================================
        // LOG CANDIDATE ACTIVITY
        // ==========================================

        const activityType =
            status === "accepted"
                ? "INVITATION_ACCEPTED"
                : "INVITATION_DECLINED";

        await Activity.create({
            userId:
                req.user._id,

            activityType,

            description:
                `${status === "accepted"
                    ? "Accepted"
                    : "Declined"
                } recruiter invitation for position: ${invitation.jobId?.title ||
                "Job position"
                }`,

            metadata: {
                invitationId:
                    invitation._id,

                status,

                candidateMessage:
                    status === "accepted"
                        ? candidateMessage.trim()
                        : "",

                mentorId:
                    invitation
                        .mentorId?._id,
            },
        });

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({
            success: true,

            message:
                status === "accepted"
                    ? "Invitation accepted and message sent to the mentor."
                    : "Invitation declined successfully.",

            invitation: {
                id:
                    invitation._id,

                status:
                    invitation.status,

                candidateMessage:
                    invitation.candidateMessage,

                respondedAt:
                    invitation.respondedAt,
            },
        });
    } catch (err) {
        console.error(
            "Error updating invitation status:",
            err.message
        );

        res.status(500).json({
            success: false,
            error:
                "Server error updating invitation status.",
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    sendInvitation,
    getMentorInvitations,
    getCandidateInvitations,
    updateInvitationStatus,
};