const mongoose = require("mongoose");

// ─── UPI Sub-schema ───────────────────────────────────────────────────────────

const upiSchema = new mongoose.Schema(
  {
    upiId: {
      type:     String,
      required: [true, "UPI ID is required"],
      trim:     true,
    },
    nickname: {
      type:    String,
      trim:    true,
      default: null,  // e.g. "GPay", "PhonePe"
    },
  },
  { _id: false }
);

// ─── Card Sub-schema ──────────────────────────────────────────────────────────

const cardSchema = new mongoose.Schema(
  {
    last4: {
      type:     String,
      required: [true, "Last 4 digits are required"],
      length:   4,
    },
    brand: {
      type:    String,
      enum:    ["Visa", "Mastercard", "RuPay", "Amex", "Other"],
      default: "Other",
    },
    expiryMonth: {
      type:     Number,
      required: [true, "Expiry month is required"],
      min:      1,
      max:      12,
    },
    expiryYear: {
      type:     Number,
      required: [true, "Expiry year is required"],
    },
    cardholderName: {
      type:     String,
      required: [true, "Cardholder name is required"],
      trim:     true,
    },
    type: {
      type:    String,
      enum:    ["credit", "debit"],
      default: "debit",
    },
  },
  { _id: false }
);

// ─── NetBanking Sub-schema ────────────────────────────────────────────────────

const netBankingSchema = new mongoose.Schema(
  {
    bankName: {
      type:     String,
      required: [true, "Bank name is required"],
      trim:     true,
    },
    accountHolderName: {
      type:     String,
      required: [true, "Account holder name is required"],
      trim:     true,
    },
    maskedAccountNumber: {
      type:     String,   // store last 4 digits only e.g. "XXXX1234"
      required: [true, "Account number is required"],
      trim:     true,
    },
    ifscCode: {
      type:     String,
      required: [true, "IFSC code is required"],
      trim:     true,
      uppercase: true,
    },
  },
  { _id: false }
);

// ─── Main PaymentMethod Schema ────────────────────────────────────────────────

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "User ID is required"],
    },

    type: {
      type:     String,
      enum:     ["UPI", "Card", "NetBanking"],
      required: [true, "Payment method type is required"],
    },

    // Only one of these will be populated based on type
    upi:        { type: upiSchema,        default: null },
    card:       { type: cardSchema,       default: null },
    netBanking: { type: netBankingSchema, default: null },

    isDefault: {
      type:    Boolean,
      default: false,
    },

    label: {
      type:    String,
      trim:    true,
      default: null,   // custom label e.g. "My SBI Card"
    },
  },
  {
    timestamps: true,
  }
);

// ─── INDEXES ──────────────────────────────────────────────────────────────────

paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: -1 });

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);