// upload.middleware.js — full file with rejectionUpload added
// Add the new exports at the bottom; everything else is unchanged.

const multer = require("multer");

// ── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/mov", "video/avi", "video/mkv"];

const MAX_IMAGE_SIZE = 5  * 1024 * 1024; // 5 MB per image
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB for video

// ── Shared memory storage ────────────────────────────────────────────────────
const storage = multer.memoryStorage();

// ── File filter ──────────────────────────────────────────────────────────────
function fileFilter(req, file, cb) {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  if (isImage || isVideo) return cb(null, true);
  cb(
    new Error(
      `Invalid file type: ${file.mimetype}. ` +
      "Only images (jpeg, jpg, png, webp) and videos (mp4, mov, avi, mkv) are allowed"
    ),
    false
  );
}

// ── Image-only filter (for rejection uploads) ────────────────────────────────
function imageOnlyFilter(req, file, cb) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(
    new Error(
      `Invalid file type: ${file.mimetype}. Only jpeg, jpg, png, webp images are allowed`
    ),
    false
  );
}

// ── Base multer instance ─────────────────────────────────────────────────────
const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_VIDEO_SIZE, files: 6 } });

// ── Product upload ───────────────────────────────────────────────────────────
const productUpload = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "video",  maxCount: 1 },
]);

function validateProductFiles(req, res, next) {
  if (req.files?.images) {
    for (const image of req.files.images) {
      if (image.size > MAX_IMAGE_SIZE)
        return res.status(400).json({ message: `Image "${image.originalname}" exceeds 5 MB limit` });
    }
  }
  if (req.files?.video) {
    const video = req.files.video[0];
    if (video.size > MAX_VIDEO_SIZE)
      return res.status(400).json({ message: `Video "${video.originalname}" exceeds 50 MB limit` });
  }
  next();
}

// ── Profile pic upload ───────────────────────────────────────────────────────
const profileUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
}).single("profilePic");

// ── Review upload ────────────────────────────────────────────────────────────
const reviewUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE, files: 6 },
}).fields([
  { name: "images", maxCount: 5 },
  { name: "video",  maxCount: 1 },
]);

function validateReviewFiles(req, res, next) {
  if (req.files?.images) {
    for (const image of req.files.images) {
      if (image.size > MAX_IMAGE_SIZE)
        return res.status(400).json({ message: `Image "${image.originalname}" exceeds 5 MB limit` });
    }
  }
  if (req.files?.video) {
    const video = req.files.video[0];
    if (video.size > MAX_VIDEO_SIZE)
      return res.status(400).json({ message: `Video "${video.originalname}" exceeds 50 MB limit` });
  }
  next();
}

// ── Chat image upload ────────────────────────────────────────────────────────
const ChatUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
}).single("image");

// ── Rejection images upload ───────────────────────────────────────────────────
// Used on:  POST /api/device-listings/:listingId/reject
// Accepts:  up to 3 images (jpeg / png / webp), each ≤ 5 MB
// Field name: "images"
const rejectionUpload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 3 },
}).fields([{ name: "images", maxCount: 3 }]);

/** Size-guard for rejection images — call after rejectionUpload */
function validateRejectionFiles(req, res, next) {
  if (req.files?.images) {
    for (const image of req.files.images) {
      if (image.size > MAX_IMAGE_SIZE)
        return res
          .status(400)
          .json({ message: `Image "${image.originalname}" exceeds 5 MB limit` });
    }
  }
  next();
}

// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  productUpload,
  validateProductFiles,
  profileUpload,
  reviewUpload,
  validateReviewFiles,
  ChatUpload,
  // ↓ new
  rejectionUpload,
  validateRejectionFiles,
};