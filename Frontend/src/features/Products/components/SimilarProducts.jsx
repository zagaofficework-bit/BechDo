
import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const conditionColors = {
  Superb: "bg-emerald-50 text-emerald-700",
  Good:   "bg-blue-50 text-blue-700",
  Fair:   "bg-amber-50 text-amber-700",
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-4/5" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function SimilarProducts({ brand, price, currentId }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!brand) { setLoading(false); return; }
    let cancelled = false;
    const params = new URLSearchParams({
      brand,
      maxPrice: Math.round(price * 1.3),
      limit:    8,
      sortBy:   "newest",
    });
    fetch(`${BASE}/products?${params}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled)
          setItems((d.products ?? []).filter(p => p._id !== currentId));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [brand, price, currentId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            Similar Products
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Same brand · Similar price range</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
            : items.map(p => {
                const disc = p.originalPrice
                  ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                  : null;
                return (
                  <article
                    key={p._id}
                    onClick={() => navigate(`/product/${p._id}`)}
                    className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm
                      hover:shadow-[0_8px_28px_rgba(17,50,212,0.10)] hover:border-[#1132d4]/20
                      hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-slate-50 to-blue-50/20 flex items-center justify-center overflow-hidden">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { e.target.src = "https://placehold.co/200x160/f8fafc/94a3b8?text=📱"; }} />
                        : <span className="text-4xl opacity-20">📱</span>}
                      {disc > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                          -{disc}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-black text-[#1132d4] uppercase tracking-widest truncate">{p.brand}</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mt-0.5">{p.title}</p>
                      {p.condition && (
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                          conditionColors[p.condition] || "bg-slate-100 text-slate-500"
                        }`}>{p.condition}</span>
                      )}
                      <div className="flex items-end gap-1.5 mt-2">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{p.price?.toLocaleString("en-IN")}
                        </span>
                        {p.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{p.originalPrice?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}