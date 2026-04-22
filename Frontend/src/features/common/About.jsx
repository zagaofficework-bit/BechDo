import { useState } from "react";

const stats = [
  { value: "2.5L+", label: "Devices Sold" },
  { value: "98%",   label: "Customer Satisfaction" },
  { value: "6",     label: "Month Warranty" },
  { value: "40+",   label: "Quality Checks" },
];

const values = [
  {
    icon: "🔒",
    title: "Trust First",
    desc: "Every device goes through a rigorous 40-point inspection before it reaches you. No shortcuts. No compromises.",
    color: "bg-teal-50 border-teal-200",
    accent: "text-teal-600",
  },
  {
    icon: "♻️",
    title: "Sustainable Tech",
    desc: "Buying refurbished reduces e-waste and carbon emissions by up to 80%. We're building a circular economy for India.",
    color: "bg-emerald-50 border-emerald-200",
    accent: "text-emerald-600",
  },
  {
    icon: "💸",
    title: "Real Savings",
    desc: "Premium devices at 30–60% off retail price. Because great tech shouldn't cost a fortune.",
    color: "bg-amber-50 border-amber-200",
    accent: "text-amber-600",
  },
  {
    icon: "🤝",
    title: "Customer First",
    desc: "7-day returns, 6-month warranty, and a support team that actually helps. We stand behind every sale.",
    color: "bg-violet-50 border-violet-200",
    accent: "text-violet-600",
  },
];

const team = [
  { name: "Sahil Khan",  role: "Co-Founder & CEO",      avatar: "SK", color: "bg-teal-500"   },
  { name: "Ram Muduli",  role: "Co-Founder & CTO",      avatar: "RM", color: "bg-violet-500" },
];

const milestones = [
  { year: "2019", title: "Phonify Founded",           desc: "Started in a small garage in Bengaluru with 3 team members and a mission to make great tech affordable." },
  { year: "2020", title: "First 1,000 Sales",         desc: "Crossed our first 1,000 orders during the pandemic — proving demand for affordable, quality refurbished devices." },
  { year: "2021", title: "Phonify Assured Launched",  desc: "Introduced our 40-point quality certification program, setting a new standard for refurbished tech in India." },
  { year: "2022", title: "Expanded to 50+ Cities",    desc: "Grew our logistics network to reach customers in over 50 Indian cities with 2–3 day delivery." },
  { year: "2023", title: "₹100 Cr Revenue Milestone", desc: "Hit our biggest milestone yet — ₹100 Cr in annual revenue while maintaining a 98% customer satisfaction rate." },
  { year: "2024", title: "Phonify GOLD Membership",   desc: "Launched GOLD — our loyalty program giving members exclusive pricing, priority support, and early access." },
];

function SectionHead({ title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-1 h-5 bg-teal-500 rounded-full flex-shrink-0" />
      <h2 className="text-base sm:text-lg font-black text-gray-900">{title}</h2>
    </div>
  );
}

export default function AboutPage() {
  const [activeYear, setActiveYear] = useState("2024");

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gray-900 px-4 sm:px-6 md:px-8 pt-10 sm:pt-12 md:pt-14 pb-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-teal-500/10" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-teal-500/5" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-teal-500 rounded-full" />
            <span className="text-teal-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">About Phonify</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            We're on a mission to make<br />
            <span className="text-teal-400">great tech accessible</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
            Phonify was born from a simple belief — that everyone deserves access to premium technology without paying premium prices.
          </p>
        </div>
      </div>

      {/* ── Stats — no negative margin, clean separation ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 md:px-8 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center py-2">
              <p className="text-2xl sm:text-3xl font-black text-teal-600 leading-none mb-1">{s.value}</p>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-12">

        {/* ── Story ── */}
        <div>
          <SectionHead title="Our Story" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                It started in 2026 when our founders <span className="font-bold text-gray-900">Sahil</span> and <span className="font-bold text-gray-900">Ram</span> noticed something frustrating — millions of Indians wanted iPhones and Samsung flagships but couldn't justify spending ₹1 lakh+.
              </p>
              <p>
                Meanwhile, thousands of perfectly good devices were being discarded or exported. The gap was obvious. The solution was Phonify.
              </p>
              <p>
                We built a system from scratch — sourcing pre-owned devices, putting them through a rigorous 40-point quality check, repairing what needed fixing, and certifying them under the <span className="font-bold text-teal-600">Phonify Assured</span> badge.
              </p>
              <p>
                Today, we've helped over <span className="font-bold text-gray-900">2.5 lakh customers</span> across India get the devices they love at prices that make sense.
              </p>
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-teal-500/15" />
              <div className="absolute -bottom-5 -left-5 w-24 h-24 rounded-full bg-violet-500/10" />
              <div className="relative z-10 space-y-4">
                {[
                  { icon: "🎯", label: "Our Mission", text: "Make premium tech accessible to every Indian" },
                  { icon: "👁️", label: "Our Vision",  text: "Build India's most trusted circular tech economy" },
                  { icon: "💡", label: "Our Belief",  text: "Quality refurbished > new budget device, always" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                      <p className="text-white text-sm font-semibold mt-0.5 leading-snug">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Values ── */}
        <div>
          <SectionHead title="What We Stand For" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.title} className={`border-2 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${v.color}`}>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-2xl">{v.icon}</span>
                  <h3 className={`text-sm font-black ${v.accent}`}>{v.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div>
          <SectionHead title="Our Journey" />

          {/* Year tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {milestones.map((m) => (
              <button
                key={m.year}
                onClick={() => setActiveYear(m.year)}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeYear === m.year
                    ? "bg-teal-500 text-white shadow-md shadow-teal-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-teal-300 hover:text-teal-600"
                }`}
              >
                {m.year}
              </button>
            ))}
          </div>

          {/* Active card */}
          {milestones.filter((m) => m.year === activeYear).map((m) => (
            <div key={m.year} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black text-xs sm:text-sm flex-shrink-0">
                  {m.year}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1.5">{m.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                </div>
              </div>
              {/* Dot indicators */}
              <div className="flex gap-2 mt-5">
                {milestones.map((ms) => (
                  <div
                    key={ms.year}
                    onClick={() => setActiveYear(ms.year)}
                    className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                      ms.year === activeYear ? "w-7 bg-teal-500" : "w-2 bg-gray-200 hover:bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Team ── */}
        <div>
          <SectionHead title="Meet the Team" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl ${member.color} flex items-center justify-center text-white font-black text-sm mx-auto mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  {member.avatar}
                </div>
                <p className="text-sm font-black text-gray-900 leading-snug">{member.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-0.5">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="bg-gray-900 rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-8 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-teal-500/10" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-teal-500/10" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8">
            <div className="flex-1 text-center sm:text-left">
              <span className="text-teal-400 text-[10px] font-black uppercase tracking-widest">Join us</span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1 mb-2 leading-snug">
                Ready to experience Phonify?
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Shop thousands of certified refurbished devices — all with 6-month warranty and 7-day returns.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-shrink-0">
              <button className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg w-full sm:w-auto">
                Shop Now
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all w-full sm:w-auto">
                Contact Us
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}