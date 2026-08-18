const User = require("../models/User");
const Mentor = require("../models/Mentor");
const Activity = require("../models/Activity");
const jwt = require("jsonwebtoken");

// ==========================================
// VALIDATION PATTERNS
// ==========================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_PATTERN = /^\d{7,15}$/;

// ==========================================
// GENERATE JWT
// ==========================================

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

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
            "Mentor activity log error:",
            error.message
        );
    }
};

// ==========================================
// MENTOR REGISTRATION
// POST /api/mentor/register
// ==========================================

const registerMentor = async (req, res) => {
    try {
        const {
            mentorName,
            companyName,
            companyEmail,
            password,
            phone,
            website,
            industry,
            companyDescription,
            location,
            companySize,
        } = req.body;

        if (
            !mentorName ||
            !companyName ||
            !companyEmail ||
            !password
        ) {
            return res.status(400).json({
                error:
                    "Mentor name, company name, company email and password are required",
            });
        }

        const trimmedMentorName = mentorName.trim();
        if (trimmedMentorName.length < 2) {
            return res.status(400).json({
                error: "Mentor name must be at least 2 characters long",
            });
        }

        const trimmedCompanyName = companyName.trim();
        if (trimmedCompanyName.length < 2) {
            return res.status(400).json({
                error: "Company name must be at least 2 characters long",
            });
        }

        const normalizedEmail = companyEmail.toLowerCase().trim();

        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            return res.status(400).json({
                error: "Please provide a valid company email address",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error:
                    "Password must be at least 6 characters long",
            });
        }

        // Validate optional phone
        if (phone && phone.trim()) {
            const phoneDigits = phone.replace(/[\s\-().+]/g, "");
            if (!PHONE_DIGITS_PATTERN.test(phoneDigits)) {
                return res.status(400).json({
                    error: "Please provide a valid phone number (7–15 digits)",
                });
            }
        }

        // Validate optional website
        if (website && website.trim()) {
            try {
                const parsed = new URL(website.trim());
                if (!["http:", "https:"].includes(parsed.protocol)) {
                    return res.status(400).json({
                        error: "Website URL must start with http:// or https://",
                    });
                }
            } catch {
                return res.status(400).json({
                    error: "Please provide a valid website URL",
                });
            }
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                error:
                    "An account with this email already exists",
            });
        }

        const user = await User.create({
            name: mentorName.trim(),
            email: normalizedEmail,
            password,
            role: "mentor",
            accountStatus: "active",
        });

        const mentor = await Mentor.create({
            userId: user._id,
            mentorName: mentorName.trim(),
            companyName: companyName.trim(),
            companyEmail: normalizedEmail,

            phone: phone
                ? phone.trim()
                : null,

            website: website
                ? website.trim()
                : null,

            industry: industry
                ? industry.trim()
                : null,

            companyDescription:
                companyDescription
                    ? companyDescription.trim()
                    : null,

            location: location
                ? location.trim()
                : null,

            companySize:
                companySize || null,

            verificationStatus: "pending",

            subscription: {
                plan: "none",
                status: "inactive",
                paymentId: null,
                startDate: null,
                expiresAt: null,
            },

            candidateAccess: false,
        });

        await logActivity(
            user._id,
            "MENTOR_REGISTERED",
            `${mentorName} registered ${companyName} as a mentor company`,
            {
                companyName,
                companyEmail: normalizedEmail,
                mentorId: mentor._id,
            }
        );

        const token = generateToken(user._id);

        return res.status(201).json({
            message:
                "Mentor account created successfully. Your company is awaiting admin verification.",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
            },

            mentor: {
                id: mentor._id,
                companyName: mentor.companyName,
                mentorName: mentor.mentorName,
                verificationStatus:
                    mentor.verificationStatus,
                subscription: mentor.subscription,
                candidateAccess:
                    mentor.candidateAccess,
            },
        });

    } catch (error) {
        console.error(
            "Mentor registration error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error during mentor registration",
        });
    }
};

// ==========================================
// MENTOR LOGIN
// POST /api/mentor/login
// ==========================================

