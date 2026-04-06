import { useState, useRef, useEffect } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { PiCrown } from "react-icons/pi";

export default function NavMenu({
  mobileOpen,
  setMobileMenuOpen,
  isAdmin,
  isSeller,
  isPremium,
  onLogout,
  loggingOut,
}) {
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [openSub, setOpenSub] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isProductDetail = location.pathname.startsWith("/product/");

  const isWishlist = location.pathname === "/wishlist";
  const isCart = location.pathname === "/cart";

  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setOpenSub(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMenuClick = (idx) => {
    if (openMenu === idx) {
      setOpenMenu(null);
      setOpenSub(null);
    } else {
      setOpenMenu(idx);
      setOpenSub(null);
    }
  };

  const handleSubClick = (key) => {
    setOpenSub(openSub === key ? null : key);
  };

  const menuItems = [
    {
      title: "All",
      subItems: [
        { label: "Sell Gadgets", route: "/sell" },
        { label: "Buy Gadgets", route: "/buy-gadgets" },
      ],
    },
    {
      title: "Sell Gadgets",
      subItems: [
        { label: "Phone", route: "/sell" },
        { label: "Laptop", route: "/sell/laptops" },
        { label: "Smartwatch", route: "/sell/smartwatch" },
        { label: "Tablet", route: "/sell/tablet" },
        { label: "Television", route: "/sell/television" },
      ],
    },
    {
      title: "Buy Refurbished",
      subItems: [
        { label: "Mobiles", route: "/phones?deviceType=refurbished" },
        { label: "Laptops", route: "/laptops?deviceType=refurbished" },
        { label: "Tablets", route: "/tablets?deviceType=refurbished" },
        { label: "SmartWatches", route: "/smartwatches?deviceType=refurbished" },
        { label: "Television", route: "/televisions?deviceType=refurbished" },
      ],
    },
    {
      title: "New Gadgets",
      subItems: [
        { label: "New Mobiles", route: "/phones?deviceType=new" },
        { label: "New Laptops", route: "/laptops?deviceType=new" },
        { label: "New Tablets", route: "/tablets?deviceType=new" },
        { label: "New SmartWatches", route: "/smartwatches?deviceType=new" },
        { label: "New Television", route: "/televisions?deviceType=new" },
      ],
    },
    {
      title: "Buy Laptop",
      subItems: [
        { label: "Apple", route: "/laptops?brand=apple" },
        { label: "Acer", route: "/laptops?brand=acer" },
        { label: "Dell", route: "/laptops?brand=dell" },
        { label: "Lenovo", route: "/laptops?brand=lenovo" },
      ],
    },
    {
      title: "More",
      subItems: [
        { label: "Support", route: "/support" },
        { label: "Blog", route: "/blog" },
        { label: "About Us", route: "/about" },
      ],
    },
  ];

  if (isProductDetail) return null;

  return (
    <>
      {/* ═══════════════ DESKTOP ═══════════════ */}
      <div
        className="hidden md:block w-full bg-white border-t border-b border-gray-200"
        ref={navRef}
        onMouseLeave={() => {
          setOpenMenu(null);
          setOpenSub(null);
        }}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-0 md:gap-1 lg:gap-4 xl:gap-8 overflow-x-auto scrollbar-none">
            {menuItems.map((item, idx) => (
              <div key={idx} className="relative py-2.5 flex-shrink-0">
                <button
                  onMouseEnter={() => handleMenuClick(idx)}
                  className={`flex items-center gap-1 px-1.5 md:px-2 lg:px-3 py-1.5 text-[11px] md:text-xs lg:text-sm font-medium cursor-pointer whitespace-nowrap border-b-2 transition-all duration-150 ${
                    openMenu === idx
                      ? "text-[#0077b6] border-[#0077b6]"
                      : "text-gray-700 border-transparent hover:text-[#0077b6] hover:border-[#0077b6]"
                  }`}
                >
                  {item.title}
                  <svg
                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                      openMenu === idx ? "rotate-180 text-[#0077b6]" : "text-gray-400"
                    }`}
                    viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd" />
                  </svg>
                </button>

                {openMenu === idx && (
                  <div className="absolute left-0 top-full pt-2 z-50 min-w-[200px]">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-visible">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {item.title}
                        </p>
                      </div>
                      {item.subItems.map((sub, si) => {
                        const subKey = `${idx}-${si}`;
                        const isSubOpen = openSub === subKey;
                        return (
                          <div key={si} className="relative">
                            <button
                              onClick={() => {
                                const p = sub.route || sub.path;
                                if (p) { navigate(p); setOpenMenu(null); setOpenSub(null); }
                              }}
                              onMouseEnter={() => handleSubClick(subKey)}
                              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium cursor-pointer transition-colors duration-100 ${
                                isSubOpen ? "bg-teal-50 text-[#0077b6]" : "text-gray-700 hover:bg-[#caf0f8] hover:text-[#0077b6]"
                              }`}
                            >
                              <span>{sub.label}</span>
                              {sub.subs?.length > 0 && (
                                <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isSubOpen ? "rotate-90 text-teal-500" : "text-gray-300"}`}
                                  viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            {isSubOpen && sub.subs?.length > 0 && (
                              <div className="bg-teal-50 border-t border-teal-100">
                                {sub.subs.map((s, ti) => (
                                  <div key={ti}
                                    onClick={() => { const p = s.route || s.path; if (p) navigate(p); }}
                                    className="px-6 py-2 text-sm text-gray-600 hover:bg-teal-100 hover:text-teal-800 cursor-pointer transition-colors duration-100 flex items-center gap-2"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-teal-400 flex-shrink-0" />
                                    {s.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ MOBILE OVERLAY ═══════════════ */}
      {mobileOpen && !isProductDetail && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ═══════════════ MOBILE DRAWER ═══════════════ */}
      {!isProductDetail && (<div
        className={`fixed top-0 right-0 h-full w-[300px] sm:w-[320px] bg-white z-50 shadow-2xl transform transition-transform duration-300 md:hidden overflow-y-auto`}
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <p className="text-sm font-semibold text-gray-800">Menu</p>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Auth card */}
        {isAuthenticated ? (
          <div className="m-4 bg-gradient-to-br from-[#03045e] to-[#0077b6] text-white rounded-2xl p-4">
            <p className="text-base font-semibold">Hi, {user?.firstname} 👋</p>
            {isAdmin && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                Admin
              </span>
            )}
            <div className="flex gap-2 mt-3">
              {!isAdmin && (
                <button
                  onClick={() => { navigate(isSeller ? "/seller-dashboard" : "/profile"); setMobileMenuOpen(false); }}
                  className="flex-1 bg-white text-[#0077b6] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  {isSeller ? "Dashboard" : "Profile"}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => { navigate("/admin-dashboard"); setMobileMenuOpen(false); }}
                  className="flex-1 bg-white text-indigo-600 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                disabled={loggingOut}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loggingOut ? "..." : "Logout"}
              </button>
            </div>
          </div>
        ) : (
          <div className="m-4 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-base font-semibold">Hello 👋</p>
              <p className="text-xs text-gray-300 mt-0.5">Please login or signup</p>
            </div>
            <button
              className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-colors"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        )}

        {/* ── Wishlist & Cart quick links (mobile) ── */}
        {isAuthenticated && !isAdmin && (
          <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => { navigate("/wishlist"); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                isWishlist
                  ? "border-red-300 bg-red-50 text-red-500"
                  : "border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
              }`}
            >
              <svg className="w-4 h-4" fill={isWishlist ? "currentColor" : "none"}
                stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Wishlist
            </button>
            <button
              onClick={() => { navigate("/cart"); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                isCart
                  ? "border-[#0077b6] bg-[#caf0f8] text-[#0077b6]"
                  : "border-gray-200 text-gray-600 hover:border-[#0077b6] hover:bg-[#caf0f8] hover:text-[#0077b6]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
            </button>
          </div>
        )}

        {/* Subscribe banner */}
        {isAuthenticated && !isAdmin && !isPremium && (
          <div className="mx-4 mb-3 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <PiCrown className="text-2xl text-[#0077b6] flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">Go Premium</p>
                <p className="text-xs text-gray-400">Unlock seller features</p>
              </div>
            </div>
            <button
              onClick={() => { navigate("/subscribe"); setMobileMenuOpen(false); }}
              className="bg-[#0077b6] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#005f90] transition-colors"
            >
              Subscribe
            </button>
          </div>
        )}

        {/* Accordion menu items */}
        <div className="pb-8">
          {menuItems.map((item, index) => (
            <div key={index} className="border-b border-gray-100">
              <button
                className="w-full flex justify-between items-center px-5 py-4 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileExpanded(mobileExpanded === index ? null : index)}
              >
                {item.title}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileExpanded === index ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {mobileExpanded === index && (
                <div className="bg-gray-50 pb-2">
                  {item.subItems.map((sub, si) => (
                    <div
                      key={si}
                      onClick={() => {
                        const path = sub.route || sub.path;
                        if (path) { navigate(path); setMobileMenuOpen(false); }
                      }}
                      className="flex items-center gap-2.5 px-6 py-2.5 text-sm text-gray-600 hover:text-[#0077b6] hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      {sub.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>)}
    </>
  );
}