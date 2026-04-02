// src/features/SellerDashboard/components/ProposeSlotModal.jsx
//
// Shown to the seller when they click "Accept" on a listing.
// They can propose up to 3 pickup time slots.
// Also reused from the "accepted" card to update slots.
//
import { useState } from "react";
import toast from "react-hot-toast";

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

const PATHS = {
  x: "M6 18L18 6M6 6l12 12",
  plus: "M12 4v16m8-8H4",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  check: "M5 13l4 4L19 7",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

// Pre-built time range options for the dropdown
const TIME_RANGES = [
  "9:00 AM – 11:00 AM",
  "10:00 AM – 12:00 PM",
  "11:00 AM – 1:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "3:00 PM – 5:00 PM",
  "4:00 PM – 6:00 PM",
  "5:00 PM – 7:00 PM",
];

// Generate next 7 days as date options
function getNextDays(n = 7) {
  const days = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const value = d.toISOString().split("T")[0]; // "2025-04-10"
    days.push({ label, value });
  }
  return days;
}

const DAYS = getNextDays(7);
const EMPTY_SLOT = { date: "", timeRange: "" };

export default function ProposeSlotModal({
  listing,
  onClose,
  onSubmit,
  saving,
}) {
  const [slots, setSlots] = useState([{ ...EMPTY_SLOT }]);

  const setSlot = (i, field, value) =>
    setSlots((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );

  const addSlot = () => {
    if (slots.length < 3) setSlots((prev) => [...prev, { ...EMPTY_SLOT }]);
  };

  const removeSlot = (i) => {
    if (slots.length === 1) return; // keep at least one
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validSlots = slots.filter((s) => s.date && s.timeRange);
  const canSubmit = validSlots.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const unique = validSlots.filter(
      (s, i, arr) =>
        arr.findIndex(
          (x) => x.date === s.date && x.timeRange === s.timeRange,
        ) === i,
    );
    if (unique.length !== validSlots.length) {
      toast.error("You have duplicate time slots.");
      return;
    }
    onSubmit(unique);
    onSubmit(validSlots);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Propose Pickup Slots
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {listing.brand} {listing.model} · ₹
              {listing.finalPrice?.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <Ic d={PATHS.x} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-[#1132d4]">
            <p className="font-bold mb-1">How this works</p>
            <p>
              Propose up to 3 time slots. The user will pick one and confirm
              their payment method. You'll see the confirmed slot on your
              dashboard.
            </p>
          </div>

          {/* Slot rows */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Ic d={PATHS.clock} className="w-3.5 h-3.5 text-[#1132d4]" />
              Pickup time slots (add up to 3)
            </p>

            {slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1132d4] text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  {i + 1}
                </span>

                {/* Date picker */}
                <select
                  value={slot.date}
                  onChange={(e) => setSlot(i, "date", e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:border-[#1132d4] focus:ring-2 focus:ring-[#1132d4]/10 transition-all"
                >
                  <option value="">Select date</option>
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

                {/* Time range picker */}
                <select
                  value={slot.timeRange}
                  onChange={(e) => setSlot(i, "timeRange", e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:border-[#1132d4] focus:ring-2 focus:ring-[#1132d4]/10 transition-all"
                >
                  <option value="">Select time</option>
                  {TIME_RANGES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Remove slot */}
                {slots.length > 1 && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                  >
                    <Ic d={PATHS.trash} className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Add slot */}
            {slots.length < 3 && (
              <button
                onClick={addSlot}
                className="flex items-center gap-2 text-xs font-semibold text-[#1132d4] hover:underline"
              >
                <Ic d={PATHS.plus} className="w-3.5 h-3.5" />
                Add another slot
              </button>
            )}
          </div>

          {/* Valid slot count hint */}
          {validSlots.length > 0 && (
            <p className="text-xs text-slate-400">
              {validSlots.length} valid slot{validSlots.length > 1 ? "s" : ""}{" "}
              will be sent to the user.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1132d4] hover:bg-[#0d28b8] disabled:opacity-50 text-white text-sm font-bold transition-all"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Ic d={PATHS.check} />
            )}
            {saving ? "Sending…" : "Accept & Send Slots"}
          </button>
        </div>
      </div>
    </div>
  );
}
