const { authMiddleware, authorize } = require("./auth.middleware");

const adminOnly = [authMiddleware, authorize("admin")];

module.exports = adminOnly;