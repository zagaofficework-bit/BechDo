const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    // ─── OWNER ─────────────────────────────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // ─── ADDRESS FIELDS ────────────────────────────────────────────────────────
    street: {
      type: String,
      required: [true, "Street is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
    },

    full: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── DEFAULT FLAG ──────────────────────────────────────────────────────────
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: -1 });

module.exports = mongoose.model("Address", addressSchema);
