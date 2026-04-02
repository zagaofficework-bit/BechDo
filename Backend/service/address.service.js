const Address = require("../models/address.model");

/**
 * Create Address
 */
exports.createAddress = async (addressData) => {
  return await Address.create(addressData);
};

/**
 * Get User Addresses
 */
exports.getUserAddresses = async (userId) => {
  return await Address.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Get Address By ID
 */
exports.getAddressById = async (id) => {
  return await Address.findById(id);
};

/**
 * Update Address
 */
exports.updateAddress = async (id, data) => {
  return await Address.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Delete Address
 */
exports.deleteAddress = async (id) => {
  return await Address.findByIdAndDelete(id);
};