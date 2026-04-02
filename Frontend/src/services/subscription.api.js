import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// ─── Attach auth token to every request ────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── GET /subscriptions/plans — public ─────────────────────────────────────
export const getPlans = async () => {
  const { data } = await API.get("/subscriptions/plans");
  return data; // { success, plans[] }
};

// ─── POST /subscriptions — user subscribes & auto-becomes seller ────────────
// payload: { plan, paymentMethod, paymentId }
export const subscribe = async (payload) => {
  const { data } = await API.post("/subscriptions", payload);
  return data; // { success, message, data: subscription }
};

// ─── GET /subscriptions/my — seller's active subscription ──────────────────
export const getMySubscription = async () => {
  const { data } = await API.get("/subscriptions/my");
  return data; // { success, data: { ...subscription, isExpired, daysRemaining } }
};

// ─── PUT /subscriptions/upgrade — seller upgrades plan ─────────────────────
// payload: { plan, paymentMethod, paymentId }
export const upgradePlan = async (payload) => {
  const { data } = await API.put("/subscriptions/upgrade", payload);
  return data; // { success, message, data: subscription }
};