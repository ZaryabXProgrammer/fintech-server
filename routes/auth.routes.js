const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const router = express.Router();

// Input validation middleware
const { body } = require("express-validator");
const validateRequest = require("../middlewares/validate-request");

// Register route with validation
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  validateRequest,
  register
);

// Login route with validation
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

module.exports = router;
