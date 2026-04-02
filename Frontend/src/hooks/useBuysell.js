
import { useEffect } from "react";
import { useBuySellContext } from "../context/buysell.context";

// ── Base hook — access everything ─────────────────────────────────────────────
export const useBuySell = () => useBuySellContext();

// ── Seller: fetch pending orders on mount ─────────────────────────────────────
/**
 * Auto-loads pending orders when the component mounts.
 *
 * @example
 * const { pendingOrders, loading, confirmOrder, rejectOrder } = useSellerPendingOrders();
 */
export const useSellerPendingOrders = () => {
  const {
    pendingOrders,
    loading,
    error,
    fetchPendingOrders,
    confirmOrder,
    rejectOrder,
    changeOrderStatus,
  } = useBuySellContext();

  // fetchPendingOrders is stable (useCallback in context) → safe dep
  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders]);

  return {
    pendingOrders,
    loading,
    error,
    confirmOrder,
    rejectOrder,
    changeOrderStatus,
    refetch: fetchPendingOrders,
  };
};

// ── Fetch own order history on mount ──────────────────────────────────────────
/**
 * Auto-loads order history on mount. Pass initial filters as argument.
 *
 * @param {{ type?: string, status?: string, page?: number, limit?: number }} [filters={}]
 *
 * @example
 * const { myOrders, loading } = useMyOrders({ type: "buy" });
 */
export const useMyOrders = (filters = {}) => {
  const {
    myOrders,
    loading,
    error,
    pagination,
    fetchMyOrders,
    cancelOrder,
    changeOrderStatus,
  } = useBuySellContext();

  // We only want to re-fetch when the filter values change, not the object reference.
  // JSON.stringify is a simple way to compare plain-object filters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchMyOrders(filters);
  }, [JSON.stringify(filters), fetchMyOrders]);

  return {
    myOrders,
    loading,
    error,
    pagination,
    cancelOrder,
    changeOrderStatus,
    refetch: (newFilters = {}) => fetchMyOrders({ ...filters, ...newFilters }),
  };
};

// ── Place a buy order (product detail page) ───────────────────────────────────
/**
 * Does NOT auto-fetch. Call `placeOrder` manually on button click.
 *
 * @example
 * const { placeOrder, loading } = usePlaceOrder();
 * await placeOrder(productId, "UPI");
 */
export const usePlaceOrder = () => {
  const { placeOrder, loading, error } = useBuySellContext();
  return { placeOrder, loading, error };
};

// ── Seller order management ───────────────────────────────────────────────────
/**
 * Exposes confirm / reject / cancel / status-change without auto-fetching.
 * Compose with useSellerPendingOrders if you also need the list.
 *
 * @example
 * const { confirmOrder, rejectOrder, loading } = useOrderActions();
 */
export const useOrderActions = () => {
  const {
    confirmOrder,
    rejectOrder,
    cancelOrder,
    changeOrderStatus,
    loading,
    error,
  } = useBuySellContext();

  return { confirmOrder, rejectOrder, cancelOrder, changeOrderStatus, loading, error };
};