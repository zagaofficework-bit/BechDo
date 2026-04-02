// PickupConfirmModal.jsx — Responsive

import { useState } from "react";
import { confirmPickup } from "../../../services/deviceSell.api";
import toast from "react-hot-toast";

const Ic = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const PATHS = {
  x:    "M6 18L18 6M6 6l12 12",
  check:"M5 13l4 4L19 7",
  clock:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  cash: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  upi:  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  bank: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
};

const PAYMENT_OPTIONS = [
  { key: "cash",          label: "Cash",          icon: PATHS.cash, desc: "Seller pays in cash at pickup" },
  { key: "upi",           label: "UPI",           icon: PATHS.upi,  desc: "Enter your UPI ID" },
  { key: "bank_transfer", label: "Bank Transfer", icon: PATHS.bank, desc: "Enter account number & IFSC" },
];

export default function PickupConfirmModal({ listing, onClose, onConfirmed }) {
  const [selectedSlot,    setSelectedSlot]    = useState(null);
  const [paymentMethod,   setPaymentMethod]   = useState(null);
  const [paymentDetails,  setPaymentDetails]  = useState("");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState(null);

  const slots        = listing.pickup?.proposedSlots ?? [];
  const sellerName   = listing.acceptedBy ? `${listing.acceptedBy.firstname} ${listing.acceptedBy.lastname}` : "the seller";
  const sellerMobile = listing.acceptedBy?.mobile ?? null;
  const needsDetails = ["upi", "bank_transfer"].includes(paymentMethod);
  const canSubmit    = selectedSlot !== null && paymentMethod !== null && (!needsDetails || paymentDetails.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await confirmPickup(listing._id, { slotIndex: selectedSlot, paymentMethod, paymentDetails: needsDetails ? paymentDetails.trim() : undefined });
      onConfirmed();
      toast.success("Pickup confirmed! 🎉");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @media(max-width:640px){
          .pcm-modal {
            max-width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            margin-top: auto !important;
            max-height: 92vh !important;
          }
          .pcm-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .pcm-footer { flex-direction: column !important; }
          .pcm-footer button { width: 100%; }
          .pcm-slot-pair { gap: 6px !important; }
          .pcm-slot-pair select { font-size: 12px !important; }
        }
      `}</style>

      <div className="pcm-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="pcm-modal bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl"
            style={{ background: "linear-gradient(to right, #0077b6, #338ec7)" }}>
            <div>
              <h3 className="font-extrabold text-white text-base">Confirm Pickup</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(219,234,254,0.85)" }}>
                {listing.brand} {listing.model} · ₹{listing.finalPrice?.toLocaleString("en-IN")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              <Ic d={PATHS.x} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Seller info */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#e8f4fd", border: "1px solid #cce4f6" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#0077b6" }}>
                <span className="text-white text-xs font-bold">{sellerName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{sellerName} will pick up your device</p>
                {sellerMobile && <p className="text-xs text-slate-500 mt-0.5">📞 {sellerMobile}</p>}
              </div>
            </div>

            {/* Step 1 */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Ic d={PATHS.clock} className="w-3.5 h-3.5" style={{ color: "#0077b6" }} />
                Step 1 — Choose a pickup slot
              </p>
              {slots.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  The seller hasn't proposed any slots yet. They will contact you shortly.
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSlot(i)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
                      style={selectedSlot === i ? { borderColor: "#0077b6", background: "#e8f4fd" } : { borderColor: "#e2e8f0", background: "#f8fafc" }}
                      onMouseEnter={(e) => { if (selectedSlot !== i) e.currentTarget.style.borderColor = "rgba(0,119,182,0.4)"; }}
                      onMouseLeave={(e) => { if (selectedSlot !== i) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: selectedSlot === i ? "#0077b6" : "#cbd5e1" }}>
                        {selectedSlot === i && <span className="w-2 h-2 rounded-full" style={{ background: "#0077b6" }} />}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{slot.date}</p>
                        <p className="text-xs text-slate-500">{slot.timeRange}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Ic d={PATHS.cash} className="w-3.5 h-3.5" style={{ color: "#0077b6" }} />
                Step 2 — How would you like to receive payment?
              </p>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setPaymentMethod(opt.key); setPaymentDetails(""); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
                    style={paymentMethod === opt.key ? { borderColor: "#0077b6", background: "#e8f4fd" } : { borderColor: "#e2e8f0", background: "#f8fafc" }}
                    onMouseEnter={(e) => { if (paymentMethod !== opt.key) e.currentTarget.style.borderColor = "rgba(0,119,182,0.4)"; }}
                    onMouseLeave={(e) => { if (paymentMethod !== opt.key) e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: paymentMethod === opt.key ? "#0077b6" : "#cbd5e1" }}>
                      {paymentMethod === opt.key && <span className="w-2 h-2 rounded-full" style={{ background: "#0077b6" }} />}
                    </span>
                    <Ic d={opt.icon} className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-400">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {needsDetails && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder={paymentMethod === "upi" ? "Enter your UPI ID (e.g. name@upi)" : "Account number · IFSC · Bank name"}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
                    onFocus={(e) => { e.target.style.borderColor = "#0077b6"; e.target.style.boxShadow = "0 0 0 2px rgba(0,119,182,0.1)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠ {error}</div>
            )}

            {canSubmit && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1 text-xs text-emerald-700">
                <p className="font-bold text-emerald-800">Confirmation summary</p>
                <p>📅 {slots[selectedSlot]?.date} · {slots[selectedSlot]?.timeRange}</p>
                <p>💳 {PAYMENT_OPTIONS.find((o) => o.key === paymentMethod)?.label}{paymentDetails && ` — ${paymentDetails}`}</p>
                <p>💰 You will receive ₹{listing.finalPrice?.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pcm-footer px-6 py-4 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => {
                if ((selectedSlot !== null || paymentMethod !== null) && !window.confirm("Are you sure? Your selections will be lost.")) return;
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving || slots.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "#0077b6" }}
              onMouseEnter={(e) => { if (canSubmit && !saving) e.currentTarget.style.background = "#005f8f"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0077b6"; }}
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Ic d={PATHS.check} />}
              {saving ? "Confirming…" : "Confirm Pickup"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}