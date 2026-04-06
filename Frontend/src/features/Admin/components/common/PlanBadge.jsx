const PLAN_CFG = {
  basic: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  standard: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  premium: { color: "text-[#1132d4]", bg: "bg-blue-50", border: "border-blue-200" },
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

export default PlanBadge;