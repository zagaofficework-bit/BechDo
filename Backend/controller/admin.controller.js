const mongoose         = require("mongoose");
const ProductService   = require("../service/product.service");
const OrderModel       = require("../models/order.model");
const UserModel        = require("../models/user.model");
const SubscriptionModel = require("../models/subscription.model");
const emailService     = require("../service/email.service");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── DELETE ANY PRODUCT LISTING ───────────────────────────────────────────────

exports.adminDeleteProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await ProductService.deleteProduct(
      req.params.id,
      req.user._id,
      "admin",
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product listing removed by admin",
    });
  } catch (error) {
    console.error("adminDeleteProduct error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// ─── GET ALL ORDERS + COMMISSION SUMMARY ──────────────────────────────────────

exports.getAllOrders = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type)   filter.transactionType = type;
    if (status) filter.status          = status;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [orders, total, commissionData] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("product", "title price")
        .populate("buyer",   "firstname lastname role")
        .populate("seller",  "firstname lastname role")
        .lean(),

      OrderModel.countDocuments(filter),

      OrderModel.aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id:            null,
            totalCommission:  { $sum: "$commissionAmount" },
            totalOrders:      { $sum: 1 },
            totalSaleValue:   { $sum: "$salePrice" },
          },
        },
      ]),
    ]);

    const commission = commissionData[0] || {
      totalCommission: 0,
      totalOrders:     0,
      totalSaleValue:  0,
    };

    res.status(200).json({
      success: true,
      orders,
      commissionSummary: {
        totalCommissionEarned: commission.totalCommission,
        totalCompletedOrders:  commission.totalOrders,
        totalPlatformSales:    commission.totalSaleValue,
      },
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum < Math.ceil(total / limitNum),
        hasPrev:    pageNum > 1,
      },
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ─── PAUSE SELLER SUBSCRIPTION ────────────────────────────────────────────────
// POST /admin/sellers/:sellerId/pause
// body: { reason }

exports.pauseSellerSubscription = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "A reason is required to pause a subscription" });
    }

    const seller = await UserModel.findById(sellerId)
      .select("role firstname lastname email")
      .lean();

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.role !== "seller") {
      return res.status(400).json({ message: "This user is not a seller" });
    }

    const subscription = await SubscriptionModel.findOne({
      seller:   sellerId,
      isActive: true,
      endDate:  { $gte: new Date() },
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found for this seller" });
    }

    const pausedAt = new Date();

    subscription.status      = "paused";
    subscription.pausedAt    = pausedAt;
    subscription.pausedBy    = req.user._id;
    subscription.pauseReason = reason.trim();
    await subscription.save();

    await UserModel.findByIdAndUpdate(sellerId, {
      accountStatus:    "suspended",
      suspendedAt:      pausedAt,
      suspendedBy:      req.user._id,
      suspensionReason: reason.trim(),
    });

    // ── Email: notify seller their account is suspended ────────────────────
    emailService.sendSellerPausedEmail(seller.email, {
      firstname: seller.firstname,
      lastname:  seller.lastname,
      reason:    reason.trim(),
      pausedAt,
    }).catch((err) => console.error("sendSellerPausedEmail error:", err));

    res.status(200).json({
      success: true,
      message: `Subscription paused for seller ${seller.firstname} ${seller.lastname}`,
      data: {
        sellerId,
        sellerName:     `${seller.firstname} ${seller.lastname}`,
        email:          seller.email,
        subscriptionId: subscription._id,
        status:         "paused",
        pausedAt,
        reason:         reason.trim(),
      },
    });
  } catch (error) {
    console.error("pauseSellerSubscription error:", error);
    res.status(500).json({ message: "Failed to pause subscription" });
  }
};

// ─── BAN SELLER SUBSCRIPTION ──────────────────────────────────────────────────
// POST /admin/sellers/:sellerId/ban
// body: { reason }

