//Signup.jsx

import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export default function Signup() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    initializing,
    handleRegister,
    error: apiError,
  } = useAuth();

  if (!initializing && isAuthenticated) {
    if (user?.role === "admin")
      return <Navigate to="/admin-dashboard" replace />;
    if (user?.role === "seller")
      return <Navigate to="/seller-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  if (initializing) return <FullScreenSpinner />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstname.trim() || form.firstname.trim().length < 2)
      e.firstname = "First name is required (min 2 chars)";
    if (!form.lastname.trim() || form.lastname.trim().length < 2)
      e.lastname = "Last name is required (min 2 chars)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email address";
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = "Phone must be 10 digits";
    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    const result = await handleRegister({
      firstname: form.firstname,
      lastname: form.lastname,
      email: form.email,
      mobile: form.phone,
    });
    setSubmitting(false);
    if (result?.success !== false) {
      navigate("/otp", { state: { email: form.email, otpTarget: "register" } });
    }
  };

  const isFormValid =
    form.firstname.trim().length >= 2 &&
    form.lastname.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    /^[0-9]{10}$/.test(form.phone);

  // Returns inline style object for input wrapper
  const inputWrapClass = (field) =>
    `flex items-center border rounded-2xl px-4 py-3 transition-all duration-200 ${
      errors[field]
        ? "border-red-300 bg-red-50/50"
        : form[field] && !errors[field]
          ? "border-teal-400 bg-teal-50/30"
          : "border-gray-200 bg-gray-50 focus-within:border-teal-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-50"
    }`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 p-4 overflow-auto"
      onClick={() => navigate("/")}
    >
      <div
        className="flex flex-col md:flex-row w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">
              Phonify
            </span>
          </div>

          {/* Center text */}
          <div className="flex flex-col items-center z-10">
            <h3 className="text-white text-xl font-bold text-center leading-snug mb-2">
              Join Phonify
              <br />
              today
            </h3>
            <p className="text-gray-400 text-xs text-center leading-relaxed max-w-[200px]">
              Your trusted marketplace for quality refurbished devices
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col gap-2 w-full z-10">
            {[
              { icon: "🔒", label: "100% Secure Signup" },
              { icon: "✅", label: "Phonify Assured Quality" },
              { icon: "🔄", label: "6 Month Warranty" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-gray-300 text-xs font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="w-full md:w-1/2 p-8 flex flex-col">
          {/* Top nav */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign up</h2>
          <p className="text-sm text-gray-400 mb-6">
            Create your Phonify account
          </p>

          {/* Form */}
          <div className="flex flex-col flex-grow space-y-4">
            {/* First + Last name */}
            <div className="flex gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  First Name
                </label>
                <div className={inputWrapClass("firstname")}>
                  <input
                    type="text"
                    name="firstname"
                    value={form.firstname}
                    onChange={handleChange}
                    placeholder="John"
                    disabled={submitting}
                    className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium disabled:opacity-60"
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = "#0077b6";
                      e.target.parentElement.style.boxShadow =
                        "0 0 0 3px rgba(0,119,182,0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.boxShadow = "none";
                      if (!form.firstname)
                        e.target.parentElement.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>
                {errors.firstname && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstname}
                  </p>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Last Name
                </label>
                <div className={inputWrapClass("lastname")}>
                  <input
                    type="text"
                    name="lastname"
                    value={form.lastname}
                    onChange={handleChange}
                    placeholder="Doe"
                    disabled={submitting}
                    className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium disabled:opacity-60"
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = "#0077b6";
                      e.target.parentElement.style.boxShadow =
                        "0 0 0 3px rgba(0,119,182,0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.boxShadow = "none";
                      if (!form.lastname)
                        e.target.parentElement.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>
                {errors.lastname && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className={inputWrapClass("email")}>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={submitting}
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium disabled:opacity-60"
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = "#0077b6";
                    e.target.parentElement.style.boxShadow =
                      "0 0 0 3px rgba(0,119,182,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.boxShadow = "none";
                    if (!form.email)
                      e.target.parentElement.style.borderColor = "#e5e7eb";
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className={inputWrapClass("phone")}>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  disabled={submitting}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      ![
                        "Backspace",
                        "Tab",
                        "ArrowLeft",
                        "ArrowRight",
                        "Delete",
                      ].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium disabled:opacity-60"
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = "#0077b6";
                    e.target.parentElement.style.boxShadow =
                      "0 0 0 3px rgba(0,119,182,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.boxShadow = "none";
                    if (!form.phone)
                      e.target.parentElement.style.borderColor = "#e5e7eb";
                  }}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                style={
                  !submitting && isFormValid
                    ? {
                        background: "#0077b6",
                        color: "#fff",
                        boxShadow: "0 2px 8px rgba(0,119,182,0.25)",
                      }
                    : {
                        background: "#f3f4f6",
                        color: "#9ca3af",
                        cursor: "not-allowed",
                      }
                }
                onMouseEnter={(e) => {
                  if (!submitting && isFormValid) {
                    e.currentTarget.style.background = "#005f8f";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,119,182,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && isFormValid) {
                    e.currentTarget.style.background = "#0077b6";
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,119,182,0.25)";
                  }
                }}
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {submitting ? "Sending OTP…" : "Create Account"}
              </button>
            </div>
          </div>
          {apiError && (
            <p className="text-red-500 text-xs mt-2 text-center font-medium">
              {apiError}
            </p>
          )}

          {/* Login link */}
          <p className="text-sm text-gray-500 text-center mt-5">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="font-semibold cursor-pointer hover:underline"
              style={{ color: "#0077b6" }}
            >
              Login
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
        style={{
          border: "3px solid rgba(0,119,182,0.15)",
          borderTopColor: "#0077b6",
        }}
      />
    </div>
  );
}
