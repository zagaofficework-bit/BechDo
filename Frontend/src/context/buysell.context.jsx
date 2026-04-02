/**
 * buysell.context.jsx  ─ Optimized
 *
 * Changes vs original:
 *  - Shared `run()` helper eliminates repetitive try/catch blocks
 *  - All actions use useCallback with correct deps → stable references
 *  - Context value memoized → consumers don't re-render on unrelated changes
 *  - patchOrder extracted as useCallback so it's stable inside other callbacks
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  buyProduct as apiBuyProduct,
  confirmOrder as apiConfirmOrder,
  rejectOrder as apiRejectOrder,
  cancelOrder as apiCancelOrder,
  getSellerPendingOrders as apiGetSellerPendingOrders,
  getMyOrders as apiGetMyOrders,
  updateOrderStatus as apiUpdateOrderStatus,
} from "../services/buysell.api";
import toast from "react-hot-toast";

// ─── Context ──────────────────────────────────────────────────────────────────
const BuySellContext = createContext(null);

export const useBuySellContext = () => {
  const ctx = useContext(BuySellContext);
  if (!ctx)
    throw new Error("useBuySellContext must be inside <BuySellProvider>");
  return ctx;
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export const BuySellProvider = ({ children }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Shared async runner ────────────────────────────────────────────────────
  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err.message || "Something went wrong";
      setError(msg);
      toast.error(msg); // ← ADD
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Patch a single order in both lists after a status change ──────────────
  const patchOrder = useCallback((updatedOrder) => {
    const { _id: id, status } = updatedOrder;
    setPendingOrders((prev) =>
      status === "pending"
        ? prev.map((o) => (o._id === id ? updatedOrder : o))
        : prev.filter((o) => o._id !== id),
    );
    setMyOrders((prev) => prev.map((o) => (o._id === id ? updatedOrder : o)));
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Buyer places a new order */
  const placeOrder = useCallback(
    (productId, paymentMethod) =>
      run(async () => {
        const res = await apiBuyProduct(productId, paymentMethod);
        if (res?.data) setMyOrders((prev) => [res.data, ...prev]);
        return res?.data ?? null;
      }),
    [run],
  );

  /** Seller confirms a pending order */
  const confirmOrder = useCallback(
    (orderId) =>
      run(async () => {
        const res = await apiConfirmOrder(orderId);
        setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
        setMyOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "confirmed" } : o,
          ),
        );
        return res?.data ?? null;
      }),
    [run],
  );

  /** Seller rejects a pending order */
  const rejectOrder = useCallback(
    (orderId, reason = "") =>
      run(async () => {
        const res = await apiRejectOrder(orderId, reason);
        setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));
        setMyOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "rejected" } : o,
          ),
        );
        return res?.data ?? null;
      }),
    [run],
  );

  /** Buyer cancels their own pending order */
  const cancelOrder = useCallback(
    (orderId) =>
      run(async () => {
        const res = await apiCancelOrder(orderId);
        setMyOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: "cancelled" } : o,
          ),
        );
        return res?.data ?? null;
      }),
    [run],
  );

  /** Seller fetches all pending buy requests */
  const fetchPendingOrders = useCallback(
    () =>
      run(async () => {
        const res = await apiGetSellerPendingOrders();
        setPendingOrders(res?.orders ?? []);
        return res?.orders ?? [];
      }),
    [run],
  );

  /** Fetch own order history (buyer + seller combined) */
  const fetchMyOrders = useCallback(
    (filterParams = {}) =>
      run(async () => {
        const res = await apiGetMyOrders(filterParams);
        setMyOrders(res?.orders ?? []);
        setPagination(res?.pagination ?? {});
        return res?.orders ?? [];
      }),
    [run],
  );

  /** Update an order's status */
  const changeOrderStatus = useCallback(
    (orderId, status) =>
      run(async () => {
        const res = await apiUpdateOrderStatus(orderId, status);
        if (res?.data) patchOrder(res.data);
        return res?.data ?? null;
      }),
    [run, patchOrder],
  );

  // ── Memoized context value ─────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      pendingOrders,
      myOrders,
      pagination,
      loading,
      error,
      placeOrder,
      confirmOrder,
      rejectOrder,
      cancelOrder,
      fetchPendingOrders,
      fetchMyOrders,
      changeOrderStatus,
    }),
    [
      pendingOrders,
      myOrders,
      pagination,
      loading,
      error,
      placeOrder,
      confirmOrder,
      rejectOrder,
      cancelOrder,
      fetchPendingOrders,
      fetchMyOrders,
      changeOrderStatus,
    ],
  );

  return (
    <BuySellContext.Provider value={value}>{children}</BuySellContext.Provider>
  );
};
