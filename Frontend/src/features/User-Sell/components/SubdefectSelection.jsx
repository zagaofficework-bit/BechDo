// SubdefectSelection.jsx — Responsive

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvaluationConfig } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";

const BLUE      = "#0077b6";
const TEAL      = "#00b4a0";
const TEAL_DARK = "#008f7e";

function DeviceCard({ model, variant }) {
  return (
    <div style={dc.wrap}>
      <div style={dc.imgBox}>
        {model?.image
          ? <img src={model.image} alt={model.name} style={{ width: "80%", height: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 22 }}>📱</span>}
      </div>
      <div>
        <p style={dc.name}>{model?.name}</p>
        <p style={dc.sub}>{variant?.label}</p>
      </div>
    </div>
  );
}
const dc = {
  wrap:  { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "12px 16px", boxShadow: "0 1px 6px rgba(0,119,182,.06)" },
  imgBox:{ width: 44, height: 54, borderRadius: 10, background: "linear-gradient(135deg,#f0f7fb,#e8f4fd)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #dbeafe" },
  name:  { margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" },
  sub:   { margin: "2px 0 0", fontSize: 11, color: "#94a3b8" },
};

function EvalSidebar({ defectKeys, allDefects }) {
  const labels = defectKeys.map((key) => {
    for (const d of allDefects) {
      if (d.key === key) return d.label;
      const child = d.children?.find((c) => c.key === key);
      if (child) return child.label;
    }
    return null;
  }).filter(Boolean);

  return (
    <div style={ev.card}>
      <p style={ev.title}>Issues Marked</p>
      {labels.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>None yet</p>
      ) : (
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {labels.map((label, i) => (
            <div key={i} style={ev.row}>
              <span style={ev.dot} />
              <span style={ev.label}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const ev = {
  card:  { background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  title: { margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#0f172a" },
  row:   { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  dot:   { width: 6, height: 6, marginTop: 4, borderRadius: "50%", flexShrink: 0, background: "#f87171" },
  label: { fontSize: 12, color: "#475569", lineHeight: 1.4 },
};

export default function SubDefectPage() {
  const navigate   = useNavigate();
  const { defectKey } = useParams();

  const { category, selectedModel, selectedVariant, defectKeys, setDefectKeys, selectedDefectGroups } = useSellFlow();

  const [allDefects, setAllDefects] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    getEvaluationConfig(category)
      .then((res) => setAllDefects(res.data.defects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  const defectGroup  = allDefects.find((d) => d.key === defectKey);
  const children     = defectGroup?.children || [];
  const isStandalone = children.length === 0;

  const currentIdx  = selectedDefectGroups.indexOf(defectKey);
  const nextKey     = selectedDefectGroups[currentIdx + 1];
  const isLast      = !nextKey;
  const queueTotal   = selectedDefectGroups.length;
  const queueCurrent = currentIdx + 1;

  const handleNext = () => {
    if (isLast) navigate("/sell/accessories");
    else navigate(`/sell/defects/${nextKey}`);
  };

  const handleChildToggle = (childKey) => {
    setDefectKeys((prev) => prev.includes(childKey) ? prev.filter((k) => k !== childKey) : [...prev, childKey]);
  };

  const handleStandaloneToggle = () => {
    setDefectKeys((prev) => prev.includes(defectKey) ? prev.filter((k) => k !== defectKey) : [...prev, defectKey]);
  };

  const selectedCount = isStandalone
    ? (defectKeys.includes(defectKey) ? 1 : 0)
    : children.filter((c) => defectKeys.includes(c.key)).length;

  useEffect(() => {
    if (!selectedModel || !selectedVariant) navigate("/sell", { replace: true });
  }, [selectedModel, selectedVariant]);

  if (!selectedModel || !selectedVariant) return null;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .sub-tile { transition: transform .18s ease, box-shadow .18s ease !important; }
        .sub-tile:not(.sel):hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,.1) !important; }

        @media(max-width:640px){
          .sub-layout  { flex-direction: column !important; gap: 14px !important; }
          .sub-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; flex-wrap: wrap !important; order: -1; }
          .sub-sidebar > * { flex: 1; min-width: 160px; }
          .sub-main    { border-radius: 16px; width: 100% !important; }
          .sub-head    { padding: 16px 16px 14px !important; }
          .sub-body    { padding: 16px 16px 20px !important; }
          .sub-grid    { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important; gap: 10px !important; }
          .sub-footer  { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .sub-next-btn { justify-content: center; }
        }

        @media(min-width:641px) and (max-width:1024px){
          .sub-layout  { flex-direction: column !important; }
          .sub-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; gap: 12px !important; }
          .sub-sidebar > * { flex: 1; }
        }
      `}</style>

      <div className="sub-layout" style={s.layout}>
        <div style={{ ...s.mainCard, animation: "fadeUp .3s ease both" }} className="sub-main">

          {/* Header */}
          <div className="sub-head" style={s.cardHead}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button style={s.backBtn} onClick={() => navigate("/sell/defects")}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                ← Back
              </button>
              {queueTotal > 1 && (
                <div style={s.pillRow}>
                  {selectedDefectGroups.map((key, idx) => (
                    <div key={key} style={{ ...s.pill, background: idx < queueCurrent ? TEAL : "#e2e8f0", width: idx === queueCurrent - 1 ? 24 : 8, opacity: idx < queueCurrent ? 1 : 0.35 }} />
                  ))}
                  <span style={s.pillLabel}>{queueCurrent} / {queueTotal}</span>
                </div>
              )}
            </div>

            <span style={s.tag}>Step 4 of 6 — Defect Detail</span>
            <h2 style={s.title}>{loading ? "Loading…" : defectGroup?.label ?? "Defect Options"}</h2>
            <p style={s.subtitle}>{isStandalone ? "Tap to mark this defect" : "Select all that apply"}</p>
          </div>

          {/* Body */}
          <div className="sub-body" style={s.body}>
            {loading && <div style={s.spinner} />}
            {error   && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

            {!loading && !error && (
              <>
                {/* Standalone defect */}
                {isStandalone && defectGroup && (
                  <button
                    className={`sub-tile${defectKeys.includes(defectKey) ? " sel" : ""}`}
                    onClick={handleStandaloneToggle}
                    style={{
                      ...s.soloBtn,
                      borderColor: defectKeys.includes(defectKey) ? TEAL : "#e2e8f0",
                      background:  defectKeys.includes(defectKey) ? "#f0fdf9" : "#fff",
                      boxShadow:   defectKeys.includes(defectKey) ? "0 0 0 3px rgba(0,180,160,.12)" : "0 1px 4px rgba(0,0,0,.04)",
                    }}
                  >
                    {defectGroup.image && (
                      <div style={{ ...s.imgBox, width: 56, height: 56, marginBottom: 0 }}>
                        <img src={defectGroup.image} alt={defectGroup.label} style={s.img} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      </div>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 700, color: defectKeys.includes(defectKey) ? TEAL_DARK : "#374151", flex: 1 }}>
                      {defectGroup.label}
                    </span>
                    {defectGroup.deduction > 0 && (
                      <span style={{ ...s.badge, background: defectKeys.includes(defectKey) ? "#ccfbf1" : "#fee2e2", color: defectKeys.includes(defectKey) ? TEAL_DARK : "#dc2626" }}>
                        -{defectGroup.deduction}%
                      </span>
                    )}
                    {defectKeys.includes(defectKey) && <span style={{ fontSize: 18, color: TEAL, marginLeft: 8 }}>✓</span>}
                  </button>
                )}

                {/* Children grid */}
                {!isStandalone && (
                  <div className="sub-grid" style={s.grid}>
                    {children.map((child, i) => {
                      const sel = defectKeys.includes(child.key);
                      return (
                        <button
                          key={child.key}
                          className={`sub-tile${sel ? " sel" : ""}`}
                          onClick={() => handleChildToggle(child.key)}
                          style={{
                            ...s.tile,
                            animationDelay: `${i * 0.06}s`,
                            borderColor: sel ? TEAL : "#e2e8f0",
                            borderWidth:  sel ? 2 : 1.5,
                            background:   sel ? "#f0fdf9" : "#fff",
                            boxShadow:    sel ? "0 0 0 3px rgba(0,180,160,.12), 0 4px 14px rgba(0,180,160,.1)" : "0 1px 4px rgba(0,0,0,.04)",
                          }}
                        >
                          {sel && <div style={s.checkBadge}>✓</div>}
                          <div style={s.imgBox}>
                            {child.image
                              ? <img src={child.image} alt={child.label} style={s.img} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              : <span style={{ fontSize: 26 }}>📋</span>}
                          </div>
                          <p style={{ ...s.tileLabel, color: sel ? TEAL_DARK : "#374151", fontWeight: sel ? 700 : 500 }}>
                            {child.label}
                          </p>
                          {child.deduction > 0 && (
                            <span style={{ ...s.badge, background: sel ? "#ccfbf1" : "#fee2e2", color: sel ? TEAL_DARK : "#dc2626" }}>
                              -{child.deduction}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <div className="sub-footer" style={s.footer}>
                  <p style={s.footerNote}>
                    {selectedCount === 0
                      ? "None selected — tap Continue to skip"
                      : `${selectedCount} issue${selectedCount > 1 ? "s" : ""} marked`}
                  </p>
                  <button
                    onClick={handleNext}
                    className="sub-next-btn"
                    style={s.nextBtn}
                    onMouseEnter={(e) => { e.currentTarget.style.background = TEAL_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = ""; }}
                  >
                    {isLast ? "Continue →" : "Next →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sub-sidebar" style={s.sidebar}>
          <DeviceCard model={selectedModel} variant={selectedVariant} />
          <EvalSidebar defectKeys={defectKeys} allDefects={allDefects} />
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "90vh", background: "#f4f8fb", padding: "32px 20px 48px", fontFamily: "system-ui,sans-serif" },
  layout:    { maxWidth: 960, margin: "0 auto", display: "flex", gap: 20, alignItems: "flex-start" },
  mainCard:  { flex: 1, background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)", overflow: "hidden" },
  cardHead:  { padding: "20px 28px 18px", borderBottom: "1px solid #f1f5f9" },
  tag:       { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, opacity: .7 },
  title:     { margin: "5px 0 3px", fontSize: 20, fontWeight: 700, color: "#0f172a" },
  subtitle:  { margin: 0, fontSize: 13, color: "#94a3b8" },
  backBtn:   { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#64748b", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" },
  body:      { padding: "24px 28px 28px" },
  spinner:   { width: 26, height: 26, border: "3px solid #e2e8f0", borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "40px auto" },
  pillRow:   { display: "flex", alignItems: "center", gap: 4 },
  pill:      { height: 8, borderRadius: 4, transition: "all .3s ease" },
  pillLabel: { fontSize: 11, fontWeight: 700, color: "#94a3b8", marginLeft: 6 },
  grid:      { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 14, marginBottom: 24 },
  tile:      { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 12px 16px", borderRadius: 14, border: "1.5px solid #e2e8f0", cursor: "pointer", fontFamily: "system-ui,sans-serif", animation: "fadeUp .3s ease both" },
  imgBox:    { width: 88, height: 88, borderRadius: 12, background: "#fff", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" },
  img:       { width: "100%", height: "100%", objectFit: "contain" },
  tileLabel: { margin: 0, fontSize: 12, textAlign: "center", lineHeight: 1.4 },
  badge:     { marginTop: 8, padding: "2px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700 },
  checkBadge:{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: TEAL, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  soloBtn:   { display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 20px", borderRadius: 14, border: "1.5px solid", cursor: "pointer", transition: "all .18s ease", fontFamily: "system-ui,sans-serif", marginBottom: 24 },
  footer:    { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 18, borderTop: "1px solid #f1f5f9" },
  footerNote:{ margin: 0, fontSize: 12, color: "#64748b" },
  nextBtn:   { display: "inline-flex", alignItems: "center", padding: "11px 24px", borderRadius: 11, border: "none", background: TEAL, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,180,160,.28)", transition: "all .18s ease" },
  sidebar:   { width: 256, flexShrink: 0, position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 },
};