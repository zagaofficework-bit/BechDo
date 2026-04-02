const UserModel          = require("../models/user.model");
const Address            = require("../models/address.model");
const PaymentMethod      = require("../models/paymentMethod.model");
const uploadToCloudinary = require("../helper/cloudinaryUpload");

////////////////////////////////////////////////////////////////////
//// SECTION 1 — PROFILE INFO
////////////////////////////////////////////////////////////////////

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
// GET /api/profile
// Returns full profile: user info + addresses + payment methods

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, addresses, paymentMethods] = await Promise.all([
      UserModel
        .findById(userId)
        .select("-refreshToken -suspendedBy -bannedBy -__v")
        .lean(),
      Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean(),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      data: {
        ...user,
        addresses,
        paymentMethods,
      },
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};


// ─── UPDATE PROFILE INFO ──────────────────────────────────────────────────────
// PUT /api/profile
// Updatable: firstname, lastname, email, mobile
// email/mobile uniqueness is enforced by the model index

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstname, lastname, email, mobile } = req.body;

    // Only pick allowed fields — never let users update role, status, etc.
    const updates = {};
    if (firstname) updates.firstname = firstname.trim();
    if (lastname  !== undefined) updates.lastname = lastname?.trim() || "";
    if (email)    updates.email    = email.trim().toLowerCase();
    if (mobile)   updates.mobile   = mobile.trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    // Check email uniqueness manually for a better error message
    if (updates.email) {
      const emailTaken = await UserModel.findOne({ email: updates.email, _id: { $ne: userId } });
      if (emailTaken) {
        return res.status(409).json({ message: "Email is already in use by another account" });
      }
    }

    // Check mobile uniqueness
    if (updates.mobile) {
      const mobileTaken = await UserModel.findOne({ mobile: updates.mobile, _id: { $ne: userId } });
      if (mobileTaken) {
        return res.status(409).json({ message: "Mobile number is already in use by another account" });
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-refreshToken -suspendedBy -bannedBy -__v").lean();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data:    user,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};


// ─── UPLOAD / UPDATE PROFILE PIC ─────────────────────────────────────────────
// PATCH /api/profile/picture
// Expects: multipart/form-data with field "profilePic"

exports.updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      resourceType: "image",
      folder:       "profile_pics",
    });

    const user = await UserModel.findByIdAndUpdate(
      req.user._id,
      { profilePic: result.secure_url },
      { new: true }
    ).select("firstname lastname email profilePic").lean();

    res.status(200).json({
      success:    true,
      message:    "Profile picture updated successfully",
      profilePic: user.profilePic,
      data:       user,
    });
  } catch (error) {
    console.error("updateProfilePic error:", error);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
};


// ─── DELETE PROFILE PIC ───────────────────────────────────────────────────────
// DELETE /api/profile/picture

exports.deleteProfilePic = async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate(req.user._id, { profilePic: null });

    res.status(200).json({
      success: true,
      message: "Profile picture removed",
    });
  } catch (error) {
    console.error("deleteProfilePic error:", error);
    res.status(500).json({ message: "Failed to remove profile picture" });
  }
};


////////////////////////////////////////////////////////////////////
//// SECTION 2 — ADDRESSES
////////////////////////////////////////////////////////////////////

// ─── HELPER: sync user.address with current default ───────────────────────────

async function syncUserAddress(userId) {
  const def = await Address.findOne({ userId, isDefault: true }).lean();
  await UserModel.findByIdAndUpdate(userId, {
    defaultAddress: def
      ? {
          street:  def.street,
          city:    def.city,
          state:   def.state,
          pincode: def.pincode,                           
          full:    `${def.street}, ${def.city}, ${def.state} - ${def.pincode}`, 
        }
      : { street: null, city: null, state: null, pincode: null, full: null },
  });
}

// ─── ADD ADDRESS ──────────────────────────────────────────────────────────────
// POST /api/profile/address

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { street, city, state, pincode, country, isDefault } = req.body;

    if (!street || !city || !state || !pincode || !country) {
      return res.status(400).json({
        message: "All fields are required: street, city, state, pincode, country",
      });
    }

    const existingCount   = await Address.countDocuments({ userId });
    const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

    if (shouldBeDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = await Address.create({
      userId,
      street,
      city,
      state,
      pincode,
      country:   country || "India",
      isDefault: shouldBeDefault,
    });

    if (shouldBeDefault) await syncUserAddress(userId);

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data:    address,
    });
  } catch (error) {
    console.error("addAddress error:", error);
    res.status(500).json({ message: "Failed to add address" });
  }
};
// ─── GET ALL ADDRESSES ────────────────────────────────────────────────────────
// GET /api/profile/address

exports.getAddresses = async (req, res) => {
  try {
    const userId              = req.user._id;
    const { firstname, lastname } = req.user;

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        name:      `${firstname} ${lastname}`.trim(),
        addresses,
      },
    });
  } catch (error) {
    console.error("getAddresses error:", error);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};


// ─── UPDATE ADDRESS ───────────────────────────────────────────────────────────
// PUT /api/profile/address/:id

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    const existing = await Address.findOne({ _id: id, userId });
    if (!existing) return res.status(404).json({ message: "Address not found" });

    if (req.body.isDefault) {
      await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (updated.isDefault) await syncUserAddress(userId);

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data:    updated,
    });
  } catch (error) {
    console.error("updateAddress error:", error);
    res.status(500).json({ message: "Failed to update address" });
  }
};


