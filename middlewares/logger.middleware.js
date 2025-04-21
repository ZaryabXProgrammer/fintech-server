const fs = require("fs");
const path = require("path");

// Create a logger middleware to log API requests
const loggerMiddleware = (req, res, next) => {
  // Get the current timestamp
  const timestamp = new Date().toISOString();

  // Extract user info if authenticated
  const userId = req.user ? req.user.id : "unauthenticated";

  // Create log entry
  const logEntry = {
    timestamp,
    userId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "unknown",
  };

  // Convert to string format
  const logString = JSON.stringify(logEntry) + "\n";

  // Log directory and file path
  const logDir = path.join(__dirname, "..", "logs");
  const logFile = path.join(logDir, "api-requests.log");

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Write to log file (async)
  fs.appendFile(logFile, logString, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });

  // Continue to next middleware
  next();
};

module.exports = loggerMiddleware;
