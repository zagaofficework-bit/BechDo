import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMe } from "../services/auth.api";
import toast from "react-hot-toast";

// ─── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be inside <AuthProvider>");
  return ctx;
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true); // true until getMe() resolves

  // ── Restore session on app boot ────────────────────────────────────────────
  // Runs ONCE. All route guards wait for initializing → false before redirecting.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const data = await getMe();
        setUser(data.user ?? null);
      } catch (err) {
        // 401 means token is dead — remove it so we don't loop
        if (err?.response?.status === 401) {
          localStorage.removeItem("accessToken");
        } else {
          // Network error — optionally: toast.error("Connection error. Please refresh.");
          toast.error("Session restore failed:", err.message);
        }
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []); // ← empty dep array: runs once

  // ── Stable helpers ─────────────────────────────────────────────────────────
  // useCallback ensures these functions don't change identity on every render,
  // so child components that receive them as props don't re-render unnecessarily.

  const updateUser = useCallback((fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  }, []);

  // ── Memoized context value ─────────────────────────────────────────────────
  // useMemo means the context object only gets a new reference when one of the
  // listed dependencies actually changes — preventing all consumers from
  // re-rendering on unrelated state updates.
  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      setLoading,
      initializing,
      isAuthenticated: !!user,
      updateUser,
    }),
    [user, loading, initializing, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
