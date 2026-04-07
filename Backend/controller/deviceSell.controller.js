// controller/deviceSell.controller.js
const mongoose = require("mongoose");
const DeviceCatalog = require("../models/deviceCatalog.model");
const DeviceListing = require("../models/deviceListing.model");
const EvaluationConfig = require("../models/evaluationConfig.model");
const emailService = require("../service/email.service");
const {
  VARIANT_FIELDS_MAP,
  buildVariantLabel,
} = require("../constants/deviceSell.constants");
const { calculateFinalPrice } = require("../utils/priceCalculator");
const { Readable } = require("stream");

/** Upload a single buffer to Cloudinary and return the secure_url */
const uploadBufferToCloudinary = (buffer, folder = "rejection_images") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 1200, crop: "limit", quality: "auto:good" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

////////////////////////////////////////////////////////////////////
//// STEP 0 — GET VARIANT FIELDS FOR A CATEGORY
////////////////////////////////////////////////////////////////////

exports.getVariantFields = (req, res) => {
  const { category } = req.query;
  if (!category) {
    return res.status(400).json({ message: "category is required" });
  }
  const fields = VARIANT_FIELDS_MAP[category];
  if (!fields) {
    return res.status(400).json({ message: `Unknown category: ${category}` });
  }
  res.status(200).json({ success: true, category, fields });
};

////////////////////////////////////////////////////////////////////
//// STEP 1 — GET BRANDS
////////////////////////////////////////////////////////////////////

exports.getBrands = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({
        message: "category is required",
        allowed: Object.keys(VARIANT_FIELDS_MAP),
      });
    }
    const brands = await DeviceCatalog.find({ category })
      .select("brand")
      .lean();
    if (brands.length === 0) {
      return res
        .status(404)
        .json({ message: `No brands found for category: ${category}` });
    }
    res
      .status(200)
      .json({ success: true, category, data: brands.map((b) => b.brand) });
  } catch (error) {
    console.error("getBrands error:", error);
    res.status(500).json({ message: "Failed to fetch brands" });
  }
};

////////////////////////////////////////////////////////////////////
//// STEP 2 — GET MODELS BY BRAND
////////////////////////////////////////////////////////////////////

exports.getModelsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }
    const catalog = await DeviceCatalog.findOne({ brand, category })
      .select("brand models.name models.image models.soldCount models._id")
      .lean();
    if (!catalog) {
      return res.status(404).json({
        message: `Brand "${brand}" not found in category "${category}"`,
      });
    }
    res.status(200).json({
      success: true,
      brand: catalog.brand,
      category,
      data: catalog.models.map((m) => ({
        id: m._id,
        name: m.name,
        image: m.image,
        soldCount: m.soldCount,
      })),
    });
  } catch (error) {
    console.error("getModelsByBrand error:", error);
    res.status(500).json({ message: "Failed to fetch models" });
  }
};

////////////////////////////////////////////////////////////////////
//// STEP 3 — GET VARIANTS BY MODEL
////////////////////////////////////////////////////////////////////

exports.getVariantsByModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const catalog = await DeviceCatalog.findOne({
      "models._id": modelId,
    }).lean();
    if (!catalog) {
      return res.status(404).json({ message: "Model not found" });
    }
    const model = catalog.models.find((m) => m._id.toString() === modelId);
    const fields = VARIANT_FIELDS_MAP[catalog.category] || [];

    res.status(200).json({
      success: true,
      model: model.name,
      image: model.image,
      category: catalog.category,
      specFields: fields,
      data: model.variants.map((v) => ({
        id: v._id,
        specs: v.specs,
        label: buildVariantLabel(v.specs, catalog.category),
        basePrice: v.basePrice,
      })),
    });
  } catch (error) {
    console.error("getVariantsByModel error:", error);
    res.status(500).json({ message: "Failed to fetch variants" });
  }
};

////////////////////////////////////////////////////////////////////
//// STEP 4 — GET EVALUATION CONFIG
////////////////////////////////////////////////////////////////////

exports.getEvaluationConfig = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }
    const config = await EvaluationConfig.findOne({ category }).lean();
    if (!config) {
      return res.status(404).json({
        message: `Evaluation config not found for category: ${category}`,
      });
    }
    res.status(200).json({
      success: true,
      category,
      data: {
        questions: config.questions.sort((a, b) => a.order - b.order),
        defects: config.defects.sort((a, b) => a.order - b.order),
        accessories: config.accessories.sort((a, b) => a.order - b.order),
        processingFee: config.processingFee,
      },
    });
  } catch (error) {
    console.error("getEvaluationConfig error:", error);
    res.status(500).json({ message: "Failed to fetch evaluation config" });
  }
};

