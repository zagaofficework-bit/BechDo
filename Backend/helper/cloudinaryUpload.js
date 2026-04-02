const cloudinary  = require("cloudinary").v2;
const streamifier = require("streamifier");

// ─── CLOUDINARY CONFIG ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// ─── UPLOAD FILE TO CLOUDINARY ────────────────────────────────────────────────
// options:
//   resourceType  "image" | "video" | "raw"  (default: "image")
//   folder        string                      (default: "cashify/products")
//
// Always pass resourceType explicitly — never rely on "auto" for video
// because Cloudinary's auto-detection can fail when buffer has no extension.

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("File buffer is missing"));
    }

    const resourceType = options.resourceType || "image"; // explicit default

    // Transformation differs by type:
    //   image → quality auto, format auto (webp/avif where supported)
    //   video → quality auto, always re-encode to mp4
    const transformation =
      resourceType === "video"
        ? [{ quality: "auto", fetch_format: "mp4" }]
        : [{ quality: "auto", fetch_format: "auto" }];

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:         options.folder || "cashify/products",
        resource_type:  resourceType,       // ← always explicit, never "auto"
        transformation,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;