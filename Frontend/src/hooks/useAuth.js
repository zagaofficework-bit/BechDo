import { useState, useRef } from "react";
import { useAuthContext } from "../context/auth.context";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../config/firebase.config";
import { login, register, logout, googleAuth } from "../services/auth.api";

export const useAuth = () => {
  const {
    user, setUser, loading, setLoading,
    initializing, isAuthenticated, updateUser,
  } = useAuthContext();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const confirmationRef = useRef(null); // ← replaces window.confirmationResult

  // ── Setup reCAPTCHA ───────────────────────────────────────────────────────
  const setupRecaptcha = async (containerId) => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (_) {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => { window.recaptchaVerifier = null; },
    });
    await window.recaptchaVerifier.render(); // ← critical fix #2
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async (phone) => {
    setError(null);
    setLoading(true);
    try {
      await setupRecaptcha("recaptcha-container"); // ← awaited now
      confirmationRef.current = await signInWithPhoneNumber(
        auth, phone, window.recaptchaVerifier,
      );
      return { success: true };
    } catch (err) {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (_) {}
        window.recaptchaVerifier = null;
      }
      setError(err?.message || "Failed to send OTP");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ phone }) => sendOtp(phone);
  const handleLogin    = async ({ phone }) => sendOtp(phone);

  // ── Verify OTP for Login ──────────────────────────────────────────────────
  const handleVerifyLoginOtp = async ({ otp }) => {
    setError(null);
    setLoading(true);
    try {
      if (!confirmationRef.current) {
        setError("Session expired. Please resend OTP");
        return { success: false };
      }
      const result = await confirmationRef.current.confirm(otp);
      const firebaseToken = await result.user.getIdToken(true); // ← fix #1: forceRefresh

      const data = await login({ firebaseToken });
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Verification failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP for Register ───────────────────────────────────────────────
  const handleVerifyRegisterOtp = async ({ otp, firstname, lastname, email }) => {
    setError(null);
    setLoading(true);
    try {
      if (!confirmationRef.current) {
        setError("Session expired. Please resend OTP");
        return { success: false };
      }
      const result = await confirmationRef.current.confirm(otp);
      const firebaseToken = await result.user.getIdToken(true); // ← fix #1: forceRefresh

      const data = await register({ firebaseToken, firstname, lastname, email });
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Verification failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ── Google Auth ───────────────────────────────────────────────────────────
  const handleGoogleAuth = async (credential) => {
    setError(null);
    setLoading(true);
    try {
      const data = await googleAuth(credential);
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      return {
        success: true,
        isNewUser: data.isNewUser ?? false,
        requiresMobile: data.requiresMobile ?? false,
        user: data.user,
      };
    } catch (err) {
      setError(err?.response?.data?.message || "Google sign-in failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setError(null);
    setLoading(true);
    try {
      await logout();
    } catch (_) {
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
      setLoading(false);
    }
  };

  return {
    user, loading, initializing, isAuthenticated,
    isAdmin:   user?.role === "admin",
    isSeller:  user?.role === "seller",
    isUser:    user?.role === "user",
    error, successMessage,
    sendOtp,
    handleRegister, handleVerifyRegisterOtp,
    handleLogin, handleVerifyLoginOtp,
    handleGoogleAuth, handleLogout,
    updateUser,
    clearError:  () => setError(null),
    clearMessage: () => setSuccessMessage(null),
  };
};