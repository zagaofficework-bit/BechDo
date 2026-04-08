// NearbyDevices.jsx — fully responsive

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_URL || "http://localhost:3000";

async function fetchNearbyProducts({ latitude, longitude, radius = 10, limit = 12 }) {
  const params = new URLSearchParams({ latitude, longitude, radius, limit });
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}/api/products/nearby?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch nearby products");
  return data;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(["", "Permission denied", "Unavailable", "Timed out"][err.code] || "Unknown error")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (n)    => n?.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const pct     = (p, o) => (o ? Math.round(((o - p) / o) * 100) : null);
const fmtDist = (km)   => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

const conditionConfig = {
  Superb: { bg: "#e6f7f0", text: "#0a6640", dot: "#12b76a" },
  Good:   { bg: "#e0f2fe", text: "#0369a1", dot: "#0077b6" },
  Fair:   { bg: "#fef9c3", text: "#854d0e", dot: "#f59e0b" },
};

// ─── Hook: responsive card config ─────────────────────────────────────────────
function useCarouselConfig() {
  const [config, setConfig] = useState({ cardWidth: 200, gap: 12, visible: 2 });
  useEffect(() => {
    function compute() {
      const w = window.innerWidth;
      if (w < 480)       setConfig({ cardWidth: 165, gap: 10, visible: 2 });
      else if (w < 640)  setConfig({ cardWidth: 185, gap: 12, visible: 2 });
      else if (w < 768)  setConfig({ cardWidth: 200, gap: 12, visible: 3 });
      else if (w < 1024) setConfig({ cardWidth: 210, gap: 14, visible: 3 });
      else if (w < 1280) setConfig({ cardWidth: 220, gap: 16, visible: 4 });
      else               setConfig({ cardWidth: 240, gap: 16, visible: 4 });
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return config;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = memo(({ width }) => (
  <div style={{
    flexShrink: 0, width, borderRadius: 18, overflow: "hidden",
    background: "#fff", border: "1px solid #e8eef4",
    boxShadow: "0 2px 12px rgba(0,119,182,0.06)",
  }}>
    <div style={{ height: 160, background: "linear-gradient(135deg,#f0f6fb 0%,#e4eef7 100%)" }} />
    <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      {[55, 80, 45, 65].map((w, i) => (
        <div key={i} style={{
          height: i === 1 ? 13 : 9, width: `${w}%`, borderRadius: 6, background: "#edf2f7",
          animation: "skpulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  </div>
));

// ─── Nearby product card ──────────────────────────────────────────────────────
const NearbyCard = memo(({ product, onClick, width }) => {
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
        flexShrink: 0, width, borderRadius: 18, overflow: "hidden", background: "#fff",
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
        position: "relative", height: 160,
        background: "linear-gradient(135deg,#f0f6fb 0%,#e4eef7 100%)",
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transition: "transform 0.4s ease",
              transform: hovered ? "scale(1.05)" : "scale(1)",
            }}
            onError={(e) => { e.target.src = "https://placehold.co/240x180/e4eef7/0077b6?text=📱"; }}
          />
        ) : (
          <span style={{ fontSize: 36, opacity: 0.2 }}>📱</span>
        )}

        {distLabel && (
          <div style={{
            position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4,
            background: "rgba(0,119,182,0.9)", backdropFilter: "blur(8px)", color: "#fff",
            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 30, letterSpacing: "0.02em",
          }}>
            <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {distLabel}
          </div>
        )}

        {discount > 0 && (
          <div style={{
            position: "absolute", top: 8, right: 8, background: "#ef4444", color: "#fff",
            fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 30, letterSpacing: "0.03em",
          }}>
            -{discount}%
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
          {product.brand && (
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "#0077b6", textTransform: "uppercase" }}>
              {product.brand}
            </span>
          )}
          {product.condition && cond && (
            <span style={{
              fontSize: 8, fontWeight: 700, flexShrink: 0, padding: "2px 6px", borderRadius: 20,
              background: cond.bg, color: cond.text, display: "flex", alignItems: "center", gap: 3,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: cond.dot, display: "inline-block" }} />
              {product.condition}
            </span>
          )}
        </div>

        <h3 style={{
          fontSize: 12, fontWeight: 600, color: "#0f2a3d", lineHeight: 1.4, margin: "0 0 4px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {product.title}
        </h3>

        {product.address?.city && (
          <p style={{
            fontSize: 10, color: "#8faab8", margin: "0 0 7px", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 3,
          }}>
            <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {product.address.city}{product.address.state ? `, ${product.address.state}` : ""}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0077b6", letterSpacing: "-0.02em" }}>
            ₹{fmt(product.price)}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: 10, color: "#b0c4ce", textDecoration: "line-through", fontWeight: 500 }}>
              ₹{fmt(product.originalPrice)}
            </span>
          )}
        </div>

        <div style={{ height: 1, background: "#f0f5f9", marginBottom: 8 }} />

        {product.listedBy?.firstname ? (
          <p style={{ fontSize: 9, color: "#8faab8", margin: 0, fontWeight: 500 }}>
            Sold by{" "}
            <span style={{ color: "#0077b6", fontWeight: 700 }}>
              {product.listedBy.firstname} {product.listedBy.lastname}
            </span>
          </p>
        ) : (
          <p style={{ fontSize: 9, color: "#b0c4ce", margin: 0 }}>Listed nearby</p>
        )}
      </div>
    </article>
  );
});

// ─── Arrow button ─────────────────────────────────────────────────────────────
const Arrow = memo(({ dir, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 32, height: 32, borderRadius: "50%",
      background: disabled ? "#f0f5f9" : "#fff",
      border: `1.5px solid ${disabled ? "#e8eef4" : "#dde8f0"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: disabled ? "#b0c4ce" : "#4a7c99",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.18s ease", outline: "none",
      boxShadow: disabled ? "none" : "0 2px 8px rgba(0,119,182,0.08)",
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.background = "#0077b6";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.borderColor = "#0077b6";
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.color = "#4a7c99";
        e.currentTarget.style.borderColor = "#dde8f0";
      }
    }}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
    </svg>
  </button>
));

// ─── Main NearbyDevices section ───────────────────────────────────────────────
export default function NearbyDevices({ radius = 10 }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cardWidth, gap, visible } = useCarouselConfig();

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [location,   setLocation]   = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [index,      setIndex]      = useState(0);

  // Touch swipe
  const touchStartX = useRef(null);
  const touchEndX   = useRef(null);

  useEffect(() => {
    const coords = user?.location?.coordinates;
    if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
      setLocation({ longitude: coords[0], latitude: coords[1], source: "saved" });
    }
  }, [user]);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNearbyProducts({ latitude: location.latitude, longitude: location.longitude, radius })
      .then((res) => { if (!cancelled) setProducts(res.products ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [location, radius]);

  useEffect(() => { setIndex(0); }, [visible]);

  const handleGetLocation = async () => {
    setLocLoading(true); setError(null);
    try { const pos = await getCurrentPosition(); setLocation({ ...pos, source: "gps" }); }
    catch (e) { setError(e.message); }
    finally { setLocLoading(false); }
  };

  const maxIndex = Math.max(0, products.length - visible);
  const canPrev  = index > 0;
  const canNext  = index < maxIndex;

  const handlePrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const handleNext = useCallback(() => setIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex]);
  const handleCard = useCallback((id) => navigate(`/product/${id}`), [navigate]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && canNext) handleNext();
      if (diff < 0 && canPrev) handlePrev();
    }
    touchStartX.current = null; touchEndX.current = null;
  };

  const showPrompt   = !location && !loading;
  const showProducts = !!location && !loading && products.length > 0;
  const showEmpty    = !!location && !loading && products.length === 0 && !error;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        @keyframes skpulse  { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes pinpulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(2.4);opacity:0} }
        @keyframes spin     { to{transform:rotate(360deg)} }
      `}</style>

      <section style={{
        padding: "36px 0 40px",
        background: "#f7fbfe",
        borderTop: "1px solid #e4eef7",
        fontFamily: "'Outfit', sans-serif",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}
          className="sm:px-6 lg:px-8"
        >
          {/* ── Header ── */}
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            marginBottom: 22, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: location ? "#0077b6" : "#cbd5e1" }} />
                  {location && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "#0077b6", animation: "pinpulse 2s ease-out infinite",
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: "#0077b6", textTransform: "uppercase",
                }}>Near You</span>
              </div>

              <h2 style={{
                fontSize: "clamp(18px, 4vw, 26px)", fontWeight: 800, color: "#0f2a3d",
                margin: "0 0 4px", letterSpacing: "-0.025em", lineHeight: 1.1,
              }}>
                Devices in Your Area
              </h2>
              <p style={{ fontSize: "clamp(11px, 2vw, 13px)", color: "#8faab8", margin: 0, fontWeight: 500 }}>
                {location
                  ? `Within ${radius}km · ${products.length} device${products.length !== 1 ? "s" : ""} found`
                  : "Enable location to discover devices nearby"}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {showProducts && products.length > visible && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Arrow dir="prev" onClick={handlePrev} disabled={!canPrev} />
                  <Arrow dir="next" onClick={handleNext} disabled={!canNext} />
                </div>
              )}
              {showProducts && (
                <button
                  onClick={() => navigate("/nearby-devices")}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontWeight: 700, color: "#0077b6",
                    background: "rgba(0,119,182,0.08)", border: "1.5px solid rgba(0,119,182,0.18)",
                    padding: "7px 14px", borderRadius: 30, cursor: "pointer",
                    transition: "all 0.18s ease", outline: "none", fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#0077b6"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,119,182,0.08)"; e.currentTarget.style.color = "#0077b6"; }}
                >
                  View all
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* ── Location prompt ── */}
          {showPrompt && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "rgba(0,119,182,0.05)", border: "1.5px solid rgba(0,119,182,0.15)",
              borderRadius: 16, padding: "18px 20px", flexWrap: "wrap",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(0,119,182,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" fill="none" stroke="#0077b6" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f2a3d", margin: "0 0 3px" }}>
                  Find devices near your location
                </p>
                <p style={{ fontSize: 11, color: "#8faab8", margin: 0, lineHeight: 1.5 }}>
                  Refurbished phones, laptops and more near you
                </p>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={locLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#0077b6", color: "#fff", fontSize: 12, fontWeight: 700,
                  padding: "10px 18px", borderRadius: 30, border: "none",
                  cursor: locLoading ? "not-allowed" : "pointer", opacity: locLoading ? 0.75 : 1,
                  transition: "all 0.18s ease", flexShrink: 0, outline: "none",
                  fontFamily: "'Outfit', sans-serif", boxShadow: "0 4px 16px rgba(0,119,182,0.28)",
                }}
              >
                {locLoading ? (
                  <>
                    <span style={{
                      width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Detecting…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use my location
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "#dc2626",
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ flex: 1, fontWeight: 500 }}>{error}</span>
              <button onClick={handleGetLocation} style={{
                fontWeight: 700, color: "#dc2626", background: "none", border: "none",
                cursor: "pointer", fontSize: 11, flexShrink: 0, outline: "none",
              }}>Retry</button>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div style={{ display: "flex", gap, overflow: "hidden" }}>
              {Array.from({ length: visible }).map((_, i) => <SkeletonCard key={i} width={cardWidth} />)}
            </div>
          )}

          {/* ── Empty state ── */}
          {showEmpty && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>📭</div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 5px", color: "#4a7c99" }}>
                No devices found within {radius}km
              </p>
              <p style={{ fontSize: 11, margin: 0, color: "#8faab8" }}>
                Try increasing the radius or check back later
              </p>
            </div>
          )}

          {/* ── Product carousel ── */}
          {showProducts && (
            <div
              style={{ overflow: "hidden" }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div style={{
                display: "flex", gap,
                transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                transform: `translateX(-${index * (cardWidth + gap)}px)`,
              }}>
                {products.map((p, i) => (
                  <NearbyCard key={p._id ?? i} product={p} width={cardWidth} onClick={() => handleCard(p._id)} />
                ))}
              </div>

              {/* Dot indicators — mobile */}
              {products.length > visible && (
                <div className="flex justify-center gap-1.5 mt-4 sm:hidden">
                  {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      style={{
                        width: i === index ? 16 : 6, height: 6,
                        borderRadius: 99, border: "none",
                        background: i === index ? "#0077b6" : "#c7d9e8",
                        cursor: "pointer", padding: 0, transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}