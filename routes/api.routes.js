const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const subscriptionMiddleware = require("../middlewares/subscription.middleware");
const rateLimitMiddleware = require("../middlewares/rate-limit.middleware");
const loggerMiddleware = require("../middlewares/logger.middleware");
const { body, query } = require("express-validator");
const validateRequest = require("../middlewares/validate-request");

// Apply middlewares to all API routes
router.use(authMiddleware);
router.use(subscriptionMiddleware);
router.use(rateLimitMiddleware);
router.use(loggerMiddleware);

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
