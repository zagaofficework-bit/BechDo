const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ─── BASIC INFO ────────────────────────────────────────────────
    title: {
      type:     String,
      required: [true, "Product title is required"],
      trim:     true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type:     String,
      required: [true, "Category is required"],
      enum:     ["mobile", "laptop", "tablet", "smartwatch","television"],
    },

    subcategory: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    // ─── DEVICE TYPE ───────────────────────────────────────────────
    deviceType: {
      type:     String,
      enum:     ["new", "refurbished", "old"],
      required: [true, "Device type is required"],
    },

    // ─── DEVICE SPECS ──────────────────────────────────────────────
    condition: {
      type:     String,
      enum:     ["Fair", "Good", "Superb"],
      required: [true, "Condition is required"],
    },

    storage: {
      type: String,
      trim: true,
    },

    color: {
      type: String,
      trim: true,
    },

    // ─── PRICING & PAYMENT ─────────────────────────────────────────
    price: {
      type:     Number,
      required: [true, "Price is required"],
      min:      [0, "Price cannot be negative"],
    },

    originalPrice: {
      type:    Number,
      default: null,
    },

    // ─── MEDIA ─────────────────────────────────────────────────────
    images: {
      type:     [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 5,
        message:   "Product must have between 1 and 5 images",
      },
    },

    video: {
      type:    String,
      default: null,
    },

    // ─── LOCATION ──────────────────────────────────────────────────
    location: {
      type: {
        type:    String,
        enum:    ["Point"],
        default: "Point",
      },
      coordinates: {
        type:     [Number],
        required: true,
      },
    },

    address: {
      city:    { type: String },
      state:   { type: String },
      pincode: { type: String },
      full:    { type: String },
    },

    // ─── OWNERSHIP ─────────────────────────────────────────────────
    listedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "listedBy is required"],
    },

    listedByRole: {
      type: String,
      enum: ["seller", "user"],
    },

    // ─── COMMISSION ────────────────────────────────────────────────
    commissionRate: {
      type:    Number,
      default: 5,
    },

    // ─── STATUS ────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["available", "sold", "inactive", "reserved", "hidden"],
      default: "available",
    },

    rating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },

    quantity: {
      type:    Number,
      default: 1,
      min:     1,
    },

    ////////////////////////////////////////////////////////////////////
    //// SPECS — embedded directly in product
    ////////////////////////////////////////////////////////////////////

    specs: {
      // ─── PERFORMANCE ─────────────────────────────────────────────
      performance: {
        chipsetFull: { type: String, trim: true, default: null }, // "Qualcomm Snapdragon 8 Elite Gen 5 SM8850-AC"
        ram:         { type: String, trim: true, default: null }, // "12 GB"
      },

      // ─── DISPLAY ─────────────────────────────────────────────────
      display: {
        sizeInches:     { type: String, trim: true, default: null }, // "6.9 inches"
        sizeCm:         { type: String, trim: true, default: null }, // "17.53 cm"
        type:           { type: String, trim: true, default: null }, // "Dynamic AMOLED 2x"
        resolution:     { type: String, trim: true, default: null }, // "1440x3120 px"
        resolutionType: { type: String, trim: true, default: null }, // "QHD+"
        refreshRate:    { type: String, trim: true, default: null }, // "120 Hz"
      },

      // ─── REAR CAMERA ─────────────────────────────────────────────
      rearCamera: {
        primary:    { type: String, default: null }, // "200 MP"
        secondary:  { type: String, default: null }, // "10 MP"
        tertiary:   { type: String, default: null }, // "8 MP"
        quaternary: { type: String, default: null }, // "50 MP"
      },

      // ─── FRONT CAMERA ────────────────────────────────────────────
      frontCamera: { type: String, default: null }, // "12 MP"

      // ─── BATTERY ─────────────────────────────────────────────────
      battery: {
        capacity:      { type: String, default: null }, // "5000 mAh"
        wiredCharging: { type: String, default: null }, // "60W Super Fast Charging"
      },

      // ─── STORAGE TYPE ────────────────────────────────────────────
      // storage capacity lives in the root "storage" field above
      storageType: { type: String, default: null }, // "UFS 4.0"
    },
  },
  { timestamps: true }
);

// ─── INDEXES ───────────────────────────────────────────────────────────────
productSchema.index({ location: "2dsphere" });
productSchema.index({ title: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, condition: 1, price: 1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ status: 1 });
productSchema.index({ listedBy: 1 });
productSchema.index({ deviceType: 1 });

module.exports = mongoose.model("Product", productSchema);