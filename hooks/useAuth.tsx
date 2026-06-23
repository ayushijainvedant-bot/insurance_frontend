"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

import type { AuthUser, VerifyOtpResult } from "@/types";
import { getUser, setSession, clearSession } from "@/services/tokenStorage";
import { AUTH_UNAUTHORIZED_EVENT } from "@/services/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;                       // true once we've read storage
  signIn: (result: VerifyOtpResult) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * App-wide auth state (the project's Context-API state pattern — no extra
 * store library). Restores the session from storage on reload, persists
 * new sessions via the centralised `tokenStorage`, and listens for the
 * "token expired" event the axios layer fires so an expired JWT logs the
 * user out everywhere at once.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const signIn = useCallback((result: VerifyOtpResult) => {
    setSession(result.user, result.token);
    setUser(result.user);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Restore session on mount + subscribe to forced logouts (token expiry).
  useEffect(() => {
    const restored = getUser();
    /* eslint-disable react-hooks/set-state-in-effect --
       one-time hydration from an external store (localStorage); intentional. */
    if (restored) setUser(restored);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    const onUnauthorized = () => setUser(null);
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, ready, signIn, signOut }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
