const mongoose  = require("mongoose");
const UserModel = require("../models/user.model");
const Product   = require("../models/product.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── ADD TO CART ───────────────────────────────────────────────────────────
// POST /api/cart/:productId

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.status !== "available") {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    if (product.listedBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot add your own product to cart" });
    }

    if (product.listedByRole !== "seller") {
      return res.status(403).json({
        message: "Users can only purchase products listed by sellers",
      });
    }

    const user = await UserModel.findById(userId).select("cart").lean();

    // ✅ Fix — cart may not exist on old documents
    const cart          = user?.cart || [];
    const alreadyInCart = cart.some(
      (item) => item.product.toString() === productId
    );

    if (alreadyInCart) {
      return res.status(409).json({ message: "Product already in cart" });
    }

    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: {
        cart: { product: productId, addedAt: new Date() },
      },
    });

    res.status(200).json({
      success: true,
      message: "Product added to cart",
    });
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

// ─── GET CART ──────────────────────────────────────────────────────────────
// GET /api/cart
// Returns full product details for all cart items

exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId)
      .select("cart")
      .populate({
        path:   "cart.product",
        select: "title brand category deviceType condition storage color price originalPrice images status address specs listedByRole createdAt",
        match:  { status: "available" },  // only show still-available products
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out items whose product was deleted or is no longer available
    const cartItems = user.cart
      .filter((item) => item.product !== null)
      .map((item) => ({
        product: item.product,
        addedAt: item.addedAt,
      }));

    // Calculate cart total
    const total = cartItems.reduce(
      (sum, item) => sum + (item.product?.price || 0),
      0
    );

    res.status(200).json({
      success: true,
      count:   cartItems.length,
      total,
      data:    cartItems,
    });
  } catch (error) {
    console.error("getCart error:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};


// ─── REMOVE FROM CART ──────────────────────────────────────────────────────
// DELETE /api/cart/:productId

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    await UserModel.findByIdAndUpdate(userId, {
      $pull: { cart: { product: productId } },
    });

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error("removeFromCart error:", error);
    res.status(500).json({ message: "Failed to remove from cart" });
  }
};


// ─── CLEAR CART ────────────────────────────────────────────────────────────
// DELETE /api/cart

exports.clearCart = async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate(req.user._id, {
      $set: { cart: [] },
    });

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("clearCart error:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};


// ─── CHECK IF PRODUCT IS IN CART ───────────────────────────────────────────
// GET /api/cart/:productId/check

exports.checkCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const user = await UserModel.findById(userId).select("cart").lean();
    const cart     = user?.cart || [];   
    const isInCart = user.cart.some(
      (item) => item.product.toString() === productId
    );

    res.status(200).json({
      success: true,
      isInCart,
    });
  } catch (error) {
    console.error("checkCart error:", error);
    res.status(500).json({ message: "Failed to check cart" });
  }
};


// ─── CHECKOUT FROM CART ────────────────────────────────────────────────────
// POST /api/cart/:productId/checkout
// Moves a single cart item into an order (calls the same buy flow)
// User picks paymentMethod at checkout time

