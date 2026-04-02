const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // ─── PRODUCT ───────────────────────────────────────────────────
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // ─── AUTHOR ────────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── CONTENT ───────────────────────────────────────────────────
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },

    // ─── RATING — only on root reviews (parentReview: null) ────────
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      default: null,
      // Root reviews only — enforced in controller. Replies always null.
    },

    // ─── NESTED STRUCTURE ──────────────────────────────────────────
    // null = root review
    // ObjectId = this is a reply to that review/comment
    parentReview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },

    // depth: 0 = root review, 1 = reply, 2 = reply to reply (max)
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },

    // ─── LIKES ─────────────────────────────────────────────────────
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ─── SOFT DELETE ───────────────────────────────────────────────
    // Deleted comments show as "[deleted]" like Reddit
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ─── MEDIA ─────────────────────────────────────────────────────
    // Up to 5 images and 1 video per review
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 images allowed per review",
      },
    },

    video: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// ─── INDEXES ───────────────────────────────────────────────────────────────
reviewSchema.index({ product: 1, parentReview: 1 });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ author: 1 });
reviewSchema.index({ parentReview: 1 });

module.exports = mongoose.model("Review", reviewSchema);
