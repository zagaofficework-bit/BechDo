import { useState } from "react";
const ActionModal = ({ seller, action, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  if (!seller) return null;
  const cfgMap = {
    pause:     { title: "Pause Subscription",    icon: "⏸", btnBg: "bg-amber-500 hover:bg-amber-600",     label: "Pause",        needsReason: true  },
    ban:       { title: "Permanently Ban Seller", icon: "🚫", btnBg: "bg-red-500 hover:bg-red-600",        label: "Ban Seller",   needsReason: true  },
    reinstate: { title: "Reinstate Seller",       icon: "✓",  btnBg: "bg-emerald-600 hover:bg-emerald-700", label: "Reinstate",   needsReason: false },
  };
  const cfg = cfgMap[action] || {};
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-[0_20px_60px_rgba(17,50,212,0.14)] p-6 w-full sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle on mobile */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">{cfg.icon}</div>
          <div>
            <p className="font-extrabold text-slate-800 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{cfg.title}</p>
            <p className="text-xs text-slate-400">{seller.name}</p>
          </div>
        </div>
        {cfg.needsReason && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Reason *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Describe the reason…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1132d4] focus:ring-2 focus:ring-[#1132d4]/10 transition-all resize-none" />
            {!reason.trim() && <p className="text-xs text-red-400 mt-1">Reason is required</p>}
          </div>
        )}
        <div className="flex gap-2.5">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason.trim())}
            disabled={loading || (cfg.needsReason && !reason.trim())}
            className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50 ${cfg.btnBg}`}>
            {loading ? "Processing…" : cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ActionModal;