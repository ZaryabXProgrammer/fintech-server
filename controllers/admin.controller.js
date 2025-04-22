const User = require("../models/user.model");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {

    const users = await User.find().select("-password");

    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.subscribed).length;
    const proSubscribers = users.filter((user) => user.subscribed).length; // or check `user.role === 'pro'`

    const currentMonth = new Date().getMonth();
    const newThisMonth = users.filter(
      (user) => new Date(user.createdAt).getMonth() === currentMonth
    ).length;

    res.json({
      totalUsers,
      activeUsers,
      proSubscribers,
      newThisMonth,
      users,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};


// Force cancel a user's subscription
exports.cancelUserSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Cancel subscription
    user.subscribed = false;
    user.stripeSubscriptionId = null;
    user.updatedAt = Date.now();
    await user.save();
    res.json({
      success: true,
      message: `Subscription canceled for user ${user.email}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscribed: user.subscribed,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

// Get request logs
exports.getLogs = async (req, res) => {
  try {
    const logFilePath = path.join(__dirname, "..", "logs", "api-requests.log");

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return res.status(404).json({ error: "Log file not found" });
    }

    // Read log file
    const logs = fs
      .readFileSync(logFilePath, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { error: "Invalid log entry", raw: line };
        }
      });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedLogs = logs.slice(startIndex, endIndex);

    res.json({
      count: logs.length,
      page,
      pageSize,
      totalPages: Math.ceil(logs.length / pageSize),
      logs: paginatedLogs,
    });
  } catch (error) {
    console.error("Error reading logs:", error);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
};

// Create mock user for testing
exports.createMockUser = async (req, res) => {
  try {
    const { name, email, password, role, subscribed } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create user with specified properties
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: role || "developer",
      subscribed: subscribed || false,
      balance: 1000 + Math.floor(Math.random() * 9000), // Random balance between 1000-10000
    });

    res.status(201).json({
      message: "Mock user created successfully",
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
    console.error("Error creating mock user:", error);
    res.status(500).json({ error: "Failed to create mock user" });
  }
};
