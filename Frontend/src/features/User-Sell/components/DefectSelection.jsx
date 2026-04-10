// DefectSelection.jsx — Responsive

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvaluationConfig } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import toast from "react-hot-toast";
import LazyImage from "../../../components/LazyImage";

const BLUE      = "#0077b6";
const TEAL      = "#00b4a0";
const TEAL_DARK = "#008f7e";

function DeviceCard({ model, variant }) {
  return (
    <div style={dc.wrap}>
      <div style={dc.imgBox}>
        {model?.image
          ? <LazyImage src={model.image} alt={model.name} style={{ width: "80%", height: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 22 }}>📱</span>}
      </div>
      <div>
        <p style={dc.name}>{model?.name}</p>
        <p style={dc.variant}>{variant?.label}</p>
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

function EvalSidebar({ selectedParentKeys, defects }) {
  const selected = defects.filter((d) => selectedParentKeys.includes(d.key));
  return (
    <div style={ev.card}>
      <p style={ev.title}>Selected Categories</p>
      {selected.length === 0 ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>None selected</p>
        </div>
      ) : (
        selected.map((d) => (
          <div key={d.key} style={ev.row}>
            <span style={ev.dot} />
            <span style={ev.label}>{d.label}</span>
          </div>
        ))
      )}
    </div>
  );
}
const ev = {
  card:  { background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  title: { margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" },
  row:   { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  dot:   { width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "#f87171" },
  label: { fontSize: 12, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};

export default function DefectSelection() {
  const navigate = useNavigate();
  const { category, selectedModel, selectedVariant, setSelectedDefectGroups } = useSellFlow();

  const [defects,         setDefects]         = useState([]);
  const [selectedParents, setSelectedParents] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    getEvaluationConfig(category)
      .then((res) => setDefects(res.data.defects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!selectedModel || !selectedVariant) navigate("/sell", { replace: true });
  }, [selectedModel, selectedVariant]);

  if (!selectedModel || !selectedVariant) return null;

  const toggleParent = (key) => {
    setSelectedParents((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = () => {
    if (selectedParents.length === 0) { navigate("/sell/accessories"); return; }
    setSelectedDefectGroups(selectedParents);
    navigate(`/sell/defects/${selectedParents[0]}`);
  };

  useEffect(() => { if (error) toast.error(error); }, [error]);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .defect-tile { transition: transform .18s ease, box-shadow .18s ease !important; }
        .defect-tile:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,.1) !important; }

        @media(max-width:640px){
          .ds-layout  { flex-direction: column !important; gap: 14px !important; }
          .ds-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; flex-wrap: wrap !important; }
          .ds-sidebar > * { flex: 1; min-width: 160px; }
          .ds-main    { border-radius: 16px !important; }
          .ds-card-head { padding: 16px 16px 14px !important; }
          .ds-body    { padding: 16px 16px 20px !important; }
          .ds-grid    { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)) !important; gap: 10px !important; }
          .ds-footer  { flex-direction: column !important; gap: 10px !important; align-items: stretch !important; }
          .ds-footer-btns { justify-content: stretch !important; }
          .ds-footer-btns button { flex: 1; justify-content: center; }
        }

        @media(min-width:641px) and (max-width:1024px){
          .ds-layout  { flex-direction: column !important; }
          .ds-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; gap: 12px !important; }
          .ds-sidebar > * { flex: 1; }
          .ds-grid    { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; }
        }
      `}</style>

      <div className="ds-layout" style={s.layout}>
        <div style={{ ...s.mainCard, animation: "fadeUp .3s ease both" }} className="ds-main">
          {/* Header */}
          <div className="ds-card-head" style={s.cardHead}>
            <div>
              <span style={s.tag}>Step 4 of 6</span>
              <h2 style={s.title}>Select defect categories</h2>
              <p style={s.subtitle}>Select all that apply — you'll detail each one next</p>
            </div>
            <button style={s.backBtn} onClick={() => navigate(-1)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}>
              ← Back
            </button>
          </div>

          <div className="ds-body" style={s.body}>
            {loading && <div style={s.spinner} />}

            {!loading && !error && (
              <>
                <div className="ds-grid" style={s.grid}>
                  {defects.map((d, i) => {
                    const isSel = selectedParents.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        className="defect-tile"
                        onClick={() => toggleParent(d.key)}
                        style={{
                          ...s.tile,
                          animationDelay: `${i * 0.06}s`,
                          borderColor: isSel ? TEAL : "#e2e8f0",
                          borderWidth:  isSel ? 2 : 1.5,
                          background:   isSel ? "#f0fdf9" : "#fff",
                          boxShadow:    isSel ? "0 0 0 3px rgba(0,180,160,.12), 0 4px 16px rgba(0,180,160,.1)" : "0 1px 4px rgba(0,0,0,.04)",
                        }}
                      >
                        {isSel && <div style={s.checkBadge}>✓</div>}
                        <div style={s.imgBox}>
                          {d.image ? (
                            <img src={d.image} alt={d.label} style={s.img} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <span style={{ fontSize: 28 }}>🔍</span>
                          )}
                        </div>
                        <p style={{ ...s.label, color: isSel ? TEAL_DARK : "#374151", fontWeight: isSel ? 700 : 500 }}>
                          {d.label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="ds-footer" style={s.footer}>
                  <p style={s.footerNote}>
                    {selectedParents.length === 0
                      ? "Select categories, or skip if no defects"
                      : `${selectedParents.length} categor${selectedParents.length > 1 ? "ies" : "y"} selected`}
                  </p>
                  <div className="ds-footer-btns" style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => navigate("/sell/accessories")}
                      style={s.skipBtn}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#374151"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
                    >
                      No defects ✨
                    </button>
                    <button
                      onClick={handleContinue}
                      disabled={selectedParents.length === 0}
                      style={{
                        ...s.continueBtn,
                        background: selectedParents.length > 0 ? TEAL : "#e2e8f0",
                        color:      selectedParents.length > 0 ? "#fff" : "#94a3b8",
                        cursor:     selectedParents.length > 0 ? "pointer" : "not-allowed",
                        boxShadow:  selectedParents.length > 0 ? "0 2px 12px rgba(0,180,160,.28)" : "none",
                      }}
                      onMouseEnter={(e) => { if (selectedParents.length > 0) { e.currentTarget.style.background = TEAL_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                      onMouseLeave={(e) => { if (selectedParents.length > 0) { e.currentTarget.style.background = TEAL; e.currentTarget.style.transform = ""; }}}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="ds-sidebar" style={s.sidebar}>
          <DeviceCard model={selectedModel} variant={selectedVariant} />
          <EvalSidebar selectedParentKeys={selectedParents} defects={defects} />
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: "90vh", background: "#f4f8fb", padding: "32px 20px 48px", fontFamily: "system-ui,sans-serif" },
  layout:      { maxWidth: 960, margin: "0 auto", display: "flex", gap: 20, alignItems: "flex-start" },
  mainCard:    { flex: 1, background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)", overflow: "hidden" },
  cardHead:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "24px 28px 18px", borderBottom: "1px solid #f1f5f9" },
  tag:         { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, opacity: .7 },
  title:       { margin: "5px 0 3px", fontSize: 20, fontWeight: 700, color: "#0f172a" },
  subtitle:    { margin: 0, fontSize: 13, color: "#94a3b8" },
  backBtn:     { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#64748b", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" },
  body:        { padding: "24px 28px 28px" },
  spinner:     { width: 26, height: 26, border: "3px solid #e2e8f0", borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "40px auto" },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 24 },
  tile:        { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 14px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "system-ui,sans-serif", animation: "fadeUp .3s ease both", border: "1.5px solid #e2e8f0" },
  imgBox:      { width: 88, height: 88, borderRadius: 12, background: "#fff", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" },
  img:         { width: "100%", height: "100%", objectFit: "contain" },
  label:       { margin: 0, fontSize: 12, textAlign: "center", lineHeight: 1.4 },
  checkBadge:  { position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: TEAL, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  footer:      { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 18, borderTop: "1px solid #f1f5f9" },
  footerNote:  { margin: 0, fontSize: 12, color: "#64748b" },
  skipBtn:     { padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 500, color: "#64748b", cursor: "pointer", transition: "all .15s" },
  continueBtn: { display: "inline-flex", alignItems: "center", padding: "11px 24px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700, transition: "all .18s ease" },
  sidebar:     { width: 256, flexShrink: 0, position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 },
};