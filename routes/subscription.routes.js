const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { body } = require("express-validator");
const validateRequest = require("../middlewares/validate-request");

// Apply auth middleware to all subscription routes
router.use(authMiddleware);

// Create checkout session for Stripe
router.post(
  "/create-checkout-session",
  subscriptionController.createCheckoutSession
);

// Manual subscription management (if not using Stripe)
router.post(
  "/subscribe",
  [
    // Fix: Add a validation before using optional()
    body("planId").exists().optional(),
  ],
  validateRequest,
  subscriptionController.subscribe
);

// Cancel subscription
router.post("/cancel", subscriptionController.cancelSubscription);

// Get subscription status
router.get("/status", subscriptionController.getSubscriptionStatus);

module.exports = router;
