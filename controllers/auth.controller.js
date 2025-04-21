const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { createCustomer } = require("../config/stripe");

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      subscribed: user.subscribed,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create a Stripe customer
    let stripeCustomerId = null;
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const customer = await createCustomer(email, name);
        stripeCustomerId = customer.id;
      }
    } catch (error) {
      console.error("Stripe customer creation failed:", error);
      // Continue registration even if Stripe fails
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      stripeCustomerId,
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscribed: user.subscribed,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password field for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscribed: user.subscribed,
        balance: user.balance,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};
