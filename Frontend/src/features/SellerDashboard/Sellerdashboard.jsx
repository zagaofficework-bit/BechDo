import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { io as socketIO } from "socket.io-client";

import { useProductContext } from "../../context/product.context";
import { useAuth } from "../../hooks/useAuth";
import { useSellerPendingOrders } from "../../hooks/useBuySell";
import { useSubscriptionContext } from "../../context/subscription.context";
import BackButton from "../common/BackButton";

import {
  getMessages as apiGetMessages,
  sendMessage as apiSendMessage,
  deleteMessage as apiDeleteMessage,
} from "../../services/message.api";

import {
  getListings,
  getMyAcceptedListings,
  acceptListing,
  completeListing,
  rejectListing,
  dismissListing, // ← new
} from "../../services/deviceSell.api";
import ProposeSlotModal from "../User-Sell/components/ProposeSlotModal";

// ─── App config ───────────────────────────────────────────────────────────────
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const PLAN_CONFIG = {
  basic: {
    label: "Basic",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    supportTypes: [],
    gradient: "from-slate-50 to-slate-100",
    badgeGlow: "",
  },
  standard: {
    label: "Standard",
    color: "bg-blue-50 text-[#1132d4] border-blue-200",
    iconBg: "bg-blue-50",
    iconColor: "text-[#1132d4]",
    supportTypes: ["email"],
    gradient: "from-blue-50 to-indigo-50",
    badgeGlow: "shadow-[0_0_12px_rgba(17,50,212,0.15)]",
  },
  premium: {
    label: "Premium",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    supportTypes: ["call", "chat"],
    gradient: "from-amber-50 to-yellow-50",
    badgeGlow: "shadow-[0_0_14px_rgba(245,158,11,0.2)]",
  },
};

const normalisePlan = (raw) =>
  raw ? String(raw).toLowerCase().replace(/\s+/g, "") : "basic";

