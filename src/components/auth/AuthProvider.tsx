"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthActionResult, AuthUser } from "@/lib/authTypes";
import { trackLogin, trackSignup, trackStudioActivated, type SignupAnalytics } from "@/lib/analytics";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<AuthActionResult>;
  forgotPassword: (email: string) => Promise<AuthActionResult>;
  updateProfile: (name: string) => Promise<AuthActionResult>;
  updateEmail: (newEmail: string, currentPassword: string) => Promise<AuthActionResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthActionResult>;
  signInWithGoogle: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(data: unknown): AuthUser | null {
  if (typeof data !== "object" || data === null) return null;
  const user = (data as { user?: unknown }).user;
  if (typeof user !== "object" || user === null) return null;
  const u = user as Record<string, unknown>;
  if (typeof u.id !== "string" || typeof u.email !== "string") return null;
  return {
    id: u.id,
    email: u.email,
    name: typeof u.name === "string" ? u.name : null,
    emailVerified: Boolean(u.emailVerified),
    hasPassword: Boolean(u.hasPassword),
    createdAt: typeof u.createdAt === "string" ? u.createdAt : "",
  };
}

function readError(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  return fallback;
}

function readSignupAnalytics(data: unknown): SignupAnalytics | null {
  if (typeof data !== "object" || data === null) return null;
  const analytics = (data as { signupAnalytics?: unknown }).signupAnalytics;
  if (typeof analytics !== "object" || analytics === null) return null;
  const a = analytics as Record<string, unknown>;
  if (a.method !== "email" && a.method !== "google") return null;
  return {
    method: a.method,
    utmSource: typeof a.utmSource === "string" ? a.utmSource : null,
    utmMedium: typeof a.utmMedium === "string" ? a.utmMedium : null,
    utmCampaign: typeof a.utmCampaign === "string" ? a.utmCampaign : null,
    landingType: typeof a.landingType === "string" ? a.landingType : null,
    landingPage: typeof a.landingPage === "string" ? a.landingPage : null,
    conversionPage: typeof a.conversionPage === "string" ? a.conversionPage : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);
      setUser(readUser(data));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // While signed in but unverified, watch for verification completed in another tab.
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const onFocus = () => void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, refresh]);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not sign you in.") };
      setUser(readUser(data));
      trackLogin("email");
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (email, password, name) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          conversionPage: typeof window !== "undefined" ? window.location.pathname : "/studio",
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not create your account.") };
      setUser(readUser(data));
      const analytics = readSignupAnalytics(data);
      if (analytics) {
        trackSignup(analytics);
        trackStudioActivated("email");
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const resendVerification = useCallback<AuthContextValue["resendVerification"]>(async () => {
    try {
      const res = await fetch("/api/auth/resend", { method: "POST" });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not send the email.") };
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const forgotPassword = useCallback<AuthContextValue["forgotPassword"]>(async (email) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not send the reset email.") };
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(async (name) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not update your profile.") };
      const nextUser = readUser(data);
      if (nextUser) setUser(nextUser);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const updateEmail = useCallback<AuthContextValue["updateEmail"]>(async (newEmail, currentPassword) => {
    try {
      const res = await fetch("/api/auth/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not update your email.") };
      const nextUser = readUser(data);
      if (nextUser) setUser(nextUser);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const changePassword = useCallback<AuthContextValue["changePassword"]>(async (currentPassword, newPassword) => {
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) return { ok: false, error: readError(data, "Could not change your password.") };
      const nextUser = readUser(data);
      if (nextUser) setUser(nextUser);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);

  const signInWithGoogle = useCallback(() => {
    window.location.href = "/api/auth/google";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh,
        signIn,
        signUp,
        signOut,
        resendVerification,
        forgotPassword,
        updateProfile,
        updateEmail,
        changePassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
