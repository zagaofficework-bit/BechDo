const express            = require("express");
const router             = express.Router();
const LocationController = require("../controller/location.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

/**
 * @route   POST /api/location/reverse-geocode
 * @desc    Get address details from GPS coordinates
 * @access  Public — frontend can call before login to show address
 * @body    { latitude, longitude }
 */
router.post("/reverse-geocode", LocationController.reverseGeocode);

/**
 * @route   POST /api/location/forward-geocode
 * @desc    Get coordinates from address string
 * @access  Public
 * @body    { address: "MG Road, Mumbai" }
 */
router.post("/forward-geocode", LocationController.forwardGeocode);

/**
 * @route   PATCH /api/location/save
 * @desc    Save GPS coordinates to user profile + update defaultAddress
 * @access  Private
 * @body    { latitude, longitude }
 */
router.patch("/save", authMiddleware, LocationController.saveLocation);

/**
 * @route   POST /api/location/save-as-address
 * @desc    Detect location via GPS and save as a new address in profile
 * @access  Private
 * @body    { latitude, longitude, isDefault? }
 */
router.post("/save-as-address", authMiddleware, LocationController.saveAsAddress);

module.exports = router;