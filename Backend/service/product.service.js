const Product = require("../models/product.model");
const redisClient = require("../config/redis.client");

////////////////////////////////////////////////////////////////////
//// REDIS KEY HELPERS
////////////////////////////////////////////////////////////////////

const PRODUCT_CACHE_TTL = 60 * 5;
const PRODUCT_KEY = (id) => `product:${id}`;
const PRODUCTS_LIST_KEY = (query) => `products:${JSON.stringify(query)}`;

////////////////////////////////////////////////////////////////////
//// CREATE PRODUCT
////////////////////////////////////////////////////////////////////

exports.createProduct = async (data) => {
  const product = await Product.create(data);
  await invalidateListCache();
  return product;
};

////////////////////////////////////////////////////////////////////
//// GET ALL PRODUCTS — location-aware, paginated + cached
////////////////////////////////////////////////////////////////////

exports.getProducts = async (query) => {
  const {
    category,
    subcategory,
    condition,
    deviceType,
    color,
    storage,
    brand,
    minPrice,
    maxPrice,
    search,
    longitude,
    latitude,
    radius = 5,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const isLocationQuery = longitude && latitude;
  const cacheKey = !isLocationQuery ? PRODUCTS_LIST_KEY(query) : null;

  if (cacheKey) {
    const cached = await redisClient.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  // Base filter — no location field here
  const baseFilter = { status: "available" };
  if (category) baseFilter.category = category;
  if (subcategory) baseFilter.subcategory = subcategory;
  if (condition) baseFilter.condition = condition;
  if (deviceType) baseFilter.deviceType = deviceType;
  if (color) baseFilter.color = new RegExp(color, "i");
  if (storage) baseFilter.storage = storage;
  if (brand) baseFilter.brand = new RegExp(brand, "i");
  if (search) baseFilter.$text = { $search: search };
  if (minPrice || maxPrice) {
    baseFilter.price = {};
    if (minPrice) baseFilter.price.$gte = Number(minPrice);
    if (maxPrice) baseFilter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  ////////////////////////////////////////////////////////////////////
  //// LOCATION QUERY
  //// $geoNear MUST be first stage — filters go inside its "query" field
  ////////////////////////////////////////////////////////////////////

  if (isLocationQuery) {
    const lng = Number(longitude);
    const lat = Number(latitude);
    const radiusM = Number(radius) * 1000; // km → meters

    const aggregatePipeline = [
      {
        // $geoNear is FIRST stage — no $match before it
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          maxDistance: radiusM,
          spherical: true,
          distanceMultiplier: 0.001, // meters → km
          query: baseFilter, // all filters go inside query
        },
      },
      { $sort: { distance: 1 } }, // nearest first
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: "users",
          localField: "listedBy",
          foreignField: "_id",
          as: "listedBy",
          pipeline: [
            { $project: { firstname: 1, lastname: 1, role: 1, address: 1 } },
          ],
        },
      },
      { $unwind: { path: "$listedBy", preserveNullAndEmptyArrays: true } },
    ];

    // Count uses $geoWithin — compatible with countDocuments
    const countFilter = {
      ...baseFilter,
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], Number(radius) / 6378.1],
        },
      },
    };

    const [products, total] = await Promise.all([
      Product.aggregate(aggregatePipeline),
      Product.countDocuments(countFilter),
    ]);

    return {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    };
  }

  ////////////////////////////////////////////////////////////////////
//// GET NEARBY PRODUCTS
//// Used for "Devices near you" section like Swiggy nearby
////////////////////////////////////////////////////////////////////

