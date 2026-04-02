import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../../../services/product.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatINR   = (n)    => n?.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const discountPct = (p, o) => (p && o) ? Math.round(((o - p) / o) * 100) : null;

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = memo(({ rating }) => {
  if (!rating || rating <= 0) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {[...Array(5)].map((_, i) => (
        <svg key={i}
          className={`w-3.5 h-3.5 ${i < full ? "text-yellow-400" : i === full && half ? "text-yellow-300" : "text-gray-200"}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
});
StarRating.displayName = "StarRating";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = memo(() => (
  <div className="flex-shrink-0 w-[230px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
    <div className="h-[200px] bg-gray-100" />
    <div className="p-4 space-y-2.5">
      {[2/3, 1, 3/4, 1/2, 2/3, 1/4, 1].map((w, i) => (
        <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = memo(({ product, onClick }) => {
  const savedAmount = product.originalPrice ? product.originalPrice - product.price : null;
  const pct         = discountPct(product.price, product.originalPrice);

  return (
    <article
      onClick={onClick}
      className="flex-shrink-0 w-[230px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group"
    >
      {/* Image area */}
      <div className="relative bg-white px-6 pt-5 pb-3 h-[200px] flex items-center justify-center">
        {savedAmount && (
          <div className="absolute top-0 left-0 z-10 bg-[#00b4d8ff] text-white text-[11px] font-bold px-3 py-1.5 rounded-br-xl rounded-tl-2xl leading-tight">
            ₹{formatINR(savedAmount)} OFF
          </div>
        )}
        <img
          src={product.images?.[0]}
          alt={product.title}
          width={160}
          height={165}
          className="max-h-[165px] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.src = "https://placehold.co/160x160/f9fafb/9ca3af?text=No+Image"; }}
        />
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* Details */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-0 flex-grow">
        <h3 className="text-[13.5px] font-bold text-gray-900 leading-snug line-clamp-2">
          {product.title}
        </h3>

        {product.rating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={product.rating} />
            <span className="text-[11px] font-semibold text-gray-600">{product.rating}</span>
          </div>
        )}

        {pct && <p className="text-red-500 font-bold text-sm mt-2">-{pct}%</p>}

        <p className="text-[22px] font-extrabold text-gray-900 leading-tight mt-0.5">
          ₹{formatINR(product.price)}
        </p>

        {product.originalPrice && (
          <p className="text-sm text-gray-400 line-through leading-tight mt-0.5">
            ₹{formatINR(product.originalPrice)}
          </p>
        )}

        {/* Spec chips */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {product?.specs?.performance?.ram && (
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5">
              {product.specs.performance.ram} RAM
            </span>
          )}
          {product?.storage && (
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
              {product.storage}
            </span>
          )}
          {product?.specs?.battery?.capacity && (
            <span className="text-xs font-semibold bg-green-50 text-green-600 border border-green-200 rounded px-1.5 py-0.5">
              {product.specs.battery.capacity}
            </span>
          )}
        </div>

        {product.quantity > 0 && product.quantity <= 10 && (
          <p className="text-[11.5px] text-gray-500 mt-1.5">Only {product.quantity} left</p>
        )}

        <div className="flex-grow" />

        <div className="mt-3 flex items-center gap-1.5 bg-[#fdf6e3] border border-[#f0d98a] rounded-xl px-3 py-2">
          <span className="text-[12.5px] font-bold text-[#b07d0d]">🛡 Cashify Assured</span>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium">Sold by:</span>
          <span className="text-[12px] font-extrabold text-[#00a86b]">
            {product.listedBy?.firstname} {product.listedBy?.lastname}
          </span>
        </div>

        {/* Tap hint — subtle, appears on hover */}
        <p className="text-[10px] text-[#1132d4] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Tap to view details →
        </p>
      </div>
    </article>
  );
});
ProductCard.displayName = "ProductCard";

// ─── Arrow button ─────────────────────────────────────────────────────────────
const ArrowButton = memo(({ direction, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === "prev" ? "Previous products" : "Next products"}
    className={`absolute ${direction === "prev" ? "-left-5" : "-right-5"} top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg z-20 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-xl hover:scale-105 disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200`}
  >
    {direction === "prev"
      ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
    }
  </button>
));
ArrowButton.displayName = "ArrowButton";

// ─── Main carousel ────────────────────────────────────────────────────────────
const CARD_WIDTH = 230;
const CARD_GAP   = 16;
const VISIBLE    = 5;

/**
 * @param {string} title       Section heading
 * @param {string} category    "mobile" | "laptop" | "tablet" etc.
 * @param {string} [deviceType="refurbished"]
 * @param {string} [viewAllPath="/filter-by"]
 */
const ProductCarousel = memo(({ title, category, deviceType = "refurbished", viewAllPath = "/" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllProducts({ deviceType, category, sortBy: "newest", page: 1, limit: 10 });
        if (!cancelled) setProducts(res.products ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deviceType, category]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < products.length - VISIBLE;

  const handlePrev    = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const handleNext    = useCallback(() => setCurrentIndex((i) => Math.min(products.length - VISIBLE, i + 1)), [products.length]);
  const handleViewAll = useCallback(() => navigate(viewAllPath), [navigate, viewAllPath]);

  // ── Navigate to product detail on card click ──────────────────────────────
  const handleCardClick = useCallback((productId) => {
    navigate(`/product/${productId}`);
  }, [navigate]);

  return (
    <section className="py-12 bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
          <button
            onClick={handleViewAll}
            className="text-sm font-semibold text-[#00b4d8ff] hover:underline flex items-center gap-1"
          >
            View all
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Carousel body */}
        <div className="relative px-5">
          {loading && (
            <div className="flex gap-4">
              {Array.from({ length: VISIBLE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && error && (
            <p className="text-red-500 text-sm">Failed to load products: {error}</p>
          )}

          {!loading && !error && products.length === 0 && (
            <p className="text-gray-500 text-sm">No {category} products available right now.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="overflow-hidden">
                <div
                  className="flex gap-4 transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * (CARD_WIDTH + CARD_GAP)}px)` }}
                >
                  {products.map((product, i) => (
                    <ProductCard
                      key={product._id ?? i}
                      product={product}
                      onClick={() => handleCardClick(product._id)}
                    />
                  ))}
                </div>
              </div>
              <ArrowButton direction="prev" onClick={handlePrev} disabled={!canPrev} />
              <ArrowButton direction="next" onClick={handleNext} disabled={!canNext} />
            </>
          )}
        </div>
      </div>
    </section>
  );
});
ProductCarousel.displayName = "ProductCarousel";

export default ProductCarousel;