exports.checkoutFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { paymentMethod } = req.body;
    const VALID_METHODS = ["Cash", "UPI", "Card", "NetBanking"];

    if (!paymentMethod) {
      return res.status(400).json({
        message:        "Payment method is required",
        allowedMethods: VALID_METHODS,
      });
    }

    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message:        `Invalid payment method. Allowed: ${VALID_METHODS.join(", ")}`,
        allowedMethods: VALID_METHODS,
      });
    }

    // Check product is still in cart
    const user = await UserModel.findById(userId).select("cart").lean();
    const cart     = user?.cart || [];      
    const inCart = user.cart.some(
      (item) => item.product.toString() === productId
    );

    if (!inCart) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Check product is still available
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.status !== "available") {
      // Auto-remove from cart since it's no longer available
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { cart: { product: productId } },
      });
      return res.status(400).json({
        message: "Product is no longer available and has been removed from your cart",
      });
    }

    // Forward to buySell controller logic by making internal call
    // Attach productId to params and paymentMethod to body then call buyProduct
    req.params.id = productId;

    // Remove from cart after successful order placement
    // This is done AFTER order is confirmed — handled in next step
    // We just proxy to the buy flow here
    const OrderModel       = require("../models/order.model");
    const ProductService   = require("../service/product.service");
    const COMMISSION_RATES = OrderModel.COMMISSION_RATES;

    function calculateCommission(price, role) {
      const rates  = COMMISSION_RATES[role];
      const rate   = (rates.min + rates.max) / 2;
      const amount = parseFloat(((price * rate) / 100).toFixed(2));
      return { rate, amount };
    }

    if (product.listedBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot buy your own product" });
    }

    const buyerRole  = req.user.role;  // "user"
    const sellerRole = product.listedByRole;

    if (buyerRole === "user" && sellerRole !== "seller") {
      return res.status(403).json({
        message: "Users can only purchase products listed by sellers",
      });
    }

    const { rate, amount } = calculateCommission(product.price, buyerRole);
    const sellerEarnings   = parseFloat((product.price - amount).toFixed(2));

    const order = await OrderModel.create({
      buyer:            userId,
      buyerRole,
      seller:           product.listedBy,
      sellerRole,
      product:          product._id,
      transactionType:  "buy",
      salePrice:        product.price,
      commissionRate:   rate,
      commissionAmount: amount,
      sellerEarnings,
      paymentMethod,
      paymentStatus:    "completed",
      paidAt:           new Date(),
      status:           "pending",
    });

    // Reserve product
    await ProductService.markAsReserved(product._id);

    // Remove from cart after order placed
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { cart: { product: productId } },
    });

    res.status(201).json({
      success: true,
      message: "Order placed from cart. Waiting for seller to confirm.",
      data: {
        orderId:       order._id,
        status:        "pending",
        paymentStatus: "completed",
        paymentMethod,
        paidAt:        order.paidAt,
        product: {
          id:    product._id,
          title: product.title,
          price: product.price,
        },
        breakdown: {
          productPrice:     product.price,
          commissionRate:   `${rate}%`,
          commissionAmount: amount,
          totalPaid:        product.price,
          sellerReceives:   sellerEarnings,
        },
      },
    });
  } catch (error) {
    console.error("checkoutFromCart error:", error);
    res.status(500).json({ message: "Failed to checkout. Please try again" });
  }
};

// ─── CHECKOUT ALL ITEMS FROM CART ─────────────────────────────────────────
// POST /api/cart/checkout
// body: { paymentMethod: "Cash" | "UPI" | "Card" | "NetBanking" }
// Checks out ALL products currently in cart — no need to send productIds

