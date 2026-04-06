/**
 * seed/deviceSell.seed.js
 *
 * Does three things in one run:
 *   1. Uploads every model image from the Word docs → Cloudinary
 *   2. Inserts / merges EvaluationConfig documents
 *   3. Inserts / merges DeviceCatalog documents (with Cloudinary URLs)
 *
 * Usage:
 *   node seed/deviceSell.seed.js
 *   # or via npm:
 *   npm run seed
 *
 * Prerequisites:
 *   - python3 + python-docx  →  pip3 install python-docx
 *   - adm-zip in package.json (already added)
 *   - .env with MONGO_URI, CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET
 *
 * Word-doc placement (relative to project root):
 *   seed/docs/apple_mobillist.docx
 *   seed/docs/google_mobillist.docx
 *
 * Re-running is fully safe:
 *   - Cloudinary: overwrite:true  → replaces same public_id
 *   - EvaluationConfig: deleteMany + insertMany  → full refresh
 *   - DeviceCatalog: deleteMany + insertMany      → full refresh
 */

"use strict";

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const AdmZip = require("adm-zip");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const EvaluationConfig = require("../models/evaluationConfig.model");
const DeviceCatalog = require("../models/deviceCatalog.model");

require("dotenv").config();

// ─── Cloudinary setup ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/cashify_backend";

// ─── Word-doc → brand config ──────────────────────────────────────────────────
// docxPath is relative to this seed file's location
const DOCS_DIR = path.join(__dirname, "docs");

const IMAGE_DOCS = [
  {
    docxPath: path.join(DOCS_DIR, "apple_mobillist.docx"),
    brand: "Apple",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "google_mobillist.docx"),
    brand: "Google",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "moto_mobillist.docx"),
    brand: "Motorola",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "nokia_mobillist.docx"),
    brand: "Nokia",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "nothing_mobillist.docx"),
    brand: "Nothing",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "onepluse_mobillist.docx"),
    brand: "OnePlus",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "oppo_mobillist.docx"),
    brand: "Oppo",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "poco_mobillist.docx"),
    brand: "Poco",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "realmi_mobillist.docx"),
    brand: "Realme",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "sammobillist.docx"),
    brand: "Samsung",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "vivo_mobillist.docx"),
    brand: "Vivo",
    category: "mobile",
  },
  {
    docxPath: path.join(DOCS_DIR, "xiomi_mobillist.docx"),
    brand: "Xiaomi",
    category: "mobile",
  },
];

const SPEC_DOCS = {
  Samsung: path.join(DOCS_DIR, "Samsung_Galaxy_Complete_Specs.docx"),
};

// ─── Parse a .docx → [{ name, imageFile }] ───────────────────────────────────
// Pure Node.js approach - no python needed. Parses the XML directly using adm-zip.
function parseDocx(docxPath) {
  const zip = new AdmZip(docxPath);

  // Read document.xml
  const docXmlEntry = zip.getEntry("word/document.xml");
  if (!docXmlEntry) throw new Error("document.xml not found in docx");
  const docXml = docXmlEntry.getData().toString("utf8");

  // Read relationships file
  const relsEntry = zip.getEntry("word/_rels/document.xml.rels");
  if (!relsEntry) throw new Error("document.xml.rels not found in docx");
  const relsXml = relsEntry.getData().toString("utf8");

  // Build rId → image filename map from relationships
  const relMap = {};
  const relMatches = relsXml.matchAll(
    /Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g,
  );
  for (const m of relMatches) {
    relMap[m[1]] = m[2]; // e.g. relMap["rId5"] = "image1.png"
  }

  // Parse paragraphs from document.xml
  // Each <w:p> is a paragraph; we look for drawings (images) and text runs
  const out = [];
  let pending = null;

  // Split by paragraph tags
  const paragraphs = docXml.split(/<w:p[ >]/);

  for (const para of paragraphs) {
    // Check if paragraph contains a drawing/image
    const blipMatch = para.match(/r:embed="(rId\d+)"/);
    const imageFile = blipMatch ? relMap[blipMatch[1]] : null;

    // Extract plain text from <w:t> tags
    const textMatches = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    const text = textMatches
      .map((m) => m[1])
      .join("")
      .trim();

    if (imageFile) {
      pending = imageFile;
    } else if (text && pending) {
      out.push({ name: text, imageFile: pending });
      pending = null;
    }
  }

  return out;
}

const parseSpecDoc = (docxPath) => {
  const zip = new AdmZip(docxPath);
  const docXmlEntry = zip.getEntry("word/document.xml");
  if (!docXmlEntry) throw new Error("document.xml not found");
  const docXml = docXmlEntry.getData().toString("utf8");

  const specMap = {};
  const rows = docXml.split(/<w:tr[ >]/);

  for (const row of rows.slice(1)) {
    const cells = [];
    const cellBlocks = row.split(/<w:tc[ >]/);

    for (const cell of cellBlocks.slice(1)) {
      const textMatches = [...cell.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
      const text = textMatches
        .map((m) => m[1])
        .join("")
        .trim();
      if (text) cells.push(text);
    }

    if (cells.length < 3) continue;

    const [modelName, ramRaw, storageRaw] = cells;
    if (/model name/i.test(modelName)) continue;

    specMap[modelName.trim()] = {
      rams: ramRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      storages: storageRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  return specMap;
};
// ─── Upload one image buffer to Cloudinary ────────────────────────────────────
// cloudinary v2 upload_stream API is unchanged — still callback-based
function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cashify/models",
        public_id: publicId,
        resource_type: "image",
        overwrite: true,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(buffer);
  });
}

async function getExistingImage(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result.secure_url; // already uploaded
  } catch (err) {
    if (err.http_code === 404) {
      return null; // not found → upload needed
    }
    throw err; // real error
  }
}

function buildModels(imageMap, brand) {
  const seen = new Set();

  return Object.entries(imageMap[brand] || {})
    .map(([rawName, image]) => {
      const name = rawName.replace(new RegExp(`^${brand}\\s+`, "i"), "").trim();

      if (seen.has(name)) return null;
      seen.add(name);

      return {
        name,
        image,
        variants: generateVariants(name, brand),
      };
    })
    .filter(Boolean);
}

// ─── Build slug for Cloudinary public_id ─────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Phase 1 — Upload all model images from docs to Cloudinary.
 *
 * Returns a nested map:
 *   imageMap[brand][modelName] = cloudinarySecureUrl
 *
 * The model names in the docs carry the brand prefix
 * ("Apple iPhone 13") but the seed uses short names ("iPhone 13").
 * We store both forms so the lookup always succeeds.
 */
