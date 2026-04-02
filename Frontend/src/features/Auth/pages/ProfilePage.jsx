// ProfilePage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  getProfile,
  updateProfile,
  updateProfilePic,
  deleteProfilePic,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../../services/profile.api";
import { getMyListings, cancelListing } from "../../../services/deviceSell.api";
import PickupConfirmModal from "../../User-Sell/components/PickupConfirmModal";

// ─── tiny icon helper ─────────────────────────────────────────────────────────
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
const I = {
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  map: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  plus: "M12 4v16m8-8H4",
  check: "M5 13l4 4L19 7",
  x: "M6 18L18 6M6 6l12 12",
  camera:
    "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
  orders:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  save: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  chevron: "M9 5l7 7-7 7",
  device:
    "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z",
  ban: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  refresh:
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

// ─── reusable input ───────────────────────────────────────────────────────────
const Field = ({ label, icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Ic d={icon} />
        </span>
      )}
      <input
        className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium placeholder-slate-400
          focus:outline-none focus:border-[#1132d4] focus:bg-white focus:ring-2 focus:ring-[#1132d4]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        {...props}
      />
    </div>
  </div>
);

// ─── section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, subtitle, icon, children, action }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(17,50,212,0.04)] overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1132d4]/8 flex items-center justify-center text-[#1132d4]">
          <Ic d={icon} />
        </div>
        <div>
          <h3
            className="text-sm font-extrabold text-slate-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ─── toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold animate-[slideUp_0.3s_ease]
    ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
    style={{ fontFamily: "'DM Sans', sans-serif" }}
  >
    <Ic d={type === "success" ? I.check : I.x} className="w-4 h-4" />
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
      <Ic d={I.x} />
    </button>
  </div>
);

// ─── cancel confirm modal ─────────────────────────────────────────────────────
const CancelConfirmModal = ({ listing, onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
      <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Ic d={I.ban} className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3
            className="font-extrabold text-slate-800 text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Cancel Listing?
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Your listing for{" "}
            <span className="font-semibold text-slate-700">
              {listing.brand} {listing.model}
            </span>{" "}
            will be permanently removed from the market.
          </p>
        </div>
      </div>
      <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700 font-medium flex items-start gap-2">
          <Ic d={I.info} className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Once cancelled, sellers will no longer be able to see or contact you about this device.
        </p>
      </div>
      <div className="px-6 py-4 flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Keep Listing
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60 transition-all flex items-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Ic d={I.ban} />
          )}
          {loading ? "Cancelling…" : "Yes, Cancel Listing"}
        </button>
      </div>
    </div>
  </div>
);

// ─── address form modal ───────────────────────────────────────────────────────
const ADDR_EMPTY = {
  street: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  isDefault: false,
};

