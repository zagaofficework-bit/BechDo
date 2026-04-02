// models/evaluationConfig.model.js
const mongoose = require("mongoose");

// Sub-defect with image support
const subDefectSchema = new mongoose.Schema(
  {
    key:       { type: String, required: true },
    label:     { type: String, required: true },
    image:     { type: String, default: null }, // Image URL for this sub-defect
    deduction: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

// Top-level defect group with image support
// If children[] is non-empty, deduction comes from selected children.
// If children[] is empty, it behaves as a standalone defect.
const defectSchema = new mongoose.Schema(
  {
    key:       { type: String, required: true },
    label:     { type: String, required: true },
    image:     { type: String, default: null }, // Image URL for parent defect
    order:     { type: Number, required: true },
    deduction: { type: Number, required: true, default: 0 },
    children:  { type: [subDefectSchema], default: [] },
  },
  { _id: false }
);

// Question schema (unchanged)
const questionSchema = new mongoose.Schema(
  {
    key:            { type: String, required: true },
    label:          { type: String, required: true },
    order:          { type: Number, required: true },
    deductionOnNo:  { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

// Accessory schema (unchanged)
const accessorySchema = new mongoose.Schema(
  {
    key:      { type: String, required: true },
    label:    { type: String, required: true },
    order:    { type: Number, required: true },
    addition: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

// Main evaluation config schema
const evaluationConfigSchema = new mongoose.Schema(
  {
    category: {
      type:     String,
      enum:     ["mobile", "laptop", "tablet", "smartwatch", "television"],
      required: true,
      unique:   true,
    },
    questions:     { type: [questionSchema],  default: [] },
    defects:       { type: [defectSchema],    default: [] },
    accessories:   { type: [accessorySchema], default: [] },
    processingFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EvaluationConfig", evaluationConfigSchema);