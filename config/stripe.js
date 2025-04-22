// Stripe configuration
const Stripe = require("stripe");

// Initialize Stripe with the secret key from environment variables
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

module.exports = {
  stripe,

  // Create a checkout session for subscription
  createCheckoutSession: async (customerId, priceId) => {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        // metadata: { userId: userId, priceId: priceId },
      });

      return session;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  },

  // Create a customer in Stripe
  createCustomer: async (email, name) => {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });

      return customer;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw error;
    }
  },

  // Verify a webhook signature
  verifyWebhookSignature: (rawBody, signature, endpointSecret) => {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );

      return event;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw error;
    }
  },

  // Cancel a subscription
  cancelSubscription: async (subscriptionId) => {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  },

  // Create a billing portal session
  createBillingPortalSession: async (customerId) => {
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.FRONTEND_URL}/account`,
      });

      return session;
    } catch (error) {
      console.error("Error creating billing portal session:", error);
      throw error;
    }
  },
};
