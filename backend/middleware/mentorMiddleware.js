/**
 * Mentor-only middleware
 *
 * Must be used AFTER authMiddleware (protect).
 *
 * protect:
 *   - verifies JWT
 *   - loads the user
 *
 * mentorOnly:
 *   - checks that the authenticated user
 *     has role = "mentor"
 *
 * This is backend security.
 * Frontend route protection alone is NOT enough.
 */

const mentorOnly = (req, res, next) => {
    // Make sure protect middleware has attached req.user
    if (!req.user) {
        return res.status(401).json({
            error: "Not authorized",
        });
    }

    // Only mentors are allowed
    if (req.user.role !== "mentor") {
        return res.status(403).json({
            error: "Forbidden — mentor access required",
        });
    }

    next();
};

module.exports = mentorOnly;