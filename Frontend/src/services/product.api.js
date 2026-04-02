const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ─── JSON request (for non-file endpoints) ────────────────────────────────────
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

// ─── Multipart request (for endpoints that use multer / file uploads) ─────────
// Does NOT set Content-Type — browser sets it automatically with correct boundary
const multipartRequest = async (endpoint, formData, method = "POST") => {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // ⚠️ Do NOT set Content-Type here — multer needs the browser-generated
      // multipart/form-data boundary to parse files correctly
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── Build query string from filters ─────────────────────────────────────────
const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.deviceType) params.append("deviceType", filters.deviceType);
  if (filters.category)   params.append("category",   filters.category);
  if (filters.condition)  params.append("condition",  filters.condition);
  if (filters.brand)      params.append("brand",      filters.brand);
  if (filters.minPrice)   params.append("minPrice",   filters.minPrice);
  if (filters.maxPrice)   params.append("maxPrice",   filters.maxPrice);
  if (filters.location)   params.append("location",   filters.location);
  if (filters.state)      params.append("state",      filters.state);
  if (filters.search)     params.append("search",     filters.search);
  if (filters.sortBy)     params.append("sortBy",     filters.sortBy);
  if (filters.page)       params.append("page",       filters.page);
  if (filters.limit)      params.append("limit",      filters.limit);

  const query = params.toString();
  return query ? `?${query}` : "";
};

// ─── Build FormData from product payload ─────────────────────────────────────
// Your multer middleware expects:
//   - req.files.images[]  → array of image File objects
//   - req.files.video     → single video File object (optional)
//   - req.body.*          → all other text fields (title, price, specs JSON, etc.)
//
// specs must be sent as a JSON string under the key "specs"
// because multipart bodies don't support nested objects natively

export const buildProductFormData = ({
  title, description, category, subcategory, brand,
  deviceType, condition, storage, color,
  price, originalPrice, payment,
  city, state, pincode, address,
  latitude, longitude,
  images,   // File[]
  video,    // File | null
  specs,    // plain JS object — will be JSON.stringify'd
}) => {
  const fd = new FormData();

  // ── Text fields ─────────────────────────────────────────────────────────
  if (title)         fd.append("title",         title);
  if (description)   fd.append("description",   description);
  if (category)      fd.append("category",      category);
  if (subcategory)   fd.append("subcategory",   subcategory);
  if (brand)         fd.append("brand",         brand);
  if (deviceType)    fd.append("deviceType",    deviceType);
  if (condition)     fd.append("condition",     condition);
  if (storage)       fd.append("storage",       storage);
  if (color)         fd.append("color",         color);
  if (price)         fd.append("price",         String(price));
  if (originalPrice) fd.append("originalPrice", String(originalPrice));
  if (payment)       fd.append("payment",       payment);
  if (city)          fd.append("city",          city);
  if (state)         fd.append("state",         state);
  if (pincode)       fd.append("pincode",       pincode);
  if (address)       fd.append("address",       address);
  if (latitude)      fd.append("latitude",      String(latitude));
  if (longitude)     fd.append("longitude",     String(longitude));

  // ── Specs — sent as JSON string, parsed by controller ───────────────────
  // controller does: specs = JSON.parse(req.body.specs)
  if (specs && Object.keys(specs).length > 0) {
    fd.append("specs", JSON.stringify(specs));
  }

  // ── Files ────────────────────────────────────────────────────────────────
  // multer field name must be "images" (array) — matches productUpload config
  if (images?.length > 0) {
    images.forEach((file) => fd.append("images", file));
  }

  // multer field name must be "video" (single)
  if (video) {
    fd.append("video", video);
  }

  return fd;
};

// ─── API Exports ──────────────────────────────────────────────────────────────

// GET /products?filters...
export const getAllProducts = (filters) =>
  request(`/products${buildQuery(filters)}`);

// GET /products/:id
export const getProductById = (id) =>
  request(`/products/${id}`);

// GET /products?deviceType=...&filters...
export const getProductsByDevice = (type, filters) =>
  request(`/products${buildQuery({ ...filters, deviceType: type })}`);

// GET /products?search=...
export const searchProducts = (q, filters) =>
  request(`/products${buildQuery({ ...filters, search: q })}`);

// GET /products/my/listings
export const getUserListings = () =>
  request(`/products/my/listings`);

// POST /products/seller/create — multipart (images + video + text + specs JSON)
// productData must be the raw payload object; this function builds FormData internally
export const createProductSeller = (productData) => {
  const fd = buildProductFormData(productData);
  return multipartRequest(`/products/seller/create`, fd, "POST");
};

// POST /products/user/create — multipart (images + video + text, old devices only)
// Note: user listings don't send specs (no subscription, old devices only)
export const createProductUser = (productData) => {
  const fd = buildProductFormData(productData);
  return multipartRequest(`/products/user/create`, fd, "POST");
};

// PUT /products/:id — multipart (may include new images/video)
export const updateProduct = (id, productData) => {
  const fd = buildProductFormData(productData);
  return multipartRequest(`/products/${id}`, fd, "PUT");
};

// PATCH /products/:id/specs — JSON only (no files)
// body: { performance, display, rearCamera, frontCamera, battery, storageType }
export const upsertProductSpecs = (id, specsBody) =>
  request(`/products/${id}/specs`, {
    method: "PATCH",
    body: JSON.stringify(specsBody),
  });

// DELETE /products/:id
export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: "DELETE" });