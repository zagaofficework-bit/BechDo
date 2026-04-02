//YesNo — Responsive

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvaluationConfig } from "../../../services/deviceSell.api";
import { useSellFlow } from "../../../context/sellflow.context";
import toast from "react-hot-toast";

const BLUE      = "#0077b6";
const BLUE_DARK = "#005f8f";
const BLUE_LIGHT = "#e8f4fd";
const BLUE_MID  = "#5ab3d8";

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

export default function YesNo() {
  const navigate = useNavigate();
  const { category, selectedModel, selectedVariant, answers, setAnswers } = useSellFlow();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!selectedModel || !selectedVariant) navigate("/sell", { replace: true });
  }, [selectedModel, selectedVariant]);

  if (!selectedModel || !selectedVariant) return null;

  useEffect(() => {
    getEvaluationConfig(category)
      .then((res) => setQuestions(res.data.questions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category]);

  const answered    = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answered === questions.length;
  const progress    = questions.length ? (answered / questions.length) * 100 : 0;
  const handleAnswer = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const evaluation = questions.reduce((acc, q) => {
    if (answers[q.key] !== undefined) {
      const cat = q.category ?? "Device Details";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ label: answers[q.key] ? (q.yesLabel ?? "Yes") : (q.noLabel ?? q.label), type: answers[q.key] ? "yes" : "no" });
    }
    return acc;
  }, {});

  useEffect(() => { if (error) toast.error(error); }, [error]);

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .yn-card{animation:fadeUp .3s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media(max-width:640px){
          .yn-layout { flex-direction: column !important; gap: 14px !important; padding: 0 !important; max-width: 100% !important; }
          .yn-sidebar { width: 100% !important; position: static !important; order: -1; }
          .yn-main   { border-radius: 16px !important; }
          .yn-card-head { padding: 18px 16px 14px !important; }
          .yn-q-row  { padding: 12px 16px !important; gap: 10px !important; }
          .yn-q-num  { display: none !important; }
          .yn-btn-pair { gap: 6px !important; }
          .yn-opt-btn  { padding: 6px 14px !important; font-size: 12px !important; }
          .yn-footer   { padding: 16px 16px !important; flex-direction: column !important; gap: 10px !important; }
          .yn-primary-btn { justify-content: center; width: 100%; }
        }

        @media(min-width:641px) and (max-width:1024px){
          .yn-layout { flex-direction: column !important; max-width: 100% !important; }
          .yn-sidebar { width: 100% !important; position: static !important; flex-direction: row !important; }
          .yn-sidebar > * { flex: 1; }
        }
      `}</style>

      <div className="yn-layout" style={s.layout}>
        {/* ── Main card ── */}
        <div className="yn-card yn-main" style={s.mainCard}>
          <div className="yn-card-head" style={s.cardHead}>
            <button style={s.backBtn} onClick={() => navigate("/sell/base-price")}>← Back</button>
            <span style={s.tag}>Step 3 of 6</span>
            <h2 style={s.title}>Tell us about your device</h2>
            <p style={s.subtitle}>Honest answers help us give you the most accurate price.</p>
          </div>
          {loading && <div style={s.spinner} />}

          {!loading && !error && (
            <>
              <div style={s.qList}>
                {questions.map((q, i) => {
                  const ans = answers[q.key];
                  const isAnswered = ans !== undefined;
                  return (
                    <div key={q.key} className="yn-q-row" style={{ ...s.qRow, borderColor: isAnswered ? BLUE_LIGHT : "#f1f5f9", background: isAnswered ? "#fafeff" : "#fff" }}>
                      <span className="yn-q-num" style={{ ...s.qNum, color: isAnswered ? BLUE : "#cbd5e1" }}>{String(i + 1).padStart(2, "0")}</span>
                      <div style={{ flex: 1 }}>
                        <p style={s.qLabel}>{q.label}</p>
                        {q.description && <p style={s.qDesc}>{q.description}</p>}
                        {ans === false && q.deductionOnNo > 0 && (
                          <p style={s.deductNote}>⚠ -{q.deductionOnNo}% deduction applies</p>
                        )}
                      </div>
                      <div className="yn-btn-pair" style={s.btnPair}>
                        {[true, false].map((opt) => {
                          const sel = ans === opt;
                          return (
                            <button
                              key={String(opt)}
                              className="yn-opt-btn"
                              onClick={() => handleAnswer(q.key, opt)}
                              style={{ ...s.optBtn, borderColor: sel ? BLUE : "#e2e8f0", background: sel ? BLUE : "#f8fafc", color: sel ? "#fff" : "#475569", fontWeight: sel ? 700 : 500 }}
                              onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = BLUE_MID; e.currentTarget.style.color = BLUE; }}}
                              onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}}
                            >
                              {opt ? "Yes" : "No"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="yn-footer" style={s.footer}>
                <div style={{ flex: 1 }}>
                  <div style={s.progressTrack}>
                    <div style={{ ...s.progressFill, width: `${progress}%` }} />
                  </div>
                  <p style={s.progressText}>{answered} / {questions.length} answered</p>
                </div>
                <button
                  disabled={!allAnswered}
                  className="yn-primary-btn"
                  onClick={() => navigate("/sell/defects")}
                  style={{ ...s.primaryBtn, background: allAnswered ? BLUE : "#e2e8f0", color: allAnswered ? "#fff" : "#94a3b8", cursor: allAnswered ? "pointer" : "not-allowed", boxShadow: allAnswered ? "0 2px 12px rgba(0,119,182,.28)" : "none" }}
                  onMouseEnter={(e) => { if (allAnswered) { e.currentTarget.style.background = BLUE_DARK; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                  onMouseLeave={(e) => { if (allAnswered) { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = ""; }}}
                >
                  Continue
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ marginLeft: 8 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="yn-sidebar" style={s.sidebar}>
          <DeviceCard model={selectedModel} variant={selectedVariant} />
          <div style={s.evalCard}>
            <p style={s.evalTitle}>Live Evaluation</p>
            {Object.keys(evaluation).length === 0
              ? <p style={s.evalEmpty}>Your answers will appear here.</p>
              : Object.entries(evaluation).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <p style={s.evalCat}>{cat}</p>
                  {items.map((item, idx) => (
                    <div key={idx} style={s.evalRow}>
                      <span style={{ ...s.evalDot, background: item.type === "yes" ? "#22c55e" : "#f87171" }} />
                      <span style={s.evalLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: "90vh", background: "#f4f8fb", padding: "32px 20px 48px", fontFamily: "system-ui,sans-serif" },
  layout:       { maxWidth: 900, margin: "0 auto", display: "flex", gap: 20, alignItems: "flex-start" },
  mainCard:     { flex: 1, background: "#fff", borderRadius: 20, border: "1px solid #eef2f6", boxShadow: "0 4px 24px rgba(0,0,0,.07)", overflow: "hidden" },
  cardHead:     { padding: "28px 28px 20px", borderBottom: "1px solid #f1f5f9" },
  tag:          { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, opacity: .7 },
  title:        { margin: "5px 0 4px", fontSize: 20, fontWeight: 700, color: "#0f172a" },
  subtitle:     { margin: 0, fontSize: 13, color: "#94a3b8" },
  backBtn:      { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#64748b", cursor: "pointer", marginBottom: 10 },
  spinner:      { width: 26, height: 26, border: "3px solid #e2e8f0", borderTop: `3px solid ${BLUE}`, borderRadius: "50%", animation: "spin .8s linear infinite", margin: "40px auto" },
  qList:        { padding: "16px 0" },
  qRow:         { display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 28px", borderBottom: "1px solid #f8fafc", borderLeft: "3px solid transparent", transition: "all .2s" },
  qNum:         { fontSize: 13, fontWeight: 800, minWidth: 24, paddingTop: 1, transition: "color .2s", flexShrink: 0 },
  qLabel:       { margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 },
  qDesc:        { margin: "3px 0 0", fontSize: 12, color: "#94a3b8" },
  deductNote:   { margin: "6px 0 0", fontSize: 11, color: "#f87171", fontWeight: 500 },
  btnPair:      { display: "flex", gap: 8, flexShrink: 0 },
  optBtn:       { padding: "7px 18px", borderRadius: 9, border: "1.5px solid", fontSize: 13, cursor: "pointer", transition: "all .15s", fontFamily: "system-ui,sans-serif" },
  footer:       { display: "flex", alignItems: "center", gap: 20, padding: "20px 28px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" },
  progressTrack:{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", background: BLUE, borderRadius: 99, transition: "width .4s ease" },
  progressText: { margin: "5px 0 0", fontSize: 11, color: "#94a3b8" },
  primaryBtn:   { display: "inline-flex", alignItems: "center", padding: "11px 24px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700, transition: "all .18s ease", flexShrink: 0 },
  sidebar:      { width: 256, flexShrink: 0, position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 },
  evalCard:     { background: "#fff", borderRadius: 14, border: "1px solid #eef2f6", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" },
  evalTitle:    { margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" },
  evalEmpty:    { fontSize: 12, color: "#94a3b8", margin: 0 },
  evalCat:      { margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" },
  evalRow:      { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 },
  evalDot:      { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  evalLabel:    { fontSize: 12, color: "#475569" },
};