////////////////////////////////////////////////////////////////////
//// SHARED: calculate deductions/additions from answers
////////////////////////////////////////////////////////////////////

function computePricing({
  config,
  answers,
  defectKeys,
  accessoryKeys,
  basePrice,
}) {
  let totalDeductionPercent = 0;
  let totalAdditionPercent = 0;
  const deductionBreakdown = [];
  const additionBreakdown = [];
  if (answers) {
    for (const q of config.questions) {
      if (answers[q.key] === false && q.deductionOnNo > 0) {
        totalDeductionPercent += q.deductionOnNo;
        deductionBreakdown.push({
          reason: q.label,
          deduction: q.deductionOnNo,
        });
      }
    }
  }

  if (defectKeys?.length > 0) {
    for (const key of defectKeys) {
      let found = false;
      for (const defectGroup of config.defects) {
        if (defectGroup.children?.length > 0) {
          const child = defectGroup.children.find((c) => c.key === key);
          if (child) {
            totalDeductionPercent += child.deduction;
            deductionBreakdown.push({
              reason: child.label,
              deduction: child.deduction,
            });
            found = true;
            break;
          }
        }
      }
      if (!found) {
        const defect = config.defects.find(
          (d) => d.key === key && (!d.children || d.children.length === 0),
        );
        if (defect && defect.deduction > 0) {
          totalDeductionPercent += defect.deduction;
          deductionBreakdown.push({
            reason: defect.label,
            deduction: defect.deduction,
          });
        }
      }
    }
  }
  if (accessoryKeys?.length > 0) {
    for (const key of accessoryKeys) {
      const accessory = config.accessories.find((a) => a.key === key);
      if (accessory && accessory.addition > 0) {
        totalAdditionPercent += accessory.addition;
        additionBreakdown.push({
          reason: accessory.label,
          addition: accessory.addition,
        });
      }
    }
  }

  const cappedDeductionPercent = Math.min(totalDeductionPercent, 100);
  const deductionAmount = parseFloat(
    ((basePrice * cappedDeductionPercent) / 100).toFixed(2),
  );
  const additionAmount = parseFloat(
    ((basePrice * totalAdditionPercent) / 100).toFixed(2),
  );
  const afterDeductions = basePrice - deductionAmount + additionAmount;
  const finalPrice = Math.max(
    0,
    Math.round(afterDeductions - config.processingFee),
  );
  return {
    totalDeductionPercent,
    cappedDeductionPercent,
    totalAdditionPercent,
    deductionAmount,
    additionAmount,
    processingFee: config.processingFee,
    finalPrice,
    deductionBreakdown,
    additionBreakdown,
  };
}

////////////////////////////////////////////////////////////////////
//// STEP 5 — CALCULATE PRICE (preview)
////////////////////////////////////////////////////////////////////

