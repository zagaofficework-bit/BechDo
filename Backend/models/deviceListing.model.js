// models/deviceListing.model.js
const mongoose = require("mongoose");

const timeslotSchema = new mongoose.Schema(
  {
    date:      { type: String, required: true },
    timeRange: { type: String, required: true },
  },
  { _id: false }
);

const pickupSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["awaiting_user_confirmation", "scheduled", "completed"],
      default: "awaiting_user_confirmation",
    },
    proposedSlots:  [timeslotSchema],
    confirmedSlot:  { type: timeslotSchema, default: null },
    paymentMethod:  { type: String, enum: ["cash", "upi", "bank_transfer", null], default: null },
    paymentDetails: { type: String, default: null },
    confirmedAt:    { type: Date, default: null },
  },
  { _id: false }
);

const deviceListingSchema = new mongoose.Schema(
  {
    listedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Device identity ──────────────────────────────────────────
    brand:    { type: String, required: true },
    category: {
      type: String,
      enum: ["mobile", "laptop", "tablet", "smartwatch", "television"],
      required: true,
    },
    model:    { type: String, required: true },
    image:    { type: String, default: null },

    // ── Flexible specs ───────────────────────────────────────────
    specs: { type: Map, of: String, default: {} },

    // ── Evaluation ───────────────────────────────────────────────
    evaluation: {
      answers:  { type: Map, of: Boolean, default: {} },
      defects: [
        {
          key:       { type: String },
          label:     { type: String },
          deduction: { type: Number },
        },
      ],
      accessoryKeys: [{ type: String }],
    },

    // ── Pricing ──────────────────────────────────────────────────
    basePrice:       { type: Number, required: true },
    totalDeduction:  { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    additionAmount:  { type: Number, default: 0 },
    processingFee:   { type: Number, default: 0 },
    finalPrice:      { type: Number, required: true },

    // ── Status / visibility ──────────────────────────────────────
    status: {
      type: String,
      enum: ["available", "accepted", "completed", "rejected", "cancelled"],
      default: "available",
    },
    visibility: {
      type: String,
      enum: ["super_seller_only", "all_sellers"],
      default: "super_seller_only",
    },
    superSellerRejected:   { type: Boolean, default: false },
    superSellerRejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    superSellerRejectedAt: { type: Date, default: null },
    superSellerExpiresAt:  { type: Date, default: null },

    // ── Seller ───────────────────────────────────────────────────
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acceptedAt: { type: Date, default: null },

    // ── Pickup ───────────────────────────────────────────────────
    pickup: { type: pickupSchema, default: null },

    completedAt:     { type: Date, default: null },
    rejectedAt:      { type: Date, default: null },
    rejectionReason: { type: String, default: null },

    // ── Rejection evidence images (up to 3) ─────────────────────
    rejectionImages: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message:   "A maximum of 3 rejection images are allowed",
      },
    },
  },
  { timestamps: true }
);

deviceListingSchema.index({ listedBy: 1 });
deviceListingSchema.index({ status: 1, visibility: 1 });
deviceListingSchema.index({ brand: 1, model: 1 });

module.exports = mongoose.model("DeviceListing", deviceListingSchema);