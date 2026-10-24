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

const JWT_SECRET = process.env.JWT_SECRET || "nexthireai_super_secret_key_change_in_production";

const protect = async (req, res, next) => {
  try {
    // ==========================================
    // GET AUTHORIZATION HEADER (Case-insensitive)
    // ==========================================

    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.trim().toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({
        error: "Not authorized, no token provided",
        code: "NO_TOKEN",
      });
    }

    // ==========================================
    // EXTRACT AND SANITIZE TOKEN
    // Strip "Bearer ", surrounding quotes (common in Postman/copy-paste), and whitespace
    // ==========================================

    let token = authHeader.replace(/^bearer\s+/i, "").trim();
    token = token.replace(/^["']|["']$/g, "").trim();

    if (!token) {
      return res.status(401).json({
        error: "Not authorized, token is empty",
        code: "NO_TOKEN",
      });
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        error: "Not authorized, token invalid",
        code: "TOKEN_INVALID",
      });
    }

    // Support id, _id, or userId in payload
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Not authorized, token payload invalid",
        code: "TOKEN_INVALID",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "User no longer exists",
        code: "USER_NOT_FOUND",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        error: "Your account has been suspended",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    // ==========================================
    // ATTACH USER TO REQUEST
    // ==========================================

    req.user = user;

    next();

  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(401).json({
      error: "Not authorized, token invalid",
      code: "AUTH_ERROR",
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