exports.calculatePrice = async (req, res) => {
  try {
    const { variantId, modelId, category, answers, defectKeys, accessoryKeys } =
      req.body;
    if (!category)
      return res.status(400).json({ message: "category is required" });

    const catalog = await DeviceCatalog.findOne({
      "models._id": modelId,
    }).lean();
    if (!catalog) return res.status(404).json({ message: "Model not found" });

    const model = catalog.models.find((m) => m._id.toString() === modelId);
    const variant = model?.variants.find((v) => v._id.toString() === variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    const config = await EvaluationConfig.findOne({ category }).lean();
    if (!config)
      return res.status(500).json({
        message: `Evaluation config not found for category: ${category}`,
      });

    const pricing = computePricing({
      config,
      answers,
      defectKeys,
      accessoryKeys,
      basePrice: variant.basePrice,
    });

    res.status(200).json({
      success: true,
      data: {
        device: {
          model: model.name,
          variant: buildVariantLabel(variant.specs, category),
          image: model.image,
          category,
        },
        pricing: {
          basePrice: variant.basePrice,
          deductionPercent: pricing.cappedDeductionPercent, // applied
          rawDeductionPercent: pricing.totalDeductionPercent, // for warning
          deductionAmount: pricing.deductionAmount,
          additionAmount: pricing.additionAmount,
          processingFee: pricing.processingFee,
          finalPrice: pricing.finalPrice,
        },
        breakdown: {
          deductions: pricing.deductionBreakdown,
          additions: pricing.additionBreakdown,
        },
      },
    });
  } catch (error) {
    console.error("calculatePrice error:", error);
    res.status(500).json({ message: "Failed to calculate price" });
  }
};

////////////////////////////////////////////////////////////////////
//// STEP 6 — SUBMIT LISTING
////////////////////////////////////////////////////////////////////

exports.submitListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { variantId, modelId, category, answers, defectKeys, accessoryKeys } =
      req.body;
    if (!category)
      return res.status(400).json({ message: "category is required" });

    const catalog = await DeviceCatalog.findOne({
      "models._id": modelId,
    }).lean();
    if (!catalog) return res.status(404).json({ message: "Model not found" });

    const model = catalog.models.find((m) => m._id.toString() === modelId);
    const variant = model?.variants.find((v) => v._id.toString() === variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    const config = await EvaluationConfig.findOne({ category }).lean();
    if (!config)
      return res.status(500).json({
        message: `Evaluation config not found for category: ${category}`,
      });

    const pricing = computePricing({
      config,
      answers,
      defectKeys,
      accessoryKeys,
      basePrice: variant.basePrice,
    });

    const defectsData = (defectKeys || [])
      .map((key) => config.defects.find((d) => d.key === key))
      .filter(Boolean)
      .map((d) => ({ key: d.key, label: d.label, deduction: d.deduction }));

    const answersMap = {};
    if (answers) {
      for (const q of config.questions) {
        if (answers[q.key] !== undefined) answersMap[q.key] = answers[q.key];
      }
    }

    const listing = await DeviceListing.create({
      listedBy: userId,
      brand: catalog.brand,
      category,
      model: model.name,
      image: model.image,
      specs: variant.specs,

      evaluation: {
        answers: answersMap,
        defects: defectsData,
        accessoryKeys: accessoryKeys || [],
      },

      basePrice: variant.basePrice,
      totalDeduction: pricing.totalDeductionPercent,
      deductionAmount: pricing.deductionAmount,
      additionAmount: pricing.additionAmount,
      processingFee: pricing.processingFee,
      finalPrice: pricing.finalPrice,

      status: "available",
      visibility: "super_seller_only",
      superSellerExpiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });

    await DeviceCatalog.updateOne(
      { "models._id": modelId },
      { $inc: { "models.$.soldCount": 1 } },
    );

    // ── Email: confirm listing submitted to user ───────────────────────────
    emailService
      .sendDeviceListingSubmittedEmail(req.user.email, {
        firstname: req.user.firstname,
        listingId: listing._id,
        deviceName: `${model.name} (${buildVariantLabel(variant.specs, category)})`,
        category,
        finalPrice: pricing.finalPrice,
      })
      .catch((err) =>
        console.error("sendDeviceListingSubmittedEmail error:", err),
      );

    res.status(201).json({
      success: true,
      message: "Your device has been listed. Sellers will contact you soon.",
      data: {
        listingId: listing._id,
        device: `${model.name} (${buildVariantLabel(variant.specs, category)})`,
        category,
        finalPrice: pricing.finalPrice,
        status: "available",
      },
    });
  } catch (error) {
    console.error("submitListing error:", error);
    res.status(500).json({ message: "Failed to submit listing" });
  }
};

////////////////////////////////////////////////////////////////////
//// GET LISTINGS — for sellers
////////////////////////////////////////////////////////////////////

exports.getListings = async (req, res) => {
  try {
    const { brand, model, category, page = 1, limit = 20 } = req.query;
    const seller = req.user;
    const now = new Date();

    const filter = { status: "available" };

    if (seller.isSuperSeller) {
      filter.visibility = "super_seller_only";
      filter.superSellerExpiresAt = { $gt: now };
    } else {
      filter.visibility = "all_sellers";
    }

    if (brand) filter.brand = new RegExp(brand, "i");
    if (model) filter.model = new RegExp(model, "i");
    if (category) filter.category = category;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      DeviceListing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("listedBy", "firstname lastname mobile defaultAddress")
        .lean(),
      DeviceListing.countDocuments(filter),
    ]);

    const enriched = seller.isSuperSeller
      ? listings.map((l) => ({
          ...l,
          expiresInMinutes: l.superSellerExpiresAt
            ? Math.max(
                0,
                Math.round((new Date(l.superSellerExpiresAt) - now) / 60000),
              )
            : null,
        }))
      : listings;

    res.status(200).json({
      success: true,
      pool: seller.isSuperSeller ? "priority_pool" : "open_pool",
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
      data: enriched,
    });
  } catch (error) {
    console.error("getListings error:", error);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
};

