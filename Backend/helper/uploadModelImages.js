/**
 * uploadModelImages.js
 * =====================================================================
 * Reads model images and names from Word documents (.docx),
 * uploads each image to Cloudinary, then updates the matching
 * model's `image` field in MongoDB DeviceCatalog.
 *
 * Usage:
 *   1. Place your .docx files in the ./docs/ folder next to this script.
 *   2. Copy your backend .env here (or set env vars manually).
 *   3. npm install
 *   4. node uploadModelImages.js
 *
 * Required env vars (same as your backend .env):
 *   MONGO_URI          – MongoDB connection string
 *   CLOUDINARY_NAME    – Cloudinary cloud name
 *   CLOUDINARY_KEY     – Cloudinary API key
 *   CLOUDINARY_SECRET  – Cloudinary API secret
 *
 * How it works:
 *   Each .docx has a pattern: image paragraph → text paragraph (model name).
 *   We use python-docx (via a spawned Python helper) to extract the
 *   (name, imageFile) pairs, then read the raw image bytes directly
 *   from the docx ZIP and stream them to Cloudinary.
 * =====================================================================
 */

require("dotenv").config();

const fs            = require("fs");
const path          = require("path");
const { execSync }  = require("child_process");
const AdmZip        = require("adm-zip");
const cloudinary    = require("cloudinary").v2;
const mongoose      = require("mongoose");

// ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// ─── Inline Mongoose model ────────────────────────────────────────────────────
const DeviceCatalog = mongoose.model(
  "DeviceCatalog",
  new mongoose.Schema(
    {
      brand:    String,
      category: String,
      models: [
        new mongoose.Schema(
          {
            name:      String,
            image:     { type: String, default: null },
            variants:  { type: Array, default: [] },
            soldCount: { type: Number, default: 0 },
          },
          { _id: true }
        ),
      ],
    },
    { timestamps: true }
  )
);

// ─── Docs to process ─────────────────────────────────────────────────────────
//  Add more entries here for other brands / categories.
const DOCS = [
  {
    docxPath: path.join(__dirname, "docs", "apple_mobillist.docx"),
    brand:    "Apple",
    category: "mobile",
  },
  {
    docxPath: path.join(__dirname, "docs", "google_mobillist.docx"),
    brand:    "Google",
    category: "mobile",
  },
];

// ─── Python helper: parse (name, imageFile) pairs from a .docx ───────────────
function parseDocxPairs(docxPath) {
  const python = `
import sys, json
from docx import Document

def parse(path):
    doc = Document(path)
    results = []
    pending = None
    for para in doc.paragraphs:
        img = None
        for run in para.runs:
            for elem in run._element:
                tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
                if tag == 'drawing':
                    blips = elem.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
                    if blips:
                        rId = blips[0].get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                        if rId:
                            rel = para.part.rels.get(rId)
                            if rel:
                                img = rel.target_ref.split('/')[-1]
        if img:
            pending = img
        elif para.text.strip() and pending:
            results.append({'name': para.text.strip(), 'imageFile': pending})
            pending = None
    print(json.dumps(results))

parse(sys.argv[1])
`;

  const raw = execSync(`python3 -c ${JSON.stringify(python)} ${JSON.stringify(docxPath)}`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(raw.trim());
}

// ─── Upload a Buffer to Cloudinary ───────────────────────────────────────────
function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         "cashify/models",
        public_id:      publicId,
        resource_type:  "image",
        overwrite:      true,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
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
  const missing = ["MONGO_URI", "CLOUDINARY_NAME", "CLOUDINARY_KEY", "CLOUDINARY_SECRET"].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    console.error("❌ Missing env vars:", missing.join(", "));
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected\n");

  const summary = { uploaded: 0, notInDb: 0, errors: 0 };

  for (const { docxPath, brand, category } of DOCS) {
    console.log(`\n${"─".repeat(64)}`);
    console.log(`📄  ${path.basename(docxPath)}  (brand=${brand}, category=${category})`);
    console.log("─".repeat(64));

    if (!fs.existsSync(docxPath)) {
      console.warn(`  ⚠️  File not found: ${docxPath} — skipping`);
      continue;
    }

    // 1. Parse name → imageFile pairs
    let pairs;
    try {
      pairs = parseDocxPairs(docxPath);
    } catch (err) {
      console.error("  ❌ Failed to parse docx:", err.message);
      summary.errors++;
      continue;
    }
    console.log(`  📦 Parsed ${pairs.length} model entries\n`);

    // 2. Open zip to read raw image bytes
    const zip = new AdmZip(docxPath);

    // 3. Process each model entry
    for (const { name, imageFile } of pairs) {
      process.stdout.write(`  • ${name.padEnd(42)}`);

      const entry = zip.getEntry(`word/media/${imageFile}`);
      if (!entry) {
        console.log(`❌  media entry missing (${imageFile})`);
        summary.errors++;
        continue;
      }
      const buffer = entry.getData();

      // Build a safe Cloudinary public_id
      const publicId = `${brand.toLowerCase()}_${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")}`;

      // Upload image to Cloudinary
      let imageUrl;
      try {
        imageUrl = await uploadBuffer(buffer, publicId);
      } catch (err) {
        console.log(`❌  Cloudinary: ${err.message}`);
        summary.errors++;
        continue;
      }

      // Update matching model in MongoDB
      const result = await DeviceCatalog.updateOne(
        { brand, category, "models.name": name },
        { $set: { "models.$.image": imageUrl } }
      );

      if (result.matchedCount === 0) {
        console.log(`⚠️  not in DB (URL saved to Cloudinary anyway)`);
        console.log(`        cloudinary: ${imageUrl}`);
        summary.notInDb++;
      } else {
        console.log(`✅  ${imageUrl.replace("https://res.cloudinary.com/", "cdn/").slice(0, 55)}...`);
        summary.uploaded++;
      }
    }
  }

  await mongoose.disconnect();

  console.log(`\n${"═".repeat(64)}`);
  console.log("🎉  All done!\n");
  console.log(`  ✅  Uploaded & DB updated  : ${summary.uploaded}`);
  console.log(`  ⚠️   Cloudinary OK, not in DB: ${summary.notInDb}`);
  console.log(`  ❌  Errors                 : ${summary.errors}`);
  console.log("═".repeat(64));
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});