const loginMentor = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error:
                    "Please provide company email and password",
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            return res.status(400).json({
                error: "Please provide a valid email address",
            });
        }

        const user = await User.findOne({
            email: normalizedEmail,
            role: "mentor",
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                error:
                    "Invalid mentor email or password",
            });
        }

        const passwordCorrect =
            await user.matchPassword(password);

        if (!passwordCorrect) {
            return res.status(401).json({
                error:
                    "Invalid mentor email or password",
            });
        }

        if (user.accountStatus === "suspended") {
            return res.status(403).json({
                error:
                    "Your mentor account has been suspended",
            });
        }

        const mentor = await Mentor.findOne({
            userId: user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor profile not found. Please contact the administrator.",
            });
        }

        user.lastLogin = new Date();

        await user.save({
            validateBeforeSave: false,
        });

        await logActivity(
            user._id,
            "MENTOR_LOGIN",
            `${user.name} logged into the mentor portal`,
            {
                email: user.email,
                companyName: mentor.companyName,
            }
        );

        const token = generateToken(user._id);

        return res.json({
            message: "Mentor login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus:
                    user.accountStatus,
            },

            mentor: {
                id: mentor._id,
                mentorName: mentor.mentorName,
                companyName: mentor.companyName,
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
            "Mentor login error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error during mentor login",
        });
    }
};

// ==========================================
// GET MENTOR PROFILE
// GET /api/mentor/profile
// ==========================================

const getMentorProfile = async (req, res) => {
    try {
        const mentor = await Mentor.findOne({
            userId: req.user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                error: "Mentor profile not found",
            });
        }

        return res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                accountStatus:
                    req.user.accountStatus,
                lastLogin: req.user.lastLogin,
            },

            mentor: {
                id: mentor._id,
                mentorName: mentor.mentorName,
                companyName: mentor.companyName,
                companyEmail: mentor.companyEmail,
                phone: mentor.phone,
                website: mentor.website,
                industry: mentor.industry,
                companyDescription:
                    mentor.companyDescription,
                location: mentor.location,
                companySize: mentor.companySize,

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
            },
        });

    } catch (error) {
        console.error(
            "Get mentor profile error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error fetching mentor profile",
        });
    }
};

// ==========================================
// GET MENTOR ACCESS STATUS
// GET /api/mentor/access
// ==========================================

const getMentorAccessStatus = async (
    req,
    res
) => {
    try {
        const mentor = await Mentor.findOne({
            userId: req.user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                error: "Mentor profile not found",
            });
        }

        const now = new Date();

        const subscriptionActive =
            mentor.subscription.status === "active" &&
            mentor.subscription.expiresAt &&
            new Date(
                mentor.subscription.expiresAt
            ) > now;

        const verified =
            mentor.verificationStatus === "approved";

        const hasCandidateAccess =
            verified && subscriptionActive;

        if (
            mentor.candidateAccess !==
            hasCandidateAccess
        ) {
            mentor.candidateAccess =
                hasCandidateAccess;

            await mentor.save();
        }

        return res.json({
            verificationStatus:
                mentor.verificationStatus,

            subscription: {
                plan:
                    mentor.subscription.plan,

                status:
                    mentor.subscription.status,

                startDate:
                    mentor.subscription.startDate,

                expiresAt:
                    mentor.subscription.expiresAt,
            },

            candidateAccess:
                hasCandidateAccess,

            reason:
                !verified
                    ? "Mentor account is awaiting admin verification"
                    : !subscriptionActive
                        ? "An active subscription is required to access the candidate database"
                        : "Candidate access is active",
        });

    } catch (error) {
        console.error(
            "Mentor access status error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error checking mentor access",
        });
    }
};

// ==========================================
// RESET MENTOR PASSWORD
// POST /api/mentor/reset-password
// ==========================================
//
// TEMPORARY DEVELOPMENT ENDPOINT
//
// Use only during development.
// Remove this endpoint before production.
//

const resetMentorPassword = async (
    req,
    res
) => {
    try {
        const {
            email,
            newPassword,
        } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                error:
                    "Email and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error:
                    "Password must be at least 6 characters long",
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail,
            role: "mentor",
        }).select("+password");

        if (!user) {
            return res.status(404).json({
                error:
                    "Mentor account not found",
            });
        }

        user.password = newPassword;

        // User.js pre-save middleware will hash
        // this password automatically.
        await user.save();

        await logActivity(
            user._id,
            "MENTOR_PASSWORD_RESET",
            `${user.name} reset their mentor account password`,
            {
                email: user.email,
            }
        );

        return res.json({
            message:
                "Mentor password reset successfully",

            email: user.email,

            passwordReset: true,
        });

    } catch (error) {
        console.error(
            "Mentor password reset error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error resetting mentor password",
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    registerMentor,
    loginMentor,
    getMentorProfile,
    getMentorAccessStatus,
    resetMentorPassword,
};