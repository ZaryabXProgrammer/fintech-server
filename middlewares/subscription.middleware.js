// Subscription gating middleware
const subscriptionMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if user has an active subscription
  if (!req.user.subscribed) {
    return res.status(403).json({
      error: "Subscription required",
      message: "This endpoint requires an active subscription",
    });
  }

  next();
};

module.exports = subscriptionMiddleware;
