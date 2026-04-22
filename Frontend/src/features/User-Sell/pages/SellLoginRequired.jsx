// SellLoginRequired.jsx
// Shown when a guest tries to submit a device listing without being logged in.

import { useNavigate } from "react-router-dom";

const BLUE      = "#0077b6";
const BLUE_DARK = "#005f8f";

export default function SellLoginRequired() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
        .slr-card { animation: fadeUp .35s ease both; }

        @media (max-width: 640px) {
          .slr-card { padding: 32px 20px !important; }
          .slr-btns { flex-direction: column !important; }
          .slr-btns button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="slr-card" style={s.card}>
        {/* Icon */}
        <div style={s.iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Text */}
        <h1 style={s.title}>Login Required</h1>
        <p style={s.subtitle}>
          You need to be logged in to list your device. It only takes a moment —
          sign in and we'll send you right back.
        </p>

        {/* Steps hint */}
        <div style={s.stepsBox}>
          {[
            { num: "1", text: "Log in to your Phonify account" },
            { num: "2", text: "Come back to the sell flow" },
            { num: "3", text: "Submit your listing instantly" },
          ].map((step) => (
            <div key={step.num} style={s.stepRow}>
              <div style={s.stepNum}>{step.num}</div>
              <p style={s.stepText}>{step.text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="slr-btns" style={s.btns}>
          <button
            onClick={() => navigate("/login", { state: { returnTo: "/sell/final-price" } })}
            style={s.primaryBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = BLUE_DARK; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,119,182,.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,119,182,.28)"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Log In to Continue
          </button>

          <button
            onClick={() => navigate(-1)}
            style={s.ghostBtn}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
          >
            ← Go Back
          </button>
        </div>

        {/* Register nudge */}
        <p style={s.registerNote}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={s.registerLink}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            Create one for free
          </span>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f4f8fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    border: "1px solid #eef2f6",
    boxShadow: "0 8px 40px rgba(0,0,0,.08)",
    padding: "48px 44px",
    maxWidth: 460,
    width: "100%",
    textAlign: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#e8f4fd",
    border: "1px solid #cce4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  title: {
    margin: "0 0 10px",
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "0 0 28px",
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.65,
  },
  stepsBox: {
    background: "#f8fbff",
    border: "1px solid #e8f0fb",
    borderRadius: 14,
    padding: "18px 20px",
    marginBottom: 28,
    textAlign: "left",
  },
  stepRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: BLUE,
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    margin: 0,
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
  },
  btns: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
  primaryBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 24px",
    borderRadius: 12,
    border: "none",
    background: BLUE,
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 12px rgba(0,119,182,.28)",
    transition: "all .18s ease",
  },
  ghostBtn: {
    flex: 1,
    padding: "12px 20px",
    borderRadius: 12,
    border: "1.5px solid #e2e8f0",
    background: "#fff",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all .15s ease",
  },
  registerNote: {
    margin: 0,
    fontSize: 13,
    color: "#94a3b8",
  },
  registerLink: {
    color: BLUE,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    transition: "text-decoration .15s",
  },
};