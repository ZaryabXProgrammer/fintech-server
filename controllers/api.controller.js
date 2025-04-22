const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const { v4: uuidv4 } = require("uuid");

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
    const { destinationId, amount } = req.body;

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: "Invalid transfer amount" });
    }

    // Get source user (current user)
    const sourceUser = await User.findById(req.user.id);
    if (!sourceUser) {
      return res.status(404).json({ error: "Source account not found" });
    }

    // Check if user has sufficient balance
    if (sourceUser.balance < transferAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Validate destination user
    if (destinationId === req.user.id) {
      return res.status(400).json({ error: "Cannot transfer to same account" });
    }

    // Check if destination exists
    const destinationUser = await User.findById(destinationId);
    if (!destinationUser) {
      return res.status(404).json({ error: "Destination account not found" });
    }

    // Update balances
    sourceUser.balance -= transferAmount;
    destinationUser.balance += transferAmount;

    // Generate a unique reference for the transaction
    const reference = `TRF-${uuidv4().substring(0, 8)}-${Date.now()
      .toString()
      .substring(9)}`;

    // Create a new transaction record
    const transaction = new Transaction({
      user: sourceUser._id, // Sender
      recipient: destinationUser._id, // Recipient
      transactionType: "transfer",
      amount: transferAmount,
      currency: "USD",
      status: "completed",
      description: req.body.description || "Funds transfer",
      reference,
      senderBalanceAfter: sourceUser.balance,
      recipientBalanceAfter: destinationUser.balance,
      notes: req.body.notes || null,
    });

    // Save all changes within a transaction
    await Promise.all([
      sourceUser.save(),
      destinationUser.save(),
      transaction.save(),
    ]);

    res.json({
      success: true,
      message: "Transfer completed successfully",
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        currency: transaction.currency,
        timestamp: transaction.createdAt,
        formattedDate: new Date(transaction.createdAt).toLocaleString(),
        status: transaction.status,
        description: transaction.description,
        notes: transaction.notes,
      },
      sender: {
        id: sourceUser._id,
        name: sourceUser.name,
        email: sourceUser.email,
        balanceAfter: sourceUser.balance,
      },
      recipient: {
        id: destinationUser._id,
        name: destinationUser.name,
        email: destinationUser.email,
        balanceAfter: destinationUser.balance,
      },
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
    const skip = (page - 1) * pageSize;

    // Get filter parameters
    const type = req.query.type; // Optional transaction type filter

    // Build query
    const query = {
      $or: [
        { user: req.user.id }, // Transactions where user is the sender
        { recipient: req.user.id }, // Transactions where user is the recipient
      ],
    };

    // Add type filter if provided
    if (type) {
      query.transactionType = type;
    }

    // Get total count
    const totalItems = await Transaction.countDocuments(query);

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("user", "name email")
      .populate("recipient", "name email");

    // Format the transactions for the response
    const formattedTransactions = transactions.map((tx) => {
      const isOutgoing = tx.user._id.toString() === req.user.id;

      return {
        id: tx._id,
        reference: tx.reference,
        type: tx.transactionType,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        timestamp: tx.createdAt,
        status: tx.status,
        // For transfers, show the other party
        counterparty: isOutgoing
          ? tx.recipient
            ? {
                id: tx.recipient._id,
                name: tx.recipient.name,
              }
            : null
          : { id: tx.user._id, name: tx.user.name },
        // For display purposes, indicate if money was sent or received
        direction: isOutgoing ? "outgoing" : "incoming",
        balanceAfter: isOutgoing
          ? tx.senderBalanceAfter
          : tx.recipientBalanceAfter,
      };
    });

    res.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems: totalItems,
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
