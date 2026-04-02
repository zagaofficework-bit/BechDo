const express = require("express");
const authController = require("../controller/auth.controller");
const authMiddleware  = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description Initiate user registration by sending an OTP to the provided email. Implements rate-limiting to prevent abuse.
 * @access Public
 */
router.post("/register", authController.userRegisterController);

/**
 * @route POST /api/auth/register/verify-otp
 * @description Verify OTP and create user
 * @access Public
 */
router.post("/register/verify-otp", authController.verifyRegisterOtpController);

/**
 * @route POST /api/auth/login
 * @description Initiate user login by sending an OTP to the provided email. Implements rate-limiting to prevent abuse.
 * @access Public
 */
router.post("/login", authController.userLoginController);

/**
 * @route POST /api/auth/login/verify-otp
 * @description Verify OTP and login user
 * @access Public
 */
router.post("/login/verify-otp", authController.verifyLoginOtpController);

/**
 * @route GET /api/auth/me
 * @description Get current logged in user details
 * @access Private
 */
router.get("/me", authMiddleware.authMiddleware, authController.getMeController);

/**
 * @route POST /api/auth/logout
 * @description Logout user and invalidate refresh token
 * @access Private
 */
router.post("/logout",authMiddleware.authMiddleware, authController.userLogoutController);

/**
 * @route POST /api/auth/refresh-token
 * @description Refresh access token using refresh token
 * @access Private
 */
router.post("/refresh-token", authController.refreshAccessTokenController);

module.exports = router;