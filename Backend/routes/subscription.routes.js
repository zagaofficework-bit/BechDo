const express = require("express");
const router  = express.Router();

const SubscriptionController = require("../controller/subscription.controller");

const {
  authMiddleware,
  authorize,
  blockAdmin,
} = require("../middleware/auth.middleware");

////////////////////////////////////////////////////////////////////
//// PUBLIC ROUTES
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all available subscription plans
 * @access  Public
 */
router.get(
  "/plans",
  SubscriptionController.getPlans
);

////////////////////////////////////////////////////////////////////
//// USER/SELLER ROUTES
////////////////////////////////////////////////////////////////////

/**
 * @route   POST /api/subscriptions
 * @desc    Subscribe to a plan — user automatically becomes seller
 * @access  Private (User only — admin blocked)
 */
router.post(
  "/",
  authMiddleware,
  authorize("user"),
  blockAdmin,
  SubscriptionController.subscribe
);

/**
 * @route   GET /api/subscriptions/my
 * @desc    Get current seller's active subscription + days remaining
 * @access  Private (Seller only)
 */
router.get(
  "/my",
  authMiddleware,
  authorize("seller"),
  SubscriptionController.getMySubscription
);

/**
 * @route   PUT /api/subscriptions/upgrade
 * @desc    Upgrade to a higher subscription plan
 * @access  Private (Seller only)
 */
router.put(
  "/upgrade",
  authMiddleware,
  authorize("seller"),
  SubscriptionController.upgradePlan
);

module.exports = router;