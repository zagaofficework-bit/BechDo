
import { useEffect } from "react";
import { useAdminContext } from "../context/admin.context";

// ── Base hook ─────────────────────────────────────────────────────────────────
export const useAdmin = () => useAdminContext();

// ── Orders ────────────────────────────────────────────────────────────────────
/**
 * Fetches all orders on mount.
 *
 * @param {object} [initialFilters={}]
 * @example
 * const { orders, fetchOrders } = useAdminOrders({ status: "pending" });
 */
export const useAdminOrders = (initialFilters = {}) => {
  const { orders, orderPagination, commissionSummary, loading, error, fetchOrders } = useAdminContext();

  // fetchOrders is stable (useCallback) → this effect runs only once
  useEffect(() => {
    fetchOrders(initialFilters);
    // initialFilters is intentionally excluded from deps — it's the "initial" load.
    // If callers want to re-fetch, they call fetchOrders() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders]);

  return { orders, orderPagination, commissionSummary, loading, error, fetchOrders };
};

// ── Sellers ───────────────────────────────────────────────────────────────────
/**
 * Fetches subscribed sellers on mount.
 *
 * @param {object} [initialFilters={}]
 * @example
 * const { sellers, fetchSellers } = useAdminSellers({ plan: "premium" });
 */
export const useAdminSellers = (initialFilters = {}) => {
  const { sellers, sellerPagination, loading, error, fetchSellers } = useAdminContext();

  useEffect(() => {
    fetchSellers(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSellers]);

  return { sellers, sellerPagination, loading, error, fetchSellers };
};

// ── Seller detail ─────────────────────────────────────────────────────────────
/**
 * Fetches full seller detail when sellerId is provided.
 * Cleans up (clears selectedSeller) when component unmounts.
 *
 * @param {string|null} sellerId
 */
export const useSellerDetail = (sellerId) => {
  const { selectedSeller, loading, error, fetchSellerDetail, clearSelectedSeller } = useAdminContext();

  useEffect(() => {
    if (sellerId) fetchSellerDetail(sellerId);
    return () => clearSelectedSeller();
    // Both fetch and clear are stable useCallback refs
  }, [sellerId, fetchSellerDetail, clearSelectedSeller]);

  return { seller: selectedSeller, loading, error };
};

// ── Seller controls ───────────────────────────────────────────────────────────
/**
 * Exposes pause / ban / reinstate actions.
 *
 * @example
 * const { pauseSeller, banSeller, reinstateSeller, loading } = useSellerControls();
 * await pauseSeller(sellerId, "Suspicious activity");
 */
export const useSellerControls = () => {
  const {
    loading,
    error,
    clearError,
    pauseSellerAccount,
    banSellerAccount,
    reinstateSellerAccount,
  } = useAdminContext();

  return {
    loading,
    error,
    clearError,
    pauseSeller:     pauseSellerAccount,
    banSeller:       banSellerAccount,
    reinstateSeller: reinstateSellerAccount,
  };
};

// ── Products ──────────────────────────────────────────────────────────────────
export const useAdminProducts = () => {
  const { deleteProduct, loading, error, clearError } = useAdminContext();
  return { deleteProduct, loading, error, clearError };
};

// ── Dashboard overview ────────────────────────────────────────────────────────
/**
 * Fetches recent orders + sellers simultaneously on mount.
 * Use this on the main admin dashboard page only.
 *
 * FIXED: Original passed `{ limit: 5 }` as inline objects inside useEffect,
 * which would be re-created every render. Here we define them outside.
 */
const DASHBOARD_ORDER_FILTERS  = { limit: 5 };
const DASHBOARD_SELLER_FILTERS = { limit: 5 };

export const useAdminDashboard = () => {
  const {
    orders,
    commissionSummary,
    sellers,
    loading,
    error,
    fetchOrders,
    fetchSellers,
  } = useAdminContext();

  useEffect(() => {
    fetchOrders(DASHBOARD_ORDER_FILTERS);
    fetchSellers(DASHBOARD_SELLER_FILTERS);
  }, [fetchOrders, fetchSellers]);

  return { orders, commissionSummary, sellers, loading, error };
};