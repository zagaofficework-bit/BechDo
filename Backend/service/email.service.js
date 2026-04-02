const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Phonify" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// ─── Shared layout wrapper ────────────────────────────────────────────────────
const layout = (accentColor, headerTitle, bodyHtml) => `
<div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:40px 0;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
    <div style="background:${accentColor}; padding:20px; text-align:center; color:white;">
      <h2 style="margin:0;">${headerTitle}</h2>
    </div>
    <div style="padding:30px;">
      ${bodyHtml}
    </div>
    <div style="background:#f1f1f1; padding:15px; text-align:center; font-size:13px; color:#666;">
      © ${new Date().getFullYear()} Phonify • All Rights Reserved
    </div>
  </div>
</div>`;

const infoRow = (label, value) =>
  `<tr>
    <td style="padding:8px 12px; font-weight:bold; color:#555; width:45%; border-bottom:1px solid #f0f0f0;">${label}</td>
    <td style="padding:8px 12px; color:#333; border-bottom:1px solid #f0f0f0;">${value}</td>
  </tr>`;

const infoTable = (rows) =>
  `<table style="width:100%; border-collapse:collapse; background:#f9f9f9; border-radius:8px; overflow:hidden; margin:20px 0;">
    ${rows}
  </table>`;

const badge = (color, text) =>
  `<span style="display:inline-block; background:${color}; color:white; padding:4px 14px; border-radius:20px; font-size:13px; font-weight:bold;">${text}</span>`;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH EMAILS
// ─────────────────────────────────────────────────────────────────────────────

async function sendRegistrationEmail(email, firstname, otp) {
  const subject = "Welcome to Phonify 🎉";
  const text = `Hello ${firstname}, Your OTP is ${otp}. Thanks for joining Phonify.`;
  const html = layout(
    "#4f46e5",
    "Welcome to Phonify 🚀",
    `<h3 style="color:#333; text-align:center;">Hello ${firstname},</h3>
     <p style="color:#555; font-size:15px; text-align:center;">
       Thank you for registering with <b>Phonify</b>. Use the OTP below to verify your account.
     </p>
     <div style="text-align:center; margin:25px 0;">
       <span style="display:inline-block; background:#4f46e5; color:white; font-size:26px;
         letter-spacing:6px; padding:12px 25px; border-radius:8px; font-weight:bold;">
         ${otp}
       </span>
     </div>
     <p style="color:#777; font-size:14px; text-align:center;">
       This OTP is valid for a limited time. Please do not share it with anyone.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

async function sendLoginEmail(email, otp) {
  const subject = "Phonify Login Verification 🔐";
  const text = `Your login OTP is ${otp}`;
  const html = layout(
    "#10b981",
    "Login Verification",
    `<p style="color:#555; font-size:15px; text-align:center;">
       Use the OTP below to securely login to your account.
     </p>
     <div style="text-align:center; margin:25px 0;">
       <span style="display:inline-block; background:#10b981; color:white; font-size:26px;
         letter-spacing:6px; padding:12px 25px; border-radius:8px; font-weight:bold;">
         ${otp}
       </span>
     </div>
     <p style="color:#777; font-size:14px; text-align:center;">
       If you didn't request this login, please ignore this email.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER EMAILS  (buysell.controller.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent to BUYER after buyProduct succeeds.
 */
async function sendOrderPlacedEmail(buyerEmail, { buyerName, orderId, productTitle, price, paymentMethod, breakdown }) {
  const subject = "Order Placed Successfully 🛒 — Phonify";
  const text = `Hi ${buyerName}, your order for "${productTitle}" has been placed. Order ID: ${orderId}`;
  const html = layout(
    "#0077b6",
    "Order Placed! 🛒",
    `<p style="color:#333; font-size:15px;">Hi <b>${buyerName}</b>,</p>
     <p style="color:#555;">Your order has been placed and payment is confirmed.
       The seller will review and confirm your order shortly.
     </p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Amount Paid", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("Payment Method", paymentMethod)}
       ${infoRow("Commission", `₹${breakdown.commissionAmount} (${breakdown.commissionRate})`)}
       ${infoRow("Status", badge("#f59e0b", "Awaiting Seller Confirmation"))}
     `)}
     <p style="color:#777; font-size:13px;">
       You'll receive another email once the seller confirms or rejects your order.
     </p>`
  );
  await sendEmail(buyerEmail, subject, text, html);
}

/**
 * Sent to SELLER when a new buy order comes in.
 */
async function sendNewOrderNotificationEmail(sellerEmail, { sellerName, orderId, productTitle, price, buyerName, buyerEmail: bEmail, paymentMethod }) {
  const subject = `New Order Received for "${productTitle}" — Phonify`;
  const text = `Hi ${sellerName}, you have a new order from ${buyerName} for "${productTitle}". Order ID: ${orderId}`;
  const html = layout(
    "#7c3aed",
    "New Order Received 📦",
    `<p style="color:#333; font-size:15px;">Hi <b>${sellerName}</b>,</p>
     <p style="color:#555;">Great news! You have received a new order. Please confirm or reject it at your earliest convenience.</p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Sale Price", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("Buyer", buyerName)}
       ${infoRow("Buyer Email", bEmail)}
       ${infoRow("Payment Method", paymentMethod)}
       ${infoRow("Payment Status", badge("#10b981", "Completed"))}
     `)}
     <p style="color:#777; font-size:13px;">
       Log in to your Phonify dashboard to confirm or reject this order.
     </p>`
  );
  await sendEmail(sellerEmail, subject, text, html);
}

