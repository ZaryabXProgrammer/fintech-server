// Role-based access control middleware
const rbacMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Convert string to array if only one role is provided
    if (typeof roles === "string") {
      roles = [roles];
    }

    // Check if user role is in the allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = rbacMiddleware;
