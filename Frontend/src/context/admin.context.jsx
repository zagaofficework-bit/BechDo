/**
 * admin.context.jsx  ─ Optimized
 *
 * Changes vs original:
 *  - Shared `run()` helper replaces 7 copies of identical try/catch
 *  - All functions wrapped in useCallback → stable references for child hooks
 *  - Context value memoized with useMemo
 *  - Functional state updates used inside callbacks (safe for React 18 concurrent mode)
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getAllOrders,
  getSubscribedSellers,
  getSellerSubscriptionDetail,
  adminDeleteProduct,
  pauseSeller,
  banSeller,
  reinstateSeller,
} from "../services/admin.api";
import toast from "react-hot-toast";

// ─── Context ──────────────────────────────────────────────────────────────────
const AdminContext = createContext(null);

export const useAdminContext = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminContext must be inside <AdminProvider>");
  return ctx;
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export const AdminProvider = ({ children }) => {
  // Orders
  const [orders, setOrders] = useState([]);
  const [orderPagination, setOrderPagination] = useState({});
  const [commissionSummary, setCommissionSummary] = useState(null);

  // Sellers
  const [sellers, setSellers] = useState([]);
  const [sellerPagination, setSellerPagination] = useState({});
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Shared UI state
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

  // ── Orders ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(
    (filters = {}) =>
      run(async () => {
        const res = await getAllOrders(filters);
        setOrders(res.orders ?? []);
        setOrderPagination(res.pagination ?? {});
        setCommissionSummary(res.commissionSummary ?? null);
      }),
    [run],
  );

  // ── Sellers ────────────────────────────────────────────────────────────────
  const fetchSellers = useCallback(
    (filters = {}) =>
      run(async () => {
        const res = await getSubscribedSellers(filters);
        setSellers(res.sellers ?? []);
        setSellerPagination(res.pagination ?? {});
      }),
    [run],
  );

  const fetchSellerDetail = useCallback(
    (sellerId) =>
      run(async () => {
        const res = await getSellerSubscriptionDetail(sellerId);
        setSelectedSeller(res.data ?? null);
      }),
    [run],
  );

  const clearSelectedSeller = useCallback(() => setSelectedSeller(null), []);

  // ── Products ───────────────────────────────────────────────────────────────
  const deleteProduct = useCallback(
    (productId) =>
      run(async () => {
        await adminDeleteProduct(productId);
        return true; // caller should refetch products separately
      }),
    [run],
  );

  // ── Seller controls ────────────────────────────────────────────────────────

  // Helper: update a seller entry in the local list + detail panel
  const patchSellerLocally = useCallback(
    (sellerId, sellerPatch, subscriptionPatch) => {
      setSellers((prev) =>
        prev.map((s) =>
          s.seller.id === sellerId
            ? {
                ...s,
                seller: { ...s.seller, ...sellerPatch },
                subscription: { ...s.subscription, ...subscriptionPatch },
              }
            : s,
        ),
      );
      setSelectedSeller((prev) =>
        prev?.seller?.id === sellerId
          ? {
              ...prev,
              seller: { ...prev.seller, ...sellerPatch },
              subscription: { ...prev.subscription, ...subscriptionPatch },
            }
          : prev,
      );
    },
    [],
  );

  const pauseSellerAccount = useCallback(
    (sellerId, reason) =>
      run(async () => {
        const res = await pauseSeller(sellerId, reason);
        patchSellerLocally(
          sellerId,
          { accountStatus: "suspended" },
          { adminStatus: "paused" },
        );
        return res;
      }),
    [run, patchSellerLocally],
  );

  const banSellerAccount = useCallback(
    (sellerId, reason) =>
      run(async () => {
        const res = await banSeller(sellerId, reason);
        // Banned sellers are removed from the list view
        setSellers((prev) => prev.filter((s) => s.seller.id !== sellerId));
        setSelectedSeller((prev) =>
          prev?.seller?.id === sellerId
            ? { ...prev, seller: { ...prev.seller, accountStatus: "banned" } }
            : prev,
        );
        return res;
      }),
    [run],
  );

  const reinstateSellerAccount = useCallback(
    (sellerId, note = "") =>
      run(async () => {
        const res = await reinstateSeller(sellerId, note);
        patchSellerLocally(
          sellerId,
          { accountStatus: "active" },
          { adminStatus: "active" },
        );
        return res;
      }),
    [run, patchSellerLocally],
  );

  const clearError = useCallback(() => setError(null), []);

  // ── Memoized context value ─────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      orders,
      orderPagination,
      commissionSummary,
      sellers,
      sellerPagination,
      selectedSeller,
      loading,
      error,
      fetchOrders,
      fetchSellers,
      fetchSellerDetail,
      clearSelectedSeller,
      deleteProduct,
      pauseSellerAccount,
      banSellerAccount,
      reinstateSellerAccount,
      clearError,
    }),
    [
      orders,
      orderPagination,
      commissionSummary,
      sellers,
      sellerPagination,
      selectedSeller,
      loading,
      error,
      fetchOrders,
      fetchSellers,
      fetchSellerDetail,
      clearSelectedSeller,
      deleteProduct,
      pauseSellerAccount,
      banSellerAccount,
      reinstateSellerAccount,
      clearError,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};
