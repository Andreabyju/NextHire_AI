const User = require("../models/User");
const Mentor = require("../models/Mentor");
const Activity = require("../models/Activity");

// ==========================================
// ACTIVITY LOGGER
// ==========================================

const logActivity = async (
    userId,
    activityType,
    description,
    metadata = {}
) => {
    try {
        await Activity.create({
            userId,
            activityType,
            description,
            metadata,
        });
    } catch (error) {
        console.error(
            "Admin mentor activity error:",
            error.message
        );
    }
};

// ==========================================
// GET ALL MENTORS
// GET /api/admin/mentors
// ==========================================

const getMentors = async (req, res) => {
    try {
        const {
            search = "",
            status = "",
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(
            1,
            parseInt(page) || 1
        );

        const limitNum = Math.min(
            100,
            Math.max(
                1,
                parseInt(limit) || 20
            )
        );

        // ==========================================
        // SEARCH USERS
        // ==========================================

        const userFilter = {
            role: "mentor",
        };

        if (search) {
            userFilter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        // ==========================================
        // GET MENTOR USER IDS
        // ==========================================

        const mentorUsers = await User.find(
            userFilter
        ).select("_id");

        const mentorUserIds = mentorUsers.map(
            (user) => user._id
        );

        // ==========================================
        // MENTOR FILTER
        // ==========================================

        const mentorFilter = {
            userId: {
                $in: mentorUserIds,
            },
        };

        if (
            status &&
            status !== "all"
        ) {
            mentorFilter.verificationStatus =
                status;
        }

        // ==========================================
        // GET MENTORS
        // ==========================================

        const total =
            await Mentor.countDocuments(
                mentorFilter
            );

        const mentors =
            await Mentor.find(mentorFilter)
                .populate(
                    "userId",
                    "name email role accountStatus lastLogin createdAt"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(
                    (pageNum - 1) *
                    limitNum
                )
                .limit(limitNum);

        // ==========================================
        // RESPONSE
        // ==========================================

        res.json({
            total,
            page: pageNum,
            pages: Math.ceil(
                total / limitNum
            ),
            count: mentors.length,

            mentors: mentors.map(
                (mentor) => ({
                    id: mentor._id,

                    userId:
                        mentor.userId?._id,

                    mentorName:
                        mentor.mentorName,

                    companyName:
                        mentor.companyName,

                    companyEmail:
                        mentor.companyEmail,

                    phone:
                        mentor.phone,

                    website:
                        mentor.website,

                    industry:
                        mentor.industry,

                    companyDescription:
                        mentor.companyDescription,

                    location:
                        mentor.location,

                    companySize:
                        mentor.companySize,

                    verificationStatus:
                        mentor.verificationStatus,

                    verifiedAt:
                        mentor.verifiedAt,

                    verificationNotes:
                        mentor.verificationNotes,

                    subscription:
                        mentor.subscription,

                    candidateAccess:
                        mentor.candidateAccess,

                    candidateViews:
                        mentor.candidateViews,

                    createdAt:
                        mentor.createdAt,

                    updatedAt:
                        mentor.updatedAt,

                    user: mentor.userId
                        ? {
                            id:
                                mentor.userId
                                    ._id,

                            name:
                                mentor.userId
                                    .name,

                            email:
                                mentor.userId
                                    .email,

                            role:
                                mentor.userId
                                    .role,

                            accountStatus:
                                mentor.userId
                                    .accountStatus,

                            lastLogin:
                                mentor.userId
                                    .lastLogin,

                            createdAt:
                                mentor.userId
                                    .createdAt,
                        }
                        : null,
                })
            ),
        });
    } catch (error) {
        console.error(
            "Admin getMentors error:",
            error.message
        );

        res.status(500).json({
            error:
                "Server error fetching mentors",
        });
    }
};

// ==========================================
// GET SINGLE MENTOR
// GET /api/admin/mentors/:id
// ==========================================

const getMentorById = async (
    req,
    res
) => {
    try {
        const mentor =
            await Mentor.findById(
                req.params.id
            ).populate(
                "userId",
                "name email role accountStatus lastLogin createdAt"
            );

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor not found",
            });
        }

        const activities =
            await Activity.find({
                userId:
                    mentor.userId?._id,
            })
                .sort({
                    createdAt: -1,
                })
                .limit(20);

        res.json({
            id: mentor._id,

            mentorName:
                mentor.mentorName,

            companyName:
                mentor.companyName,

            companyEmail:
                mentor.companyEmail,

            phone: mentor.phone,

            website:
                mentor.website,

            industry:
                mentor.industry,

            companyDescription:
                mentor.companyDescription,

            location:
                mentor.location,

            companySize:
                mentor.companySize,

            verificationStatus:
                mentor.verificationStatus,

            verifiedAt:
                mentor.verifiedAt,

            verificationNotes:
                mentor.verificationNotes,

            subscription:
                mentor.subscription,

            candidateAccess:
                mentor.candidateAccess,

            candidateViews:
                mentor.candidateViews,

            lastCandidateSearch:
                mentor.lastCandidateSearch,

            createdAt:
                mentor.createdAt,

            updatedAt:
                mentor.updatedAt,

            user: mentor.userId
                ? {
                    id:
                        mentor.userId
                            ._id,

                    name:
                        mentor.userId
                            .name,

                    email:
                        mentor.userId
                            .email,

                    role:
                        mentor.userId
                            .role,

                    accountStatus:
                        mentor.userId
                            .accountStatus,

                    lastLogin:
                        mentor.userId
                            .lastLogin,

                    createdAt:
                        mentor.userId
                            .createdAt,
                }
                : null,

            recentActivity:
                activities.map(
                    (activity) => ({
                        id:
                            activity._id,

                        activityType:
                            activity.activityType,

                        description:
                            activity.description,

                        timestamp:
                            activity.createdAt,

                        metadata:
                            activity.metadata,
                    })
                ),
        });
    } catch (error) {
        console.error(
            "Admin getMentorById error:",
            error.message
        );

        res.status(500).json({
            error:
                "Server error fetching mentor",
        });
    }
};

