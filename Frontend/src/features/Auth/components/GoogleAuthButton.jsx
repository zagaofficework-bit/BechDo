/**
 * GoogleAuthButton.jsx
 *
 * Reusable Google Sign-In button using Google's GSI (Identity Services) library.
 * Renders a styled custom button that triggers Google's credential callback.
 *
 * Usage:
 *   <GoogleAuthButton onSuccess={handleGoogleAuth} onError={setError} />
 *
 * Props:
 *   onSuccess(credential: string) — called with the Google ID token on success
 *   onError(message: string)      — called with a human-readable error message
 *   label                         — button text (default: "Continue with Google")
 *   disabled                      — disables the button
 */

import React, { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleAuthButton({
  onSuccess,
  onError,
  label = "Continue with Google",
  disabled = false,
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  // Load Google GSI script once
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      onError?.("Failed to load Google Sign-In. Please refresh and try again.");
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Google Identity Services once script is loaded
  useEffect(() => {
    if (!scriptLoaded || initialized.current) return;
    if (!GOOGLE_CLIENT_ID) {
      console.error(
        "[GoogleAuthButton] VITE_GOOGLE_CLIENT_ID is not set in .env"
      );
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
    });

    initialized.current = true;
  }, [scriptLoaded]);

  const handleCredentialResponse = (response) => {
    if (!response?.credential) {
      onError?.("No credential received from Google.");
      return;
    }
    setLoading(false);
    onSuccess?.(response.credential);
  };

  const handleClick = () => {
    if (disabled || loading || !scriptLoaded) return;

    if (!window.google?.accounts?.id) {
      onError?.("Google Sign-In is not ready yet. Please try again.");
      return;
    }

    setLoading(true);

    // Cancel any previous prompt state, then re-prompt
    window.google.accounts.id.cancel();

    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment()
      ) {
        setLoading(false);
        const reason =
          notification.getNotDisplayedReason?.() ||
          notification.getSkippedReason?.() ||
          "unknown";
        console.warn("[GoogleAuthButton] Prompt suppressed:", reason);
        onError?.(
          "Google Sign-In popup was blocked. Please allow popups for this site and try again, or use Chrome/Edge."
        );
      }
    });
  };

  const isDisabled = disabled || loading || !scriptLoaded;

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
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
          e.currentTarget.style.borderColor = "#c6c6c6";
          e.currentTarget.style.background = "#f8f9fa";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = "#dadce0";
          e.currentTarget.style.background = "#fff";
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = "scale(0.98)";
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = "";
        }
      }}
    >
      {loading ? (
        <span
          className="w-5 h-5 rounded-full animate-spin flex-shrink-0"
          style={{
            border: "2px solid #dadce0",
            borderTopColor: "#4285F4",
          }}
        />
      ) : (
        <GoogleLogo />
      )}
      <span>{loading ? "Connecting…" : label}</span>
    </button>
  );
}

/** Official Google "G" logo SVG */
function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}