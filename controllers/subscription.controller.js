const User = require("../models/user.model");
const stripeConfig = require("../config/stripe");

exports.createCheckoutSession = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        error: "Stripe not configured",
        message: "Please use the manual subscription endpoint instead",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Make sure user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      // Create customer in Stripe if not exists
      const customer = await stripeConfig.createCustomer(user.email, user.name);
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Hard-coded price ID for the subscription plan
    // In a real app, you would have this in your environment variables or database
    const priceId = req.body.priceId || "price_1234567890";

    // Create checkout session
    const session = await stripeConfig.createCheckoutSession(
      user.stripeCustomerId,
      priceId
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

exports.subscribe = async (req, res) => {
  try {
    // Manual subscription without Stripe - for testing or alternative payment flows
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update subscription status
    user.subscribed = true;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: "Subscription activated successfully",
      subscribed: user.subscribed,
    });
  } catch (error) {
    console.error("Error subscribing user:", error);
    res.status(500).json({ error: "Failed to activate subscription" });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If using Stripe and user has a subscription ID
    if (process.env.STRIPE_SECRET_KEY && user.stripeSubscriptionId) {
      await stripeConfig.cancelSubscription(user.stripeSubscriptionId);
      user.stripeSubscriptionId = null;
    }

    // Update subscription status
    user.subscribed = false;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: "Subscription canceled successfully",
      subscribed: user.subscribed,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      subscribed: user.subscribed,
      stripeSubscriptionId: user.stripeSubscriptionId,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error getting subscription status:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
};

// Create a Stripe Customer Portal session for managing subscriptions
exports.createCustomerPortalSession = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        error: "Stripe not configured",
        message: "Billing portal is not available without Stripe configuration",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return res.status(400).json({
        error: "No Stripe customer found",
        message: "You need an active subscription to access the billing portal",
      });
    }

    // Create the portal session
    const portalSession = await stripeConfig.createBillingPortalSession(
      user.stripeCustomerId
    );

    res.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    res.status(500).json({ error: "Failed to create billing portal session" });
  }
};

// Stripe webhook handler
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !endpointSecret) {
      return res.status(400).json({ error: "Missing webhook signature" });
    }

    // Verify webhook signature
    const event = stripeConfig.verifyWebhookSignature(
      req.rawBody,
      signature,
      endpointSecret
    );

    // Handle the event based on its type
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Helper function to handle checkout session completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    // Get the subscription details
    const subscription = await stripeConfig.stripe.subscriptions.retrieve(
      session.subscription
    );

    // Find the user by Stripe customer ID
    const user = await User.findOne({ stripeCustomerId: session.customer });
    if (!user) {
      throw new Error(
        `No user found with Stripe customer ID: ${session.customer}`
      );
    }

    // Update user subscription details
    user.stripeSubscriptionId = subscription.id;
    user.subscribed = true;
    user.updatedAt = Date.now();
    await user.save();

    console.log(`Subscription activated for user: ${user._id}`);
  } catch (error) {
    console.error("Error handling checkout.session.completed:", error);
    throw error;
  }
}

// Helper function to handle subscription updated event
async function handleSubscriptionUpdated(subscription) {
  try {
    // Find the user by Stripe customer ID
    const user = await User.findOne({
      stripeCustomerId: subscription.customer,
    });
    if (!user) {
      throw new Error(
        `No user found with Stripe customer ID: ${subscription.customer}`
      );
    }

    // Update subscription status based on the subscription status
    user.subscribed =
      subscription.status === "active" || subscription.status === "trialing";
    user.stripeSubscriptionId = subscription.id;
    user.updatedAt = Date.now();
    await user.save();

    console.log(
      `Subscription updated for user: ${user._id}, status: ${subscription.status}`
    );
  } catch (error) {
    console.error("Error handling subscription update:", error);
    throw error;
  }
}

// Helper function to handle subscription deleted event
async function handleSubscriptionDeleted(subscription) {
  try {
    // Find the user by Stripe customer ID
    const user = await User.findOne({
      stripeCustomerId: subscription.customer,
    });
    if (!user) {
      throw new Error(
        `No user found with Stripe customer ID: ${subscription.customer}`
      );
    }

    // Update user subscription details
    user.stripeSubscriptionId = null;
    user.subscribed = false;
    user.updatedAt = Date.now();
    await user.save();

    console.log(`Subscription canceled for user: ${user._id}`);
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}
