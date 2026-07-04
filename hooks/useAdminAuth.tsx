"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

import type { AuthUser } from "@/types";
import { getAdminUser, setAdminSession, clearAdminSession } from "@/services/adminTokenStorage";
import { ADMIN_UNAUTHORIZED_EVENT } from "@/services/cmsApi";
import type { AdminAuthResult } from "@/services/adminAuth";

interface AdminAuthContextValue {
  admin: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  signIn: (result: AdminAuthResult) => void;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * CMS auth state — separate from the customer AuthProvider, backed by its own
 * token storage. Wraps only the /cms routes (see app/cms/layout.tsx).
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const signIn = useCallback((result: AdminAuthResult) => {
    setAdminSession(result.user, result.token);
    setAdmin(result.user);
  }, []);

  const signOut = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
  }, []);

  useEffect(() => {
    const restored = getAdminUser();
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage. */
    if (restored) setAdmin(restored);
    setReady(true);

    const onUnauthorized = () => setAdmin(null);
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({ admin, isAuthenticated: !!admin, ready, signIn, signOut }),
    [admin, ready, signIn, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an <AdminAuthProvider>");
  return ctx;
}
