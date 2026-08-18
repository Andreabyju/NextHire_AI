const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const mentorOnly = require("../middleware/mentorMiddleware");

const {
    createSubscriptionOrder,
    verifySubscriptionPayment,
    getSubscription,
} = require("../controllers/subscriptionController");

// ==========================================
// CREATE RAZORPAY TEST ORDER
// POST /api/mentor/subscription/create-order
// ==========================================

router.post(
    "/create-order",
    protect,
    mentorOnly,
    createSubscriptionOrder
);

// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/mentor/subscription/verify-payment
// ==========================================

router.post(
    "/verify-payment",
    protect,
    mentorOnly,
    verifySubscriptionPayment
);

// ==========================================
// GET SUBSCRIPTION
// GET /api/mentor/subscription
// ==========================================

router.get(
    "/",
    protect,
    mentorOnly,
    getSubscription
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;