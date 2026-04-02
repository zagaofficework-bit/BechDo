const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const req = (method, endpoint, body) =>
  request(endpoint, {
    method,
    ...(body && { body: JSON.stringify(body) }),
  });

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");
  const res   = await fetch(`${BASE_URL}${endpoint}`, {
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

const buildQuery = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.append(k, v);
  });
  const q = p.toString();
  return q ? `?${q}` : "";
};

// ─── PUBLIC — CATALOG BROWSING ────────────────────────────────────

/** GET /api/device-sell/brands?category=mobile */
export const getBrands = (category) =>
  request(`/device-sell/brands?category=${category}`);

/** GET /api/device-sell/brands/:brand/models?category=mobile */
export const getModelsByBrand = (brand, category) =>
  request(`/device-sell/brands/${encodeURIComponent(brand)}/models?category=${category}`);

/** GET /api/device-sell/models/:modelId/variants */
export const getVariantsByModel = (modelId) =>
  request(`/device-sell/models/${modelId}/variants`);

/** GET /api/device-sell/evaluation-config?category=mobile */
export const getEvaluationConfig = (category) =>
  request(`/device-sell/evaluation-config?category=${category}`);

// ── Super seller only ─────────────────────────────────────────────────────────
// Dismisses a listing from the super seller's browse view (without accepting first).
// Backend flips visibility → "all_sellers" so regular sellers can now see it.
// POST /api/device-sell/listings/:id/dismiss
export const dismissListing  = (id, reason)   => req("POST", `/device-sell/listings/${id}/dismiss`, { reason });
// ─── USER — LISTING ACTIONS ───────────────────────────────────────

/**
 * POST /api/device-sell/calculate
 * Preview final price before submitting.
 * @param {{ modelId, variantId, category, answers, defectKeys, accessoryKeys }} payload
 */
export const calculatePrice = (payload) =>
  request(`/device-sell/calculate`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });

/**
 * POST /api/device-sell/submit
 * Creates the device listing after user confirms price.
 * @param {{ modelId, variantId, category, answers, defectKeys, accessoryKeys }} payload
 */
export const submitListing = (payload) =>
  request(`/device-sell/submit`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });

/**
 * GET /api/device-sell/my-listings
 * Returns all listings created by the logged-in user.
 * Populated with acceptedBy seller details.
 */
export const getMyListings = () =>
  request(`/device-sell/my-listings`);

/**
 * DELETE /api/device-sell/listings/:listingId
 * User cancels their own listing (only if status is "available").
 */
export const cancelListing = (listingId) =>
  request(`/device-sell/listings/${listingId}`, { method: "DELETE" });

/**
 * POST /api/device-sell/listings/:listingId/confirm-pickup
 * User confirms a time slot + payment method after seller accepts.
 * @param {string} listingId
 * @param {{ slotIndex: number, paymentMethod: string, paymentDetails?: string }} payload
 */
export const confirmPickup = (listingId, payload) =>
  request(`/device-sell/listings/${listingId}/confirm-pickup`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
 
/**
 * PATCH /api/device-sell/listings/:listingId/propose-slots
 * Seller updates proposed pickup slots (after accepting, before user confirms).
 * @param {string} listingId
 * @param {{ proposedSlots: Array<{ date: string, timeRange: string }> }} payload
 */
export const proposeSlots = (listingId, payload) =>
  request(`/device-sell/listings/${listingId}/propose-slots`, {
    method: "PATCH",
    body:   JSON.stringify(payload),
  });
 
// ─── ALSO UPDATE acceptListing to pass proposedSlots ─────────────────────────
// Replace the existing acceptListing export with this:
 
/**
 * POST /api/device-sell/listings/:listingId/accept
 * Seller accepts a listing, optionally proposing pickup slots immediately.
 * @param {string} listingId
 * @param {Array<{ date: string, timeRange: string }>} [proposedSlots]
 */
export const acceptListing = (listingId, proposedSlots = []) =>
  request(`/device-sell/listings/${listingId}/accept`, {
    method: "POST",
    body:   JSON.stringify({ proposedSlots }),
  });

// ─── SELLER — BROWSE AVAILABLE LISTINGS ──────────────────────────

/**
 * GET /api/device-sell/listings
 * Sellers browse available (status:"available") device listings.
 * Controller hardcodes status:"available" — cannot be overridden.
 * @param {{ brand?, model?, category?, page?, limit? }} filters
 */
export const getListings = (filters = {}) =>
  request(`/device-sell/listings${buildQuery(filters)}`);

/**
 * GET /api/device-sell/listings/nearby
 * Sellers browse listings near a location.
 * Falls back to the seller's saved location if no coords given.
 * @param {{ latitude?, longitude?, radius?, category?, page?, limit? }} filters
 */
export const getNearbyListings = (filters = {}) =>
  request(`/device-sell/listings/nearby${buildQuery(filters)}`);

/**
 * GET /api/device-sell/my-accepted-listings
 * Returns all listings this seller accepted or completed.
 * Survives page refresh. Populated with listedBy user details.
 */
export const getMyAcceptedListings = () =>
  request(`/device-sell/my-accepted-listings`);

// ─── SELLER — ACTIONS ─────────────────────────────────────────────


/**
 * POST /api/device-sell/listings/:listingId/complete
 * Seller marks transaction complete after face-to-face inspection.
 */
export const completeListing = (listingId) =>
  request(`/device-sell/listings/${listingId}/complete`, { method: "POST" });

/**
 * POST /api/device-sell/listings/:listingId/reject
 * Seller rejects after inspection — listing goes back to "available".
 * @param {string} listingId
 * @param {string} [reason]
 */
export const rejectListing = (listingId, reason = "") =>
  request(`/device-sell/listings/${listingId}/reject`, {
    method: "POST",
    body:   JSON.stringify({ reason }),
  });

  /***FUTURE UPDATE
   * POST /api/device-sell/listings/:listingId/propose-new-price
   * Seller proposes a new price after inspection — user can accept or reject.
   * // export const proposeNewPrice = (listingId, newPrice, reason = "") =>
    //request(`/device-sell/listings/${listingId}/propose-new-price`, {
//     method: "POST",
//     body:   JSON.stringify({ newPrice, reason }),
//   });*/

  // ── Admin ─────────────────────────────────────────────────────────────────────
  // export const addBrandCatalog       = (body) => req("POST", "/device-sell/admin/catalog",           body);
  // export const updateEvaluationConfig = (body) => req("PUT",  "/device-sell/admin/evaluation-config", body);