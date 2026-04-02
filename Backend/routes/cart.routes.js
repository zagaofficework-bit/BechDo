const express          = require("express");
const router           = express.Router();
const CartController   = require("../controller/cart.controller");
const {
  authMiddleware,
  authorize,
} = require("../middleware/auth.middleware");

// All cart routes — users only, sellers blocked
router.use(authMiddleware, authorize("user"));

/**
 * @route   GET /api/cart
 * @desc    Get all cart items with full product details + total
 * @access  Private (User only)
 */
router.get("/", CartController.getCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private (User only)
 */
router.delete("/", CartController.clearCart);

/**
 * @route   POST /api/cart/checkout
 * @desc    Checkout multiple cart items at once
 * @access  Private (User only)
 * @body    { productIds: ["id1", "id2"], paymentMethod: "UPI" }
 * ⚠️ MUST be before /:productId routes
 */
router.post("/checkout", CartController.checkoutMultiple);

/**
 * @route   GET /api/cart/:productId/check
 * @desc    Check if product is in cart
 * @access  Private (User only)
 * ⚠️ MUST be before /:productId
 */
router.get("/:productId/check", CartController.checkCart);

/**
 * @route   POST /api/cart/:productId/checkout
 * @desc    Checkout a single item from cart — places order directly
 * @access  Private (User only)
 * @body    { paymentMethod: "Cash" | "UPI" | "Card" | "NetBanking" }
 */
router.post("/:productId/checkout", CartController.checkoutFromCart);

/**
 * @route   POST /api/cart/:productId
 * @desc    Add product to cart
 * @access  Private (User only)
 */
router.post("/:productId", CartController.addToCart);

/**
 * @route   DELETE /api/cart/:productId
 * @desc    Remove product from cart
 * @access  Private (User only)
 */
router.delete("/:productId", CartController.removeFromCart);

module.exports = router;