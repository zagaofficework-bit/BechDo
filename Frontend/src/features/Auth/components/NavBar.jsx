import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useSubscriptionContext } from "../../../context/subscription.context";
import { PiCrown } from "react-icons/pi";
import { MdAdminPanelSettings } from "react-icons/md";
import NavMenu from "./NavMenu";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URI || "http://localhost:3000";

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => {
        const messages = { 1: "Location permission denied", 2: "Location unavailable", 3: "Location request timed out" };
        reject(new Error(messages[error.code] || "Unknown location error"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function reverseGeocode(latitude, longitude) {
  const res = await fetch(`${BASE_URL}/api/location/reverse-geocode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Geocode failed");
  return data.data;
}

async function saveDetectedAddress(latitude, longitude, geocoded) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}/api/location/save-as-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      latitude, longitude, isDefault: true,
      street: geocoded.street || null, city: geocoded.city || null,
      state: geocoded.state || null, pincode: geocoded.pincode || null,
      country: geocoded.country || "India", full: geocoded.full || null,
    }),
  });
  const data = await res.json();
  if (!token) throw new Error("User not authenticated");
  if (!res.ok) throw new Error(data.message || "Failed to save address");
  return data;
}

function PinIcon({ color = "text-slate-500" }) {
  return (
    <svg className={`w-4 h-4 flex-shrink-0 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function SpinnerIcon() {
  return <span className="w-4 h-4 flex-shrink-0 border-2 border-current/30 border-t-current rounded-full animate-spin" />;
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LocationButton() {
  const [phase, setPhase] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const handleDetect = async () => {
    setPhase("detecting");
    setErrMsg("");
    try {
      const { latitude, longitude } = await getCurrentLocation();
      setCoords({ latitude, longitude });
      const address = await reverseGeocode(latitude, longitude);
      setPreview(address);
      setPhase("confirming");
    } catch (e) {
      setErrMsg(e.message);
      setPhase("error");
    }
  };

  const handleConfirm = async () => {
    setPhase("saving");
    try {
      await saveDetectedAddress(coords.latitude, coords.longitude, preview);
      setPhase("done");
      setTimeout(() => { setPhase("idle"); setPreview(null); setCoords(null); }, 2500);
    } catch (e) {
      setErrMsg(e.message);
      setPhase("error");
    }
  };

  const handleCancel = () => { setPhase("idle"); setPreview(null); setCoords(null); };

  if (phase === "confirming" && preview) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={handleCancel} />
        <div className="fixed top-16 right-2 sm:right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[calc(100vw-16px)] sm:w-80 p-5"
          style={{ animation: "fadeDown 0.2s ease" }}>
          <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#0077b6]/10 flex items-center justify-center flex-shrink-0 text-[#0077b6]">
              <PinIcon color="text-[#0077b6]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Save this location?</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed break-words">{preview.full}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs mb-4">
            {[
              { label: "Street", value: preview.street },
              { label: "City", value: preview.city },
              { label: "State", value: preview.state },
              { label: "Pincode", value: preview.pincode },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-lg px-2.5 py-2">
                <p className="text-slate-400 font-medium">{item.label}</p>
                <p className="text-slate-700 font-semibold truncate">{item.value ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0077b6] text-white hover:bg-[#005f90] transition-all shadow-[0_3px_10px_rgba(0,119,182,0.3)]">
              Save as Default
            </button>
          </div>
        </div>
      </>
    );
  }

  if (phase === "saving") {
    return (
      <button disabled className="flex items-center gap-1.5 border border-[#0077b6]/40 text-[#0077b6] bg-[#caf0f8] rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-wait">
        <SpinnerIcon /> Saving…
      </button>
    );
  }

  const states = {
    idle: { label: null, icon: <PinIcon />, cls: "border-slate-200 text-slate-600 hover:border-[#0077b6] hover:text-[#0077b6] hover:bg-[#caf0f8]" },
    detecting: { label: "Detecting…", icon: <SpinnerIcon />, cls: "border-[#0077b6]/40 text-[#0077b6] bg-[#caf0f8] cursor-wait" },
    done: { label: "Saved ✓", icon: <CheckIcon />, cls: "border-emerald-300 text-emerald-600 bg-emerald-50" },
    error: { label: errMsg, icon: <PinIcon color="text-red-400" />, cls: "border-red-200 text-red-500 bg-red-50 max-w-[140px]" },
  };

  const s = states[phase] ?? states.idle;

  return (
    <button
      onClick={phase === "idle" || phase === "error" ? handleDetect : undefined}
      disabled={phase === "detecting" || phase === "done"}
      title={phase === "idle" ? "Detect my location" : undefined}
      className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 disabled:cursor-default truncate ${s.cls}`}
    >
      {s.icon}
      <span className={phase === "error" ? "truncate" : "hidden sm:inline"}>
        {s.label ?? "Location"}
      </span>
    </button>
  );
}

// ─── Icon button reusable ─────────────────────────────────────────────────────
function IconBtn({ onClick, active, activeClass, inactiveClass, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative p-2 rounded-xl border transition-all duration-150 ${active ? activeClass : inactiveClass}`}
    >
      {children}
    </button>
  );
}

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, handleLogout } = useAuth();
  const { subscription } = useSubscriptionContext();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = async () => {
    try {
      setLoggingOut(true);
      await handleLogout();
      navigate("/");
    } catch (err) {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  const isAdmin = isAuthenticated && user?.role === "admin";
  const isSeller = isAuthenticated && user?.role === "seller";
  const isPremium =
    isSeller &&
    subscription?.plan?.toLowerCase() === "premium" &&
    subscription?.status === "active" || (isSeller && user?.isSuperSeller === true);
  const hasDefaultAddress = !!user?.defaultAddress?.city;

  // Show shop icons on these paths
  const shopPaths = ["/wishlist", "/cart"];
  const isOnProductPage = location.pathname.startsWith("/product/");
  const showShopIcons =
    isAuthenticated &&
    !isAdmin &&
    (isOnProductPage || shopPaths.includes(location.pathname));

  const isWishlist = location.pathname === "/wishlist";
  const isCart = location.pathname === "/cart";

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-white shadow-md px-3 sm:px-4 md:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">

          {/* Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="/nav-logo.png"
              alt="Phonify Logo"
              className="h-8 sm:h-10 w-auto cursor-pointer object-contain"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Search bar — desktop only, hidden for admins */}
          {!isAdmin && (
            <div className="hidden md:flex flex-1 mx-4 lg:mx-6 items-center border rounded-lg px-3 py-2 bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input type="text" placeholder="Search for mobiles, accessories & More"
                className="w-full bg-transparent focus:outline-none text-gray-700 text-sm" />
            </div>
          )}

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">

            {/* MOBILE: wishlist + cart icons (always visible when authenticated & not admin) */}
            {isAuthenticated && !isAdmin && (
              <div className="flex items-center gap-1 md:hidden">
                <IconBtn
                  onClick={() => navigate("/wishlist")}
                  title="Wishlist"
                  active={isWishlist}
                  activeClass="border-red-300 bg-red-50 text-red-500"
                  inactiveClass="border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={isWishlist ? "currentColor" : "none"}
                    stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </IconBtn>
                <IconBtn
                  onClick={() => navigate("/cart")}
                  title="Cart"
                  active={isCart}
                  activeClass="border-[#0077b6] bg-[#caf0f8] text-[#0077b6]"
                  inactiveClass="border-slate-200 text-slate-500 hover:border-[#0077b6] hover:text-[#0077b6] hover:bg-[#caf0f8]"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </IconBtn>
              </div>
            )}

            {/* DESKTOP right actions */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                {!isAdmin && !isPremium && (
                  <div onClick={() => navigate("/subscribe")} className="cursor-pointer" title="Subscription plans">
                    <PiCrown className="text-3xl lg:text-4xl text-[#0077b6]" />
                  </div>
                )}
                {!isAdmin && !hasDefaultAddress && <LocationButton />}
                {showShopIcons && (
                  <>
                    <IconBtn
                      onClick={() => navigate("/wishlist")}
                      title="Wishlist"
                      active={isWishlist}
                      activeClass="border-red-300 bg-red-50 text-red-500"
                      inactiveClass="border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                    >
                      <svg className="w-5 h-5" fill={isWishlist ? "currentColor" : "none"}
                        stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </IconBtn>
                    <IconBtn
                      onClick={() => navigate("/cart")}
                      title="Cart"
                      active={isCart}
                      activeClass="border-[#0077b6] bg-[#caf0f8] text-[#0077b6]"
                      inactiveClass="border-slate-200 text-slate-500 hover:border-[#0077b6] hover:text-[#0077b6] hover:bg-[#caf0f8]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </IconBtn>
                  </>
                )}
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <span className="text-sm text-gray-600 hidden lg:block">
                    Hi, {user?.firstname}
                    {isAdmin && (
                      <span className="ml-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </span>
                  {isAdmin && (
                    <button onClick={() => navigate("/admin-dashboard")}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm">
                      <MdAdminPanelSettings className="text-lg" />
                      <span className="hidden lg:inline">Admin Panel</span>
                    </button>
                  )}
                  {!isAdmin && (
                    <button onClick={() => navigate(isSeller ? "/seller-dashboard" : "/profile")}
                      className="bg-[#0077b6] text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-[#03045e] transition text-sm">
                      {isSeller ? "Dashboard" : "Profile"}
                    </button>
                  )}
                  <button onClick={onLogout} disabled={loggingOut}
                    className="bg-red-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm">
                    {loggingOut ? "..." : "Logout"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => navigate("/login")}
                className="hidden md:block bg-[#0077b6] text-white px-4 py-2 rounded-lg hover:bg-[#03045e] transition text-sm">
                Login
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden text-gray-700 p-1.5 flex-shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {!isAdmin && (
          <div className="mt-2.5 md:hidden flex items-center border rounded-lg px-3 py-2 bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input type="text" placeholder="Search mobiles, accessories & more"
              className="w-full bg-transparent focus:outline-none text-gray-700 text-sm" />
          </div>
        )}
      </nav>

      <NavMenu
        mobileOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        isSeller={isSeller}
        onLogout={onLogout}
        loggingOut={loggingOut}
        isPremium={isPremium}
      />
    </div>
  );
}