exports.banSellerSubscription = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "A reason is required to ban a seller" });
    }

    const seller = await UserModel.findById(sellerId)
      .select("role firstname lastname email")
      .lean();

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.role !== "seller") {
      return res.status(400).json({ message: "This user is not a seller" });
    }

    const bannedAt = new Date();

    const subscriptionResult = await SubscriptionModel.updateMany(
      { seller: sellerId, isActive: true },
      {
        $set: {
          status:    "banned",
          bannedAt,
          bannedBy:  req.user._id,
          banReason: reason.trim(),
        },
      },
    );

    await UserModel.findByIdAndUpdate(sellerId, {
      accountStatus: "banned",
      bannedAt,
      bannedBy:      req.user._id,
      banReason:     reason.trim(),
    });

    const { modifiedCount: hiddenProducts } =
      await ProductService.hideAllProductsBySeller(sellerId);

    // ── Email: notify seller they have been permanently banned ─────────────
    emailService.sendSellerBannedEmail(seller.email, {
      firstname: seller.firstname,
      lastname:  seller.lastname,
      reason:    reason.trim(),
      bannedAt,
    }).catch((err) => console.error("sendSellerBannedEmail error:", err));

    res.status(200).json({
      success: true,
      message: `Seller ${seller.firstname} ${seller.lastname} has been permanently banned`,
      data: {
        sellerId,
        sellerName:             `${seller.firstname} ${seller.lastname}`,
        email:                  seller.email,
        subscriptionsCancelled: subscriptionResult.modifiedCount,
        productsHidden:         hiddenProducts,
        bannedAt,
        reason:                 reason.trim(),
      },
    });
  } catch (error) {
    console.error("banSellerSubscription error:", error);
    res.status(500).json({ message: "Failed to ban seller" });
  }
};

// ─── REINSTATE SELLER ─────────────────────────────────────────────────────────
// POST /admin/sellers/:sellerId/reinstate
// body: { note } (optional)

exports.reinstateSellerSubscription = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { note } = req.body;

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const seller = await UserModel.findById(sellerId)
      .select("role firstname lastname email accountStatus")
      .lean();

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.accountStatus === "banned") {
      return res.status(403).json({
        message: "Banned sellers cannot be reinstated. Create a new account if required.",
      });
    }

    if (seller.accountStatus !== "suspended") {
      return res.status(400).json({ message: "Seller is not currently suspended" });
    }

    const reinstatedAt = new Date();

    const subscription = await SubscriptionModel.updateMany(
      { seller: sellerId, isActive: false },
      {
        $set: {
          status:            "active",
          reinstatedAt,
          reinstatedBy:      req.user._id,
          reinstatementNote: note?.trim() || null,
        },
        $unset: {
          pausedAt:    "",
          pausedBy:    "",
          pauseReason: "",
        },
      },
      { new: true },
    );

    if (!subscription) {
      return res.status(404).json({ message: "No paused subscription found to reinstate" });
    }

    await UserModel.findByIdAndUpdate(sellerId, {
      accountStatus: "active",
      $unset: {
        suspendedAt:      "",
        suspendedBy:      "",
        suspensionReason: "",
      },
    });

    // ── Email: notify seller their account has been reinstated ─────────────
    emailService.sendSellerReinstatedEmail(seller.email, {
      firstname:    seller.firstname,
      lastname:     seller.lastname,
      note:         note?.trim() || null,
      reinstatedAt,
    }).catch((err) => console.error("sendSellerReinstatedEmail error:", err));

    res.status(200).json({
      success: true,
      message: `Seller ${seller.firstname} ${seller.lastname} has been reinstated`,
      data: {
        sellerId,
        sellerName:     `${seller.firstname} ${seller.lastname}`,
        subscriptionId: subscription._id,
        status:         "active",
        reinstatedAt,
        note:           note?.trim() || null,
      },
    });
  } catch (error) {
    console.error("reinstateSellerSubscription error:", error);
    res.status(500).json({ message: "Failed to reinstate seller" });
  }
};

// ─── GET ALL SUBSCRIBED SELLERS ───────────────────────────────────────────────
// GET /admin/subscriptions
// query: { subscriptionStatus, accountStatus, plan, page, limit }

