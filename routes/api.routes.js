const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit.middleware");
const loggerMiddleware = require("../middlewares/logger.middleware");
const { body, query } = require("express-validator");
const validateRequest = require("../middlewares/validate-request");

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Financial transaction management endpoints
 */

/**
 * @swagger
 * /api/balance:
 *   get:
 *     summary: Get user's current balance
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: User's current balance
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
 *                 currency:
 *                   type: string
 *                   description: Currency of the balance
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/transfer:
 *   post:
 *     summary: Transfer funds to another user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - destinationId
 *               - amount
 *             properties:
 *               destinationId:
 *                 type: string
 *                 description: ID of the recipient user
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *               description:
 *                 type: string
 *                 description: Description of the transfer
 *               notes:
 *                 type: string
 *                 description: Additional notes for the transaction
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     transactionType:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     formattedDate:
 *                       type: string
 *                     status:
 *                       type: string
 *                     description:
 *                       type: string
 *                     notes:
 *                       type: string
 *                 sender:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     balanceAfter:
 *                       type: number
 *                 recipient:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     balanceAfter:
 *                       type: number
 *       400:
 *         description: Invalid transfer request
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get user's transaction history
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [transfer, deposit, withdrawal, fee, bonus, refund]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       reference:
 *                         type: string
 *                       type:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                       counterparty:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       direction:
 *                         type: string
 *                         enum: [incoming, outgoing]
 *                       balanceAfter:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

// Apply middlewares to all API routes
router.use(authMiddleware);
// router.use(subscriptionMiddleware);
// router.use(rateLimitMiddleware);
// router.use(loggerMiddleware);

// Get balance
router.get("/balance", apiController.getBalance);

// Transfer funds
router.post(
  "/transfer",
  [
    body("sourceId").notEmpty().withMessage("Source ID is required"),
    body("destinationId").notEmpty().withMessage("Destination ID is required"),
    body("amount")
      .isNumeric()
      .withMessage("Amount must be a number")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
  ],
  validateRequest,
  apiController.transfer
);

// Get transactions
router.get(
  "/transactions",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Page size must be between 1 and 100"),
  ],
  validateRequest,
  apiController.getTransactions
);

// Get invoice
router.get(
  "/invoice",
  [
    query("start")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Start date must be in YYYY-MM-DD format"),
    query("end")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("End date must be in YYYY-MM-DD format"),
  ],
  validateRequest,
  apiController.getInvoice
);

module.exports = router;
