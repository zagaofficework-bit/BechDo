import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { buyProduct } from "../../services/shop.api";

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
  arrow: "M10 19l-7-7m0 0l7-7m-7 7h18",
  shield:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  check: "M5 13l4 4L19 7",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z",
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
  { id: "Cash", label: "Cash on delivery", icon: "💵" },
];

const conditionColors = {
  Superb: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Good: "text-blue-700 bg-blue-50 border-blue-200",
  Fair: "text-amber-700 bg-amber-50 border-amber-200",
};

// ─── Inner form (needs Stripe context) ───────────────────────────────────────
function BuyForm({ product, onBack, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [method, setMethod] = useState("Card");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("SBI");
  const [processing, setProcessing] = useState(false);
  const [stripeErr, setStripeErr] = useState(null);
  const [apiErr, setApiErr] = useState(null);

  const tax = Math.round(product.price * 0.18);
  const total = product.price + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStripeErr(null);
    setApiErr(null);
    setProcessing(true);

    try {
      if (method === "Card" && !name.trim()) {
        setStripeErr("Cardholder name is required");
        setProcessing(false);
        return;
      }
      if (method === "UPI" && !upiId.trim()) {
        setStripeErr("UPI ID is required");
        setProcessing(false);
        return;
      }
      if (method === "Card") {
        if (!stripe || !elements) {
          setProcessing(false);
          return;
        }
        const { error } = await stripe.createPaymentMethod({
          type: "card",
          card: elements.getElement(CardNumberElement),
          billing_details: { name },
        });
        if (error) {
          setStripeErr(error.message);
          setProcessing(false);
          return;
        }
      }

      await buyProduct(product._id, method);
      onSuccess();
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  return (
    <div
      className="min-h-screen bg-[#f7f8fc]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 md:px-10 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-[0_1px_8px_rgba(17,50,212,0.04)]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#1132d4] transition-colors"
        >
          <Ic d={I.arrow} className="w-4 h-4" /> Back to product
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Ic d={I.lock} className="w-3.5 h-3.5 text-[#1132d4]" />
          Secure Checkout
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8">
            <p className="text-xs font-black text-[#1132d4] uppercase tracking-widest mb-1">
              Direct Purchase
            </p>
            <h1
              className="text-2xl font-extrabold text-slate-900"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Complete Your Order
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review product details and choose a payment method
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Payment */}
            <div className="lg:col-span-3 space-y-6">
              {/* Product summary card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] p-5 flex gap-4 items-start">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl opacity-20">📱</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {product.brand && (
                    <p className="text-[10px] font-black text-[#1132d4] uppercase tracking-widest">
                      {product.brand}
                    </p>
                  )}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5 line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {product.condition && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conditionColors[product.condition] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {product.condition}
                      </span>
                    )}
                    {product.storage && (
                      <span className="text-xs text-slate-400">
                        {product.storage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2 mt-2 flex-wrap">
                    <span className="text-lg font-extrabold text-slate-900">
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
                </div>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs font-semibold text-[#1132d4] hover:underline flex-shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Payment method selector */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] p-5">
                <h3 className="text-sm font-extrabold text-slate-800 mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        method === m.id
                          ? "border-[#1132d4] bg-[#1132d4]/5 text-[#1132d4]"
                          : "border-slate-200 text-slate-600 hover:border-[#1132d4]/40"
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Card fields */}
                {method === "Card" && (
                  <div className="space-y-4">
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
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30 focus:border-[#1132d4] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Card Number
                      </label>
                      <div className="w-full rounded-xl border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4]/30 focus-within:border-[#1132d4] transition-all">
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
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]/30 focus:border-[#1132d4]"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      UPI gateway integration — currently records method without
                      live payment flow.
                    </p>
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
                      {[
                        "SBI",
                        "HDFC",
                        "ICICI",
                        "Axis",
                        "Kotak",
                        "Yes Bank",
                      ].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                {method === "Cash" && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-700 font-medium">
                      Payment will be collected at the time of handover. Seller
                      must confirm before delivery.
                    </p>
                  </div>
                )}

                {apiErr && (
                  <p className="mt-4 text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                    {apiErr}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(17,50,212,0.05)] p-6 sticky top-20 space-y-5">
                <h3
                  className="text-sm font-extrabold text-slate-800"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  Order Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Product Price</span>
                    <span className="font-semibold text-slate-800">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Discount ({discount}%)
                      </span>
                      <span className="font-semibold text-emerald-600">
                        −₹
                        {(
                          product.originalPrice - product.price
                        )?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">GST (18%)</span>
                    <span className="font-semibold text-slate-800">
                      ₹{tax.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Delivery</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between">
                    <span className="text-base font-extrabold text-slate-900">
                      Total
                    </span>
                    <span className="text-xl font-extrabold text-[#1132d4]">
                      ₹{total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* What happens next */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">
                    What happens next?
                  </p>
                  {[
                    "Order sent to seller",
                    "Seller confirms within 24h",
                    "Handover arranged",
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-slate-500"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#1132d4]/10 text-[#1132d4] flex items-center justify-center font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>

                {/* Security */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Ic
                    d={I.shield}
                    className="w-4 h-4 text-[#1132d4] flex-shrink-0"
                  />
                  Secured by Stripe · 256-bit encryption
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={processing || (method === "Card" && !stripe)}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[#1132d4] text-white font-extrabold text-sm shadow-[0_4px_20px_rgba(17,50,212,0.35)] hover:bg-[#0d28b8] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                >
                  {processing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Processing…
                    </>
                  ) : (
                    <>
                      <Ic d={I.lock} className="w-4 h-4" /> Pay ₹
                      {total.toLocaleString("en-IN")}
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  100% Secure · Money-Back Guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ product, onDone }) {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 p-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap');`}</style>
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2
        className="text-2xl font-extrabold text-slate-900 text-center"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        Order Placed! 🎉
      </h2>
      <p className="text-slate-500 text-sm text-center max-w-xs leading-relaxed">
        Your request has been sent to the seller. They'll confirm within 24
        hours and arrange handover.
      </p>
      {product && (
        <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 px-5 py-3 max-w-sm w-full">
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-12 h-12 object-contain flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 line-clamp-1">
              {product.title}
            </p>
            <p className="text-xs text-slate-500">
              ₹{product.price?.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Keep Browsing
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
}

// ─── BuyNowPage — exported, rendered inside ProductDetails ────────────────────
export default function BuyNowPage({ product, onBack }) {
  const [success, setSuccess] = useState(false);

  if (success) return <SuccessScreen product={product} />;

  return (
    <Elements stripe={stripePromise}>
      <BuyForm
        product={product}
        onBack={onBack}
        onSuccess={() => setSuccess(true)}
      />
    </Elements>
  );
}
