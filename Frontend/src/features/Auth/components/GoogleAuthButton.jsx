import React, { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleAuthButton({
  onSuccess,
  onError,
  label = "Sign in with Google",
  disabled = false,
}) {
  const buttonRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id || initialized.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            onSuccess?.(response.credential);
          } else {
            onError?.("No credential received from Google.");
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // disable FedCM to avoid the block
      });

      // Render Google's REAL button — this bypasses FedCM entirely
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: buttonRef.current.offsetWidth || 400,
        });
      }

      initialized.current = true;
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () =>
      onError?.("Failed to load Google Sign-In. Please refresh.");
    document.head.appendChild(script);
  }, []);

  return (
    <div
      ref={buttonRef}
      style={{
        width: "100%",
        minHeight: "44px",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    />
  );
}