import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../../../services/product.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "../../../hooks/useProducts.query";

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
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < full ? "text-yellow-400" : i === full && half ? "text-yellow-300" : "text-gray-200"}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
});
StarRating.displayName = "StarRating";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = memo(({ width }) => (
  <div
    className="flex-shrink-0 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse"
    style={{ width }}
  >
    <div className="h-[160px] sm:h-[200px] bg-gray-100" />
    <div className="p-3 sm:p-4 space-y-2">
      {[2/3, 1, 3/4, 1/2, 2/3].map((w, i) => (
        <div key={i} className="h-2.5 sm:h-3 bg-gray-100 rounded" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = memo(({ product, onClick, width }) => {
  const savedAmount = product.originalPrice ? product.originalPrice - product.price : null;
  const pct         = discountPct(product.price, product.originalPrice);

  return (
    <article
      onClick={onClick}
      style={{ width, flexShrink: 0 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group"
    >
      {/* Image area */}
      <div className="relative bg-white px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 h-[160px] sm:h-[200px] flex items-center justify-center">
        {savedAmount && (
          <div className="absolute top-0 left-0 z-10 bg-[#00b4d8ff] text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-br-xl rounded-tl-2xl leading-tight">
            ₹{formatINR(savedAmount)} OFF
          </div>
        )}
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="max-h-[130px] sm:max-h-[165px] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.src = "https://placehold.co/160x160/f9fafb/9ca3af?text=No+Image"; }}
        />
      </div>

      <div className="h-px bg-gray-100 mx-3 sm:mx-4" />

      {/* Details */}
      <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-3 sm:pb-4 flex flex-col gap-0 flex-grow">
        <h3 className="text-[12px] sm:text-[13.5px] font-bold text-gray-900 leading-snug line-clamp-2">
          {product.title}
        </h3>

        {product.rating > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <StarRating rating={product.rating} />
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600">{product.rating}</span>
          </div>
        )}

        {pct && <p className="text-red-500 font-bold text-xs sm:text-sm mt-1.5 sm:mt-2">-{pct}%</p>}

        <p className="text-[18px] sm:text-[22px] font-extrabold text-gray-900 leading-tight mt-0.5">
          ₹{formatINR(product.price)}
        </p>

        {product.originalPrice && (
          <p className="text-xs sm:text-sm text-gray-400 line-through leading-tight mt-0.5">
            ₹{formatINR(product.originalPrice)}
          </p>
        )}

        {/* Spec chips */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {product?.specs?.performance?.ram && (
            <span className="text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5">
              {product.specs.performance.ram} RAM
            </span>
          )}
          {product?.storage && (
            <span className="text-[10px] sm:text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">
              {product.storage}
            </span>
          )}
          {product?.specs?.battery?.capacity && (
            <span className="text-[10px] sm:text-xs font-semibold bg-green-50 text-green-600 border border-green-200 rounded px-1.5 py-0.5">
              {product.specs.battery.capacity}
            </span>
          )}
        </div>

        {product.quantity > 0 && product.quantity <= 10 && (
          <p className="text-[10px] sm:text-[11.5px] text-gray-500 mt-1">Only {product.quantity} left</p>
        )}

        <div className="flex-grow" />

        <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-1.5 bg-[#fdf6e3] border border-[#f0d98a] rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
          <span className="text-[11px] sm:text-[12.5px] font-bold text-[#b07d0d]">🛡 Cashify Assured</span>
        </div>

        <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5">
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Sold by:</span>
          <span className="text-[11px] sm:text-[12px] font-extrabold text-[#00a86b] truncate">
            {product.listedBy?.firstname} {product.listedBy?.lastname}
          </span>
        </div>

        <p className="text-[10px] text-[#1132d4] font-semibold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
    className={`absolute ${direction === "prev" ? "-left-3 sm:-left-5" : "-right-3 sm:-right-5"} top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 shadow-lg z-20 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:shadow-xl hover:scale-105 disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200`}
  >
    {direction === "prev"
      ? <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      : <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
    }
  </button>
));
ArrowButton.displayName = "ArrowButton";

// ─── Hook: responsive card width & visible count ──────────────────────────────
function useCarouselConfig() {
  const [config, setConfig] = useState({ cardWidth: 200, gap: 12, visible: 2 });

  useEffect(() => {
    function compute() {
      const w = window.innerWidth;
      if (w < 480)      setConfig({ cardWidth: 170, gap: 10, visible: 2 });
      else if (w < 640) setConfig({ cardWidth: 190, gap: 12, visible: 2 });
      else if (w < 768) setConfig({ cardWidth: 210, gap: 14, visible: 3 });
      else if (w < 1024) setConfig({ cardWidth: 210, gap: 14, visible: 3 });
      else if (w < 1280) setConfig({ cardWidth: 220, gap: 16, visible: 4 });
      else               setConfig({ cardWidth: 230, gap: 16, visible: 5 });
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return config;
}

// ─── Main carousel ────────────────────────────────────────────────────────────
const ProductCarousel = memo(({ title, category, deviceType = "refurbished", viewAllPath = "/" }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { cardWidth, gap, visible } = useCarouselConfig();
  const [currentIndex, setCurrentIndex] = useState(0);

  const filters = { deviceType, category, sortBy: "newest", page: 1, limit: 10 };

  // ── React Query — auto cache, no manual loading state ─────────
  const { data: products = [], isLoading } = useQuery({
    queryKey: productKeys.list(filters),
    queryFn:  () => getAllProducts(filters),
    select:   (d) => d.products ?? [],
    staleTime: 1000 * 60 * 5,   // 5 min cache
  });

  // ── Prefetch product detail on hover ──────────────────────────
  const handleCardHover = useCallback((productId) => {
    qc.prefetchQuery({
      queryKey: productKeys.detail(productId),
      queryFn:  () => getProductById(productId),
      staleTime: 1000 * 60 * 3,
    });
  }, [qc]);

  const handleCardClick = useCallback((productId) => navigate(`/product/${productId}`), [navigate]);

  // Touch swipe
  const touchStartX = useRef(null);
  const touchEndX   = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => { touchEndX.current   = e.touches[0].clientX; };
  const onTouchEnd   = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const maxIndex = Math.max(0, products.length - visible);
    if (Math.abs(diff) > 40) {
      if (diff > 0) setCurrentIndex(i => Math.min(maxIndex, i + 1));
      if (diff < 0) setCurrentIndex(i => Math.max(0, i - 1));
    }
    touchStartX.current = null;
    touchEndX.current   = null;
  };

  const maxIndex = Math.max(0, products.length - visible);

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between mb-5 sm:mb-7">
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900">{title}</h2>
          <button onClick={() => navigate(viewAllPath)}
            className="text-xs sm:text-sm font-semibold text-[#00b4d8ff] hover:underline flex items-center gap-1">
            View all
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="relative px-3 sm:px-5">
          {isLoading && (
            <div className="flex gap-3 sm:gap-4">
              {Array.from({ length: visible }).map((_, i) => <SkeletonCard key={i} width={cardWidth} />)}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <p className="text-gray-500 text-sm">No {category} products available.</p>
          )}

          {!isLoading && products.length > 0 && (
            <>
              <div className="overflow-hidden"
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <div className="flex transition-transform duration-500 ease-in-out"
                  style={{ gap: `${gap}px`, transform: `translateX(-${currentIndex * (cardWidth + gap)}px)` }}>
                  {products.map((product, i) => (
                    <ProductCard
                      key={product._id ?? i}
                      product={product}
                      width={cardWidth}
                      onClick={() => handleCardClick(product._id)}
                      onMouseEnter={() => handleCardHover(product._id)}  // ← prefetch on hover
                    />
                  ))}
                </div>
              </div>
              <ArrowButton direction="prev" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} />
              <ArrowButton direction="next" onClick={() => setCurrentIndex(i => Math.min(maxIndex, i + 1))} disabled={currentIndex >= maxIndex} />
            </>
          )}
        </div>
      </div>
    </section>
  );
});

ProductCarousel.displayName = "ProductCarousel";

export default ProductCarousel;