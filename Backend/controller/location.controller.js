const { reverseGeocode, forwardGeocode } = require("../helper/geocode.helper");
const UserModel = require("../models/user.model");
const Address   = require("../models/address.model");

////////////////////////////////////////////////////////////////////
//// REVERSE GEOCODE — get address from GPS coordinates
//// POST /api/location/reverse-geocode
//// Called by frontend after getting GPS coords
////////////////////////////////////////////////////////////////////

exports.reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Coordinates out of valid range" });
    }

    const address = await reverseGeocode(lat, lng);

    res.status(200).json({
      success: true,
      data:    address,
    });
  } catch (error) {
    console.error("reverseGeocode error:", error);
    res.status(500).json({ message: "Failed to get address from coordinates" });
  }
};


////////////////////////////////////////////////////////////////////
//// FORWARD GEOCODE — get coordinates from address string
//// POST /api/location/forward-geocode
////////////////////////////////////////////////////////////////////

exports.forwardGeocode = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address?.trim()) {
      return res.status(400).json({ message: "address string is required" });
    }

    const coords = await forwardGeocode(address.trim());

    res.status(200).json({
      success: true,
      data:    coords,
    });
  } catch (error) {
    console.error("forwardGeocode error:", error);
    res.status(500).json({ message: "Failed to get coordinates from address" });
  }
};


////////////////////////////////////////////////////////////////////
//// SAVE LOCATION — saves GPS coordinates to user profile
//// PATCH /api/location/save
//// Also auto-fills defaultAddress from reverse geocode
////////////////////////////////////////////////////////////////////

exports.saveLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId                  = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // Reverse geocode to get human readable address
    const geocoded = await reverseGeocode(lat, lng);

    // Update user location (GeoJSON) + defaultAddress snapshot
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          location: {
            type:        "Point",
            coordinates: [lng, lat],   // GeoJSON is [longitude, latitude]
          },
          defaultAddress: {
            city:    geocoded.city    || null,
            state:   geocoded.state   || null,
            pincode: geocoded.pincode || null,
            full:    geocoded.full    || null,
          },
        },
      },
      { new: true }
    ).select("firstname location defaultAddress").lean();

    res.status(200).json({
      success: true,
      message: "Location saved successfully",
      data: {
        coordinates: { latitude: lat, longitude: lng },
        address:     geocoded,
        user:        user.defaultAddress,
      },
    });
  } catch (error) {
    console.error("saveLocation error:", error);
    res.status(500).json({ message: "Failed to save location" });
  }
};


////////////////////////////////////////////////////////////////////
//// SAVE AS ADDRESS — POST /api/location/save-as-address
////
//// Frontend sends back the pre-fetched geocoded fields so we never
//// call reverseGeocode() again — what the user confirmed = what's saved.
////////////////////////////////////////////////////////////////////

exports.saveAsAddress = async (req, res) => {
  try {
    const {
      latitude, longitude, isDefault,
      street, city, state, pincode, country, full,
    } = req.body;

    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "latitude and longitude are required" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    if (!city || !state) {
      return res.status(400).json({
        message: "Could not determine city/state. Try entering your address manually.",
      });
    }

    const existingCount   = await Address.countDocuments({ userId });
    const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

    if (shouldBeDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    // Prefer OpenCage's formatted string; build one if missing
    const fullDisplay = full
      || [street, city, state, pincode, country].filter(Boolean).join(", ");

    const address = await Address.create({
      userId,
      street:    street  || "Detected via GPS",
      city,
      state,
      pincode:   pincode || "",
      country:   country || "India",
      full:      fullDisplay,   // ← NOW saved on the Address document
      isDefault: shouldBeDefault,
    });

    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        location: { type: "Point", coordinates: [lng, lat] },
        ...(shouldBeDefault && {
          defaultAddress: { city, state, pincode: pincode || null, full: fullDisplay },
        }),
      },
    });

    res.status(201).json({
      success: true,
      message: "Location detected and saved as address",
      data: { address, detectedFrom: { latitude: lat, longitude: lng, full: fullDisplay } },
    });
  } catch (error) {
    console.error("saveAsAddress error:", error);
    res.status(500).json({ message: "Failed to save location as address" });
  }
};


////////////////////////////////////////////////////////////////////
//// ADD ADDRESS (manual) — POST /api/profile/address
////
//// Builds the `full` string from the entered fields so the card
//// displays consistently whether saved via GPS or manually.
////////////////////////////////////////////////////////////////////

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { street, city, state, pincode, country, isDefault } = req.body;

    if (!street || !city || !state || !pincode) {
      return res.status(400).json({
        message: "street, city, state and pincode are required",
      });
    }

    const existingCount   = await Address.countDocuments({ userId });
    const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

    if (shouldBeDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    // Build full display string for manually entered addresses
    const fullDisplay = [street, city, state, pincode, country || "India"]
      .filter(Boolean)
      .join(", ");

    const address = await Address.create({
      userId,
      street,
      city,
      state,
      pincode,
      country:   country   || "India",
      full:      fullDisplay,
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