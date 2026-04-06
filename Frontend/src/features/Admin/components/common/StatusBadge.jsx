const STATUS_CFG = {
  active: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Active" },
  suspended: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "Suspended" },
  banned: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", label: "Banned" },
  expired: { color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", dot: "bg-slate-400", label: "Expired" },
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

export default StatusBadge;