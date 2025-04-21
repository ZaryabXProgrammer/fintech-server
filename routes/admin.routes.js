const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const rbacMiddleware = require("../middlewares/rbac.middleware");
const { body } = require("express-validator");
const validateRequest = require("../middlewares/validate-request");

// Apply middleware to all admin routes
router.use(authMiddleware);
router.use(rbacMiddleware(["admin"]));

// Get all users
router.get("/users", adminController.getAllUsers);

// Force cancel a user's subscription
router.post(
  "/subscriptions/cancel",
  [body("userId").notEmpty().withMessage("User ID is required")],
  validateRequest,
  adminController.cancelUserSubscription
);

// Get request logs
router.get("/logs", adminController.getLogs);

// Create mock user for testing
router.post(
  "/create-mock-user",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .isIn(["developer", "admin"])
      .withMessage("Role must be either developer or admin"),
    body("subscribed")
      .isBoolean()
      .withMessage("Subscribed must be a boolean value"),
  ],
  validateRequest,
  adminController.createMockUser
);

module.exports = router;
