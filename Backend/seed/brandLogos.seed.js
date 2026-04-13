/**
 * brandLogos.seed.js
 * =====================================================================
 * Seeds brand logos into Cloudinary and updates DeviceCatalog in MongoDB.
 *
 * How to use:
 *   1. Place your logo images in ./seed/logos/ folder
 *      Name them exactly as: Apple.png, Samsung.png, Google.png etc.
 *   2. node seed/brandLogos.seed.js
 *
 * Supported formats: .png, .jpg, .jpeg, .webp, .svg
 * =====================================================================
 */

require("dotenv").config();

const fs         = require("fs");
const path       = require("path");
const cloudinary = require("cloudinary").v2;
const mongoose   = require("mongoose");

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// ─── Inline model — avoids importing full app stack ──────────────────────────
const DeviceCatalog = mongoose.model(
  "DeviceCatalog",
  new mongoose.Schema(
    {
      brand:    String,
      category: String,
      logo:     { type: String, default: null },
      models:   { type: Array, default: [] },
    },
    { timestamps: true }
  )
);

// ─── Logos folder ─────────────────────────────────────────────────────────────
// Place your brand logo images here named exactly as the brand name
// e.g. Apple.png, Samsung.png, OnePlus.webp
const LOGOS_DIR = path.join(__dirname, "logos");

// ─── Upload buffer to Cloudinary ─────────────────────────────────────────────
function uploadLogo(buffer, brandName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         "cashify/brand_logos",
        public_id:      brandName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        resource_type:  "image",
        overwrite:      true,
        transformation: [
          { width: 200, height: 200, crop: "pad", background: "white" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Validate env
  const missing = ["MONGO_URI", "CLOUDINARY_NAME", "CLOUDINARY_KEY", "CLOUDINARY_SECRET"]
    .filter((k) => !process.env[k]);

  if (missing.length) {
    console.error("❌ Missing env vars:", missing.join(", "));
    process.exit(1);
  }

  // Check logos folder exists
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
    console.log(`📁 Created logos folder at: ${LOGOS_DIR}`);
    console.log("   Place your brand logo images there and run again.");
    process.exit(0);
  }

  // Read all logo files
  const files = fs.readdirSync(LOGOS_DIR).filter((f) =>
    [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(
      path.extname(f).toLowerCase()
    )
  );

  if (files.length === 0) {
    console.log("⚠️  No logo files found in ./seed/logos/");
    console.log("   Add files named like: Apple.png, Samsung.jpg, etc.");
    process.exit(0);
  }

  console.log(`🔌 Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ Connected\n`);
  console.log(`📦 Found ${files.length} logo file(s)\n`);
  console.log("─".repeat(64));

  const summary = { uploaded: 0, notInDb: 0, errors: 0, skipped: 0 };

  for (const file of files) {
    const ext       = path.extname(file);
    const brandName = path.basename(file, ext); // "Apple.png" → "Apple"
    const filePath  = path.join(LOGOS_DIR, file);

    process.stdout.write(`  • ${brandName.padEnd(20)}`);

    const buffer = fs.readFileSync(filePath);

    // Upload to Cloudinary
    let logoUrl;
    try {
      logoUrl = await uploadLogo(buffer, brandName);
    } catch (err) {
      console.log(`❌  Cloudinary: ${err.message}`);
      summary.errors++;
      continue;
    }

    // Update all catalog entries for this brand (across all categories)
    const result = await DeviceCatalog.updateMany(
      { brand: brandName },
      { $set: { logo: logoUrl } }
    );

    if (result.matchedCount === 0) {
      console.log(`⚠️  Not in DB — logo uploaded anyway`);
      console.log(`        URL: ${logoUrl}`);
      summary.notInDb++;
    } else {
      console.log(`✅  Updated ${result.modifiedCount} catalog entry(ies)`);
      console.log(`        URL: ${logoUrl.slice(0, 60)}...`);
      summary.uploaded++;
    }
  }

  await mongoose.disconnect();

  console.log(`\n${"═".repeat(64)}`);
  console.log("🎉  Done!\n");
  console.log(`  ✅  Uploaded & DB updated : ${summary.uploaded}`);
  console.log(`  ⚠️   Uploaded, not in DB   : ${summary.notInDb}`);
  console.log(`  ❌  Errors                : ${summary.errors}`);
  console.log("═".repeat(64));
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});