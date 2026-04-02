/**
 * product.context.jsx  ─ Fixed
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getAllProducts,
  getProductById,
  getProductsByDevice,
  searchProducts,
  getUserListings,
  createProductSeller,
  createProductUser,
  updateProduct,
  deleteProduct,
} from "../services/product.api";
import toast from "react-hot-toast";

// ─── Context ──────────────────────────────────────────────────────────────────
const ProductContext = createContext(null);

export const useProductContext = () => {
  const ctx = useContext(ProductContext);
  if (!ctx)
    throw new Error("useProductContext must be inside <ProductProvider>");
  return ctx;
};

// ─── Default filter shape ─────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  deviceType: "",
  brand: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  location: "",
  state: "",
  search: "",
  sortBy: "newest",
  page: 1,
  limit: 12,
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // ── Shared async runner ────────────────────────────────────────────────────
  // Centralises loading/error handling — every action uses this.
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

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const updateFilter = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(
    (overrideFilters = {}) =>
      run(async () => {
        const res = await getAllProducts({ ...filters, ...overrideFilters });
        setProducts(res.products ?? []);
        setPagination(res.pagination ?? {});
      }),
    [run, filters],
  );

  const fetchByDeviceType = useCallback(
    (deviceType, extraFilters = {}) =>
      run(async () => {
        const res = await getProductsByDevice(deviceType, {
          ...filters,
          ...extraFilters,
        });
        setProducts(res.products ?? []);
        setPagination(res.pagination ?? {});
      }),
    [run, filters],
  );

  const fetchProductById = useCallback(
    (id) =>
      run(async () => {
        const res = await getProductById(id);
        setSelectedProduct(res.product ?? res);
      }),
    [run],
  );

  const search = useCallback(
    (query) =>
      run(async () => {
        const res = await searchProducts(query, filters);
        setProducts(res.products ?? []);
        setPagination(res.pagination ?? {});
      }),
    [run, filters],
  );

  const fetchUserListings = useCallback(
    () =>
      run(async () => {
        const res = await getUserListings();
        setUserListings(res.products ?? []);
      }),
    [run],
  );

  const addProductSeller = useCallback(
    (productData) =>
      run(async () => {
        const res = await createProductSeller(productData);
        const newProduct = res.data ?? res.product ?? res;
        setProducts((prev) => [newProduct, ...prev]);
        setUserListings((prev) => [newProduct, ...prev]);
        return newProduct;
      }),
    [run],
  );

  const addProductUser = useCallback(
    (productData) =>
      run(async () => {
        const res = await createProductUser(productData);
        const newProduct = res.product ?? res;
        setProducts((prev) => [newProduct, ...prev]);
        setUserListings((prev) => [newProduct, ...prev]);
        return newProduct;
      }),
    [run],
  );

  const editProduct = useCallback(
    (id, updateData) =>
      run(async () => {
        const res = await updateProduct(id, updateData);

        // Try every known key, falling back to `res` only if it has `_id`
        const updated = res?.product ?? res?.data ?? (res?._id ? res : null);

        if (updated?._id) {
          // ── Optimistic local update: swap old product with new one ─────────
          setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
          setUserListings((prev) =>
            prev.map((p) => (p._id === id ? updated : p)),
          );
          setSelectedProduct((prev) => (prev?._id === id ? updated : prev));
        } else {
          // ── Fallback: backend didn't return the product — re-fetch the list ─
          // This guarantees the UI always matches the database, even if the
          // backend returns { success: true } with no product body.
          try {
            const fresh = await getUserListings();
            setUserListings(fresh.products ?? []);
          } catch {
            toast.error(
              "Product updated but failed to refresh listings. Please refresh the page.",
            );
          }
        }

        return updated;
      }),
    [run],
  );

  const removeProduct = useCallback(
    (id) =>
      run(async () => {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setUserListings((prev) => prev.filter((p) => p._id !== id));
      }),
    [run],
  );

  // ── Memoized context value ─────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      products,
      selectedProduct,
      userListings,
      pagination,
      loading,
      error,
      filters,
      updateFilter,
      resetFilters,
      fetchProducts,
      fetchByDeviceType,
      fetchProductById,
      search,
      fetchUserListings,
      addProductSeller,
      addProductUser,
      editProduct,
      removeProduct,
    }),
    [
      products,
      selectedProduct,
      userListings,
      pagination,
      loading,
      error,
      filters,
      updateFilter,
      resetFilters,
      fetchProducts,
      fetchByDeviceType,
      fetchProductById,
      search,
      fetchUserListings,
      addProductSeller,
      addProductUser,
      editProduct,
      removeProduct,
    ],
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};
