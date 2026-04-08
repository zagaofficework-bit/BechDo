// ─── profile.api.js ──────────────────────────────────────────────────────────
// Mirrors the same request/multipartRequest pattern from your existing api file.

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

const multipartRequest = async (endpoint, formData, method = "POST") => {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const getProfile       = ()           => request("/profile");
export const updateProfile    = (body)       => request("/profile", { method: "PUT", body: JSON.stringify(body) });
export const updateProfilePic = (file) => {
  const fd = new FormData();
  fd.append("profilePic", file);
  return multipartRequest("/profile/picture", fd, "PATCH");
};
export const deleteProfilePic = () => request("/profile/picture", { method: "DELETE" });

// ─── ADDRESSES ────────────────────────────────────────────────────────────────
export const getAddresses      = ()          => request("/profile/address");
export const addAddress        = (body)      => request("/profile/address", { method: "POST", body: JSON.stringify(body) });
export const updateAddress     = (id, body)  => request(`/profile/address/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteAddress     = (id)        => request(`/profile/address/${id}`, { method: "DELETE" });
export const setDefaultAddress = (id)        => request(`/profile/address/${id}/default`, { method: "PATCH" });