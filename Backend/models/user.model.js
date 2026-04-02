const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ─── BASIC INFO ────────────────────────────────────────────────────────────

    firstname: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastname: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      unique: true,
      trim: true,
    },

    profilePic: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["admin", "seller", "user"],
      default: "user",
    },

    // ─── LOCATION — GeoJSON Point for proximity search ─────────────────────────

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // ─── DEFAULT ADDRESS SNAPSHOT ──────────────────────────────────────────────
    // Mirrors the user's default Address document.
    // Kept in sync by syncUserAddress() in profile/address controller.
    // Used by product listings and geo queries to avoid extra joins.

    defaultAddress: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      pincode: { type: String, default: null },
      full: { type: String, default: null },
    },
    // ─── SUBSCRIPTION — only relevant for sellers ───────────────────────────────

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    // ─── ACCOUNT STATUS ────────────────────────────────────────────────────────
    // active    → normal, full access
    // suspended → temporarily paused by admin (subscription paused)
    // banned    → permanently banned by admin (all access revoked)

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    // ─── SUSPENSION DETAILS — set when admin pauses a seller ───────────────────

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    suspensionReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── BAN DETAILS — set when admin permanently bans a seller ────────────────

    bannedAt: {
      type: Date,
      default: null,
    },

    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    banReason: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── AUTH ──────────────────────────────────────────────────────────────────

    refreshToken: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    // ─── SUPER SELLER FLAG ─────────────────────────────────────────
    // Set manually in DB — only one seller gets this
    // db.users.updateOne({ email: "..." }, { $set: { isSuperSeller: true } })
    isSuperSeller: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// ─── INDEXES ───────────────────────────────────────────────────────────────────

userSchema.index({ location: "2dsphere" }); // geospatial queries
userSchema.index({ role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ accountStatus: 1 }); // admin filters

module.exports = mongoose.model("User", userSchema);
