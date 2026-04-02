const express = require("express");
const router = express.Router();

const ProductController = require("../controller/product.controller");
const reviewRouter = require("./review.routes");

const {
  authMiddleware,
  authorize,
  blockAdmin,
  checkAccountStatus,
  requireActiveSubscription,
  checkListingLimit,
  checkDeviceTypePermission,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

const {
  productUpload,
  validateProductFiles,
} = require("../middleware/multer.middleware");

////////////////////////////////////////////////////////////////////
//// PUBLIC ROUTES
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/products
 * @desc    Get all products (supports filters + location)
 * @access  Public
 * @query   ?latitude=28.6&longitude=77.2&radius=5&category=mobile&minPrice=5000
 */
router.get("/", optionalAuthenticate, ProductController.getProducts);

/**
 * @route   GET /api/products/compare
 * @desc    Compare 2-4 products side by side
 * @access  Public
 * @query   ?ids=id1,id2,id3
 * ⚠️ MUST be before /:id — otherwise "compare" is treated as a product ID
 */
router.get("/compare", optionalAuthenticate, ProductController.compareProducts);

////////////////////////////////////////////////////////////////////
//// MY LISTINGS
//// ⚠️ MUST be before /:id routes
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/products/my/listings
 * @desc    Get own product listings
 * @access  Private (Seller, User)
 * @query   ?status=available
 */
router.get(
  "/my/listings",
  authMiddleware,
  authorize("seller", "user"),
  ProductController.getMyProducts,
);

////////////////////////////////////////////////////////////////////
//// SELLER ROUTES — requires active subscription
////////////////////////////////////////////////////////////////////

/**
 * @route   POST /api/products/seller/create
 * @desc    Seller creates a new listing (new / refurbished / old)
 *          Optionally include specs as JSON string in form-data body
 * @access  Private (Seller only)
 * @body    form-data: title, category, price, images, specs (optional JSON)
 */
router.post(
  "/seller/create",
  authMiddleware,
  authorize("seller"),
  blockAdmin,
  checkAccountStatus,
  productUpload, // multer FIRST — parses multipart req.body
  validateProductFiles,
  requireActiveSubscription,
  checkListingLimit,
  checkDeviceTypePermission,
  ProductController.createProduct,
);

////////////////////////////////////////////////////////////////////
//// USER ROUTES — old devices only
////////////////////////////////////////////////////////////////////

/**
 * @route   POST /api/products/user/create
 * @desc    User lists an old device
 *          Optionally include specs as JSON string in form-data body
 * @access  Private (User only)
 * @body    form-data: title, category, price, images, specs (optional JSON)
 */
router.post(
  "/user/create",
  authMiddleware,
  authorize("user"),
  blockAdmin,
  productUpload,            // multer FIRST
  validateProductFiles,
  checkDeviceTypePermission, // enforces deviceType = "old"
  ProductController.createProduct,
);

/**
 * @route   GET /api/products/nearby
 * @desc    Get products near user's location — like Swiggy nearby
 * @access  Public (coords from query) or Private (uses saved location)
 * @query   ?latitude=19.07&longitude=72.87&radius=10&category=mobile
 * ⚠️ Must be before /:id
 */
router.get(
  "/nearby",
  optionalAuthenticate,   // attach user if token present — to use saved location
  ProductController.getNearbyProducts
);

////////////////////////////////////////////////////////////////////
//// DYNAMIC :id ROUTES — always last
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get("/:id", optionalAuthenticate, ProductController.getProductById);

/**
 * @route   PATCH /api/products/:id/specs
 * @desc    Add or update specs for a product (owner or admin)
 * @access  Private (Seller, User — owner only)
 * @body    { performance?, display?, rearCamera?, frontCamera?, battery?, storageType? }
 */
router.patch(
  "/:id/specs",
  authMiddleware,
  authorize("seller", "user"),
  blockAdmin,
  ProductController.upsertSpecs,
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update own product listing
 * @access  Private (Seller, User — owner only)
 */
router.put(
  "/:id",
  authMiddleware,
  authorize("seller", "user"),
  blockAdmin,
  productUpload,
  validateProductFiles,
  ProductController.updateProduct,
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete own product listing
 * @access  Private (Seller, User — owner only)
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize("seller", "user"),
  blockAdmin,
  ProductController.deleteProduct,
);

/**
 * @route   USE /api/products/:productId/reviews
 * @desc    Use review routes for a specific product
 * @access  Public
 */
router.use("/:productId/reviews", reviewRouter);


module.exports = router;