/**
 * Sent to BUYER when seller confirms the order.
 */
async function sendOrderConfirmedEmail(buyerEmail, { buyerName, orderId, productTitle, price, sellerName, confirmedAt }) {
  const subject = `Order Confirmed ✅ — ${productTitle}`;
  const text = `Hi ${buyerName}, your order for "${productTitle}" has been confirmed by the seller.`;
  const html = layout(
    "#10b981",
    "Order Confirmed ✅",
    `<p style="color:#333; font-size:15px;">Hi <b>${buyerName}</b>,</p>
     <p style="color:#555;">Your order has been <b>confirmed</b> by the seller. The transaction is now complete.</p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Amount", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("Seller", sellerName)}
       ${infoRow("Confirmed At", new Date(confirmedAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#10b981", "Confirmed"))}
     `)}
     <p style="color:#555;">Thank you for shopping on Phonify! 🎉</p>`
  );
  await sendEmail(buyerEmail, subject, text, html);
}

/**
 * Sent to BUYER when seller rejects the order.
 */
async function sendOrderRejectedEmail(buyerEmail, { buyerName, orderId, productTitle, reason }) {
  const subject = `Order Rejected ❌ — ${productTitle}`;
  const text = `Hi ${buyerName}, your order for "${productTitle}" was rejected by the seller. Reason: ${reason || "No reason provided"}`;
  const html = layout(
    "#ef4444",
    "Order Rejected ❌",
    `<p style="color:#333; font-size:15px;">Hi <b>${buyerName}</b>,</p>
     <p style="color:#555;">Unfortunately, the seller has <b>rejected</b> your order. The product has been relisted and is available again.</p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Rejection Reason", reason || "No reason provided")}
       ${infoRow("Status", badge("#ef4444", "Rejected"))}
     `)}
     <p style="color:#777; font-size:13px;">
       If a payment was made, a refund will be processed within 5–7 business days. Browse other devices on Phonify.
     </p>`
  );
  await sendEmail(buyerEmail, subject, text, html);
}

/**
 * Sent to SELLER when buyer cancels the order.
 */
