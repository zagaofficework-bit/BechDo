//BasePrice — Responsive

import { useNavigate } from "react-router-dom";
import { useSellFlow } from "../../../context/sellflow.context";
import { useEffect } from "react";

const BLUE      = "#0077b6";
const BLUE_DARK = "#005f8f";

export default function BasePrice() {
  const navigate = useNavigate();
  const { selectedModel, selectedVariant } = useSellFlow();

  useEffect(() => {
    if (!selectedModel || !selectedVariant) navigate("/sell", { replace: true });
  }, [selectedModel, selectedVariant]);

  if (!selectedModel || !selectedVariant) return null;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .bp-card{animation:fadeUp .3s ease both}

        @media(max-width:640px){
          .bp-page { padding: 16px 12px 32px !important; }
          .bp-card-inner {
            flex-direction: column !important;
            max-width: 100% !important;
            border-radius: 16px !important;
          }
          .bp-img-panel {
            width: 100% !important;
            height: 160px !important;
            padding: 20px !important;
            border-radius: 0 !important;
          }
          .bp-img { width: 80px !important; height: 110px !important; }
          .bp-content { padding: 20px 20px 24px !important; }
          .bp-price { font-size: 34px !important; }
          .bp-name  { font-size: 20px !important; }
          .bp-actions { flex-direction: column !important; gap: 10px !important; }
          .bp-primary-btn { justify-content: center; width: 100%; }
          .bp-info-row {
            grid-template-columns: 1fr !important;
            max-width: 100% !important;
          }
        }

        @media(min-width:641px) and (max-width:1024px){
          .bp-page { align-items: flex-start !important; padding-top: 40px !important; }
          .bp-card-inner { max-width: 600px !important; }
          .bp-info-row { max-width: 600px !important; grid-template-columns: 1fr 1fr 1fr !important; }
        }
      `}</style>

      <div className="bp-page" style={s.page}>
        <div className="bp-card bp-card-inner" style={s.card}>
          {/* Image panel */}
          <div className="bp-img-panel" style={s.imgPanel}>
            {selectedModel.image
              ? <img src={selectedModel.image} alt={selectedModel.name} className="bp-img" style={s.img} />
              : <span style={{ fontSize: 52 }}>📱</span>}
          </div>

          {/* Content */}
          <div className="bp-content" style={s.content}>
            <span style={s.tag}>Estimated Value</span>
            <h1 className="bp-name" style={s.name}>{selectedModel.name}</h1>
            <p style={s.variant}>{selectedVariant.label}</p>
            <div style={s.sep} />
            <p style={s.uptoLabel}>Get up to</p>
            <p className="bp-price" style={s.price}>₹{selectedVariant.basePrice.toLocaleString("en-IN")}</p>
            <p style={s.priceNote}>Before condition-based adjustments</p>
            {selectedModel.soldCount > 0 && (
              <div style={s.soldBadge}>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>{selectedModel.soldCount.toLocaleString("en-IN")}+</span>
                <span style={{ color: "#64748b" }}> already sold on Phonify</span>
              </div>
            )}
            <div className="bp-actions" style={s.actions}>
              <button
                className="bp-primary-btn"
                style={s.primaryBtn}
                onClick={() => navigate("/sell/questions")}
                onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_DARK; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,119,182,.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,119,182,.28)"; }}
              >
                Get Exact Value <Arrow />
              </button>
              <button
                style={s.ghostBtn}
                onClick={() => navigate("/sell/variant")}
                onMouseEnter={(e) => { e.currentTarget.style.color = BLUE; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
              >
                Change variant
              </button>
            </div>
          </div>
        </div>

        <div className="bp-info-row" style={s.infoRow}>
          {[
            { icon: "🔍", title: "Accurate Quote",  desc: "A few quick questions for a precise price." },
            { icon: "⚡", title: "Instant Process", desc: "Same-day pickup & payment in most areas."   },
            { icon: "🔒", title: "Secure & Trusted",desc: "Verified buyers, guaranteed payment."        },
          ].map((x) => (
            <div key={x.title} style={s.infoCard}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{x.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{x.title}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{x.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 8 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

const s = {
  page:       { minHeight: "90vh", background: "#f4f8fb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", fontFamily: "system-ui,sans-serif" },
  card:       { width: "100%", maxWidth: 680, background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)", overflow: "hidden", display: "flex" },
  imgPanel:   { width: 190, background: "linear-gradient(145deg,#f0f7fb,#dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", padding: 28, flexShrink: 0 },
  img:        { width: 110, height: 150, objectFit: "contain", filter: "drop-shadow(0 8px 18px rgba(0,119,182,.22))" },
  content:    { flex: 1, padding: "32px 36px", display: "flex", flexDirection: "column", justifyContent: "center" },
  tag:        { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, opacity: .7 },
  name:       { margin: "6px 0 2px", fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" },
  variant:    { margin: 0, fontSize: 13, color: "#64748b" },
  sep:        { height: 1, background: "#f1f5f9", margin: "18px 0" },
  uptoLabel:  { margin: 0, fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" },
  price:      { margin: "4px 0 2px", fontSize: 42, fontWeight: 800, color: BLUE, letterSpacing: "-0.03em", lineHeight: 1 },
  priceNote:  { margin: 0, fontSize: 11, color: "#94a3b8" },
  soldBadge:  { marginTop: 12, display: "inline-block", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "5px 12px", fontSize: 12 },
  actions:    { marginTop: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  primaryBtn: { display: "inline-flex", alignItems: "center", padding: "11px 24px", borderRadius: 11, border: "none", background: BLUE, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,119,182,.28)", transition: "all .18s ease" },
  ghostBtn:   { background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", textDecoration: "underline", transition: "color .15s" },
  infoRow:    { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 14, width: "100%", maxWidth: 680 },
  infoCard:   { background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
};