exports.getNearbyProducts = async ({
  latitude,
  longitude,
  radius    = 10,    // km — default 10km
  category,
  deviceType,
  limit     = 20,
  page      = 1,
}) => {
  const lng     = Number(longitude);
  const lat     = Number(latitude);
  const radiusM = Number(radius) * 1000;  // km → meters

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  // Base filter inside $geoNear query
  const baseFilter = { status: "available" };
  if (category)   baseFilter.category   = category;
  if (deviceType) baseFilter.deviceType = deviceType;

  const pipeline = [
    {
      $geoNear: {
        near:               { type: "Point", coordinates: [lng, lat] },
        distanceField:      "distance",      // adds distance field in meters
        maxDistance:        radiusM,
        spherical:          true,
        distanceMultiplier: 0.001,           // convert to km
        query:              baseFilter,
      },
    },
    { $sort: { distance: 1 } },            // nearest first
    { $skip: skip },
    { $limit: limitNum },
    {
      $lookup: {
        from:         "users",
        localField:   "listedBy",
        foreignField: "_id",
        as:           "listedBy",
        pipeline: [
          {
            $project: {
              firstname:      1,
              lastname:       1,
              role:           1,
              defaultAddress: 1,
            },
          },
        ],
      },
    },
    { $unwind: { path: "$listedBy", preserveNullAndEmptyArrays: true } },
    {
      // Only return fields needed for card display
      $project: {
        title:        1,
        brand:        1,
        category:     1,
        deviceType:   1,
        condition:    1,
        storage:      1,
        color:        1,
        price:        1,
        originalPrice: 1,
        images:       { $slice: ["$images", 1] },  // only first image
        rating:       1,
        status:       1,
        address:      1,
        listedBy:     1,
        distance:     1,   // km from user
        createdAt:    1,
      },
    },
  ];

  // Count for pagination — use $geoWithin for countDocuments
  const countFilter = {
    ...baseFilter,
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], Number(radius) / 6378.1],
      },
    },
  };

  const Product = require("../models/product.model");

  const [products, total] = await Promise.all([
    Product.aggregate(pipeline),
    Product.countDocuments(countFilter),
  ]);

  return {
    products,
    pagination: {
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext:    pageNum < Math.ceil(total / limitNum),
      hasPrev:    pageNum > 1,
    },
    meta: {
      userLocation: { latitude: lat, longitude: lng },
      radiusKm:     Number(radius),
    },
  };
};

  ////////////////////////////////////////////////////////////////////
  //// NORMAL QUERY
  ////////////////////////////////////////////////////////////////////

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
  };

  const sortObj = sortMap[sortBy] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(baseFilter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate("listedBy", "firstname lastname role address")
      .lean(),
    Product.countDocuments(baseFilter),
  ]);

  const result = {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    },
  };

  if (cacheKey) {
    await redisClient
      .setEx(cacheKey, PRODUCT_CACHE_TTL, JSON.stringify(result))
      .catch(() => null);
  }

  return result;
};

////////////////////////////////////////////////////////////////////
//// GET PRODUCT BY ID
////////////////////////////////////////////////////////////////////

exports.getProductById = async (id) => {
  const cached = await redisClient.get(PRODUCT_KEY(id)).catch(() => null);
  if (cached) return JSON.parse(cached);

  const product = await Product.findById(id)
    .populate("listedBy", "firstname lastname role address")
    .lean();

  if (!product) return null;

  await redisClient
    .setEx(PRODUCT_KEY(id), PRODUCT_CACHE_TTL, JSON.stringify(product))
    .catch(() => null);
  return product;
};

////////////////////////////////////////////////////////////////////
//// GET MY LISTINGS
////////////////////////////////////////////////////////////////////

exports.getMyProducts = async (userId, query) => {
  const { status, page = 1, limit = 20 } = query;
  const filter = { listedBy: userId };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    },
  };
};

////////////////////////////////////////////////////////////////////
//// UPDATE PRODUCT — owner only
////////////////////////////////////////////////////////////////////

exports.updateProduct = async (id, userId, data) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, listedBy: userId },
    { $set: data },
    { new: true, runValidators: true },
  ).lean();

  if (!product) return null;

  await Promise.all([
    redisClient.del(PRODUCT_KEY(id)).catch(() => null),
    invalidateListCache(),
  ]);

  return product;
};

////////////////////////////////////////////////////////////////////
//// DELETE PRODUCT — owner or admin
////////////////////////////////////////////////////////////////////