////////////////////////////////////////////////////////////////////
//// GET NEARBY LISTINGS
////////////////////////////////////////////////////////////////////

exports.getNearbyListings = async (req, res) => {
  try {
    let {
      latitude,
      longitude,
      radius = 10,
      category,
      page = 1,
      limit = 20,
    } = req.query;

    if (!latitude || !longitude) {
      if (req.user?.location?.coordinates) {
        const [savedLng, savedLat] = req.user.location.coordinates;
        if (savedLng !== 0 || savedLat !== 0) {
          latitude = savedLat;
          longitude = savedLng;
        }
      }
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        message:
          "Location required. Provide ?latitude=&longitude= or save your location first",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "listedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          status: "available",
          ...(category && { category }),
          "user.location": {
            $geoWithin: {
              $centerSphere: [[lng, lat], Number(radius) / 6378.1],
            },
          },
        },
      },
      {
        $addFields: {
          distance: {
            $let: {
              vars: {
                lat1: lat,
                lon1: lng,
                lat2: { $arrayElemAt: ["$user.location.coordinates", 1] },
                lon2: { $arrayElemAt: ["$user.location.coordinates", 0] },
              },
              in: {
                $multiply: [
                  6371,
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [
                            { $sin: { $degreesToRadians: "$$lat1" } },
                            { $sin: { $degreesToRadians: "$$lat2" } },
                          ],
                        },
                        {
                          $multiply: [
                            { $cos: { $degreesToRadians: "$$lat1" } },
                            { $cos: { $degreesToRadians: "$$lat2" } },
                            {
                              $cos: {
                                $subtract: [
                                  { $degreesToRadians: "$$lon2" },
                                  { $degreesToRadians: "$$lon1" },
                                ],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $sort: { distance: 1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          brand: 1,
          category: 1,
          model: 1,
          specs: 1,
          image: 1,
          finalPrice: 1,
          basePrice: 1,
          status: 1,
          distance: 1,
          createdAt: 1,
          evaluation: { answers: 1, defects: 1 },
          listedBy: {
            _id: "$user._id",
            firstname: "$user.firstname",
            defaultAddress: "$user.defaultAddress",
          },
        },
      },
    ];

    const [listings, total] = await Promise.all([
      DeviceListing.aggregate(pipeline),
      DeviceListing.countDocuments({
        status: "available",
        ...(category && { category }),
      }),
    ]);

    res.status(200).json({
      success: true,
      meta: {
        userLocation: { latitude: lat, longitude: lng },
        radiusKm: Number(radius),
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
      data: listings,
    });
  } catch (error) {
    console.error("getNearbyListings error:", error);
    res.status(500).json({ message: "Failed to fetch nearby listings" });
  }
};

////////////////////////////////////////////////////////////////////
//// ACCEPT LISTING
////////////////////////////////////////////////////////////////////

exports.acceptListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const seller = req.user;
    const { proposedSlots = [] } = req.body;

    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });

    const visibilityFilter = seller.isSuperSeller
      ? { visibility: "super_seller_only" }
      : { visibility: "all_sellers" };

    const listing = await DeviceListing.findOne({
      _id: listingId,
      status: "available",
      ...visibilityFilter,
    }).populate("listedBy", "firstname lastname mobile email");

    if (!listing) {
      return res.status(404).json({
        message: seller.isSuperSeller
          ? "Listing not found or already accepted"
          : "Listing not found, already accepted, or not yet available to regular sellers",
      });
    }

    if (listing.listedBy._id.toString() === seller._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot accept your own listing" });
    }

    const cleanSlots = (proposedSlots || [])
      .slice(0, 3)
      .filter((s) => s?.date && s?.timeRange)
      .map((s) => ({ date: s.date.trim(), timeRange: s.timeRange.trim() }));

    listing.status = "accepted";
    listing.acceptedBy = seller._id;
    listing.acceptedAt = new Date();
    listing.pickup = {
      status: "awaiting_user_confirmation",
      proposedSlots: cleanSlots,
      confirmedSlot: null,
      paymentMethod: null,
      paymentDetails: null,
      confirmedAt: null,
    };

    await listing.save();

    // ── Email: notify user their listing was accepted ──────────────────────
    if (listing.listedBy?.email) {
      emailService
        .sendListingAcceptedEmail(listing.listedBy.email, {
          firstname: listing.listedBy.firstname,
          listingId: listing._id,
          deviceName: listing.model,
          finalPrice: listing.finalPrice,
          sellerName: `${seller.firstname} ${seller.lastname}`,
          proposedSlots: cleanSlots,
          acceptedAs: seller.isSuperSeller ? "super_seller" : "seller",
        })
        .catch((err) => console.error("sendListingAcceptedEmail error:", err));
    }

    res.status(200).json({
      success: true,
      message:
        "Listing accepted. User will be notified to confirm pickup slot and payment method.",
      data: {
        listingId: listing._id,
        device: listing.model,
        finalPrice: listing.finalPrice,
        acceptedAs: seller.isSuperSeller ? "super_seller" : "seller",
        proposedSlots: cleanSlots,
        pickupStatus: "awaiting_user_confirmation",
        user: {
          name: `${listing.listedBy.firstname} ${listing.listedBy.lastname}`,
          mobile: listing.listedBy.mobile,
        },
      },
    });
  } catch (error) {
    console.error("acceptListing error:", error);
    res.status(500).json({ message: "Failed to accept listing" });
  }
};

////////////////////////////////////////////////////////////////////
//// CONFIRM PICKUP
////////////////////////////////////////////////////////////////////

exports.confirmPickup = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user._id;
    const { slotIndex, paymentMethod, paymentDetails } = req.body;

    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });

    const VALID_PAYMENT_METHODS = ["cash", "upi", "bank_transfer"];
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
        allowed: VALID_PAYMENT_METHODS,
      });
    }
    if (
      ["upi", "bank_transfer"].includes(paymentMethod) &&
      !paymentDetails?.trim()
    ) {
      return res
        .status(400)
        .json({ message: `paymentDetails is required for ${paymentMethod}` });
    }

    const listing = await DeviceListing.findOne({
      _id: listingId,
      listedBy: userId,
      status: "accepted",
      "pickup.status": "awaiting_user_confirmation",
    }).populate("acceptedBy", "firstname lastname mobile email");

    if (!listing)
      return res.status(404).json({
        message:
          "Listing not found, not in accepted state, or already confirmed",
      });

    const slots = listing.pickup.proposedSlots || [];
    if (slots.length === 0)
      return res.status(400).json({
        message:
          "No proposed slots available. Ask the seller to add pickup slots.",
      });

    const idx = parseInt(slotIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= slots.length) {
      return res
        .status(400)
        .json({ message: `Invalid slotIndex. Must be 0–${slots.length - 1}` });
    }

    listing.pickup.confirmedSlot = slots[idx];
    listing.pickup.paymentMethod = paymentMethod;
    listing.pickup.paymentDetails =
      paymentMethod === "cash" ? null : paymentDetails?.trim();
    listing.pickup.status = "scheduled";
    listing.pickup.confirmedAt = new Date();

    await listing.save();

    // ── Email: notify seller of confirmed pickup ───────────────────────────
    if (listing.acceptedBy?.email) {
      emailService
        .sendPickupConfirmedEmail(listing.acceptedBy.email, {
          sellerName: `${listing.acceptedBy.firstname} ${listing.acceptedBy.lastname}`,
          listingId: listing._id,
          deviceName: listing.model,
          finalPrice: listing.finalPrice,
          confirmedSlot: listing.pickup.confirmedSlot,
          paymentMethod: listing.pickup.paymentMethod,
          paymentDetails: listing.pickup.paymentDetails,
          userName: `${req.user.firstname} ${req.user.lastname}`,
          userMobile: req.user.mobile,
        })
        .catch((err) => console.error("sendPickupConfirmedEmail error:", err));
    }

    res.status(200).json({
      success: true,
      message:
        "Pickup confirmed! The seller will arrive at the scheduled time.",
      data: {
        listingId: listing._id,
        device: listing.model,
        finalPrice: listing.finalPrice,
        confirmedSlot: listing.pickup.confirmedSlot,
        paymentMethod: listing.pickup.paymentMethod,
        paymentDetails: listing.pickup.paymentDetails,
        seller: {
          name: `${listing.acceptedBy.firstname} ${listing.acceptedBy.lastname}`,
          mobile: listing.acceptedBy.mobile,
        },
      },
    });
  } catch (error) {
    console.error("confirmPickup error:", error);
    res.status(500).json({ message: "Failed to confirm pickup" });
  }
};

