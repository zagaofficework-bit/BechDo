/**
 * subscription.context.jsx  ─ Optimized
 *
 * Changes vs original:
 *  - Shared run() helper
 *  - useCallback on all actions
 *  - useMemo on context value
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  getPlans,
  subscribe,
  getMySubscription,
  upgradePlan,
} from "../services/subscription.api";
import toast from "react-hot-toast";


// ─── Context ──────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext(null);

export const useSubscriptionContext = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscriptionContext must be inside <SubscriptionProvider>");
  return ctx;
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export const SubscriptionProvider = ({ children }) => {
  const [plans,       setPlans]       = useState([]);
  const [subscription,setSubscription]= useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);

  // ── Shared async runner ────────────────────────────────────────────────────
  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Something went wrong";
      setError(msg);
      throw err; // re-throw so PaymentPage can also catch it
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMsg(null);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const fetchPlans = useCallback(() =>
    run(async () => {
      const res = await getPlans();
      setPlans(res.plans ?? []);
    }).catch(() => {
      toast.error("Failed to load plans. Please refresh.");
    }),
  [run]);

  const subscribePlan = useCallback(({ plan, paymentMethod, paymentId }) =>
    run(async () => {
      const res = await subscribe({ plan, paymentMethod, paymentId });
      setSubscription(res.data ?? null);
      setSuccessMsg(res.message ?? "Subscribed successfully");
      return res;
    }),
  [run]);

  const fetchMySubscription = useCallback(() =>
    run(async () => {
      const res = await getMySubscription();
      setSubscription(res.data ?? null);
    }).catch((err) => {
      // 404 = no subscription yet, not a real error
      if (err?.response?.status === 404) setSubscription(null);
      toast.error("Failed to load subscription. Please refresh.");
    }),
  [run]);

  const upgrade = useCallback(({ plan, paymentMethod, paymentId }) =>
    run(async () => {
      const res = await upgradePlan({ plan, paymentMethod, paymentId });
      setSubscription(res.data ?? null);
      setSuccessMsg(res.message ?? "Plan upgraded successfully");
      return res;
    }),
  [run]);

  // ── Memoized context value ─────────────────────────────────────────────────
  const value = useMemo(() => ({
    plans,
    subscription,
    loading,
    error,
    successMsg,
    clearMessages,
    fetchPlans,
    subscribePlan,
    fetchMySubscription,
    upgrade,
  }), [
    plans, subscription, loading, error, successMsg,
    clearMessages, fetchPlans, subscribePlan, fetchMySubscription, upgrade,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};