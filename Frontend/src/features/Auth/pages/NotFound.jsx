import { useNavigate } from "react-router-dom";
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", gap: 16 }}>
      <h1 style={{ fontSize: 72, fontWeight: 800, color: "#1132d4", margin: 0 }}>404</h1>
      <p style={{ fontSize: 18, color: "#64748b" }}>Page not found</p>
      <button onClick={() => navigate("/")} style={{ padding: "10px 28px", borderRadius: 12, background: "#1132d4", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Go Home
      </button>
    </div>
  );
}