////////////////////////////////////////////////////////////////////
//// PROPOSE SLOTS
////////////////////////////////////////////////////////////////////

exports.proposeSlots = async (req, res) => {
  try {
    const { listingId } = req.params;
    const sellerId = req.user._id;
    const { proposedSlots } = req.body;

    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });
    if (!Array.isArray(proposedSlots) || proposedSlots.length === 0) {
      return res
        .status(400)
        .json({ message: "proposedSlots must be a non-empty array" });
    }

    const cleanSlots = proposedSlots
      .slice(0, 3)
      .filter((s) => s?.date && s?.timeRange)
      .map((s) => ({ date: s.date.trim(), timeRange: s.timeRange.trim() }));
    if (cleanSlots.length === 0)
      return res
        .status(400)
        .json({ message: "Each slot must have date and timeRange" });

    const listing = await DeviceListing.findOne({
      _id: listingId,
      acceptedBy: sellerId,
      status: "accepted",
    }).populate("listedBy", "firstname email");

    if (!listing)
      return res.status(404).json({
        message: "Listing not found or you are not the accepting seller",
      });

    listing.pickup.proposedSlots = cleanSlots;
    listing.pickup.confirmedSlot = null;
    listing.pickup.paymentMethod = null;
    listing.pickup.paymentDetails = null;
    listing.pickup.status = "awaiting_user_confirmation";
    listing.pickup.confirmedAt = null;

    await listing.save();

    // ── Email: re-notify user of updated slots ─────────────────────────────
    if (listing.listedBy?.email) {
      emailService
        .sendListingAcceptedEmail(listing.listedBy.email, {
          firstname: listing.listedBy.firstname,
          listingId: listing._id,
          deviceName: listing.model,
          finalPrice: listing.finalPrice,
          sellerName: `${req.user.firstname} ${req.user.lastname}`,
          proposedSlots: cleanSlots,
          acceptedAs: req.user.isSuperSeller ? "super_seller" : "seller",
        })
        .catch((err) =>
          console.error("proposeSlots sendListingAcceptedEmail error:", err),
        );
    }

    res.status(200).json({
      success: true,
      message: "Proposed slots updated. User will be notified to confirm.",
      data: {
        listingId: listing._id,
        proposedSlots: cleanSlots,
        pickupStatus: "awaiting_user_confirmation",
      },
    });
  } catch (error) {
    console.error("proposeSlots error:", error);
    res.status(500).json({ message: "Failed to update slots" });
  }
};

