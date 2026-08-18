const User = require("../models/User");
const Mentor = require("../models/Mentor");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// ======================================================
// CHECK MENTOR CANDIDATE ACCESS
// ======================================================

const checkCandidateAccess = async (userId) => {
    const mentor = await Mentor.findOne({
        userId: userId,
    });

    if (!mentor) {
        return {
            allowed: false,
            status: 404,
            message: "Mentor profile not found.",
        };
    }

    // --------------------------------------------------
    // Verification check
    // --------------------------------------------------

    if (mentor.verificationStatus !== "approved") {
        return {
            allowed: false,
            status: 403,
            message:
                "Mentor account must be approved before accessing candidates.",
        };
    }

    // --------------------------------------------------
    // Subscription check
    // --------------------------------------------------

    const now = new Date();

    const subscriptionActive =
        mentor.subscription &&
        mentor.subscription.status === "active" &&
        mentor.subscription.expiresAt &&
        new Date(mentor.subscription.expiresAt) > now;

    if (!subscriptionActive) {
        return {
            allowed: false,
            status: 403,
            message:
                "An active subscription is required to access the candidate database.",
        };
    }

    // --------------------------------------------------
    // Candidate access flag
    // --------------------------------------------------

    if (!mentor.candidateAccess) {
        return {
            allowed: false,
            status: 403,
            message:
                "Candidate database access is currently disabled.",
        };
    }

    return {
        allowed: true,
        mentor,
    };
};

// ======================================================
// GET CANDIDATES
// GET /api/mentor/candidates
// ======================================================

const getCandidates = async (req, res) => {
    try {
        // --------------------------------------------------
        // SECURITY CHECK
        // --------------------------------------------------

        const access = await checkCandidateAccess(
            req.user._id
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        const {
            search = "",
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(
            1,
            parseInt(page) || 1
        );

        const limitNum = Math.min(
            50,
            Math.max(
                1,
                parseInt(limit) || 20
            )
        );

        // ==================================================
        // FIND NORMAL USERS ONLY
        // ==================================================

        const userFilter = {
            role: "user",
            accountStatus: "active",
        };

        // --------------------------------------------------
        // Search by name/email
        // --------------------------------------------------

        if (search.trim()) {
            userFilter.$or = [
                {
                    name: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        // ==================================================
        // GET TOTAL USERS
        // ==================================================

        const total = await User.countDocuments(
            userFilter
        );

        // ==================================================
        // GET USERS
        // ==================================================

        const users = await User.find(userFilter)
            .select(
                "_id name email accountStatus createdAt lastLogin"
            )
            .sort({
                createdAt: -1,
            })
            .skip(
                (pageNum - 1) * limitNum
            )
            .limit(limitNum);

        // ==================================================
        // GET RESUME ANALYSIS FOR THESE USERS
        // ==================================================

        const userIds = users.map(
            (user) => user._id
        );

        const resumeRecords =
            await ResumeAnalysis.find({
                userId: {
                    $in: userIds,
                },
            })
                .sort({
                    createdAt: -1,
                })
                .select(
                    "userId originalFileName overallScore contentScore atsScore formatScore grammarScore completenessScore strengths suggestions createdAt sectionAnalysis"
                );

        // ==================================================
        // CREATE LATEST RESUME MAP
        // ==================================================

        const latestResumeMap = new Map();

        for (const resume of resumeRecords) {
            const userId =
                resume.userId.toString();

            if (
                !latestResumeMap.has(userId)
            ) {
                latestResumeMap.set(
                    userId,
                    resume
                );
            }
        }

        // ==================================================
        // BUILD CANDIDATE RESPONSE
        // ==================================================

        const candidates = users.map(
            (user) => {
                const resume =
                    latestResumeMap.get(
                        user._id.toString()
                    );

                return {
                    id: user._id,

                    name: user.name,

                    email: user.email,

                    accountStatus:
                        user.accountStatus,

                    joinedAt:
                        user.createdAt,

                    lastLogin:
                        user.lastLogin,

                    hasResume:
                        !!resume,

                    resume: resume
                        ? {
                            id:
                                resume._id,

                            originalFileName:
                                resume.originalFileName,

                            overallScore:
                                resume.overallScore,

                            contentScore:
                                resume.contentScore,

                            atsScore:
                                resume.atsScore,

                            formatScore:
                                resume.formatScore,

                            grammarScore:
                                resume.grammarScore,

                            completenessScore:
                                resume.completenessScore,

                            strengths:
                                resume.strengths,

                            suggestions:
                                resume.suggestions,

                            sectionAnalysis:
                                resume.sectionAnalysis,

                            analyzedAt:
                                resume.createdAt,
                        }
                        : null,
                };
            }
        );

        // ==================================================
        // UPDATE MENTOR SEARCH INFORMATION
        // ==================================================

        access.mentor.lastCandidateSearch =
            new Date();

        await access.mentor.save();

        // ==================================================
        // RESPONSE
        // ==================================================

        return res.json({
            success: true,

            total,

            page: pageNum,

            pages: Math.ceil(
                total / limitNum
            ),

            count:
                candidates.length,

            candidates,
        });

    } catch (error) {
        console.error(
            "Mentor candidate search error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error:
                "Server error fetching candidate database.",
        });
    }
};

// ======================================================
// GET SINGLE CANDIDATE
// GET /api/mentor/candidates/:id
// ======================================================

const getCandidateById = async (
    req,
    res
) => {
    try {
        // --------------------------------------------------
        // SECURITY CHECK
        // --------------------------------------------------

        const access = await checkCandidateAccess(
            req.user._id
        );

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                error: access.message,
            });
        }

        // --------------------------------------------------
        // FIND CANDIDATE
        // --------------------------------------------------

        const candidate =
            await User.findOne({
                _id: req.params.id,
                role: "user",
                accountStatus: "active",
            }).select(
                "_id name email accountStatus createdAt lastLogin"
            );

        if (!candidate) {
            return res.status(404).json({
                success: false,
                error:
                    "Candidate not found.",
            });
        }

        // --------------------------------------------------
        // GET RESUME HISTORY
        // --------------------------------------------------

        const resumes =
            await ResumeAnalysis.find({
                userId: candidate._id,
            })
                .sort({
                    createdAt: -1,
                })
                .select(
                    "fileName originalFileName fileType fileSize overallScore contentScore atsScore formatScore grammarScore completenessScore strengths contentIssues formatIssues atsIssues grammarIssues suggestions sectionAnalysis formatAnalysis createdAt"
                );

        // --------------------------------------------------
        // UPDATE SEARCH INFORMATION
        // --------------------------------------------------

        access.mentor.lastCandidateSearch =
            new Date();

        await access.mentor.save();

        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        return res.json({
            success: true,

            candidate: {
                id: candidate._id,

                name: candidate.name,

                email: candidate.email,

                accountStatus:
                    candidate.accountStatus,

                joinedAt:
                    candidate.createdAt,

                lastLogin:
                    candidate.lastLogin,

                resumeCount:
                    resumes.length,

                resumes,
            },
        });

    } catch (error) {
        console.error(
            "Get mentor candidate error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error:
                "Server error fetching candidate.",
        });
    }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getCandidates,
    getCandidateById,
};