const CONDITION_STYLES = {
  "like-new": "bg-emerald-50 text-emerald-700 border-emerald-200",
  excellent: "bg-blue-50 text-blue-700 border-blue-200",
  good: "bg-amber-50 text-amber-700 border-amber-200",
  Good: "bg-amber-50 text-amber-700 border-amber-200",
  fair: "bg-orange-50 text-orange-700 border-orange-200",
  Fair: "bg-orange-50 text-orange-700 border-orange-200",
  Superb: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_STYLES = {
  available: "bg-emerald-50 text-emerald-700",
  active: "bg-emerald-50 text-emerald-700",
  sold: "bg-slate-100 text-slate-500",
  reserved: "bg-blue-50 text-blue-600",
  inactive: "bg-red-50 text-red-600",
};

const LISTING_STATUS = {
  available: {
    label: "Available",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  accepted: {
    label: "Accepted",
    bg: "bg-blue-50 border-blue-200",
    text: "text-[#1132d4]",
    dot: "bg-[#1132d4]",
  },
  completed: {
    label: "Completed",
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-50 border-red-200",
    text: "text-red-500",
    dot: "bg-red-400",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-orange-50 border-orange-200",
    text: "text-orange-600",
    dot: "bg-orange-500",
  },
};

const CATEGORIES = ["mobile", "laptop", "tablet", "smartwatch", "television"];
const DEVICE_TYPES = ["new", "refurbished", "old"];
const CONDITIONS = ["Fair", "Good", "Superb"];

const discountPct = (price, orig) =>
  price && orig && orig > price
    ? Math.round(((orig - price) / orig) * 100)
    : null;
const formatINR = (n) =>
  n?.toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const PlusIcon = () => <Icon path="M12 4v16m8-8H4" />;
const OrdersIcon = () => (
  <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
);
const EditIcon = () => (
  <Icon
    path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    className="w-4 h-4"
  />
);
const TrashIcon = () => (
  <Icon
    path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    className="w-4 h-4"
  />
);
const MailIcon = () => (
  <Icon
    path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    className="w-4 h-4"
  />
);
const PhoneIcon = () => (
  <Icon
    path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    className="w-4 h-4"
  />
);
const LocationIcon = () => (
  <Icon
    path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    className="w-4 h-4"
  />
);
const PackageIcon = () => (
  <Icon
    path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    className="w-5 h-5"
  />
);
const ChevronRight = () => <Icon path="M9 5l7 7-7 7" className="w-4 h-4" />;
const CrownIcon = () => (
  <Icon
    path="M5 3l3.5 7L12 4l3.5 6L19 3l1 8H4l1-8z M4 11h16v2H4z"
    className="w-4 h-4"
  />
);
const ChatIcon = () => (
  <Icon
    path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    className="w-5 h-5"
  />
);
const SendIcon = () => (
  <Icon path="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" className="w-4 h-4" />
);
const CloseIcon = () => (
  <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
);
const CallIcon = () => (
  <Icon
    path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    className="w-4 h-4"
  />
);
const SaveIcon = () => (
  <Icon
    path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    className="w-4 h-4"
  />
);
const ImageIcon = () => (
  <Icon
    path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    className="w-5 h-5"
  />
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = "w-4 h-4" }) => (
  <svg className={`${size} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="white"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="white"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

// ─── EditProductModal, StatCard, ProductRow, SkeletonRow ──────────────────────
// (unchanged from previous version — keeping full code intact)

const MI = ({ label, required, error, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    <input
      className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-[#1132d4]/10 transition-all
        ${error ? "border-red-300 bg-red-50 focus:border-red-400" : "border-slate-200 bg-slate-50 focus:border-[#1132d4] focus:bg-white"}`}
      {...props}
    />
    {error && (
      <p className="text-xs text-red-500 font-medium mt-0.5">{error}</p>
    )}
  </div>
);

const MS = ({ label, required, children, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    <select
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800
        focus:outline-none focus:border-[#1132d4] focus:bg-white focus:ring-2 focus:ring-[#1132d4]/10 transition-all"
      {...props}
    >
      {children}
    </select>
  </div>
);

const MSec = ({ children }) => (
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 mb-3">
    {children}
  </p>
);

const EditProductModal = memo(({ product, onClose, onSaved }) => {
  const { editProduct, loading: ctxLoading } = useProductContext();
  const [tab, setTab] = useState("details");
  const [form, setForm] = useState({
    title: product.title ?? "",
    description: product.description ?? "",
    category: product.category ?? "",
    subcategory: product.subcategory ?? "",
    brand: product.brand ?? "",
    deviceType: product.deviceType ?? "",
    condition: product.condition ?? "",
    storage: product.storage ?? "",
    color: product.color ?? "",
    price: product.price ?? "",
    originalPrice: product.originalPrice ?? "",
    city: product.address?.city ?? product.city ?? "",
    state: product.address?.state ?? product.state ?? "",
    pincode: product.address?.pincode ?? product.pincode ?? "",
    address:
      product.address?.full ??
      (typeof product.address === "string" ? product.address : "") ??
      "",
  });
  const s = product.specs || {};
  const [specs, setSpecs] = useState({
    chipsetFull: s.performance?.chipsetFull ?? "",
    ram: s.performance?.ram ?? "",
    sizeInches: s.display?.sizeInches ?? "",
    sizeCm: s.display?.sizeCm ?? "",
    displayType: s.display?.type ?? "",
    resolution: s.display?.resolution ?? "",
    resolutionType: s.display?.resolutionType ?? "",
    refreshRate: s.display?.refreshRate ?? "",
    primaryCam: s.rearCamera?.primary ?? "",
    secondaryCam: s.rearCamera?.secondary ?? "",
    tertiaryCam: s.rearCamera?.tertiary ?? "",
    quaternaryCam: s.rearCamera?.quaternary ?? "",
    frontCamera: s.frontCamera ?? "",
    capacity: s.battery?.capacity ?? "",
    wiredCharging: s.battery?.wiredCharging ?? "",
    storageType: s.storageType ?? "",
  });
  const [existingImages, setExistingImages] = useState(product.images ?? []);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const imgRef = useRef();

  const setF = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: null }));
  };
  const setS = (k) => (e) => setSpecs((p) => ({ ...p, [k]: e.target.value }));

  const handleAddImages = (e) => {
    const remaining = 5 - existingImages.length - newImageFiles.length;
    if (remaining <= 0) return;
    const toAdd = Array.from(e.target.files).slice(0, remaining);
    setNewImageFiles((p) => [...p, ...toAdd]);
    setNewImagePreviews((p) => [
      ...p,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.category) e.category = "Select a category";
    if (!form.condition) e.condition = "Select a condition";
    if (!form.price) e.price = "Price is required";
    else if (isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Enter a valid price";
    if (existingImages.length + newImageFiles.length === 0)
      e.images = "At least 1 image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setTab("details");
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      const specsPayload = {
        performance: {
          chipsetFull: specs.chipsetFull || null,
          ram: specs.ram || null,
        },
        display: {
          sizeInches: specs.sizeInches || null,
          sizeCm: specs.sizeCm || null,
          type: specs.displayType || null,
          resolution: specs.resolution || null,
          resolutionType: specs.resolutionType || null,
          refreshRate: specs.refreshRate || null,
        },
        rearCamera: {
          primary: specs.primaryCam || null,
          secondary: specs.secondaryCam || null,
          tertiary: specs.tertiaryCam || null,
          quaternary: specs.quaternaryCam || null,
        },
        frontCamera: specs.frontCamera || null,
        battery: {
          capacity: specs.capacity || null,
          wiredCharging: specs.wiredCharging || null,
        },
        storageType: specs.storageType || null,
      };
      await editProduct(product._id, {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice
          ? Number(form.originalPrice)
          : undefined,
        specs: specsPayload,
        existingImages: JSON.stringify(existingImages),
        images: newImageFiles.length > 0 ? newImageFiles : undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const totalImages = existingImages.length + newImageFiles.length;
  const discount = discountPct(Number(form.price), Number(form.originalPrice));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_80px_rgba(17,50,212,0.18)] overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1132d4] to-[#3b5ef5] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <EditIcon />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Edit Listing
              </h2>
              <p className="text-blue-200 text-xs truncate max-w-[260px]">
                {product.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 bg-white flex-shrink-0">
          {[
            { key: "details", label: "📋 Product Details" },
            { key: "specs", label: "⚡ Tech Specs" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-x border-t ${tab === key ? "bg-slate-50 border-slate-200 text-[#1132d4] -mb-px z-10" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 bg-slate-50 border-t border-slate-200">
          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              <span>⚠️</span>
              <span className="flex-1">{apiError}</span>
              <button onClick={() => setApiError(null)}>
                <CloseIcon />
              </button>
            </div>
          )}
          {tab === "details" && (
            <div className="space-y-5">
              <div className="space-y-4">
                <MSec>Basic Information</MSec>
                <MI
                  label="Product Title"
                  required
                  value={form.title}
                  onChange={setF("title")}
                  placeholder="e.g. Samsung Galaxy S24 Ultra"
                  error={errors.title}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={setF("description")}
                    placeholder="Condition, accessories included…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1132d4] focus:bg-white focus:ring-2 focus:ring-[#1132d4]/10 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={setF("category")}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/10 transition-all ${errors.category ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-[#1132d4] focus:bg-white"}`}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.category}
                      </p>
                    )}
                  </div>
                  <MI
                    label="Subcategory"
                    value={form.subcategory}
                    onChange={setF("subcategory")}
                    placeholder="e.g. Galaxy S, Pixel"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <MI
                    label="Brand"
                    value={form.brand}
                    onChange={setF("brand")}
                    placeholder="e.g. Samsung"
                  />
                  <MS
                    label="Device Type"
                    value={form.deviceType}
                    onChange={setF("deviceType")}
                  >
                    <option value="">Select type</option>
                    {DEVICE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </MS>
                </div>
              </div>
              <div className="space-y-4">
                <MSec>Device Details</MSec>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Condition <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.condition}
                      onChange={setF("condition")}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/10 transition-all ${errors.condition ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 focus:border-[#1132d4] focus:bg-white"}`}
                    >
                      <option value="">Select</option>
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <MI
                    label="Storage"
                    value={form.storage}
                    onChange={setF("storage")}
                    placeholder="e.g. 256GB"
                  />
                  <MI
                    label="Color"
                    value={form.color}
                    onChange={setF("color")}
                    placeholder="e.g. Black"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <MSec>Pricing &amp; Payment</MSec>
                <div className="grid grid-cols-3 gap-4">
                  <MI
                    label="Selling Price (₹)"
                    required
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={setF("price")}
                    placeholder="120000"
                    error={errors.price}
                  />
                  <MI
                    label="Original / MRP (₹)"
                    type="number"
                    min="0"
                    value={form.originalPrice}
                    onChange={setF("originalPrice")}
                    placeholder="139999"
                  />
                </div>
                {discount && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <span className="text-emerald-600 font-bold text-sm">
                      🎉 {discount}% discount
                    </span>
                    <span className="text-slate-400 text-xs">
                      — buyer saves ₹
                      {formatINR(
                        Number(form.originalPrice) - Number(form.price),
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <MSec>Product Images ({totalImages}/5)</MSec>
                {errors.images && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠ {errors.images}
                  </p>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((url, i) => (
                    <div
                      key={`e-${i}`}
                      className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        Saved
                      </div>
                      <button
                        onClick={() =>
                          setExistingImages((p) =>
                            p.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex font-bold shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {newImagePreviews.map((src, i) => (
                    <div
                      key={`n-${i}`}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[#1132d4]/40 shadow-sm"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1 bg-[#1132d4] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        New
                      </div>
                      <button
                        onClick={() => {
                          setNewImageFiles((p) =>
                            p.filter((_, idx) => idx !== i),
                          );
                          setNewImagePreviews((p) =>
                            p.filter((_, idx) => idx !== i),
                          );
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex font-bold shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {totalImages < 5 && (
                    <div
                      onClick={() => imgRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1132d4] flex flex-col items-center justify-center gap-1 cursor-pointer text-slate-400 hover:text-[#1132d4] hover:bg-blue-50/40 transition-colors bg-white"
                    >
                      <ImageIcon />
                      <span className="text-[10px] font-semibold">Add</span>
                    </div>
                  )}
                </div>
                <input
                  ref={imgRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddImages}
                />
              </div>
            </div>
          )}
          {tab === "specs" && (
            <div className="space-y-5">
              <div className="space-y-3">
                <MSec>🧠 Performance</MSec>
                <div className="grid grid-cols-2 gap-4">
                  <MI
                    label="Chipset"
                    value={specs.chipsetFull}
                    onChange={setS("chipsetFull")}
                    placeholder="e.g. Snapdragon 8 Elite"
                  />
                  <MI
                    label="RAM"
                    value={specs.ram}
                    onChange={setS("ram")}
                    placeholder="e.g. 12 GB"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <MSec>🖥️ Display</MSec>
                <div className="grid grid-cols-3 gap-4">
                  <MI
                    label="Size (inches)"
                    value={specs.sizeInches}
                    onChange={setS("sizeInches")}
                    placeholder="6.9 inches"
                  />
                  <MI
                    label="Size (cm)"
                    value={specs.sizeCm}
                    onChange={setS("sizeCm")}
                    placeholder="17.53 cm"
                  />
                  <MI
                    label="Display Type"
                    value={specs.displayType}
                    onChange={setS("displayType")}
                    placeholder="AMOLED 2x"
                  />
                  <MI
                    label="Resolution"
                    value={specs.resolution}
                    onChange={setS("resolution")}
                    placeholder="1440x3120 px"
                  />
                  <MI
                    label="Resolution Type"
                    value={specs.resolutionType}
                    onChange={setS("resolutionType")}
                    placeholder="QHD+"
                  />
                  <MI
                    label="Refresh Rate"
                    value={specs.refreshRate}
                    onChange={setS("refreshRate")}
                    placeholder="120 Hz"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <MSec>📷 Camera</MSec>
                <div className="grid grid-cols-2 gap-4">
                  <MI
                    label="Primary Rear"
                    value={specs.primaryCam}
                    onChange={setS("primaryCam")}
                    placeholder="200 MP"
                  />
                  <MI
                    label="Secondary Rear"
                    value={specs.secondaryCam}
                    onChange={setS("secondaryCam")}
                    placeholder="10 MP"
                  />
                  <MI
                    label="Tertiary Rear"
                    value={specs.tertiaryCam}
                    onChange={setS("tertiaryCam")}
                    placeholder="8 MP"
                  />
                  <MI
                    label="Quaternary Rear"
                    value={specs.quaternaryCam}
                    onChange={setS("quaternaryCam")}
                    placeholder="50 MP"
                  />
                  <div className="col-span-2">
                    <MI
                      label="Front Camera"
                      value={specs.frontCamera}
                      onChange={setS("frontCamera")}
                      placeholder="12 MP"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <MSec>🔋 Battery</MSec>
                <div className="grid grid-cols-2 gap-4">
                  <MI
                    label="Capacity"
                    value={specs.capacity}
                    onChange={setS("capacity")}
                    placeholder="5000 mAh"
                  />
                  <MI
                    label="Wired Charging"
                    value={specs.wiredCharging}
                    onChange={setS("wiredCharging")}
                    placeholder="60W Super Fast"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <MSec>💾 Storage</MSec>
                <div className="max-w-xs">
                  <MI
                    label="Storage Type"
                    value={specs.storageType}
                    onChange={setS("storageType")}
                    placeholder="UFS 4.0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-white flex-shrink-0">
          <span className="text-xs text-slate-400 font-mono hidden sm:block">
            #{product._id?.slice(-8).toUpperCase()}
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || ctxLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1132d4] hover:bg-[#0d28b8] text-white text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? (
                <>
                  <Spinner size="w-3.5 h-3.5" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <SaveIcon />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
EditProductModal.displayName = "EditProductModal";

const StatCard = memo(({ label, value, sub, icon, accent }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.06)] p-5 flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}
    >
      {icon}
    </div>
    <div>
      <p
        className="text-2xl font-extrabold text-slate-800"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      {sub && (
        <p className="text-xs text-[#1132d4] font-semibold mt-0.5">{sub}</p>
      )}
    </div>
  </div>
));
StatCard.displayName = "StatCard";

const ProductRow = memo(({ product, onDelete, onEdit }) => {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;
  return (
    <div className="group flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 hover:border-[#1132d4]/30 hover:shadow-[0_4px_20px_rgba(17,50,212,0.07)] transition-all duration-200">
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl opacity-40">📱</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-xs font-bold text-[#1132d4] tracking-wider uppercase">
            {product.brand}
          </p>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CONDITION_STYLES[product.condition] || "bg-slate-100 text-slate-500 border-slate-200"}`}
          >
            {product.condition}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[product.status] || "bg-slate-100 text-slate-500"}`}
          >
            {product.status}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
          {product.title}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-base font-extrabold text-slate-900">
            ₹{product.price?.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-slate-400 line-through">
              ₹{product.originalPrice?.toLocaleString()}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-emerald-600">
              {discount}% off
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#1132d4] hover:text-[#1132d4] hover:bg-blue-50 transition-all"
          onClick={() => onEdit(product)}
          title="Edit listing"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(product._id)}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
});
ProductRow.displayName = "ProductRow";

const SkeletonRow = () => (
  <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 animate-pulse">
    <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-100 rounded w-1/4" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  </div>
);

const SubscriptionRow = memo(
  ({ planKey, onOpenChat, unreadCount = 0, isSuperSeller = false }) => {
    const cfg = PLAN_CONFIG[planKey] || PLAN_CONFIG.basic;
    const borderClass =
      {
        premium: "border-amber-200",
        standard: "border-blue-200",
        basic: "border-slate-200",
      }[planKey] || "border-slate-200";
    return (
      <div
        className={`sm:col-span-2 flex items-center gap-3 bg-gradient-to-r ${cfg.gradient} rounded-xl px-3 py-2.5 border ${borderClass}`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}
        >
          <span className={cfg.iconColor}>
            <CrownIcon />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-medium">
            Subscription Plan
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${cfg.color} ${cfg.badgeGlow}`}
            >
              {cfg.label}
            </span>
            {cfg.supportTypes.length === 0 ? (
              <span className="text-xs text-slate-400 font-medium">
                No support included
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Support:</span>
                {cfg.supportTypes.map((type) => (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${type === "email" ? "bg-blue-50 text-[#1132d4] border border-blue-200" : type === "call" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                  >
                    {type === "email" && <MailIcon />}
                    {type === "call" && <CallIcon />}
                    {type === "chat" && <ChatIcon />}
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isSuperSeller && cfg.supportTypes.includes("email") && (
            <a
              href="mailto:support@phonify.in"
              className="flex items-center gap-1 text-xs font-semibold text-[#1132d4] border border-[#1132d4]/30 bg-white hover:bg-[#1132d4] hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
            >
              <MailIcon /> Email
            </a>
          )}
          {!isSuperSeller && cfg.supportTypes.includes("call") && (
            <a
              href="tel:+918000000000"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-white hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
            >
              <CallIcon /> Call
            </a>
          )}
          {!isSuperSeller && cfg.supportTypes.includes("chat") && (
            <button
              onClick={onOpenChat}
              className="relative flex items-center gap-1.5 text-xs font-semibold text-amber-700 border border-amber-200 bg-white hover:bg-amber-500 hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
            >
              <ChatIcon /> Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1 border border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
          {planKey === "basic" && (
            <button className="flex items-center gap-1 text-xs font-semibold text-[#1132d4] border border-[#1132d4]/30 bg-white hover:bg-[#1132d4] hover:text-white px-2.5 py-1.5 rounded-lg transition-all">
              <ChevronRight /> Upgrade
            </button>
          )}
        </div>
      </div>
    );
  },
);
SubscriptionRow.displayName = "SubscriptionRow";

// ─── ChatModal (unchanged) ────────────────────────────────────────────────────
// Keeping the exact same ChatModal from the document — no changes needed
const ChatModal = ({ onClose, sellerName, sellerId, adminId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimer = useRef(null);
  const imgInputRef = useRef(null);

  useEffect(() => {
    if (!adminId) {
      setError("Admin not found.");
      setFetching(false);
      return;
    }
    apiGetMessages(adminId)
      .then((res) => {
        setMessages(res.messages ?? []);
        setRoomId(res.roomId);
      })
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
    const socket = socketIO(SOCKET_URL, {
      auth: { token: localStorage.getItem("accessToken") },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      const room = [sellerId, adminId].map(String).sort().join("_");
      socket.emit("joinRoom", room);
    });
    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const hasOptimistic = prev.some((m) => m._optimistic);
        if (
          hasOptimistic &&
          msg.from?._id?.toString() === sellerId?.toString()
        ) {
          let replaced = false;
          return prev.map((m) => {
            if (!replaced && m._optimistic) {
              replaced = true;
              return msg;
            }
            return m;
          });
        }
        return [...prev, msg];
      });
    });
    socket.on("messageDeleted", ({ messageId }) =>
      setMessages((prev) => prev.filter((m) => m._id !== messageId)),
    );
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    return () => {
      socket.disconnect();
      clearTimeout(typingTimer.current);
    };
  }, [adminId, sellerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!roomId || !socketRef.current) return;
    socketRef.current.emit("typing", roomId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socketRef.current?.emit("stopTyping", roomId),
      1500,
    );
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };
  const clearImage = () => {
    setImgFile(null);
    setImgPreview(null);
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !imgFile) || sending || !adminId) return;
    setSending(true);
    setError(null);
    const optimisticMsg = {
      _id: `opt_${Date.now()}`,
      from: { _id: sellerId, firstname: sellerName },
      to: { _id: adminId },
      message: text,
      image: imgPreview ?? "",
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    clearImage();
    socketRef.current?.emit("stopTyping", roomId);
    try {
      const res = await apiSendMessage(adminId, text, imgFile);
      setMessages((prev) =>
        prev.map((m) => (m._id === optimisticMsg._id ? res.data : m)),
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await apiDeleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      setError(err.message || "Failed to delete message");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const isOwnMessage = (msg) =>
    msg.from?._id?.toString() === sellerId?.toString() || msg._optimistic;
  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_24px_80px_rgba(17,50,212,0.18)] flex flex-col overflow-hidden"
        style={{ height: "min(600px, 90vh)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#1132d4] to-[#3b5ef5] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-white font-extrabold text-sm">
                Phonify Admin Support
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-blue-200 text-xs">
                  {isTyping ? "Admin is typing…" : "Support Chat"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-600 font-medium flex items-center justify-between flex-shrink-0">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-2"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {fetching ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-6 h-6 border-2 border-[#1132d4]/30 border-t-[#1132d4] rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-1 text-[#1132d4]">
                <ChatIcon />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Start a conversation
              </p>
              <p className="text-xs text-slate-400">
                Send a message to the Phonify admin support team
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const own = isOwnMessage(msg);
              return (
                <div
                  key={msg._id || `idx-${i}`}
                  className={`flex ${own ? "justify-end" : "justify-start"} group`}
                >
                  {!own && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1132d4] to-[#3b5ef5] flex items-center justify-center flex-shrink-0 mr-2 mt-auto shadow-sm">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                  )}
                  <div className="max-w-[75%] flex flex-col gap-0.5">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${own ? "bg-[#1132d4] text-white rounded-br-md shadow-[0_2px_8px_rgba(17,50,212,0.3)]" : "bg-white text-slate-700 border border-slate-100 rounded-bl-md shadow-sm"} ${msg._optimistic ? "opacity-70" : ""}`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="attachment"
                          className="rounded-xl mb-2 max-w-full max-h-40 object-cover"
                        />
                      )}
                      {msg.message && (
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${own ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-xs text-slate-400">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg._optimistic && (
                        <span className="text-xs text-slate-400">Sending…</span>
                      )}
                      {own && !msg._optimistic && (
                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="text-xs text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete message"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && !fetching && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1132d4] to-[#3b5ef5] flex items-center justify-center flex-shrink-0 mr-2 mt-auto shadow-sm">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
                {[0, 1, 2].map((j) => (
                  <span
                    key={j}
                    className="w-1.5 h-1.5 rounded-full bg-[#1132d4]/50 animate-bounce"
                    style={{ animationDelay: `${j * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {imgPreview && (
          <div className="px-4 pt-2 pb-1 bg-white border-t border-slate-100 flex items-center gap-2 flex-shrink-0">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
              <img
                src={imgPreview}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={clearImage}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/60 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 truncate">{imgFile?.name}</p>
          </div>
        )}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-[#1132d4] focus-within:ring-2 focus-within:ring-[#1132d4]/10 transition-all">
            <button
              onClick={() => imgInputRef.current?.click()}
              className="flex-shrink-0 text-slate-400 hover:text-[#1132d4] transition-colors pb-0.5"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder="Message Phonify support…"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none resize-none leading-relaxed py-0.5"
              style={{ maxHeight: "80px" }}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !imgFile) || sending}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#1132d4] disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all hover:bg-[#0d28b8] active:scale-95 shadow-sm"
            >
              {sending ? <Spinner size="w-3.5 h-3.5" /> : <SendIcon />}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── DeviceListingCard — with Dismiss button for super sellers ─────────────────
const DeviceListingCard = memo(
  ({ listing, onAccept, onComplete, onReject, onDismiss, isSuperSeller }) => {
    const [localBusy, setLocalBusy] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDismissModal, setShowDismissModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false); // ← new
    const [rejectReason, setRejectReason] = useState("");
    const [dismissReason, setDismissReason] = useState("");

    const cfg = LISTING_STATUS[listing.status] || LISTING_STATUS.available;
    const user = listing.listedBy;
    const userName = user
      ? [user.firstname, user.lastname].filter(Boolean).join(" ") || "—"
      : "—";
    const userPhone = user?.mobile ?? "—";
    const userAddr = (() => {
      if (!user?.defaultAddress) return "—";
      if (typeof user.defaultAddress === "string") return user.defaultAddress;
      const a = user.defaultAddress;
      return a.full || [a.city, a.state, a.pincode].filter(Boolean).join(", ");
    })();

    const fmtDate = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";
    const fmtPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
    const hasDefects = listing.evaluation?.defects?.length > 0;

    // Pickup state helpers
    const pickupStatus = listing.pickup?.status;
    const confirmedSlot = listing.pickup?.confirmedSlot;
    const paymentMethod = listing.pickup?.paymentMethod;
    const paymentDetails = listing.pickup?.paymentDetails;
    const isScheduled = pickupStatus === "scheduled";
    const awaitingUser = pickupStatus === "awaiting_user_confirmation";

    // ── Accept → open slot modal ──────────────────────────────────────────────
    const handleAcceptClick = () => setShowSlotModal(true);

    const handleSlotSubmit = async (proposedSlots) => {
      setLocalBusy(true);
      await onAccept(listing._id, proposedSlots);
      setLocalBusy(false);
      setShowSlotModal(false);
    };

    // ── Update slots (already accepted, no user confirmation yet) ─────────────
    const handleUpdateSlots = async (proposedSlots) => {
      setLocalBusy(true);
      try {
        await proposeSlots(listing._id, { proposedSlots });
      } finally {
        setLocalBusy(false);
        setShowSlotModal(false);
      }
    };

    const handleComplete = async () => {
      setLocalBusy(true);
      await onComplete(listing._id);
      setLocalBusy(false);
    };

    const handleReject = async () => {
      if (!rejectReason.trim()) return;
      setLocalBusy(true);
      await onReject(listing._id, rejectReason.trim());
      setLocalBusy(false);
      setShowRejectModal(false);
      setRejectReason("");
    };

    const handleDismiss = async () => {
      setLocalBusy(true);
      await onDismiss(listing._id, dismissReason.trim() || undefined);
      setLocalBusy(false);
      setShowDismissModal(false);
      setDismissReason("");
    };

    return (
      <>
        <div
          className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
            listing.status === "available"
              ? "border-[#1132d4]/20 shadow-[0_2px_14px_rgba(17,50,212,0.07)] hover:border-[#1132d4]/40"
              : "border-slate-100 shadow-[0_2px_8px_rgba(17,50,212,0.04)]"
          }`}
        >
          {/* ── Pickup scheduled banner (seller sees it too) ── */}
          {isScheduled && listing.status === "accepted" && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between gap-2">
              <p className="text-emerald-700 text-xs font-semibold">
                ✓ Pickup confirmed · {confirmedSlot?.date} ·{" "}
                {confirmedSlot?.timeRange}
              </p>
              {paymentMethod && (
                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full capitalize">
                  {paymentMethod.replace("_", " ")}
                  {paymentDetails && ` · ${paymentDetails}`}
                </span>
              )}
            </div>
          )}

          {/* ── Awaiting user banner ── */}
          {awaitingUser && listing.status === "accepted" && (
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <p className="text-amber-700 text-xs font-semibold">
                  {(listing.pickup?.proposedSlots?.length ?? 0) === 0
                    ? "No slots proposed yet — user is waiting"
                    : "Waiting for user to confirm pickup slot"}
                </p>
              </div>
              <button
                onClick={() => setShowSlotModal(true)}
                className="text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
              >
                {(listing.pickup?.proposedSlots?.length ?? 0) === 0
                  ? "Add Slots"
                  : "Update Slots"}
              </button>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {listing.image ? (
                  <img
                    src={listing.image}
                    alt={listing.model}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-2xl opacity-30">📱</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1132d4] tracking-wider uppercase">
                      {listing.brand}
                    </p>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                      {listing.model}
                      {(listing.ram || listing.storage) && (
                        <span className="ml-1.5 text-xs font-medium text-slate-400">
                          {listing.ram ? `${listing.ram}/` : ""}
                          {listing.storage}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">
                      {listing.category}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400">Base</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {fmtPrice(listing.basePrice)}
                  </span>
                  {listing.deductionAmount > 0 && (
                    <span className="text-xs text-red-400">
                      − {fmtPrice(listing.deductionAmount)}
                    </span>
                  )}
                  <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold px-2 py-0.5 rounded-lg">
                    {fmtPrice(listing.finalPrice)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {listing.evaluation?.hasOriginalCharger && (
                    <span className="text-xs bg-blue-50 text-[#1132d4] border border-blue-100 px-2 py-0.5 rounded-full">
                      🔌 Charger
                    </span>
                  )}
                  {listing.evaluation?.hasOriginalBox && (
                    <span className="text-xs bg-blue-50 text-[#1132d4] border border-blue-100 px-2 py-0.5 rounded-full">
                      📦 Box
                    </span>
                  )}
                  {hasDefects && (
                    <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                      ⚠ {listing.evaluation.defects.length} defect
                      {listing.evaluation.defects.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-xs text-slate-400">
                📅 {fmtDate(listing.createdAt)}
              </span>
              <span className="text-xs font-mono text-slate-400">
                #{(listing._id || "").slice(-7).toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-semibold text-[#1132d4] hover:text-[#0d28b8] py-1 border-t border-slate-50"
            >
              {expanded ? "Hide user details ↑" : "View user details ↓"}
            </button>
          </div>

          {expanded && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-2.5">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">
                User Details
              </p>
              {[
                { icon: "👤", label: "Name", value: userName },
                { icon: "📞", label: "Mobile", value: userPhone },
                { icon: "📍", label: "Address", value: userAddr },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 bg-white rounded-xl px-3 py-2.5 border border-slate-100"
                >
                  <span className="text-sm mt-0.5">{row.icon}</span>
                  <div>
                    <p className="text-xs text-slate-400">{row.label}</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}

              {/* Confirmed pickup info */}
              {isScheduled && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-3 py-2.5 space-y-1">
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                    Confirmed Pickup
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    📅 {confirmedSlot?.date} · {confirmedSlot?.timeRange}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 capitalize">
                    💳 {paymentMethod?.replace("_", " ")}
                    {paymentDetails && (
                      <span className="text-slate-500 font-normal">
                        {" "}
                        — {paymentDetails}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {hasDefects && (
                <div className="bg-white rounded-xl border border-red-100 px-3 py-2.5">
                  <p className="text-xs text-red-500 font-bold mb-2 uppercase tracking-wider">
                    Reported Defects
                  </p>
                  {listing.evaluation.defects.map((d, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-slate-600">{d.label}</span>
                      <span className="text-red-500 font-semibold">
                        −{d.deduction}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {listing.evaluation && (
                <div className="bg-white rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-2">
                    Condition
                  </p>
                  {[
                    {
                      label: "Can Make Calls",
                      value: listing.evaluation.canMakeCalls,
                    },
                    {
                      label: "Touch Working",
                      value: listing.evaluation.touchWorking,
                    },
                    {
                      label: "Original Screen",
                      value: listing.evaluation.originalScreen,
                    },
                  ]
                    .filter((r) => r.value !== undefined)
                    .map((r) => (
                      <div
                        key={r.label}
                        className="flex justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                      >
                        <span className="text-slate-500">{r.label}</span>
                        <span
                          className={`font-bold ${r.value ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {r.value ? "✓ Yes" : "✗ No"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Available: Accept + Dismiss ── */}
          {listing.status === "available" && (
            <div className="border-t border-slate-100 px-4 py-3 bg-white flex gap-2.5">
              <button
                onClick={handleAcceptClick}
                disabled={localBusy}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1132d4] hover:bg-[#0d28b8] disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl shadow-[0_2px_10px_rgba(17,50,212,0.28)] transition-all active:scale-[0.98]"
              >
                {localBusy ? (
                  <Spinner />
                ) : (
                  <Icon path="M5 13l4 4L19 7" className="w-4 h-4" />
                )}
                Accept — {fmtPrice(listing.finalPrice)}
              </button>
              {isSuperSeller && (
                <button
                  onClick={() => setShowDismissModal(true)}
                  disabled={localBusy}
                  className="flex items-center gap-1.5 border-2 border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 text-sm font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
                >
                  <Icon path="M13 5l7 7-7 7M5 5l7 7-7 7" className="w-4 h-4" />
                  Pass On
                </button>
              )}
            </div>
          )}

          {/* ── Accepted: Complete + Reject ── */}
          {listing.status === "accepted" && (
            <div className="border-t border-slate-100 px-4 py-3 flex gap-2.5 bg-white">
              <button
                onClick={handleComplete}
                disabled={localBusy}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]"
              >
                {localBusy ? (
                  <Spinner />
                ) : (
                  <Icon
                    path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    className="w-4 h-4"
                  />
                )}
                Mark Complete
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={localBusy}
                className="flex items-center gap-1.5 border-2 border-red-200 text-red-500 hover:bg-red-50 text-sm font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {["completed", "cancelled", "rejected"].includes(listing.status) && (
            <div
              className={`border-t px-4 py-2.5 text-center text-xs font-semibold ${
                listing.status === "completed"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : listing.status === "rejected"
                    ? "border-orange-100 bg-orange-50 text-orange-600"
                    : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              {listing.status === "completed" && "✓ Transaction completed"}
              {listing.status === "rejected" &&
                "✗ Listing rejected — back in pool"}
              {listing.status === "cancelled" && "✗ Cancelled by user"}
            </div>
          )}
        </div>

        {/* ── Slot proposal modal ── */}
        {showSlotModal && (
          <ProposeSlotModal
            listing={listing}
            onClose={() => setShowSlotModal(false)}
            onSubmit={
              listing.status === "available"
                ? handleSlotSubmit
                : handleUpdateSlots
            }
            saving={localBusy}
          />
        )}

        {/* ── Reject modal ── */}
        {showRejectModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason("");
            }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(17,50,212,0.15)] p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-extrabold text-slate-800 mb-1">
                Reject After Inspection
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {listing.model} · {fmtPrice(listing.finalPrice)}
              </p>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Describe why you're rejecting…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1132d4] focus:ring-2 focus:ring-[#1132d4]/10 resize-none"
              />
              {!rejectReason.trim() && (
                <p className="text-xs text-red-400 mt-1">Reason is required</p>
              )}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || localBusy}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dismiss modal ── */}
        {showDismissModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDismissModal(false);
              setDismissReason("");
            }}
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(17,50,212,0.15)] p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-extrabold text-slate-800 mb-1">
                Pass to Regular Sellers
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {listing.model} · {fmtPrice(listing.finalPrice)}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 text-xs text-amber-700">
                ⚠ This listing will be removed from your view and become visible
                to all regular sellers.
              </div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Reason{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Price too low, device type mismatch…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1132d4] focus:ring-2 focus:ring-[#1132d4]/10 resize-none"
              />
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setShowDismissModal(false);
                    setDismissReason("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={localBusy}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold"
                >
                  {localBusy ? "Passing on…" : "Pass On →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);
DeviceListingCard.displayName = "DeviceListingCard";

// ─── DeviceListingsSection ────────────────────────────────────────────────────
const LISTING_CATEGORIES = [
  "mobile",
  "laptop",
  "tablet",
  "smartwatch",
  "television",
];

const DeviceListingsSection = ({ isSuperSeller }) => {
  const [availableListings, setAvailableListings] = useState([]);
  const [managedListings, setManagedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("available");
  const [filterCat, setFilterCat] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const dedupeById = (arr) => {
    const map = new Map();
    arr.forEach((item) => map.set(item._id, item));
    return Array.from(map.values());
  };

  const fetchAvailable = useCallback(async (cat, pg) => {
    try {
      const res = await getListings({
        ...(cat && { category: cat }),
        page: pg,
        limit: 9,
      });
      setAvailableListings(res.data ?? []);
      setPagination(res.pagination ?? {});
    } catch (err) {
      setError(err.message || "Failed to load listings");
    }
  }, []);

  const fetchManaged = useCallback(async () => {
    try {
      const res = await getMyAcceptedListings();
      setManagedListings(dedupeById(res.data ?? []));
    } catch (err) {
      console.warn("fetchManaged failed:", err.message);
    }
  }, []);

  const loadAll = useCallback(
    async (cat = "", pg = 1) => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchAvailable(cat, pg), fetchManaged()]);
      setLoading(false);
    },
    [fetchAvailable, fetchManaged],
  );

  useEffect(() => {
    loadAll(filterCat, 1);
    setPage(1);
  }, [filterCat, loadAll]);

  const acceptedListings = managedListings.filter(
    (l) => l.status === "accepted",
  );
  const completedListings = managedListings.filter(
    (l) => l.status === "completed",
  );
  const displayListings =
    {
      available: availableListings,
      accepted: acceptedListings,
      completed: completedListings,
      all: dedupeById([...availableListings, ...managedListings]),
    }[filterStatus] ?? availableListings;
  const counts = {
    available: availableListings.length,
    accepted: acceptedListings.length,
    completed: completedListings.length,
    all: dedupeById([...availableListings, ...managedListings]).length,
  };

  const handleAccept = async (listingId, proposedSlots = []) => {
    try {
      await acceptListing(listingId, proposedSlots);
      const found = availableListings.find((l) => l._id === listingId);
      if (found) {
        setAvailableListings((prev) => prev.filter((l) => l._id !== listingId));
        setManagedListings((prev) => {
          if (prev.some((l) => l._id === listingId)) return prev;

          return [
            {
              ...found,
              status: "accepted",
              acceptedAt: new Date().toISOString(),
              pickup: {
                status: "awaiting_user_confirmation",
                proposedSlots,
                confirmedSlot: null,
                paymentMethod: null,
                paymentDetails: null,
                confirmedAt: null,
              },
            },
            ...prev,
          ];
        });
      }
    } catch (err) {
      setError(err.message || "Failed to accept");
      await loadAll(filterCat, page);
    }
  };

  const handleComplete = async (listingId) => {
    try {
      await completeListing(listingId);
      setManagedListings((prev) =>
        prev.map((l) =>
          l._id === listingId
            ? {
                ...l,
                status: "completed",
                completedAt: new Date().toISOString(),
              }
            : l,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to complete");
      await loadAll(filterCat, page);
    }
  };

  const handleReject = async (listingId, reason) => {
    try {
      await rejectListing(listingId, reason);
      const found = managedListings.find((l) => l._id === listingId);
      setManagedListings((prev) => prev.filter((l) => l._id !== listingId));
      if (found)
        setAvailableListings((prev) => [
          {
            ...found,
            status: "available",
            acceptedBy: null,
            acceptedAt: null,
            rejectionReason: reason,
          },
          ...prev,
        ]);
    } catch (err) {
      setError(err.message || "Failed to reject");
      await loadAll(filterCat, page);
    }
  };

  // ── Dismiss — super seller only ────────────────────────────────────────────
  // Optimistically removes from super seller's view immediately.
  // Backend flips visibility to "all_sellers" so regular sellers see it.
  const handleDismiss = async (listingId, reason) => {
    try {
      await dismissListing(listingId, reason);
      // Remove from super seller's view instantly — they should never see it again
      setAvailableListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      setError(err.message || "Failed to dismiss listing");
      await loadAll(filterCat, page);
    }
  };

  return (
    <div className="fade-up-2">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-[#1132d4] to-blue-400 rounded-full" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              User Device Listings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Users looking to sell their old devices
              {isSuperSeller && (
                <span className="ml-1.5 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  ⭐ Priority Pool
                </span>
              )}
              {counts.available > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-1 bg-[#1132d4] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {counts.available} available
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl outline-none focus:border-[#1132d4] cursor-pointer"
          >
            <option value="">All Categories</option>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadAll(filterCat, 1)}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:border-[#1132d4]/40 hover:text-[#1132d4] hover:bg-blue-50 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { key: "available", label: "Available" },
              { key: "accepted", label: "Accepted" },
              { key: "completed", label: "Completed" },
              { key: "all", label: "All" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${filterStatus === key ? "bg-[#1132d4] text-white shadow-[0_2px_8px_rgba(17,50,212,0.35)]" : "text-slate-500 hover:text-slate-700"}`}
              >
                {label}
                {counts[key] > 0 && (
                  <span
                    className={`ml-1 text-xs font-bold ${filterStatus === key ? "text-blue-200" : "text-slate-400"}`}
                  >
                    ({counts[key]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3"
            >
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-9 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
          <span className="text-5xl block mb-3">📱</span>
          <p className="text-slate-600 font-semibold">
            {filterStatus === "available"
              ? "No available listings right now"
              : `No ${filterStatus} listings`}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {filterStatus === "available"
              ? "Users will appear here when they list their old devices"
              : "Switch tabs to see other listings"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dedupeById(displayListings).map((listing) => (
            <DeviceListingCard
              key={listing._id}
              listing={listing}
              onAccept={handleAccept}
              onComplete={handleComplete}
              onReject={handleReject}
              onDismiss={handleDismiss} // ← new
              isSuperSeller={isSuperSeller} // ← new: controls Dismiss button visibility
            />
          ))}
        </div>
      )}

      {filterStatus === "available" && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              fetchAvailable(filterCat, p);
            }}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-xl disabled:opacity-40 hover:border-[#1132d4]/40 hover:text-[#1132d4] transition-all shadow-sm disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-400 px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNext}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              fetchAvailable(filterCat, p);
            }}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-xl disabled:opacity-40 hover:border-[#1132d4]/40 hover:text-[#1132d4] transition-all shadow-sm disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main SellerDashboard ─────────────────────────────────────────────────────
export default function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminId, setAdminId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const { user } = useAuth();
  const { subscription, fetchMySubscription } = useSubscriptionContext();
  const {
    userListings,
    loading: productsLoading,
    fetchUserListings,
    removeProduct,
  } = useProductContext();
  const { pendingOrders } = useSellerPendingOrders();

  const planKey = normalisePlan(subscription?.plan ?? "basic");
  const isSuperSeller = user?.isSuperSeller === true; // ← passed down to section

  const firstName = user?.firstname ?? user?.firstName ?? "—";
  const lastName = user?.lastname ?? user?.lastName ?? "";
  const email = user?.email ?? "—";
  const mobile = user?.mobile ?? user?.phone ?? "—";
  const profilePic = user?.profilePic ?? user?.avatar ?? null;
  const address = user?.defaultAddress ?? null;
  const initials = `${firstName[0] ?? "S"}${lastName[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    fetchUserListings();
    fetchMySubscription();
    const envAdminId = import.meta.env.VITE_ADMIN_ID;
    if (envAdminId) {
      setAdminId(envAdminId);
      return;
    }
    const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    fetch(`${base}/users/admin`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?._id) setAdminId(d.data._id);
      })
      .catch(() => {});
  }, [fetchUserListings, fetchMySubscription]);

  useEffect(() => {
    if (!adminId || !user?._id) return;
    apiGetMessages(adminId)
      .then((res) => {
        const fromAdmin = (res.messages ?? []).filter(
          (m) => m.from?._id?.toString() === adminId.toString(),
        );
        setUnreadCount(fromAdmin.length);
      })
      .catch(() => {});
    const socket = socketIO(SOCKET_URL, {
      auth: { token: localStorage.getItem("accessToken") },
      transports: ["websocket"],
    });
    socket.on("connect", () => {
      const room = [user._id, adminId].map(String).sort().join("_");
      socket.emit("joinRoom", room);
    });
    socket.on("newMessage", (msg) => {
      if (msg.from?._id?.toString() === adminId.toString())
        setUnreadCount((prev) => prev + 1);
    });
    return () => socket.disconnect();
  }, [adminId, user?._id]);

  const products = userListings ?? [];
  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((p) => p.status === activeTab);
  const stats = {
    total: products.length,
    active: products.filter((p) => ["available", "active"].includes(p.status))
      .length,
    sold: products.filter((p) => p.status === "sold").length,
    revenue: products
      .filter((p) => p.status === "sold")
      .reduce((s, p) => s + (p.price ?? 0), 0),
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    await removeProduct(id);
  };

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap'); @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.4s ease forwards;} .fade-up-1{animation:fadeUp 0.4s 0.05s ease forwards;opacity:0;} .fade-up-2{animation:fadeUp 0.4s 0.1s ease forwards;opacity:0;} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} .animate-pulse{animation:pulse 2s ease-in-out infinite;}`}</style>

      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-[0_1px_8px_rgba(17,50,212,0.05)]">
        <div className="max-w-6xl mx-auto px-4 py-3.5 gap-4 flex items-center">
          <BackButton />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#1132d4] flex items-center justify-center shadow-[0_2px_8px_rgba(17,50,212,0.4)]">
              
              <span className="text-white text-sm font-black">S</span>
            </div>
            
            <div>
              <p className="text-sm font-bold text-slate-800">Seller Portal</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-slate-400">Dashboard</p>
                {isSuperSeller && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                    ⭐ Super Seller
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1132d4] to-[#3b5ef5] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 fade-up">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(17,50,212,0.05)] overflow-hidden">
            <div className="px-6 pt-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl shadow-md bg-gradient-to-br from-[#1132d4] to-[#3b5ef5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xl font-black">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">
                      {firstName} {lastName}
                    </h2>
                    <p className="text-xs text-[#1132d4] font-semibold">
                      {isSuperSeller ? "⭐ Super Seller" : "Verified Seller"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1132d4] border border-[#1132d4]/30 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-[#1132d4] hover:text-white transition-all"
                >
                  <EditIcon /> Edit Profile
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  <span className="text-[#1132d4]">
                    <MailIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  <span className="text-[#1132d4]">
                    <PhoneIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Mobile</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {mobile}
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-start gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  <span className="text-[#1132d4] mt-0.5">
                    <LocationIcon />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Default Address</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {address
                        ? address.full
                        : (user?.address ?? "No address saved")}
                    </p>
                  </div>
                </div>
                {!isSuperSeller && (
                  <SubscriptionRow
                    planKey={planKey}
                    onOpenChat={() => {
                      setChatOpen(true);
                      setUnreadCount(0);
                    }}
                    unreadCount={unreadCount}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate("/add-product")}
              className="flex-1 group bg-[#1132d4] hover:bg-[#0d28b8] text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-[0_4px_20px_rgba(17,50,212,0.35)] hover:shadow-[0_8px_28px_rgba(17,50,212,0.45)] transition-all hover:-translate-y-0.5 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20">
                <PlusIcon />
              </div>
              <div>
                <p className="font-extrabold text-base">Add New Product</p>
                <p className="text-blue-200 text-xs mt-0.5">
                  List a refurbished phone
                </p>
              </div>
              <div className="flex items-center gap-1 text-blue-200 text-xs font-medium">
                Go to form <ChevronRight />
              </div>
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 group bg-white border-2 border-[#1132d4]/20 hover:border-[#1132d4] text-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-[0_2px_12px_rgba(17,50,212,0.06)] hover:shadow-[0_6px_24px_rgba(17,50,212,0.12)] transition-all hover:-translate-y-0.5 text-center"
            >
              <div className="relative w-12 h-12 rounded-xl bg-[#1132d4]/8 flex items-center justify-center group-hover:bg-[#1132d4]/12">
                <span className="text-[#1132d4]">
                  <OrdersIcon />
                </span>
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </div>
              <div>
                <p className="font-extrabold text-base text-slate-800">
                  Order Requests
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {pendingOrders.length > 0
                    ? `${pendingOrders.length} pending`
                    : "Manage buyer orders"}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[#1132d4] text-xs font-semibold">
                View all <ChevronRight />
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up-1">
          <StatCard
            label="Total Listings"
            value={stats.total}
            icon={
              <span className="text-[#1132d4]">
                <PackageIcon />
              </span>
            }
            accent="bg-blue-50"
          />
          <StatCard
            label="Active Listings"
            value={stats.active}
            sub="Live now"
            icon={
              <span className="text-emerald-600">
                <Icon
                  path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  className="w-5 h-5"
                />
              </span>
            }
            accent="bg-emerald-50"
          />
          <StatCard
            label="Sold"
            value={stats.sold}
            icon={
              <span className="text-amber-600">
                <Icon
                  path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  className="w-5 h-5"
                />
              </span>
            }
            accent="bg-amber-50"
          />
          <StatCard
            label="Revenue Earned"
            value={`₹${(stats.revenue / 1000).toFixed(0)}K`}
            sub="From sold items"
            icon={
              <span className="text-[#1132d4]">
                <Icon
                  path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  className="w-5 h-5"
                />
              </span>
            }
            accent="bg-blue-50"
          />
        </div>

        {/* Pass isSuperSeller so DeviceListingCard knows to show Dismiss */}
        <DeviceListingsSection isSuperSeller={isSuperSeller} />

        <div className="fade-up-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                My Listings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {filteredProducts.length} products shown
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {["all", "available", "sold", "reserved"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${activeTab === tab ? "bg-[#1132d4] text-white shadow-[0_2px_8px_rgba(17,50,212,0.35)]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {productsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <span className="text-5xl">📦</span>
              <p className="text-slate-600 font-semibold mt-3">
                No products in this category
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Add your first listing to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product._id}
                  product={product}
                  onDelete={handleDelete}
                  onEdit={(p) => setEditingProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {chatOpen && (
        <ChatModal
          onClose={() => setChatOpen(false)}
          sellerName={firstName}
          sellerId={user?._id}
          adminId={adminId}
        />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            fetchUserListings();
          }}
        />
      )}
    </div>
  );
}
