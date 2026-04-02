// services/shop.api.js
// Covers: wishlist, cart, buy/orders — mirrors your existing request() pattern

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
export const getWishlist         = ()  => request("/wishlist");
export const addToWishlist       = (id) => request(`/wishlist/${id}`, { method: "POST" });
export const removeFromWishlist  = (id) => request(`/wishlist/${id}`, { method: "DELETE" });
export const checkWishlist       = (id) => request(`/wishlist/${id}/check`);
export const clearWishlist       = ()  => request("/wishlist", { method: "DELETE" });

// ─── CART ─────────────────────────────────────────────────────────────────────
export const getCart             = ()  => request("/cart");
export const addToCart           = (id) => request(`/cart/${id}`, { method: "POST" });
export const removeFromCart      = (id) => request(`/cart/${id}`, { method: "DELETE" });
export const clearCart           = ()  => request("/cart", { method: "DELETE" });
export const checkCart           = (id) => request(`/cart/${id}/check`);
export const checkoutFromCart    = (id, paymentMethod) =>
  request(`/cart/${id}/checkout`, { method: "POST", body: JSON.stringify({ paymentMethod }) });
export const checkoutMultiple    = (paymentMethod) =>
  request("/cart/checkout", { method: "POST", body: JSON.stringify({ paymentMethod }) });

// ─── BUY / ORDERS ────────────────────────────────────────────────────────────
export const buyProduct          = (id, paymentMethod) =>
  request(`/orders/products/${id}/buy`, { method: "POST", body: JSON.stringify({ paymentMethod }) });
export const getMyOrders         = (filters = {}) => {
  const p = new URLSearchParams(filters).toString();
  return request(`/orders/my${p ? "?" + p : ""}`);
};
export const cancelOrder         = (orderId) =>
  request(`/orders/${orderId}/cancel`, { method: "POST" });