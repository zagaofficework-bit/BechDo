const mongoose    = require("mongoose");
const Review      = require("../models/review.model");
const Product     = require("../models/product.model");
const OrderModel  = require("../models/order.model");
const uploadToCloudinary = require("../helper/cloudinaryUpload");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── PASTE THESE into review.controller.js ────────────────────────────────────
// Changes:
//   addReview  → media allowed only if user has NO existing review with media
//   addReply   → media completely blocked (files silently ignored + validation skipped)

const MAX_REVIEWS_PER_USER = 3;

// ─── ADD ROOT REVIEW ──────────────────────────────────────────────────────────
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { comment, rating } = req.body;

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.listedBy.toString() === userId.toString()) {
      return res.status(403).json({ message: "You cannot review your own product" });
    }

    // Count existing root reviews by this user on this product
    const existingReviews = await Review.find({
      product:      productId,
      author:       userId,
      parentReview: null,
    }).lean();

    if (existingReviews.length >= MAX_REVIEWS_PER_USER) {
      return res.status(409).json({
        message: `You can add up to ${MAX_REVIEWS_PER_USER} reviews per product. Delete one to add another.`,
      });
    }

    // ── Media: only allowed if user has NO existing review with images/video ──
    // This means only ONE of their reviews can have media attached.
    const hasMediaReview = existingReviews.some(
      r => (r.images?.length > 0) || r.video
    );

    const hasIncomingMedia =
      (req.files?.images?.length > 0) || (req.files?.video?.length > 0);

    if (hasIncomingMedia && hasMediaReview) {
      return res.status(409).json({
        message: "You can only attach images/video to one of your reviews per product. Delete your existing media review to add media here.",
      });
    }

    // ── Upload images ─────────────────────────────────────────────────────────
    let imageUrls = [];
    if (!hasMediaReview && req.files?.images?.length > 0) {
      const results = await Promise.all(
        req.files.images.map(f =>
          uploadToCloudinary(f.buffer, { resourceType: "image", folder: "reviews" })
        )
      );
      imageUrls = results.map(r => r.secure_url);
    }

    // ── Upload video ──────────────────────────────────────────────────────────
    let videoUrl = null;
    if (!hasMediaReview && req.files?.video?.length > 0) {
      const result = await uploadToCloudinary(
        req.files.video[0].buffer,
        { resourceType: "video", folder: "reviews" }
      );
      videoUrl = result.secure_url;
    }

    const review = await Review.create({
      product:            productId,
      author:             userId,
      comment:            comment.trim(),
      rating:             Number(rating),
      parentReview:       null,
      depth:              0,
      images:             imageUrls,
      video:              videoUrl,
      orderId:            null,
      isVerifiedPurchase: false,
    });

    await updateProductRating(productId);

    const populated = await Review.findById(review._id)
      .populate("author", "firstname lastname profilePic")
      .lean();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data:    populated,
    });
  } catch (error) {
    console.error("addReview error:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
};


// ─── ADD REPLY ────────────────────────────────────────────────────────────────
// Replies never get media — files are ignored even if sent
exports.addReply = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId                  = req.user._id;

    if (!isValidObjectId(productId) || !isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const { comment } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }

    // ── Block media on replies ─────────────────────────────────────────────
    if ((req.files?.images?.length > 0) || (req.files?.video?.length > 0)) {
      return res.status(400).json({
        message: "Replies cannot include images or videos.",
      });
    }

    const parent = await Review.findOne({ _id: reviewId, product: productId }).lean();
    if (!parent) {
      return res.status(404).json({ message: "Review not found" });
    }
    if (parent.depth >= 2) {
      return res.status(400).json({ message: "Maximum reply depth reached" });
    }

    const reply = await Review.create({
      product:      productId,
      author:       userId,
      comment:      comment.trim(),
      rating:       null,
      parentReview: reviewId,
      depth:        parent.depth + 1,
      images:       [],   // always empty on replies
      video:        null, // always null on replies
    });

    const populated = await Review.findById(reply._id)
      .populate("author", "firstname lastname profilePic")
      .lean();

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data:    populated,
    });
  } catch (error) {
    console.error("addReply error:", error);
    res.status(500).json({ message: "Failed to add reply" });
  }
};

// ─── GET REVIEWS FOR A PRODUCT ─────────────────────────────────────────────
// GET /api/products/:productId/reviews
// Returns root reviews with nested replies in pyramid structure

exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { page = 1, limit = 10, sortBy = "newest" } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      top_rated:  { rating: -1 },
      most_liked: { likesCount: -1 },
    };
    const sortObj = sortMap[sortBy] || { createdAt: -1 };

    // Fetch all reviews for this product in one query
    const allReviews = await Review.find({ product: productId })
      .populate("author", "firstname lastname profilePic")
      .sort({ createdAt: -1 })
      .lean();

    // Mask deleted reviews
    const maskedReviews = allReviews.map((r) => {
      if (r.isDeleted) {
        return {
          ...r,
          comment: "[deleted]",
          author:  null,
          rating:  null,
        };
      }
      return {
        ...r,
        likesCount: r.likes?.length || 0,
      };
    });

    // Get root reviews (depth 0) with pagination
    const rootReviews = maskedReviews
      .filter((r) => r.parentReview === null)
      .sort((a, b) => {
        if (sortBy === "most_liked") return b.likesCount - a.likesCount;
        if (sortBy === "top_rated")  return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "oldest")     return new Date(a.createdAt) - new Date(b.createdAt);
        return new Date(b.createdAt) - new Date(a.createdAt); // newest
      });

    const total       = rootReviews.length;
    const paginated   = rootReviews.slice(skip, skip + limitNum);

    // Build nested tree for each root review
    const tree = paginated.map((root) =>
      buildTree(root, maskedReviews)
    );

    // Rating summary
    const ratingReviews = allReviews.filter((r) => r.parentReview === null && !r.isDeleted && r.rating);
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingReviews.forEach((r) => { ratingBreakdown[r.rating]++; });

    const avgRating = ratingReviews.length > 0
      ? parseFloat(
          (ratingReviews.reduce((sum, r) => sum + r.rating, 0) / ratingReviews.length).toFixed(1)
        )
      : 0;

    res.status(200).json({
      success: true,
      summary: {
        averageRating:   avgRating,
        totalReviews:    total,
        ratingBreakdown,
      },
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum < Math.ceil(total / limitNum),
        hasPrev:    pageNum > 1,
      },
      data: tree,
    });
  } catch (error) {
    console.error("getReviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};


// ─── LIKE / UNLIKE A REVIEW ────────────────────────────────────────────────
// POST /api/products/:productId/reviews/:reviewId/like

exports.toggleLike = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId       = req.user._id;

    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const alreadyLiked = review.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      // Unlike
      await Review.findByIdAndUpdate(reviewId, {
        $pull: { likes: userId },
      });
      return res.status(200).json({
        success:    true,
        message:    "Like removed",
        liked:      false,
        likesCount: review.likes.length - 1,
      });
    } else {
      // Like
      await Review.findByIdAndUpdate(reviewId, {
        $addToSet: { likes: userId },
      });
      return res.status(200).json({
        success:    true,
        message:    "Review liked",
        liked:      true,
        likesCount: review.likes.length + 1,
      });
    }
  } catch (error) {
    console.error("toggleLike error:", error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};


// ─── EDIT REVIEW OR REPLY ──────────────────────────────────────────────────
// PUT /api/products/:productId/reviews/:reviewId

exports.editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId       = req.user._id;

    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const { comment, rating } = req.body;

    const review = await Review.findOne({ _id: reviewId, author: userId });
    if (!review) {
      return res.status(404).json({
        message: "Review not found or you are not the author",
      });
    }

    if (review.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted review" });
    }

    const updates = {};
    if (comment?.trim()) updates.comment = comment.trim();

    // Rating only editable on root reviews
    if (rating !== undefined && review.parentReview === null) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      updates.rating = Number(rating);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { $set: updates },
      { new: true }
    ).populate("author", "firstname lastname profilePic").lean();

    // Recalculate product rating if rating changed
    if (updates.rating) {
      await updateProductRating(review.product.toString());
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data:    updated,
    });
  } catch (error) {
    console.error("editReview error:", error);
    res.status(500).json({ message: "Failed to edit review" });
  }
};

// ─── DELETE REVIEW (HARD) ──────────────────────────────────────────────────
// DELETE /api/products/:productId/reviews/:reviewId
//
// Hard delete — removes from DB completely so user can review again.
// Also deletes all nested replies (depth 1 & 2) under this review.
//
// Who can delete:
//   ✅ The review AUTHOR — can re-review after deleting
//   ✅ The PRODUCT OWNER (seller) — can remove bad reviews on their listing
//   ❌ Admin — no permission
//   ❌ Other sellers — cannot touch reviews on products they don't own

exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId                  = req.user._id;

    if (!isValidObjectId(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ── Authorization ─────────────────────────────────────────────────────────
    const isAuthor = review.author.toString() === userId.toString();

    let isProductOwner = false;
    if (!isAuthor && productId && isValidObjectId(productId)) {
      const product = await Product.findById(productId).select("listedBy").lean();
      isProductOwner = product?.listedBy?.toString() === userId.toString();
    }

    if (!isAuthor && !isProductOwner) {
      return res.status(403).json({
        message: "You can only delete your own reviews or reviews on your own products",
      });
    }

    // ── Hard delete: remove this review + all its nested replies ──────────────
    // Depth 1 replies (direct children)
    const directReplies = await Review.find({ parentReview: reviewId }).lean();

    // Depth 2 replies (children of children)
    const depth2Ids = [];
    for (const reply of directReplies) {
      const deeper = await Review.find({ parentReview: reply._id }).lean();
      depth2Ids.push(...deeper.map(r => r._id));
    }

    if (depth2Ids.length > 0) {
      await Review.deleteMany({ _id: { $in: depth2Ids } });
    }
    if (directReplies.length > 0) {
      await Review.deleteMany({ parentReview: reviewId });
    }
    await Review.findByIdAndDelete(reviewId);

    // ── Recalculate product rating if root review deleted ─────────────────────
    if (review.parentReview === null) {
      await updateProductRating(review.product.toString());
    }

    res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    console.error("deleteReview error:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};


////////////////////////////////////////////////////////////////////
//// HELPERS
////////////////////////////////////////////////////////////////////

// Build nested tree — Reddit pyramid structure
function buildTree(node, allReviews) {
  const replies = allReviews.filter(
    (r) => r.parentReview?.toString() === node._id.toString()
  );

  return {
    ...node,
    likesCount: node.likes?.length || 0,
    replies:    replies.map((reply) => buildTree(reply, allReviews)),
  };
}

// Recalculate and update product average rating
async function updateProductRating(productId) {
  const reviews = await Review.find({
    product:      productId,
    parentReview: null,
    isDeleted:    false,
    rating:       { $ne: null },
  }).lean();

  const avgRating = reviews.length > 0
    ? parseFloat(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      )
    : 0;

  await Product.findByIdAndUpdate(productId, { rating: avgRating });
}