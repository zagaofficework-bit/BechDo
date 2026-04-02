import { useState } from "react";

const faqs = [
  {
    category: "Orders & Delivery",
    items: [
      { q: "How long does delivery take?", a: "Most orders are delivered within 2–5 business days depending on your location. Metro cities typically receive orders in 2–3 days." },
      { q: "Can I track my order?", a: "Yes! Once your order is shipped, you'll receive a tracking link via SMS and email. You can also track it from your Phonify account under 'My Orders'." },
      { q: "Do you offer same-day delivery?", a: "Same-day delivery is available in select metro cities for orders placed before 12 PM. Check availability at checkout by entering your pincode." },
    ],
  },
  {
    category: "Refurbished Devices",
    items: [
      { q: "What does 'Phonify Assured' mean?", a: "Phonify Assured means the device has gone through our 40-point quality check, been professionally cleaned, repaired if needed, and certified by our in-house technicians." },
      { q: "What are the condition grades?", a: "We rate devices as Superb (like new), Good (minor signs of use), or Fair (visible wear but fully functional). All grades are 100% functional." },
      { q: "Are refurbished phones unlocked?", a: "Yes, all phones sold on Phonify are fully unlocked and compatible with all Indian carriers including Jio, Airtel, Vi and BSNL." },
    ],
  },
  {
    category: "Warranty & Returns",
    items: [
      { q: "What warranty do I get?", a: "All Phonify Assured devices come with a 6-month warranty covering manufacturing defects. Accidental damage and liquid damage are not covered." },
      { q: "What is your return policy?", a: "We offer a 7-day no-questions-asked return policy. The device must be in the same condition as received. Initiate returns from your account or contact support." },
      { q: "How do I claim warranty?", a: "Contact our support team via chat or call with your order ID. We'll arrange a free pickup, diagnose the issue, and either repair or replace the device within 7 business days." },
    ],
  },
  {
    category: "Payments & Offers",
    items: [
      { q: "What payment methods do you accept?", a: "We accept UPI, credit/debit cards, net banking, EMI (0% on select cards), Phonify Pay Later, and cash on delivery for orders up to ₹20,000." },
      { q: "How does the GOLD price work?", a: "Phonify GOLD is our loyalty membership. Members get exclusive lower prices on every product, free priority shipping, and early access to new arrivals." },
      { q: "Can I get EMI on refurbished devices?", a: "Yes! EMI options are available on all orders above ₹5,000 with 0% EMI available on select credit cards for 3, 6, and 12 month tenures." },
    ],
  },
];

const tickets = [
  { icon: "💬", label: "Live Chat", desc: "Chat with us now", sub: "Avg. response: 2 min", color: "bg-teal-50 border-teal-200 hover:border-teal-400", accent: "text-teal-600" },
  { icon: "📞", label: "Call Us", desc: "1800-XXX-XXXX", sub: "Mon–Sat, 9AM–8PM", color: "bg-blue-50 border-blue-200 hover:border-blue-400", accent: "text-blue-600" },
  { icon: "📧", label: "Email Support", desc: "support@phonify.in", sub: "Reply within 24 hrs", color: "bg-violet-50 border-violet-200 hover:border-violet-400", accent: "text-violet-600" },
];

const quickLinks = [
  { icon: "📦", label: "Track Order" },
  { icon: "↩️", label: "Return Request" },
  { icon: "🛡️", label: "Warranty Claim" },
  { icon: "💳", label: "Payment Issue" },
  { icon: "📱", label: "Device Problem" },
  { icon: "🔄", label: "Exchange Device" },
];

