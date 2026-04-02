const multer = require("multer");

// ALLOWED FILE TYPES
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/mov", "video/avi", "video/mkv"];

const MAX_IMAGE_SIZE = 5  * 1024 * 1024; // 5MB per image
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for video


// STORAGE — memory storage (buffer sent to Cloudinary)
const storage = multer.memoryStorage();


// FILE FILTER — only allow images and videos
function fileFilter(req, file, cb) {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images (jpeg, jpg, png, webp) and videos (mp4, mov, avi, mkv) are allowed`
      ),
      false
    );
  }
}


// MULTER INSTANCE
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: 6,                 
  },
});


// PRODUCT UPLOAD MIDDLEWARE
const productUpload = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "video",  maxCount: 1 },
]);


// VALIDATE FILE SIZES PER FIELD
function validateProductFiles(req, res, next) {
  // Validate each image is under 5MB
  if (req.files?.images) {
    for (const image of req.files.images) {
      if (image.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          message: `Image "${image.originalname}" exceeds 5MB limit`,
        });
      }
    }
  }

  // Validate video is under 50MB
  if (req.files?.video) {
    const video = req.files.video[0];
    if (video.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        message: `Video "${video.originalname}" exceeds 50MB limit`,
      });
    }
  }

  next();
}

// PROFILE PIC UPLOAD — single image only
const profileUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,  // 5MB max
    files: 1,
  },
}).single("profilePic");      // ← field name must be "profilePic" in Postman

// REVIEW UPLOAD MIDDLEWARE — 5 images + 1 video
const reviewUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE,  // 50MB ceiling (per-file size validated below)
    files:    6,               // max 5 images + 1 video
  },
}).fields([
  { name: "images", maxCount: 5 },
  { name: "video",  maxCount: 1 },
]);


// Chat Images 
const ChatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,  // 5MB max
    files: 1,
  },
}).single("image");


// VALIDATE REVIEW FILE SIZES
function validateReviewFiles(req, res, next) {
  if (req.files?.images) {
    for (const image of req.files.images) {
      if (image.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          message: `Image "${image.originalname}" exceeds 5MB limit`,
        });
      }
    }
  }

  if (req.files?.video) {
    const video = req.files.video[0];
    if (video.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        message: `Video "${video.originalname}" exceeds 50MB limit`,
      });
    }
  }

  next();
}

// EXPORT
module.exports = {
  productUpload,
  validateProductFiles,
  profileUpload,
  reviewUpload,
  validateReviewFiles,
  ChatUpload,
};