import { useEffect } from "react";
import { useProductContext } from "../context/product.context";

// ─── Base hook — access everything ───────────────────────────────────────────

export const useProduct = () => useProductContext();

// ─── Fetch all products on mount ──────────────────────────────────────────────

export const useProducts = () => {
  const { products, loading, error, filters, fetchProducts } = useProductContext();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, filters };
};

// ─── Fetch by device type on mount ────────────────────────────────────────────

export const useProductsByDevice = (deviceType) => {
  const { products, loading, error, fetchByDeviceType } = useProductContext();

  useEffect(() => {
    if (deviceType) fetchByDeviceType(deviceType);
  }, [deviceType, fetchByDeviceType]);

  return { products, loading, error };
};

// ─── Fetch single product by ID on mount ─────────────────────────────────────

export const useProductDetail = (id) => {
  const { selectedProduct, loading, error, fetchProductById } = useProductContext();

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id]);

  return { product: selectedProduct, loading, error };
};

// ─── Filters ──────────────────────────────────────────────────────────────────

export const useProductFilters = () => {
  const { filters, updateFilter, resetFilters, fetchProducts } = useProductContext();

  const applyFilter = (newFilters) => {
    updateFilter(newFilters);
    fetchProducts(newFilters);
  };

  return { filters, applyFilter, resetFilters };
};

// ─── User's own listings ──────────────────────────────────────────────────────

export const useUserListings = () => {
  const { userListings, loading, error, fetchUserListings, addProductSeller, addProductUser, addProduct, editProduct, removeProduct } = useProductContext();

  useEffect(() => {
    fetchUserListings();
  }, [fetchUserListings]);

  return { userListings, loading, error, addProductSeller, addProductUser, addProduct, editProduct, removeProduct };
};