// ─── DELETE ADDRESS ───────────────────────────────────────────────────────────
// DELETE /api/profile/address/:id

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    await Address.findByIdAndDelete(id);

    if (address.isDefault) {
      const next = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (next) { next.isDefault = true; await next.save(); }
      await syncUserAddress(userId);
    }

    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("deleteAddress error:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};


// ─── SET DEFAULT ADDRESS ──────────────────────────────────────────────────────
// PATCH /api/profile/address/:id/default

exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    await Address.updateMany({ userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();
    await syncUserAddress(userId);

    res.status(200).json({
      success: true,
      message: "Default address updated",
      data:    address,
    });
  } catch (error) {
    console.error("setDefaultAddress error:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};


////////////////////////////////////////////////////////////////////
//// SECTION 3 — PAYMENT METHODS
////////////////////////////////////////////////////////////////////

// ─── ADD PAYMENT METHOD ───────────────────────────────────────────────────────
// POST /api/profile/payment
// body: { type: "UPI"|"Card"|"NetBanking", upi:{}, card:{}, netBanking:{}, isDefault, label }

exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, upi, card, netBanking, isDefault, label } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Payment method type is required (UPI, Card, NetBanking)" });
    }

    // Validate the right sub-object is present
    if (type === "UPI" && !upi?.upiId) {
      return res.status(400).json({ message: "UPI ID is required for UPI payment method" });
    }
    if (type === "Card" && (!card?.last4 || !card?.expiryMonth || !card?.expiryYear || !card?.cardholderName)) {
      return res.status(400).json({ message: "card.last4, expiryMonth, expiryYear and cardholderName are required" });
    }
    if (type === "NetBanking" && (!netBanking?.bankName || !netBanking?.maskedAccountNumber || !netBanking?.ifscCode || !netBanking?.accountHolderName)) {
      return res.status(400).json({ message: "bankName, accountHolderName, maskedAccountNumber and ifscCode are required" });
    }

    const existingCount   = await PaymentMethod.countDocuments({ userId });
    const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

    if (shouldBeDefault) {
      await PaymentMethod.updateMany({ userId }, { isDefault: false });
    }

    const paymentMethod = await PaymentMethod.create({
      userId,
      type,
      upi:        type === "UPI"         ? upi        : null,
      card:       type === "Card"        ? card       : null,
      netBanking: type === "NetBanking"  ? netBanking : null,
      isDefault:  shouldBeDefault,
      label:      label?.trim() || null,
    });

    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      data:    paymentMethod,
    });
  } catch (error) {
    console.error("addPaymentMethod error:", error);
    res.status(500).json({ message: "Failed to add payment method" });
  }
};


// ─── GET ALL PAYMENT METHODS ──────────────────────────────────────────────────
// GET /api/profile/payment

exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod
      .find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count:   paymentMethods.length,
      data:    paymentMethods,
    });
  } catch (error) {
    console.error("getPaymentMethods error:", error);
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
};


// ─── UPDATE PAYMENT METHOD ────────────────────────────────────────────────────
// PUT /api/profile/payment/:id
// Allows updating label, isDefault, and the type-specific sub-fields

exports.updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    const existing = await PaymentMethod.findOne({ _id: id, userId });
    if (!existing) return res.status(404).json({ message: "Payment method not found" });

    const { label, isDefault, upi, card, netBanking } = req.body;

    const updates = {};
    if (label     !== undefined) updates.label     = label?.trim() || null;
    if (isDefault !== undefined) updates.isDefault = !!isDefault;

    // Update only the fields for the existing type
    if (existing.type === "UPI"        && upi)        updates.upi        = { ...existing.upi,        ...upi };
    if (existing.type === "Card"       && card)       updates.card       = { ...existing.card,       ...card };
    if (existing.type === "NetBanking" && netBanking) updates.netBanking = { ...existing.netBanking, ...netBanking };

    if (updates.isDefault) {
      await PaymentMethod.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
    }

    const updated = await PaymentMethod.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data:    updated,
    });
  } catch (error) {
    console.error("updatePaymentMethod error:", error);
    res.status(500).json({ message: "Failed to update payment method" });
  }
};


// ─── DELETE PAYMENT METHOD ────────────────────────────────────────────────────
// DELETE /api/profile/payment/:id

exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    const method = await PaymentMethod.findOne({ _id: id, userId });
    if (!method) return res.status(404).json({ message: "Payment method not found" });

    await PaymentMethod.findByIdAndDelete(id);

    // If deleted was default, promote the next one
    if (method.isDefault) {
      const next = await PaymentMethod.findOne({ userId }).sort({ createdAt: -1 });
      if (next) { next.isDefault = true; await next.save(); }
    }

    res.status(200).json({ success: true, message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("deletePaymentMethod error:", error);
    res.status(500).json({ message: "Failed to delete payment method" });
  }
};


// ─── SET DEFAULT PAYMENT METHOD ───────────────────────────────────────────────
// PATCH /api/profile/payment/:id/default

exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id }  = req.params;

    const method = await PaymentMethod.findOne({ _id: id, userId });
    if (!method) return res.status(404).json({ message: "Payment method not found" });

    await PaymentMethod.updateMany({ userId }, { isDefault: false });
    method.isDefault = true;
    await method.save();

    res.status(200).json({
      success: true,
      message: "Default payment method updated",
      data:    method,
    });
  } catch (error) {
    console.error("setDefaultPaymentMethod error:", error);
    res.status(500).json({ message: "Failed to set default payment method" });
  }
};