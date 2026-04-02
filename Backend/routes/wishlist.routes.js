const express             = require("express");
const router              = express.Router();
const WishlistController  = require("../controller/wishlist.controller");
const { authMiddleware, blockAdmin }  = require("../middleware/auth.middleware");

// All wishlist routes require login
// Admin blocked — wishlist is for buyers/sellers only
router.use(authMiddleware, blockAdmin);

/**
 * @route   GET /api/wishlist
 * @desc    Get all wishlisted products with full details
 * @access  Private (User, Seller)
 */
router.get("/", WishlistController.getWishlist);

/**
 * @route   DELETE /api/wishlist
 * @desc    Clear entire wishlist
 * @access  Private (User, Seller)
 */
router.delete("/", WishlistController.clearWishlist);

/**
 * @route   GET /api/wishlist/:productId/check
 * @desc    Check if a specific product is in wishlist
 * @access  Private (User, Seller)
 * ⚠️ MUST be before /:productId to avoid route conflict
 */
router.get("/:productId/check", WishlistController.checkWishlist);

/**
 * @route   POST /api/wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private (User, Seller)
 */
router.post("/:productId", WishlistController.addToWishlist);

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private (User, Seller)
 */
router.delete("/:productId", WishlistController.removeFromWishlist);

module.exports = router;