////////////////////////////////////////////////////////////////////
//// COMPLETE LISTING
////////////////////////////////////////////////////////////////////

exports.completeListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const sellerId = req.user._id;

    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });

    const listing = await DeviceListing.findOne({
      _id: listingId,
      acceptedBy: sellerId,
      status: "accepted",
    }).populate("listedBy", "firstname email");

    if (!listing)
      return res.status(404).json({
        message: "Listing not found or you are not the accepting seller",
      });

    listing.status = "completed";
    listing.completedAt = new Date();
    await listing.save();

    // ── Email: notify user that transaction is complete ────────────────────
    if (listing.listedBy?.email) {
      emailService
        .sendListingCompletedEmail(listing.listedBy.email, {
          firstname: listing.listedBy.firstname,
          listingId: listing._id,
          deviceName: listing.model,
          finalPrice: listing.finalPrice,
          completedAt: listing.completedAt,
        })
        .catch((err) => console.error("sendListingCompletedEmail error:", err));
    }

    res.status(200).json({
      success: true,
      message: "Transaction completed successfully",
      data: {
        listingId: listing._id,
        finalPrice: listing.finalPrice,
        completedAt: listing.completedAt,
      },
    });
  } catch (error) {
    console.error("completeListing error:", error);
    res.status(500).json({ message: "Failed to complete listing" });
  }
};

////////////////////////////////////////////////////////////////////
//// REJECT LISTING
////////////////////////////////////////////////////////////////////

