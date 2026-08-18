const Mentor = require("../models/Mentor");
const User = require("../models/User");
const Shortlist = require("../models/Shortlist");
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

    // Basic does not get shortlisting
    if (
        !["professional", "premium"].includes(
            mentor.subscription.plan
        )
    ) {
        return {
            allowed: false,
            status: 403,
            message:
                "Shortlisting is available on Professional and Premium plans.",
        };
    }

    return {
        allowed: true,
        mentor,
    };
};

// ==========================================
// SHORTLIST CANDIDATE
// POST /api/mentor/shortlists/:candidateId
// ==========================================

const shortlistCandidate = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { notes = "" } = req.body || {};

        const access = await checkRecruiterAccess(
            req.user._id
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        // Check candidate
        const candidate = await User.findOne({
            _id: candidateId,
            role: "user",
            accountStatus: "active",
        });

        if (!candidate) {
            return res.status(404).json({
                success: false,
                error: "Candidate not found.",
            });
        }

        // Check existing shortlist
        let shortlist = await Shortlist.findOne({
            mentorId: access.mentor._id,
            candidateId: candidate._id,
        });

        if (shortlist) {
            if (shortlist.status === "active") {
                return res.status(409).json({
                    success: false,
                    error:
                        "Candidate is already in your shortlist.",
                    shortlist,
                });
            }

            // Reactivate a previously removed shortlist
            shortlist.status = "active";
            shortlist.notes = notes.trim();

            await shortlist.save();
        } else {
            shortlist = await Shortlist.create({
                mentorId: access.mentor._id,
                candidateId: candidate._id,
                status: "active",
                notes: notes.trim(),
            });
        }

        await Activity.create({
            userId: access.mentor.userId,
            activityType: "CANDIDATE_SHORTLISTED",
            description:
                `${access.mentor.companyName} shortlisted candidate ${candidate.name}`,
            metadata: {
                mentorId: access.mentor._id,
                candidateId: candidate._id,
                shortlistId: shortlist._id,
            },
        });

        return res.status(201).json({
            success: true,
            message:
                "Candidate added to your shortlist.",
            shortlist: {
                id: shortlist._id,
                candidateId: candidate._id,
                candidateName: candidate.name,
                status: shortlist.status,
                notes: shortlist.notes,
                createdAt: shortlist.createdAt,
            },
        });
    } catch (error) {
        console.error(
            "Shortlist candidate error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error:
                "Server error shortlisting candidate.",
        });
    }
};

// ==========================================
// REMOVE FROM SHORTLIST
// DELETE /api/mentor/shortlists/:candidateId
// ==========================================

const removeFromShortlist = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const mentor = await Mentor.findOne({
            userId: req.user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: "Mentor profile not found.",
            });
        }

        const shortlist = await Shortlist.findOne({
            mentorId: mentor._id,
            candidateId,
            status: "active",
        });

        if (!shortlist) {
            return res.status(404).json({
                success: false,
                error:
                    "Candidate is not in your shortlist.",
            });
        }

        shortlist.status = "removed";

        await shortlist.save();

        return res.json({
            success: true,
            message:
                "Candidate removed from shortlist.",
        });
    } catch (error) {
        console.error(
            "Remove shortlist error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error:
                "Server error removing candidate from shortlist.",
        });
    }
};

// ==========================================
// GET MENTOR SHORTLIST
// GET /api/mentor/shortlists
// ==========================================

const getShortlistedCandidates = async (
    req,
    res
) => {
    try {
        const access = await checkRecruiterAccess(
            req.user._id
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        const shortlists =
            await Shortlist.find({
                mentorId: access.mentor._id,
                status: "active",
            })
                .populate(
                    "candidateId",
                    "name email accountStatus createdAt lastLogin"
                )
                .sort({
                    createdAt: -1,
                });

        return res.json({
            success: true,
            count: shortlists.length,

            candidates: shortlists
                .filter(
                    (item) => item.candidateId
                )
                .map((item) => ({
                    shortlistId: item._id,
                    candidateId:
                        item.candidateId._id,
                    name: item.candidateId.name,
                    email:
                        item.candidateId.email,
                    accountStatus:
                        item.candidateId.accountStatus,
                    joinedAt:
                        item.candidateId.createdAt,
                    lastLogin:
                        item.candidateId.lastLogin,
                    notes: item.notes,
                    shortlistedAt:
                        item.createdAt,
                })),
        });
    } catch (error) {
        console.error(
            "Get shortlist error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error:
                "Server error fetching shortlisted candidates.",
        });
    }
};

module.exports = {
    shortlistCandidate,
    removeFromShortlist,
    getShortlistedCandidates,
};