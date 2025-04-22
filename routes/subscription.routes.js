/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription and billing management endpoints
 */

/**
 * @swagger
 * /api/subscriptions/create-checkout-session:
 *   post:
 *     summary: Create a Stripe checkout session for subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: Stripe price ID for the subscription plan
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                   description: Stripe checkout session ID
 *                 url:
 *                   type: string
 *                   description: URL to redirect the user to for checkout
 *       400:
 *         description: Bad request or Stripe not configured
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/subscriptions/create-portal-session:
 *   post:
 *     summary: Create a Stripe customer portal session for managing subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portal session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *                   description: URL to redirect the user to the billing portal
 *       400:
 *         description: Bad request or no Stripe customer found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/subscriptions/subscribe:
 *   post:
 *     summary: Manually subscribe a user (non-Stripe)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Optional plan identifier
 *     responses:
 *       200:
 *         description: Subscription activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscribed:
 *                   type: boolean
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Cancel the user's subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscribed:
 *                   type: boolean
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/subscriptions/status:
 *   get:
 *     summary: Get current subscription status
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                 stripeSubscriptionId:
 *                   type: string
 *                   nullable: true
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

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

router.get(
  "/billing-portal",
  subscriptionController.createCustomerPortalSession
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

//Webhook route for Stripe events
// router.post("/webhook", subscriptionController.handleWebhook);

module.exports = router;
