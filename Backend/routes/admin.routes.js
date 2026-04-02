const express = require("express");
const router  = express.Router();

const AdminController = require("../controller/admin.controller");

const {
  authMiddleware,
  authorize,
} = require("../middleware/auth.middleware");

// All admin routes require auth + admin role
router.use(authMiddleware, authorize("admin"));

////////////////////////////////////////////////////////////////////
//// PRODUCT MANAGEMENT
////////////////////////////////////////////////////////////////////

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Admin removes any product listing
 * @access  Private (Admin only)
 */
router.delete(
  "/products/:id",
  AdminController.adminDeleteProduct
);

////////////////////////////////////////////////////////////////////
//// ORDER & COMMISSION OVERVIEW
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/admin/orders
 * @desc    Get all platform orders with commission summary
 * @access  Private (Admin only)
 * @query   ?type=buy&status=confirmed&page=1&limit=20
 */
router.get(
  "/orders",
  AdminController.getAllOrders
);

////////////////////////////////////////////////////////////////////
//// SELLER SUBSCRIPTION MANAGEMENT
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/admin/subscriptions
 * @desc    List all subscribed sellers with plan, dates, product count
 * @access  Private (Admin only)
 * @query   ?status=active&plan=premium&page=1&limit=20
 */
router.get(
  "/subscriptions",
  AdminController.getSubscribedSellers
);

/**
 * @route   GET /api/admin/subscriptions/:sellerId
 * @desc    Full detail of a single seller — subscription + all listings
 * @access  Private (Admin only)
 */
router.get(
  "/subscriptions/:sellerId",
  AdminController.getSellerSubscriptionDetail
);

////////////////////////////////////////////////////////////////////
//// SELLER FRAUD / SUSPENSION CONTROLS
////////////////////////////////////////////////////////////////////

/**
 * @route   POST /api/admin/sellers/:sellerId/pause
 * @desc    Temporarily suspend a seller due to suspicious activity
 *          → accountStatus: "suspended", subscription paused
 * @access  Private (Admin only)
 * @body    { reason } — required
 */
router.post(
  "/sellers/:sellerId/pause",
  AdminController.pauseSellerSubscription
);

/**
 * @route   POST /api/admin/sellers/:sellerId/ban
 * @desc    Permanently ban a seller for fraud or severe violations
 *          → accountStatus: "banned", all subscriptions cancelled,
 *            all listings hidden
 * @access  Private (Admin only)
 * @body    { reason } — required
 */
router.post(
  "/sellers/:sellerId/ban",
  AdminController.banSellerSubscription
);

/**
 * @route   POST /api/admin/sellers/:sellerId/reinstate
 * @desc    Reinstate a suspended seller (paused → active)
 *          Blocked for permanently banned sellers
 * @access  Private (Admin only)
 * @body    { note } — optional
 */
router.post(
  "/sellers/:sellerId/reinstate",
  AdminController.reinstateSellerSubscription
);

module.exports = router;