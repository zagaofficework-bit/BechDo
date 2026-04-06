//sell card

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../common/BackButton";

const VISIBLE_COUNT = 6;

export default function SellCard({
  brands = [],
  brandLogos = {},
  brandsLoading = false,
  brandsError = null,
  title,
  onBrandClick,
}) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const visibleBrands = showAll ? brands : brands.slice(0, VISIBLE_COUNT);
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .sell-h1, .sell-price-val { font-family: 'Syne', sans-serif; }
        .sell-body * { font-family: 'DM Sans', sans-serif; }

        .sell-grid-bg {
          background-image:
            linear-gradient(rgba(0,180,216,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,180,216,0.07) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @keyframes orb-drift {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(24px) scale(1.06); }
        }
        .orb-animate       { animation: orb-drift 8s ease-in-out infinite alternate; }
        .orb-animate-delay { animation: orb-drift 8s ease-in-out infinite alternate; animation-delay: -3s; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        .dot-pulse { animation: pulse-dot 2s ease-in-out infinite; }

        @keyframes ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .ring-spin-slow    { animation: ring-spin 20s linear infinite; }
        .ring-spin-reverse { animation: ring-spin 14s linear infinite reverse; }

        @keyframes float-chip {
          from { transform: translateY(0); }
          to   { transform: translateY(-10px); }
        }
        .float-1 { animation: float-chip 4s ease-in-out infinite alternate; }
        .float-2 { animation: float-chip 4s ease-in-out infinite alternate; animation-delay: -2s; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #f0f9fc 25%, #e0f4f8 50%, #f0f9fc 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        .brand-card:hover {
          border-color: #00b4d8 !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,180,216,0.15);
        }
        .search-wrap:focus-within {
          border-color: #00b4d8 !important;
          box-shadow: 0 0 0 4px rgba(0,180,216,0.12), 0 4px 24px rgba(0,119,182,0.1);
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .sell-inner-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
            padding: 20px 16px 32px !important;
          }
          .sell-h1 {
            font-size: clamp(1.6rem, 7vw, 2.4rem) !important;
          }
          .sell-search-btn {
            padding: 10px 14px !important;
            font-size: 12px !important;
          }
          .sell-feature-badges {
            gap: 8px !important;
          }
          .sell-feature-badge {
            padding: 8px 10px !important;
            font-size: 12px !important;
          }
          .sell-brands-grid {
            gap: 8px !important;
          }
          .brand-card {
            width: 72px !important;
            padding: 10px 6px 8px !important;
          }
          .brand-card img {
            width: 30px !important;
            height: 30px !important;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .sell-inner-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            padding: 32px 28px 40px !important;
          }
          .sell-right-panel { display: none !important; }
          .sell-h1 {
            font-size: clamp(1.9rem, 4vw, 2.8rem) !important;
          }
        }
      `}</style>

      <section className="sell-body relative bg-[#f8feff] overflow-hidden">
        {/* Grid bg */}
        <div className="sell-grid-bg absolute inset-0 pointer-events-none" />

        {/* Orb 1 */}
        <div
          className="orb-animate absolute -top-20 right-[10%] w-[360px] h-[360px] rounded-full blur-[60px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,180,216,0.18), transparent 70%)",
          }}
        />
        {/* Orb 2 */}
        <div
          className="orb-animate-delay absolute -bottom-16 left-[5%] w-[280px] h-[280px] rounded-full blur-[60px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,119,182,0.13), transparent 70%)",
          }}
        />

        {/* Inner grid */}
        <div className="sell-inner-grid relative max-w-7xl mx-auto px-6 md:px-16 py-16 grid md:grid-cols-2 gap-12 items-center">
          {/* ── LEFT ── */}
          <div className="flex flex-col gap-5">
            {/* Live badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <BackButton />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.06em] uppercase border border-[rgba(0,180,216,0.3)] bg-[rgba(0,180,216,0.1)] text-[#0077b6]">
                <span className="dot-pulse inline-block w-1.5 h-1.5 rounded-full bg-[#00b4d8]" />
                Instant quotes · No haggling
              </span>
            </div>

            {/* Heading */}
            <h1 className="sell-h1 m-0 font-extrabold leading-[1.1] tracking-[-0.02em] text-[clamp(2rem,4vw,3.25rem)] text-[#0077b6]">
              Sell Your Old Phone.
              <br />
              <span className="bg-gradient-to-r from-[#0077b6] to-[#00b4d8] bg-clip-text text-transparent">
                Get Paid Today.
              </span>
            </h1>

            {/* Feature badges */}
            <div className="sell-feature-badges flex flex-wrap gap-2.5">
              {[
                { icon: "💰", label: "Maximum Value" },
                { icon: "🛡️", label: "Safe & Hassle-free" },
                { icon: "🚚", label: "Free Doorstep Pickup" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="sell-feature-badge flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,180,216,0.2)] rounded-xl text-[13px] font-medium text-[#03045e] shadow-[0_2px_8px_rgba(0,119,182,0.06)]"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0 bg-gradient-to-br from-[#00b4d8] to-[#0077b6]">
                    {f.icon}
                  </div>
                  {f.label}
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="search-wrap flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-white border-[1.5px] border-[rgba(0,180,216,0.25)] rounded-[18px] shadow-[0_4px_24px_rgba(0,119,182,0.08)] transition-all duration-200">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search model, e.g. iPhone 14…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 border-none outline-none text-sm text-[#03045e] bg-transparent placeholder-[#94a3b8] py-2.5 font-[inherit]"
              />
              <button
                onClick={() => {
                  if (query.trim())
                    navigate(
                      `/sell?search=${encodeURIComponent(query.trim())}`,
                    );
                }}
                className="sell-search-btn bg-gradient-to-br from-[#03045e] to-[#0077b6] text-white rounded-xl px-5 py-2.5 text-[13px] font-semibold cursor-pointer whitespace-nowrap tracking-[0.01em] transition-all duration-150 hover:opacity-90 border-none shrink-0"
              >
                Check Price →
              </button>
            </div>

            {/* Brands */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8] mb-3 m-0">
                Popular Brands
              </p>

              {brandsLoading && (
                <div className="sell-brands-grid flex flex-wrap gap-2.5">
                  {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                    <div
                      key={i}
                      className="shimmer w-20 h-[90px] rounded-2xl"
                    />
                  ))}
                </div>
              )}

              {!brandsLoading && brandsError && (
                <p className="text-[13px] text-red-500 m-0">
                  Could not load brands. Please try again.
                </p>
              )}

              {!brandsLoading && !brandsError && (
                <div className="sell-brands-grid flex flex-wrap gap-2.5">
                  {visibleBrands.map((brand) => {
                    const logo = brandLogos[brand];
                    return logo ? (
                      <button
                        key={brand}
                        onClick={() => onBrandClick?.(brand)}
                        title={brand}
                        className="brand-card flex flex-col items-center gap-1.5 w-20 pt-3 pb-2.5 px-2.5 bg-white border-[1.5px] border-[#e8f4f8] rounded-2xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,119,182,0.05)]"
                      >
                        <img
                          src={logo}
                          alt={brand}
                          className="w-10 h-8 sm:w-12 sm:h-9 md:w-14 md:h-10 object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                        <span className="text-[11px] font-semibold text-[#03045e] text-center leading-tight">
                          {brand}
                        </span>
                      </button>
                    ) : (
                      <button
                        key={brand}
                        onClick={() => onBrandClick?.(brand)}
                        className="px-4 py-1.5 rounded-full bg-white border-[1.5px] border-[#e2e8f0] text-[13px] font-semibold text-[#03045e] cursor-pointer transition-all duration-200 hover:bg-[#03045e] hover:border-[#03045e] hover:text-white"
                      >
                        {brand}
                      </button>
                    );
                  })}

                  {brands.length > VISIBLE_COUNT && (
                    <button
                      onClick={() => setShowAll((v) => !v)}
                      className="flex flex-col items-center justify-center gap-1 w-20 pt-3 pb-2.5 px-2.5 rounded-2xl bg-transparent border-[1.5px] border-dashed border-[#00b4d8] text-[11px] font-bold text-[#0077b6] cursor-pointer transition-all duration-200 hover:bg-[#caf0f8]"
                    >
                      <span className="text-lg leading-none">
                        {showAll ? "↑" : "+"}
                      </span>
                      <span>
                        {showAll
                          ? "Less"
                          : `${brands.length - VISIBLE_COUNT} more`}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT (hidden on mobile/tablet) ── */}
          <div className="sell-right-panel relative hidden md:flex justify-center items-center">
            <div className="ring-spin-slow absolute w-[380px] h-[380px] rounded-full border border-[rgba(0,180,216,0.15)] pointer-events-none" />
            <div className="ring-spin-reverse absolute w-[290px] h-[290px] rounded-full border border-dashed border-[rgba(0,119,182,0.2)] pointer-events-none" />

            <div className="float-1 absolute top-[6%] -left-[4%] z-10 flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] whitespace-nowrap">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-sm bg-[rgba(0,180,216,0.1)]">
                ⚡
              </div>
              <div>
                <div className="text-[10px] font-medium text-[#94a3b8] leading-none mb-0.5">
                  Avg. payout time
                </div>
                <div className="text-[13px] font-bold text-[#03045e]">
                  2 Hours
                </div>
              </div>
            </div>

            <div className="float-2 absolute bottom-[8%] -right-[2%] z-10 flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] whitespace-nowrap">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-sm bg-[rgba(3,4,94,0.07)]">
                📦
              </div>
              <div>
                <div className="text-[10px] font-medium text-[#94a3b8] leading-none mb-0.5">
                  Orders completed
                </div>
                <div className="text-[13px] font-bold text-[#03045e]">
                  1.2M+
                </div>
              </div>
            </div>

            <div className="phone-card">
              <img
                src="/images/Phonify-banner.png"
                alt="Sell your phone"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                style={{
                  display: "none",
                  width: 160,
                  height: 200,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <svg width="80" height="120" viewBox="0 0 80 120" fill="none">
                  <rect
                    x="8"
                    y="2"
                    width="64"
                    height="116"
                    rx="14"
                    fill="#e8f4f8"
                    stroke="#00b4d8"
                    strokeWidth="2"
                  />
                  <rect
                    x="18"
                    y="14"
                    width="44"
                    height="72"
                    rx="4"
                    fill="white"
                  />
                  <circle cx="40" cy="104" r="5" fill="#5ab3d8" />
                </svg>
              </div>
              <div className="w-full rounded-xl px-4 py-2.5 text-center bg-gradient-to-br from-[#03045e] to-[#0077b6] text-white">
                <div className="text-[10px] opacity-75 tracking-[0.05em] uppercase font-medium">
                  Estimated value
                </div>
                <div className="sell-price-val text-[22px] font-extrabold tracking-[-0.01em]">
                  Up to ₹18,000
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
