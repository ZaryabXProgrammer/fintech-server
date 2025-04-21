const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Middleware to authenticate requests with JWT
const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id and exclude password
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found or token invalid" });
    }

    // Add user to request object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscribed: user.subscribed,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

module.exports = authMiddleware;
