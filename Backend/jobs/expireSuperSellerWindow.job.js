const cron        = require("node-cron");
const DeviceListing = require("../models/deviceListing.model");

////////////////////////////////////////////////////////////////////
//// CRON JOB — expire super seller window
//// Runs every 5 minutes
//// Finds listings where:
////   - visibility is still super_seller_only
////   - status is available (not yet accepted)
////   - superSellerExpiresAt has passed
//// → flips them to all_sellers automatically
////////////////////////////////////////////////////////////////////

function startExpirySuperSellerJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const result = await DeviceListing.updateMany(
        {
          visibility:           "super_seller_only",
          status:               "available",
          superSellerExpiresAt: { $lte: now },  // expiry time passed
        },
        {
          $set: {
            visibility:          "all_sellers",
            superSellerRejected: true,           // treated same as dismissed
            // We don't set superSellerRejectedBy — it was auto-expired not manually rejected
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[CronJob] ${result.modifiedCount} listing(s) auto-expired from super seller window → moved to open pool`
        );
      }
    } catch (error) {
      console.error("[CronJob] expireSuperSellerWindow error:", error);
    }
  });

  console.log("[CronJob] Super seller expiry job started — runs every 5 minutes");
}

module.exports = { startExpirySuperSellerJob };