//FinalPrice — Responsive

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculatePrice, submitListing } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import toast from "react-hot-toast";

const BLUE      = "#0077b6";
const BLUE_DARK = "#005f8f";

// deviceSell.api.js throws: new Error(data.message)
// so err.message = "Access token missing or malformed"
const isAuthError = (err) => {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("access token") ||
    msg.includes("unauthorized") ||
    msg.includes("not authenticated") ||
    msg.includes("jwt") ||
    msg.includes("no token") ||
    msg.includes("missing or malformed")
  );
};

export default function FinalPrice() {
  const navigate = useNavigate();
  const { category, selectedModel, selectedVariant, answers, defectKeys, accessoryKeys, priceData, setPriceData, resetFlow } = useSellFlow();

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!selectedModel || !selectedVariant) navigate("/sell", { replace: true });
  }, [selectedModel, selectedVariant]);

  if (!selectedModel || !selectedVariant) return null;

  useEffect(() => {
    calculatePrice({ modelId: selectedModel.id, variantId: selectedVariant.id, category, answers, defectKeys, accessoryKeys })
      .then((res) => setPriceData(res.data))
      .catch((err) => {
        if (isAuthError(err)) { navigate("/sell/login-required", { replace: true }); return; }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitListing({ modelId: selectedModel.id, variantId: selectedVariant.id, category, answers, defectKeys, accessoryKeys });
      if (!res?.data) throw new Error("Submission failed. Please try again.");
      resetFlow();
      navigate("/sell/success", { state: { listing: res.data } });
    } catch (err) {
      if (isAuthError(err)) { navigate("/sell/login-required", { replace: true }); return; }
      setError(err.message);
      toast.error(err.message || "Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 14, fontFamily: "system-ui,sans-serif", background: "#f4f8fb" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <p style={{ color: "#64748b", fontSize: 14 }}>Calculating your price…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      <p style={{ color: "#ef4444" }}>{error}</p>
    </div>
  );

  if (!priceData) return null;
  const { device, pricing, breakdown } = priceData;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .fp-card{animation:fadeUp .3s ease both}

        @media(max-width:640px){
          .fp-layout  { flex-direction: column !important; gap: 14px !important; }
          .fp-sidebar { width: 100% !important; position: static !important; order: -1; }
          .fp-hero-band { flex-direction: column; !important; }
          .fp-hero-img-panel { width: 100% !important; height: 160px !important; }
          .fp-hero-img { width: 70px !important; height: 100px !important; }
          .fp-hero-content { padding: 18px 20px 22px !important; }
          .fp-price-amt { font-size: 30px !important; }
          .fp-brk-card { padding: 18px 16px !important; }
          .fp-cta-row  { flex-direction: column !important; }
          .fp-confirm-btn { justify-content: center; }
          .fp-edit-btn { text-align: center; }
        }

        @media(min-width:641px) and (max-width:1024px){
          .fp-layout  { flex-direction: column !important; }
          .fp-sidebar { width: 100% !important; position: static !important; }
        }
      `}</style>

      <div className="fp-layout" style={s.layout}>
        {/* ── Left column ── */}
        <div className="w-[100%]" style={s.left}>
          {/* Price hero */}
          <div className="fp-card " style={{ ...s.card, overflow: "hidden", marginBottom: 14 }}>
            <div className="fp-hero-band" style={s.heroBand}>
              <div className="fp-hero-img-panel" style={s.heroImgPanel}>
                {device.image && <img src={device.image} alt={device.model} className="fp-hero-img" style={s.heroImg} />}
              </div>
              <div className="fp-hero-content" style={s.heroContent}>
                <span style={s.heroTag}>Final Offer</span>
                <h1 style={s.heroDevice}>{device.model}</h1>
                <p style={s.heroVariant}>{device.variant}</p>
                <div style={s.priceRow}>
                  <p className="fp-price-amt" style={s.priceAmt}>₹{pricing.finalPrice.toLocaleString("en-IN")}</p>
                  <span style={s.bestBadge}>Best Price</span>
                </div>
                <p style={s.priceNote}>What you'll receive after all adjustments.</p>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="fp-card fp-brk-card" style={{ ...s.card, padding: "22px 26px", marginBottom: 14, animationDelay: ".06s" }}>
            <p style={s.brkTitle}>Price Breakdown</p>
            <div style={{ margin: "10px 0 0" }}>
              <BrkRow label="Base price" amount={pricing.basePrice} sign="+" />
              {breakdown.deductions.map((d, i) => (
                <BrkRow key={i} label={d.reason} amount={(pricing.basePrice * d.deduction) / 100} sign="-" color="#f87171" />
              ))}
              {breakdown.additions.map((a, i) => (
                <BrkRow key={i} label={a.reason} amount={(pricing.basePrice * a.addition) / 100} sign="+" color="#22c55e" />
              ))}
              <BrkRow label="Processing fee" amount={pricing.processingFee} sign="-" color="#f87171" />
            </div>
            <div style={s.totalLine}>
              <span style={s.totalLeft}>You receive</span>
              <span style={s.totalRight}>₹{pricing.finalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* CTA row */}
          <div className="fp-card fp-cta-row" style={{ display: "flex", gap: 12, animationDelay: ".1s" }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="fp-confirm-btn"
              style={{ ...s.confirmBtn, background: submitting ? "#e2e8f0" : BLUE, color: submitting ? "#94a3b8" : "#fff", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : "0 2px 14px rgba(0,119,182,.3)" }}
              onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.background = BLUE_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}}
              onMouseLeave={(e) => { if (!submitting) { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = ""; }}}
            >
              {submitting ? "Submitting…" : "Confirm & List Device"}
              {!submitting && (
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 8 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </button>
            <button
              onClick={() => navigate("/sell/defects")}
              className="fp-edit-btn"
              style={s.editBtn}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#374151"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
            >
              Edit Details
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="fp-sidebar" style={s.sidebar}>
          <div style={s.sumCard}>
            <p style={s.sumTitle}>Summary</p>
            {[
              { label: "Device",      value: device.model },
              { label: "Variant",     value: device.variant },
              { label: "Category",    value: device.category },
              { label: "Defects",     value: breakdown.deductions.length === 0 ? "None" : breakdown.deductions.map((d) => d.reason).join(", ") },
              { label: "Accessories", value: breakdown.additions.length === 0  ? "None" : breakdown.additions.map((a) => a.reason).join(", ") },
            ].map(({ label, value }) => (
              <div key={label} style={s.sumRow}>
                <span style={s.sumKey}>{label}</span>
                <span style={s.sumVal}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrkRow({ label, amount, sign, color = "#374151" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f8fafc" }}>
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{sign}₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
    </div>
  );
}

const s = {
  page:          { minHeight: "100vh", background: "#f4f8fb", padding: "32px 20px 48px", fontFamily: "system-ui,sans-serif" },
  layout:        { maxWidth: 860, margin: "0 auto", display: "flex", gap: 20, alignItems: "flex-start" },
  left:          { flex: 1, minWidth: 0 },
  card:          { background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)" },
  heroBand:      { display: "flex", alignItems: "stretch" },
  heroImgPanel:  { width: 160, background: "linear-gradient(145deg,#f0f7fb,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, flexShrink: 0 },
  heroImg:       { width: 90, height: 120, objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,119,182,.25))" },
  heroContent:   { flex: 1, padding: "26px 28px" },
  heroTag:       { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e" },
  heroDevice:    { margin: "5px 0 2px", fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" },
  heroVariant:   { margin: 0, fontSize: 12, color: "#94a3b8" },
  priceRow:      { display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" },
  priceAmt:      { margin: 0, fontSize: 38, fontWeight: 800, color: BLUE, letterSpacing: "-0.03em", lineHeight: 1 },
  bestBadge:     { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 },
  priceNote:     { margin: "4px 0 0", fontSize: 11, color: "#94a3b8" },
  brkTitle:      { margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" },
  totalLine:     { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, marginTop: 4, borderTop: "2px solid #f1f5f9" },
  totalLeft:     { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  totalRight:    { fontSize: 22, fontWeight: 800, color: BLUE, letterSpacing: "-0.02em" },
  confirmBtn:    { flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 28px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, fontFamily: "system-ui,sans-serif", transition: "all .18s ease" },
  editBtn:       { padding: "13px 22px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "system-ui,sans-serif", transition: "all .15s ease", fontWeight: 500 },
  sidebar:       { width: 248, flexShrink: 0, position: "sticky", top: 24 },
  sumCard:       { background: "#fff", borderRadius: 16, border: "1px solid #eef2f6", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  sumTitle:      { margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" },
  sumRow:        { display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid #f8fafc" },
  sumKey:        { fontSize: 12, color: "#94a3b8", flexShrink: 0 },
  sumVal:        { fontSize: 12, color: "#374151", fontWeight: 500, textAlign: "right" },
};