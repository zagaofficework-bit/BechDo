import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import PlanBadge from "../common/PlanBadge";

const SellerDetailPanel = ({ seller: s, onClose, onAction }) => {
  if (!s) return null;
  const sub     = s.subscription;
  const PLAN_CFG = {
  basic: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  standard: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
  },
  premium: {
    color: "text-[#1132d4]",
    bg: "bg-blue-50",
    border: "border-blue-200",
    bar: "bg-[#1132d4]",
  },
  "—": {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    bar: "bg-slate-300",
  },
};

const STATUS_CFG = {
  active: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Active",
  },
  suspended: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Suspended",
  },
  banned: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Banned",
  },
  expired: {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "Expired",
  },
  revoked: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
    label: "Revoked",
  },
  pending: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Pending",
  },
  confirmed: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    label: "Confirmed",
  },
  shipped: {
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    label: "Shipped",
  },
  delivered: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Delivered",
  },
  rejected: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Rejected",
  },
  cancelled: {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "Cancelled",
  },
  completed: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Completed",
  },
  refunded: {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "Refunded",
  },
};
  const planKey = sub.plan?.toLowerCase() ?? "—";
  const planCfg = PLAN_CFG[planKey] || PLAN_CFG["—"];
  const progressPct =
    sub.subscriptionStatus === "active" && sub.daysRemaining > 0
      ? Math.min(100, Math.round((sub.daysRemaining / 365) * 100))
      : 0;
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>
      {/* Backdrop — only on mobile */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />

      {/* Panel */}
      <div className={`
        fixed z-40 bg-white border-slate-100 shadow-[0_0_40px_rgba(17,50,212,0.1)] overflow-y-auto
        /* mobile: bottom sheet */
        bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh] border-t
        /* desktop: right sidebar */
        lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-96 lg:rounded-none lg:border-l lg:border-t-0 lg:max-h-none
      `}>
        {/* Drag handle — mobile only */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-4 mb-2 lg:hidden" />

        <div className="p-5">
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl mb-5 transition-colors hover:border-slate-300">
            ← Back
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3 mb-5">
            <Avatar name={s.seller.name} size={12} />
            <div>
              <p className="font-extrabold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.seller.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.seller.email}</p>
              <div className="mt-1.5"><StatusBadge status={s.seller.accountStatus} /></div>
            </div>
          </div>

          {/* Seller info */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Seller Info</p>
            {[
              ["Mobile",           s.seller.mobile],
              ["Joined",           fmtDate(s.seller.joinedAt)],
              ["Products Listed",  s.productsListed],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-400">{k}</span>
                <span className="text-xs font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>

          {/* Subscription */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Subscription</p>
            <div className="flex items-center justify-between mb-3">
              <PlanBadge plan={sub.plan} />
              <StatusBadge status={sub.subscriptionStatus} />
            </div>
            {[
              ["Price",          `₹${sub.price.toLocaleString("en-IN")}/yr`],
              ["Start",          fmtDate(sub.startDate)],
              ["End",            fmtDate(sub.endDate)],
              ["Listings Limit", sub.activeListingsLimit === -1 ? "Unlimited" : sub.activeListingsLimit],
              ["Support",        sub.supportType],
              ["Payment",        sub.paymentMethod],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-400">{k}</span>
                <span className="text-xs font-semibold text-slate-700 capitalize">{v}</span>
              </div>
            ))}
            {sub.subscriptionStatus === "active" && sub.daysRemaining > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-slate-400">Days Remaining</span>
                  <span className={`text-xs font-bold font-mono ${planCfg.color}`}>{sub.daysRemaining}d</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${planCfg.bar}`} style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Reason box */}
          {(s.seller.suspensionReason || s.seller.banReason) && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">
                {s.seller.accountStatus === "banned" ? "Ban Reason" : "Suspension Reason"}
              </p>
              <p className="text-sm text-red-700 leading-relaxed">{s.seller.suspensionReason || s.seller.banReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pb-6">
            {s.seller.accountStatus === "active" && (
              <button onClick={() => onAction("pause", s)}
                className="w-full py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-bold hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                ⏸ Pause Subscription
              </button>
            )}
            {s.seller.accountStatus === "suspended" && (
              <button onClick={() => onAction("reinstate", s)}
                className="w-full py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">
                ✓ Reinstate Seller
              </button>
            )}
            {s.seller.accountStatus !== "banned" && (
              <button onClick={() => onAction("ban", s)}
                className="w-full py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                🚫 Permanently Ban
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default SellerDetailPanel;