exports.checkoutMultiple = async (req, res) => {
  try {
    const userId        = req.user._id;
    const { paymentMethod } = req.body;

    // ── Validate payment method ─────────────────────────────────────────────
    const VALID_METHODS = ["Cash", "UPI", "Card", "NetBanking"];

    if (!paymentMethod) {
      return res.status(400).json({
        message:        "Payment method is required",
        allowedMethods: VALID_METHODS,
      });
    }

    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message:        `Invalid payment method. Allowed: ${VALID_METHODS.join(", ")}`,
        allowedMethods: VALID_METHODS,
      });
    }

    // ── Fetch cart ──────────────────────────────────────────────────────────
    const user = await UserModel.findById(userId).select("cart").lean();
    const cart = user?.cart || [];

    if (cart.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const productIds = cart.map((item) => item.product.toString());

    // ── Fetch all products in parallel ──────────────────────────────────────
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    // ── Validate each product ───────────────────────────────────────────────
    const unavailable = [];
    const ownProducts = [];
    const invalidRole = [];

    for (const product of products) {
      if (product.status !== "available") {
        unavailable.push(product._id.toString());
      }
      if (product.listedBy.toString() === userId.toString()) {
        ownProducts.push(product._id.toString());
      }
      if (product.listedByRole !== "seller") {
        invalidRole.push(product._id.toString());
      }
    }

    // Auto remove unavailable products from cart silently
    if (unavailable.length > 0) {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { cart: { product: { $in: unavailable } } },
      });
    }

    // If ALL products are invalid — stop here
    const validProducts = products.filter(
      (p) =>
        p.status === "available" &&
        p.listedBy.toString() !== userId.toString() &&
        p.listedByRole === "seller"
    );

    if (validProducts.length === 0) {
      return res.status(400).json({
        message: "No valid products to checkout",
        errors: {
          ...(unavailable.length > 0 && {
            unavailable: {
              ids:     unavailable,
              message: "No longer available — removed from cart",
            },
          }),
          ...(ownProducts.length > 0 && {
            ownProducts: {
              ids:     ownProducts,
              message: "You cannot buy your own products",
            },
          }),
          ...(invalidRole.length > 0 && {
            invalidRole: {
              ids:     invalidRole,
              message: "Users can only purchase products listed by sellers",
            },
          }),
        },
      });
    }

    // ── Place orders for all valid products ─────────────────────────────────
    const OrderModel       = require("../models/order.model");
    const ProductService   = require("../service/product.service");
    const COMMISSION_RATES = OrderModel.COMMISSION_RATES;

    function calculateCommission(price, role) {
      const rates  = COMMISSION_RATES[role];
      const rate   = (rates.min + rates.max) / 2;
      const amount = parseFloat(((price * rate) / 100).toFixed(2));
      return { rate, amount };
    }

    const buyerRole = req.user.role;
    const now       = new Date();

    const orderResults = await Promise.all(
      validProducts.map(async (product) => {
        const { rate, amount } = calculateCommission(product.price, buyerRole);
        const sellerEarnings   = parseFloat((product.price - amount).toFixed(2));

        const order = await OrderModel.create({
          buyer:            userId,
          buyerRole,
          seller:           product.listedBy,
          sellerRole:       product.listedByRole,
          product:          product._id,
          transactionType:  "buy",
          salePrice:        product.price,
          commissionRate:   rate,
          commissionAmount: amount,
          sellerEarnings,
          paymentMethod,
          paymentStatus:    "completed",
          paidAt:           now,
          status:           "pending",
        });

        await ProductService.markAsReserved(product._id);

        return {
          orderId:       order._id,
          status:        "pending",
          paymentStatus: "completed",
          product: {
            id:    product._id,
            title: product.title,
            price: product.price,
          },
          breakdown: {
            productPrice:     product.price,
            commissionRate:   `${rate}%`,
            commissionAmount: amount,
            totalPaid:        product.price,
            sellerReceives:   sellerEarnings,
          },
        };
      })
    );

    // ── Remove successfully ordered items from cart ──────────────────────────
    const orderedProductIds = validProducts.map((p) => p._id.toString());
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { cart: { product: { $in: orderedProductIds } } },
    });

    const grandTotal = validProducts.reduce((sum, p) => sum + p.price, 0);

    // ── Build response — include skipped products info if any ────────────────
    const skipped = [...ownProducts, ...invalidRole];

    res.status(201).json({
      success:    true,
      message:    `${orderResults.length} order(s) placed successfully. Waiting for sellers to confirm.`,
      count:      orderResults.length,
      grandTotal,
      orders:     orderResults,

      // Only included if some products were skipped
      ...(unavailable.length > 0 && {
        removedFromCart: {
          ids:     unavailable,
          message: "These products were no longer available and removed from your cart",
        },
      }),
      ...(skipped.length > 0 && {
        skipped: {
          ids:     skipped,
          message: "These products were skipped — still in your cart",
        },
      }),
    });
  } catch (error) {
    console.error("checkoutMultiple error:", error);
    res.status(500).json({ message: "Failed to checkout. Please try again" });
  }
};