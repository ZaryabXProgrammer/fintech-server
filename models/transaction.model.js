/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - user
 *         - transactionType
 *         - amount
 *         - reference
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier (automatically generated)
 *         user:
 *           type: string
 *           description: ID of the user who initiated the transaction
 *         recipient:
 *           type: string
 *           description: ID of the recipient user (for transfers)
 *         transactionType:
 *           type: string
 *           enum: [transfer, deposit, withdrawal, fee, bonus, refund]
 *           description: Type of financial transaction
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         currency:
 *           type: string
 *           default: USD
 *           description: Currency of the transaction
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *           default: pending
 *           description: Current status of the transaction
 *         description:
 *           type: string
 *           description: Short description of the transaction
 *         reference:
 *           type: string
 *           description: Unique reference code for the transaction
 *         senderBalanceAfter:
 *           type: number
 *           description: Sender's balance after the transaction
 *         recipientBalanceAfter:
 *           type: number
 *           description: Recipient's balance after the transaction
 *         notes:
 *           type: string
 *           description: Additional notes about the transaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the transaction was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the transaction was last updated
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  // User who initiated the transaction
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // Recipient user for transfers (if applicable)
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  transactionType: {
    type: String,
    enum: ["transfer", "deposit", "withdrawal", "fee", "bonus", "refund"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "pending",
  },
  description: {
    type: String,
    trim: true,
  },
  reference: {
    type: String,
    unique: true,
    required: true,
  },
  // Balance after transaction for the initiating user
  senderBalanceAfter: {
    type: Number,
  },
  // Balance after transaction for the recipient (if applicable)
  recipientBalanceAfter: {
    type: Number,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the updatedAt field
TransactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add compound indexes for efficient querying
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ recipient: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ transactionType: 1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
