const express            = require("express");
const router             = express.Router({ mergeParams: true }); // ← mergeParams for :productId
const ReviewController   = require("../controller/review.controller");
const {
  authMiddleware,
  optionalAuthenticate,
  blockAdmin,
} = require("../middleware/auth.middleware");

const {
  reviewUpload,
  validateReviewFiles,
} = require("../middleware/multer.middleware");


/**
 * @route   GET /api/products/:productId/reviews
 * @desc    Get all reviews with nested replies (pyramid structure)
 * @access  Public
 * @query   ?page=1&limit=10&sortBy=newest|oldest|top_rated|most_liked
 */
router.get("/", optionalAuthenticate, ReviewController.getReviews);

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    Add a root review (verified purchase only)
 * @access  Private (User, Seller — must have completed order)
 */
router.post(
  "/",
  authMiddleware,
  blockAdmin,
  reviewUpload,           
  validateReviewFiles,    
  ReviewController.addReview
);

/**
 * @route   POST /api/products/:productId/reviews/:reviewId/reply
 * @desc    Reply to a review or comment (max depth 2)
 * @access  Private
 */
router.post(
  "/:reviewId/reply",
  authMiddleware,
  blockAdmin,
  reviewUpload,           
  validateReviewFiles,
  ReviewController.addReply
);

/**
 * @route   POST /api/products/:productId/reviews/:reviewId/like
 * @desc    Like or unlike a review
 * @access  Private
 */
router.post(
  "/:reviewId/like",
  authMiddleware,
  ReviewController.toggleLike
);

/**
 * @route   PUT /api/products/:productId/reviews/:reviewId
 * @desc    Edit own review or reply
 * @access  Private (author only)
 */
router.put(
  "/:reviewId",
  authMiddleware,
  blockAdmin,
  ReviewController.editReview
);

/**
 * @route   DELETE /api/products/:productId/reviews/:reviewId
 * @desc    Soft delete review — shows as [deleted], replies preserved
 * @access  Private (author or admin)
 */
router.delete(
  "/:reviewId",
  authMiddleware,
  ReviewController.deleteReview
);

module.exports = router;