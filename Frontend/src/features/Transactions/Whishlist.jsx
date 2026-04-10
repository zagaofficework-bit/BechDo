
import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import { useAuth }             from "../../hooks/useAuth";
import {
  getWishlist, removeFromWishlist,
  addToCart, checkCart,clearWishlist,
} from "../../services/shop.api";
import LazyImage from "../../components/LazyImage";

// ─── icon helper ─────────────────────────────────────────────────────────────
const Ic = ({ d, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const I = {
  heart:  "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  cart:   "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  trash:  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  bolt:   "M13 10V3L4 14h7v7l9-11h-7z",
  arrow:  "M10 19l-7-7m0 0l7-7m-7 7h18",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  star:   "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  eye:    "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
};

const conditionColors = {
  Superb: "bg-emerald-50 text-emerald-700",
  Good:   "bg-blue-50 text-blue-700",
  Fair:   "bg-amber-50 text-amber-700",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold
      animate-[slideUp_0.3s_ease] ${type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
      {msg}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-52 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="h-10 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function WishlistCard({ product, onRemove, onCartChange, navigate }) {
  const [cartState, setCartState] = useState("idle"); // idle | loading | added
  const [removing,  setRemoving]  = useState(false);

  useEffect(() => {
    checkCart(product._id).then(r => { if (r.isInCart) setCartState("added"); }).catch(() => {});
  }, [product._id]);

  const handleCart = async (e) => {
    e.stopPropagation();
    if (cartState === "added") { navigate("/cart"); return; }
    setCartState("loading");
    try {
      await addToCart(product._id);
      setCartState("added");
      onCartChange?.();
    } catch { setCartState("idle"); }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      await removeFromWishlist(product._id);
      onRemove(product._id);
    } catch { setRemoving(false); }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-[0_8px_32px_rgba(17,50,212,0.08)] hover:border-[#1132d4]/20 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 flex items-center justify-center h-52">
        {/* Assured badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white border border-[#1132d4]/10 rounded-lg px-2 py-1 shadow-sm">
          <div className="w-4 h-4 rounded-full bg-[#1132d4] flex items-center justify-center flex-shrink-0">
            <Ic d={I.shield} className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[9px] font-black text-slate-700 uppercase tracking-wide">Assured</span>
        </div>

        {/* Remove from wishlist */}
        <button onClick={handleRemove} disabled={removing}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all z-10"
          title="Remove from wishlist">
          {removing
            ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-red-400 rounded-full animate-spin" />
            : <Ic d={I.trash} className="w-3.5 h-3.5" />}
        </button>

        {product.images?.[0]
          ? <LazyImage src={product.images[0]} alt={product.title} className="h-36 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-5xl opacity-20">📱</span>}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Brand + condition */}
        <div className="flex items-center gap-2 flex-wrap">
          {product.brand && (
            <span className="text-[10px] font-black text-[#1132d4] uppercase tracking-widest">{product.brand}</span>
          )}
          {product.condition && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${conditionColors[product.condition] || "bg-slate-100 text-slate-500"}`}>
              {product.condition}
            </span>
          )}
        </div>

        <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{product.title}</p>

        {/* Rating placeholder */}
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-3 h-3 ${s <= 4 ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-slate-400">Free Delivery</span>
        </div>

        {/* Price */}
        <div className="flex items-end gap-2 flex-wrap mt-auto">
          <span className="text-lg font-extrabold text-slate-900">₹{product.price?.toLocaleString("en-IN")}</span>
          {product.originalPrice && (
            <span className="text-sm text-slate-400 line-through">₹{product.originalPrice?.toLocaleString("en-IN")}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-emerald-600">{discount}% off</span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mt-1">
          <button onClick={handleCart}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
              cartState === "added"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "border-slate-200 text-slate-700 hover:border-[#1132d4] hover:text-[#1132d4] hover:bg-blue-50"
            }`}>
            {cartState === "loading"
              ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#1132d4] rounded-full animate-spin" />
              : <Ic d={I.cart} className="w-3.5 h-3.5" />}
            {cartState === "added" ? "In Cart →" : "Add to Cart"}
          </button>

          <button
            onClick={e => { e.stopPropagation(); navigate(`/product/${product._id}`); }}
            className="px-3 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-[#1132d4] hover:text-[#1132d4] transition-all"
            title="View details">
            <Ic d={I.eye} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Wishlist() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setLoading(true);
    getWishlist()
      .then(res => setItems(res.data ?? []))
      .catch(() => showToast("Failed to load wishlist", "error"))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleRemove = (id) => {
    setItems(prev => prev.filter(p => p._id !== id));
    showToast("Removed from wishlist");
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear entire wishlist?")) return;
    try {
      await clearWishlist();
      setItems([]);
      showToast("Wishlist cleared");
    } catch (e) { showToast(e.message, "error"); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .wl-root { font-family: 'DM Sans', sans-serif; }
        .wl-display { font-family: 'Sora', sans-serif; }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .slide-up { animation: slideUp 0.4s ease both; }
      `}</style>

      <div className="wl-root min-h-screen bg-slate-50/60">

        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-4 md:px-8 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1132d4] hover:border-[#1132d4] transition-all">
                <Ic d={I.arrow} />
              </button>
              <div>
                <h1 className="wl-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  Wishlist
                  {!loading && (
                    <span className="text-sm font-bold bg-[#1132d4] text-white px-2.5 py-0.5 rounded-full ml-1">
                      {items.length}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Items you've saved for later</p>
              </div>
            </div>
            {items.length > 0 && (
              <button onClick={() => navigate("/cart")}
                className="flex items-center gap-2 text-sm font-bold text-[#1132d4] border-2 border-[#1132d4]/20 bg-blue-50 px-4 py-2 rounded-xl hover:bg-[#1132d4] hover:text-white transition-all duration-200">
                <Ic d={I.cart} className="w-4 h-4" /> View Cart
              </button>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1,2,3,4].map(i => <Skeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 slide-up">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={I.heart} />
                </svg>
              </div>
              <h2 className="wl-display text-xl font-bold text-slate-700">Your wishlist is empty</h2>
              <p className="text-sm text-slate-400 max-w-xs text-center">Save products you love and come back to them later.</p>
              <button onClick={() => navigate("/")}
                className="mt-2 bg-[#1132d4] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] transition-all">
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 slide-up">
              {items.map(product => (
                <WishlistCard
                  key={product._id}
                  product={product}
                  onRemove={handleRemove}
                  onCartChange={() => {}}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}