export default function Support() {
  const [openFaq, setOpenFaq]       = useState(null);  // "catIdx-itemIdx"
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]         = useState("");
  const [formData, setFormData]     = useState({ name: "", email: "", issue: "", message: "" });
  const [submitted, setSubmitted]   = useState(false);

  const allCategories = ["All", ...faqs.map((f) => f.category)];

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          (activeCategory === "All" || cat.category === activeCategory) &&
          (item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  const toggleFaq = (key) => setOpenFaq(openFaq === key ? null : key);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gray-900 px-4 sm:px-6 md:px-8 pt-10 sm:pt-12 md:pt-14 pb-14 sm:pb-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-teal-500/10" />
        <div className="absolute bottom-0 left-1/4 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-teal-500/5" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-teal-500 rounded-full" />
            <span className="text-teal-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">Phonify Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3">
            How can we<br />
            <span className="text-teal-400">help you today?</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-sm sm:max-w-md mb-6 sm:mb-8 leading-relaxed">
            Search our knowledge base or reach out to our team — we're here 7 days a week.
          </p>

          {/* Search */}
          <div className="flex items-center bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 w-full sm:max-w-md backdrop-blur-sm focus-within:border-teal-400 transition-all duration-200">
            <svg className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs, topics, issues..."
              className="bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none flex-1 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10">

        {/* ── Contact options ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 -mt-6">
          {tickets.map((t) => (
            <div
              key={t.label}
              className={`bg-white border-2 rounded-2xl p-4 sm:p-5 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${t.color}`}
            >
              <span className="text-2xl sm:text-3xl flex-shrink-0">{t.icon}</span>
              <div className="flex-1 sm:flex-none">
                <p className={`text-sm font-black ${t.accent}`}>{t.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{t.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 sm:hidden ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>

        

        {/* ── FAQ section ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-1 h-5 bg-teal-500 rounded-full" />
            <h2 className="text-base sm:text-lg font-black text-gray-900">Frequently Asked Questions</h2>
          </div>

          {/* Category filter — scrollable on mobile */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeCategory === cat
                    ? "bg-teal-500 text-white shadow-md shadow-teal-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-teal-300 hover:text-teal-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <p className="text-sm font-semibold">No results found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFaqs.map((cat, ci) => (
                <div key={ci}>
                  <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="flex-1 h-px bg-gray-200 hidden sm:block" />
                    {cat.category}
                    <span className="flex-1 h-px bg-gray-200" />
                  </p>

                  <div className="space-y-2">
                    {cat.items.map((item, ii) => {
                      const key = `${ci}-${ii}`;
                      const isOpen = openFaq === key;
                      return (
                        <div key={ii} className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? "border-teal-300 shadow-sm" : "border-gray-100 hover:border-gray-200"}`}>
                          <button
                            onClick={() => toggleFaq(key)}
                            className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-left gap-3"
                          >
                            <span className={`text-sm font-bold leading-snug ${isOpen ? "text-teal-700" : "text-gray-800"}`}>
                              {item.q}
                            </span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isOpen ? "bg-teal-500 text-white rotate-45" : "bg-gray-100 text-gray-500"}`}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                              <div className="h-px bg-teal-100 mb-3" />
                              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Contact form ── */}
        <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-gray-900 px-5 sm:px-8 py-6 sm:py-7 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-teal-500/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-teal-500 rounded-full" />
                <span className="text-teal-400 text-[10px] font-black uppercase tracking-widest">Still need help?</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Send us a message</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">We'll get back to you within 24 hours</p>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {submitted ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-1">Message sent!</h4>
                <p className="text-sm text-gray-500">Our team will reach out to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", issue: "", message: "" }); }}
                  className="mt-5 text-xs text-teal-600 font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Aryan Mehta"
                      className="w-full border-b-2 border-gray-200 focus:border-teal-400 bg-transparent px-1 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full border-b-2 border-gray-200 focus:border-teal-400 bg-transparent px-1 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Issue Type</label>
                  <select
                    required
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    className="w-full border-b-2 border-gray-200 focus:border-teal-400 bg-transparent px-1 py-2.5 text-sm text-gray-800 focus:outline-none transition-all duration-200 font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Select an issue...</option>
                    <option>Order & Delivery</option>
                    <option>Device Problem</option>
                    <option>Return / Exchange</option>
                    <option>Warranty Claim</option>
                    <option>Payment Issue</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    className="w-full border-b-2 border-gray-200 focus:border-teal-400 bg-transparent px-1 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200 font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
                >
                  Send Message
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
}