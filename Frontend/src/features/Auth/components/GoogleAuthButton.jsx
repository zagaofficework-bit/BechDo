import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../../config/firebase.config";

export default function GoogleAuthButton({
  onSuccess,
  onError,
  label = "Continue with Google",
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      onSuccess?.(idToken);
    } catch (err) {
      console.error("[GoogleAuthButton] Firebase popup error:", err);
      onError?.("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 font-semibold text-sm select-none"
      style={{
        borderColor: isDisabled ? "#e5e7eb" : "#dadce0",
        background: isDisabled ? "#f9fafb" : "#fff",
        color: isDisabled ? "#9ca3af" : "#3c4043",
        cursor: isDisabled ? "not-allowed" : "pointer",
        boxShadow: isDisabled ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {loading ? (
        <span className="w-5 h-5 rounded-full animate-spin flex-shrink-0"
          style={{ border: "2px solid #dadce0", borderTopColor: "#4285F4" }} />
      ) : (
        <GoogleLogo />
      )}
      <span>{loading ? "Connecting…" : label}</span>
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}