// ==========================================
// APPROVE MENTOR
// PATCH /api/admin/mentors/:id/approve
// ==========================================

const approveMentor = async (
    req,
    res
) => {
    try {
        const mentor =
            await Mentor.findById(
                req.params.id
            );

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor not found",
            });
        }

        mentor.verificationStatus =
            "approved";

        mentor.verifiedAt =
            new Date();

        mentor.verificationNotes =
            req.body.notes ||
            "Mentor approved by administrator";

        // Approval alone does NOT give
        // candidate database access.
        mentor.candidateAccess = false;

        await mentor.save();

        // ==========================================
        // LOG ACTIVITY
        // ==========================================

        await logActivity(
            mentor.userId,
            "MENTOR_APPROVED",
            `Admin approved mentor company: ${mentor.companyName}`,
            {
                mentorId:
                    mentor._id,

                companyName:
                    mentor.companyName,
            }
        );

        res.json({
            message:
                "Mentor approved successfully",

            mentor: {
                id:
                    mentor._id,

                companyName:
                    mentor.companyName,

                verificationStatus:
                    mentor.verificationStatus,

                verifiedAt:
                    mentor.verifiedAt,

                candidateAccess:
                    mentor.candidateAccess,
            },
        });
    } catch (error) {
        console.error(
            "Admin approveMentor error:",
            error.message
        );

        res.status(500).json({
            error:
                "Server error approving mentor",
        });
    }
};

// ==========================================
// REJECT MENTOR
// PATCH /api/admin/mentors/:id/reject
// ==========================================

const rejectMentor = async (
    req,
    res
) => {
    try {
        const mentor =
            await Mentor.findById(
                req.params.id
            );

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor not found",
            });
        }

        mentor.verificationStatus =
            "rejected";

        mentor.verifiedAt = null;

        mentor.verificationNotes =
            req.body.notes ||
            "Mentor application rejected by administrator";

        // Rejected mentors cannot
        // access candidates.
        mentor.candidateAccess =
            false;

        await mentor.save();

        // ==========================================
        // LOG ACTIVITY
        // ==========================================

        await logActivity(
            mentor.userId,
            "MENTOR_REJECTED",
            `Admin rejected mentor company: ${mentor.companyName}`,
            {
                mentorId:
                    mentor._id,

                companyName:
                    mentor.companyName,

                reason:
                    mentor.verificationNotes,
            }
        );

        res.json({
            message:
                "Mentor rejected successfully",

            mentor: {
                id:
                    mentor._id,

                companyName:
                    mentor.companyName,

                verificationStatus:
                    mentor.verificationStatus,

                verificationNotes:
                    mentor.verificationNotes,

                candidateAccess:
                    mentor.candidateAccess,
            },
        });
    } catch (error) {
        console.error(
            "Admin rejectMentor error:",
            error.message
        );

        res.status(500).json({
            error:
                "Server error rejecting mentor",
        });
    }
};