exports.rejectListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const seller = req.user;
    const { reason } = req.body;

    // ── 1. Validate ID ───────────────────────────────────────────────────────
    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });

    // ── 2. Fetch listing (must belong to this seller and be accepted) ────────
    const listing = await DeviceListing.findOne({
      _id: listingId,
      acceptedBy: seller._id,
      status: "accepted",
    }).populate("listedBy", "firstname email");

    if (!listing)
      return res.status(404).json({
        message: "Listing not found or you are not the accepting seller",
      });

    // ── 3. Upload rejection images (if provided) ─────────────────────────────
    const rejectionImages = req.files?.images?.length
      ? await Promise.all(
          req.files.images.map((f) => uploadBufferToCloudinary(f.buffer)),
        )
      : [];

    let cleanReason = null;

    if (typeof reason === "string") {
      cleanReason = reason.trim();
    } else if (Array.isArray(reason)) {
      cleanReason = reason[0]?.trim();
    } else if (typeof reason === "object" && reason !== null) {
      cleanReason = String(reason).trim();
    }

    // ── 4. Super-seller path ─────────────────────────────────────────────────
    if (seller.isSuperSeller) {
      Object.assign(listing, {
        status: "available",
        acceptedBy: null,
        acceptedAt: null,
        visibility: "all_sellers",
        superSellerRejected: true,
        superSellerRejectedBy: seller._id,
        superSellerRejectedAt: new Date(),
        rejectionReason: cleanReason,
        rejectionImages,
      });
      await listing.save();

      if (listing.listedBy?.email) {
        emailService
          .sendListingRejectedEmail(listing.listedBy.email, {
            firstname: listing.listedBy.firstname,
            listingId: listing._id,
            deviceName: listing.model,
            finalPrice: listing.finalPrice,
            reason: cleanReason,
            rejectionImages,
            sellerType: "super_seller",
          })
          .catch((err) =>
            console.error("sendListingRejectedEmail (super_seller):", err),
          );
      }

      return res.status(200).json({
        success: true,
        message: "Listing rejected. It is now visible to all regular sellers.",
        data: {
          listingId: listing._id,
          visibility: "all_sellers",
          status: "available",
          reason: cleanReason,
          rejectionImages,
        },
      });
    }

    // ── 5. Regular-seller path ───────────────────────────────────────────────
    Object.assign(listing, {
      status: "available",
      acceptedBy: null,
      acceptedAt: null,
      rejectedAt: new Date(),
      rejectionReason: cleanReason,
      rejectionImages,
    });
    await listing.save();

    if (listing.listedBy?.email) {
      emailService
        .sendListingRejectedEmail(listing.listedBy.email, {
          firstname: listing.listedBy.firstname,
          listingId: listing._id,
          deviceName: listing.model,
          finalPrice: listing.finalPrice,
          reason: cleanReason,
          rejectionImages,
          sellerType: "seller",
        })
        .catch((err) =>
          console.error("sendListingRejectedEmail (seller):", err),
        );
    }

    res.status(200).json({
      success: true,
      message:
        "Listing rejected. It is back in the open pool for other sellers.",
      data: {
        listingId: listing._id,
        visibility: listing.visibility,
        status: "available",
        reason: cleanReason,
        rejectionImages,
      },
    });
  } catch (error) {
    console.error("rejectListing error:", error);
    res.status(500).json({ message: "Failed to reject listing" });
  }
};

////////////////////////////////////////////////////////////////////
//// DISMISS LISTING (super seller only)
////////////////////////////////////////////////////////////////////

exports.dismissListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const seller = req.user;
    const { reason } = req.body;

    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });
    if (!seller.isSuperSeller)
      return res
        .status(403)
        .json({ message: "Only super seller can dismiss listings" });

    const listing = await DeviceListing.findOne({
      _id: listingId,
      status: "available",
      visibility: "super_seller_only",
    });
    if (!listing)
      return res
        .status(404)
        .json({ message: "Listing not found or already processed" });

    listing.visibility = "all_sellers";
    listing.superSellerRejected = true;
    listing.superSellerRejectedBy = seller._id;
    listing.superSellerRejectedAt = new Date();
    listing.rejectionReason = reason?.trim() || null;
    await listing.save();

    res.status(200).json({
      success: true,
      message: "Listing dismissed. It is now visible to all regular sellers.",
      data: {
        listingId: listing._id,
        visibility: "all_sellers",
        status: "available",
      },
    });
  } catch (error) {
    console.error("dismissListing error:", error);
    res.status(500).json({ message: "Failed to dismiss listing" });
  }
};

