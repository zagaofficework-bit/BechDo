// NearbyDevicesPage.jsx
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function fetchNearbyProducts({ latitude, longitude, radius = 10, limit = 48 }) {
  const params = new URLSearchParams({ latitude, longitude, radius, limit });
  const token  = localStorage.getItem("accessToken");
  const res    = await fetch(`${BASE_URL}/api/products/nearby?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch nearby products");
  return data;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(["", "Permission denied", "Unavailable", "Timed out"][err.code] || "Unknown error")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (n) => n?.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const pct     = (p, o) => o ? Math.round(((o - p) / o) * 100) : null;
const fmtDist = (km) => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

const RADII = [5, 10, 25, 50];

const conditionConfig = {
  Superb: { bg: "#e6f7f0", text: "#0a6640", dot: "#12b76a" },
  Good:   { bg: "#e0f2fe", text: "#0369a1", dot: "#0077b6" },
  Fair:   { bg: "#fef9c3", text: "#854d0e", dot: "#f59e0b" },
};

// ─── Skeleton card ─────────────────────────────────────────────────────────
const SkeletonCard = memo(() => (
  <div style={{
    borderRadius: 18,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #e8eef4",
    boxShadow: "0 2px 12px rgba(0,119,182,0.06)",
  }}>
    <div style={{ height: 200, background: "linear-gradient(135deg, #f0f6fb 0%, #e4eef7 100%)" }} />
    <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {[55, 80, 45, 65, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 16 : 10,
          width: `${w}%`,
          borderRadius: 6,
          background: "#edf2f7",
          animation: "skpulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  </div>
));

// ─── Product Card ──────────────────────────────────────────────────────────
const ProductCard = memo(({ product, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const discount  = pct(product.price, product.originalPrice);
  const distLabel = product.distance != null ? fmtDist(product.distance) : null;
  const cond      = conditionConfig[product.condition];

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "#fff",
        border: `1px solid ${hovered ? "rgba(0,119,182,0.3)" : "#e8eef4"}`,
        cursor: "pointer",
        transition: "transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,119,182,0.14), 0 4px 12px rgba(0,119,182,0.08)"
          : "0 2px 12px rgba(0,119,182,0.06)",
      }}
    >
      {/* Image */}
      <div style={{
        position: "relative",
        height: 200,
        background: "linear-gradient(135deg, #f0f6fb 0%, #e4eef7 100%)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {product.images?.[0]
          ? <img
              src={product.images[0]}
              alt={product.title}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                transition: "transform 0.4s ease",
                transform: hovered ? "scale(1.05)" : "scale(1)",
              }}
              onError={e => { e.target.src = "https://placehold.co/300x200/e4eef7/0077b6?text=📱"; }}
            />
          : <span style={{ fontSize: 48, opacity: 0.2 }}>📱</span>
        }

        {/* Distance badge */}
        {distLabel && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(0,119,182,0.9)",
            backdropFilter: "blur(8px)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 30,
            letterSpacing: "0.02em",
          }}>
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {distLabel}
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "#ef4444",
            color: "#fff", fontSize: 10, fontWeight: 800,
            padding: "3px 9px", borderRadius: 30,
            letterSpacing: "0.03em",
          }}>
            -{discount}%
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 16px 18px" }}>
        {/* Brand + Condition */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 8 }}>
          {product.brand && (
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
              color: "#0077b6", textTransform: "uppercase",
            }}>
              {product.brand}
            </span>
          )}
          {product.condition && cond && (
            <span style={{
              fontSize: 9, fontWeight: 700, flexShrink: 0,
              padding: "2px 8px", borderRadius: 20,
              background: cond.bg, color: cond.text,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: cond.dot, display: "inline-block" }} />
              {product.condition}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 14, fontWeight: 600, color: "#0f2a3d",
          lineHeight: 1.45, margin: "0 0 6px",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {product.title}
        </h3>

        {/* Location */}
        {product.address?.city && (
          <p style={{
            fontSize: 11, color: "#8faab8", margin: "0 0 10px",
            fontWeight: 500, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            </svg>
            {product.address.city}{product.address.state ? `, ${product.address.state}` : ""}
          </p>
        )}

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
          <span style={{
            fontSize: 20, fontWeight: 800, color: "#0077b6",
            letterSpacing: "-0.02em",
          }}>
            ₹{fmt(product.price)}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: 12, color: "#b0c4ce", textDecoration: "line-through", fontWeight: 500 }}>
              ₹{fmt(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f0f5f9", marginBottom: 10 }} />

        {/* Seller */}
        {product.listedBy?.firstname ? (
          <p style={{ fontSize: 10, color: "#8faab8", margin: 0, fontWeight: 500 }}>
            Sold by{" "}
            <span style={{ color: "#0077b6", fontWeight: 700 }}>
              {product.listedBy.firstname} {product.listedBy.lastname}
            </span>
          </p>
        ) : (
          <p style={{ fontSize: 10, color: "#b0c4ce", margin: 0 }}>Listed nearby</p>
        )}
      </div>
    </article>
  );
});

// ─── Filter Pill ────────────────────────────────────────────────────────────
const FilterPill = memo(({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "7px 16px",
      borderRadius: 30,
      fontSize: 13,
      fontWeight: 600,
      border: active ? "1.5px solid #0077b6" : "1.5px solid #dde8f0",
      background: active ? "#0077b6" : "#fff",
      color: active ? "#fff" : "#4a7c99",
      cursor: "pointer",
      transition: "all 0.18s ease",
      outline: "none",
      fontFamily: "'Outfit', sans-serif",
      letterSpacing: "0.01em",
    }}
  >
    {label}
  </button>
));

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function NearbyDevicesPage() {
  const navigate       = useNavigate();
  const { user }       = useAuth();

  const [products,   setProducts]  = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState(null);
  const [location,   setLocation]  = useState(null);
  const [locLoading, setLocLoading]= useState(false);
  const [radius,     setRadius]    = useState(10);
  const [sortBy,     setSortBy]    = useState("distance");

  // Pull saved location from user profile
  useEffect(() => {
    const coords = user?.location?.coordinates;
    if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
      setLocation({ longitude: coords[0], latitude: coords[1], source: "saved" });
    }
  }, [user]);

  // Fetch products whenever location or radius changes
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNearbyProducts({ latitude: location.latitude, longitude: location.longitude, radius, limit: 48 })
      .then(res => { if (!cancelled) setProducts(res.products ?? []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [location, radius]);

  const handleGetLocation = async () => {
    setLocLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setLocation({ ...pos, source: "gps" });
    } catch (e) {
      setError(e.message);
    } finally {
      setLocLoading(false);
    }
  };

  const handleCard = useCallback((id) => navigate(`/product/${id}`), [navigate]);

  // Sort products client-side
  const sorted = [...products].sort((a, b) => {
    if (sortBy === "distance")  return (a.distance ?? 999) - (b.distance ?? 999);
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc")return b.price - a.price;
    if (sortBy === "newest")    return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const showPrompt   = !location && !loading;
  const showProducts = !!location && !loading && sorted.length > 0;
  const showEmpty    = !!location && !loading && sorted.length === 0 && !error;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        @keyframes skpulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes pinpulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(2.4);opacity:0} }
        @keyframes fadein { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#f7fbfe",
        fontFamily: "'Outfit', sans-serif",
        color: "#0f2a3d",
      }}>

        {/* ── Top Nav Bar ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e4eef7",
          boxShadow: "0 2px 16px rgba(0,119,182,0.06)",
        }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "1.5px solid #dde8f0",
                borderRadius: 30, padding: "6px 14px",
                fontSize: 13, fontWeight: 600, color: "#4a7c99",
                cursor: "pointer", transition: "all 0.17s ease",
                outline: "none", fontFamily: "'Outfit', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0077b6"; e.currentTarget.style.color = "#0077b6"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#dde8f0"; e.currentTarget.style.color = "#4a7c99"; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            {/* Title area */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: location ? "#0077b6" : "#cbd5e1" }} />
                  {location && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "#0077b6", animation: "pinpulse 2s ease-out infinite",
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#0f2a3d", letterSpacing: "-0.01em" }}>
                  Devices Near You
                </span>
                {location && products.length > 0 && (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                    background: "rgba(0,119,182,0.1)", color: "#0077b6",
                  }}>
                    {products.length} found
                  </span>
                )}
              </div>
            </div>

            {/* Location status */}
            {location && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4a7c99", fontWeight: 500 }}>
                <svg width="12" height="12" fill="none" stroke="#0077b6" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {location.source === "gps" ? "Live location" : "Saved location"}
              </div>
            )}
          </div>
        </header>

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px 64px" }}>

          {/* ── Hero strip ── */}
          <div style={{
            background: "linear-gradient(120deg, #0077b6 0%, #0096c7 60%, #00b4d8 100%)",
            borderRadius: 24,
            padding: "36px 40px",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            boxShadow: "0 8px 32px rgba(0,119,182,0.25)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", right: -40, top: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 60, bottom: -60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

            <div style={{ position: "relative" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", margin: "0 0 6px" }}>
                📍 Nearby Marketplace
              </p>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
                Local Deals Around You
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0, fontWeight: 400 }}>
                {location
                  ? `Showing devices within ${radius}km of your location`
                  : "Enable location to see devices near you"}
              </p>
            </div>

            {/* CTA / radius selector */}
            {!location ? (
              <button
                onClick={handleGetLocation}
                disabled={locLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  background: "#fff", color: "#0077b6",
                  fontSize: 14, fontWeight: 800,
                  padding: "13px 26px", borderRadius: 50, border: "none",
                  cursor: locLoading ? "not-allowed" : "pointer",
                  opacity: locLoading ? 0.8 : 1,
                  transition: "all 0.18s ease", outline: "none",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  flexShrink: 0, position: "relative",
                }}
              >
                {locLoading
                  ? <><span style={{ width: 16, height: 16, border: "2.5px solid rgba(0,119,182,0.2)", borderTopColor: "#0077b6", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Detecting…</>
                  : <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Use My Location</>
                }
              </button>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                borderRadius: 16, padding: "16px 20px",
                border: "1px solid rgba(255,255,255,0.2)",
                flexShrink: 0, position: "relative",
              }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Search Radius
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  {RADII.map(r => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      style={{
                        padding: "5px 12px", borderRadius: 20, border: "1.5px solid",
                        borderColor: radius === r ? "#fff" : "rgba(255,255,255,0.3)",
                        background: radius === r ? "#fff" : "transparent",
                        color: radius === r ? "#0077b6" : "#fff",
                        fontSize: 12, fontWeight: 700,
                        cursor: "pointer", transition: "all 0.15s ease",
                        outline: "none", fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 14, padding: "14px 18px",
              fontSize: 13, color: "#dc2626", marginBottom: 24,
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span style={{ flex: 1, fontWeight: 500 }}>{error}</span>
              <button onClick={handleGetLocation} style={{ fontWeight: 700, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: 12, outline: "none", fontFamily: "'Outfit', sans-serif" }}>
                Retry
              </button>
            </div>
          )}

          {/* ── Filters & Sort bar ── */}
          {showProducts && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12, marginBottom: 28,
              animation: "fadein 0.3s ease",
            }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#8faab8", fontWeight: 500 }}>Sort:</span>
                {[
                  { key: "distance",   label: "Nearest first" },
                  { key: "price_asc",  label: "Price: Low–High" },
                  { key: "price_desc", label: "Price: High–Low" },
                  { key: "newest",     label: "Newest" },
                ].map(opt => (
                  <FilterPill
                    key={opt.key}
                    label={opt.label}
                    active={sortBy === opt.key}
                    onClick={() => setSortBy(opt.key)}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#a0b8c8", fontWeight: 500 }}>
                {sorted.length} device{sorted.length !== 1 ? "s" : ""} within {radius}km
              </span>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── Location prompt ── */}
          {showPrompt && (
            <div style={{ textAlign: "center", padding: "80px 32px", animation: "fadein 0.4s ease" }}>
              <div style={{
                width: 80, height: 80, borderRadius: 24,
                background: "rgba(0,119,182,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="36" height="36" fill="none" stroke="#0077b6" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f2a3d", margin: "0 0 10px" }}>
                Discover Local Deals
              </h2>
              <p style={{ fontSize: 14, color: "#8faab8", margin: "0 auto 28px", lineHeight: 1.6, maxWidth: 380 }}>
                Allow location access to browse refurbished phones, laptops, and gadgets available near you.
              </p>
              <button
                onClick={handleGetLocation}
                disabled={locLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#0077b6", color: "#fff",
                  fontSize: 14, fontWeight: 700,
                  padding: "13px 28px", borderRadius: 50, border: "none",
                  cursor: locLoading ? "not-allowed" : "pointer",
                  opacity: locLoading ? 0.8 : 1,
                  transition: "all 0.18s ease", outline: "none",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: "0 4px 20px rgba(0,119,182,0.3)",
                }}
                onMouseEnter={e => { if (!locLoading) e.currentTarget.style.background = "#005f92"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0077b6"; }}
              >
                {locLoading
                  ? <><span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Detecting…</>
                  : <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Use My Location</>
                }
              </button>
            </div>
          )}

          {/* ── Empty state ── */}
          {showEmpty && (
            <div style={{ textAlign: "center", padding: "80px 32px", animation: "fadein 0.4s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f2a3d", margin: "0 0 8px" }}>
                No devices found within {radius}km
              </h2>
              <p style={{ fontSize: 14, color: "#8faab8", margin: "0 0 24px" }}>
                Try expanding your search radius
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {RADII.filter(r => r > radius).map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    style={{
                      padding: "9px 20px", borderRadius: 30,
                      background: "#0077b6", color: "#fff",
                      fontSize: 13, fontWeight: 700,
                      border: "none", cursor: "pointer",
                      transition: "all 0.18s ease", outline: "none",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#005f92"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#0077b6"; }}
                  >
                    Try {r}km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Product grid ── */}
          {showProducts && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
              animation: "fadein 0.35s ease",
            }}>
              {sorted.map((p, i) => (
                <ProductCard
                  key={p._id ?? i}
                  product={p}
                  onClick={() => handleCard(p._id)}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}