exports.getSubscribedSellers = async (req, res) => {
  try {
    const {
      subscriptionStatus,
      accountStatus,
      plan,
      page  = 1,
      limit = 20,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const subFilter = {};

    if (subscriptionStatus === "active") {
      subFilter.isActive = true;
      subFilter.endDate  = { $gte: new Date() };
    } else if (subscriptionStatus === "expired") {
      subFilter.isActive = true;
      subFilter.endDate  = { $lt: new Date() };
    } else if (subscriptionStatus === "revoked") {
      subFilter.isActive = false;
    }

    if (plan) subFilter.plan = plan;

    const populateMatch = {};
    if (accountStatus) populateMatch.accountStatus = accountStatus;

    const [subscriptions, total] = await Promise.all([
      SubscriptionModel.find(subFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path:   "seller",
          select: "firstname lastname email mobile profilePic accountStatus suspendedAt suspensionReason bannedAt banReason createdAt role",
          match:  populateMatch,
        })
        .lean({ virtuals: true }),
      SubscriptionModel.countDocuments(subFilter),
    ]);

    const filtered = subscriptions.filter((s) => s.seller !== null);

    const sellerIds    = filtered.map((s) => s.seller._id);
    const productCounts = await ProductService.countProductsBySellers(sellerIds);

    const productCountMap = {};
    productCounts.forEach(({ _id, count }) => {
      productCountMap[_id.toString()] = count;
    });

    const sellers = filtered.map((sub) => ({
      subscriptionId: sub._id,

      seller: {
        id:            sub.seller._id,
        name:          `${sub.seller.firstname} ${sub.seller.lastname ?? ""}`.trim(),
        email:         sub.seller.email,
        mobile:        sub.seller.mobile,
        profilePic:    sub.seller.profilePic,
        role:          sub.seller.role,
        joinedAt:      sub.seller.createdAt,
        accountStatus: sub.seller.accountStatus,

        ...(sub.seller.accountStatus === "suspended" && {
          suspendedAt:      sub.seller.suspendedAt,
          suspensionReason: sub.seller.suspensionReason,
        }),
        ...(sub.seller.accountStatus === "banned" && {
          bannedAt:  sub.seller.bannedAt,
          banReason: sub.seller.banReason,
        }),
      },

      subscription: {
        plan:                sub.plan,
        price:               sub.price,
        isActive:            sub.isActive,
        subscriptionStatus:  sub.subscriptionStatus,
        daysRemaining:       sub.daysRemaining,
        startDate:           sub.startDate,
        endDate:             sub.endDate,
        paymentMethod:       sub.paymentMethod,
        activeListingsLimit: sub.activeListingsLimit,
        prioritySupport:     sub.prioritySupport,
        supportType:         sub.supportType,
      },

      productsListed: productCountMap[sub.seller._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      sellers,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum < Math.ceil(total / limitNum),
        hasPrev:    pageNum > 1,
      },
    });
  } catch (error) {
    console.error("getSubscribedSellers error:", error);
    res.status(500).json({ message: "Failed to fetch subscribed sellers" });
  }
};

// ─── GET SINGLE SELLER SUBSCRIPTION DETAIL ────────────────────────────────────
// GET /admin/subscriptions/:sellerId

exports.getSellerSubscriptionDetail = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const [seller, subscription, products] = await Promise.all([
      UserModel.findById(sellerId)
        .select("firstname lastname email phone accountStatus createdAt suspensionReason banReason")
        .lean(),

      SubscriptionModel.findOne({ seller: sellerId })
        .sort({ createdAt: -1 })
        .lean(),

      ProductService.getProductsBySeller(sellerId),
    ]);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        seller: {
          id:            seller._id,
          name:          `${seller.firstname} ${seller.lastname}`.trim(),
          email:         seller.email,
          phone:         seller.phone,
          accountStatus: seller.accountStatus || "active",
          joinedAt:      seller.createdAt,
          ...(seller.suspensionReason && { suspensionReason: seller.suspensionReason }),
          ...(seller.banReason        && { banReason:        seller.banReason }),
        },
        subscription: subscription
          ? {
              id:          subscription._id,
              plan:        subscription.planName,
              status:      subscription.status,
              startDate:   subscription.startDate,
              endDate:     subscription.endDate,
              amount:      subscription.amount,
              autoRenew:   subscription.autoRenew ?? false,
              ...(subscription.pausedAt && {
                pausedAt:    subscription.pausedAt,
                pauseReason: subscription.pauseReason,
              }),
              ...(subscription.bannedAt && {
                bannedAt:  subscription.bannedAt,
                banReason: subscription.banReason,
              }),
            }
          : null,
        productsListed: products.length,
        products,
      },
    });
  } catch (error) {
    console.error("getSellerSubscriptionDetail error:", error);
    res.status(500).json({ message: "Failed to fetch seller details" });
  }
};