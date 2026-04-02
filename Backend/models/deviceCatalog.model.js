// models/deviceCatalog.model.js
const mongoose = require("mongoose");

// Flexible key-value spec store — different per category:
//   mobile/tablet : { ram: "8 GB", storage: "256 GB" }
//   laptop        : { ram: "16 GB", storage: "512 GB", processor: "Intel i5 12th Gen" }
//   smartwatch    : { caseSize: "44", connectivity: "GPS + Cellular" }
//   television    : { screenSize: "55", resolution: "4K UHD", displayType: "OLED" }
const variantSchema = new mongoose.Schema(
  {
    specs:     { type: Map, of: String, default: {} }, // flexible key-value
    basePrice: { type: Number, required: true },
  },
  { _id: true }
);

const deviceModelSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    image:     { type: String, default: null },
    variants:  [variantSchema],
    soldCount: { type: Number, default: 0 },
  },
  { _id: true }
);

const deviceCatalogSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["mobile", "laptop", "tablet", "smartwatch", "television"],
      required: true,
    },
    models: [deviceModelSchema],
  },
  { timestamps: true }
);

deviceCatalogSchema.index({ brand: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("DeviceCatalog", deviceCatalogSchema);