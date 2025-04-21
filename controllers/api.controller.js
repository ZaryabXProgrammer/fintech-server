const User = require("../models/user.model");

// Helper to generate a random transaction
const generateMockTransaction = (
  userId,
  type,
  amount,
  balance,
  description = null
) => {
  const transactionTypes = ["deposit", "withdrawal", "transfer"];
  return {
    id: Math.random().toString(36).substring(2, 15),
    userId,
    type:
      type ||
      transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
    amount,
    balance,
    description: description || `Mock ${type || "transaction"}`,
    timestamp: new Date(),
  };
};

// Generate a batch of mock transactions
const generateMockTransactions = (userId, count = 20) => {
  const transactions = [];
  let balance = 1000; // Starting balance

  for (let i = 0; i < count; i++) {
    const isDeposit = Math.random() > 0.5;
    const amount = parseFloat((Math.random() * 500).toFixed(2));

    if (isDeposit) {
      balance += amount;
      transactions.push(
        generateMockTransaction(
          userId,
          "deposit",
          amount,
          balance,
          "Mock deposit"
        )
      );
    } else {
      if (balance > amount) {
        balance -= amount;
        transactions.push(
          generateMockTransaction(
            userId,
            "withdrawal",
            amount,
            balance,
            "Mock withdrawal"
          )
        );
      } else {
        // Skip this iteration and try again
        i--;
      }
    }
  }

  // Sort by timestamp descending (newest first)
  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

// Get user balance
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      balance: user.balance,
      updatedAt: new Date(),
      currency: "USD",
    });
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({ error: "Failed to retrieve balance" });
  }
};

// Transfer funds
exports.transfer = async (req, res) => {
  try {
    const { sourceId, destinationId, amount } = req.body;

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid transfer amount" });
    }

    // In a real app, we would verify both accounts and update balances
    // For this sandbox, we'll use mock data

    // Get source user (current user)
    const sourceUser = await User.findById(req.user.id);
    if (!sourceUser) {
      return res.status(404).json({ error: "Source account not found" });
    }

    // Check if user has sufficient balance
    if (sourceUser.balance < transferAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Simulate destination user
    let destinationUser = null;
    if (destinationId === req.user.id) {
      return res.status(400).json({ error: "Cannot transfer to same account" });
    } else {
      // Check if destination exists (could be another user in your system)
      destinationUser = await User.findById(destinationId);
      if (!destinationUser) {
        return res.status(404).json({ error: "Destination account not found" });
      }
    }

    // Update balances
    sourceUser.balance -= transferAmount;
    destinationUser.balance += transferAmount;

    // Save changes
    await sourceUser.save();
    await destinationUser.save();

    // Create mock transaction for response
    const transaction = {
      id: Math.random().toString(36).substring(2, 15),
      sourceId,
      destinationId,
      amount: transferAmount,
      timestamp: new Date(),
      status: "completed",
      description: req.body.description || "Funds transfer",
    };

    res.json({
      success: true,
      message: "Transfer completed successfully",
      transaction,
      sourceBalance: sourceUser.balance,
    });
  } catch (error) {
    console.error("Error processing transfer:", error);
    res.status(500).json({ error: "Failed to process transfer" });
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    // Generate mock transactions
    const allTransactions = generateMockTransactions(req.user.id, 50);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(allTransactions.length / pageSize),
        totalItems: allTransactions.length,
      },
    });
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({ error: "Failed to retrieve transactions" });
  }
};

// Get invoice
exports.getInvoice = async (req, res) => {
  try {
    const { start, end } = req.query;

    // Parse dates
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (startDate > endDate) {
      return res
        .status(400)
        .json({ error: "Start date must be before end date" });
    }

    // Generate mock transactions for the date range
    const mockTransactions = generateMockTransactions(req.user.id, 30).filter(
      (t) => {
        const txDate = new Date(t.timestamp);
        return txDate >= startDate && txDate <= endDate;
      }
    );

    // Calculate summary
    const totalTransactions = mockTransactions.length;
    const totalAmount = mockTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const avgAmount =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Group by type
    const depositCount = mockTransactions.filter(
      (t) => t.type === "deposit"
    ).length;
    const withdrawalCount = mockTransactions.filter(
      (t) => t.type === "withdrawal"
    ).length;
    const transferCount = mockTransactions.filter(
      (t) => t.type === "transfer"
    ).length;

    res.json({
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      summary: {
        totalTransactions,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        avgAmount: parseFloat(avgAmount.toFixed(2)),
      },
      breakdown: {
        deposits: depositCount,
        withdrawals: withdrawalCount,
        transfers: transferCount,
      },
      transactions: mockTransactions,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
};
