const crypto = require("crypto");
const Razorpay = require("razorpay");

const Mentor = require("../models/Mentor");
const Activity = require("../models/Activity");

// ==========================================
// RAZORPAY INITIALIZATION
// ==========================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// SUBSCRIPTION PLANS
// ==========================================
//
// Amounts are in INR.
// Razorpay expects the amount in paise.
//
// BASIC         = ₹499
// PROFESSIONAL  = ₹999
// PREMIUM       = ₹1499
//
// ==========================================

const subscriptionPlans = {
    basic: {
        name: "Basic",
        amount: 49900,
        durationDays: 30,
    },

    professional: {
        name: "Professional",
        amount: 99900,
        durationDays: 30,
    },

    premium: {
        name: "Premium",
        amount: 149900,
        durationDays: 30,
    },
};

// ==========================================
// CREATE RAZORPAY ORDER
// POST /api/mentor/subscription/create-order
// ==========================================

const createSubscriptionOrder = async (req, res) => {
    try {
        const { plan } = req.body;

        // ==========================================
        // VALIDATE PLAN
        // ==========================================

        if (!subscriptionPlans[plan]) {
            return res.status(400).json({
                error:
                    "Invalid subscription plan. Choose basic, professional, or premium.",
            });
        }

        // ==========================================
        // FIND MENTOR
        // ==========================================

        const mentor = await Mentor.findOne({
            userId: req.user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                error: "Mentor profile not found",
            });
        }

        // ==========================================
        // CHECK ADMIN VERIFICATION
        // ==========================================

        if (mentor.verificationStatus !== "approved") {
            return res.status(403).json({
                error:
                    "Your mentor account must be approved before purchasing a subscription.",
            });
        }

        // ==========================================
        // GET PLAN INFORMATION
        // ==========================================

        const selectedPlan =
            subscriptionPlans[plan];

        // ==========================================
        // CREATE RAZORPAY ORDER
        // ==========================================

        const receipt =
            `mentor_${mentor._id}_${Date.now()}`;

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount,
            currency: "INR",
            receipt,
            notes: {
                mentorId: mentor._id.toString(),
                userId: mentor.userId.toString(),
                plan,
            },
        });

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({
            message:
                "Razorpay order created successfully",

            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },

            plan: {
                id: plan,
                name: selectedPlan.name,
                amount: selectedPlan.amount,
                durationDays:
                    selectedPlan.durationDays,
            },

            razorpayKeyId:
                process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error(
            "Create Razorpay order error:",
            error
        );

        return res.status(500).json({
            error:
                "Server error creating payment order",
        });
    }
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/mentor/subscription/verify-payment
// ==========================================

const verifySubscriptionPayment = async (
    req,
    res
) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan,
        } = req.body;

        // ==========================================
        // VALIDATE REQUIRED DATA
        // ==========================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !plan
        ) {
            return res.status(400).json({
                error:
                    "Payment verification data is incomplete",
            });
        }

        // ==========================================
        // VALIDATE PLAN
        // ==========================================

        if (!subscriptionPlans[plan]) {
            return res.status(400).json({
                error: "Invalid subscription plan",
            });
        }

        // ==========================================
        // FIND MENTOR
        // ==========================================

        const mentor = await Mentor.findOne({
            userId: req.user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor profile not found",
            });
        }

        // ==========================================
        // CHECK VERIFICATION AGAIN
        // ==========================================

        if (mentor.verificationStatus !== "approved") {
            return res.status(403).json({
                error:
                    "Your mentor account is not approved.",
            });
        }

        // ==========================================
        // VERIFY RAZORPAY SIGNATURE
        // ==========================================

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");

        const signatureValid =
            generatedSignature ===
            razorpay_signature;

        if (!signatureValid) {
            console.error(
                "❌ Invalid Razorpay payment signature"
            );

            return res.status(400).json({
                error:
                    "Payment verification failed. Invalid payment signature.",
            });
        }

        // ==========================================
        // CALCULATE SUBSCRIPTION DATES
        // ==========================================

        const startDate = new Date();

        const expiresAt = new Date(startDate);

        expiresAt.setDate(
            expiresAt.getDate() +
            subscriptionPlans[plan]
                .durationDays
        );

        // ==========================================
        // UPDATE SUBSCRIPTION
        // ==========================================

        mentor.subscription = {
            plan,

            status: "active",

            paymentId:
                razorpay_payment_id,

            startDate,

            expiresAt,
        };

        // ==========================================
        // ENABLE CANDIDATE ACCESS
        // ==========================================

        mentor.candidateAccess = true;

        await mentor.save();

        // ==========================================
        // LOG ACTIVITY
        // ==========================================

        try {
            await Activity.create({
                userId: mentor.userId,

                activityType:
                    "SUBSCRIPTION_ACTIVATED",

                description:
                    `${mentor.companyName} successfully activated the ${plan} subscription through Razorpay`,

                metadata: {
                    mentorId:
                        mentor._id,

                    plan,

                    paymentId:
                        razorpay_payment_id,

                    orderId:
                        razorpay_order_id,

                    gateway:
                        "razorpay_test",
                },
            });
        } catch (activityError) {
            console.error(
                "Subscription activity log error:",
                activityError.message
            );
        }

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({
            message:
                "Payment verified and subscription activated successfully",

            payment: {
                orderId:
                    razorpay_order_id,

                paymentId:
                    razorpay_payment_id,

                status:
                    "verified",
            },

            subscription:
                mentor.subscription,

            candidateAccess:
                mentor.candidateAccess,
        });

    } catch (error) {
        console.error(
            "Verify Razorpay payment error:",
            error
        );

        return res.status(500).json({
            error:
                "Server error verifying payment",
        });
    }
};

// ==========================================
// GET SUBSCRIPTION
// GET /api/mentor/subscription
// ==========================================

const getSubscription = async (
    req,
    res
) => {
    try {
        const mentor = await Mentor.findOne({
            userId: req.user._id,
        });

        if (!mentor) {
            return res.status(404).json({
                error:
                    "Mentor profile not found",
            });
        }

        // ==========================================
        // AUTOMATICALLY EXPIRE SUBSCRIPTION
        // ==========================================

        if (
            mentor.subscription.status ===
            "active" &&
            mentor.subscription.expiresAt &&
            new Date(
                mentor.subscription.expiresAt
            ) <= new Date()
        ) {
            mentor.subscription.status =
                "expired";

            mentor.candidateAccess = false;

            await mentor.save();
        }

        // ==========================================
        // RESPONSE
        // ==========================================

        return res.json({
            subscription:
                mentor.subscription,

            verificationStatus:
                mentor.verificationStatus,

            candidateAccess:
                mentor.candidateAccess,
        });

    } catch (error) {
        console.error(
            "Get subscription error:",
            error.message
        );

        return res.status(500).json({
            error:
                "Server error fetching subscription",
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    createSubscriptionOrder,
    verifySubscriptionPayment,
    getSubscription,
};