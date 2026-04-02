const mongoose = require("mongoose");
const ProductService = require("../service/product.service");
const uploadToCloudinary = require("../helper/cloudinaryUpload");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── CREATE PRODUCT — with optional specs ─────────────────────────────────
// seller → new, refurbished, old
// user   → old only

exports.createProduct = async (req, res) => {
  try {
    // 1. Upload images
    let imageUrls = [];
    if (req.files?.images?.length > 0) {
      const results = await Promise.all(
        req.files.images.map((f) =>
          uploadToCloudinary(f.buffer, { resourceType: "image" }),
        ),
      );
      imageUrls = results.map((r) => r.secure_url);
    }

    // 2. Upload video
    let videoUrl = null;
    if (req.files?.video?.length > 0) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, {
        resourceType: "video",
      });
      videoUrl = result.secure_url;
    }

    // 3. Coordinates
    const coordinates =
      req.body.longitude && req.body.latitude
        ? [Number(req.body.longitude), Number(req.body.latitude)]
        : req.user.location?.coordinates || [0, 0];

    // ✅ Warn if location is missing
    if (coordinates[0] === 0 && coordinates[1] === 0) {
      return res.status(400).json({
        message:
          "Please save your location before listing a product. Go to profile → save location.",
      });
    }

    // 4. Parse specs if sent as JSON string (multipart/form-data)
    let specs = null;
    if (req.body.specs) {
      try {
        specs =
          typeof req.body.specs === "string"
            ? JSON.parse(req.body.specs)
            : req.body.specs;
      } catch {
        return res
          .status(400)
          .json({ message: "Invalid specs format — must be valid JSON" });
      }
    }

    // 5. Build product data
    const productData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      brand: req.body.brand,
      deviceType: req.body.deviceType,
      condition: req.body.condition,
      storage: req.body.storage,
      color: req.body.color,
      price: Number(req.body.price),
      originalPrice: req.body.originalPrice
        ? Number(req.body.originalPrice)
        : null,
      payment: req.body.payment,
      images: imageUrls,
      video: videoUrl,
      listedBy: req.user._id,
      listedByRole: req.user.role,
      location: {
        type: "Point",
        coordinates,
      },
      address: {
        city: req.body.city || req.user.address?.city,
        state: req.body.state || req.user.address?.state,
        pincode: req.body.pincode || req.user.address?.pincode,
        full: req.body.address || req.user.address?.full,
      },
      status: "available",
      ...(specs && { specs }),
    };

    const product = await ProductService.createProduct(productData);

    res.status(201).json({
      success: true,
      message: "Product listed successfully",
      data: product,
    });
  } catch (error) {
    console.error("createProduct error:", error);
    res
      .status(500)
      .json({ message: "Failed to create product. Please try again" });
  }
};

// ─── ADD / UPDATE SPECS — PATCH /api/products/:id/specs ───────────────────
// Owner or admin can update specs anytime after creation

exports.upsertSpecs = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (
      req.user.role !== "admin" &&
      product.listedBy._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update specs for this product" });
    }

    const {
      performance,
      display,
      rearCamera,
      frontCamera,
      battery,
      storageType,
    } = req.body;

    // Build only the specs fields that were sent
    const specsUpdate = {};
    if (performance !== undefined)
      specsUpdate["specs.performance"] = performance;
    if (display !== undefined) specsUpdate["specs.display"] = display;
    if (rearCamera !== undefined) specsUpdate["specs.rearCamera"] = rearCamera;
    if (frontCamera !== undefined)
      specsUpdate["specs.frontCamera"] = frontCamera;
    if (battery !== undefined) specsUpdate["specs.battery"] = battery;
    if (storageType !== undefined)
      specsUpdate["specs.storageType"] = storageType;

    if (Object.keys(specsUpdate).length === 0) {
      return res
        .status(400)
        .json({ message: "No spec fields provided to update" });
    }

    const updated = await ProductService.updateSpecs(
      req.params.id,
      specsUpdate,
    );

    res.status(200).json({
      success: true,
      message: "Specs updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("upsertSpecs error:", error);
    res.status(500).json({ message: "Failed to update specs" });
  }
};

// ─── COMPARE PRODUCTS — GET /api/products/compare?ids=id1,id2 ─────────────