////////////////////////////////////////////////////////////////////
//// MY ACCEPTED LISTINGS (seller)
////////////////////////////////////////////////////////////////////

exports.getMyAcceptedListings = async (req, res) => {
  try {
    const listings = await DeviceListing.find({
      acceptedBy: req.user._id,
      status: { $in: ["accepted", "completed"] },
    })
      .sort({ acceptedAt: -1 })
      .populate("listedBy", "firstname lastname mobile defaultAddress")
      .lean();
    res
      .status(200)
      .json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    console.error("getMyAcceptedListings error:", error);
    res.status(500).json({ message: "Failed to fetch your accepted listings" });
  }
};

////////////////////////////////////////////////////////////////////
//// MY LISTINGS (user)
////////////////////////////////////////////////////////////////////

exports.getMyListings = async (req, res) => {
  try {
    const listings = await DeviceListing.find({ listedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate("acceptedBy", "firstname lastname mobile")
      .lean();
    res
      .status(200)
      .json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    console.error("getMyListings error:", error);
    res.status(500).json({ message: "Failed to fetch your listings" });
  }
};

////////////////////////////////////////////////////////////////////
//// CANCEL LISTING (user)
////////////////////////////////////////////////////////////////////

exports.cancelListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(listingId))
      return res.status(400).json({ message: "Invalid listing ID" });

    const listing = await DeviceListing.findOne({
      _id: listingId,
      listedBy: userId,
      status: { $in: ["available"] },
    });
    if (!listing)
      return res.status(404).json({
        message: "Listing not found or cannot be cancelled (already accepted)",
      });

    listing.status = "cancelled";
    await listing.save();
    res
      .status(200)
      .json({ success: true, message: "Listing cancelled successfully" });
  } catch (error) {
    console.error("cancelListing error:", error);
    res.status(500).json({ message: "Failed to cancel listing" });
  }
};

////////////////////////////////////////////////////////////////////
//// ADMIN — ADD BRAND CATALOG
////////////////////////////////////////////////////////////////////

exports.addBrandCatalog = async (req, res) => {
  try {
    const { brand, category, models } = req.body;
    if (!brand || !category || !models?.length) {
      return res
        .status(400)
        .json({ message: "brand, category, and models are required" });
    }

    const fields = VARIANT_FIELDS_MAP[category];
    if (!fields)
      return res.status(400).json({ message: `Unknown category: ${category}` });

    const requiredKeys = fields.filter((f) => f.required).map((f) => f.key);
    for (const model of models) {
      for (const variant of model.variants || []) {
        for (const key of requiredKeys) {
          if (!variant.specs?.[key]) {
            return res.status(400).json({
              message: `Variant for model "${model.name}" is missing required spec: "${key}" (required for category "${category}")`,
            });
          }
        }
      }
    }

    const existing = await DeviceCatalog.findOne({ brand, category });
    if (existing) {
      const existingNames = new Set(existing.models.map((m) => m.name));
      const newModels = models.filter((m) => !existingNames.has(m.name));
      existing.models.push(...newModels);
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Models merged (duplicates skipped)",
        added: newModels.length,
      });
    }

    const catalog = await DeviceCatalog.create({ brand, category, models });
    res
      .status(201)
      .json({ success: true, message: "Brand catalog created", data: catalog });
  } catch (error) {
    console.error("addBrandCatalog error:", error);
    res.status(500).json({ message: "Failed to add brand catalog" });
  }
};

////////////////////////////////////////////////////////////////////
//// ADMIN — UPDATE EVALUATION CONFIG
////////////////////////////////////////////////////////////////////

exports.updateEvaluationConfig = async (req, res) => {
  try {
    const { category, questions, defects, accessories, processingFee } =
      req.body;
    if (!category)
      return res.status(400).json({ message: "category is required" });

    const config = await EvaluationConfig.findOneAndUpdate(
      { category },
      { $set: { category, questions, defects, accessories, processingFee } },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      message: `Evaluation config updated for category: ${category}`,
      data: config,
    });
  } catch (error) {
    console.error("updateEvaluationConfig error:", error);
    res.status(500).json({ message: "Failed to update config" });
  }
};