// ==========================================
// UPDATE MENTOR SUBSCRIPTION
// PATCH /api/admin/mentors/:id/subscription
// ==========================================

const updateMentorSubscription = async (
    req,
    res
) => {
    try {
        const {
            plan,
            status,
            paymentId,
            expiresAt,
        } = req.body;

        // ==========================================
        // VALIDATE PLAN
        // ==========================================

        const validPlans = [
            "none",
            "basic",
            "professional",
            "premium",
        ];

        if (!validPlans.includes(plan)) {
            return res.status(400).json({
                error:
                    "Invalid subscription plan",
            });
        }

        // ==========================================
        // VALIDATE STATUS
        // ==========================================

        const validStatuses = [
            "inactive",
            "active",
            "expired",
            "cancelled",
        ];

        if (
            !validStatuses.includes(status)
        ) {
            return res.status(400).json({
                error:
                    "Invalid subscription status",
            });
        }

        // ==========================================
        // FIND MENTOR
        // ==========================================

        const mentor =
            await Mentor.findById(
                req.params.id
            );

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor not found",
            });
        }

        // ==========================================
        // UPDATE SUBSCRIPTION
        // ==========================================

        mentor.subscription.plan =
            plan;

        mentor.subscription.status =
            status;

        mentor.subscription.paymentId =
            paymentId || null;

        // ==========================================
        // ACTIVE SUBSCRIPTION
        // ==========================================

        if (status === "active") {

            if (!expiresAt) {
                return res.status(400).json({
                    error:
                        "expiresAt is required for an active subscription",
                });
            }

            const expiryDate =
                new Date(expiresAt);

            if (
                isNaN(
                    expiryDate.getTime()
                )
            ) {
                return res.status(400).json({
                    error:
                        "Invalid expiresAt date",
                });
            }

            if (
                expiryDate <=
                new Date()
            ) {
                return res.status(400).json({
                    error:
                        "expiresAt must be a future date",
                });
            }

            mentor.subscription.startDate =
                mentor.subscription.startDate ||
                new Date();

            mentor.subscription.expiresAt =
                expiryDate;
        } else {

            mentor.subscription.expiresAt =
                expiresAt
                    ? new Date(expiresAt)
                    : null;
        }

        // ==========================================
        // CALCULATE CANDIDATE ACCESS
        // ==========================================

        const now =
            new Date();

        const subscriptionActive =
            mentor.subscription.status ===
            "active" &&
            mentor.subscription.expiresAt &&
            mentor.subscription.expiresAt >
            now;

        const verified =
            mentor.verificationStatus ===
            "approved";

        mentor.candidateAccess =
            verified &&
            subscriptionActive;

        // ==========================================
        // SAVE
        // ==========================================

        await mentor.save();

        // ==========================================
        // LOG ACTIVITY
        // ==========================================

        await logActivity(
            mentor.userId,
            "SUBSCRIPTION_UPDATED",
            `Admin updated subscription for ${mentor.companyName}`,
            {
                mentorId:
                    mentor._id,

                plan:
                    mentor.subscription
                        .plan,

                status:
                    mentor.subscription
                        .status,

                paymentId:
                    mentor.subscription
                        .paymentId,

                expiresAt:
                    mentor.subscription
                        .expiresAt,

                candidateAccess:
                    mentor.candidateAccess,
            }
        );

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.json({
            message:
                "Mentor subscription updated successfully",

            mentor: {
                id:
                    mentor._id,

                companyName:
                    mentor.companyName,

                verificationStatus:
                    mentor.verificationStatus,

                subscription:
                    mentor.subscription,

                candidateAccess:
                    mentor.candidateAccess,
            },
        });

    } catch (error) {

        console.error(
            "Admin updateMentorSubscription error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error updating mentor subscription",
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getMentors,
    getMentorById,
    approveMentor,
    rejectMentor,
    updateMentorSubscription,
};