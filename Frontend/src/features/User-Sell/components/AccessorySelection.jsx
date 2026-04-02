// AccessorySelection.jsx — Responsive

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvaluationConfig } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import toast from "react-hot-toast";

const BLUE      = "#0077b6";
const BLUE_DARK = "#005f8f";
const BLUE_LIGHT = "#e8f4fd";
const BLUE_MID  = "#5ab3d8";

function BoxIcon({ selected }) {
  return (
    <svg viewBox="0 0 48 52" fill="none" width={34} height={38} strokeWidth={1.5}
      stroke={selected ? "rgba(255,255,255,0.9)" : "#94a3b8"}>
      <rect x="6" y="18" width="36" height="28" rx="3" />
      <path d="M6 25h36" />
      <path d="M18 18v-7h12v7" />
    </svg>
  );
}

function DeviceCard({ model, variant }) {
  return (
    <div style={dc.wrap}>
      <div style={dc.imgBox}>
        {model.image
          ? <img src={model.image} alt={model.name} style={{ width: "80%", height: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 22 }}>📱</span>}
      </div>
      <div>
        <p style={dc.name}>{model.name}</p>
        <p style={dc.variant}>{variant.label}</p>
      </div>
    </div>
  );
}
const dc = {
  wrap:    { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "12px 16px", boxShadow: "0 1px 6px rgba(0,119,182,.06)" },
  imgBox:  { width: 44, height: 54, borderRadius: 10, background: "linear-gradient(135deg,#f0f7fb,#e8f4fd)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #dbeafe" },
  name:    { margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" },
  variant: { margin: "2px 0 0", fontSize: 11, color: "#94a3b8" },
};

export default function AccessorySelection() {
  const navigate = useNavigate();
  const { category, selectedModel, selectedVariant, accessoryKeys, setAccessoryKeys } = useSellFlow();

  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!selectedModel || !selectedVariant) navigate("/sell", { replace: true });
  }, [selectedModel, selectedVariant]);

  if (!selectedModel || !selectedVariant) return null;

  useEffect(() => {
    getEvaluationConfig(category)
      .then((res) => setAccessories(res.data.accessories))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  const toggle = (key) =>
    setAccessoryKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const totalBonus = accessoryKeys.reduce((sum, k) => {
    const a = accessories.find((x) => x.key === k);
    return sum + (a?.addition ?? 0);
  }, 0);

  useEffect(() => { if (error) toast.error(error); }, [error]);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .as-card{animation:fadeUp .3s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media(max-width:640px){
          .as-layout  { flex-direction: column !important; gap: 14px !important; }
          .as-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; flex-wrap: wrap !important; }
          .as-sidebar > * { flex: 1; min-width: 160px; }
          .as-main    { border-radius: 16px !important; }
          .as-card-head { padding: 18px 16px 14px !important; }
          .as-body    { padding: 16px 16px 20px !important; }
          .as-grid    { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important; gap: 10px !important; }
          .as-footer  { flex-direction: column !important; gap: 10px !important; align-items: stretch !important; }
          .as-primary-btn { justify-content: center; width: 100%; }
        }

        @media(min-width:641px) and (max-width:1024px){
          .as-layout  { flex-direction: column !important; }
          .as-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; gap: 12px !important; }
          .as-sidebar > * { flex: 1; }
        }
      `}</style>

      <div style={s.page}>
        <div className="as-layout" style={s.layout}>
          {/* ── Main card ── */}
          <div className="as-card as-main" style={s.mainCard}>
            <div className="as-card-head" style={s.cardHead}>
              <span style={s.tag}>Step 5 of 6</span>
              <h2 style={s.title}>Do you have the original accessories?</h2>
              <p style={s.subtitle}>Original accessories increase your selling price. Select all that apply.</p>
            </div>

            {loading && <div style={s.spinner} />}

            {!loading && !error && (
              <div className="as-body" style={{ padding: "24px 28px 28px" }}>
                <div className="as-grid" style={s.grid}>
                  {accessories.map((a) => {
                    const sel = accessoryKeys.includes(a.key);
                    return (
                      <button key={a.key} onClick={() => toggle(a.key)}
                        style={{
                          ...s.tile,
                          borderColor: sel ? BLUE : "#e2e8f0",
                          background:  sel ? `linear-gradient(145deg,${BLUE} 0%,#0099d6 100%)` : "#fafcff",
                          boxShadow:   sel ? "0 6px 18px rgba(0,119,182,.3)" : "0 1px 4px rgba(0,0,0,.04)",
                          transform:   sel ? "translateY(-2px)" : "none",
                        }}
                        onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = BLUE_MID; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,119,182,.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                        onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.04)"; e.currentTarget.style.transform = "none"; }}}
                      >
                        {sel && <span style={s.checkMark}>✓</span>}
                        <BoxIcon selected={sel} />
                        <p style={{ ...s.tileLabel, color: sel ? "#fff" : "#374151" }}>{a.label}</p>
                        {a.addition > 0 && (
                          <span style={{ ...s.tileBadge, background: sel ? "rgba(255,255,255,.2)" : "#f0fdf4", color: sel ? "#fff" : "#22c55e" }}>
                            +{a.addition}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="as-footer" style={s.footer}>
                  <p style={s.footerNote}>
                    {accessoryKeys.length === 0
                      ? "No accessories selected — you can still proceed."
                      : `${accessoryKeys.length} accessor${accessoryKeys.length > 1 ? "ies" : "y"} selected`}
                  </p>
                  <button
                    onClick={() => navigate("/sell/final-price")}
                    className="as-primary-btn"
                    style={s.primaryBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_DARK; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,119,182,.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,119,182,.28)"; }}
                  >
                    See My Price
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 8 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="as-sidebar" style={s.sidebar}>
            <DeviceCard model={selectedModel} variant={selectedVariant} />
            <div style={s.bonusCard}>
              <p style={s.bonusTitle}>Accessory Bonus</p>
              {accessoryKeys.length === 0
                ? <p style={s.bonusEmpty}>Select accessories to see potential bonuses.</p>
                : (
                  <>
                    {accessoryKeys.map((key) => {
                      const a = accessories.find((x) => x.key === key);
                      return a ? (
                        <div key={key} style={s.bonusRow}>
                          <span style={s.bonusDot} />
                          <span style={s.bonusLabel}>{a.label}</span>
                          {a.addition > 0 && <span style={s.bonusPct}>+{a.addition}%</span>}
                        </div>
                      ) : null;
                    })}
                    <div style={s.totalRow}>
                      <span style={s.totalLabel}>Total bonus</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>+{totalBonus}%</span>
                    </div>
                  </>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: "90vh", background: "#f4f8fb", padding: "32px 20px 48px", fontFamily: "system-ui,sans-serif" },
  layout:     { maxWidth: 900, margin: "0 auto", display: "flex", gap: 20, alignItems: "flex-start" },
  mainCard:   { flex: 1, background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)", overflow: "hidden" },
  cardHead:   { padding: "28px 28px 20px", borderBottom: "1px solid #f1f5f9" },
  tag:        { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, opacity: .7 },
  title:      { margin: "5px 0 4px", fontSize: 20, fontWeight: 700, color: "#0f172a" },
  subtitle:   { margin: 0, fontSize: 13, color: "#94a3b8" },
  spinner:    { width: 26, height: 26, border: "3px solid #e2e8f0", borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "40px auto" },
  grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 12, marginBottom: 24 },
  tile:       { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "18px 10px 14px", borderRadius: 14, border: "1.5px solid", cursor: "pointer", transition: "all .2s ease", fontFamily: "system-ui,sans-serif", minHeight: 120 },
  checkMark:  { position: "absolute", top: 8, right: 10, fontSize: 11, color: "#fff", fontWeight: 700 },
  tileLabel:  { margin: 0, fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.35, transition: "color .15s" },
  tileBadge:  { padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700 },
  footer:     { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  footerNote: { margin: 0, fontSize: 12, color: "#64748b", maxWidth: 200 },
  primaryBtn: { display: "inline-flex", alignItems: "center", padding: "11px 24px", borderRadius: 11, border: "none", background: BLUE, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,119,182,.28)", transition: "all .18s ease" },
  sidebar:    { width: 256, flexShrink: 0, position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 },
  bonusCard:  { background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  bonusTitle: { margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" },
  bonusEmpty: { fontSize: 12, color: "#94a3b8", margin: 0 },
  bonusRow:   { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  bonusDot:   { width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 },
  bonusLabel: { flex: 1, fontSize: 12, color: "#475569" },
  bonusPct:   { fontSize: 12, fontWeight: 700, color: "#22c55e" },
  totalRow:   { display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 10, marginTop: 6 },
  totalLabel: { fontSize: 12, fontWeight: 600, color: "#64748b" },
};