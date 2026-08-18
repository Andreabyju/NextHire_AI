/**
 * adminOnly middleware
 *
 * Must be used AFTER the protect middleware (which attaches req.user).
 * Returns 403 Forbidden if the authenticated user is not an admin.
 * This is the server-side enforcement — the frontend route guards are
 * a convenience layer only and cannot be relied upon for security.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden — admin access required",
    });
  }
  next();
};

module.exports = adminOnly;