async function sendOrderCancelledEmail(sellerEmail, { sellerName, orderId, productTitle }) {
  const subject = `Order Cancelled — ${productTitle}`;
  const text = `Hi ${sellerName}, the buyer has cancelled their order for "${productTitle}". Order ID: ${orderId}`;
  const html = layout(
    "#f59e0b",
    "Order Cancelled",
    `<p style="color:#333; font-size:15px;">Hi <b>${sellerName}</b>,</p>
     <p style="color:#555;">The buyer has <b>cancelled</b> their order. Your product has been automatically relisted and is available again.</p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Status", badge("#f59e0b", "Cancelled"))}
     `)}
     <p style="color:#777; font-size:13px;">
       No action is required from your side. Continue managing your listings on Phonify.
     </p>`
  );
  await sendEmail(sellerEmail, subject, text, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION EMAILS  (subscription.controller.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent to USER after purchasing a subscription (and becoming a seller).
 */
async function sendSubscriptionPurchasedEmail(email, { firstname, plan, price, startDate, endDate, activeListingsLimit }) {
  const subject = `You're now a Seller on Phonify 🎉 — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
  const text = `Congratulations ${firstname}! Your ${plan} subscription is active. You are now a seller on Phonify.`;
  const listingsLabel = activeListingsLimit === -1 ? "Unlimited" : `Up to ${activeListingsLimit}`;
  const html = layout(
    "#4f46e5",
    "Seller Subscription Active 🚀",
    `<p style="color:#333; font-size:15px;">Congratulations, <b>${firstname}</b>! 🎉</p>
     <p style="color:#555;">Your subscription is now active and your account has been <b>upgraded to Seller</b>.
       You can now start listing devices on Phonify.
     </p>
     ${infoTable(`
       ${infoRow("Plan", `<b>${plan.charAt(0).toUpperCase() + plan.slice(1)}</b>`)}
       ${infoRow("Amount Paid", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("Active From", new Date(startDate).toDateString())}
       ${infoRow("Valid Until", new Date(endDate).toDateString())}
       ${infoRow("Active Listings", listingsLabel)}
       ${infoRow("Status", badge("#10b981", "Active"))}
     `)}
     <p style="color:#555;">Head to your dashboard to start listing your first device!</p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to SELLER after upgrading their plan.
 */
async function sendSubscriptionUpgradedEmail(email, { firstname, oldPlan, newPlan, price, endDate }) {
  const subject = `Plan Upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} ⬆️ — Phonify`;
  const text = `Hi ${firstname}, your plan has been upgraded from ${oldPlan} to ${newPlan}.`;
  const html = layout(
    "#7c3aed",
    "Plan Upgraded ⬆️",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname}</b>,</p>
     <p style="color:#555;">Your subscription has been successfully upgraded!</p>
     ${infoTable(`
       ${infoRow("Previous Plan", oldPlan.charAt(0).toUpperCase() + oldPlan.slice(1))}
       ${infoRow("New Plan", `<b>${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}</b>`)}
       ${infoRow("Amount Paid", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("New Expiry", new Date(endDate).toDateString())}
       ${infoRow("Status", badge("#10b981", "Active"))}
     `)}
     <p style="color:#555;">Enjoy your upgraded benefits on Phonify!</p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to SELLER when admin revokes their subscription.
 */
async function sendSubscriptionRevokedEmail(email, { firstname }) {
  const subject = "Your Phonify Seller Subscription Has Been Revoked";
  const text = `Hi ${firstname}, your seller subscription on Phonify has been revoked by an administrator.`;
  const html = layout(
    "#ef4444",
    "Subscription Revoked",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname}</b>,</p>
     <p style="color:#555;">
       Your seller subscription on Phonify has been <b>revoked</b> by an administrator.
       Your account has been reverted to a regular user.
     </p>
     <p style="color:#555;">
       If you believe this was a mistake, please contact our support team.
     </p>
     <p style="color:#777; font-size:13px;">
       You can re-subscribe at any time to regain seller access.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE SELL EMAILS  (deviceSell.controller.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent to USER after submitting a device listing.
 */
async function sendDeviceListingSubmittedEmail(email, { firstname, listingId, deviceName, category, finalPrice }) {
  const subject = `Your Device Has Been Listed — ${deviceName}`;
  const text = `Hi ${firstname}, your device "${deviceName}" has been listed on Phonify. Expected price: ₹${finalPrice}`;
  const html = layout(
    "#0077b6",
    "Device Listed Successfully 📱",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname}</b>,</p>
     <p style="color:#555;">
       Your device has been successfully listed. Sellers in your area will review it and reach out to you shortly.
     </p>
     ${infoTable(`
       ${infoRow("Listing ID", `<code>${listingId}</code>`)}
       ${infoRow("Device", deviceName)}
       ${infoRow("Category", category.charAt(0).toUpperCase() + category.slice(1))}
       ${infoRow("Expected Price", `₹${finalPrice.toLocaleString("en-IN")}`)}
       ${infoRow("Status", badge("#f59e0b", "Awaiting Seller"))}
     `)}
     <p style="color:#777; font-size:13px;">
       You will be notified once a seller accepts your listing and proposes pickup slots.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to USER when a seller accepts their device listing.
 */
async function sendListingAcceptedEmail(email, { firstname, listingId, deviceName, finalPrice, sellerName, proposedSlots, acceptedAs }) {
  const subject = `A Seller Is Interested in Your ${deviceName} 🤝`;
  const text = `Hi ${firstname}, a seller (${sellerName}) has accepted your listing for "${deviceName}". Please confirm a pickup slot.`;

  const slotsHtml = proposedSlots.length > 0
    ? proposedSlots.map((s, i) =>
        `<tr>
          <td style="padding:6px 12px; color:#555; border-bottom:1px solid #f0f0f0;">Slot ${i + 1}</td>
          <td style="padding:6px 12px; color:#333; border-bottom:1px solid #f0f0f0;">${s.date} — ${s.timeRange}</td>
        </tr>`
      ).join("")
    : `<tr><td colspan="2" style="padding:8px 12px; color:#888;">No slots yet — seller will add them shortly</td></tr>`;

  const html = layout(
    "#10b981",
    "Listing Accepted 🤝",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname}</b>,</p>
     <p style="color:#555;">
       Great news! A seller has accepted your listing and will come to pick up your device.
       Please log in to confirm one of the proposed pickup slots.
     </p>
     ${infoTable(`
       ${infoRow("Listing ID", `<code>${listingId}</code>`)}
       ${infoRow("Device", deviceName)}
       ${infoRow("Offered Price", `₹${finalPrice.toLocaleString("en-IN")}`)}
       ${infoRow("Seller", sellerName)}
       ${infoRow("Seller Type", acceptedAs === "super_seller" ? badge("#7c3aed", "Super Seller") : badge("#0077b6", "Seller"))}
     `)}
     <p style="color:#555; font-weight:bold; margin-top:20px;">Proposed Pickup Slots:</p>
     <table style="width:100%; border-collapse:collapse; background:#f9f9f9; border-radius:8px; overflow:hidden;">
       ${slotsHtml}
     </table>
     <p style="color:#777; font-size:13px; margin-top:16px;">
       Log in to Phonify to confirm your preferred slot and payment method.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to SELLER when the user confirms a pickup slot.
 */
async function sendPickupConfirmedEmail(email, { sellerName, listingId, deviceName, finalPrice, confirmedSlot, paymentMethod, paymentDetails, userName, userMobile }) {
  const subject = `Pickup Confirmed for ${deviceName} 📅`;
  const text = `Hi ${sellerName}, the user has confirmed the pickup for "${deviceName}" on ${confirmedSlot.date} at ${confirmedSlot.timeRange}.`;
  const html = layout(
    "#0077b6",
    "Pickup Scheduled 📅",
    `<p style="color:#333; font-size:15px;">Hi <b>${sellerName}</b>,</p>
     <p style="color:#555;">
       The user has confirmed a pickup slot. Please arrive on time to complete the transaction.
     </p>
     ${infoTable(`
       ${infoRow("Listing ID", `<code>${listingId}</code>`)}
       ${infoRow("Device", deviceName)}
       ${infoRow("Agreed Price", `₹${finalPrice.toLocaleString("en-IN")}`)}
       ${infoRow("Pickup Date", confirmedSlot.date)}
       ${infoRow("Pickup Time", confirmedSlot.timeRange)}
       ${infoRow("Payment Method", paymentMethod.toUpperCase())}
       ${paymentDetails ? infoRow("Payment Details", paymentDetails) : ""}
       ${infoRow("User Name", userName)}
       ${infoRow("User Mobile", userMobile)}
     `)}
     <p style="color:#777; font-size:13px;">
       Please mark the listing as completed in your dashboard after the transaction is done.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to USER when a seller rejects their device listing.
 * Covers both super-seller rejection (listing moves to open pool)
 * and regular seller rejection (listing goes back to open pool too).
 */
async function sendListingRejectedEmail(email, { firstname, listingId, deviceName, finalPrice, reason, sellerType }) {
  const subject = `Update on Your Device Listing — ${deviceName}`;
  const text = `Hi ${firstname}, the seller has passed on your listing for "${deviceName}". It is still available and other sellers may contact you soon.`;
  const html = layout(
    "#f59e0b",
    "Listing Rejected By Seller 📋",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname}</b>,</p>
     <p style="color:#555;">
       The seller who had accepted your listing has decided to <b>pass on this transaction</b>.
       Don't worry — your listing is still active and other sellers will be able to see and contact you shortly.
     </p>
     ${infoTable(`
       ${infoRow("Listing ID", `<code>${listingId}</code>`)}
       ${infoRow("Device", deviceName)}
       ${infoRow("Expected Price", `₹${finalPrice.toLocaleString("en-IN")}`)}
       ${reason ? infoRow("Reason", reason) : ""}
       ${infoRow("Listing Status", badge("#10b981", "Still Active"))}
       ${infoRow("Now Visible To", sellerType === "super_seller" ? "All Sellers" : "All Sellers")}
     `)}
     <p style="color:#777; font-size:13px;">
       No action is needed from your side. You will be notified as soon as another seller accepts your listing.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to USER when the seller completes the transaction.
 */
async function sendListingCompletedEmail(email, { firstname, listingId, deviceName, finalPrice, completedAt }) {
  const subject = `Transaction Completed — ${deviceName} ✅`;
  const text = `Hi ${firstname}, the transaction for your device "${deviceName}" has been completed. You should receive ₹${finalPrice}.`;
  const html = layout(
    "#10b981",
    "Transaction Completed ✅",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname}</b>,</p>
     <p style="color:#555;">
       The transaction for your device has been <b>completed</b> by the seller. Thank you for using Phonify!
     </p>
     ${infoTable(`
       ${infoRow("Listing ID", `<code>${listingId}</code>`)}
       ${infoRow("Device", deviceName)}
       ${infoRow("Amount Received", `₹${finalPrice.toLocaleString("en-IN")}`)}
       ${infoRow("Completed At", new Date(completedAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#10b981", "Completed"))}
     `)}
     <p style="color:#555;">We hope you had a great experience selling on Phonify! 🎉</p>`
  );
  await sendEmail(email, subject, text, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATUS EMAILS — shipped & delivered  (buysell.controller.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent to BUYER when order status moves to "shipped".
 */
async function sendOrderShippedEmail(buyerEmail, { buyerName, orderId, productTitle, price, sellerName, shippedAt }) {
  const subject = `Your Order Has Been Shipped 🚚 — ${productTitle}`;
  const text = `Hi ${buyerName}, your order for "${productTitle}" has been shipped by the seller.`;
  const html = layout(
    "#0077b6",
    "Order Shipped 🚚",
    `<p style="color:#333; font-size:15px;">Hi <b>${buyerName}</b>,</p>
     <p style="color:#555;">
       Great news! Your order has been <b>shipped</b> by the seller and is on its way to you.
     </p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Amount", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("Seller", sellerName)}
       ${infoRow("Shipped At", new Date(shippedAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#0077b6", "Shipped"))}
     `)}
     <p style="color:#777; font-size:13px;">
       You will receive another notification once your order is delivered. Thank you for shopping on Phonify!
     </p>`
  );
  await sendEmail(buyerEmail, subject, text, html);
}

/**
 * Sent to BUYER when order status moves to "delivered".
 * Also notifies SELLER that delivery is confirmed.
 */
async function sendOrderDeliveredToBuyerEmail(buyerEmail, { buyerName, orderId, productTitle, price, sellerName, deliveredAt }) {
  const subject = `Order Delivered Successfully 🎉 — ${productTitle}`;
  const text = `Hi ${buyerName}, your order for "${productTitle}" has been delivered. Enjoy your device!`;
  const html = layout(
    "#10b981",
    "Order Delivered 🎉",
    `<p style="color:#333; font-size:15px;">Hi <b>${buyerName}</b>,</p>
     <p style="color:#555;">
       Your order has been <b>delivered</b> successfully. We hope you love your new device!
     </p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Amount Paid", `₹${price.toLocaleString("en-IN")}`)}
       ${infoRow("Seller", sellerName)}
       ${infoRow("Delivered At", new Date(deliveredAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#10b981", "Delivered"))}
     `)}
     <p style="color:#555;">
       If you have any issues with your order, please contact us through the Phonify app. Happy shopping! 🛍️
     </p>`
  );
  await sendEmail(buyerEmail, subject, text, html);
}

/**
 * Sent to SELLER when the order is marked as delivered —
 * confirms their earnings are now released.
 */
async function sendOrderDeliveredToSellerEmail(sellerEmail, { sellerName, orderId, productTitle, earnings, deliveredAt }) {
  const subject = `Order Delivered — Earnings Released 💰 — ${productTitle}`;
  const text = `Hi ${sellerName}, your order for "${productTitle}" has been delivered. Your earnings of ₹${earnings} are now released.`;
  const html = layout(
    "#10b981",
    "Earnings Released 💰",
    `<p style="color:#333; font-size:15px;">Hi <b>${sellerName}</b>,</p>
     <p style="color:#555;">
       The order has been successfully delivered to the buyer. Your earnings for this transaction have been <b>released</b>.
     </p>
     ${infoTable(`
       ${infoRow("Order ID", `<code>${orderId}</code>`)}
       ${infoRow("Product", productTitle)}
       ${infoRow("Your Earnings", `<b style="color:#10b981;">₹${earnings.toLocaleString("en-IN")}</b>`)}
       ${infoRow("Delivered At", new Date(deliveredAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#10b981", "Delivered"))}
     `)}
     <p style="color:#777; font-size:13px;">
       Thank you for selling on Phonify. Keep listing great devices!
     </p>`
  );
  await sendEmail(sellerEmail, subject, text, html);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ACTION EMAILS  (admin.controller.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent to SELLER when admin pauses their subscription.
 */
async function sendSellerPausedEmail(email, { firstname, lastname, reason, pausedAt }) {
  const subject = "Your Phonify Seller Account Has Been Temporarily Suspended";
  const text = `Hi ${firstname}, your Phonify seller account has been temporarily suspended. Reason: ${reason}`;
  const html = layout(
    "#f59e0b",
    "Account Temporarily Suspended ⚠️",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname} ${lastname}</b>,</p>
     <p style="color:#555;">
       Your Phonify seller account and subscription have been <b>temporarily suspended</b> by our admin team
       pending review.
     </p>
     ${infoTable(`
       ${infoRow("Account", `${firstname} ${lastname}`)}
       ${infoRow("Reason", reason)}
       ${infoRow("Suspended At", new Date(pausedAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#f59e0b", "Suspended"))}
     `)}
     <p style="color:#555;">
       During this period you will not be able to list new products or make transactions.
       If you believe this is a mistake, please contact our support team immediately.
     </p>
     <p style="color:#777; font-size:13px;">
       Your account will be reviewed and reinstated if no violation is found.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to SELLER when admin permanently bans their account.
 */
async function sendSellerBannedEmail(email, { firstname, lastname, reason, bannedAt }) {
  const subject = "Your Phonify Seller Account Has Been Permanently Banned";
  const text = `Hi ${firstname}, your Phonify seller account has been permanently banned. Reason: ${reason}`;
  const html = layout(
    "#ef4444",
    "Account Permanently Banned ❌",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname} ${lastname}</b>,</p>
     <p style="color:#555;">
       After a review of your account activity, your Phonify seller account has been <b>permanently banned</b>
       for violating our Terms of Service.
     </p>
     ${infoTable(`
       ${infoRow("Account", `${firstname} ${lastname}`)}
       ${infoRow("Reason", reason)}
       ${infoRow("Banned At", new Date(bannedAt).toLocaleString("en-IN"))}
       ${infoRow("Status", badge("#ef4444", "Permanently Banned"))}
     `)}
     <p style="color:#555;">
       All your active listings have been removed. This action is permanent and cannot be undone.
     </p>
     <p style="color:#777; font-size:13px;">
       If you believe this decision was made in error, you may contact our legal team to appeal.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

/**
 * Sent to SELLER when admin reinstates their paused account.
 */
async function sendSellerReinstatedEmail(email, { firstname, lastname, note, reinstatedAt }) {
  const subject = "Your Phonify Seller Account Has Been Reinstated ✅";
  const text = `Hi ${firstname}, your Phonify seller account has been reinstated. You can now list products and make transactions again.`;
  const html = layout(
    "#10b981",
    "Account Reinstated ✅",
    `<p style="color:#333; font-size:15px;">Hi <b>${firstname} ${lastname}</b>,</p>
     <p style="color:#555;">
       We're pleased to let you know that your Phonify seller account has been <b>reinstated</b>.
       You can now resume listing products and making transactions.
     </p>
     ${infoTable(`
       ${infoRow("Account", `${firstname} ${lastname}`)}
       ${infoRow("Reinstated At", new Date(reinstatedAt).toLocaleString("en-IN"))}
       ${note ? infoRow("Admin Note", note) : ""}
       ${infoRow("Status", badge("#10b981", "Active"))}
     `)}
     <p style="color:#555;">
       Thank you for your patience during the review process. Welcome back to Phonify!
     </p>
     <p style="color:#777; font-size:13px;">
       Please ensure your future activity complies with our Terms of Service to avoid further action.
     </p>`
  );
  await sendEmail(email, subject, text, html);
}

module.exports = {
  // Auth
  sendRegistrationEmail,
  sendLoginEmail,

  // Orders
  sendOrderPlacedEmail,
  sendNewOrderNotificationEmail,
  sendOrderConfirmedEmail,
  sendOrderRejectedEmail,
  sendOrderCancelledEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredToBuyerEmail,
  sendOrderDeliveredToSellerEmail,

  // Subscriptions
  sendSubscriptionPurchasedEmail,
  sendSubscriptionUpgradedEmail,
  sendSubscriptionRevokedEmail,

  // Device Sell
  sendDeviceListingSubmittedEmail,
  sendListingAcceptedEmail,
  sendPickupConfirmedEmail,
  sendListingRejectedEmail,
  sendListingCompletedEmail,

  // Admin actions
  sendSellerPausedEmail,
  sendSellerBannedEmail,
  sendSellerReinstatedEmail,
};