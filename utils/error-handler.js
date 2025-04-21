/**
 * Custom error class for API errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a standard error response object
 */
const createErrorResponse = (err, req, res) => {
  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  // Log error details for server debugging
  console.error(`${statusCode} - ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Handle MongoDB validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: Object.values(err.errors).map((val) => ({
        field: val.path,
        message: val.message,
      })),
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: "Duplicate Value",
      message: `The ${field} already exists. Please use a different value.`,
    });
  }

  // Handle cast errors (invalid ID format)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid Data",
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Authentication Error",
      message: "Invalid token. Please log in again.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Authentication Error",
      message: "Your token has expired. Please log in again.",
    });
  }

  // Return general error for all other cases
  return res.status(statusCode).json({
    error: statusCode >= 500 ? "Server Error" : "Request Error",
    message,
    // Include stack trace in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  AppError,
  createErrorResponse,
};
