import { useState, useEffect } from "react";
import { getAllProducts } from "../../../services/product.api";

const extractNum = (str) => {
  if (!str) return 0;
  const m = str.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
};

const conditionStyle = {
  Superb: { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  Good: { bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  Fair: { bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
};

// Three distinct slot accent palettes — all rooted in #0077b6 family + complementary
const slotAccent = [
  {
    bar: "#0077b6",
    text: "#0077b6",
    bg: "#e8f4fd",
    border: "#90caf9",
    score: "#0077b6",
    scoreText: "#fff",
  },
  {
    bar: "#005a8e",
    text: "#005a8e",
    bg: "#cce4f6",
    border: "#64b0e0",
    score: "#005a8e",
    scoreText: "#fff",
  },
  {
    bar: "#00b4d8",
    text: "#0096c7",
    bg: "#e0f7fb",
    border: "#80deea",
    score: "#00b4d8",
    scoreText: "#fff",
  },
];

const MAX = 3;

function SpecBlock({ values, subValues, accentTexts }) {
  const hasValue = values.some((v) => v != null && v !== "");
  if (!hasValue) return null;
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}
    >
      {Array.from({ length: MAX }).map((_, i) => {
        const val = values[i];
        const sub = subValues?.[i];
        return (
          <div
            key={i}
            style={{
              padding: "14px 20px",
              borderRight: i < MAX - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            {val != null && val !== "" ? (
              <>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {val}
                </p>
                {sub && (
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 3,
                      fontWeight: 600,
                      color: accentTexts[i],
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {sub}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500 }}>
                —
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SpecCard({ label, values, subValues, showBars = true }) {
  const activeBars = values.map((_, i) => slotAccent[i]?.bar ?? "#cbd5e1");
  const activeTexts = values.map((_, i) => slotAccent[i]?.text ?? "#94a3b8");
  const hasAny = values.some((v) => v != null && v !== "");
  if (!hasAny) return null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e8f0f7",
        overflow: "hidden",
        marginBottom: 10,
        boxShadow: "0 1px 4px rgba(0,119,182,0.05)",
      }}
    >
      {/* Label strip */}
      <div
        style={{
          padding: "7px 20px",
          background: "#f8fbff",
          borderBottom: "1px solid #e8f0f7",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: "#0077b6",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            margin: 0,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {label}
        </p>
      </div>

      <SpecBlock
        values={values}
        subValues={subValues}
        accentTexts={activeTexts}
      />

      {showBars && (
        <div style={{ padding: "0 20px 12px" }}>
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)`, gap: 10 }}
          >
            {values.map((val, i) => {
              const pct =
                val != null && val !== ""
                  ? Math.min(
                      Math.round(
                        (extractNum(val) /
                          Math.max(...values.map(extractNum), 1)) *
                          100,
                      ),
                      100,
                    )
                  : 0;
              return (
                <div
                  key={i}
                  style={{
                    height: 5,
                    background: "#f1f5f9",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: activeBars[i],
                      borderRadius: 99,
                      transition: "width 0.7s ease",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label, faIcon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "28px 0 12px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "#e8f4fd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <i className={faIcon} style={{ fontSize: 13, color: "#0077b6" }} />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#0077b6",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(to right, #cce4f6, transparent)",
        }}
      />
    </div>
  );
}

export default function CompareDevices({ initialProduct }) {
  const [search, setSearch] = useState("");
  const [addingSlot, setAddingSlot] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState(Array(MAX).fill(null));

  useEffect(() => {
  if (!initialProduct) return;

  const formatted = {
    _id: initialProduct._id,
    title: initialProduct.title,
    brand: initialProduct.brand,
    condition: initialProduct.condition || "Good",
    storage: initialProduct.storage,
    color: initialProduct.color,
    price: initialProduct.price,
    score: initialProduct.score || 8,
    images: initialProduct.images || [],
    specs: initialProduct.specs || {},
  };

  // ✅ ONLY set slot 1
  setSelected((prev) => {
    const updated = [...Array(MAX).fill(null)];
    updated[0] = formatted;
    return updated;
  });

}, [initialProduct]);

  // ✅ Fetch products from backend
  useEffect(() => {
  const fetchDevices = async () => {
    try {
      const res = await getAllProducts();
      
      const products = Array.isArray(res)
        ? res
        : Array.isArray(res.products)
        ? res.products
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (!Array.isArray(products)) {
        console.error("Products is not an array:", products);
        return;
      }

      const formatted = products.map((p) => ({
        _id: p._id,
        title: p.title,
        brand: p.brand,
        condition: p.condition || "Good",
        storage: p.storage,
        color: p.color,
        price: p.price,
        score: p.score || 8,
        images: p.images || [],
        specs: p.specs || {},
      }));

      setDevices(formatted);

    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  fetchDevices();
}, []);

  const filteredDevices = devices.filter(
    (d) =>
      !selected.find((s) => s?._id === d._id) &&
      (d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.brand.toLowerCase().includes(search.toLowerCase())),
  );

  const addDevice = (device) => {
    if (addingSlot !== null) {
      const updated = [...selected];
      updated[addingSlot] = device;
      setSelected(updated);
    } else if (selected.length < MAX) {
      setSelected([...selected, device]);
    }

    setAddingSlot(null);
    setSearch("");
  };

  const removeDevice = (idx) =>
    setSelected(selected.filter((_, i) => i !== idx));

  const g = (device, path) =>
    path.reduce((o, k) => o?.[k] ?? null, device ?? {});
  const v = (path) =>
    Array.from({ length: MAX }).map((_, i) =>
      selected[i] ? g(selected[i], path) : null,
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');
        * { box-sizing: border-box; }
        .cd-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        .cd-device-card:hover { box-shadow: 0 8px 32px rgba(0,119,182,0.12) !important; transform: translateY(-2px); }
        .cd-search-result:hover { background: #e8f4fd !important; border-color: #0077b6 !important; }
        .cd-add-btn:hover .cd-add-icon { border-color: #0077b6 !important; background: #e8f4fd !important; color: #0077b6 !important; }
        .cd-toggle { transition: background 0.2s; }
        .cd-score-ring { animation: ringIn 0.5s ease both; }
        @keyframes ringIn { from{transform:scale(0.6);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>

      <div
        className="cd-root"
        style={{ minHeight: "100vh", background: "#f0f6fb" }}
      >
        <div
          style={{ maxWidth: 900, margin: "0 auto", padding: "36px 20px 60px" }}
        >
          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 28,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#0077b6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-scale-balanced"
                    style={{ fontSize: 15, color: "#fff" }}
                  />
                </div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0a1929",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Compare Devices
                </h1>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  margin: "0 0 0 46px",
                  fontWeight: 500,
                }}
              >
                Side-by-side specs · up to 3 devices
              </p>
            </div>
          </div>

          {/* ── Device header cards ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #e8f0f7",
              boxShadow: "0 2px 16px rgba(0,119,182,0.07)",
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {/* Top accent bar per slot */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${MAX}, 1fr)`,
              }}
            >
              {Array.from({ length: MAX }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    height: 4,
                    background: selected?.[idx]
                      ? slotAccent?.[idx]?.bar || "#0077b6"
                      : "#e8f0f7",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${MAX}, 1fr)`,
              }}
            >
              {Array.from({ length: MAX }).map((_, idx) => {
                const device = selected?.[idx];
                const accent = slotAccent[idx];
                return (
                  <div
                    key={idx}
                    className="cd-device-card"
                    style={{
                      position: "relative",
                      borderRight: idx < MAX - 1 ? "1px solid #f1f5f9" : "none",
                      padding: "20px 18px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      background: device ? "#fff" : "#fafcff",
                      transition: "all 0.22s ease",
                      minHeight: 220,
                    }}
                  >
                    {device ? (
                      <>
                        {/* Score badge */}
                        <div
                          className="cd-score-ring"
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 14,
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: accent.score,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 3px 10px ${accent.bar}55`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#fff",
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            {device.score}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeDevice(idx)}
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: "#f8fafc",
                            border: "1px solid #e8eef4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#94a3b8",
                            fontSize: 11,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                            e.currentTarget.style.color = "#ef4444";
                            e.currentTarget.style.borderColor = "#fca5a5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.color = "#94a3b8";
                            e.currentTarget.style.borderColor = "#e8eef4";
                          }}
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>

                        {/* Image */}
                        <div
                          style={{
                            width: 72,
                            height: 88,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 20,
                            marginBottom: 10,
                            background: accent.bg,
                            borderRadius: 14,
                            padding: 8,
                          }}
                        >
                          <img
                            src={device.images?.[0] || "/placeholder.png"}
                            alt={device?.title}
                            style={{
                              height: 68,
                              width: "auto",
                              objectFit: "contain",
                            }}
                          />
                        </div>

                        {/* Brand */}
                        <p
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: accent.text,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            margin: "0 0 3px",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {device.brand}
                        </p>

                        {/* Title */}
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0a1929",
                            lineHeight: 1.35,
                            margin: "0 0 8px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {device.title}
                        </p>

                        {/* Price */}
                        <button
                          onClick={() => {
                            setAddingSlot(idx);
                            setSearch("");
                          }}
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#fff",
                            background: accent.bar,
                            border: "none",
                            borderRadius: 8,
                            padding: "5px 12px",
                            cursor: "pointer",
                            marginBottom: 10,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            boxShadow: `0 2px 8px ${accent.bar}44`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.85";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                        >
                          ₹{device.price.toLocaleString()}
                        </button>

                        {/* Badges */}
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {(() => {
                            const cs = conditionStyle[device.condition];
                            return (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  background: cs.bg,
                                  color: cs.text,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <span
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: cs.dot,
                                    display: "inline-block",
                                  }}
                                />
                                {device.condition}
                              </span>
                            );
                          })()}
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: "#f1f5f9",
                              color: "#64748b",
                            }}
                          >
                            {device.storage}
                          </span>
                        </div>
                      </>
                    ) : (
                      <button
                        className="cd-add-btn"
                        onClick={() => {
                          setAddingSlot(idx);
                          setSearch("");
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          minHeight: 200,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="cd-add-icon"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            border: "2px dashed #cbd5e1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: 16,
                            transition: "all 0.18s",
                          }}
                        >
                          <i className="fa-solid fa-plus" />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#94a3b8",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          Add device
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Search picker ── */}
          {addingSlot !== null && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #cce4f6",
                borderRadius: 18,
                boxShadow: "0 8px 32px rgba(0,119,182,0.14)",
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <i
                    className="fa-solid fa-magnifying-glass"
                    style={{ color: "#0077b6", fontSize: 14 }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0a1929",
                      margin: 0,
                    }}
                  >
                    Select device for slot {addingSlot + 1}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAddingSlot(null);
                    setSearch("");
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#f1f5f9",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    fontSize: 12,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#64748b";
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Search input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "10px 14px",
                  background: "#f8fbff",
                  marginBottom: 14,
                  transition: "all 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0077b6";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(0,119,182,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ color: "#94a3b8", fontSize: 13, marginRight: 10 }}
                />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or brand..."
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "#0a1929",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 10,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {filteredDevices.map((d) => (
                  <button
                    key={d._id}
                    className="cd-search-result"
                    onClick={() => addDevice(d)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      background: "#f8fbff",
                      border: "1.5px solid #e8f0f7",
                      borderRadius: 14,
                      padding: "12px 10px",
                      cursor: "pointer",
                      transition: "all 0.18s",
                    }}
                  >
                    <img
                      src={d?.images?.[0] || "/placeholder.png"}
                      alt={d?.title}
                      style={{
                        height: 52,
                        objectFit: "contain",
                        marginBottom: 8,
                        transition: "transform 0.2s",
                      }}
                    />
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#0a1929",
                        margin: "0 0 3px",
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {d.title}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#0077b6",
                        margin: 0,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      ₹{d.price.toLocaleString()}
                    </p>
                  </button>
                ))}
                {filteredDevices.length === 0 && (
                  <p
                    style={{
                      gridColumn: "1/-1",
                      textAlign: "center",
                      fontSize: 13,
                      color: "#94a3b8",
                      padding: "24px 0",
                    }}
                  >
                    <i
                      className="fa-solid fa-face-meh"
                      style={{
                        display: "block",
                        fontSize: 24,
                        marginBottom: 8,
                        opacity: 0.4,
                      }}
                    />
                    No devices found
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Spec sections ── */}
          {selected.length > 0 && (
            <>
              <SectionLabel
                label="Performance"
                faIcon="fa-solid fa-microchip"
              />
              <SpecCard
                label="Chipset"
                values={v(["specs", "performance", "chipsetFull"])}
                subValues={v(["specs", "performance", "chipsetSub"])}
                showBars={false}
              />
              <SpecCard
                label="RAM"
                values={v(["specs", "performance", "ram"])}
                subValues={v(["specs", "performance", "ramSub"])}
              />

              <SectionLabel label="Display" faIcon="fa-solid fa-display" />
              <SpecCard
                label="Screen Size"
                values={v(["specs", "display", "sizeInches"])}
                subValues={v(["specs", "display", "sizeSub"])}
              />
              <SpecCard
                label="Panel Type"
                values={v(["specs", "display", "type"])}
                showBars={false}
              />
              <SpecCard
                label="Refresh Rate"
                values={v(["specs", "display", "refreshRate"])}
                subValues={v(["specs", "display", "refreshSub"])}
              />

              <SectionLabel label="Rear Camera" faIcon="fa-solid fa-camera" />
              <SpecCard
                label="Primary"
                values={v(["specs", "rearCamera", "primary"])}
                subValues={v(["specs", "rearCamera", "primarySub"])}
              />
              <SpecCard
                label="Secondary"
                values={v(["specs", "rearCamera", "secondary"])}
              />
              <SpecCard
                label="Tertiary"
                values={v(["specs", "rearCamera", "tertiary"])}
              />
              <SpecCard
                label="Quaternary"
                values={v(["specs", "rearCamera", "quaternary"])}
              />

              <SectionLabel
                label="Front Camera"
                faIcon="fa-solid fa-camera-rotate"
              />
              <SpecCard
                label="Front Camera"
                values={v(["specs", "frontCamera"])}
                subValues={Array.from({ length: MAX }).map(
                  (_, i) => selected[i]?.specs?.frontCameraSub ?? null,
                )}
              />

              <SectionLabel label="Battery" faIcon="fa-solid fa-battery-full" />
              <SpecCard
                label="Capacity"
                values={v(["specs", "battery", "capacity"])}
              />
              <SpecCard
                label="Charging"
                values={v(["specs", "battery", "wiredCharging"])}
                subValues={v(["specs", "battery", "wiredSub"])}
              />

              <SectionLabel label="Storage" faIcon="fa-solid fa-hard-drive" />
              <SpecCard
                label="Storage Type"
                values={v(["specs", "storageType"])}
                subValues={v(["specs", "storageSub"])}
                showBars={false}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}