const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// PROTECT ROUTES
// ==========================================
// Verifies JWT and attaches the authenticated
// user to req.user.
//
// Usage:
//
// router.get("/profile", protect, controller);
//
// ==========================================

const protect = async (req, res, next) => {
  try {
    // ==========================================
    // GET AUTHORIZATION HEADER
    // ==========================================

    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        error: "Not authorized, no token",
      });
    }

    // ==========================================
    // EXTRACT TOKEN
    // ==========================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Not authorized, no token",
      });
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(decoded.id)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        error: "User no longer exists",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        error: "Your account has been suspended",
      });
    }

    // ==========================================
    // ATTACH USER TO REQUEST
    // ==========================================

    req.user = user;

    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      error: "Not authorized, token invalid",
    });
  }
};

// ==========================================
// ROLE AUTHORIZATION
// ==========================================
//
// Usage:
//
// router.get(
//   "/admin",
//   protect,
//   authorize("admin"),
//   controller
// );
//
// Multiple roles:
//
// authorize("admin", "mentor")
//
// ==========================================

const authorize = (...allowedRoles) => {
  return (req, res, next) => {

    // ==========================================
    // CHECK AUTHENTICATED USER
    // ==========================================

    if (!req.user) {
      return res.status(401).json({
        error: "Not authorized",
      });
    }

    // ==========================================
    // CHECK USER ROLE
    // ==========================================

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// ==========================================
// EXPORT
// ==========================================

module.exports = protect;
module.exports.authorize = authorize;