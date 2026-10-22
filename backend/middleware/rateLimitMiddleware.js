// ==========================================
// IN-MEMORY RATE LIMITER
// ==========================================
//
// No external packages required.
// Uses a simple Map keyed by client IP.
//
// ==========================================

/**
 * Creates a rate limiter middleware factory.
 *
 * @param {object} options
 * @param {number}  options.maxRequests   - Max allowed requests in the window
 * @param {number}  options.windowMs      - Time window in milliseconds
 * @param {string}  options.message       - Error message returned when limited
 */

const createRateLimiter = ({
    maxRequests,
    windowMs,
    message = "Too many requests. Please try again later.",
}) => {
    // Map structure: ip → { count, windowStart }
    const store = new Map();

    // Clean up expired entries every 5 minutes to avoid memory leaks
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of store.entries()) {
            if (now - data.windowStart >= windowMs) {
                store.delete(ip);
            }
        }
    }, 5 * 60 * 1000);

    return (req, res, next) => {
        // ==========================================
        // GET CLIENT IP
        // ==========================================

        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            "unknown";

        const now = Date.now();
        const entry = store.get(ip);

        // ==========================================
        // FIRST REQUEST OR EXPIRED WINDOW
        // ==========================================

        if (!entry || now - entry.windowStart >= windowMs) {
            store.set(ip, {
                count: 1,
                windowStart: now,
            });
            return next();
        }

        // ==========================================
        // INCREMENT COUNT
        // ==========================================

        entry.count += 1;

        if (entry.count > maxRequests) {
            // ==========================================
            // RATE LIMIT EXCEEDED
            // ==========================================

            const retryAfterSeconds = Math.ceil(
                (windowMs - (now - entry.windowStart)) / 1000
            );

            res.setHeader("Retry-After", retryAfterSeconds);

            return res.status(429).json({
                error: message,
                retryAfter: retryAfterSeconds,
            });
        }

        return next();
    };
};

// ==========================================
// LOGIN RATE LIMITER
// ==========================================
// 5 attempts per IP per 15 minutes (100 in development for testing)

const loginLimiter = createRateLimiter({
    maxRequests: process.env.NODE_ENV === "development" ? 100 : 5,
    windowMs: 15 * 60 * 1000,
    message:
        "Too many login attempts. Please wait 15 minutes before trying again.",
});

// ==========================================
// REGISTER RATE LIMITER
// ==========================================
// 3 registration attempts per IP per hour (100 in development for testing)

const registerLimiter = createRateLimiter({
    maxRequests: process.env.NODE_ENV === "development" ? 100 : 3,
    windowMs: 60 * 60 * 1000,
    message:
        "Too many registration attempts from this IP. Please try again in an hour.",
});

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    loginLimiter,
    registerLimiter,
};
