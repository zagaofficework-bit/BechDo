import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProducts, getProductById, getUserListings,
  createProductSeller, updateProduct, deleteProduct,
} from "../services/product.api";

// ── Keys ─────────────────────────────────────────────────────────
export const productKeys = {
  all:     ["products"],
  list:    (filters) => ["products", "list", filters],
  detail:  (id)      => ["products", "detail", id],
  myList:  ()        => ["products", "my"],
};

// ── Fetch all with filters (replaces fetchProducts in context) ────
export const useProductsList = (filters = {}) =>
  useQuery({
    queryKey: productKeys.list(filters),
    queryFn:  () => getAllProducts(filters),
    select:   (data) => data.products ?? [],
  });

// ── Single product ────────────────────────────────────────────────
export const useProductDetail = (id) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn:  () => getProductById(id),
    enabled:  !!id,
    select:   (data) => data.data ?? data.product ?? data,
  });

// ── User's own listings ───────────────────────────────────────────
export const useMyListings = () =>
  useQuery({
    queryKey: productKeys.myList(),
    queryFn:  getUserListings,
    select:   (data) => data.products ?? [],
  });

// ── Create product (seller) ───────────────────────────────────────
export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProductSeller,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

// ── Edit product ──────────────────────────────────────────────────
export const useEditProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.myList() });
    },
  });
};

// ── Delete product ────────────────────────────────────────────────
export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};