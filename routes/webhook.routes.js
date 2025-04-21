const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const stripeConfig = require("../config/stripe");

// Raw body parser for webhook signature verification
const parseRawBody = express.raw({ type: "application/json" });

// Stripe webhook handler
router.post("/stripe", parseRawBody, async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];

    // Verify webhook signature
    const event = stripeConfig.verifyWebhookSignature(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // Find user by Stripe Customer ID
        const user = await User.findOne({ stripeCustomerId: session.customer });
        if (user) {
          // Update user's subscription status
          user.subscribed = true;
          user.stripeSubscriptionId = session.subscription;
          user.updatedAt = Date.now();
          await user.save();

          console.log(`Subscription activated for user: ${user.email}`);
        } else {
          console.warn(
            `Customer ${session.customer} not found for checkout session ${session.id}`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        // Find user by Stripe Subscription ID
        const user = await User.findOne({
          stripeSubscriptionId: subscription.id,
        });
        if (user) {
          // Update user's subscription status
          user.subscribed = false;
          user.stripeSubscriptionId = null;
          user.updatedAt = Date.now();
          await user.save();

          console.log(`Subscription canceled for user: ${user.email}`);
        } else {
          console.warn(`User with subscription ${subscription.id} not found`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // Find user by Stripe Subscription ID
        const user = await User.findOne({
          stripeSubscriptionId: subscription.id,
        });
        if (user) {
          // Update user's subscription status based on Stripe status
          user.subscribed =
            subscription.status === "active" ||
            subscription.status === "trialing";
          user.updatedAt = Date.now();
          await user.save();

          console.log(
            `Subscription updated for user: ${user.email}, status: ${subscription.status}`
          );
        } else {
          console.warn(`User with subscription ${subscription.id} not found`);
        }
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook signature verification failed" });
  }
});

module.exports = router;