exports.compareProducts = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res
        .status(400)
        .json({ message: "Provide product IDs as ?ids=id1,id2,id3" });
    }

    const idList = ids.split(",").map((id) => id.trim());

    if (idList.length < 2) {
      return res
        .status(400)
        .json({ message: "Provide at least 2 product IDs to compare" });
    }
    if (idList.length > 4) {
      return res
        .status(400)
        .json({ message: "Cannot compare more than 4 products" });
    }

    const invalid = idList.filter((id) => !isValidObjectId(id));
    if (invalid.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid product ID(s): ${invalid.join(", ")}` });
    }

    const products = await ProductService.compareProducts(idList);

    const notFound = idList.filter((_, i) => products[i] === null);
    if (notFound.length > 0) {
      return res
        .status(404)
        .json({ message: `Product(s) not found: ${notFound.join(", ")}` });
    }

    const comparison = products.map((p) => ({
      id: p._id,

      basic: {
        title: p.title,
        brand: p.brand || "N/A",
        category: p.category,
        deviceType: p.deviceType,
        thumbnail: p.images?.[0] || null,
        color: p.color || "N/A",
        storage: p.storage || "N/A",
      },

      pricing: {
        price: p.price,
        originalPrice: p.originalPrice || null,
        discount: p.originalPrice
          ? `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%`
          : null,
      },

      listing: {
        status: p.status,
        rating: p.rating,
        location: p.address?.city
          ? `${p.address.city}, ${p.address.state}`
          : "N/A",
        listedAt: p.createdAt,
      },

      // ── Specs — all from the embedded specs field ───────────────
      performance: p.specs?.performance
        ? {
            chipset: p.specs.performance.chipsetFull || "N/A",
            ram: p.specs.performance.ram || "N/A",
          }
        : null,

      display: p.specs?.display
        ? {
            size:
              p.specs.display.sizeInches && p.specs.display.sizeCm
                ? `${p.specs.display.sizeInches} (${p.specs.display.sizeCm})`
                : p.specs.display.sizeInches || "N/A",
            type: p.specs.display.type || "N/A",
            resolution:
              p.specs.display.resolution && p.specs.display.resolutionType
                ? `${p.specs.display.resolution} (${p.specs.display.resolutionType})`
                : p.specs.display.resolution || "N/A",
            refreshRate: p.specs.display.refreshRate || "N/A",
          }
        : null,

      rearCamera: p.specs?.rearCamera
        ? {
            primary: p.specs.rearCamera.primary || "N/A",
            secondary: p.specs.rearCamera.secondary || "N/A",
            tertiary: p.specs.rearCamera.tertiary || "N/A",
            quaternary: p.specs.rearCamera.quaternary || "N/A",
          }
        : null,

      frontCamera: p.specs?.frontCamera || "N/A",

      battery: p.specs?.battery
        ? {
            capacity: p.specs.battery.capacity || "N/A",
            wiredCharging: p.specs.battery.wiredCharging || "N/A",
          }
        : null,

      storageInfo: {
        internal: p.storage || "N/A", // from root Product field
        storageType: p.specs?.storageType || "N/A", // from embedded specs
      },
    }));

    res.status(200).json({
      success: true,
      count: comparison.length,
      data: comparison,
    });
  } catch (error) {
    console.error("compareProducts error:", error);
    res.status(500).json({ message: "Failed to compare products" });
  }
};

// ─── GET ALL PRODUCTS — public ─────────────────────────────────────────────────

exports.getProducts = async (req, res) => {
  try {
    const result = await ProductService.getProducts(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ─── GET MY LISTINGS — seller/user only ───────────────────────────────────────

exports.getMyProducts = async (req, res) => {
  try {
    const result = await ProductService.getMyProducts(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("getMyProducts error:", error);
    res.status(500).json({ message: "Failed to fetch your listings" });
  }
};

// ─── GET PRODUCT BY ID — public ───────────────────────────────────────────────

exports.getProductById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await ProductService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ─── GET NEARBY PRODUCTS ───────────────────────────────────────────────────
// GET /api/products/nearby
// ?latitude=19.07&longitude=72.87&radius=10&category=mobile&page=1&limit=20

exports.getNearbyProducts = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      category,
      deviceType,
      limit = 20,
      page = 1,
    } = req.query;

    // ── If user is logged in and no coords provided — use saved location ──
    let lat = latitude;
    let lng = longitude;

    if (!lat || !lng) {
      if (req.user?.location?.coordinates) {
        const [savedLng, savedLat] = req.user.location.coordinates;

        // Only use saved location if it's not the default [0,0]
        if (savedLng !== 0 || savedLat !== 0) {
          lat = savedLat;
          lng = savedLng;
        }
      }
    }

    if (!lat || !lng) {
      return res.status(400).json({
        message:
          "Location required. Provide ?latitude=&longitude= or save your location first",
      });
    }

    const result = await ProductService.getNearbyProducts({
      latitude: lat,
      longitude: lng,
      radius,
      category,
      deviceType,
      limit,
      page,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("getNearbyProducts error:", error);
    res.status(500).json({ message: "Failed to fetch nearby products" });
  }
};

// ─── UPDATE PRODUCT — owner only ──────────────────────────────────────────────

exports.updateProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Upload new images if provided
    if (req.files?.images?.length > 0) {
      const results = await Promise.all(
        req.files.images.map((f) =>
          uploadToCloudinary(f.buffer, { resourceType: "image" }),
        ),
      );
      req.body.images = results.map((r) => r.secure_url);
    }

    // Upload new video if provided
    if (req.files?.video?.length > 0) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, {
        resourceType: "video",
      });
      req.body.video = result.secure_url;
    }

    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.originalPrice)
      req.body.originalPrice = Number(req.body.originalPrice);

    const product = await ProductService.updateProduct(
      req.params.id,
      req.user._id,
      req.body,
    );

    if (!product) {
      return res.status(403).json({
        message: "Product not found or you are not authorized to update it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ─── DELETE PRODUCT — owner only ──────────────────────────────────────────────

exports.deleteProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await ProductService.deleteProduct(
      req.params.id,
      req.user._id,
      req.user.role,
    );

    if (!product) {
      return res.status(403).json({
        message: "Product not found or you are not authorized to delete it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
