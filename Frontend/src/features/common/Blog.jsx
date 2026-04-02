import { useState } from "react";

const posts = [
  {
    id: 1,
    category: "Buying Guide",
    tag: "HOT",
    title: "Why Refurbished iPhones Are the Smartest Buy in 2025",
    excerpt: "With prices of new flagships crossing ₹1.5L, refurbished iPhones certified by Phonify deliver 90% of the experience at 40% of the cost. Here's everything you need to know.",
    author: "Aryan Mehta",
    date: "Mar 15, 2025",
    readTime: "5 min read",
    img: "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg",
    color: "from-slate-900 to-slate-700",
  }, 
  {
    id: 2,
    category: "Tech Tips",
    tag: "NEW",
    title: "5 Things to Check Before Buying a Refurbished Phone",
    excerpt: "Battery health, IMEI verification, screen quality, accessories — we walk you through the complete checklist so you never get surprised.",
    author: "Sneha Rao",
    date: "Mar 10, 2025",
    readTime: "4 min read",
    img: "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra5g.jpg",
    color: "from-teal-800 to-teal-600",
  },
  {
    id: 3,
    category: "Comparison",
    tag: "POPULAR",
    title: "Samsung Galaxy S24 vs S23 — Which Refurbished Deal Wins?",
    excerpt: "Both are available at Phonify at amazing prices. But is the newer S24 worth the premium? We put them head to head across camera, battery and performance.",
    author: "Rahul Singh",
    date: "Mar 5, 2025",
    readTime: "6 min read",
    img: "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24.jpg",
    color: "from-indigo-900 to-indigo-700",
  },
  {
    id: 4,
    category: "Sustainability",
    tag: "NEW",
    title: "How Buying Refurbished Saves the Planet — One Phone at a Time",
    excerpt: "Manufacturing a new smartphone produces 70kg of CO₂. Choosing refurbished cuts that by 80%. Phonify is proud to be part of India's circular economy movement.",
    author: "Priya Nair",
    date: "Feb 28, 2025",
    readTime: "3 min read",
    img: "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg",
    color: "from-emerald-800 to-emerald-600",
  },
  {
    id: 5,
    category: "Buying Guide",
    tag: null,
    title: "Best Refurbished Laptops Under ₹40,000 in 2025",
    excerpt: "From MacBook Air M1 to ThinkPad X1 Carbon — our experts have handpicked the best value certified laptops available on Phonify right now.",
    author: "Aryan Mehta",
    date: "Feb 20, 2025",
    readTime: "7 min read",
    img: "https://m.media-amazon.com/images/I/510uTHyDqGL._AC_UF1000,1000_QL80_.jpg",
    color: "from-gray-800 to-gray-600",
  },
  {
    id: 6,
    category: "Tech Tips",
    tag: null,
    title: "How to Extend Your Phone Battery Life by 40%",
    excerpt: "Whether you just bought a new device or a certified refurbished one, these 8 battery habits will dramatically improve your daily uptime.",
    author: "Sneha Rao",
    date: "Feb 14, 2025",
    readTime: "4 min read",
    img: "https://fdn2.gsmarena.com/vv/bigpic/oneplus-13.jpg",
    color: "from-rose-800 to-rose-600",
  },
];

const categories = ["All", "Buying Guide", "Tech Tips", "Comparison", "Sustainability"];

const tagStyle = {
  HOT:     "bg-red-500 text-white",
  NEW:     "bg-teal-500 text-white",
  POPULAR: "bg-amber-500 text-white",
};

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gray-900 px-4 sm:px-6 md:px-8 pt-10 sm:pt-12 md:pt-14 pb-14 sm:pb-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-teal-500/10" />
        <div className="absolute bottom-0 left-1/3 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-teal-500/5" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-teal-500 rounded-full" />
            <span className="text-teal-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">Phonify Blog</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3">
            Tech Insights &<br />
            <span className="text-teal-400">Smart Buying Guides</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-sm sm:max-w-md mb-6 sm:mb-8 leading-relaxed">
            Expert tips, comparisons and news to help you get the most from every rupee spent on refurbished tech.
          </p>

          {/* Search — full width on mobile */}
          <div className="flex items-center bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 w-full sm:max-w-md backdrop-blur-sm focus-within:border-teal-400 transition-all duration-200">
            <svg className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none flex-1 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10">

        {/* ── Category pills — horizontally scrollable on mobile ── */}
        <div className="flex items-center gap-2 mb-8 -mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
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

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <p className="text-sm font-semibold">No articles found</p>
          </div>
        ) : (
          <>
            {/* ── Featured post ── */}
            {featured && (
              <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br ${featured.color} mb-6 sm:mb-8 cursor-pointer group`}>
                <div className="absolute inset-0 bg-black/30" />

                {/* Image — hidden on mobile, shown from sm up */}
                <img
                  src={featured.img}
                  alt={featured.title}
                  className="hidden sm:block absolute right-0 top-0 h-full w-2/5 md:w-1/2 object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                />

                <div className="relative z-10 p-5 sm:p-8 md:p-10 sm:max-w-xl">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-[10px] font-black text-teal-300 uppercase tracking-widest bg-teal-500/20 border border-teal-500/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                      {featured.category}
                    </span>
                    {featured.tag && (
                      <span className={`text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${tagStyle[featured.tag]}`}>
                        {featured.tag}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-2 sm:mb-3 group-hover:text-teal-200 transition-colors duration-200">
                    {featured.title}
                  </h2>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-2">
                    {featured.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {featured.author[0]}
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">{featured.author}</p>
                        <p className="text-gray-400 text-[10px]">{featured.date} · {featured.readTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 text-teal-300 text-xs font-bold group-hover:gap-3 transition-all duration-200">
                      <span className="hidden sm:inline">Read article</span>
                      <span className="sm:hidden">Read</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Post grid ── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {rest.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col"
                  >
                    {/* Image area */}
                    <div className={`relative h-36 sm:h-44 bg-gradient-to-br ${post.color} overflow-hidden flex-shrink-0`}>
                      <img
                        src={post.img}
                        alt={post.title}
                        className="absolute right-0 bottom-0 h-full w-3/4 object-contain opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex gap-1.5">
                        <span className="text-[9px] font-black text-teal-300 uppercase tracking-widest bg-black/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          {post.category}
                        </span>
                        {post.tag && (
                          <span className={`text-[9px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${tagStyle[post.tag]}`}>
                            {post.tag}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <h3 className="text-sm font-black text-gray-900 leading-snug mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors duration-150">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 sm:mb-4 flex-1">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                            {post.author[0]}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-700">{post.author}</p>
                            <p className="text-[9px] text-gray-400">{post.date}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap">
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Newsletter CTA ── */}
        <div className="mt-10 sm:mt-14 bg-gray-900 rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-teal-500/10" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-teal-500/10" />
          <div className="relative z-10">
            <span className="text-teal-400 text-[10px] font-black uppercase tracking-widest">Stay Updated</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 mb-2 leading-snug">
              Get the best deals & tech tips<br className="hidden sm:block" /> straight to your inbox
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-5 sm:mb-6">No spam. Just the good stuff — weekly.</p>

            {/* Stack on mobile, side by side on sm+ */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-teal-400 transition-all"
              />
              <button className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-teal-900 sm:flex-shrink-0 w-full sm:w-auto">
                Subscribe
              </button>
            </div>
          </div>
        </div>

      </div>
     
    </div>
  );
}