
import { memo, useRef, useState } from "react";
import { useProductContext } from "../../context/product.context";

// ─── Enums — must match backend model exactly ─────────────────────────────────
const CATEGORIES   = ["mobile", "laptop", "tablet", "smartwatch", "camera", "other"];
const DEVICE_TYPES = ["new", "refurbished", "old"];
const CONDITIONS   = ["Fair", "Good", "Superb"];
//const PAYMENTS     = ["Cash", "UPI", "Card", "NetBanking"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR   = (n) => n?.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const discountPct = (price, orig) =>
  price && orig && orig > price ? Math.round(((orig - price) / orig) * 100) : null;

// ─── Icon helper ──────────────────────────────────────────────────────────────
const Ic = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  edit:  "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  save:  "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  x:     "M6 18L18 6M6 6l12 12",
  image: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
);

// ─── Section divider ──────────────────────────────────────────────────────────
const SectionHeader = ({ children }) => (
  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
    {children}
  </p>
);

// ─── Styled input ─────────────────────────────────────────────────────────────
const Input = ({ label, required, error, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    <input
      className={`w-full px-3 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-[#1132d4]/10 transition-all
        ${error
          ? "border-red-300 bg-red-50 focus:border-red-400"
          : "border-slate-200 bg-slate-50 focus:border-[#1132d4] focus:bg-white"
        }`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

// ─── Styled select ────────────────────────────────────────────────────────────
const Select = ({ label, required, children, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
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

// ─────────────────────────────────────────────────────────────────────────────
// EditProductModal — main component
// ─────────────────────────────────────────────────────────────────────────────

const EditProductModal = memo(({ product, onClose, onSaved }) => {
  const { editProduct, loading: contextLoading } = useProductContext();

  // ── Form state — pre-filled with current product data ─────────────────────
  const [form, setForm] = useState({
    title:         product.title         ?? "",
    description:   product.description   ?? "",
    category:      product.category      ?? "",
    subcategory:   product.subcategory   ?? "",
    brand:         product.brand         ?? "",
    deviceType:    product.deviceType    ?? "",
    condition:     product.condition     ?? "",
    storage:       product.storage       ?? "",
    color:         product.color         ?? "",
    price:         product.price         ?? "",
    originalPrice: product.originalPrice ?? "",
    payment:       product.payment       ?? "",
    city:          product.address?.city     ?? product.city     ?? "",
    state:         product.address?.state    ?? product.state    ?? "",
    pincode:       product.address?.pincode  ?? product.pincode  ?? "",
    address:       product.address?.full     ?? product.address  ?? "",
  });

  // ── Image management ───────────────────────────────────────────────────────
  // existingImages: URLs already on the server (shown as thumbnails)
  // newImageFiles:  File objects the user just selected (not yet uploaded)
  // newImagePreviews: blob URLs for newImageFiles (for local preview)
  const [existingImages,   setExistingImages]   = useState(product.images ?? []);
  const [newImageFiles,    setNewImageFiles]     = useState([]);
  const [newImagePreviews, setNewImagePreviews]  = useState([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const imgRef = useRef();

  // ── Generic field setter ───────────────────────────────────────────────────
  const set = (k) => (e) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
    // Clear the validation error for this field as user types
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: null }));
  };

  // ── Image: add new files ───────────────────────────────────────────────────
  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrent = existingImages.length + newImageFiles.length;
    const remaining    = 5 - totalCurrent;
    if (remaining <= 0) return;

    const toAdd = files.slice(0, remaining);
    setNewImageFiles((prev)    => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  // ── Image: remove an existing (already-uploaded) image ────────────────────
  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Image: remove a newly selected (not yet uploaded) image ───────────────
  const removeNewImage = (idx) => {
    setNewImageFiles((prev)    => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())    e.title    = "Title is required";
    if (!form.category)        e.category = "Select a category";
    if (!form.condition)       e.condition = "Select a condition";
    if (!form.price)           e.price    = "Price is required";
    else if (isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Enter a valid price";
    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages === 0) e.images = "At least 1 image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);

    try {
      // Build the update payload.
      // The backend's updateProduct (PUT /products/:id) accepts multipart:
      //   - "images" (new File[] to add)
      //   - "keepImages" (JSON array of existing URLs to retain)
      //   - plus all text fields
      //
      // The editProduct action in product.context calls buildProductFormData
      // which already handles file + text fields.
      // We pass keepImages as a JSON string so the backend knows which
      // existing images to keep (and can remove the rest from cloud storage).
      const payload = {
        ...form,
        price:         Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        images:        newImageFiles,         // new files to upload
        keepImages:    existingImages,        // existing URLs to keep
      };

      await editProduct(product._id, payload);
      onSaved();
      onClose();
    } catch (err) {
      setApiError(err.message || "Failed to update product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const totalImages = existingImages.length + newImageFiles.length;
  const discount    = discountPct(Number(form.price), Number(form.originalPrice));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_80px_rgba(17,50,212,0.18)] overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Coloured header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1132d4] to-[#3b5ef5] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Ic d={ICONS.edit} className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Edit Listing</h2>
              <p className="text-blue-200 text-xs truncate max-w-[280px]">{product.title}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
            <Ic d={ICONS.x} className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

          {/* API error banner */}
          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              <span>⚠️</span>
              <span className="flex-1">{apiError}</span>
              <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600">
                <Ic d={ICONS.x} className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Basic info ── */}
          <div className="space-y-4">
            <SectionHeader>Basic Information</SectionHeader>

            <Input label="Product Title" required
              value={form.title} onChange={set("title")}
              placeholder="e.g. Samsung Galaxy S24 Ultra 12GB/256GB"
              error={errors.title}
            />

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                placeholder="Condition, accessories included, reason for selling..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800
                  placeholder-slate-400 focus:outline-none focus:border-[#1132d4] focus:bg-white
                  focus:ring-2 focus:ring-[#1132d4]/10 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Category" required value={form.category} onChange={set("category")}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </Select>
              <Input label="Subcategory" value={form.subcategory} onChange={set("subcategory")}
                placeholder="e.g. Galaxy S, Pixel" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Brand" value={form.brand} onChange={set("brand")}
                placeholder="e.g. Samsung, Apple" />
              <Select label="Device Type" value={form.deviceType} onChange={set("deviceType")}>
                <option value="">Select type</option>
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* ── Device details ── */}
          <div className="space-y-4">
            <SectionHeader>Device Details</SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              <Select label="Condition" required value={form.condition} onChange={set("condition")}>
                <option value="">Select</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Input label="Storage" value={form.storage} onChange={set("storage")}
                placeholder="e.g. 256GB" />
              <Input label="Color" value={form.color} onChange={set("color")}
                placeholder="e.g. Black" />
            </div>
          </div>

          {/* ── Pricing ── */}
          <div className="space-y-4">
            <SectionHeader>Pricing &amp; Payment</SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Selling Price (₹)" required type="number" min="0"
                value={form.price} onChange={set("price")}
                placeholder="120000" error={errors.price}
              />
              <Input label="Original / MRP (₹)" type="number" min="0"
                value={form.originalPrice} onChange={set("originalPrice")}
                placeholder="139999"
              />
              {/* <Select label="Payment Method" value={form.payment} onChange={set("payment")}>
                <option value="">Select</option>
                {PAYMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select> */}
            </div>

            {/* Live discount preview */}
            {discount && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <span className="text-emerald-600 font-bold text-sm">🎉 {discount}% discount</span>
                <span className="text-slate-400 text-xs">
                  — buyer saves ₹{formatINR(Number(form.originalPrice) - Number(form.price))}
                </span>
              </div>
            )}
          </div>

          {/* ── Images ── */}
          <div className="space-y-4">
            <SectionHeader>Product Images ({totalImages}/5)</SectionHeader>

            {/* Error for images */}
            {errors.images && (
              <p className="text-xs text-red-500 font-medium">⚠ {errors.images}</p>
            )}

            {/* Image grid: existing + new + add button */}
            <div className="grid grid-cols-5 gap-2">

              {/* Existing images (from the server) */}
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all" />
                  {/* Server indicator badge */}
                  <div className="absolute bottom-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    Saved
                  </div>
                  <button
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex font-bold shadow"
                  >×</button>
                </div>
              ))}

              {/* New images selected by user (not yet uploaded) */}
              {newImagePreviews.map((src, i) => (
                <div key={`new-${i}`}
                  className="relative group aspect-square rounded-xl overflow-hidden border-2 border-dashed border-[#1132d4]/40 shadow-sm">
                  <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all" />
                  {/* New indicator badge */}
                  <div className="absolute bottom-1 left-1 bg-[#1132d4] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    New
                  </div>
                  <button
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex font-bold shadow"
                  >×</button>
                </div>
              ))}

              {/* Add more button (only shown if under 5 total) */}
              {totalImages < 5 && (
                <div
                  onClick={() => imgRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1132d4] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-[#1132d4] hover:bg-blue-50/40"
                >
                  <Ic d={ICONS.image} className="w-5 h-5" />
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

            <p className="text-xs text-slate-400">
              <span className="text-emerald-600 font-semibold">Green badge</span> = already saved on server.{" "}
              <span className="text-[#1132d4] font-semibold">Blue badge</span> = newly added (will upload on save).
              Click × to remove.
            </p>
          </div>

          {/* ── Location ── */}
          <div className="space-y-4">
            <SectionHeader>Location</SectionHeader>
            <div className="grid grid-cols-2 gap-4">
              <Input label="City"    value={form.city}    onChange={set("city")}    placeholder="Mumbai" />
              <Input label="State"   value={form.state}   onChange={set("state")}   placeholder="Maharashtra" />
              <Input label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="400001" />
              <Input label="Address" value={form.address} onChange={set("address")} placeholder="Area, Landmark" />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 flex-shrink-0">
          {/* Product ID for reference */}
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
              disabled={saving || contextLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1132d4] hover:bg-[#0d28b8] text-white text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {saving
                ? <><Spinner /><span>Saving…</span></>
                : <><Ic d={ICONS.save} /><span>Save Changes</span></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

EditProductModal.displayName = "EditProductModal";
export default EditProductModal;