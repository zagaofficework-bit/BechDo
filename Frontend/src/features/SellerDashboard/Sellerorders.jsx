
import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";

// NOTE: Fix the import casing — file is useBuySell.js not useBuysell.js
import { useSellerPendingOrders, useOrderActions, useMyOrders } from "../../hooks/useBuysell";

// ─── Order status display config ──────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500"  },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-[#1132d4] border-blue-200",         dot: "bg-[#1132d4]"  },
  shipped:   { label: "Shipped",   color: "bg-indigo-50 text-indigo-700 border-indigo-200",    dot: "bg-indigo-500" },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500"},
  rejected:  { label: "Rejected",  color: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-500"    },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 border-slate-200",      dot: "bg-slate-400"  },
};

// The order statuses flow in this sequence from left to right
const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const BackIcon     = () => <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-4 h-4" />;
const CheckIcon    = () => <Icon path="M5 13l4 4L19 7" className="w-4 h-4" />;
const XIcon        = () => <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />;
const TruckIcon    = () => <Icon path="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" className="w-4 h-4" />;
const PackIcon     = () => <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-4 h-4" />;
const MailIcon     = () => <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-4 h-4" />;
const PhoneIcon    = () => <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" className="w-4 h-4" />;
const LocationIcon = () => <Icon path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4" />;
const NoteIcon     = () => <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />;

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Helper functions ─────────────────────────────────────────────────────────
// Backend populates buyer as { firstname, lastname, email, mobile, defaultAddress }

const getBuyerName = (buyer) => {
  if (!buyer) return "Unknown Buyer";
  return [buyer.firstname, buyer.lastname].filter(Boolean).join(" ") || buyer.name || "Unknown Buyer";
};

const getBuyerEmail = (buyer) => buyer?.email  ?? "—";
const getBuyerPhone = (buyer) => buyer?.mobile ?? "—";

const getBuyerAddress = (buyer) => {
  if (!buyer?.defaultAddress) return "—";
  if (typeof buyer.defaultAddress === "string") return buyer.defaultAddress;
  const a = buyer.defaultAddress;
  return a.full || [a.city, a.state, a.pincode].filter(Boolean).join(", ");
};

const getProductImage = (product) => product?.images?.[0] ?? null;
const getProductBrand = (product) => product?.brand        ?? "";
const getProductTitle = (product) => product?.title        ?? "—";
const getProductPrice = (product) => product?.price        ?? product?.salePrice ?? 0;

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — small coloured pill showing order status
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge = memo(({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// ─────────────────────────────────────────────────────────────────────────────
// OrderCard — a single order with expandable buyer details and action buttons
// ─────────────────────────────────────────────────────────────────────────────

const OrderCard = memo(({ order, onConfirm, onReject, onStatusChange, globalLoading }) => {
  const [expanded,  setExpanded]  = useState(false);
  const [localBusy, setLocalBusy] = useState(false);

  const busy = localBusy || globalLoading;

  // Determine which actions are available based on current status
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const canAdvance = currentIdx >= 0 && order.status !== "delivered" && order.status !== "rejected";
  const canReject  = order.status === "pending" || order.status === "confirmed";
  const nextStatus = STATUS_FLOW[currentIdx + 1];

  // Label for the primary action button changes with each status
  const actionLabel = {
    pending:   "Confirm Order",
    confirmed: "Mark as Shipped",
    shipped:   "Mark as Delivered",
  }[order.status];

  // Icon for the primary action button
  const ActionIcon = () => {
    if (order.status === "confirmed") return <TruckIcon />;
    if (order.status === "shipped")   return <PackIcon />;
    return <CheckIcon />;
  };

  const handleAdvance = async () => {
    setLocalBusy(true);
    // "pending" has its own dedicated endpoint; others use generic status update
    if (order.status === "pending") {
      await onConfirm(order._id);
    } else {
      await onStatusChange(order._id, nextStatus);
    }
    setLocalBusy(false);
  };

  const handleReject = async () => {
    setLocalBusy(true);
    await onReject(order._id);
    setLocalBusy(false);
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      order.status === "pending"
        ? "border-amber-200 shadow-[0_2px_16px_rgba(245,158,11,0.08)]"
        : "border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)]"
    }`}>
      {/* ── Card header ── */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Product thumbnail */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
            {getProductImage(order.product)
              ? <img src={getProductImage(order.product)} alt="" className="w-full h-full object-cover rounded-xl" loading="lazy" />
              : <span className="text-2xl opacity-40">📱</span>}
          </div>

          {/* Product + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-bold text-[#1132d4] tracking-wide uppercase">{getProductBrand(order.product)}</p>
                <h3 className="text-sm font-bold text-slate-800 leading-snug">{getProductTitle(order.product)}</h3>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">₹{getProductPrice(order.product).toLocaleString()}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>

        {/* Buyer quick info row */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1132d4]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#1132d4] text-xs font-bold">
                {getBuyerName(order.buyer)?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{getBuyerName(order.buyer)}</p>
              <p className="text-xs text-slate-400">{fmtDate(order.createdAt)}</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">#{order._id?.slice(-8).toUpperCase()}</span>
        </div>

        {/* Expand / collapse toggle */}
        <button onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1132d4] hover:text-[#0d28b8] py-1.5 border-t border-slate-50">
          {expanded ? "Hide details ↑" : "View details ↓"}
        </button>
      </div>

      {/* ── Expanded details section ── */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Buyer Details</p>

          {/* Contact info rows */}
          {[
            { icon: <MailIcon />,     label: "Email",            value: getBuyerEmail(order.buyer)   },
            { icon: <PhoneIcon />,    label: "Phone",            value: getBuyerPhone(order.buyer)   },
            { icon: <LocationIcon />, label: "Delivery Address", value: getBuyerAddress(order.buyer) },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-white rounded-xl px-3 py-2.5 border border-slate-100">
              <span className="text-[#1132d4] mt-0.5 flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-semibold text-slate-700">{item.value}</p>
              </div>
            </div>
          ))}

          {/* Optional seller note */}
          {order.sellerNote && (
            <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
              <span className="text-amber-600 mt-0.5"><NoteIcon /></span>
              <div>
                <p className="text-xs text-amber-600">Note</p>
                <p className="text-sm font-semibold text-amber-800">{order.sellerNote}</p>
              </div>
            </div>
          )}

          {/* Payment breakdown */}
          {order.salePrice && (
            <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Payment Breakdown</p>
              {[
                { label: "Sale Price",     value: `₹${order.salePrice?.toLocaleString()}`                          },
                { label: "Commission",     value: `${order.commissionRate}% (₹${order.commissionAmount?.toLocaleString()})` },
                { label: "You Receive",    value: `₹${order.sellerEarnings?.toLocaleString()}`                      },
                { label: "Payment Method", value: order.paymentMethod                                               },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="font-semibold text-slate-700">{r.value ?? "—"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Visual progress bar through STATUS_FLOW */}
          {!["rejected", "cancelled"].includes(order.status) && (
            <div className="bg-white rounded-xl border border-slate-100 px-4 py-3">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Order Progress</p>
              <div className="flex items-center">
                {STATUS_FLOW.map((s, i) => {
                  const activeIdx = STATUS_FLOW.indexOf(order.status);
                  const isDone    = i <= activeIdx;
                  const isCurrent = i === activeIdx;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      {/* Step circle */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                        isDone ? "bg-[#1132d4] text-white shadow-[0_2px_6px_rgba(17,50,212,0.35)]" : "bg-slate-100 text-slate-400"
                      } ${isCurrent ? "ring-4 ring-[#1132d4]/20" : ""}`}>
                        {isDone && !isCurrent ? <CheckIcon /> : <span>{i + 1}</span>}
                      </div>
                      {/* Connector line */}
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${isDone && i < activeIdx ? "bg-[#1132d4]" : "bg-slate-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Step labels */}
              <div className="flex justify-between mt-1.5">
                {STATUS_FLOW.map((s) => (
                  <p key={s} className="text-xs text-slate-400 capitalize" style={{ width: "25%", textAlign: "center" }}>{s}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons (shown when order can be advanced or rejected) ── */}
      {(canAdvance || canReject) && (
        <div className="border-t border-slate-100 px-5 py-3.5 flex items-center gap-2.5 bg-white">
          {canAdvance && (
            <button onClick={handleAdvance} disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1132d4] hover:bg-[#0d28b8] disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-xl shadow-[0_2px_10px_rgba(17,50,212,0.35)] transition-all active:scale-[0.98]">
              {busy ? <Spinner /> : <ActionIcon />}
              {actionLabel}
            </button>
          )}
          {canReject && (
            <button onClick={handleReject} disabled={busy}
              className="flex items-center justify-center gap-1.5 border-2 border-red-200 text-red-500 hover:bg-red-50 text-sm font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50">
              <XIcon /> Reject
            </button>
          )}
        </div>
      )}

      {/* ── Terminal state footer (no more actions available) ── */}
      {["delivered", "rejected", "cancelled"].includes(order.status) && (
        <div className={`border-t px-5 py-3 text-center text-xs font-semibold ${
          order.status === "delivered"
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-red-100 bg-red-50 text-red-600"
        }`}>
          {order.status === "delivered"  && "✓ Order successfully delivered"}
          {order.status === "rejected"   && "✗ This order has been rejected"}
          {order.status === "cancelled"  && "✗ This order was cancelled by the buyer"}
        </div>
      )}
    </div>
  );
});
OrderCard.displayName = "OrderCard";

// ─── Skeleton card (loading placeholder) ─────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse space-y-3">
    <div className="flex gap-4">
      <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
    <div className="flex gap-3">
      <div className="h-8 bg-slate-100 rounded-xl flex-1" />
      <div className="h-8 bg-slate-100 rounded-xl w-20" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SellerOrders — main page component
// ─────────────────────────────────────────────────────────────────────────────

export default function SellerOrders() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search,       setSearch]       = useState("");

  // Full order history (as seller) — used as the base list
  const { myOrders, loading, error, refetch } = useMyOrders({ type: "buy" });

  // Pending orders — kept live for incoming requests
  const { pendingOrders, confirmOrder, rejectOrder } = useSellerPendingOrders();

  // Generic status updater (shipped, delivered, etc.)
  const { changeOrderStatus, loading: actionLoading } = useOrderActions();

  // ── Merge myOrders + pendingOrders, deduplicating by _id ──────────────────
  // We prefer pendingOrders data for any overlapping pending entries
  const pendingMap  = Object.fromEntries(pendingOrders.map((o) => [o._id, o]));
  const mergedList  = myOrders.map((o) => pendingMap[o._id] ?? o);
  const newArrivals = pendingOrders.filter((o) => !myOrders.find((m) => m._id === o._id));
  const orders      = [...newArrivals, ...mergedList];

  // ── Filter and search ──────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const q           = search.toLowerCase();
    const matchSearch = !q
      || getBuyerName(o.buyer).toLowerCase().includes(q)
      || getProductTitle(o.product).toLowerCase().includes(q)
      || (o._id ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Count by status for the summary tiles
  const counts = Object.fromEntries(
    ["all", ...Object.keys(STATUS_CONFIG)].map((key) => [
      key,
      key === "all" ? orders.length : orders.filter((o) => o.status === key).length,
    ])
  );

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .animate-spin { animation: spin 0.7s linear infinite; }
      `}</style>

      {/* ── Sticky page header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-[0_1px_8px_rgba(17,50,212,0.05)]">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/seller-dashboard")}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#1132d4]/40 hover:text-[#1132d4] hover:bg-blue-50 transition-all">
              <BackIcon />
            </button>
            <div>
              <h1 className="text-sm font-extrabold text-slate-800">Order Requests</h1>
              <p className="text-xs text-slate-400">{orders.length} total orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {counts.pending > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                {counts.pending} pending
              </div>
            )}
            <button onClick={() => refetch({ type: "buy" })} title="Refresh"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#1132d4]/40 hover:text-[#1132d4] hover:bg-blue-50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* ── Summary stat tiles (click to filter) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 fade-up">
          {[
            { key: "pending",   label: "Pending",   color: "text-amber-600 bg-amber-50 border-amber-200"       },
            { key: "confirmed", label: "Confirmed", color: "text-[#1132d4] bg-blue-50 border-blue-200"         },
            { key: "shipped",   label: "Shipped",   color: "text-indigo-600 bg-indigo-50 border-indigo-200"    },
            { key: "delivered", label: "Delivered", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { key: "rejected",  label: "Rejected",  color: "text-red-600 bg-red-50 border-red-200"             },
          ].map((s) => (
            <button key={s.key}
              onClick={() => setFilterStatus(filterStatus === s.key ? "all" : s.key)}
              className={`rounded-2xl border p-3 text-center transition-all hover:-translate-y-0.5 ${s.color} ${filterStatus === s.key ? "ring-2 ring-offset-1 ring-current shadow-sm" : "opacity-80 hover:opacity-100"}`}>
              <p className="text-xl font-extrabold">{counts[s.key]}</p>
              <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* ── Search + status filter ── */}
        <div className="flex gap-3 items-center fade-up">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by buyer name, order ID, or product..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-[#1132d4] focus:ring-2 focus:ring-[#1132d4]/10 shadow-sm" />
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {["all", ...Object.keys(STATUS_CONFIG)].map((tab) => (
              <button key={tab} onClick={() => setFilterStatus(tab)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg capitalize transition-all ${
                  filterStatus === tab
                    ? "bg-[#1132d4] text-white shadow-[0_2px_8px_rgba(17,50,212,0.3)]"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Order cards grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center shadow-sm fade-up">
            <span className="text-5xl">📋</span>
            <p className="text-slate-700 font-bold mt-3">No orders found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filter or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up">
            {filtered.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onConfirm={confirmOrder}
                onReject={rejectOrder}
                onStatusChange={changeOrderStatus}
                globalLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}