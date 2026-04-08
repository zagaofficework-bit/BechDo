// Login.jsx

import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated, initializing, handleLogin, handleGoogleAuth, error } =
    useAuth();

  if (!initializing && isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (user?.role === "seller") return <Navigate to="/seller-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  if (initializing) return <FullScreenSpinner />;

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setIsValid(validateEmail(e.target.value));
  };

  const handleContinue = async () => {
    if (!isValid || sending) return;
    setSending(true);
    const result = await handleLogin({ email });
    setSending(false);
    if (result?.success !== false) {
      navigate("/otp", { state: { email, otpTarget: "login" } });
    }
  };

  // ── Google handler ─────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credential) => {
    const result = await handleGoogleAuth(credential);
    if (result?.success) {
      // If brand-new user and needs mobile → send them to profile completion
      if (result.requiresMobile) {
        navigate("/", {
          state: { requiresMobile: true },
          replace: true,
        });
        return;
      }
      // Redirect based on role
      const role = result.user?.role;
      if (role === "admin") navigate("/admin-dashboard", { replace: true });
      else if (role === "seller") navigate("/seller-dashboard", { replace: true });
      else navigate("/", { replace: true });
    }
  };

  const handleGoogleError = (message) => {
    // The error is already set inside handleGoogleAuth via setError,
    // but we can also handle it here if needed.
    console.error("[Login] Google error:", message);
  };
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 p-4"
      onClick={() => navigate(-1)}
    >
      <div
        className="flex flex-col md:flex-row w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left panel ── */}
        <div className="hidden md:flex w-1/2 bg-gray-900 flex-col items-center justify-between p-10 relative overflow-hidden">
          <div
            className="absolute -top-16 -left-16 w-64 h-64 rounded-full"
            style={{ background: "rgba(0,119,182,0.1)" }}
          />
          <div
            className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full"
            style={{ background: "rgba(0,119,182,0.1)" }}
          />

          {/* Logo */}
          <div className="w-full flex items-center gap-2 z-10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#0077b6" }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">Phonify</span>
          </div>

          {/* Center text */}
          <div className="flex flex-col items-center z-10">
            <h3 className="text-white text-xl font-bold text-center leading-snug mb-2">
              Welcome back to
              <br />
              Phonify
            </h3>
            <p className="text-gray-400 text-xs text-center leading-relaxed max-w-[200px]">
              Your trusted marketplace for quality refurbished devices
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col gap-2 w-full z-10">
            {[
              { icon: "🔒", label: "100% Secure Login" },
              { icon: "✅", label: "Phonify Assured Quality" },
              { icon: "🔄", label: "6 Month Warranty" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-gray-300 text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
          {/* Top nav */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors font-semibold"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4"
              style={{ background: "#e8f4fd", border: "1px solid #cce4f6" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#0077b6" }} />
              <span className="text-xs font-semibold" style={{ color: "#0077b6" }}>
                Secure Login
              </span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-1.5">
              Sign in to
              <br />
              your account
            </h2>
            <p className="text-sm text-gray-400">
              Enter your email or continue with Google
            </p>
          </div>

          {/* ── Google Sign-In ── */}
          <div className="mb-4">
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              label="Sign in with Google"
              disabled={sending}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email input */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
              Email address
            </label>
            <div
              className={`flex items-center border rounded-2xl px-4 py-3 transition-all duration-200 ${
                email && !isValid ? "border-red-300 bg-red-50/50" : ""
              }`}
              style={
                email && isValid
                  ? { borderColor: "#0077b6", background: "rgba(0,119,182,0.03)" }
                  : !email
                  ? { borderColor: "#e5e7eb", background: "#f9fafb" }
                  : {}
              }
            >
              <svg
                className="w-4 h-4 mr-3 flex-shrink-0 transition-colors"
                style={{ color: email && isValid ? "#0077b6" : "#9ca3af" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <input
                type="email"
                value={email}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                placeholder="you@example.com"
                disabled={sending}
                className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium disabled:opacity-60"
                onFocus={(e) => {
                  if (!email || !isValid) {
                    e.target.parentElement.style.borderColor = "#0077b6";
                    e.target.parentElement.style.background = "#fff";
                    e.target.parentElement.style.boxShadow = "0 0 0 4px rgba(0,119,182,0.08)";
                  }
                }}
                onBlur={(e) => {
                  if (!email || !isValid) {
                    e.target.parentElement.style.borderColor = "#e5e7eb";
                    e.target.parentElement.style.background = "#f9fafb";
                    e.target.parentElement.style.boxShadow = "none";
                  }
                }}
              />
              {email && isValid && !sending && (
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#0077b6" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            {email && !isValid && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1.5 font-medium">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please enter a valid email address
              </p>
            )}
            {error && (
              <p className="text-red-500 text-xs mt-2 flex items-center gap-1.5 font-medium">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 mb-5 bg-gray-50 rounded-2xl px-4 py-3">
            <input
              type="checkbox"
              checked
              readOnly
              className="mt-0.5 flex-shrink-0 w-3.5 h-3.5"
              style={{ accentColor: "#0077b6" }}
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to the{" "}
              <a href="#" className="font-semibold hover:underline" style={{ color: "#0077b6" }}>
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="font-semibold hover:underline" style={{ color: "#0077b6" }}>
                Privacy Policy
              </a>
            </span>
          </div>

          {/* Continue button */}
          <button
            disabled={!isValid || sending}
            onClick={handleContinue}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={
              isValid && !sending
                ? { background: "#0077b6", color: "#fff", boxShadow: "0 4px 14px rgba(0,119,182,0.3)" }
                : { background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }
            }
            onMouseEnter={(e) => {
              if (isValid && !sending) {
                e.currentTarget.style.background = "#005f8f";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,119,182,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (isValid && !sending) {
                e.currentTarget.style.background = "#0077b6";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,119,182,0.3)";
              }
            }}
          >
            {sending && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {sending ? "Sending OTP…" : "Continue"}
            {isValid && !sending && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </button>

          {/* Signup link */}
          <p className="text-sm text-gray-400 text-center mt-6">
            New to Phonify?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="font-bold cursor-pointer hover:underline"
              style={{ color: "#0077b6" }}
            >
              Create account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{ border: "3px solid rgba(0,119,182,0.15)", borderTopColor: "#0077b6" }}
      />
    </div>
  );
}