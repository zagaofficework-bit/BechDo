const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const redisClient = require("../config/redis.client");

const BLACKLIST_KEY = (token) => `blacklist:${token}`;

// AUTHENTICATE
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    const isBlacklisted = await redisClient.get(BLACKLIST_KEY(token));
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Token has been invalidated. Please login again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded.userId)
      .select("-refreshToken")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Your account has been deactivated" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access token expired. Please refresh your token",
        code: "TOKEN_EXPIRED",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid access token",
        code: "TOKEN_INVALID",
      });
    }
    console.error("authMiddleware error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during authentication" });
  }
}

// AUTHORIZE — Role-Based Access Control
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Please login first" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

// BLOCK ADMIN — prevents admin from buy/sell/list actions
function blockAdmin(req, res, next) {
  if (req.user?.role === "admin") {
    return res.status(403).json({
      message:
        "Admins cannot buy, sell, or list products. Admin role is for platform management only",
      code: "ADMIN_ACTION_NOT_ALLOWED",
    });
  }
  next();
}

// SELLER SUBSCRIPTION CHECK
async function requireActiveSubscription(req, res, next) {
  try {
    if (req.user.role !== "seller") return next();

    const SubscriptionModel = require("../models/subscription.model");

    const subscription = await SubscriptionModel.findOne({
      seller: req.user._id,
      isActive: true,
      endDate: { $gte: new Date() },
    }).lean();

    if (!subscription) {
      return res.status(403).json({
        message:
          "Active subscription required. Please subscribe to a plan to list products",
        code: "NO_ACTIVE_SUBSCRIPTION",
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("requireActiveSubscription error:", error);
    res.status(500).json({ message: "Subscription check failed" });
  }
}

// LISTING LIMIT CHECK
async function checkListingLimit(req, res, next) {
  try {
    const role = req.user.role;
    const ProductModel = require("../models/product.model");

    if (role === "user") {
      const USER_LIMIT = 5;

      const activeCount = await ProductModel.countDocuments({
        listedBy: req.user._id,
        status: "available",
      });

      if (activeCount >= USER_LIMIT) {
        return res.status(403).json({
          message: `Listing limit reached. Users can only have ${USER_LIMIT} active listings at a time`,
          code: "LISTING_LIMIT_REACHED",
        });
      }

      return next();
    }

    if (role === "seller") {
      const subscription = req.subscription;

      // Premium plan — unlimited listings
      if (subscription.activeListingsLimit === -1) return next();

      const activeCount = await ProductModel.countDocuments({
        listedBy: req.user._id,
        status: "available",
      });

      if (activeCount >= subscription.activeListingsLimit) {
        return res.status(403).json({
          message: `Listing limit reached. Your ${subscription.plan} plan allows up to ${subscription.activeListingsLimit} active listings. Upgrade your plan to list more`,
          code: "LISTING_LIMIT_REACHED",
          currentCount: activeCount,
          limit: subscription.activeListingsLimit,
          plan: subscription.plan,
        });
      }

      return next();
    }
    next();
  } catch (error) {
    console.error("checkListingLimit error:", error);
    res.status(500).json({ message: "Listing limit check failed" });
  }
}

// DEVICE TYPE PERMISSION CHECK
// user   → old devices only
// seller → new, refurbished, old
function checkDeviceTypePermission(req, res, next) {
  const { deviceType } = req.body;
  const role = req.user.role;

  if (role === "user" && deviceType !== "old") {
    return res.status(403).json({
      message:
        "Users can only list old/used devices. Upgrade to seller to list new or refurbished devices",
      code: "DEVICE_TYPE_NOT_ALLOWED",
    });
  }

  next();
}

// ACCOUNT STATUS CHECK — blocks suspended or banned sellers
function checkAccountStatus(req, res, next) {
  const { accountStatus, suspensionReason, banReason } = req.user;

  if (accountStatus === "suspended") {
    return res.status(403).json({
      message:
        "Your account has been temporarily suspended. You cannot create or manage listings until your subscription is reinstated by an admin.",
      code: "ACCOUNT_SUSPENDED",
      reason: suspensionReason || null,
    });
  }

  if (accountStatus === "banned") {
    return res.status(403).json({
      message:
        "Your account has been permanently banned. Please contact support if you believe this is a mistake.",
      code: "ACCOUNT_BANNED",
      reason: banReason || null,
    });
  }

  next();
}

// OPTIONAL AUTH
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];

    const isBlacklisted = await redisClient.get(BLACKLIST_KEY(token));
    if (isBlacklisted) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel
      .findById(decoded.userId)
      .select("-refreshToken")
      .lean();

    if (user) {
      req.user = user;
      req.token = token;
    }
    next();
  } catch {
    next();
  }
}

// EXPORT
module.exports = {
  authMiddleware,
  authorize,
  blockAdmin,
  requireActiveSubscription,
  checkListingLimit,
  checkDeviceTypePermission,
  checkAccountStatus,
  optionalAuthenticate,
};
