// ─────────────────────────────────────────────────────────────────────────────
// RejectModal.jsx
//
// Drop-in modal for rejecting a device listing.
// - Properly sized sheet: never takes the full page
// - Up to 3 image attachments with live previews + remove
// - Reason text (optional)
// - Sends multipart/form-data so the backend can upload images to Cloudinary
//
// Usage:
//   <RejectModal
//     listing={listing}          // the listing object (used for display only)
//     onConfirm={async (formData) => { await rejectListing(id, formData); }}
//     onClose={() => setOpen(false)}
//   />
//
// The `rejectListing` API helper MUST accept (listingId, FormData):
//   export const rejectListing = (id, formData) =>
//     api.post(`/device-listings/${id}/reject`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useCallback, useEffect } from "react";

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 5;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ── tiny SVG icon helper (mirrors your codebase's Ic pattern) ────────────────
const Ic = ({ d, className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ICONS = {
  x: "M6 18L18 6M6 6l12 12",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  image:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  warning:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  plus: "M12 4v16m8-8H4",
};

// ── image preview pill ────────────────────────────────────────────────────────
function ImagePill({ src, name, onRemove }) {
  return (
    <div className="relative group flex-shrink-0">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm">
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
      {/* hover overlay with remove */}
      <button
        onClick={onRemove}
        type="button"
        className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
        aria-label={`Remove ${name}`}
      >
        <Ic d={ICONS.trash} className="w-5 h-5 text-white" />
      </button>
      {/* always-visible tiny × on mobile */}
      <button
        onClick={onRemove}
        type="button"
        className="sm:hidden absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
        aria-label={`Remove ${name}`}
      >
        <Ic d={ICONS.x} className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function RejectModal({ listing, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [images, setImages] = useState([]); // [{ file, preview }]
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
  }, [images]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── image picker ────────────────────────────────────────────────────────────
  const handleFiles = useCallback(
    (fileList) => {
      setError("");
      const incoming = Array.from(fileList);
      const remaining = MAX_IMAGES - images.length;

      if (remaining <= 0) {
        setError(`You can attach at most ${MAX_IMAGES} images.`);
        return;
      }

      const accepted = [];
      for (const file of incoming.slice(0, remaining)) {
        if (!ALLOWED.includes(file.type)) {
          setError("Only JPEG, PNG, and WebP images are allowed.");
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setError(`Each image must be under ${MAX_SIZE_MB} MB.`);
          continue;
        }
        accepted.push({ file, preview: URL.createObjectURL(file) });
      }
      setImages((prev) => [...prev, ...accepted]);
    },
    [images.length],
  );

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── drag-and-drop ───────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      if (reason.trim()) formData.append("reason", reason.trim());
      images.forEach((img) => formData.append("images", img.file));
      await onConfirm(formData);
      window.location.reload();
      // onConfirm is responsible for closing the modal on success
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to reject listing",
      );
      setSaving(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    // Backdrop — click outside to close
    <div
      className="fixed z-50 top-20 left-1/2 -translate-x-1/2"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      {/*
        Sheet sizing:
        - Mobile  → bottom sheet, slides up, max 85 vh, rounded top corners
        - Tablet+ → centered card, max-w-lg, standard rounded corners
      */}
      <div
        className="
    w-[92vw] max-w-sm
    bg-white
    rounded-xl
    shadow-lg
    border border-slate-200
    flex flex-col
    max-h-[70vh]
  "
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* ── header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          {/* drag handle — mobile only */}
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-10 h-1 bg-slate-200 rounded-full sm:hidden" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
              <Ic d={ICONS.warning} className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="reject-modal-title"
                className="text-sm font-extrabold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Reject Listing
              </h2>
              {listing?.model && (
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                  {listing.brand} {listing.model}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            aria-label="Close"
          >
            <Ic d={ICONS.x} />
          </button>
        </div>

        {/* ── scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {/* reason textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reason{" "}
              <span className="font-normal normal-case text-slate-400">
                (optional)
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Describe why you're rejecting this listing — e.g. device condition, missing accessories…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 resize-none
                focus:outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-400/10 transition-all"
            />
          </div>

          {/* image upload zone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Evidence Images{" "}
                <span className="font-normal normal-case text-slate-400">
                  (up to {MAX_IMAGES})
                </span>
              </label>
              {images.length > 0 && (
                <span className="text-xs text-slate-400">
                  {images.length}/{MAX_IMAGES} added
                </span>
              )}
            </div>

            {/* previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {images.map((img, idx) => (
                  <ImagePill
                    key={img.preview}
                    src={img.preview}
                    name={img.file.name}
                    onRemove={() => removeImage(idx)}
                  />
                ))}
              </div>
            )}

            {/* drop zone — only shown when slots remain */}
            {images.length < MAX_IMAGES && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-2
                  border-2 border-dashed rounded-2xl py-6 cursor-pointer
                  transition-all select-none
                  ${
                    dragging
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/60"
                  }
                `}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                  <Ic d={ICONS.image} className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    {dragging ? "Drop images here" : "Tap or drag images here"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    JPEG, PNG, WebP · max {MAX_SIZE_MB} MB each
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:border-slate-300 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                >
                  <Ic d={ICONS.plus} className="w-3.5 h-3.5" />
                  Browse files
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* inline error */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <Ic d={ICONS.warning} className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* ── footer ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold
              shadow-[0_4px_14px_rgba(239,68,68,0.35)] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Rejecting…
              </>
            ) : (
              "Confirm Rejection"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