exports.deleteProduct = async (id, userId, userRole) => {
  const filter =
    userRole === "admin" ? { _id: id } : { _id: id, listedBy: userId };

  const product = await Product.findOneAndDelete(filter).lean();
  if (!product) return null;

  await Promise.all([
    redisClient.del(PRODUCT_KEY(id)).catch(() => null),
    invalidateListCache(),
  ]);

  return product;
};

////////////////////////////////////////////////////////////////////
//// MARK AS SOLD
////////////////////////////////////////////////////////////////////

exports.markAsSold = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: "sold" },
    { new: true },
  ).lean();

  await redisClient.del(PRODUCT_KEY(id)).catch(() => null);
  return product;
};

////////////////////////////////////////////////////////////////////
//// MARK AS RESERVED
//// Called when a buyer places an order (status: pending)
//// Prevents other buyers from ordering the same product
////////////////////////////////////////////////////////////////////

exports.markAsReserved = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: "reserved" },
    { new: true },
  ).lean();

  await redisClient.del(PRODUCT_KEY(id)).catch(() => null);
  return product;
};

////////////////////////////////////////////////////////////////////
//// MARK AS AVAILABLE
//// Called when an order is rejected or cancelled
//// Puts the product back on the market
////////////////////////////////////////////////////////////////////

exports.markAsAvailable = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: "available" },
    { new: true },
  ).lean();

  // Bust both the single product cache and all list caches
  await Promise.all([
    redisClient.del(PRODUCT_KEY(id)).catch(() => null),
    invalidateListCache(),
  ]);

  return product;
};

////////////////////////////////////////////////////////////////////
//// HIDE ALL PRODUCTS BY SELLER — used when seller is banned
////////////////////////////////////////////////////////////////////

exports.hideAllProductsBySeller = async (sellerId) => {
  const result = await Product.updateMany(
    { listedBy: sellerId, status: { $in: ["available", "reserved"] } },
    { $set: { status: "hidden" } },
  );

  await invalidateListCache();
  return result;
};

////////////////////////////////////////////////////////////////////
//// COUNT PRODUCTS BY MULTIPLE SELLERS — used in admin dashboard
////////////////////////////////////////////////////////////////////

exports.countProductsBySellers = async (sellerIds) => {
  return await Product.aggregate([
    { $match: { listedBy: { $in: sellerIds } } },
    { $group: { _id: "$listedBy", count: { $sum: 1 } } },
  ]);
};

////////////////////////////////////////////////////////////////////
//// UPDATE SPECS ONLY
////////////////////////////////////////////////////////////////////

exports.updateSpecs = async (id, specsUpdate) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { $set: specsUpdate }, // specsUpdate keys are like "specs.performance", "specs.display"
    { new: true, runValidators: true },
  ).lean();

  await Promise.all([
    redisClient.del(PRODUCT_KEY(id)).catch(() => null),
    invalidateListCache(),
  ]);

  return product;
};

////////////////////////////////////////////////////////////////////
//// COMPARE PRODUCTS
////////////////////////////////////////////////////////////////////

exports.compareProducts = async (ids) => {
  const products = await Product.find({ _id: { $in: ids } })
    .select(
      "title brand category subcategory deviceType condition storage color price originalPrice images rating status address listedByRole createdAt specs",
    )
    .lean();

  // Return in same order as requested IDs
  return ids.map(
    (id) => products.find((p) => p._id.toString() === id.toString()) || null,
  );
};

////////////////////////////////////////////////////////////////////
//// GET ALL PRODUCTS BY A SINGLE SELLER — used in admin detail view
////////////////////////////////////////////////////////////////////

exports.getProductsBySeller = async (sellerId) => {
  return await Product.find({ listedBy: sellerId })
    .sort({ createdAt: -1 })
    .lean();
};

////////////////////////////////////////////////////////////////////
//// HELPER
////////////////////////////////////////////////////////////////////

async function invalidateListCache() {
  try {
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) await redisClient.del(keys);
  } catch {}
}
