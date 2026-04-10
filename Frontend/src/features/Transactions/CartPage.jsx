import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import LazyImage from "../../components/LazyImage";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "../../hooks/useAuth";
import {
  getCart,
  removeFromCart,
  checkoutMultiple,
} from "../../services/shop.api";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
);

// ─── icon helper ─────────────────────────────────────────────────────────────
const Ic = ({ d, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const I = {
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  arrow: "M10 19l-7-7m0 0l7-7m-7 7h18",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  shield:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  check: "M5 13l4 4L19 7",
  cart: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  heart:
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
};

const STRIPE_STYLE = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1e293b",
      fontFamily: "inherit",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#ef4444" },
  },
};

const PAYMENT_METHODS = [
  { id: "Card", label: "Card", icon: "💳" },
  { id: "UPI", label: "UPI", icon: "📲" },
  { id: "NetBanking", label: "NetBanking", icon: "🏦" },
  { id: "Cash", label: "Cash", icon: "💵" },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold
      ${type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}
    >
      {msg}
    </div>
  );
}

// ─── Cart item row ────────────────────────────────────────────────────────────
function CartItem({ item, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const navigate = useNavigate();

  const { product, addedAt } = item;
  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeFromCart(product._id);
      onRemove(product._id);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 p-4 hover:border-[#1132d4]/20 hover:shadow-[0_4px_16px_rgba(17,50,212,0.06)] transition-all duration-200">
      {/* Thumb */}
      <div
        onClick={() => navigate(`/product/${product._id}`)}
        className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer"
      >
        {product.images?.[0] ? (
          <LazyImage
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl opacity-20">📱</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          {product.brand && (
            <span className="text-[10px] font-black text-[#1132d4] uppercase tracking-widest">
              {product.brand}
            </span>
          )}
          {product.condition && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
              {product.condition}
            </span>
          )}
        </div>
        <p
          className="text-sm font-bold text-slate-800 mt-1 leading-snug line-clamp-2 cursor-pointer hover:text-[#1132d4]"
          onClick={() => navigate(`/product/${product._id}`)}
        >
          {product.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-base font-extrabold text-slate-900">
            ₹{product.price?.toLocaleString("en-IN")}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-slate-400 line-through">
              ₹{product.originalPrice?.toLocaleString("en-IN")}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-emerald-600">
              {discount}% off
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Added{" "}
          {addedAt
            ? new Date(addedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            : "recently"}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
      >
        {removing ? (
          <span className="w-4 h-4 border-2 border-slate-200 border-t-red-400 rounded-full animate-spin block" />
        ) : (
          <Ic d={I.trash} className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ─── Checkout form (wrapped in Stripe Elements) ───────────────────────────────
function CheckoutForm({ items, total, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();

  const [method, setMethod] = useState("Card");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("SBI");
  const [processing, setProcessing] = useState(false);
  const [stripeErr, setStripeErr] = useState(null);

  const tax = Math.round(total * 0.18);
  const grand = total + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStripeErr(null);
    setProcessing(true);

    try {
      let paymentId = null;

      if (method === "Card") {
        if (!stripe || !elements) {
          setProcessing(false);
          return;
        }
        if (method === "Card" && !name.trim()) {
          setStripeErr("Cardholder name is required");
          setProcessing(false);
          return;
        }
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: elements.getElement(CardNumberElement),
          billing_details: { name },
        });
        if (error) {
          setStripeErr(error.message);
          setProcessing(false);
          return;
        }
        paymentId = paymentMethod.id;
      }

      await checkoutMultiple(method);
      onSuccess();
    } catch (err) {
      onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment method tabs */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">Payment Method</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                method === m.id
                  ? "border-[#1132d4] bg-[#1132d4]/5 text-[#1132d4]"
                  : "border-slate-200 text-slate-600 hover:border-[#1132d4]/40"
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card fields */}
      {method === "Card" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Cardholder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30 focus:border-[#1132d4]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Card Number
            </label>
            <div className="w-full rounded-xl border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4]/30 focus-within:border-[#1132d4]">
              <CardNumberElement options={STRIPE_STYLE} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Expiry
              </label>
              <div className="rounded-xl border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4]/30">
                <CardExpiryElement options={STRIPE_STYLE} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                CVV
              </label>
              <div className="rounded-xl border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4]/30">
                <CardCvcElement options={STRIPE_STYLE} />
              </div>
            </div>
          </div>
          {stripeErr && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
              {stripeErr}
            </p>
          )}
        </div>
      )}

      {method === "UPI" && (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            UPI ID
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="name@upi"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30 focus:border-[#1132d4]"
          />
        </div>
      )}

      {method === "NetBanking" && (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Bank
          </label>
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30"
          >
            {["SBI", "HDFC", "ICICI", "Axis", "Kotak"].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      )}

      {method === "Cash" && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Cash on delivery — payment collected at handover.
        </p>
      )}

      {/* Summary */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            Subtotal ({items.length} items)
          </span>
          <span className="font-semibold">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">GST (18%)</span>
          <span className="font-semibold">₹{tax.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Delivery</span>
          <span className="text-emerald-600 font-semibold">Free</span>
        </div>
        <div className="border-t border-slate-200 pt-2.5 flex justify-between">
          <span className="text-base font-extrabold text-slate-900">Total</span>
          <span className="text-xl font-extrabold text-[#1132d4]">
            ₹{grand.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-[#1132d4]/4 rounded-xl px-4 py-3">
        <Ic d={I.shield} className="w-4 h-4 text-[#1132d4] flex-shrink-0" />
        Your payment is encrypted and processed securely via Stripe.
      </div>

      <button
        type="submit"
        disabled={processing || (method === "Card" && !stripe)}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[#1132d4] text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(17,50,212,0.35)] hover:bg-[#0d28b8] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {processing ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
            Processing…
          </>
        ) : (
          <>
            <Ic d={I.lock} className="w-4 h-4" /> Place Order — ₹
            {grand.toLocaleString("en-IN")}
          </>
        )}
      </button>
    </form>
  );
}

// ─── Main CartPage ────────────────────────────────────────────────────────────
export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(true);
    getCart()
      .then((res) => {
        setItems(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => showToast("Failed to load cart", "error"))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleRemove = (productId) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product?._id !== productId);
      setTotal(next.reduce((s, i) => s + (i.product?.price || 0), 0));
      return next;
    });
    showToast("Removed from cart");
  };

  const handleSuccess = () => {
    setSuccess(true);
    setItems([]);
    setTotal(0);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <Ic d={I.check} className="w-10 h-10 text-emerald-500" />
        </div>
        <h2
          className="text-2xl font-extrabold text-slate-900"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Order Placed!
        </h2>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          Your order is pending seller confirmation. We'll notify you once it's
          confirmed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Browse More
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="px-5 py-2.5 rounded-xl bg-[#1132d4] text-white text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] transition-all"
          >
            View Orders
          </button>
        </div>
      </div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .cart-root { font-family: 'DM Sans', sans-serif; }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .slide-up { animation: slideUp 0.4s ease both; }
      `}</style>

      <div className="cart-root min-h-screen bg-slate-50/50">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-4 md:px-8 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1132d4] hover:border-[#1132d4] transition-all"
          >
            <Ic d={I.arrow} />
          </button>
          <div>
            <h1
              className="text-lg font-extrabold text-slate-900"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Cart{" "}
              {!loading && items.length > 0 && (
                <span className="text-[#1132d4]">({items.length})</span>
              )}
            </h1>
          </div>
          <button
            onClick={() => navigate("/wishlist")}
            className="ml-auto p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-all"
            title="Wishlist"
          >
            <Ic d={I.heart} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-3 border-[#1132d4]/20 border-t-[#1132d4] rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 slide-up">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Ic d={I.cart} className="w-10 h-10 text-slate-300" />
            </div>
            <h2
              className="text-xl font-extrabold text-slate-700"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Your cart is empty
            </h2>
            <p className="text-sm text-slate-400">
              Add products to cart to checkout
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-2 bg-[#1132d4] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_16px_rgba(17,50,212,0.3)] hover:bg-[#0d28b8] transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Items list */}
              <div className="lg:col-span-3 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {items.length} item{items.length > 1 ? "s" : ""} in cart
                </p>
                {items.map((item) => (
                  <CartItem
                    key={item.product?._id}
                    item={item}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              {/* Checkout panel */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(17,50,212,0.06)] p-6 sticky top-20">
                  <h3
                    className="text-base font-extrabold text-slate-900 mb-5"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Checkout
                  </h3>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      items={items}
                      total={total}
                      onSuccess={handleSuccess}
                      onError={(msg) => showToast(msg, "error")}
                    />
                  </Elements>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
