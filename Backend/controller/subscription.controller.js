const SubscriptionModel = require("../models/subscription.model");
const userModel         = require("../models/user.model");
const emailService      = require("../service/email.service");

const PLANS = SubscriptionModel.PLANS;


// GET ALL PLANS — public
exports.getPlans = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      plans: [
        {
          key:             "basic",
          name:            "Basic",
          price:           2999,
          duration:        "yearly",
          activeListings:  "Up to 20",
          prioritySupport: "No",
          commission:      "1 - 1.5%",
        },
        {
          key:             "standard",
          name:            "Standard",
          price:           5999,
          duration:        "yearly",
          activeListings:  "Up to 100",
          prioritySupport: "Email support",
          commission:      "1 - 1.5%",
        },
        {
          key:             "premium",
          name:            "Premium",
          price:           11999,
          duration:        "yearly",
          activeListings:  "Unlimited",
          prioritySupport: "Chat + Call",
          commission:      "1 - 1.5%",
        },
      ],
    });
  } catch (error) {
    console.error("getPlans error:", error);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
};


// SUBSCRIBE — any user can subscribe and auto-become a seller
exports.subscribe = async (req, res) => {
  try {
    const { plan, paymentMethod, paymentId } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        message: "Invalid plan. Choose from: basic, standard, premium",
      });
    }

    const existing = await SubscriptionModel.findOne({
      seller:   req.user._id,
      isActive: true,
      endDate:  { $gte: new Date() },
    }).lean();

    if (existing) {
      return res.status(400).json({
        message: `You already have an active ${existing.plan} plan valid until ${new Date(existing.endDate).toDateString()}. Upgrade instead`,
        code:    "ALREADY_SUBSCRIBED",
      });
    }

    const selectedPlan = PLANS[plan];

    const startDate = new Date();
    const endDate   = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = await SubscriptionModel.create({
      seller:              req.user._id,
      plan,
      price:               selectedPlan.price,
      activeListingsLimit: selectedPlan.activeListings,
      prioritySupport:     selectedPlan.prioritySupport,
      supportType:         selectedPlan.supportType,
      startDate,
      endDate,
      isActive:      true,
      paymentMethod: paymentMethod || null,
      paymentId:     paymentId     || null,
    });

    await userModel.findByIdAndUpdate(req.user._id, {
      role:         "seller",
      subscription: subscription._id,
    });

    // ── Email: welcome as seller ───────────────────────────────────────────
    emailService.sendSubscriptionPurchasedEmail(req.user.email, {
      firstname:           req.user.firstname,
      plan,
      price:               selectedPlan.price,
      startDate,
      endDate,
      activeListingsLimit: selectedPlan.activeListings,
    }).catch((err) => console.error("sendSubscriptionPurchasedEmail error:", err));

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to the ${selectedPlan.name} plan. Your account has been upgraded to Seller!`,
      data:    subscription,
    });
  } catch (error) {
    console.error("subscribe error:", error);
    res.status(500).json({ message: "Subscription failed. Please try again" });
  }
};


// GET MY SUBSCRIPTION — logged in user/seller
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await SubscriptionModel.findOne({
      seller: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      return res.status(404).json({
        message: "No subscription found. Subscribe to a plan to become a seller",
      });
    }

    const now           = new Date();
    const isExpired     = new Date(subscription.endDate) < now;
    const daysRemaining = isExpired
      ? 0
      : Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      success: true,
      data: {
        ...subscription,
        isExpired,
        daysRemaining,
      },
    });
  } catch (error) {
    console.error("getMySubscription error:", error);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
};


// UPGRADE PLAN — seller upgrades to higher plan
exports.upgradePlan = async (req, res) => {
  try {
    const { plan, paymentMethod, paymentId } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({
        message: "Invalid plan. Choose from: basic, standard, premium",
      });
    }

    const current = await SubscriptionModel.findOne({
      seller:   req.user._id,
      isActive: true,
      endDate:  { $gte: new Date() },
    }).lean();

    const planOrder = { basic: 1, standard: 2, premium: 3 };
    if (current && planOrder[plan] <= planOrder[current.plan]) {
      return res.status(400).json({
        message: `You are already on the ${current.plan} plan. You can only upgrade to a higher plan`,
      });
    }

    await SubscriptionModel.updateMany(
      { seller: req.user._id, isActive: true },
      { isActive: false }
    );

    const selectedPlan = PLANS[plan];
    const startDate    = new Date();
    const endDate      = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = await SubscriptionModel.create({
      seller:              req.user._id,
      plan,
      price:               selectedPlan.price,
      activeListingsLimit: selectedPlan.activeListings,
      prioritySupport:     selectedPlan.prioritySupport,
      supportType:         selectedPlan.supportType,
      startDate,
      endDate,
      isActive:      true,
      paymentMethod: paymentMethod || null,
      paymentId:     paymentId     || null,
    });

    await userModel.findByIdAndUpdate(req.user._id, {
      subscription: subscription._id,
    });

    // ── Email: plan upgraded ───────────────────────────────────────────────
    emailService.sendSubscriptionUpgradedEmail(req.user.email, {
      firstname: req.user.firstname,
      oldPlan:   current?.plan || "none",
      newPlan:   plan,
      price:     selectedPlan.price,
      endDate,
    }).catch((err) => console.error("sendSubscriptionUpgradedEmail error:", err));

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to the ${selectedPlan.name} plan`,
      data:    subscription,
    });
  } catch (error) {
    console.error("upgradePlan error:", error);
    res.status(500).json({ message: "Plan upgrade failed. Please try again" });
  }
};


// ADMIN — GET ALL SUBSCRIPTIONS
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { plan, isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (plan)                   filter.plan     = plan;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [subscriptions, total] = await Promise.all([
      SubscriptionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("seller", "firstname lastname email mobile role")
        .lean(),
      SubscriptionModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      subscriptions,
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
    console.error("getAllSubscriptions error:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
};


// ADMIN — REVOKE SUBSCRIPTION (downgrade seller back to user)
exports.revokeSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    await SubscriptionModel.updateMany(
      { seller: userId },
      { isActive: false }
    );

    const user = await userModel.findByIdAndUpdate(
      userId,
      { role: "user", subscription: null },
      { new: true }
    ).lean();

    // ── Email: inform seller their subscription was revoked ────────────────
    if (user?.email) {
      emailService.sendSubscriptionRevokedEmail(user.email, {
        firstname: user.firstname,
      }).catch((err) => console.error("sendSubscriptionRevokedEmail error:", err));
    }

    res.status(200).json({
      success: true,
      message: "Subscription revoked. User role reverted to user",
    });
  } catch (error) {
    console.error("revokeSubscription error:", error);
    res.status(500).json({ message: "Failed to revoke subscription" });
  }
};