//ChooseVariant — Responsive

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getVariantsByModel } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import toast from "react-hot-toast";

const BLUE = "#0077b6";
const BLUE_DARK = "#005f8f";
const BLUE_LIGHT = "#e8f4fd";
const BLUE_MID = "#5ab3d8";

export default function ChooseVariant() {
  const navigate = useNavigate();
  const { selectedModel, setSelectedVariant } = useSellFlow();

  const [variants, setVariants] = useState([]);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedModel) navigate("/sell", { replace: true });
  }, [selectedModel]);

  if (!selectedModel) return null;

  useEffect(() => {
    getVariantsByModel(selectedModel.id)
      .then((res) => setVariants(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedModel.id]);

  const handleContinue = () => {
    if (!picked) return;
    setSelectedVariant(picked);
    toast.success("Variant selected!");
    navigate("/sell/base-price");
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .cv-card{animation:fadeUp .3s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media(max-width:640px){
          .cv-page { padding: 16px 12px 32px !important; }
          .cv-card-inner { max-width: 100% !important; border-radius: 16px !important; }
          .cv-topbar { padding: 16px 16px 14px !important; }
          .cv-body { padding: 16px 16px 20px !important; }
          .cv-footer { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .cv-footer-price { text-align: center; }
          .cv-primary-btn { justify-content: center; width: 100%; }
          .cv-chip { padding: 8px 12px !important; font-size: 12px !important; }
        }

        @media(min-width:641px) and (max-width:1024px){
          .cv-page { padding: 24px 20px 40px !important; align-items: flex-start !important; padding-top: 40px !important; }
          .cv-card-inner { max-width: 560px !important; }
        }
      `}</style>

      <div className="cv-page" style={s.page}>
        <div className="cv-card cv-card-inner" style={s.card}>
          {/* Top bar */}
          <div className="cv-topbar" style={s.topBar}>
            <div>
              <span style={s.tag}>Step 1 of 6</span>
              <h2 style={s.title}>Pick your variant</h2>
            </div>
            <button
              style={s.backBtn}
              onClick={() => navigate(-1)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#374151"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
            >
              ← Back
            </button>
          </div>

          {loading && <div style={s.spinner} />}
          {error && <p style={{ color: "#ef4444", fontSize: 13, padding: "20px 24px" }}>{error}</p>}

          {!loading && !error && (
            <div className="cv-body" style={s.body}>
              {/* Device info row */}
              <div style={s.deviceRow}>
                <div style={s.imgBox}>
                  {selectedModel.image ? (
                    <img src={selectedModel.image} alt={selectedModel.name} style={s.img} />
                  ) : (
                    <span style={{ fontSize: 32 }}>📱</span>
                  )}
                </div>
                <div>
                  <p style={s.deviceBrand}>{selectedModel.brand ?? "Smartphone"}</p>
                  <h3 style={s.deviceName}>{selectedModel.name}</h3>
                </div>
              </div>

              <div style={s.divider} />

              <p style={s.variantHeading}>Storage / Variant</p>
              {variants.length === 0 && (
                <p style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0" }}>No variants available.</p>
              )}
              <div style={s.chipRow}>
                {variants.map((v) => {
                  const sel = picked?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      className="cv-chip"
                      onClick={() => setPicked(v)}
                      style={{
                        ...s.chip,
                        borderColor: sel ? BLUE : "#e2e8f0",
                        background: sel ? BLUE_LIGHT : "#f8fafc",
                        color: sel ? "#005a8e" : "#475569",
                        fontWeight: sel ? 700 : 500,
                      }}
                      onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = BLUE_MID; e.currentTarget.style.color = BLUE; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                      onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.transform = "none"; }}}
                    >
                      {sel && <span style={{ color: BLUE, fontSize: 11, fontWeight: 800 }}>✓ </span>}
                      {v.label}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="cv-footer" style={s.footer}>
                <div className="cv-footer-price">
                  {picked ? (
                    <>
                      <p style={s.uptoText}>Base value up to</p>
                      <p style={s.uptoPrice}>₹{picked.basePrice.toLocaleString("en-IN")}</p>
                    </>
                  ) : (
                    <p style={s.pickHint}>Select a variant to see base value</p>
                  )}
                </div>
                <button
                  disabled={!picked}
                  onClick={handleContinue}
                  className="cv-primary-btn"
                  style={{
                    ...s.primaryBtn,
                    background: picked ? BLUE : "#e2e8f0",
                    color: picked ? "#fff" : "#94a3b8",
                    cursor: picked ? "pointer" : "not-allowed",
                    boxShadow: picked ? "0 2px 12px rgba(0,119,182,.28)" : "none",
                  }}
                  onMouseEnter={(e) => { if (picked) { e.currentTarget.style.background = BLUE_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                  onMouseLeave={(e) => { if (picked) { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = ""; }}}
                >
                  Get Exact Value
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 8 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:          { minHeight: "90vh", background: "#f4f8fb", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px", fontFamily: "system-ui,sans-serif" },
  card:          { width: "100%", maxWidth: 480, background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)", overflow: "hidden" },
  topBar:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "22px 24px 18px", borderBottom: "1px solid #f1f5f9" },
  tag:           { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, opacity: 0.7 },
  title:         { margin: "4px 0 0", fontSize: 18, fontWeight: 700, color: "#0f172a" },
  backBtn:       { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#64748b", cursor: "pointer", transition: "all .15s", marginTop: 2, whiteSpace: "nowrap" },
  spinner:       { width: 26, height: 26, border: "3px solid #e2e8f0", borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "40px auto" },
  body:          { padding: "20px 24px 24px" },
  deviceRow:     { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 },
  imgBox:        { width: 58, height: 68, borderRadius: 12, background: "linear-gradient(135deg,#f0f7fb,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #dbeafe", flexShrink: 0 },
  img:           { width: "72%", height: "88%", objectFit: "contain" },
  deviceBrand:   { margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8" },
  deviceName:    { margin: "3px 0 0", fontSize: 17, fontWeight: 700, color: "#0f172a" },
  divider:       { height: 1, background: "#f1f5f9", marginBottom: 18 },
  variantHeading:{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748b" },
  chipRow:       { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  chip:          { padding: "8px 16px", borderRadius: 10, border: "1.5px solid", fontSize: 13, cursor: "pointer", transition: "all .15s", fontFamily: "system-ui,sans-serif" },
  footer:        { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 0 0", borderTop: "1px solid #f1f5f9" },
  uptoText:      { margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500 },
  uptoPrice:     { margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: BLUE, letterSpacing: "-0.02em" },
  pickHint:      { margin: 0, fontSize: 12, color: "#94a3b8", maxWidth: 160, lineHeight: 1.4 },
  primaryBtn:    { display: "inline-flex", alignItems: "center", padding: "11px 22px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700, transition: "all .18s ease", flexShrink: 0 },
};