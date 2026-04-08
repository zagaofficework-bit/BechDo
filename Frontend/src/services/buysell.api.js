const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ─── JSON request helper ───────────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── Build query string ────────────────────────────────────────────────────────
const buildQuery = (params = {}) => {
  const p = new URLSearchParams();
  if (params.type)   p.append("type",   params.type);
  if (params.status) p.append("status", params.status);
  if (params.page)   p.append("page",   params.page);
  if (params.limit)  p.append("limit",  params.limit);
  const q = p.toString();
  return q ? `?${q}` : "";
};

// ─── BUY ROUTES ────────────────────────────────────────────────────────────────

/**
 * POST /api/orders/products/:id/buy
 * Buyer places an order — payment collected upfront, status = "pending"
 * @param {string} productId
 * @param {string} paymentMethod  "Cash" | "UPI" | "Card" | "NetBanking"
 */
export const buyProduct = (productId, paymentMethod) =>
  request(`/orders/products/${productId}/buy`, {
    method: "POST",
    body: JSON.stringify({ paymentMethod }),
  });

/**
 * POST /api/orders/:orderId/confirm
 * Seller confirms a pending buy order → status: "confirmed", product marked sold
 * @param {string} orderId
 */
export const confirmOrder = (orderId) =>
  request(`/orders/${orderId}/confirm`, { method: "POST" });

/**
 * POST /api/orders/:orderId/reject
 * Seller rejects a pending buy order → status: "rejected", product back to available
 * @param {string} orderId
 * @param {string} [reason]  optional rejection reason
 */
export const rejectOrder = (orderId, reason = "") =>
  request(`/orders/${orderId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

/**
 * POST /api/orders/:orderId/cancel
 * Buyer cancels their own pending order → status: "cancelled", product back to available
 * @param {string} orderId
 */
export const cancelOrder = (orderId) =>
  request(`/orders/${orderId}/cancel`, { method: "POST" });

// ─── ORDER HISTORY & PENDING ───────────────────────────────────────────────────

/**
 * GET /api/orders/pending
 * Seller fetches all incoming buy requests waiting for confirmation
 */
export const getSellerPendingOrders = () =>
  request(`/orders/pending`);

/**
 * GET /api/orders/my?type=buy&status=pending&page=1&limit=10
 * Fetch own order history (as buyer or seller)
 * @param {{ type?: string, status?: string, page?: number, limit?: number }} filters
 */
export const getMyOrders = (filters = {}) =>
  request(`/orders/my${buildQuery(filters)}`);

/**
 * PATCH /api/orders/:orderId/status
 * Update order status (seller or buyer)
 * @param {string} orderId
 * @param {string} status  "pending"|"confirmed"|"completed"|"cancelled"|"delivered"|"rejected"|"shipped"
 */
export const updateOrderStatus = (orderId, status) =>
  request(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });