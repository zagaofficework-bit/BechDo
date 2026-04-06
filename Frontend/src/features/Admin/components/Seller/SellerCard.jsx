import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import PlanBadge from "../common/PlanBadge";

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

export default SellerCard;