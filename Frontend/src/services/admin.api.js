const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ─── Authenticated request helper ─────────────────────────────────────────────

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

// ─── Query builder ────────────────────────────────────────────────────────────

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.append(key, val);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

////////////////////////////////////////////////////////////////////
//// PRODUCTS
////////////////////////////////////////////////////////////////////

// DELETE /admin/products/:id
export const adminDeleteProduct = (id) =>
  request(`/admin/products/${id}`, { method: "DELETE" });

////////////////////////////////////////////////////////////////////
//// ORDERS
////////////////////////////////////////////////////////////////////

// GET /admin/orders?type=buy&status=confirmed&page=1&limit=20
export const getAllOrders = (filters = {}) =>
  request(`/admin/orders${buildQuery(filters)}`);

////////////////////////////////////////////////////////////////////
//// SUBSCRIPTIONS
////////////////////////////////////////////////////////////////////

// GET /admin/subscriptions?status=active&plan=premium&page=1&limit=20
export const getSubscribedSellers = (filters = {}) =>
  request(`/admin/subscriptions${buildQuery(filters)}`);

// GET /admin/subscriptions/:sellerId
export const getSellerSubscriptionDetail = (sellerId) =>
  request(`/admin/subscriptions/${sellerId}`);

////////////////////////////////////////////////////////////////////
//// SELLER CONTROLS
////////////////////////////////////////////////////////////////////

// POST /admin/sellers/:sellerId/pause  — body: { reason }
export const pauseSeller = (sellerId, reason) =>
  request(`/admin/sellers/${sellerId}/pause`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

// POST /admin/sellers/:sellerId/ban  — body: { reason }
export const banSeller = (sellerId, reason) =>
  request(`/admin/sellers/${sellerId}/ban`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

// POST /admin/sellers/:sellerId/reinstate  — body: { note? }
export const reinstateSeller = (sellerId, note = "") =>
  request(`/admin/sellers/${sellerId}/reinstate`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });

// GET /admin/deletion-requests?page=1&limit=20
export const getDeletionRequests = (filters = {}) =>
  request(`/admin/deletion-requests${buildQuery(filters)}`);

// POST /admin/deletion-requests/:userId/approve
export const approveDeletion = (userId) =>
  request(`/admin/deletion-requests/${userId}/approve`, { method: "POST" });

// POST /admin/deletion-requests/:userId/reject  — body: { note? }
export const rejectDeletion = (userId, note = "") =>
  request(`/admin/deletion-requests/${userId}/reject`, {
    method: "POST",
    body:   JSON.stringify({ note }),
  });