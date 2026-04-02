const express = require("express");
const router  = express.Router();

const { authMiddleware }  = require("../middleware/auth.middleware");
const { profileUpload } = require("../middleware/multer.middleware"); // single file upload
const ProfileController   = require("../controller/profile.controller");

// All profile routes require auth
router.use(authMiddleware);

////////////////////////////////////////////////////////////////////
//// PROFILE INFO
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/profile
 * @desc    Get full profile — user info + addresses + payment methods
 * @access  Private
 */
router.get("/", ProfileController.getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update profile info: firstname, lastname, email, mobile
 * @access  Private
 * @body    { firstname?, lastname?, email?, mobile? }
 */
router.put("/", ProfileController.updateProfile);

/**
 * @route   PATCH /api/profile/picture
 * @desc    Upload or replace profile picture
 * @access  Private
 * @form    multipart/form-data — field: "profilePic"
 */
router.patch(
  "/picture",
  profileUpload,
  ProfileController.updateProfilePic
);

/**
 * @route   DELETE /api/profile/picture
 * @desc    Remove profile picture
 * @access  Private
 */
router.delete("/picture", ProfileController.deleteProfilePic);

////////////////////////////////////////////////////////////////////
//// ADDRESSES
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/profile/address
 * @desc    Get all addresses (default first)
 * @access  Private
 */
router.get("/address", ProfileController.getAddresses);

/**
 * @route   POST /api/profile/address
 * @desc    Add a new address (first address auto-set as default)
 * @access  Private
 * @body    { street, city, state, pincode, country, isDefault? }
 */
router.post("/address", ProfileController.addAddress);

/**
 * @route   PUT /api/profile/address/:id
 * @desc    Update an address (owner only)
 * @access  Private
 */
router.put("/address/:id", ProfileController.updateAddress);

/**
 * @route   DELETE /api/profile/address/:id
 * @desc    Delete an address — auto-promotes next as default if needed
 * @access  Private
 */
router.delete("/address/:id", ProfileController.deleteAddress);

/**
 * @route   PATCH /api/profile/address/:id/default
 * @desc    Set an address as the default
 * @access  Private
 */
router.patch("/address/:id/default", ProfileController.setDefaultAddress);

////////////////////////////////////////////////////////////////////
//// PAYMENT METHODS
////////////////////////////////////////////////////////////////////

/**
 * @route   GET /api/profile/payment
 * @desc    Get all saved payment methods (default first)
 * @access  Private
 */
router.get("/payment", ProfileController.getPaymentMethods);

/**
 * @route   POST /api/profile/payment
 * @desc    Add a new payment method
 * @access  Private
 * @body    { type: "UPI"|"Card"|"NetBanking", upi?, card?, netBanking?, isDefault?, label? }
 */
router.post("/payment", ProfileController.addPaymentMethod);

/**
 * @route   PUT /api/profile/payment/:id
 * @desc    Update a payment method (owner only)
 * @access  Private
 */
router.put("/payment/:id", ProfileController.updatePaymentMethod);

/**
 * @route   DELETE /api/profile/payment/:id
 * @desc    Delete a payment method — auto-promotes next as default
 * @access  Private
 */
router.delete("/payment/:id", ProfileController.deletePaymentMethod);

/**
 * @route   PATCH /api/profile/payment/:id/default
 * @desc    Set a payment method as the default
 * @access  Private
 */
router.patch("/payment/:id/default", ProfileController.setDefaultPaymentMethod);

module.exports = router;