import { useState, useEffect } from "react";
import { loadStripe }          from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useSubscription } from "../../hooks/useSubscription";

// ─── Stripe public key ────────────────────────────────────────────────────────
// Add VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... to your .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

// ─── Icons ───────────────────────────────────────────────────────────────────

const WalletIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

const ChevronRight = () => (
  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
  </svg>
);

const CreditCardIcon = ({ size = "w-6 h-6" }) => (
  <svg className={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

const BankIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zM11.5 1L2 6v2h19V6l-9.5-5z"/>
  </svg>
);

const PaymentsIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z"/>
  </svg>
);

const CashIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V9h-2V8h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v1h2v1zm9-13H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4V6h16v12z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4 text-[#1132d4]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

const LayersIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-[#1132d4] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 text-slate-300 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
  </svg>
);

const ChevronDown = () => (
  <svg className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
);

// ─── Stripe card element shared styles ───────────────────────────────────────
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

// ─── Data ────────────────────────────────────────────────────────────────────

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "₹2,999",
    priceNum: 2999,
    desc: "Perfect for startups and small projects.",
    features: [
      { text: "20 active listings", ok: true },
      { text: "Standard analytics", ok: true },
      { text: "Priority support", ok: false },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: "₹5,999",
    priceNum: 5999,
    desc: "Everything you need for a growing business.",
    popular: true,
    features: [
      { text: "100 active listings", ok: true },
      { text: "Priority email support", ok: true },
      { text: "Advanced analytics", ok: true },
      { text: "Team collaboration", ok: true },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹11,999",
    priceNum: 11999,
    desc: "For large enterprises needing full control.",
    features: [
      { text: "Unlimited listings", ok: true },
      { text: "Priority chat+call support", ok: true },
      { text: "Custom reporting", ok: true },
      { text: "Dedicated account manager", ok: true },
    ],
  },
];

const faqs = [
  { q: "Can I change plans later?", a: "Yes, you can upgrade your plan at any time. The new plan takes effect immediately and a fresh 1-year validity starts." },
  { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards via Stripe. UPI and NetBanking support is coming soon." },
  { q: "Is there a free trial available?", a: "We offer a 14-day free trial for the Standard plan. No credit card required to start your trial." },
];

const paymentMethods = [
  { id: "card", label: "Card", icon: <CreditCardIcon /> },
  { id: "upi", label: "UPI", icon: <BankIcon /> },
  { id: "netbanking", label: "NetBanking", icon: <PaymentsIcon /> },
  { id: "cash", label: "Cash", icon: <CashIcon /> },
];

// GST 18%
const getPricing = (priceNum) => {
  const base = priceNum;
  const tax  = Math.round(base * 0.18);
  return { base, tax, total: base + tax };
};

// ─── Stripe Card Form ─────────────────────────────────────────────────────────
// Inner component — must be wrapped in <Elements>

function StripeCardForm({ plan, isUpgrade, onBack, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();

  const { subscribePlan, upgrade, loading, error, clearMessages } = useSubscription();

  const [activeMethod, setActiveMethod] = useState("card");
  const [cardholderName, setCardholderName] = useState("");
  const [stripeError, setStripeError]   = useState(null);
  const [processing, setProcessing]     = useState(false);
  const [successState, setSuccessState] = useState(false);

  const pricing = getPricing(plan.priceNum);

  useEffect(() => { clearMessages(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStripeError(null);

    if (activeMethod === "card") {
      if (!stripe || !elements) return;

      setProcessing(true);

      // 1. Create a PaymentMethod with Stripe
      const cardNumber = elements.getElement(CardNumberElement);
      const { error: stripeErr, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
        billing_details: { name: cardholderName },
      });

      if (stripeErr) {
        setStripeError(stripeErr.message);
        setProcessing(false);
        return;
      }

      // 2. Call our backend with Stripe paymentMethod.id
      try {
        if (isUpgrade) {
          await upgrade({
            plan:          plan.id,
            paymentMethod: "Card",
            paymentId:     paymentMethod.id,
          });
        } else {
          await subscribePlan({
            plan:          plan.id,
            paymentMethod: "Card",
            paymentId:     paymentMethod.id,
          });
        }
        setSuccessState(true);
        setTimeout(onSuccess, 1500); // brief success flash, then redirect
      } catch (err) {
        // error already in context state
      } finally {
        setProcessing(false);
      }
    } else {
      // ─── Non-card methods (UPI / NetBanking / Cash) ──────────────────────
      // These are stubs — wire up your payment gateway here.
      // For now we call the backend with the method and no paymentId.
      setProcessing(true);
      try {
        const methodMap = { upi: "UPI", netbanking: "NetBanking", cash: "Cash" };
        if (isUpgrade) {
          await upgrade({ plan: plan.id, paymentMethod: methodMap[activeMethod], paymentId: null });
        } else {
          await subscribePlan({ plan: plan.id, paymentMethod: methodMap[activeMethod], paymentId: null });
        }
        setSuccessState(true);
        setTimeout(onSuccess, 1500);
      } catch {
        // error in context
      } finally {
        setProcessing(false);
      }
    }
  };

  const isLoading = processing || loading;

  // ─── Success screen ───────────────────────────────────────────────────────
  if (successState) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1132d4]/10 flex items-center justify-center">
          <CheckIcon />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
        <p className="text-slate-500">
          You're now subscribed to the <strong>{plan.name}</strong> plan. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Selected Plan Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1132d4] mb-1 block">
                {isUpgrade ? "Upgrading To" : "Selected Plan"}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name} Annual Plan</h3>
              <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
              <button
                type="button"
                onClick={onBack}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Change Plan
              </button>
            </div>
            <div className="w-full md:w-48 h-32 bg-gradient-to-br from-slate-700 via-blue-800 to-slate-900 rounded-lg flex-shrink-0" />
          </div>

          {/* Payment Method Tabs */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Method</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMethod(m.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    activeMethod === m.id
                      ? "border-[#1132d4] bg-[#1132d4]/5 text-[#1132d4]"
                      : "border-slate-100 text-slate-600 hover:border-[#1132d4]/50"
                  }`}
                >
                  {m.icon}
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              ))}
            </div>

            {/* ── Card fields (Stripe Elements) ── */}
            {activeMethod === "card" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
                  <div className="w-full rounded-lg border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4] focus-within:border-transparent">
                    <CardNumberElement options={STRIPE_STYLE} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry Date</label>
                    <div className="w-full rounded-lg border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4]">
                      <CardExpiryElement options={STRIPE_STYLE} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">CVV</label>
                    <div className="w-full rounded-lg border border-slate-200 px-4 py-3 focus-within:ring-2 focus-within:ring-[#1132d4]">
                      <CardCvcElement options={STRIPE_STYLE} />
                    </div>
                  </div>
                </div>
                {/* Stripe or backend error */}
                {(stripeError || error) && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
                    {stripeError || error}
                  </p>
                )}
              </div>
            )}

            {/* ── UPI stub ── */}
            {activeMethod === "upi" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">UPI ID</label>
                  <input
                    type="text"
                    placeholder="yourname@upi"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]"
                  />
                </div>
                <p className="text-xs text-slate-400">UPI gateway integration coming soon. Currently saves record with no paymentId.</p>
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
              </div>
            )}

            {/* ── NetBanking stub ── */}
            {activeMethod === "netbanking" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Bank</label>
                  <select className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1132d4]">
                    <option>SBI</option>
                    <option>HDFC</option>
                    <option>ICICI</option>
                    <option>Axis</option>
                  </select>
                </div>
                <p className="text-xs text-slate-400">NetBanking gateway coming soon. Currently saves record with no paymentId.</p>
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
              </div>
            )}

            {/* ── Cash stub ── */}
            {activeMethod === "cash" && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  Cash payments must be verified by an admin. Your subscription will be activated once confirmed.
                </p>
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{plan.name} Annual Plan</span>
                <span className="text-slate-900 font-medium">₹{pricing.base.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service Fee</span>
                <span className="text-slate-900 font-medium">₹0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax (GST 18%)</span>
                <span className="text-slate-900 font-medium">₹{pricing.tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">Total Amount</span>
                <span className="text-xl font-bold text-[#1132d4]">₹{pricing.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="bg-[#1132d4]/5 border border-[#1132d4]/10 p-4 rounded-lg mb-6">
              <div className="flex gap-3 items-start">
                <ShieldIcon />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your payment information is encrypted and processed through Stripe's secure payment gateway.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (activeMethod === "card" && !stripe)}
              className="w-full bg-[#1132d4] hover:bg-[#1132d4]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <span>Complete Payment</span>
                  <LockIcon />
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
              Guaranteed Safe Checkout
            </p>
            <div className="flex justify-center gap-4 mt-3 opacity-40 grayscale">
              <PaymentsIcon />
              <CreditCardIcon />
              <ShieldIcon />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// ─── Payment Page ─────────────────────────────────────────────────────────────

export function PaymentPage({ plan, isUpgrade = false, onBack, onSuccess }) {
  return (
    <div className="min-h-screen bg-[#f6f6f8] font-sans antialiased flex flex-col">
      <main className="flex-1 px-6 md:px-20 lg:px-40 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6">
            <button onClick={onBack} className="text-sm font-medium text-slate-500 hover:text-[#1132d4] transition-colors">
              Subscription
            </button>
            <ChevronRight />
            <span className="text-sm font-semibold text-[#1132d4]">Payment</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Purchase</h1>
            <p className="text-base text-slate-500">Review your plan and select a secure payment method</p>
          </div>

          {/* Wrap form in Stripe Elements */}
          <Elements stripe={stripePromise}>
            <StripeCardForm
              plan={plan}
              isUpgrade={isUpgrade}
              onBack={onBack}
              onSuccess={onSuccess}
            />
          </Elements>
        </div>
      </main>

      <footer className="border-t border-slate-200 px-6 md:px-20 lg:px-40 py-8 bg-white mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">© 2024 Cashify Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-[#1132d4] transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-[#1132d4] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────

export function PricingPage({ onSubscribe, currentSubscription }) {
  const planOrder = { basic: 1, standard: 2, premium: 3 };
  const currentPlanOrder = currentSubscription?.plan
    ? planOrder[currentSubscription.plan]
    : 0;

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-sans antialiased flex flex-col">
      <main className="flex flex-1 flex-col items-center py-12 px-6 lg:px-20">
        <div className="max-w-4xl w-full text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Scale your business with confidence. Choose the plan that fits your needs and upgrade as you grow.
          </p>
          {currentSubscription && (
            <div className="mt-4 inline-flex items-center gap-2 bg-[#1132d4]/10 text-[#1132d4] text-sm font-semibold px-4 py-2 rounded-full">
              <ShieldIcon />
              Current plan: {currentSubscription.plan?.charAt(0).toUpperCase() + currentSubscription.plan?.slice(1)} · {currentSubscription.daysRemaining} days remaining
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[1100px] mx-auto items-center">
          {plans.map((plan) => {
            const isCurrent  = currentSubscription?.plan === plan.id;
            const isDisabled = planOrder[plan.id] <= currentPlanOrder;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col gap-8 rounded-xl bg-white p-8 transition-shadow ${
                  plan.popular
                    ? "border-2 border-[#1132d4] shadow-xl scale-105 z-10"
                    : "border border-slate-200 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1132d4] text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Active
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-base font-medium text-slate-500">/year</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{plan.desc}</p>
                </div>
                <button
                  onClick={() => !isDisabled && onSubscribe(plan)}
                  disabled={isDisabled}
                  className={`w-full h-12 rounded-lg text-sm font-bold transition-all ${
                    isCurrent
                      ? "bg-green-100 text-green-700 cursor-default"
                      : isDisabled
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : plan.popular
                      ? "bg-[#1132d4] text-white hover:bg-[#1132d4]/90 shadow-md"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {isCurrent ? "Current Plan" : isDisabled ? "Lower Plan" : currentSubscription ? "Upgrade" : "Subscribe"}
                </button>
                <div className="flex flex-col gap-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm font-medium ${f.ok ? "text-slate-700" : "text-slate-400"}`}>
                      {f.ok ? <CheckIcon /> : <XIcon />}
                      {f.text}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="max-w-3xl w-full mt-24 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="border-t border-slate-200">
            {faqs.map((faq, i) => (
              <details key={i} className="group py-4 border-b border-slate-200">
                <summary className="flex cursor-pointer items-center justify-between gap-6 py-2 list-none">
                  <p className="text-base font-semibold text-slate-900">{faq.q}</p>
                  <ChevronDown />
                </summary>
                <div className="pt-2 pb-4 text-slate-600 leading-relaxed text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 px-6 lg:px-20">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-slate-500">
            <LayersIcon />
            <span className="font-medium">© 2024 Cashify Inc.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm text-slate-500 hover:text-[#1132d4] transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-[#1132d4] transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-slate-500 hover:text-[#1132d4] transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}