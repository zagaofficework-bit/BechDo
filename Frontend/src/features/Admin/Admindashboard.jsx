import { useState, useEffect, useRef } from "react";
import {
  useAdminSellers,
  useAdminOrders,
  useSellerControls,
} from "../../hooks/useAdmin";
import { io as socketIO } from "socket.io-client";
import BackButton from "../common/BackButton";

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL   = import.meta.env.VITE_API_URL   || "http://localhost:3000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");
  const res   = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const multipartFetch = async (endpoint, fd) => {
  const token = localStorage.getItem("accessToken");
  const res   = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const apiGetMessages  = (id)          => authFetch(`/messages?receiverId=${id}`);
const apiDeleteMessage = (id)         => authFetch(`/messages/${id}`, { method: "DELETE" });
const apiSendMessage  = (id, msg, img) => {
  if (img) {
    const f = new FormData();
    f.append("receiverId", id);
    f.append("message", msg || "");
    f.append("image", img);
    return multipartFetch("/messages/send", f);
  }
  return authFetch("/messages/send", {
    method: "POST",
    body: JSON.stringify({ receiverId: id, message: msg }),
  });
};

// ─── Normalization ────────────────────────────────────────────────────────────
const normalizeSellerEntry = (entry) => {
  const sub = entry.subscription ?? {};
  const computeStatus = () => {
    if (sub.subscriptionStatus) return sub.subscriptionStatus;
    if (sub.isActive === false)  return "revoked";
    if (sub.endDate && new Date(sub.endDate) < new Date()) return "expired";
    return "active";
  };
  const computeDays = () => {
    if (typeof sub.daysRemaining === "number") return sub.daysRemaining;
    if (!sub.isActive || !sub.endDate) return 0;
    const diff = new Date(sub.endDate) - new Date();
    return diff > 0 ? Math.ceil(diff / 86400000) : 0;
  };
  return {
    subscriptionId: entry.subscriptionId ?? sub._id,
    productsListed: entry.productsListed ?? 0,
    seller: {
      id:               entry.seller?.id ?? entry.seller?._id,
      name:             entry.seller?.name ?? "—",
      email:            entry.seller?.email ?? "—",
      mobile:           entry.seller?.phone ?? entry.seller?.mobile ?? "—",
      joinedAt:         entry.seller?.joinedAt ?? null,
      accountStatus:    entry.seller?.accountStatus ?? "active",
      suspensionReason: entry.seller?.suspensionReason ?? null,
      banReason:        entry.seller?.banReason ?? null,
    },
    subscription: {
      plan:                sub.plan ?? "—",
      price:               sub.price ?? 0,
      isActive:            sub.isActive ?? false,
      subscriptionStatus:  computeStatus(),
      daysRemaining:       computeDays(),
      startDate:           sub.startDate ?? null,
      endDate:             sub.endDate ?? null,
      paymentMethod:       sub.paymentMethod ?? "—",
      activeListingsLimit: sub.activeListingsLimit ?? 0,
      prioritySupport:     sub.prioritySupport ?? false,
      supportType:         sub.supportType ?? "none",
    },
  };
};

const normalizeOrder = (o) => ({
  id:               o._id,
  buyer:            o.buyer  ? `${o.buyer.firstname} ${o.buyer.lastname}`.trim() : "—",
  seller:           o.seller ? `${o.seller.firstname} ${o.seller.lastname}`.trim() : "—",
  product:          o.product?.title ?? "—",
  amount:           o.salePrice ?? o.product?.price ?? 0,
  status:           o.status ?? "pending",
  date:             o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : "—",
  transactionType:  o.transactionType ?? "buy",
  commissionAmount: o.commissionAmount ?? 0,
  commissionEarned: o.status === "delivered",
});

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);
const SendIcon  = () => <Icon path="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" className="w-4 h-4" />;
const SearchIcon = () => <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4" />;
const ImageIcon  = () => <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-5 h-5" />;

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_CFG = {
  basic:    { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
  standard: { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   bar: "bg-amber-500"   },
  premium:  { color: "text-[#1132d4]",   bg: "bg-blue-50",    border: "border-blue-200",    bar: "bg-[#1132d4]"   },
  "—":      { color: "text-slate-500",   bg: "bg-slate-100",  border: "border-slate-200",   bar: "bg-slate-300"   },
};

const STATUS_CFG = {
  active:    { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500", label: "Active"    },
  suspended: { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500",   label: "Suspended" },
  banned:    { color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500",     label: "Banned"    },
  expired:   { color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-200",   dot: "bg-slate-400",   label: "Expired"   },
  revoked:   { color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-400",     label: "Revoked"   },
  pending:   { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500",   label: "Pending"   },
  confirmed: { color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200",    dot: "bg-blue-500",    label: "Confirmed" },
  shipped:   { color: "text-indigo-700",  bg: "bg-indigo-50",   border: "border-indigo-200",  dot: "bg-indigo-500",  label: "Shipped"   },
  delivered: { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500", label: "Delivered" },
  rejected:  { color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500",     label: "Rejected"  },
  cancelled: { color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-200",   dot: "bg-slate-400",   label: "Cancelled" },
  completed: { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500", label: "Completed" },
  refunded:  { color: "text-slate-500",   bg: "bg-slate-100",   border: "border-slate-200",   dot: "bg-slate-400",   label: "Refunded"  },
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 10 }) => {
  const initials = (name || "??").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const hue      = ((name?.charCodeAt(0) ?? 0) * 15) % 360;
  const px       = size * 4;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
      style={{ width: px, height: px, minWidth: px, minHeight: px,
        background: `hsl(${hue},55%,90%)`, color: `hsl(${hue},55%,35%)`,
        border: `2px solid hsl(${hue},45%,78%)` }}
    >
      {initials}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.active;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PlanBadge = ({ plan }) => {
  const key = plan?.toLowerCase() ?? "—";
  const cfg = PLAN_CFG[key] || PLAN_CFG["—"];
  return (
    <span className={`inline-flex items-center text-xs font-extrabold px-2.5 py-1 rounded-full border capitalize ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      {plan || "—"}
    </span>
  );
};

const SkeletonRow = ({ cols = 7 }) => (
  <tr className="border-b border-slate-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3.5 rounded animate-pulse bg-slate-100"
          style={{ width: i === 0 ? "80%" : i === cols - 1 ? "50px" : "60%",
            backgroundImage: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
            backgroundSize: "200% 100%" }} />
      </td>
    ))}
  </tr>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
    <div className="flex gap-2">
      <div className="h-6 bg-slate-100 rounded-full w-16" />
      <div className="h-6 bg-slate-100 rounded-full w-16" />
    </div>
  </div>
);

const StatCard = ({ label, value, color, bg, border, loading }) => (
  <div className={`${bg} border ${border} rounded-2xl p-4 shadow-[0_2px_12px_rgba(17,50,212,0.04)]`}>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
    {loading ? (
      <div className="h-7 w-1/2 rounded-lg animate-pulse"
        style={{ backgroundImage: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%" }} />
    ) : (
      <p className={`text-2xl sm:text-3xl font-extrabold leading-tight ${color}`}
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {value}
      </p>
    )}
  </div>
);

// ─── Action Modal ─────────────────────────────────────────────────────────────
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

// ─── Seller Detail Panel ──────────────────────────────────────────────────────
// On mobile: bottom sheet. On desktop: right sidebar.
const SellerDetailPanel = ({ seller: s, onClose, onAction }) => {
  if (!s) return null;
  const sub     = s.subscription;
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

// ─── Seller Card (mobile) ─────────────────────────────────────────────────────
const SellerCard = ({ s, i, onSelect, onAction }) => {
  const days      = s.subscription.daysRemaining;
  const daysColor = days > 90 ? "text-emerald-600" : days > 30 ? "text-amber-600" : days > 0 ? "text-red-500" : "text-slate-400";

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(17,50,212,0.04)] p-4 cursor-pointer hover:border-[#1132d4]/30 hover:shadow-[0_4px_16px_rgba(17,50,212,0.08)] transition-all"
      onClick={() => onSelect(s)}
      style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={s.seller.name} size={10} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{s.seller.name}</p>
              <p className="text-xs text-slate-400 truncate">{s.seller.email}</p>
            </div>
            <PlanBadge plan={s.subscription.plan} />
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={s.seller.accountStatus} />
            <StatusBadge status={s.subscription.subscriptionStatus} />
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                📦 <span className="font-semibold text-slate-600">{s.productsListed}</span> listings
              </span>
              <span className={`text-xs font-bold font-mono ${daysColor}`}>
                {days > 0 ? `${days}d left` : "—"}
              </span>
            </div>
            {/* Inline quick actions */}
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              {s.seller.accountStatus === "active" && (
                <button onClick={() => onAction("pause", s)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                  Pause
                </button>
              )}
              {s.seller.accountStatus === "suspended" && (
                <button onClick={() => onAction("reinstate", s)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all">
                  Reinstate
                </button>
              )}
              {s.seller.accountStatus !== "banned" && (
                <button onClick={() => onAction("ban", s)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white transition-all">
                  Ban
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Order Card (mobile) ──────────────────────────────────────────────────────
const OrderCard = ({ o, i }) => (
  <div
    className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(17,50,212,0.04)] p-4"
    style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1132d4] font-mono">#{o.id?.slice(-8)}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{o.product}</p>
        <p className="text-xs text-slate-400 mt-0.5">{o.date}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <StatusBadge status={o.status} />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
          o.transactionType === "sell"
            ? "bg-purple-50 text-purple-700 border border-purple-200"
            : "bg-blue-50 text-[#1132d4] border border-blue-200"
        }`}>
          {o.transactionType}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
      <div>
        <p className="text-slate-400 mb-0.5">Buyer</p>
        <p className="font-semibold text-slate-700 truncate">{o.buyer}</p>
      </div>
      <div>
        <p className="text-slate-400 mb-0.5">Seller</p>
        <p className="font-semibold text-slate-700 truncate">{o.seller}</p>
      </div>
      <div>
        <p className="text-slate-400 mb-0.5">Amount</p>
        <p className="font-bold text-slate-800 font-mono">₹{o.amount.toLocaleString("en-IN")}</p>
      </div>
      <div>
        <p className="text-slate-400 mb-0.5">Commission</p>
        {o.commissionEarned ? (
          <p className="font-bold text-emerald-700 font-mono">₹{o.commissionAmount.toLocaleString("en-IN")}</p>
        ) : (
          <p className="text-slate-400">
            {["pending", "confirmed", "shipped"].includes(o.status) ? "Pending delivery" : "—"}
          </p>
        )}
      </div>
    </div>
  </div>
);

// ─── Chat: Seller List ────────────────────────────────────────────────────────
const ChatSellerList = ({ sellers, activeSellerId, onSelect, unreadCounts, lastMessages, onBack }) => {
  const [search, setSearch] = useState("");
  const filtered = sellers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="flex flex-col bg-white h-full">
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <p className="font-extrabold text-slate-800 text-sm mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Seller Chats</p>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-[#1132d4] transition-colors">
          <span className="text-slate-400"><SearchIcon /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers…"
            className="bg-transparent text-sm text-slate-600 outline-none flex-1 placeholder-slate-400" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">No sellers found</p>
        ) : (
          filtered.map((s) => {
            const active = activeSellerId === s.id;
            const unread = unreadCounts[s.id] ?? 0;
            const last   = lastMessages[s.id];
            return (
              <button key={s.id} onClick={() => onSelect(s)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-l-2 transition-all ${
                  active ? "bg-blue-50/70 border-[#1132d4]" : "border-transparent hover:bg-slate-50"
                }`}>
                <div className="relative flex-shrink-0">
                  <Avatar name={s.name} size={9} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-1">
                    <span className={`text-sm truncate ${active || unread > 0 ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                      {s.name}
                    </span>
                    {last && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(last.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-slate-700 font-semibold" : "text-slate-400"}`}>
                    {last ? (last.image ? "📷 Image" : last.message || "…") : "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Chat: Window ─────────────────────────────────────────────────────────────
const ChatWindow = ({ seller, adminId, onBack }) => {
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [error,      setError]      = useState(null);
  const [roomId,     setRoomId]     = useState(null);
  const [isTyping,   setIsTyping]   = useState(false);
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const socketRef   = useRef(null);
  const typingTimer = useRef(null);
  const imgInputRef = useRef(null);

  useEffect(() => {
    if (!seller?.id) return;
    setFetching(true);
    setMessages([]);
    setError(null);
    apiGetMessages(seller.id)
      .then((res) => { setMessages(res.messages ?? []); setRoomId(res.roomId); })
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));

    const socket = socketIO(SOCKET_URL, {
      auth: { token: localStorage.getItem("accessToken") },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      const r = [adminId, seller.id].map(String).sort().join("_");
      socket.emit("joinRoom", r);
    });
    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const hasOpt = prev.some((m) => m._optimistic);
        if (hasOpt && msg.from?._id?.toString() === adminId?.toString()) {
          let done = false;
          return prev.map((m) => { if (!done && m._optimistic) { done = true; return msg; } return m; });
        }
        return [...prev, msg];
      });
    });
    socket.on("messageDeleted", ({ messageId }) =>
      setMessages((prev) => prev.filter((m) => m._id !== messageId)),
    );
    socket.on("typing",     () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));
    return () => { socket.disconnect(); clearTimeout(typingTimer.current); };
  }, [seller?.id, adminId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, [seller?.id]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!roomId || !socketRef.current) return;
    socketRef.current.emit("typing", roomId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit("stopTyping", roomId), 1500);
  };

  const clearImg = () => {
    setImgFile(null); setImgPreview(null);
    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !imgFile) || loading || !seller?.id) return;
    setLoading(true);
    setError(null);
    const opt = { _id: `opt_${Date.now()}`, from: { _id: adminId }, to: { _id: seller.id },
      message: text, image: imgPreview ?? "", createdAt: new Date().toISOString(), _optimistic: true };
    setMessages((prev) => [...prev, opt]);
    setInput("");
    clearImg();
    socketRef.current?.emit("stopTyping", roomId);
    try {
      const res = await apiSendMessage(seller.id, text, imgFile);
      setMessages((prev) => prev.map((m) => (m._id === opt._id ? res.data : m)));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== opt._id));
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await apiDeleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) { setError(err.message); }
  };

  const isOwn    = (msg) => msg.from?._id?.toString() === adminId?.toString() || msg._optimistic;
  const fmtTime  = (d)   => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  if (!seller) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-3 text-center p-8">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl">💬</div>
        <p className="font-bold text-slate-500">Select a seller to chat</p>
        <p className="text-xs text-slate-400">Choose a conversation from the left panel</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-white flex-shrink-0">
        {/* Back button — mobile only */}
        {onBack && (
          <button onClick={onBack} className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 lg:hidden">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Avatar name={seller.name} size={9} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{seller.name}</p>
          <p className="text-xs text-slate-400 truncate">{seller.email}</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex-shrink-0">● SELLER</span>
        {isTyping && <span className="text-xs text-slate-400 italic flex-shrink-0">typing…</span>}
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-red-600">⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-slate-50">
        {fetching ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-5 h-5 border-2 border-[#1132d4]/20 border-t-[#1132d4] rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
            <span className="text-xs text-slate-400">Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <span className="text-3xl">💬</span>
            <p className="text-sm font-bold text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-400">Start the conversation with {seller.name}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const own = isOwn(msg);
              return (
                <div key={msg._id ? `m-${msg._id}` : `i-${i}`}
                  className={`flex ${own ? "justify-end" : "justify-start"} items-end gap-2 group`}>
                  {!own && <Avatar name={seller.name} size={7} />}
                  <div className={`max-w-[75%] sm:max-w-[70%] flex flex-col gap-1 ${own ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      own
                        ? "bg-[#1132d4] text-white rounded-br-md shadow-[0_2px_8px_rgba(17,50,212,0.28)]"
                        : "bg-white text-slate-700 border border-slate-100 rounded-bl-md shadow-sm"
                    } ${msg._optimistic ? "opacity-60" : ""}`}>
                      {msg.image && <img src={msg.image} alt="" className="rounded-xl mb-2 max-w-full max-h-40 object-cover" />}
                      {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">{fmtTime(msg.createdAt)}</span>
                      {msg._optimistic && <span className="text-xs text-slate-400">Sending…</span>}
                      {own && !msg._optimistic && (
                        <button onClick={() => handleDelete(msg._id)}
                          className="text-xs text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex items-end gap-2">
                <Avatar name={seller.name} size={7} />
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-[#1132d4]/50"
                      style={{ animation: `bounce 1s ease ${j * 0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imgPreview && (
        <div className="px-4 pt-2 pb-1 bg-white border-t border-slate-100 flex items-center gap-2 flex-shrink-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
            <img src={imgPreview} alt="" className="w-full h-full object-cover" />
            <button onClick={clearImg} className="absolute top-0.5 right-0.5 w-4 h-4 bg-slate-900/60 text-white rounded-full text-xs flex items-center justify-center">✕</button>
          </div>
          <span className="text-xs text-slate-400 truncate">{imgFile?.name}</span>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-[#1132d4] focus-within:ring-2 focus-within:ring-[#1132d4]/10 transition-all">
          <button onClick={() => imgInputRef.current?.click()} title="Attach image"
            className="text-slate-400 hover:text-[#1132d4] transition-colors flex-shrink-0 pb-0.5">
            <ImageIcon />
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)); } }} />
          <textarea ref={inputRef} rows={1} value={input} onChange={handleInput}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Reply to ${seller.name}…`}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none resize-none leading-relaxed py-0.5"
            style={{ maxHeight: 80 }} />
          <button onClick={handleSend} disabled={(!input.trim() && !imgFile) || loading}
            className="w-8 h-8 rounded-xl bg-[#1132d4] disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center flex-shrink-0 hover:bg-[#0d28b8] active:scale-95 transition-all shadow-sm disabled:shadow-none">
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
            ) : <SendIcon />}
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-1.5 hidden sm:block">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab,         setActiveTab]         = useState("subscriptions");
  const [selectedSeller,    setSelectedSeller]    = useState(null);
  const [modalState,        setModalState]        = useState({ open: false, action: null, seller: null });
  const [filter,            setFilter]            = useState("all");
  const [toast,             setToast]             = useState(null);
  const [activeChatSeller,  setActiveChatSeller]  = useState(null);
  const [chatView,          setChatView]          = useState("list"); // "list" | "window" — mobile only
  const [unreadCounts,      setUnreadCounts]      = useState({});
  const [lastMessages,      setLastMessages]      = useState({});
  const [totalUnread,       setTotalUnread]       = useState(0);
  const [adminId,           setAdminId]           = useState(null);

  useEffect(() => {
    try {
      const token  = localStorage.getItem("accessToken");
      if (!token) return;
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const p      = JSON.parse(atob(base64));
      setAdminId(p.id || p._id || p.userId);
    } catch { /* ignore */ }
  }, []);

  const { sellers: rawSellers, sellerPagination, loading: sellersLoading, error: sellersError, fetchSellers } = useAdminSellers();
  const { orders: rawOrders, commissionSummary, loading: ordersLoading, error: ordersError, fetchOrders }     = useAdminOrders();
  const { pauseSeller, banSeller, reinstateSeller, loading: actionLoading, error: actionError, clearError }   = useSellerControls();

  const sellers     = (rawSellers ?? []).map(normalizeSellerEntry);
  const orders      = (rawOrders  ?? []).map(normalizeOrder);
  const chatSellers = sellers
    .filter((s) => s.subscription.plan?.toLowerCase() === "premium")
    .map((s) => ({ id: s.seller.id, name: s.seller.name, email: s.seller.email }));

  useEffect(() => { if (activeTab === "orders") fetchOrders({ limit: 20 }); }, [activeTab]);

  useEffect(() => {
    if (!adminId || chatSellers.length === 0) return;
    const socket = socketIO(SOCKET_URL, {
      auth: { token: localStorage.getItem("accessToken") }, transports: ["websocket"],
    });
    chatSellers.forEach((s) => {
      const r = [adminId, s.id].map(String).sort().join("_");
      socket.emit("joinRoom", r);
    });
    socket.on("newMessage", (msg) => {
      const fromId = msg.from?._id?.toString();
      if (!fromId || fromId === adminId?.toString()) return;
      setLastMessages((prev) => ({ ...prev, [fromId]: msg }));
      if (activeTab !== "chats" || activeChatSeller?.id !== fromId) {
        setUnreadCounts((prev) => ({ ...prev, [fromId]: (prev[fromId] ?? 0) + 1 }));
        setTotalUnread((prev) => prev + 1);
      }
    });
    return () => socket.disconnect();
  }, [adminId, chatSellers.length, activeTab, activeChatSeller?.id]);

  const handleSelectChatSeller = (s) => {
    const cleared = unreadCounts[s.id] ?? 0;
    setUnreadCounts((prev) => ({ ...prev, [s.id]: 0 }));
    setTotalUnread((prev) => Math.max(0, prev - cleared));
    setActiveChatSeller(s);
    setChatView("window"); // mobile: switch to window pane
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filterCounts = {
    all:       sellers.length,
    active:    sellers.filter((s) => s.seller.accountStatus === "active" && s.subscription.subscriptionStatus === "active").length,
    suspended: sellers.filter((s) => s.seller.accountStatus === "suspended").length,
    banned:    sellers.filter((s) => s.seller.accountStatus === "banned").length,
    expired:   sellers.filter((s) => s.subscription.subscriptionStatus === "expired").length,
  };

  const filteredSellers = sellers.filter((s) => {
    if (filter === "active")    return s.seller.accountStatus === "active" && s.subscription.subscriptionStatus === "active";
    if (filter === "suspended") return s.seller.accountStatus === "suspended";
    if (filter === "banned")    return s.seller.accountStatus === "banned";
    if (filter === "expired")   return s.subscription.subscriptionStatus === "expired";
    return true;
  });

  const commission = commissionSummary ?? { totalCommissionEarned: 0, totalCompletedOrders: 0, totalPlatformSales: 0 };

  const handleAction = (action, entry) => { clearError(); setModalState({ open: true, action, seller: entry }); };

  const handleConfirm = async (reason) => {
    const { action, seller } = modalState;
    const id = seller.seller.id;
    let res = null;
    if (action === "pause")     res = await pauseSeller(id, reason);
    if (action === "ban")       res = await banSeller(id, reason);
    if (action === "reinstate") res = await reinstateSeller(id, reason);
    if (!res) { showToast(actionError || "Action failed", "error"); return; }
    setSelectedSeller(null);
    setModalState({ open: false, action: null, seller: null });
    await fetchSellers();
    showToast({ pause: "Subscription paused", ban: "Seller banned", reinstate: "Seller reinstated" }[action] || "Done");
  };

  const NAV = [
    { id: "subscriptions", label: "Sellers",  icon: "◈" },
    { id: "orders",        label: "Orders",   icon: "◎" },
    { id: "chats",         label: "Chats",    icon: "◉", badge: totalUnread },
  ];

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        .row-hover:hover { background: #f8fafc; cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-[0_1px_8px_rgba(17,50,212,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex gap-3 sm:gap-6 items-center">
          <BackButton />
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#1132d4] flex items-center justify-center shadow-[0_2px_8px_rgba(17,50,212,0.4)] flex-shrink-0">
              <span className="text-white text-sm font-black">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Admin Panel</p>
              <p className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Platform mini-stats — visible in header on mobile */}
          <div className="flex items-center gap-3 sm:hidden">
            {totalUnread > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#1132d4] to-[#3b5ef5] flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white text-xs font-bold">AD</span>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex gap-6 items-start">

        {/* ── Sidebar — desktop only ── */}
        <aside className="w-52 flex-shrink-0 sticky top-20 space-y-3 hidden lg:block">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] p-2">
            {NAV.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === item.id
                    ? "bg-[#1132d4] text-white shadow-[0_2px_8px_rgba(17,50,212,0.35)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </div>
                {item.badge > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    activeTab === item.id ? "bg-white/25 text-white" : "bg-red-500 text-white"
                  }`}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Platform</p>
            {[
              { label: "Commission", value: commission.totalCommissionEarned > 0 ? `₹${(commission.totalCommissionEarned / 1000).toFixed(1)}k` : "—", color: "text-emerald-600" },
              { label: "Orders",     value: commission.totalCompletedOrders  > 0 ? commission.totalCompletedOrders.toLocaleString() : "—",                color: "text-[#1132d4]"  },
              { label: "Sales",      value: commission.totalPlatformSales    > 0 ? `₹${(commission.totalPlatformSales / 1000).toFixed(0)}k` : "—",        color: "text-amber-600"  },
            ].map(({ label, value, color }) => (
              <div key={label} className="mb-3 last:mb-0">
                <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                {ordersLoading ? (
                  <div className="h-5 w-12 rounded bg-slate-100 animate-pulse" />
                ) : (
                  <p className={`text-base font-extrabold ${color}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">

          {/* ════ SUBSCRIPTIONS ════ */}
          {activeTab === "subscriptions" && (
            <div className="fade-up space-y-4 sm:space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Seller Subscriptions
                </h1>
                <p className="text-sm text-slate-400 mt-1">Manage and monitor all seller subscription accounts</p>
              </div>

              {sellersError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 flex items-center justify-between text-sm">
                  <span>⚠ {sellersError}</span>
                  <button onClick={() => fetchSellers()} className="text-xs border border-red-300 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors font-semibold">Retry</button>
                </div>
              )}

              {/* Stat cards — 2 cols on mobile, 4 on lg */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Total Sellers" value={sellerPagination.total ?? sellers.length} color="text-[#1132d4]"    bg="bg-blue-50"    border="border-blue-100"    loading={sellersLoading} />
                <StatCard label="Active"         value={filterCounts.active}                     color="text-emerald-700" bg="bg-emerald-50" border="border-emerald-100" loading={sellersLoading} />
                <StatCard label="Suspended"      value={filterCounts.suspended}                  color="text-amber-700"   bg="bg-amber-50"   border="border-amber-100"   loading={sellersLoading} />
                <StatCard label="Banned"         value={filterCounts.banned}                     color="text-red-600"     bg="bg-red-50"     border="border-red-100"     loading={sellersLoading} />
              </div>

              {/* Filter pills — horizontal scroll on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
                {[
                  { key: "all",       label: "All",       count: sellers.length       },
                  { key: "active",    label: "Active",    count: filterCounts.active  },
                  { key: "suspended", label: "Suspended", count: filterCounts.suspended },
                  { key: "banned",    label: "Banned",    count: filterCounts.banned  },
                  { key: "expired",   label: "Expired",   count: filterCounts.expired },
                ].map(({ key, label, count }) => (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                      filter === key
                        ? "bg-[#1132d4] text-white border-[#1132d4] shadow-[0_2px_8px_rgba(17,50,212,0.3)]"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                    }`}>
                    {label}
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${filter === key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Desktop: table | Mobile: card stack */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["Seller", "Plan", "Account", "Subscription", "Days Left", "Products", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sellersLoading
                        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                        : filteredSellers.map((s, i) => {
                            const days      = s.subscription.daysRemaining;
                            const daysColor = days > 90 ? "text-emerald-600" : days > 30 ? "text-amber-600" : days > 0 ? "text-red-500" : "text-slate-400";
                            return (
                              <tr key={s.subscriptionId ?? i} className="row-hover border-b border-slate-50 last:border-0 transition-colors"
                                onClick={() => setSelectedSeller(s)}
                                style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar name={s.seller.name} size={9} />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{s.seller.name}</p>
                                      <p className="text-xs text-slate-400 truncate">{s.seller.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <PlanBadge plan={s.subscription.plan} />
                                  <p className="text-xs text-slate-400 mt-1 font-mono">₹{s.subscription.price.toLocaleString("en-IN")}/yr</p>
                                </td>
                                <td className="px-4 py-3.5"><StatusBadge status={s.seller.accountStatus} /></td>
                                <td className="px-4 py-3.5"><StatusBadge status={s.subscription.subscriptionStatus} /></td>
                                <td className="px-4 py-3.5"><span className={`text-sm font-bold font-mono ${daysColor}`}>{days > 0 ? `${days}d` : "—"}</span></td>
                                <td className="px-4 py-3.5"><span className="text-sm font-semibold text-slate-600">{s.productsListed}</span></td>
                                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-1.5">
                                    {s.seller.accountStatus === "active" && (
                                      <button onClick={() => handleAction("pause", s)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">Pause</button>
                                    )}
                                    {s.seller.accountStatus === "suspended" && (
                                      <button onClick={() => handleAction("reinstate", s)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">Reinstate</button>
                                    )}
                                    {s.seller.accountStatus !== "banned" && (
                                      <button onClick={() => handleAction("ban", s)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">Ban</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
                {!sellersLoading && filteredSellers.length === 0 && (
                  <div className="py-14 text-center">
                    <span className="text-4xl block mb-3">◈</span>
                    <p className="text-slate-500 font-semibold text-sm">No sellers match this filter</p>
                  </div>
                )}
                {!sellersLoading && sellerPagination.totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      Page {sellerPagination.page} of {sellerPagination.totalPages} · {sellerPagination.total} sellers
                    </span>
                    <div className="flex gap-2">
                      <button disabled={!sellerPagination.hasPrev} onClick={() => fetchSellers({ page: sellerPagination.page - 1 })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40 hover:border-[#1132d4] hover:text-[#1132d4] transition-all disabled:cursor-not-allowed">← Prev</button>
                      <button disabled={!sellerPagination.hasNext} onClick={() => fetchSellers({ page: sellerPagination.page + 1 })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40 hover:border-[#1132d4] hover:text-[#1132d4] transition-all disabled:cursor-not-allowed">Next →</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile card stack */}
              <div className="lg:hidden space-y-3">
                {sellersLoading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : filteredSellers.length === 0
                  ? (
                    <div className="py-14 text-center bg-white rounded-2xl border border-slate-100">
                      <span className="text-4xl block mb-3">◈</span>
                      <p className="text-slate-500 font-semibold text-sm">No sellers match this filter</p>
                    </div>
                  )
                  : filteredSellers.map((s, i) => (
                    <SellerCard key={s.subscriptionId ?? i} s={s} i={i} onSelect={setSelectedSeller} onAction={handleAction} />
                  ))
                }

                {/* Pagination — mobile */}
                {!sellersLoading && sellerPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400 font-mono">
                      {sellerPagination.page}/{sellerPagination.totalPages} · {sellerPagination.total} sellers
                    </span>
                    <div className="flex gap-2">
                      <button disabled={!sellerPagination.hasPrev} onClick={() => fetchSellers({ page: sellerPagination.page - 1 })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40">← Prev</button>
                      <button disabled={!sellerPagination.hasNext} onClick={() => fetchSellers({ page: sellerPagination.page + 1 })}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ ORDERS ════ */}
          {activeTab === "orders" && (
            <div className="fade-up space-y-4 sm:space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Orders Overview</h1>
                <p className="text-sm text-slate-400 mt-1">Platform-wide transaction summary and commission tracking</p>
              </div>

              {ordersError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm">⚠ {ordersError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Total Commission" value={`₹${commission.totalCommissionEarned.toLocaleString("en-IN")}`} color="text-emerald-700" bg="bg-emerald-50" border="border-emerald-100" loading={ordersLoading} />
                <StatCard label="Completed Orders" value={commission.totalCompletedOrders.toLocaleString()}               color="text-[#1132d4]"   bg="bg-blue-50"    border="border-blue-100"    loading={ordersLoading} />
                <StatCard label="Platform Sales"   value={`₹${commission.totalPlatformSales.toLocaleString("en-IN")}`}   color="text-amber-700"   bg="bg-amber-50"   border="border-amber-100"   loading={ordersLoading} />
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {["Order ID", "Type", "Buyer", "Seller", "Product", "Amount", "Commission", "Status", "Date"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ordersLoading
                        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                        : orders.map((o, i) => (
                          <tr key={o.id} className="row-hover border-b border-slate-50 last:border-0" style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                            <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#1132d4]">#{o.id?.slice(-8)}</td>
                            <td className="px-4 py-3.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                                o.transactionType === "sell" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-[#1132d4] border border-blue-200"
                              }`}>{o.transactionType}</span>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{o.buyer}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{o.seller}</td>
                            <td className="px-4 py-3.5 text-sm font-medium text-slate-800 max-w-[140px] truncate">{o.product}</td>
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-700 font-mono">₹{o.amount.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3.5">
                              {o.commissionEarned ? (
                                <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  ₹{o.commissionAmount.toLocaleString("en-IN")}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">
                                  {["pending", "confirmed", "shipped"].includes(o.status) ? "Pending delivery" : "—"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                            <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{o.date}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!ordersLoading && orders.length === 0 && (
                  <div className="py-14 text-center">
                    <span className="text-4xl block mb-3">◎</span>
                    <p className="text-slate-500 font-semibold text-sm">No orders found</p>
                  </div>
                )}
              </div>

              {/* Mobile order cards */}
              <div className="lg:hidden space-y-3">
                {ordersLoading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : orders.length === 0
                  ? (
                    <div className="py-14 text-center bg-white rounded-2xl border border-slate-100">
                      <span className="text-4xl block mb-3">◎</span>
                      <p className="text-slate-500 font-semibold text-sm">No orders found</p>
                    </div>
                  )
                  : orders.map((o, i) => <OrderCard key={o.id} o={o} i={i} />)
                }
              </div>
            </div>
          )}

          {/* ════ CHATS ════ */}
          {activeTab === "chats" && (
            <div className="fade-up">
              {chatSellers.length === 0 && !sellersLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-center p-10 shadow-[0_2px_12px_rgba(17,50,212,0.05)]">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shadow-sm">💬</div>
                  <p className="font-bold text-slate-500">No Premium sellers yet</p>
                  <p className="text-sm text-slate-400 max-w-xs">Only sellers on the Premium plan have chat support. None exist yet.</p>
                </div>
              ) : (
                /* Desktop: side-by-side | Mobile: pane switch */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] overflow-hidden"
                  style={{ height: "calc(100vh - 130px)" }}>

                  {/* Desktop layout */}
                  <div className="hidden lg:flex h-full">
                    <div className="w-72 flex-shrink-0 border-r border-slate-100">
                      <ChatSellerList sellers={chatSellers} activeSellerId={activeChatSeller?.id}
                        onSelect={handleSelectChatSeller} unreadCounts={unreadCounts} lastMessages={lastMessages} />
                    </div>
                    <ChatWindow seller={activeChatSeller} adminId={adminId} />
                  </div>

                  {/* Mobile layout — single pane at a time */}
                  <div className="flex lg:hidden h-full">
                    {chatView === "list" || !activeChatSeller ? (
                      <div className="flex-1">
                        <ChatSellerList sellers={chatSellers} activeSellerId={activeChatSeller?.id}
                          onSelect={handleSelectChatSeller} unreadCounts={unreadCounts} lastMessages={lastMessages} />
                      </div>
                    ) : (
                      <ChatWindow seller={activeChatSeller} adminId={adminId}
                        onBack={() => { setChatView("list"); }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(17,50,212,0.06)] z-30 lg:hidden">
        <div className="flex items-center">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); if (item.id !== "chats") setChatView("list"); }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 relative transition-all ${
                activeTab === item.id ? "text-[#1132d4]" : "text-slate-400"
              }`}>
              <span className={`text-xl leading-none transition-transform ${activeTab === item.id ? "scale-110" : ""}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-2 right-[calc(50%-16px)] w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
              {activeTab === item.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1132d4] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        {/* Safe area spacer for iOS */}
        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </nav>

      {/* Bottom nav spacer — prevents content going under the nav on mobile */}
      <div className="h-20 lg:hidden" />

      {/* ── Seller detail panel ── */}
      {selectedSeller && (
        <SellerDetailPanel seller={selectedSeller} onClose={() => setSelectedSeller(null)} onAction={handleAction} />
      )}

      {/* ── Action modal ── */}
      {modalState.open && (
        <ActionModal seller={modalState.seller?.seller} action={modalState.action} loading={actionLoading}
          onClose={() => { if (!actionLoading) setModalState({ open: false, action: null, seller: null }); }}
          onConfirm={handleConfirm} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold z-50 border whitespace-nowrap shadow-[0_8px_24px_rgba(17,50,212,0.12)] ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"
        }`} style={{ animation: "fadeUp 0.3s ease" }}>
          {toast.type === "success" ? "✓ " : "✗ "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}