const mongoose = require("mongoose");

const PLANS = {
  basic: {
    name: "Basic",
    price: 2999,
    activeListings: 20,
    prioritySupport: false,
    supportType: "none",
  },
  standard: {
    name: "Standard",
    price: 5999,
    activeListings: 100,
    prioritySupport: true,
    supportType: "email",
  },
  premium: {
    name: "Premium",
    price: 11999,
    activeListings: -1,
    prioritySupport: true,
    supportType: "chat+call",
  },
};

const subscriptionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      enum: ["basic", "standard", "premium"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    activeListingsLimit: {
      type: Number,
      default: 20, // -1 = unlimited
    },

    prioritySupport: {
      type: Boolean,
      default: false,
    },

    supportType: {
      type: String,
      enum: ["none", "email", "chat+call"],
      default: "none",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // ─── isActive ──────────────────────────────────────────────────────────
    // true  → subscription is active (admin has NOT revoked it)
    // false → admin revoked it OR user cancelled
    // Note: even if isActive=true, check endDate to know if it's expired
    isActive: {
      type: Boolean,
      default: true,
    },

    paymentId: {
      type: String,
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "NetBanking", "Cash"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── VIRTUAL: subscriptionStatus ──────────────────────────────────────────
// Gives a clean readable status purely based on subscription fields
// "active"   → isActive=true AND not yet expired
// "expired"  → isActive=true BUT endDate has passed
// "revoked"  → isActive=false (admin revoked or user cancelled)
subscriptionSchema.virtual("subscriptionStatus").get(function () {
  if (!this.isActive) return "revoked";
  if (this.endDate < new Date()) return "expired";
  return "active";
});

// ─── VIRTUAL: daysRemaining ────────────────────────────────────────────────
subscriptionSchema.virtual("daysRemaining").get(function () {
  if (!this.isActive || this.endDate < new Date()) return 0;
  return Math.ceil(
    (new Date(this.endDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
});

subscriptionSchema.index({ seller: 1 });
subscriptionSchema.index({ isActive: 1, endDate: 1 });

const SubscriptionModel = mongoose.model("Subscription", subscriptionSchema);
SubscriptionModel.PLANS = PLANS;

module.exports = SubscriptionModel;