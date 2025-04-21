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
