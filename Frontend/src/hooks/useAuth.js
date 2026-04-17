import { useState } from "react";
import { useAuthContext } from "../context/auth.context";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../config/firebase.config";
import { login, register, logout, googleAuth } from "../services/auth.api";

export const useAuth = () => {
  const {
    user,
    setUser,
    loading,
    setLoading,
    initializing,
    isAuthenticated,
    updateUser,
  } = useAuthContext();

  const [otpSent, setOtpSent] = useState(false);
  const [otpTarget, setOtpTarget] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const confirmationRef = useRef(null);

  const clearSessionToken = () => sessionStorage.removeItem("sessionToken");

  // AFTER

  // AFTER
  const setupRecaptcha = async (containerId) => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (_) {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        window.recaptchaVerifier = null;
      },
    });
    await window.recaptchaVerifier.render(); // ← wait for render
  };

  // ── Send OTP via Firebase ────────────────────────────────────────────────
  const sendOtp = async (phone) => {
    setError(null);
    setLoading(true);
    try {
      await setupRecaptcha("recaptcha-container");
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier,
      );
      window.confirmationResult = confirmationRef.current;
      return { success: true };
    } catch (err) {
      // Reset recaptcha on error so user can retry
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setError(err?.message || "Failed to send OTP");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const handleRegister = async ({ phone }) => {
    return sendOtp(phone);
  };

  const handleVerifyRegisterOtp = async ({
    otp,
    firstname,
    lastname,
    email,
  }) => {
    setError(null);
    setLoading(true);
    try {
      if (!window.confirmationResult) {
        setError("Session expired. Please resend OTP");
        return { success: false };
      }
      const result = await window.confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken(true); // forceRefresh: true

      const data = await register({
        firebaseToken,
        firstname,
        lastname,
        email,
      });
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Verification failed",
      );
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = async ({ phone }) => {
    return sendOtp(phone);
  };

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
      setError(
        err?.response?.data?.message || err?.message || "Verification failed",
      );
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
  // ── GOOGLE AUTH ───────────────────────────────────────────────────────────
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

  // ── LOGOUT ────────────────────────────────────────────────────────────────
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

  const clearError = () => setError(null);
  const clearMessage = () => setSuccessMessage(null);

  return {
    user,
    loading,
    initializing,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    isSeller: user?.role === "seller",
    isUser: user?.role === "user",
    error,
    successMessage,
    sendOtp,
    handleRegister,
    handleVerifyRegisterOtp,
    handleLogin,
    handleVerifyLoginOtp,
    handleGoogleAuth,
    handleLogout,
    updateUser,
    clearError,
    clearMessage,
  };
};
