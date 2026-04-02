const mongoose    = require("mongoose");
const UserModel   = require("../models/user.model");
const Product     = require("../models/product.model");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── ADD TO WISHLIST ───────────────────────────────────────────────────────
// POST /api/wishlist/:productId

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check product exists and is available
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.status !== "available") {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    // Check if already in wishlist
    const user = await UserModel.findById(userId).select("wishlist").lean();
    const alreadyWishlisted = user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (alreadyWishlisted) {
      return res.status(409).json({ message: "Product already in wishlist" });
    }

    // Add to wishlist — $addToSet prevents duplicates at DB level too
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: productId },
    });

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("addToWishlist error:", error);
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
};


// ─── REMOVE FROM WISHLIST ──────────────────────────────────────────────────
// DELETE /api/wishlist/:productId

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    await UserModel.findByIdAndUpdate(userId, {
      $pull: { wishlist: productId },
    });

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("removeFromWishlist error:", error);
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};


// ─── GET WISHLIST ──────────────────────────────────────────────────────────
// GET /api/wishlist
// Returns full product details for all wishlisted products

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId)
      .select("wishlist")
      .populate({
        path:   "wishlist",
        select: "title brand category deviceType condition storage color price originalPrice images status address specs listedByRole createdAt",
        // Filter out deleted products automatically
        match:  { status: { $in: ["available", "sold", "reserved"] } },
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out any nulls (products that were deleted)
    const wishlist = user.wishlist.filter(Boolean);

    res.status(200).json({
      success: true,
      count:   wishlist.length,
      data:    wishlist,
    });
  } catch (error) {
    console.error("getWishlist error:", error);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};


// ─── CHECK IF PRODUCT IS WISHLISTED ───────────────────────────────────────
// GET /api/wishlist/:productId/check
// Used by frontend to show filled/outlined heart icon on product card

exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user._id;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const user = await UserModel.findById(userId).select("wishlist").lean();

    const isWishlisted = user.wishlist.some(
      (id) => id.toString() === productId
    );

    res.status(200).json({
      success:     true,
      isWishlisted,
    });
  } catch (error) {
    console.error("checkWishlist error:", error);
    res.status(500).json({ message: "Failed to check wishlist" });
  }
};


// ─── CLEAR ENTIRE WISHLIST ─────────────────────────────────────────────────
// DELETE /api/wishlist

exports.clearWishlist = async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate(req.user._id, {
      $set: { wishlist: [] },
    });

    res.status(200).json({
      success: true,
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error("clearWishlist error:", error);
    res.status(500).json({ message: "Failed to clear wishlist" });
  }
};