async function uploadAllImages() {
  const imageMap = {}; // brand → { shortName → url, fullDocName → url }

  for (const { docxPath, brand, category } of IMAGE_DOCS) {
    if (!fs.existsSync(docxPath)) {
      console.warn(`  ⚠️  Doc not found, skipping image upload: ${docxPath}`);
      continue;
    }

    console.log(`\n  📄 Parsing ${path.basename(docxPath)} ...`);
    const pairs = parseDocx(docxPath);
    console.log(`     ${pairs.length} entries found`);

    const zip = new AdmZip(docxPath);
    if (!imageMap[brand]) imageMap[brand] = {};

    for (const { name: docName, imageFile } of pairs) {
      const entry = zip.getEntry(`word/media/${imageFile}`);
      if (!entry) {
        console.warn(`     ⚠️  Missing media: ${imageFile} for "${docName}"`);
        continue;
      }

      const publicId = `cashify/models/${toSlug(brand)}_${toSlug(docName)}`
      let url = null;

// STEP 1: Try Cloudinary
try {
  url = await getExistingImage(publicId);
} catch (err) {
  console.warn(`⚠️ Cloudinary check failed for "${docName}"`);
}

// STEP 2: If not found → use fallback
if (!url) {
  console.log(`⏭️ No Cloudinary image, using fallback for ${docName}`);

  // 👉 fallback (safe default)
  url = "https://via.placeholder.com/300x300?text=No+Image";
}

// STEP 3: Always store (IMPORTANT)
console.log(`✅ Image set for ${docName}`);

imageMap[brand][docName] = url;

const shortName = docName
  .replace(new RegExp(`^${brand}\\s+`, "i"), "")
  .trim();

imageMap[brand][shortName] = url;
    }
  }

  return imageMap;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── SVG icon builder (unchanged from original seed) ───────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const svg = (content) => {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">${content}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(raw).toString("base64")}`;
};

const PHONE = `<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
<rect x="48" y="10" width="24" height="3" rx="1.5" fill="#cbd5e1"/>`;

const PHONE_BACK = `<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
<rect x="48" y="10" width="24" height="3" rx="1.5" fill="#cbd5e1"/>
<rect x="42" y="20" width="20" height="20" rx="4" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
<circle cx="52" cy="30" r="6" fill="#e0f2fe" stroke="#1e293b" stroke-width="1.5"/>`;

const LAPTOP = `<rect x="10" y="30" width="100" height="68" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="16" y="36" width="88" height="52" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<rect x="5" y="98" width="110" height="8" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
<rect x="40" y="100" width="40" height="4" rx="2" fill="#e2e8f0"/>`;

const TABLET = `<rect x="22" y="6" width="76" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="30" y="16" width="60" height="88" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<rect x="55" y="10" width="10" height="3" rx="1.5" fill="#cbd5e1"/>`;

const WATCH = `<rect x="42" y="28" width="36" height="36" rx="8" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="46" y="32" width="28" height="28" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<rect x="50" y="6" width="20" height="22" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
<rect x="50" y="64" width="20" height="22" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>`;

const TV = `<rect x="8" y="14" width="104" height="72" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="14" y="20" width="92" height="60" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<path d="M44 86 L40 106 M76 86 L80 106" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
<rect x="36" y="106" width="48" height="5" rx="2.5" fill="white" stroke="#1e293b" stroke-width="2"/>`;

const T = "#00b4a0";
const R = "#ef4444";

const IMG = {
  mobile_screen_cracked: svg(`${PHONE}
    <line x1="48" y1="24" x2="56" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="42" x2="44" y2="58" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="42" x2="70" y2="52" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="58" x2="52" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="48" y1="24" x2="38" y2="32" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="48" y1="24" x2="62" y2="20" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  mobile_dead_pixels: svg(`${PHONE}
    <circle cx="50" cy="38" r="3" fill="${T}" opacity="0.4"/><circle cx="60" cy="38" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="70" cy="38" r="3" fill="${T}" opacity="0.4"/><circle cx="50" cy="50" r="3" fill="${T}"/>
    <line x1="47" y1="47" x2="53" y2="53" stroke="white" stroke-width="1.5"/>
    <line x1="53" y1="47" x2="47" y2="53" stroke="white" stroke-width="1.5"/>
    <circle cx="60" cy="50" r="3" fill="${T}" opacity="0.4"/><circle cx="70" cy="50" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="50" cy="62" r="3" fill="${T}" opacity="0.4"/><circle cx="60" cy="62" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="70" cy="62" r="3" fill="${T}" opacity="0.4"/>`),
  mobile_touch: svg(`${PHONE}
    <path d="M54 70 C54 62 58 56 64 54 C68 52 72 54 72 58 L72 72 C72 76 76 76 76 80 L76 84 C76 90 70 94 64 94 L60 94 C54 94 50 90 50 84 L50 74 C50 70 54 70 54 70Z" fill="white" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="57" y1="44" x2="63" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="44" x2="57" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  mobile_display_lines: svg(`${PHONE}
    <line x1="38" y1="28" x2="82" y2="28" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="38" y1="38" x2="82" y2="38" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="38" y1="52" x2="82" y2="52" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="62" y1="16" x2="62" y2="92" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),
  mobile_burn_in: svg(`${PHONE}
    <rect x="40" y="20" width="40" height="28" rx="2" fill="${T}" opacity="0.08"/>
    <rect x="43" y="23" width="34" height="22" rx="1" fill="${T}" opacity="0.1"/>
    <text x="45" y="37" font-size="7" fill="${T}" font-family="sans-serif" opacity="0.5">GHOST</text>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="none" stroke="${T}" stroke-width="1.5" stroke-dasharray="5 3"/>`),
  mobile_back_cracked: svg(`${PHONE_BACK}
    <line x1="60" y1="50" x2="68" y2="70" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="68" y1="70" x2="58" y2="82" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="60" y1="50" x2="72" y2="56" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="58" y1="82" x2="66" y2="88" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  mobile_body_dents:
    svg(`<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M32 48 C28 50 26 54 28 58 C30 62 32 62 32 62" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="28" cy="53" r="3" fill="${T}" opacity="0.3"/>
    <path d="M88 68 C92 66 94 70 92 74 C90 78 88 77 88 77" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`),
  mobile_body_scratches:
    svg(`<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="36" y1="40" x2="40" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="34" y1="55" x2="37" y2="68" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="84" y1="50" x2="87" y2="70" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`),
  mobile_frame_bent:
    svg(`<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M32 60 C28 62 26 70 30 74 C34 78 36 76 38 74" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M28 62 L34 60 M30 68 L36 66" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`),
  mobile_camera_broken: svg(`${PHONE_BACK}
    <circle cx="52" cy="30" r="9" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="48" y1="26" x2="56" y2="34" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="50" y1="24" x2="54" y2="36" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  mobile_camera_notworking: svg(`${PHONE_BACK}
    <circle cx="52" cy="30" r="9" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="48" y1="26" x2="56" y2="34" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="26" x2="48" y2="34" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  mobile_front_camera: svg(`${PHONE}
    <circle cx="60" cy="12" r="4" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="12" r="2" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <line x1="57" y1="7" x2="63" y2="7" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="63" y1="7" x2="57" y2="13" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="68" cy="6" r="4" fill="${T}" opacity="0.8"/>
    <text x="65.5" y="9.5" font-size="6" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),
  mobile_charging_port: svg(`${PHONE}
    <rect x="53" y="108" width="14" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M62 96 L58 103 L62 103 L58 112" stroke="${T}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  mobile_speaker: svg(`${PHONE}
    <rect x="50" y="10" width="20" height="4" rx="2" fill="#94a3b8"/>
    <path d="M54 36 L58 32 L58 44 L54 40 L50 40 L50 36 Z" fill="${T}" opacity="0.8"/>
    <line x1="62" y1="33" x2="66" y2="43" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="66" y1="33" x2="62" y2="43" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  mobile_microphone: svg(`${PHONE}
    <rect x="56" y="32" width="8" height="16" rx="4" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M50 44 C50 50 54 54 60 54 C66 54 70 50 70 44" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <line x1="60" y1="54" x2="60" y2="60" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="60" x2="64" y2="60" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="36" x2="62" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="62" y1="36" x2="56" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  mobile_battery: svg(`${PHONE}
    <rect x="42" y="46" width="36" height="20" rx="3" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="78" y="52" width="4" height="8" rx="2" fill="#1e293b"/>
    <rect x="45" y="49" width="8" height="14" rx="2" fill="${T}" opacity="0.3"/>
    <line x1="56" y1="50" x2="62" y2="64" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="50" x2="56" y2="64" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  mobile_water: svg(`${PHONE}
    <path d="M52 50 C52 46 56 38 60 36 C64 38 68 46 68 50 C68 55.5 64.4 60 60 60 C55.6 60 52 55.5 52 50Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>
    <path d="M42 64 C42 61 44 56 46 55 C48 56 50 61 50 64 C50 67.3 48.2 70 46 70 C43.8 70 42 67.3 42 64Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>
    <path d="M66 66 C66 63 68 60 70 59 C72 60 74 63 74 66 C74 69 72.2 72 70 72 C67.8 72 66 69 66 66Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>`),
  mobile_overheating: svg(`${PHONE}
    <path d="M52 60 C52 48 58 40 60 36 C62 40 68 48 68 60 C68 67 64.4 72 60 72 C55.6 72 52 67 52 60Z" fill="${R}" opacity="0.15" stroke="${R}" stroke-width="2"/>
    <path d="M56 58 C56 52 59 47 60 44 C61 47 64 52 64 58 C64 63 62.2 66 60 66 C57.8 66 56 63 56 58Z" fill="${R}" opacity="0.25" stroke="${R}" stroke-width="1.5"/>`),
  mobile_wifi_issue: svg(`${PHONE}
    <path d="M60 56 C66 56 71 53 74 48" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M60 56 C54 56 49 53 46 48" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M60 56 C63 56 66 54.5 68 52" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M60 56 C57 56 54 54.5 52 52" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="60" cy="58" r="3" fill="#1e293b"/>
    <line x1="56" y1="38" x2="64" y2="46" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="64" y1="38" x2="56" y2="46" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  mobile_fingerprint: svg(`${PHONE}
    <path d="M46 72 C46 64 52 58 60 58 C68 58 74 64 74 72" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M50 72 C50 66 54 62 60 62 C66 62 70 66 70 72" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M54 72 C54 68 57 66 60 66 C63 66 66 68 66 72" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <line x1="56" y1="46" x2="64" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="64" y1="46" x2="56" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  laptop_screen_cracked: svg(`${LAPTOP}
    <line x1="46" y1="42" x2="56" y2="60" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="60" x2="44" y2="74" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="60" x2="70" y2="68" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="46" y1="42" x2="36" y2="50" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="46" y1="42" x2="58" y2="38" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  laptop_dead_pixels: svg(`${LAPTOP}
    <circle cx="52" cy="55" r="3.5" fill="${T}"/>
    <line x1="49" y1="52" x2="55" y2="58" stroke="white" stroke-width="1.5"/>
    <line x1="55" y1="52" x2="49" y2="58" stroke="white" stroke-width="1.5"/>
    <circle cx="64" cy="48" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="74" cy="62" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="44" cy="66" r="2.5" fill="${T}" opacity="0.5"/>`),
  laptop_display_lines: svg(`${LAPTOP}
    <line x1="16" y1="48" x2="104" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="58" x2="104" y2="58" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="16" y1="72" x2="104" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="68" y1="36" x2="68" y2="88" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),
  laptop_backlight: svg(`${LAPTOP}
    <rect x="16" y="36" width="88" height="52" rx="2" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="16" y="36" width="44" height="52" rx="2" fill="#e0f2fe" opacity="0.6"/>
    <line x1="60" y1="38" x2="60" y2="86" stroke="${T}" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="28" y="66" font-size="9" fill="${T}" font-family="sans-serif" opacity="0.8">DIM</text>
    <text x="70" y="66" font-size="9" fill="#94a3b8" font-family="sans-serif">OK</text>`),
  laptop_discoloration: svg(`${LAPTOP}
    <rect x="16" y="36" width="88" height="52" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <ellipse cx="45" cy="62" rx="22" ry="16" fill="${T}" opacity="0.15"/>
    <ellipse cx="80" cy="50" rx="14" ry="10" fill="${R}" opacity="0.1"/>
    <text x="34" y="65" font-size="8" fill="${T}" font-family="sans-serif" opacity="0.7">stain</text>`),
  laptop_keyboard: svg(`${LAPTOP}
    <rect x="16" y="98" width="88" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="22" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>
    <rect x="36" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>
    <rect x="50" y="100" width="10" height="4" rx="1" fill="${T}" stroke="${T}" stroke-width="1"/>
    <line x1="53" y1="101.5" x2="57" y2="103.5" stroke="white" stroke-width="1.2"/>
    <line x1="57" y1="101.5" x2="53" y2="103.5" stroke="white" stroke-width="1.2"/>
    <rect x="64" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>
    <rect x="78" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>`),
  laptop_trackpad: svg(`${LAPTOP}
    <rect x="40" y="100" width="40" height="5" rx="1" fill="#f1f5f9" stroke="${T}" stroke-width="1.5"/>
    <line x1="56" y1="101.5" x2="64" y2="104.5" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="64" y1="101.5" x2="56" y2="104.5" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  laptop_hinge:
    svg(`<rect x="10" y="58" width="100" height="48" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="16" y="64" width="88" height="32" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="5" y="106" width="110" height="8" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M10 58 C10 30 14 18 30 14" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M110 58 C110 30 106 18 90 14" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M30 14 L90 14" stroke="#1e293b" stroke-width="2.5"/>
    <circle cx="28" cy="57" r="5" fill="white" stroke="${T}" stroke-width="2.5"/>
    <line x1="25" y1="54" x2="31" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="31" y1="54" x2="25" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="92" cy="57" r="5" fill="white" stroke="${T}" stroke-width="2.5"/>
    <line x1="89" y1="54" x2="95" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="95" y1="54" x2="89" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  laptop_body_cracks: svg(`${LAPTOP}
    <line x1="20" y1="88" x2="34" y2="96" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="34" y1="96" x2="24" y2="104" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="34" y1="96" x2="46" y2="98" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="86" y1="92" x2="96" y2="98" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`),
  laptop_body_dents: svg(`${LAPTOP}
    <path d="M20 72 C16 70 14 72 16 76 C18 80 22 79 22 79" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="15" cy="73" r="3" fill="${T}" opacity="0.25"/>
    <path d="M100 58 C104 56 106 58 104 62 C102 66 98 65 98 65" stroke="${T}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>`),
  laptop_port_damage: svg(`${LAPTOP}
    <rect x="102" y="54" width="10" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="102" y="66" width="10" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="103" y1="55" x2="111" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="111" y1="55" x2="103" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <rect x="5" y="62" width="8" height="5" rx="1.5" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="6" y1="63" x2="12" y2="67" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  laptop_battery: svg(`${LAPTOP}
    <rect x="32" y="50" width="56" height="28" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="88" y="60" width="6" height="8" rx="2" fill="#1e293b"/>
    <rect x="35" y="53" width="12" height="22" rx="2" fill="${T}" opacity="0.3"/>
    <line x1="56" y1="56" x2="64" y2="72" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <line x1="64" y1="56" x2="56" y2="72" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`),
  laptop_fan: svg(`${LAPTOP}
    <circle cx="60" cy="62" r="18" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="62" r="4" fill="${T}"/>
    <path d="M60 58 C58 52 52 50 50 54 C48 58 54 62 60 62" fill="${T}" opacity="0.5"/>
    <path d="M64 62 C70 60 72 54 68 52 C64 50 62 56 62 62" fill="${T}" opacity="0.5"/>
    <path d="M60 66 C62 72 68 74 70 70 C72 66 66 62 60 62" fill="${T}" opacity="0.5"/>
    <path d="M56 62 C50 64 48 70 52 72 C56 74 60 68 60 62" fill="${T}" opacity="0.5"/>
    <circle cx="75" cy="48" r="8" fill="${T}"/>
    <text x="72" y="52" font-size="10" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),
  laptop_liquid: svg(`${LAPTOP}
    <path d="M44 52 C44 46 48 38 52 36 C56 38 60 46 60 52 C60 58.6 56.4 64 52 64 C47.6 64 44 58.6 44 52Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>
    <path d="M62 58 C62 54 64 50 66 49 C68 50 70 54 70 58 C70 62 68 65 66 65 C64 65 62 62 62 58Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>`),
  laptop_ram: svg(`${LAPTOP}
    <rect x="28" y="52" width="64" height="18" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="32" y="56" width="8" height="10" rx="1.5" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="44" y="56" width="8" height="10" rx="1.5" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="56" y="56" width="8" height="10" rx="1.5" fill="${T}" opacity="0.4" stroke="${T}" stroke-width="1"/>
    <rect x="68" y="56" width="8" height="10" rx="1.5" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <circle cx="84" cy="48" r="7" fill="${T}"/>
    <text x="81.5" y="52" font-size="8" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),
  laptop_storage: svg(`${LAPTOP}
    <rect x="30" y="50" width="60" height="28" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="34" y="55" width="28" height="4" rx="2" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="34" y="63" width="28" height="4" rx="2" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="34" y="71" width="18" height="4" rx="2" fill="${T}" opacity="0.4" stroke="${T}" stroke-width="1"/>
    <line x1="70" y1="56" x2="82" y2="70" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="82" y1="56" x2="70" y2="70" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  tablet_screen_cracked: svg(`${TABLET}
    <line x1="44" y1="24" x2="54" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="54" y1="48" x2="40" y2="68" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="54" y1="48" x2="72" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="24" x2="32" y2="34" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="44" y1="24" x2="58" y2="18" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  tablet_touch: svg(`${TABLET}
    <path d="M52 72 C52 62 57 55 64 53 C69 51 74 53 74 58 L74 74 C74 79 78 79 78 84 L78 88 C78 95 72 99 66 99 L62 99 C56 99 52 95 52 89 L52 76 C52 72 52 72 52 72Z" fill="white" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="56" y1="42" x2="62" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="42" x2="56" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  tablet_dead_pixels: svg(`${TABLET}
    <circle cx="52" cy="44" r="3.5" fill="${T}"/>
    <line x1="49" y1="41" x2="55" y2="47" stroke="white" stroke-width="1.5"/>
    <line x1="55" y1="41" x2="49" y2="47" stroke="white" stroke-width="1.5"/>
    <circle cx="66" cy="36" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="76" cy="56" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="44" cy="60" r="2.5" fill="${T}" opacity="0.5"/>`),
  tablet_display_lines: svg(`${TABLET}
    <line x1="30" y1="36" x2="90" y2="36" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="90" y2="50" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="30" y1="68" x2="90" y2="68" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="65" y1="16" x2="65" y2="104" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),
  tablet_back_cracked:
    svg(`<rect x="22" y="6" width="76" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="55" y="10" width="10" height="3" rx="1.5" fill="#cbd5e1"/>
    <rect x="30" y="16" width="30" height="30" rx="5" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="45" cy="31" r="8" fill="#e0f2fe" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="58" y1="56" x2="68" y2="80" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="68" y1="80" x2="56" y2="96" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="58" y1="56" x2="72" y2="64" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  tablet_body_dents: svg(`${TABLET}
    <path d="M22 50 C17 48 15 52 18 56 C20 60 22 59 22 59" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="16" cy="52" r="3.5" fill="${T}" opacity="0.25"/>
    <path d="M98 70 C103 68 105 72 102 76 C100 80 98 79 98 79" stroke="${T}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>`),
  tablet_body_scratches: svg(`${TABLET}
    <line x1="26" y1="30" x2="30" y2="55" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="24" y1="48" x2="27" y2="65" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="93" y1="40" x2="96" y2="65" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`),
  tablet_charging_port: svg(`${TABLET}
    <rect x="54" y="111" width="12" height="6" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M62 97 L58 105 L62 105 L58 114" stroke="${T}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  tablet_battery: svg(`${TABLET}
    <rect x="34" y="52" width="52" height="24" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="86" y="61" width="5" height="6" rx="2" fill="#1e293b"/>
    <rect x="37" y="55" width="10" height="18" rx="2" fill="${T}" opacity="0.3"/>
    <line x1="56" y1="57" x2="64" y2="71" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <line x1="64" y1="57" x2="56" y2="71" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`),
  tablet_water: svg(`${TABLET}
    <path d="M48 52 C48 45 52 37 56 35 C60 37 64 45 64 52 C64 58 60.4 63 56 63 C51.6 63 48 58 48 52Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>
    <path d="M66 60 C66 57 68 54 70 53 C72 54 74 57 74 60 C74 63 72.2 66 70 66 C67.8 66 66 63 66 66Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>`),
  tablet_camera: svg(`${TABLET}
    <circle cx="80" cy="25" r="7" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="80" cy="25" r="4" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <line x1="77" y1="20" x2="83" y2="26" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="83" y1="20" x2="77" y2="26" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  tablet_speaker: svg(`${TABLET}
    <rect x="28" y="52" width="6" height="28" rx="3" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="31" y1="56" x2="31" y2="60" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="31" y1="64" x2="31" y2="68" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="27" y1="54" x2="33" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="33" y1="54" x2="27" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  watch_screen_cracked: svg(`${WATCH}
    <line x1="50" y1="35" x2="56" y2="46" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="46" x2="48" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="46" x2="66" y2="50" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="35" x2="44" y2="40" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  watch_dead_pixels: svg(`${WATCH}
    <circle cx="56" cy="42" r="3" fill="${T}"/>
    <line x1="53.5" y1="39.5" x2="58.5" y2="44.5" stroke="white" stroke-width="1.5"/>
    <line x1="58.5" y1="39.5" x2="53.5" y2="44.5" stroke="white" stroke-width="1.5"/>
    <circle cx="66" cy="46" r="2" fill="${T}" opacity="0.5"/>
    <circle cx="57" cy="52" r="2" fill="${T}" opacity="0.4"/>`),
  watch_touch_issue: svg(`${WATCH}
    <path d="M55 50 C55 46 57.5 43 60 42 C62.5 43 65 46 65 50 C65 53.5 62.7 56.5 60 56.5 C57.3 56.5 55 53.5 55 50Z" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="57" y1="36" x2="63" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="36" x2="57" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  watch_body_scratches: svg(`${WATCH}
    <line x1="44" y1="32" x2="46" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    <line x1="43" y1="40" x2="44.5" y2="50" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="74" y1="38" x2="76" y2="50" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`),
  watch_body_dents: svg(`${WATCH}
    <path d="M42 38 C38 36 36 40 38 44 C40 48 42 47 42 47" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="37" cy="40" r="3" fill="${T}" opacity="0.25"/>`),
  watch_strap_damaged: svg(`${WATCH}
    <line x1="50" y1="8" x2="70" y2="8" stroke="${T}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 2"/>
    <line x1="52" y1="12" x2="62" y2="16" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="62" y1="12" x2="52" y2="16" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="82" x2="70" y2="82" stroke="${T}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2" opacity="0.6"/>`),
  watch_crown: svg(`${WATCH}
    <rect x="78" y="40" width="10" height="12" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <line x1="80" y1="42" x2="86" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="86" y1="42" x2="80" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  watch_battery: svg(`${WATCH}
    <rect x="46" y="34" width="28" height="18" rx="3" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="74" y="40" width="4" height="6" rx="1.5" fill="#1e293b"/>
    <rect x="49" y="37" width="5" height="12" rx="1.5" fill="${T}" opacity="0.3"/>
    <line x1="57" y1="37" x2="63" y2="49" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="37" x2="57" y2="49" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  watch_charging: svg(`${WATCH}
    <circle cx="60" cy="96" r="8" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M60 88 L60 80 M56 84 L60 88 L64 84" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="57" y1="93" x2="63" y2="99" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="93" x2="57" y2="99" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),
  watch_water: svg(`${WATCH}
    <path d="M50 76 C50 70 54 62 58 60 C62 62 66 70 66 76 C66 82.6 62.4 88 58 88 C53.6 88 50 82.6 50 76Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>`),
  watch_sensor: svg(`${WATCH}
    <rect x="48" y="60" width="24" height="16" rx="4" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="68" r="4" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <line x1="56" y1="64" x2="64" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="64" y1="64" x2="56" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  tv_panel_cracked: svg(`${TV}
    <line x1="40" y1="28" x2="52" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="52" y1="50" x2="38" y2="68" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="52" y1="50" x2="70" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="28" x2="28" y2="36" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="40" y1="28" x2="54" y2="22" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="70" y1="60" x2="80" y2="54" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  tv_panel_lines: svg(`${TV}
    <line x1="14" y1="42" x2="106" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="14" y1="52" x2="106" y2="52" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="14" y1="68" x2="106" y2="68" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="72" y1="20" x2="72" y2="86" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),
  tv_dead_pixels: svg(`${TV}
    <circle cx="48" cy="46" r="4" fill="${T}"/>
    <line x1="45" y1="43" x2="51" y2="49" stroke="white" stroke-width="1.5"/>
    <line x1="51" y1="43" x2="45" y2="49" stroke="white" stroke-width="1.5"/>
    <circle cx="72" cy="38" r="3" fill="${T}" opacity="0.5"/>
    <circle cx="88" cy="60" r="3" fill="${T}" opacity="0.5"/>
    <circle cx="36" cy="62" r="3" fill="${T}" opacity="0.5"/>`),
  tv_burn_in: svg(`${TV}
    <rect x="30" y="28" width="60" height="44" rx="2" fill="${T}" opacity="0.08"/>
    <rect x="36" y="34" width="48" height="32" rx="1" fill="${T}" opacity="0.1"/>
    <text x="38" y="56" font-size="8" fill="${T}" font-family="sans-serif" opacity="0.5">GHOST</text>
    <rect x="14" y="20" width="92" height="60" rx="2" fill="none" stroke="${T}" stroke-width="1.5" stroke-dasharray="5 3"/>`),
  tv_discoloration: svg(`${TV}
    <ellipse cx="42" cy="50" rx="22" ry="18" fill="${T}" opacity="0.12"/>
    <ellipse cx="80" cy="42" rx="15" ry="12" fill="${R}" opacity="0.1"/>
    <ellipse cx="70" cy="65" rx="12" ry="8" fill="#a855f7" opacity="0.1"/>`),
  tv_bezel_cracked: svg(`${TV}
    <line x1="14" y1="38" x2="26" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="26" y1="54" x2="14" y2="66" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="54" x2="34" y2="58" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),
  tv_stand_broken:
    svg(`<rect x="8" y="14" width="104" height="72" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="14" y="20" width="92" height="60" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M44 86 L36 106 M76 86 L84 106" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3"/>
    <rect x="32" y="106" width="56" height="5" rx="2.5" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="40" y1="108" x2="50" y2="112" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="108" x2="40" y2="112" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  tv_speaker: svg(`${TV}
    <path d="M26 44 L32 38 L32 62 L26 56 L20 56 L20 44 Z" fill="${T}" opacity="0.8"/>
    <line x1="36" y1="41" x2="42" y2="59" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="42" y1="41" x2="36" y2="59" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  tv_hdmi: svg(`${TV}
    <rect x="96" y="38" width="14" height="10" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="96" y="54" width="14" height="10" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="97" y1="40" x2="108" y2="48" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="108" y1="40" x2="97" y2="48" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  tv_usb_port: svg(`${TV}
    <rect x="5" y="46" width="12" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="5" y="58" width="12" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="6" y1="47" x2="15" y2="54" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="15" y1="47" x2="6" y2="54" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  tv_power: svg(`${TV}
    <circle cx="90" cy="44" r="10" fill="white" stroke="${T}" stroke-width="2"/>
    <path d="M90 38 L90 44" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M85 41 C83 43 82 46 82 49 C82 54.5 85.7 59 90 59 C94.3 59 98 54.5 98 49 C98 46 97 43 95 41" stroke="${T}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="90" cy="30" r="5" fill="${T}"/>
    <text x="87.5" y="34" font-size="8" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),
  tv_remote_issue: svg(`${TV}
    <rect x="50" y="42" width="20" height="44" rx="7" fill="white" stroke="#1e293b" stroke-width="2"/>
    <circle cx="60" cy="56" r="5" fill="#f0f9ff" stroke="${T}" stroke-width="1.5"/>
    <circle cx="54" cy="68" r="3" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <circle cx="60" cy="68" r="3" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <circle cx="66" cy="68" r="3" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <line x1="56" y1="48" x2="64" y2="56" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="64" y1="48" x2="56" y2="56" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  tv_no_signal: svg(`${TV}
    <rect x="14" y="20" width="92" height="60" rx="2" fill="#1e293b" stroke="#1e293b" stroke-width="1.5"/>
    <text x="28" y="52" font-size="10" fill="${T}" font-family="sans-serif" opacity="0.8">NO SIGNAL</text>
    <circle cx="88" cy="36" r="6" fill="${T}" opacity="0.3"/>
    <text x="85.5" y="39.5" font-size="8" fill="${T}" font-family="sans-serif" font-weight="bold">!</text>`),
  acc_box:
    svg(`<path d="M60 14 L100 34 L100 86 L60 106 L20 86 L20 34 Z" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <path d="M60 14 L60 106" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="5 3"/>
    <path d="M20 34 L60 54 L100 34" stroke="#1e293b" stroke-width="2"/>
    <path d="M60 54 L60 106" stroke="#1e293b" stroke-width="2"/>
    <path d="M42 24 L58 32" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <path d="M42 30 L58 38" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>`),
  acc_charger:
    svg(`<rect x="38" y="12" width="44" height="36" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="46" y="6" width="8" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="66" y="6" width="8" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M60 48 L60 72" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M48 72 L72 72" stroke="#1e293b" stroke-width="2"/>
    <path d="M54 72 L50 88 L70 88 L66 72" stroke="#1e293b" stroke-width="2"/>
    <rect x="50" y="88" width="20" height="8" rx="3" fill="white" stroke="${T}" stroke-width="2"/>
    <rect x="57" y="96" width="6" height="14" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M54 102 L66 102" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  acc_invoice:
    svg(`<rect x="26" y="10" width="68" height="90" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <path d="M54 10 L54 28 L80 28" stroke="#1e293b" stroke-width="2"/>
    <path d="M54 10 L80 28 L80 100 L26 100 L26 10 Z" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <line x1="36" y1="44" x2="74" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="36" y1="54" x2="74" y2="54" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="64" x2="74" y2="64" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="74" x2="60" y2="74" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="36" y="80" width="20" height="10" rx="2" fill="${T}" opacity="0.15"/>
    <line x1="36" y1="85" x2="56" y2="85" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  acc_strap:
    svg(`<rect x="46" y="28" width="28" height="28" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="50" y="32" width="20" height="20" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="50" y="6" width="20" height="22" rx="5" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="2"/>
    <rect x="54" y="9" width="12" height="3" rx="1.5" fill="${T}" opacity="0.5"/>
    <rect x="54" y="14" width="12" height="3" rx="1.5" fill="${T}" opacity="0.3"/>
    <rect x="50" y="56" width="20" height="22" rx="5" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="2"/>
    <rect x="54" y="59" width="12" height="3" rx="1.5" fill="${T}" opacity="0.5"/>
    <rect x="54" y="64" width="12" height="3" rx="1.5" fill="${T}" opacity="0.3"/>`),
  acc_remote:
    svg(`<rect x="38" y="8" width="44" height="96" rx="14" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <circle cx="60" cy="34" r="12" fill="#f0f9ff" stroke="${T}" stroke-width="2"/>
    <circle cx="60" cy="34" r="5" fill="${T}" opacity="0.3"/>
    <circle cx="48" cy="56" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="56" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="72" cy="56" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="48" cy="70" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="70" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="72" cy="70" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="48" y="82" width="24" height="5" rx="2.5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="48" y="92" width="24" height="5" rx="2.5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>`),
  acc_stand:
    svg(`<rect x="8" y="14" width="104" height="58" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="14" y="20" width="92" height="46" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M42 72 L36 96 M78 72 L84 96" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="30" y="96" width="60" height="8" rx="3" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="36" y1="92" x2="84" y2="92" stroke="#e2e8f0" stroke-width="1.5"/>`),
  acc_cable:
    svg(`<path d="M28 40 C28 34 32 28 40 28 L80 28 C88 28 92 34 92 40" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <rect x="24" y="40" width="16" height="10" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="80" y="40" width="16" height="10" rx="3" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="82" y1="42" x2="94" y2="50" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 50 C28 70 32 80 36 90 M92 50 C92 70 88 80 84 90" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
    <rect x="30" y="88" width="12" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="78" y="88" width="12" height="8" rx="2" fill="white" stroke="${T}" stroke-width="2"/>`),
  acc_stylus:
    svg(`<rect x="54" y="10" width="12" height="80" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <path d="M54 90 L60 108 L66 90" fill="white" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
    <rect x="56" y="14" width="8" height="3" rx="1.5" fill="${T}" opacity="0.5"/>
    <circle cx="60" cy="26" r="3" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <line x1="57" y1="105" x2="63" y2="105" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),
  acc_earphones:
    svg(`<path d="M36 60 C36 36 44 22 60 20 C76 22 84 36 84 60" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="36" cy="64" r="10" fill="white" stroke="#1e293b" stroke-width="2"/>
    <circle cx="36" cy="64" r="5" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <circle cx="84" cy="64" r="10" fill="white" stroke="#1e293b" stroke-width="2"/>
    <circle cx="84" cy="64" r="5" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <circle cx="60" cy="82" r="6" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M60 76 L60 70" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>`),
  acc_keyboard:
    svg(`<rect x="10" y="32" width="100" height="56" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="16" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="32" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="48" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="64" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="80" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="16" y="54" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="32" y="54" width="12" height="8" rx="2" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1"/>
    <rect x="48" y="54" width="28" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="80" y="54" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="28" y="68" width="64" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>`),
  acc_mouse:
    svg(`<path d="M40 60 C40 36 50 20 60 18 C70 20 80 36 80 60 C80 80 72 100 60 100 C48 100 40 80 40 60Z" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <line x1="60" y1="18" x2="60" y2="58" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="54" r="5" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <path d="M60 6 L60 12" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 12 L60 18" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>`),
};

function generateVariants(name, brand, specMap = {}) {
  // If we have real spec data for this model, use it
  const fullName = `Galaxy ${name}`; // models are stored without "Galaxy" prefix
  const spec = specMap[fullName] || specMap[name];

  if (spec) {
    const variants = [];
    for (const ram of spec.rams) {
      for (const storage of spec.storages) {
        variants.push({
          specs: { ram, storage },
          basePrice: getBasePrice(name, brand, ram, storage),
        });
      }
    }
    return variants;
  }

  // Fallback for brands without spec docs (existing logic)
  const base = getBasePrice(name, brand);
  if (/Ultra|Pro Max|Fold/i.test(name)) {
    return [
      { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: base },
      { specs: { ram: "16 GB", storage: "512 GB" }, basePrice: base + 15000 },
    ];
  }
  if (/Pro/i.test(name)) {
    return [
      { specs: { ram: "8 GB", storage: "128 GB" }, basePrice: base },
      { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: base + 8000 },
    ];
  }
  return [
    { specs: { ram: "6 GB", storage: "128 GB" }, basePrice: base },
    { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: base + 5000 },
  ];
}

function getBasePrice(name, brand, ram = null, storage = null) {
  const lower = name.toLowerCase();
  const match = name.match(/\d+/);
  const gen = match ? parseInt(match[0]) : 10;

  // RAM/Storage price modifiers (used when real specs are available)
  const ramBonus = ram ? (parseInt(ram) - 6) * 800 : 0; // e.g. 12GB = +4800 over 6GB baseline
  const storageBonus = storage
    ? (() => {
        const gb = parseInt(storage);
        if (gb >= 1000) return 12000; // 1TB
        if (gb >= 512) return 7000;
        if (gb >= 256) return 3000;
        if (gb >= 128) return 1000;
        return 0;
      })()
    : 0;

  // ─────────────────────────────────────────
  // 🍎 APPLE (Premium depreciation curve)
  // ─────────────────────────────────────────
  if (brand === "Apple") {
    if (/pro max|ultra/i.test(name)) return 50000 + gen * 4000;
    if (/pro/i.test(name)) return 45000 + gen * 3500;
    return 30000 + gen * 2500;
  }

  // ─────────────────────────────────────────
  // 🤖 GOOGLE PIXEL (flagship but niche)
  // ─────────────────────────────────────────
  if (brand === "Google") {
    if (/pro|xl|fold/i.test(name)) return 40000 + gen * 3500;
    return 28000 + gen * 2500;
  }

  // ─────────────────────────────────────────
  // 🟢 SAMSUNG (wide range)
  // ─────────────────────────────────────────
  if (brand === "Samsung") {
    let base;
    if (/ultra|fold|flip.*7|flip.*6/i.test(lower)) base = 40000 + gen * 3000;
    else if (/flip|fold/i.test(lower)) base = 35000 + gen * 2500;
    else if (/s\d+.*ultra|s\d+.*plus/i.test(lower)) base = 32000 + gen * 2800;
    else if (/s\d+/i.test(lower)) base = 28000 + gen * 2500;
    else if (/note/i.test(lower)) base = 25000 + gen * 2000;
    else if (/a[5-7]\d/i.test(lower)) base = 18000 + gen * 1500;
    else if (/a[3-4]\d/i.test(lower)) base = 12000 + gen * 1000;
    else if (/a[0-2]\d|m[5-6]\d/i.test(lower)) base = 8000 + gen * 800;
    else if (/m[3-4]\d/i.test(lower)) base = 7000 + gen * 700;
    else if (/m[0-2]\d|f\d/i.test(lower)) base = 5000 + gen * 500;
    else base = 10000 + gen * 1000;

    return Math.max(1500, base + ramBonus + storageBonus);
  }

  // ─────────────────────────────────────────
  // 🔴 ONEPLUS (upper mid + flagship)
  // ─────────────────────────────────────────
  if (brand === "OnePlus") {
    if (gen >= 10) return 30000 + gen * 2500;
    return 22000 + gen * 2000;
  }

  // ─────────────────────────────────────────
  // ⚫ NOTHING (premium midrange)
  // ─────────────────────────────────────────
  if (brand === "Nothing") {
    return 25000 + gen * 2000;
  }

  // ─────────────────────────────────────────
  // 🟠 OPPO
  // ─────────────────────────────────────────
  if (brand === "Oppo") {
    if (/find x/i.test(lower)) return 35000 + gen * 3000;
    if (/reno/i.test(lower)) return 22000 + gen * 1800;
    return 15000 + gen * 1200;
  }

  // ─────────────────────────────────────────
  // 🟡 VIVO
  // ─────────────────────────────────────────
  if (brand === "Vivo") {
    if (/x\d+/i.test(name)) return 30000 + gen * 2500;
    if (/v\d+/i.test(name)) return 20000 + gen * 1800;
    return 15000 + gen * 1200;
  }

  // ─────────────────────────────────────────
  // 🔵 XIAOMI / REDMI
  // ─────────────────────────────────────────
  if (brand === "Xiaomi") {
    if (/ultra/i.test(name)) return 35000 + gen * 3000;
    if (/note/i.test(name)) return 15000 + gen * 1500;
    return 18000 + gen * 1600;
  }

  // ─────────────────────────────────────────
  // 🟡 POCO (performance budget)
  // ─────────────────────────────────────────
  if (brand === "Poco") {
    return 15000 + gen * 1400;
  }

  // ─────────────────────────────────────────
  // 🟢 REALME
  // ─────────────────────────────────────────
  if (brand === "Realme") {
    if (/gt/i.test(lower)) return 22000 + gen * 2000;
    return 14000 + gen * 1200;
  }

  // ─────────────────────────────────────────
  // 🔵 MOTOROLA (huge range)
  // ─────────────────────────────────────────
  if (brand === "Motorola") {
    if (/edge/i.test(lower)) return 28000 + gen * 2500;
    if (/razr/i.test(lower)) return 50000 + gen * 4000;
    if (/g\d+/i.test(lower)) return 12000 + gen * 1200;
    if (/e\d+/i.test(lower)) return 8000 + gen * 800;
    return 10000 + gen * 1000;
  }

  // ─────────────────────────────────────────
  // 🔵 NOKIA (budget heavy)
  // ─────────────────────────────────────────
  if (brand === "Nokia") {
    if (/xr/i.test(lower)) return 25000 + gen * 2000;
    if (/g\d+/i.test(lower)) return 12000 + gen * 1200;
    if (/c\d+/i.test(lower)) return 7000 + gen * 700;
    return 9000 + gen * 900;
  }

  // ─────────────────────────────────────────
  // 🔻 FALLBACK
  // ─────────────────────────────────────────
  return 10000 + gen * 1000;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Catalog data (image field populated at runtime from imageMap) ──────────────
// ═══════════════════════════════════════════════════════════════════════════════

function buildCatalogSeed(imageMap) {
  const specMaps = {};
  for (const [brand, docPath] of Object.entries(SPEC_DOCS)) {
    if (fs.existsSync(docPath)) {
      specMaps[brand] = parseSpecDoc(docPath);
      console.log(
        `📋 Loaded specs for ${brand}: ${Object.keys(specMaps[brand]).length} models`,
      );
    }
  }

  return Object.keys(imageMap).map((brand) => ({
    brand,
    category: "mobile",
    models: buildModels(imageMap, brand, specMaps[brand] || {}),
  }));
}

// Update buildModels to accept and pass specMap
function buildModels(imageMap, brand, specMap = {}) {
  const seen = new Set();
  return Object.entries(imageMap[brand] || {})
    .map(([rawName, image]) => {
      const name = rawName.replace(new RegExp(`^${brand}\\s+`, "i"), "").trim();
      if (seen.has(name)) return null;
      seen.add(name);
      return {
        name,
        image,
        variants: generateVariants(name, brand, specMap),
      };
    })
    .filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Evaluation config seed (unchanged from original) ──────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const evaluationConfigSeed = [
  {
    category: "mobile",
    processingFee: 299,
    questions: [
      {
        key: "device_turns_on",
        label: "Does the device turn on and boot normally?",
        order: 1,
        deductionOnNo: 60,
      },
      {
        key: "touch_working",
        label: "Is the touchscreen responsive and working?",
        order: 2,
        deductionOnNo: 30,
      },
      {
        key: "can_make_calls",
        label: "Can the device make and receive calls?",
        order: 3,
        deductionOnNo: 25,
      },
      {
        key: "wifi_working",
        label: "Is Wi-Fi connecting and working properly?",
        order: 4,
        deductionOnNo: 15,
      },
      {
        key: "fingerprint",
        label: "Is the fingerprint / Face ID working?",
        order: 5,
        deductionOnNo: 8,
      },
    ],
    defects: [
      {
        key: "screen_damage",
        label: "Screen / Display Damage",
        image: IMG.mobile_screen_cracked,
        order: 1,
        deduction: 0,
        children: [
          {
            key: "screen_cracked",
            label: "Screen cracked or shattered",
            image: IMG.mobile_screen_cracked,
            deduction: 45,
          },
          {
            key: "dead_pixels",
            label: "Dead pixels or display lines",
            image: IMG.mobile_dead_pixels,
            deduction: 25,
          },
          {
            key: "touch_unresponsive",
            label: "Touchscreen partially unresponsive",
            image: IMG.mobile_touch,
            deduction: 35,
          },
          {
            key: "display_lines",
            label: "Horizontal or vertical lines on screen",
            image: IMG.mobile_display_lines,
            deduction: 25,
          },
          {
            key: "burn_in",
            label: "Screen burn-in or ghost image",
            image: IMG.mobile_burn_in,
            deduction: 20,
          },
        ],
      },
      {
        key: "body_damage",
        label: "Body / Frame Damage",
        image: IMG.mobile_body_dents,
        order: 2,
        deduction: 0,
        children: [
          {
            key: "back_cracked",
            label: "Back panel cracked",
            image: IMG.mobile_back_cracked,
            deduction: 15,
          },
          {
            key: "body_dents",
            label: "Significant dents on frame",
            image: IMG.mobile_body_dents,
            deduction: 10,
          },
          {
            key: "body_scratches",
            label: "Deep scratches on body",
            image: IMG.mobile_body_scratches,
            deduction: 5,
          },
          {
            key: "frame_bent",
            label: "Frame or chassis bent",
            image: IMG.mobile_frame_bent,
            deduction: 25,
          },
        ],
      },
      {
        key: "camera_damage",
        label: "Camera Issues",
        image: IMG.mobile_camera_broken,
        order: 3,
        deduction: 0,
        children: [
          {
            key: "camera_glass_broken",
            label: "Camera lens cracked or broken",
            image: IMG.mobile_camera_broken,
            deduction: 15,
          },
          {
            key: "camera_not_working",
            label: "Rear camera not working at all",
            image: IMG.mobile_camera_notworking,
            deduction: 30,
          },
          {
            key: "front_camera_issue",
            label: "Front camera not working",
            image: IMG.mobile_front_camera,
            deduction: 15,
          },
        ],
      },
      {
        key: "hardware_issues",
        label: "Hardware / Functional Issues",
        image: IMG.mobile_charging_port,
        order: 4,
        deduction: 0,
        children: [
          {
            key: "charging_port_damaged",
            label: "Charging port damaged or loose",
            image: IMG.mobile_charging_port,
            deduction: 15,
          },
          {
            key: "speaker_issue",
            label: "Speaker not working or muffled",
            image: IMG.mobile_speaker,
            deduction: 10,
          },
          {
            key: "microphone_issue",
            label: "Microphone not working",
            image: IMG.mobile_microphone,
            deduction: 10,
          },
          {
            key: "battery_drains_fast",
            label: "Battery drains very fast",
            image: IMG.mobile_battery,
            deduction: 20,
          },
          {
            key: "water_damage",
            label: "Water or liquid damage",
            image: IMG.mobile_water,
            deduction: 50,
          },
          {
            key: "overheating",
            label: "Device overheats frequently",
            image: IMG.mobile_overheating,
            deduction: 18,
          },
          {
            key: "wifi_issue",
            label: "Wi-Fi or network issues",
            image: IMG.mobile_wifi_issue,
            deduction: 12,
          },
          {
            key: "fingerprint_issue",
            label: "Fingerprint / Face ID not working",
            image: IMG.mobile_fingerprint,
            deduction: 10,
          },
        ],
      },
    ],
    accessories: [
      {
        key: "original_box",
        label: "Original box included",
        image: IMG.acc_box,
        order: 1,
        addition: 2,
      },
      {
        key: "original_charger",
        label: "Original charger included",
        image: IMG.acc_charger,
        order: 2,
        addition: 3,
      },
      {
        key: "bill_invoice",
        label: "Original purchase bill/invoice",
        image: IMG.acc_invoice,
        order: 3,
        addition: 3,
      },
      {
        key: "earphones",
        label: "Original earphones included",
        image: IMG.acc_earphones,
        order: 4,
        addition: 1,
      },
    ],
  },

  {
    category: "laptop",
    processingFee: 599,
    questions: [
      {
        key: "powers_on",
        label: "Does the laptop power on normally?",
        order: 1,
        deductionOnNo: 65,
      },
      {
        key: "display_working",
        label: "Is the display working without lines or patches?",
        order: 2,
        deductionOnNo: 35,
      },
      {
        key: "keyboard_working",
        label: "Are all keyboard keys functioning properly?",
        order: 3,
        deductionOnNo: 20,
      },
      {
        key: "wifi_working",
        label: "Is Wi-Fi connecting and working properly?",
        order: 4,
        deductionOnNo: 12,
      },
      {
        key: "battery_charges",
        label: "Does the battery charge normally?",
        order: 5,
        deductionOnNo: 25,
      },
    ],
    defects: [
      {
        key: "display_damage",
        label: "Display Damage",
        image: IMG.laptop_screen_cracked,
        order: 1,
        deduction: 0,
        children: [
          {
            key: "screen_cracked",
            label: "Screen cracked or broken",
            image: IMG.laptop_screen_cracked,
            deduction: 55,
          },
          {
            key: "dead_pixels",
            label: "Dead pixels or lines on screen",
            image: IMG.laptop_dead_pixels,
            deduction: 28,
          },
          {
            key: "display_lines",
            label: "Horizontal or vertical lines",
            image: IMG.laptop_display_lines,
            deduction: 25,
          },
          {
            key: "backlight_issue",
            label: "Backlight bleeding or dim display",
            image: IMG.laptop_backlight,
            deduction: 22,
          },
          {
            key: "discoloration",
            label: "Screen discoloration or staining",
            image: IMG.laptop_discoloration,
            deduction: 15,
          },
        ],
      },
      {
        key: "keyboard_trackpad",
        label: "Keyboard / Trackpad Issues",
        image: IMG.laptop_keyboard,
        order: 2,
        deduction: 0,
        children: [
          {
            key: "keys_not_working",
            label: "Multiple keys not registering",
            image: IMG.laptop_keyboard,
            deduction: 22,
          },
          {
            key: "trackpad_unresponsive",
            label: "Trackpad not working",
            image: IMG.laptop_trackpad,
            deduction: 18,
          },
        ],
      },
      {
        key: "body_damage",
        label: "Body / Chassis Damage",
        image: IMG.laptop_hinge,
        order: 3,
        deduction: 0,
        children: [
          {
            key: "hinge_broken",
            label: "Hinge damaged or broken",
            image: IMG.laptop_hinge,
            deduction: 28,
          },
          {
            key: "body_cracks",
            label: "Cracks on chassis or lid",
            image: IMG.laptop_body_cracks,
            deduction: 18,
          },
          {
            key: "body_dents",
            label: "Dents on body",
            image: IMG.laptop_body_dents,
            deduction: 8,
          },
          {
            key: "port_damage",
            label: "USB / HDMI ports damaged",
            image: IMG.laptop_port_damage,
            deduction: 12,
          },
        ],
      },
      {
        key: "hardware_issues",
        label: "Hardware / Component Issues",
        image: IMG.laptop_battery,
        order: 4,
        deduction: 0,
        children: [
          {
            key: "battery_issue",
            label: "Battery not charging or dead",
            image: IMG.laptop_battery,
            deduction: 35,
          },
          {
            key: "fan_not_working",
            label: "Fan not working or excessive noise",
            image: IMG.laptop_fan,
            deduction: 18,
          },
          {
            key: "liquid_damage",
            label: "Liquid damage inside",
            image: IMG.laptop_liquid,
            deduction: 65,
          },
          {
            key: "ram_issue",
            label: "RAM failure or memory errors",
            image: IMG.laptop_ram,
            deduction: 28,
          },
          {
            key: "storage_issue",
            label: "Storage / SSD not detected",
            image: IMG.laptop_storage,
            deduction: 35,
          },
        ],
      },
    ],
    accessories: [
      {
        key: "original_charger",
        label: "Original charger/adapter",
        image: IMG.acc_charger,
        order: 1,
        addition: 5,
      },
      {
        key: "original_box",
        label: "Original box included",
        image: IMG.acc_box,
        order: 2,
        addition: 2,
      },
      {
        key: "bill_invoice",
        label: "Original purchase bill/invoice",
        image: IMG.acc_invoice,
        order: 3,
        addition: 3,
      },
      {
        key: "mouse",
        label: "Mouse included",
        image: IMG.acc_mouse,
        order: 4,
        addition: 2,
      },
      {
        key: "keyboard_acc",
        label: "External keyboard included",
        image: IMG.acc_keyboard,
        order: 5,
        addition: 2,
      },
    ],
  },

  {
    category: "tablet",
    processingFee: 349,
    questions: [
      {
        key: "device_turns_on",
        label: "Does the tablet turn on normally?",
        order: 1,
        deductionOnNo: 55,
      },
      {
        key: "touch_working",
        label: "Is the touchscreen working perfectly?",
        order: 2,
        deductionOnNo: 30,
      },
      {
        key: "wifi_working",
        label: "Is Wi-Fi working properly?",
        order: 3,
        deductionOnNo: 15,
      },
      {
        key: "camera_working",
        label: "Is the camera working correctly?",
        order: 4,
        deductionOnNo: 12,
      },
      {
        key: "battery_charges",
        label: "Does the battery charge normally?",
        order: 5,
        deductionOnNo: 22,
      },
    ],
    defects: [
      {
        key: "screen_damage",
        label: "Screen / Display Damage",
        image: IMG.tablet_screen_cracked,
        order: 1,
        deduction: 0,
        children: [
          {
            key: "screen_cracked",
            label: "Screen cracked or shattered",
            image: IMG.tablet_screen_cracked,
            deduction: 48,
          },
          {
            key: "touch_unresponsive",
            label: "Touchscreen unresponsive",
            image: IMG.tablet_touch,
            deduction: 32,
          },
          {
            key: "dead_pixels",
            label: "Dead pixels on display",
            image: IMG.tablet_dead_pixels,
            deduction: 22,
          },
          {
            key: "display_lines",
            label: "Lines or patches on screen",
            image: IMG.tablet_display_lines,
            deduction: 22,
          },
        ],
      },
      {
        key: "body_damage",
        label: "Body / Frame Damage",
        image: IMG.tablet_back_cracked,
        order: 2,
        deduction: 0,
        children: [
          {
            key: "back_cracked",
            label: "Back panel cracked",
            image: IMG.tablet_back_cracked,
            deduction: 18,
          },
          {
            key: "body_dents",
            label: "Dents on frame",
            image: IMG.tablet_body_dents,
            deduction: 10,
          },
          {
            key: "body_scratches",
            label: "Deep scratches on body",
            image: IMG.tablet_body_scratches,
            deduction: 5,
          },
        ],
      },
      {
        key: "camera_damage",
        label: "Camera Issues",
        image: IMG.tablet_camera,
        order: 3,
        deduction: 0,
        children: [
          {
            key: "camera_not_working",
            label: "Camera not working",
            image: IMG.tablet_camera,
            deduction: 22,
          },
          {
            key: "camera_lens_broken",
            label: "Camera lens cracked/broken",
            image: IMG.tablet_camera,
            deduction: 18,
          },
        ],
      },
      {
        key: "hardware_issues",
        label: "Hardware / Functional Issues",
        image: IMG.tablet_battery,
        order: 4,
        deduction: 0,
        children: [
          {
            key: "charging_port_issue",
            label: "Charging port damaged",
            image: IMG.tablet_charging_port,
            deduction: 18,
          },
          {
            key: "battery_issue",
            label: "Battery not holding charge",
            image: IMG.tablet_battery,
            deduction: 25,
          },
          {
            key: "speaker_issue",
            label: "Speaker not working",
            image: IMG.tablet_speaker,
            deduction: 12,
          },
          {
            key: "water_damage",
            label: "Water or liquid damage",
            image: IMG.tablet_water,
            deduction: 45,
          },
        ],
      },
    ],
    accessories: [
      {
        key: "original_box",
        label: "Original box included",
        image: IMG.acc_box,
        order: 1,
        addition: 2,
      },
      {
        key: "original_charger",
        label: "Original charger/cable",
        image: IMG.acc_charger,
        order: 2,
        addition: 3,
      },
      {
        key: "bill_invoice",
        label: "Original purchase bill/invoice",
        image: IMG.acc_invoice,
        order: 3,
        addition: 3,
      },
      {
        key: "stylus",
        label: "Stylus / Apple Pencil included",
        image: IMG.acc_stylus,
        order: 4,
        addition: 6,
      },
      {
        key: "keyboard_acc",
        label: "Keyboard cover included",
        image: IMG.acc_keyboard,
        order: 5,
        addition: 4,
      },
    ],
  },

  {
    category: "smartwatch",
    processingFee: 199,
    questions: [
      {
        key: "device_turns_on",
        label: "Does the watch turn on normally?",
        order: 1,
        deductionOnNo: 65,
      },
      {
        key: "touch_working",
        label: "Is the touchscreen responding correctly?",
        order: 2,
        deductionOnNo: 28,
      },
      {
        key: "battery_good",
        label: "Does battery last a full day?",
        order: 3,
        deductionOnNo: 25,
      },
      {
        key: "sensors_working",
        label: "Are health sensors (heart rate etc.) working?",
        order: 4,
        deductionOnNo: 18,
      },
    ],
    defects: [
      {
        key: "screen_damage",
        label: "Screen / Display Damage",
        image: IMG.watch_screen_cracked,
        order: 1,
        deduction: 0,
        children: [
          {
            key: "screen_cracked",
            label: "Screen cracked or shattered",
            image: IMG.watch_screen_cracked,
            deduction: 55,
          },
          {
            key: "dead_pixels",
            label: "Dead pixels on display",
            image: IMG.watch_dead_pixels,
            deduction: 28,
          },
          {
            key: "touch_unresponsive",
            label: "Touch unresponsive",
            image: IMG.watch_touch_issue,
            deduction: 25,
          },
        ],
      },
      {
        key: "body_damage",
        label: "Body / Casing Damage",
        image: IMG.watch_body_scratches,
        order: 2,
        deduction: 0,
        children: [
          {
            key: "body_scratches",
            label: "Deep scratches on case",
            image: IMG.watch_body_scratches,
            deduction: 10,
          },
          {
            key: "body_dents",
            label: "Dents on case",
            image: IMG.watch_body_dents,
            deduction: 12,
          },
          {
            key: "crown_damaged",
            label: "Digital crown/buttons damaged",
            image: IMG.watch_crown,
            deduction: 18,
          },
          {
            key: "strap_damaged",
            label: "Strap broken or damaged",
            image: IMG.watch_strap_damaged,
            deduction: 5,
          },
        ],
      },
      {
        key: "hardware_issues",
        label: "Hardware / Functional Issues",
        image: IMG.watch_battery,
        order: 3,
        deduction: 0,
        children: [
          {
            key: "battery_issue",
            label: "Battery not holding charge",
            image: IMG.watch_battery,
            deduction: 30,
          },
          {
            key: "charging_issue",
            label: "Charging not working",
            image: IMG.watch_charging,
            deduction: 25,
          },
          {
            key: "sensor_issue",
            label: "Health sensors not working",
            image: IMG.watch_sensor,
            deduction: 22,
          },
          {
            key: "water_damage",
            label: "Water damage",
            image: IMG.watch_water,
            deduction: 45,
          },
        ],
      },
    ],
    accessories: [
      {
        key: "original_box",
        label: "Original box included",
        image: IMG.acc_box,
        order: 1,
        addition: 3,
      },
      {
        key: "original_charger",
        label: "Original charger",
        image: IMG.acc_charger,
        order: 2,
        addition: 5,
      },
      {
        key: "extra_strap",
        label: "Extra strap included",
        image: IMG.acc_strap,
        order: 3,
        addition: 3,
      },
    ],
  },

  {
    category: "television",
    processingFee: 999,
    questions: [
      {
        key: "powers_on",
        label: "Does the TV power on and off normally?",
        order: 1,
        deductionOnNo: 75,
      },
      {
        key: "display_uniform",
        label: "Is the display uniform with no patches?",
        order: 2,
        deductionOnNo: 45,
      },
      {
        key: "remote_working",
        label: "Is the original remote control working?",
        order: 3,
        deductionOnNo: 10,
      },
      {
        key: "hdmi_working",
        label: "Are HDMI ports working properly?",
        order: 4,
        deductionOnNo: 18,
      },
      {
        key: "smart_tv_working",
        label: "Is Smart TV / internet working?",
        order: 5,
        deductionOnNo: 12,
      },
    ],
    defects: [
      {
        key: "panel_damage",
        label: "Panel / Screen Damage",
        image: IMG.tv_panel_cracked,
        order: 1,
        deduction: 0,
        children: [
          {
            key: "panel_cracked",
            label: "Panel cracked or physically broken",
            image: IMG.tv_panel_cracked,
            deduction: 85,
          },
          {
            key: "panel_lines",
            label: "Horizontal or vertical lines",
            image: IMG.tv_panel_lines,
            deduction: 38,
          },
          {
            key: "dead_pixels",
            label: "Dead pixels or dark patches",
            image: IMG.tv_dead_pixels,
            deduction: 28,
          },
          {
            key: "burn_in",
            label: "Screen burn-in or ghost image",
            image: IMG.tv_burn_in,
            deduction: 42,
          },
          {
            key: "discoloration",
            label: "Screen discoloration or colour shift",
            image: IMG.tv_discoloration,
            deduction: 22,
          },
        ],
      },
      {
        key: "body_damage",
        label: "Body / Casing Damage",
        image: IMG.tv_bezel_cracked,
        order: 2,
        deduction: 0,
        children: [
          {
            key: "bezel_cracked",
            label: "Bezel/frame cracked",
            image: IMG.tv_bezel_cracked,
            deduction: 15,
          },
          {
            key: "stand_broken",
            label: "Stand/legs broken or missing",
            image: IMG.tv_stand_broken,
            deduction: 18,
          },
        ],
      },
      {
        key: "hardware_issues",
        label: "Hardware / Functional Issues",
        image: IMG.tv_power,
        order: 3,
        deduction: 0,
        children: [
          {
            key: "speaker_issue",
            label: "Speaker not working or distorted",
            image: IMG.tv_speaker,
            deduction: 18,
          },
          {
            key: "hdmi_port_issue",
            label: "HDMI ports not working",
            image: IMG.tv_hdmi,
            deduction: 18,
          },
          {
            key: "usb_port_issue",
            label: "USB ports not working",
            image: IMG.tv_usb_port,
            deduction: 10,
          },
          {
            key: "power_issue",
            label: "Takes long to power on/restarts",
            image: IMG.tv_power,
            deduction: 22,
          },
          {
            key: "remote_issue",
            label: "Remote control not working",
            image: IMG.tv_remote_issue,
            deduction: 8,
          },
          {
            key: "no_signal",
            label: "No signal / input detection issues",
            image: IMG.tv_no_signal,
            deduction: 15,
          },
        ],
      },
    ],
    accessories: [
      {
        key: "remote",
        label: "Original remote control",
        image: IMG.acc_remote,
        order: 1,
        addition: 3,
      },
      {
        key: "original_stand",
        label: "Original stand/legs",
        image: IMG.acc_stand,
        order: 2,
        addition: 4,
      },
      {
        key: "original_box",
        label: "Original packaging box",
        image: IMG.acc_box,
        order: 3,
        addition: 2,
      },
      {
        key: "bill_invoice",
        label: "Original purchase bill/invoice",
        image: IMG.acc_invoice,
        order: 4,
        addition: 3,
      },
      {
        key: "hdmi_cable",
        label: "HDMI cable included",
        image: IMG.acc_cable,
        order: 5,
        addition: 2,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ── Main seed runner ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

async function seed() {
  try {
    console.log("🚀 Seeding started...");

    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const imageMap = await uploadAllImages();
    const catalogSeed = buildCatalogSeed(imageMap);

    // ── CONFIG UPSERT ─────────────────────────────
    console.log("⚙️ Updating evaluation config...");

    for (const config of evaluationConfigSeed) {
      const query = config.brand
        ? { category: config.category, brand: config.brand }
        : { category: config.category };

      await EvaluationConfig.findOneAndUpdate(
        query,
        { $set: config },
        { upsert: true, new: true },
      );
    }

    // ── CATALOG UPSERT ────────────────────────────
    console.log("📱 Updating device catalog...");

    for (const catalog of catalogSeed) {
      const existing = await DeviceCatalog.findOne({
        brand: catalog.brand,
        category: catalog.category,
      });

      if (!existing) {
        await DeviceCatalog.create(catalog);
        console.log(`➕ Added ${catalog.brand}`);
      } else {
        let added = 0;
        let updated = 0;

        for (const newModel of catalog.models) {
          const existingModel = existing.models.find(
            (m) => m.name === newModel.name,
          );

          if (!existingModel) {
            existing.models.push(newModel);
            added++;
          } else {
            existingModel.image = newModel.image;
            existingModel.variants = newModel.variants;
            updated++;
          }
        }

        await existing.save();

        console.log(`🔄 ${catalog.brand}: +${added} added, ${updated} updated`);
      }
    }

    console.log("🎉 SEED COMPLETED (SAFE MODE)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