const BASE_URL_ADDR = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AddressModal = ({ initial, onSave, onClose, saving }) => {
  const [form, setForm] = useState(initial ?? ADDR_EMPTY);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");
  const set = (k) => (e) =>
    setForm((p) => ({
      ...p,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const handleDetectLocation = async () => {
    setDetecting(true);
    setDetectError("");
    try {
      const { latitude, longitude } = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          (err) => {
            const msgs = {
              1: "Location permission denied",
              2: "Location unavailable",
              3: "Request timed out",
            };
            reject(new Error(msgs[err.code] || "Location error"));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });

      const res = await fetch(`${BASE_URL_ADDR}/api/location/reverse-geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Geocode failed");

      const geo = data.data;
      setForm((p) => ({
        ...p,
        street:  geo.street  || p.street,
        city:    geo.city    || p.city,
        state:   geo.state   || p.state,
        pincode: geo.pincode || p.pincode,
        country: geo.country || p.country || "India",
      }));
    } catch (e) {
      setDetectError(e.message);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3
            className="font-extrabold text-slate-800 text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {initial ? "Edit Address" : "Add New Address"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <Ic d={I.x} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detecting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 disabled:cursor-wait ${
                detecting
                  ? "border-[#1132d4]/40 bg-blue-50 text-[#1132d4]"
                  : "border-[#1132d4]/30 text-[#1132d4] hover:bg-[#1132d4] hover:text-white hover:border-[#1132d4] hover:shadow-[0_3px_12px_rgba(17,50,212,0.3)]"
              }`}
            >
              {detecting ? (
                <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin flex-shrink-0" />
              ) : (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {detecting ? "Detecting location…" : "Use Current Location"}
            </button>
            {detectError && (
              <p className="text-xs text-red-500 font-medium flex-1">{detectError}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or enter manually</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <Field label="Street" icon={I.map} value={form.street} onChange={set("street")} placeholder="House / Flat / Block / Area" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="City"  value={form.city}  onChange={set("city")}  placeholder="Mumbai" />
            <Field label="State" value={form.state} onChange={set("state")} placeholder="Maharashtra" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="400001" />
            <Field label="Country" value={form.country} onChange={set("country")} placeholder="India" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} className="w-4 h-4 accent-[#1132d4] rounded" />
            <span className="text-sm font-medium text-slate-700">Set as default address</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#1132d4] text-white text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Ic d={I.save} />
            )}
            {saving ? "Saving…" : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── listing status config ────────────────────────────────────────────────────
const STATUS_STYLES = {
  available: {
    pill:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot:   "bg-emerald-400",
    label: "Available",
  },
  accepted: {
    pill:  "bg-blue-50 text-blue-700 border-blue-200",
    dot:   "bg-blue-400",
    label: "Accepted",
  },
  completed: {
    pill:  "bg-teal-50 text-teal-700 border-teal-200",
    dot:   "bg-teal-500",
    label: "Completed",
  },
  cancelled: {
    pill:  "bg-slate-100 text-slate-500 border-slate-200",
    dot:   "bg-slate-400",
    label: "Cancelled",
  },
};

// ─── helper: was this listing previously rejected and re-listed? ──────────────
// Backend sets rejectedAt (regular seller) or superSellerRejected (super seller)
// when they pass on a listing — the status goes back to "available".
const wasRejectedAndRelisted = (l) =>
  l.status === "available" &&
  (l.rejectedAt != null || l.superSellerRejected === true);

// ─── My Listings panel ────────────────────────────────────────────────────────
function MyListingsPanel({ showToast }) {
  const navigate = useNavigate();
  const [listings,     setListings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancelModal,  setCancelModal]  = useState(null); // listing object or null
  const [cancelling,   setCancelling]   = useState(false);
  const [pickupModal,  setPickupModal]  = useState(null); // listing object or null

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyListings();
      setListings(res.data ?? []);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Cancel flow ───────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await cancelListing(cancelModal._id);
      showToast("Listing cancelled successfully");
      setCancelModal(null);
      await load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  const handlePickupConfirmed = async () => {
    setPickupModal(null);
    showToast("Pickup confirmed! The seller will arrive at your scheduled time.");
    await load();
  };

  // ── State flags ───────────────────────────────────────────────────────────
  const needsConfirmation = (l) =>
    l.status === "accepted" &&
    l.pickup?.status === "awaiting_user_confirmation" &&
    (l.pickup?.proposedSlots?.length ?? 0) > 0;

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );

  if (listings.length === 0)
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-[#1132d4]/8 flex items-center justify-center mx-auto mb-3 text-[#1132d4]">
          <Ic d={I.device} className="w-6 h-6" />
        </div>
        <p className="text-slate-700 font-semibold">No listings yet</p>
        <p className="text-slate-400 text-sm mt-1">Sell your old devices and earn instant cash</p>
        <button
          onClick={() => navigate("/sell")}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1132d4] text-white text-sm font-bold shadow-[0_3px_12px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] transition-all"
        >
          <Ic d={I.plus} /> Sell a Device
        </button>
      </div>
    );

  return (
    <>
      <div className="space-y-4">
        {listings.map((listing) => {
          const st             = STATUS_STYLES[listing.status] ?? STATUS_STYLES.available;
          const variantLabel   = [listing.ram, listing.storage].filter(Boolean).join(" / ");
          const awaitingConfirm = needsConfirmation(listing);
          const isScheduled    = listing.pickup?.status === "scheduled";
          const noSlots        =
            listing.status === "accepted" &&
            listing.pickup?.status === "awaiting_user_confirmation" &&
            (listing.pickup?.proposedSlots?.length ?? 0) === 0;
          const rejectedRelisted = wasRejectedAndRelisted(listing);
          const isAvailable    = listing.status === "available";
          const isCancelled    = listing.status === "cancelled";

          return (
            <div
              key={listing._id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                awaitingConfirm
                  ? "border-[#1132d4]/40 shadow-[0_2px_16px_rgba(17,50,212,0.12)]"
                  : rejectedRelisted
                  ? "border-amber-300/60 shadow-[0_2px_12px_rgba(245,158,11,0.1)]"
                  : isCancelled
                  ? "border-slate-200 opacity-60"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* ── Action required banner ── */}
              {awaitingConfirm && (
                <div className="bg-[#1132d4] px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <p className="text-white text-xs font-semibold">
                      Action needed — confirm pickup slot &amp; payment method
                    </p>
                  </div>
                  <button
                    onClick={() => setPickupModal(listing)}
                    className="flex-shrink-0 bg-white text-[#1132d4] text-xs font-bold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Confirm →
                  </button>
                </div>
              )}

              {/* ── Seller passed — relisted banner ── */}
              {rejectedRelisted && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Ic d={I.refresh} className="w-3 h-3 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-800 text-xs font-bold leading-snug">
                        Previous seller passed on this listing
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5 leading-snug">
                        Your device is back in the market and visible to all sellers. You'll be notified as soon as a new seller accepts it.
                      </p>
                      {listing.rejectionReason && (
                        <p className="text-amber-500 text-xs mt-1 italic">
                          Reason: "{listing.rejectionReason}"
                        </p>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Relisted
                    </span>
                  </div>
                </div>
              )}

              {/* ── Waiting for seller slots banner ── */}
              {noSlots && (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-2">
                  <Ic d={I.clock} className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <p className="text-blue-700 text-xs font-semibold">
                    Seller accepted — waiting for them to propose pickup slots
                  </p>
                </div>
              )}

              {/* ── Scheduled banner ── */}
              {isScheduled && (
                <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2">
                  <Ic d={I.check} className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <p className="text-emerald-700 text-xs font-semibold">
                    Pickup scheduled · {listing.pickup.confirmedSlot?.date} · {listing.pickup.confirmedSlot?.timeRange}
                  </p>
                </div>
              )}

              {/* ── Cancelled banner ── */}
              {isCancelled && (
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                  <Ic d={I.ban} className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <p className="text-slate-500 text-xs font-semibold">
                    You cancelled this listing
                  </p>
                </div>
              )}

              {/* ── Main card row ── */}
              <div className="flex items-center gap-4 p-4">
                {/* Device image */}
                <div className="w-14 h-16 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {listing.image ? (
                    <img
                      src={listing.image}
                      alt={listing.model}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Ic d={I.device} className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {listing.brand} {listing.model}
                    </p>
                    {variantLabel && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {variantLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${st.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {rejectedRelisted ? "Relisted" : st.label}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{listing.category}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(listing.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Accepted by info */}
                  {listing.status === "accepted" && listing.acceptedBy && (
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Accepted by {listing.acceptedBy.firstname} {listing.acceptedBy.lastname} · {listing.acceptedBy.mobile}
                    </p>
                  )}

                  {/* Payment method confirmed */}
                  {isScheduled && listing.pickup?.paymentMethod && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      💳 Payment: {listing.pickup.paymentMethod.replace("_", " ")}
                      {listing.pickup.paymentDetails && ` — ${listing.pickup.paymentDetails}`}
                    </p>
                  )}

                  {/* Relisted hint */}
                  {rejectedRelisted && (
                    <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                      <Ic d={I.clock} className="w-3 h-3" />
                      Waiting for a new seller to accept
                    </p>
                  )}
                </div>

                {/* Price + actions column */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <p className="text-base font-extrabold text-slate-900">
                    ₹{listing.finalPrice?.toLocaleString("en-IN") ?? "—"}
                  </p>

                  {/* Confirm pickup CTA */}
                  {awaitingConfirm && (
                    <button
                      onClick={() => setPickupModal(listing)}
                      className="text-xs font-bold text-[#1132d4] border border-[#1132d4]/30 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      Confirm Pickup
                    </button>
                  )}

                  {/* Cancel button — shown for ALL available listings incl. relisted */}
                  {isAvailable && (
                    <button
                      onClick={() => setCancelModal(listing)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 hover:border-red-500 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Ic d={I.ban} className="w-3.5 h-3.5" />
                      Cancel Listing
                    </button>
                  )}
                </div>
              </div>

              {/* ── Defects bar ── */}
              {listing.evaluation?.defects?.length > 0 && (
                <div className="px-4 py-2.5 bg-amber-50/60 border-t border-amber-100 flex items-center gap-2">
                  <Ic d={I.tag} className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    {listing.evaluation.defects.length} defect{listing.evaluation.defects.length > 1 ? "s" : ""} noted:{" "}
                    {listing.evaluation.defects.map((d) => d.label).join(", ")}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Sell another CTA */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => navigate("/sell")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1132d4]/30 text-[#1132d4] text-xs font-bold hover:bg-blue-50 transition-all"
          >
            <Ic d={I.plus} /> Sell Another Device
          </button>
        </div>
      </div>

      {/* ── Cancel confirmation modal ── */}
      {cancelModal && (
        <CancelConfirmModal
          listing={cancelModal}
          onConfirm={handleCancelConfirm}
          onClose={() => !cancelling && setCancelModal(null)}
          loading={cancelling}
        />
      )}

      {/* ── Pickup confirmation modal ── */}
      {pickupModal && (
        <PickupConfirmModal
          listing={pickupModal}
          onClose={() => setPickupModal(null)}
          onConfirmed={handlePickupConfirmed}
        />
      )}
    </>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [tab, setTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    mobile: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [picUploading,  setPicUploading]  = useState(false);
  const picRef = useRef();

  const [addresses,    setAddresses]   = useState([]);
  const [addrLoading,  setAddrLoading] = useState(false);
  const [addrModal,    setAddrModal]   = useState(null);
  const [addrSaving,   setAddrSaving]  = useState(false);

  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstname: user.firstname ?? "",
        lastname:  user.lastname  ?? "",
        email:     user.email     ?? "",
        mobile:    user.mobile    ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (tab === "addresses") loadAddresses();
  }, [tab]);

  const loadAddresses = async () => {
    setAddrLoading(true);
    try {
      const res = await getAddresses();
      setAddresses(res.data?.addresses ?? []);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setAddrLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    if (profileForm.mobile && !/^[0-9]{10}$/.test(profileForm.mobile)) {
      showToast("Mobile number must be 10 digits", "error");
      setProfileSaving(false);
      return;
    }
    if (!profileForm.firstname.trim() || profileForm.firstname.trim().length < 2) {
      showToast("First name must be at least 2 characters", "error");
      setProfileSaving(false);
      return;
    }
    try {
      const res = await updateProfile(profileForm);
      updateUser(res.data);
      showToast("Profile updated successfully!");
      navigate("/");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicUploading(true);
    try {
      const res = await updateProfilePic(file);
      updateUser({ profilePic: res.profilePic });
      showToast("Profile picture updated!");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setPicUploading(false);
    }
  };

  const handleDeletePic = async () => {
    setPicUploading(true);
    try {
      await deleteProfilePic();
      updateUser({ profilePic: null });
      showToast("Profile picture removed");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setPicUploading(false);
    }
  };

  const handleAddrSave = async (form) => {
    setAddrSaving(true);
    if (!form.street.trim() || !form.city.trim() || !form.state.trim()) {
      showToast("Street, city and state are required", "error");
      setAddrSaving(false);
      return;
    }
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) {
      showToast("Pincode must be 6 digits", "error");
      setAddrSaving(false);
      return;
    }
    try {
      if (addrModal && addrModal !== "new") {
        await updateAddress(addrModal._id, form);
        showToast("Address updated!");
      } else {
        await addAddress(form);
        showToast("Address added!");
      }
      setAddrModal(null);
      await loadAddresses();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setAddrSaving(false);
    }
  };

  const handleAddrDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await deleteAddress(id);
      showToast("Address deleted");
      await loadAddresses();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      showToast("Default address updated");
      await loadAddresses();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const firstName  = user?.firstname ?? user?.firstName ?? "User";
  const lastName   = user?.lastname  ?? user?.lastName  ?? "";
  const profilePic = user?.profilePic ?? null;
  const role       = user?.role ?? "user";
  const initials   = `${firstName[0] ?? "U"}${lastName[0] ?? ""}`.toUpperCase();

  const ALL_TABS = [
    { id: "profile",   label: "Profile",     icon: I.user,   roles: ["user", "seller"] },
    { id: "addresses", label: "Addresses",   icon: I.map,    roles: ["user", "seller"] },
    { id: "orders",    label: "My Orders",   icon: I.orders, roles: ["user"] },
    { id: "listings",  label: "My Listings", icon: I.device, roles: ["user"] },
  ];
  const TABS = ALL_TABS.filter((t) => t.roles.includes(role));

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        @keyframes slideUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        .fade-in  { animation: fadeIn  0.35s ease both; }
        .slide-up { animation: slideUp 0.4s ease both;  }
      `}</style>

      {/* ── header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 shadow-[0_1px_8px_rgba(17,50,212,0.05)]">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1132d4] flex items-center justify-center shadow-[0_2px_8px_rgba(17,50,212,0.4)]">
              <span className="text-white text-sm font-black">R</span>
            </div>
            <span className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              My Account
            </span>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role === "seller" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-[#1132d4]"}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ── hero card ── */}
        <div className="relative bg-gradient-to-r from-[#1132d4] via-[#1e44e8] to-[#3b5ef5] rounded-3xl p-6 shadow-[0_8px_40px_rgba(17,50,212,0.3)] overflow-hidden slide-up">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-12 -left-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 overflow-hidden shadow-lg flex items-center justify-center">
                {profilePic ? (
                  <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-black">{initials}</span>
                )}
                {picUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => picRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white text-[#1132d4] flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Ic d={I.camera} className="w-3.5 h-3.5" />
              </button>
              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {firstName} {lastName}
              </h1>
              <p className="text-blue-200 text-sm mt-0.5">{user?.email}</p>
              <p className="text-blue-200 text-xs mt-0.5">{user?.mobile}</p>
              {user?.defaultAddress?.full && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Ic d={I.map} className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
                  <span className="text-blue-200 text-xs truncate">{user.defaultAddress.full}</span>
                </div>
              )}
            </div>

            {profilePic && (
              <button onClick={handleDeletePic} className="flex-shrink-0 text-blue-200 hover:text-red-300 transition-colors">
                <Ic d={I.trash} className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── tab bar ── */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-[0_2px_8px_rgba(17,50,212,0.05)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === t.id
                  ? "bg-[#1132d4] text-white shadow-[0_3px_12px_rgba(17,50,212,0.3)]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Ic d={t.icon} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div className="fade-in">
            <Section
              title="Personal Information"
              subtitle="Update your name, email and phone"
              icon={I.user}
              action={
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#1132d4] text-white shadow-[0_3px_12px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] disabled:opacity-60 transition-all"
                >
                  {profileSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Ic d={I.save} />
                  )}
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" icon={I.user} value={profileForm.firstname} onChange={(e) => setProfileForm((p) => ({ ...p, firstname: e.target.value }))} placeholder="John" />
                <Field label="Last Name" value={profileForm.lastname} onChange={(e) => setProfileForm((p) => ({ ...p, lastname: e.target.value }))} placeholder="Doe" />
                <Field label="Email Address" icon={I.mail} type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
                <Field label="Mobile Number" icon={I.phone} type="tel" value={profileForm.mobile} onChange={(e) => setProfileForm((p) => ({ ...p, mobile: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Account Type", value: role.charAt(0).toUpperCase() + role.slice(1) },
                  { label: "Status",       value: user?.accountStatus ?? "Active" },
                  { label: "Verified",     value: user?.isVerified ? "Yes ✓" : "Pending" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── ADDRESSES TAB ── */}
        {tab === "addresses" && (
          <div className="fade-in">
            <Section
              title="Saved Addresses"
              subtitle="Manage your delivery addresses"
              icon={I.map}
              action={
                <button
                  onClick={() => setAddrModal("new")}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#1132d4] text-white shadow-[0_3px_12px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] transition-all"
                >
                  <Ic d={I.plus} /> Add Address
                </button>
              }
            >
              {addrLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-[#1132d4]/8 flex items-center justify-center mx-auto mb-3 text-[#1132d4]">
                    <Ic d={I.map} className="w-6 h-6" />
                  </div>
                  <p className="text-slate-700 font-semibold">No addresses saved</p>
                  <p className="text-slate-400 text-sm mt-1">Add an address for faster checkout</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`relative rounded-2xl border p-4 transition-all ${
                        addr.isDefault
                          ? "border-[#1132d4]/40 bg-blue-50/60 shadow-[0_2px_12px_rgba(17,50,212,0.08)]"
                          : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                      }`}
                    >
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 text-xs font-bold bg-[#1132d4] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Ic d={I.star} className="w-3 h-3" /> Default
                        </span>
                      )}
                      <div className="flex items-start gap-3 pr-20">
                        <div className="w-8 h-8 rounded-lg bg-[#1132d4]/10 flex items-center justify-center flex-shrink-0 text-[#1132d4] mt-0.5">
                          <Ic d={I.home} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 leading-snug">
                            {addr.full || [addr.street, addr.city].filter(Boolean).join(", ") || "—"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {[addr.state, addr.pincode, addr.country].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/70">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr._id)} className="text-xs font-semibold text-[#1132d4] hover:underline flex items-center gap-1">
                            <Ic d={I.check} className="w-3 h-3" /> Set Default
                          </button>
                        )}
                        <button onClick={() => setAddrModal(addr)} className="ml-auto p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#1132d4] hover:text-[#1132d4] hover:bg-blue-50 transition-all">
                          <Ic d={I.edit} />
                        </button>
                        <button onClick={() => handleAddrDelete(addr._id)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Ic d={I.trash} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === "orders" && role === "user" && (
          <div className="fade-in">
            <Section title="My Orders" subtitle="Your purchase history" icon={I.orders}>
              <OrdersPanel />
            </Section>
          </div>
        )}

        {/* ── MY LISTINGS TAB ── */}
        {tab === "listings" && role === "user" && (
          <div className="fade-in">
            <Section
              title="My Listings"
              subtitle="Devices you've listed for sale"
              icon={I.device}
              action={
                <button
                  onClick={() => navigate("/sell")}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#1132d4] text-white shadow-[0_3px_12px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] transition-all"
                >
                  <Ic d={I.plus} /> New Listing
                </button>
              }
            >
              <MyListingsPanel showToast={showToast} />
            </Section>
          </div>
        )}
      </div>

      {addrModal && (
        <AddressModal
          initial={addrModal === "new" ? null : addrModal}
          onSave={handleAddrSave}
          onClose={() => setAddrModal(null)}
          saving={addrSaving}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ─── Order status config ──────────────────────────────────────────────────────
const ORDER_STATUS = {
  pending: {
    pill:    "bg-amber-50 text-amber-700 border-amber-200",
    dot:     "bg-amber-400",
    bar:     "bg-amber-400",
    label:   "Pending",
    desc:    "Waiting for seller confirmation",
    icon:    "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  confirmed: {
    pill:    "bg-blue-50 text-blue-700 border-blue-200",
    dot:     "bg-blue-500",
    bar:     "bg-blue-500",
    label:   "Confirmed",
    desc:    "Seller confirmed your order",
    icon:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  shipped: {
    pill:    "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot:     "bg-indigo-500",
    bar:     "bg-indigo-500",
    label:   "Shipped",
    desc:    "Your order is on the way",
    icon:    "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
  },
  delivered: {
    pill:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot:     "bg-emerald-500",
    bar:     "bg-emerald-500",
    label:   "Delivered",
    desc:    "Order delivered successfully",
    icon:    "M5 13l4 4L19 7",
  },
  cancelled: {
    pill:    "bg-red-50 text-red-600 border-red-200",
    dot:     "bg-red-400",
    bar:     "bg-red-400",
    label:   "Cancelled",
    desc:    "This order was cancelled",
    icon:    "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  rejected: {
    pill:    "bg-slate-100 text-slate-500 border-slate-200",
    dot:     "bg-slate-400",
    bar:     "bg-slate-400",
    label:   "Rejected",
    desc:    "Seller rejected this order",
    icon:    "M6 18L18 6M6 6l12 12",
  },
};

// Progress steps — the happy path. Cancelled/rejected break out of this flow.
const PROGRESS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

// ─── Order detail modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onCancelled }) {
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState("");
  const [showConfirm,  setShowConfirm]  = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token    = localStorage.getItem("accessToken");

  const cfg      = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
  const isFinal  = ["cancelled", "rejected", "delivered"].includes(order.status);
  const canCancel = order.status === "pending";

  // Compute step index for the progress bar
  const stepIdx  = PROGRESS_STEPS.indexOf(order.status);
  const isAborted = order.status === "cancelled" || order.status === "rejected";

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`${BASE_URL}/orders/${order._id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel order");
      onCancelled(order._id);
    } catch (e) {
      setCancelError(e.message);
      setCancelling(false);
    }
  };

  const fmt = (n) =>
    n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Sheet on mobile, centered modal on desktop */}
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.pill}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Order Details
              </p>
              <p className="text-xs text-slate-400 font-medium">
                #{order._id?.slice(-10).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <Ic d={I.x} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Product card */}
          <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {order.product?.images?.[0] ? (
                <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl opacity-25">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-snug">
                {order.product?.title ?? "Product"}
              </p>
              {order.product?.brand && (
                <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
                  {order.product.brand}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-extrabold text-slate-900">{fmt(order.salePrice)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Sale price</p>
            </div>
          </div>

          {/* ── Progress tracker (only for non-aborted orders) ── */}
          {!isAborted && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Order Progress
              </p>
              <div className="relative">
                {/* Connector line */}
                <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-slate-100 rounded-full" />
                <div
                  className={`absolute top-3.5 left-3.5 h-0.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{
                    width: stepIdx >= 0
                      ? `${(stepIdx / (PROGRESS_STEPS.length - 1)) * 100}%`
                      : "0%",
                  }}
                />
                <div className="relative flex justify-between">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const done    = stepIdx >= idx;
                    const current = stepIdx === idx;
                    const scfg    = ORDER_STATUS[step];
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5" style={{ width: "25%" }}>
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                          current
                            ? `${scfg.dot} border-white shadow-[0_0_0_3px] shadow-current/30`
                            : done
                            ? `${scfg.dot} border-white`
                            : "bg-white border-slate-200"
                        }`}>
                          {done ? (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <p className={`text-center leading-tight ${current ? "font-bold text-slate-800" : done ? "font-semibold text-slate-600" : "font-medium text-slate-400"}`}
                           style={{ fontSize: "10px" }}>
                          {scfg.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className={`text-xs font-medium mt-3 text-center ${cfg.pill.includes("emerald") ? "text-emerald-600" : "text-slate-500"}`}>
                {cfg.desc}
              </p>
            </div>
          )}

          {/* Aborted state banner */}
          {isAborted && (
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.pill}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.dot} bg-opacity-20`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold">{cfg.label}</p>
                <p className="text-xs mt-0.5 opacity-80">{cfg.desc}</p>
                {order.rejectionReason && (
                  <p className="text-xs mt-1 italic opacity-70">Reason: "{order.rejectionReason}"</p>
                )}
              </div>
            </div>
          )}

          {/* Order info rows */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 pt-4 pb-2">
              Order Info
            </p>
            {[
              { label: "Order ID",       value: `#${order._id?.slice(-10).toUpperCase()}` },
              { label: "Placed On",      value: fmtDate(order.createdAt) },
              { label: "Payment Method", value: order.paymentMethod },
              { label: "Payment Status", value: order.paymentStatus },
              order.confirmedAt  && { label: "Confirmed At",  value: fmtDate(order.confirmedAt) },
              order.cancelledAt  && { label: "Cancelled At",  value: fmtDate(order.cancelledAt) },
              order.rejectedAt   && { label: "Rejected At",   value: fmtDate(order.rejectedAt) },
              order.paidAt       && { label: "Paid At",       value: fmtDate(order.paidAt) },
            ]
              .filter(Boolean)
              .map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 first:border-0">
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                  <span className="text-xs text-slate-800 font-semibold text-right capitalize">{value ?? "—"}</span>
                </div>
              ))}
          </div>

          {/* Price breakdown */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 pt-4 pb-2">
              Price Breakdown
            </p>
            {[
              { label: "Product Price",   value: fmt(order.salePrice) },
              { label: "Commission",      value: order.commissionAmount ? `${fmt(order.commissionAmount)} (${order.commissionRate}%)` : null },
              { label: "Seller Receives", value: fmt(order.sellerEarnings) },
            ]
              .filter((r) => r.value)
              .map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 first:border-0">
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                  <span className="text-xs text-slate-800 font-semibold">{value}</span>
                </div>
              ))}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1132d4]/5 border-t border-[#1132d4]/10">
              <span className="text-sm font-bold text-slate-800">Total Paid</span>
              <span className="text-sm font-extrabold text-[#1132d4]">{fmt(order.salePrice)}</span>
            </div>
          </div>

          {/* Seller info */}
          {order.seller && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1132d4]/10 flex items-center justify-center text-[#1132d4] flex-shrink-0">
                <Ic d={I.user} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Sold by</p>
                <p className="text-sm font-bold text-slate-800">
                  {order.seller.firstname} {order.seller.lastname}
                </p>
                {order.seller.email && (
                  <p className="text-xs text-slate-400 truncate">{order.seller.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {cancelError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-xs font-medium">
              <Ic d={I.x} className="w-3.5 h-3.5 flex-shrink-0" />
              {cancelError}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          {canCancel && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Ic d={I.ban} />
              Cancel Order
            </button>
          )}

          {canCancel && showConfirm && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Ic d={I.ban} />
              )}
              {cancelling ? "Cancelling…" : "Confirm Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders panel ─────────────────────────────────────────────────────────────
function OrdersPanel() {
  const [orders,       setOrders]      = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // order detail modal

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const token    = localStorage.getItem("accessToken");

  const loadOrders = () => {
    setLoading(true);
    fetch(`${BASE_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r)  => r.json())
      .then((d)  => setOrders(d.orders ?? []))
      .catch(()  => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  // After cancel: close modal, patch local state
  const handleCancelled = (orderId) => {
    setSelectedOrder(null);
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: "cancelled", cancelledAt: new Date().toISOString() } : o))
    );
  };

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );

  if (!orders?.length)
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-[#1132d4]/8 flex items-center justify-center mx-auto mb-3 text-[#1132d4]">
          <Ic d={I.orders} className="w-6 h-6" />
        </div>
        <p className="text-slate-700 font-semibold">No orders yet</p>
        <p className="text-slate-400 text-sm mt-1">Your purchase history will appear here</p>
      </div>
    );

  return (
    <>
      <div className="space-y-3">
        {orders.map((order) => {
          const cfg      = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
          const canCancel = order.status === "pending";

          return (
            <div
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className={`flex items-center gap-4 bg-white rounded-2xl border p-4 cursor-pointer transition-all group
                ${canCancel
                  ? "border-amber-200 hover:border-amber-300 hover:shadow-[0_2px_12px_rgba(245,158,11,0.12)]"
                  : "border-slate-200 hover:border-[#1132d4]/30 hover:shadow-[0_2px_12px_rgba(17,50,212,0.08)]"
                }`}
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {order.product?.images?.[0] ? (
                  <img src={order.product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl opacity-25">📦</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#1132d4] transition-colors">
                  {order.product?.title ?? "Product"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  #{order._id?.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>

              {/* Status + price + tap hint */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${cfg.pill}`}>
                  {cfg.label}
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{(order.salePrice ?? 0).toLocaleString("en-IN")}
                </span>
                {/* Cancel quick-badge for pending */}
                {canCancel && (
                  <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                    <Ic d={I.ban} className="w-3 h-3" /> Tap to cancel
                  </span>
                )}
                {/* View detail hint for non-pending */}
                {!canCancel && (
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancelled={handleCancelled}
        />
      )}
    </>
  );
}