// routes/deviceSell.routes.js
const express              = require("express");
const router               = express.Router();
const DeviceSellController = require("../controller/deviceSell.controller");
const { authMiddleware, authorize } = require("../middleware/auth.middleware");

////////////////////////////////////////////////////////////////////
//// PUBLIC — CATALOG BROWSING
////////////////////////////////////////////////////////////////////

// GET /api/device-sell/variant-fields?category=laptop
// Returns field definitions for a category (for dynamic form building)
router.get("/variant-fields", DeviceSellController.getVariantFields);

// GET /api/device-sell/brands?category=mobile
router.get("/brands", DeviceSellController.getBrands);

// GET /api/device-sell/brands/:brand/models?category=mobile
router.get("/brands/:brand/models", DeviceSellController.getModelsByBrand);

// GET /api/device-sell/models/:modelId/variants
router.get("/models/:modelId/variants", DeviceSellController.getVariantsByModel);

// GET /api/device-sell/evaluation-config?category=laptop
router.get("/evaluation-config", DeviceSellController.getEvaluationConfig);

////////////////////////////////////////////////////////////////////
//// USER — SELL FLOW
////////////////////////////////////////////////////////////////////

router.post("/calculate",      authMiddleware, authorize("user"), DeviceSellController.calculatePrice);
router.post("/submit",         authMiddleware, authorize("user"), DeviceSellController.submitListing);
router.get("/my-listings",     authMiddleware, authorize("user"), DeviceSellController.getMyListings);
router.delete("/listings/:listingId", authMiddleware, authorize("user"), DeviceSellController.cancelListing);
router.post("/listings/:listingId/confirm-pickup", authMiddleware, DeviceSellController.confirmPickup);

////////////////////////////////////////////////////////////////////
//// SELLER — BROWSE AND ACT ON LISTINGS
////////////////////////////////////////////////////////////////////

router.get("/my-accepted-listings", authMiddleware, authorize("seller"), DeviceSellController.getMyAcceptedListings);
router.get("/listings/nearby",      authMiddleware, authorize("seller"), DeviceSellController.getNearbyListings);
router.get("/listings",             authMiddleware, authorize("seller"), DeviceSellController.getListings);
router.post("/listings/:listingId/accept",       authMiddleware, authorize("seller"), DeviceSellController.acceptListing);
router.post("/listings/:listingId/complete",     authMiddleware, authorize("seller"), DeviceSellController.completeListing);
router.post("/listings/:listingId/reject",       authMiddleware, authorize("seller"), DeviceSellController.rejectListing);
router.post("/listings/:listingId/dismiss",      authMiddleware, authorize("seller"), DeviceSellController.dismissListing);
router.patch("/listings/:listingId/propose-slots", authMiddleware, DeviceSellController.proposeSlots);

////////////////////////////////////////////////////////////////////
//// ADMIN — CATALOG + CONFIG
////////////////////////////////////////////////////////////////////

router.post("/admin/catalog",           authMiddleware, authorize("admin"), DeviceSellController.addBrandCatalog);
router.put("/admin/evaluation-config",  authMiddleware, authorize("admin"), DeviceSellController.updateEvaluationConfig);

module.exports = router;