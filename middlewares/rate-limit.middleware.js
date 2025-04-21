const rateLimit = require("express-rate-limit");
const User = require("../models/user.model");

// User-specific rate limiting middleware
const userRateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: "Rate limit exceeded",
    message: "Too many requests, please try again later",
  },
  // Custom key generator to use user ID if available
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  // Custom handler to log rate limiting events
  handler: async (req, res, _, options) => {
    if (req.user) {
      console.warn(`Rate limit exceeded for user ${req.user.id}`);

      // Log rate limit event to database or file system
      try {
        // Log to database if needed
        // await RateLimitLog.create({ userId: req.user.id, timestamp: new Date() });
      } catch (error) {
        console.error("Error logging rate limit event:", error);
      }
    }

    res.status(429).json(options.message);
  },
  // Skip rate limiting for admin users
  skip: (req) => {
    return req.user && req.user.role === "admin";
  },
});

module.exports = userRateLimitMiddleware;
