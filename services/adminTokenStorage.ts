import type { AuthUser } from "@/types";

/**
 * CMS (admin) session persistence — kept entirely separate from the customer
 * session (`tokenStorage.ts`) under different keys, so an admin login and a
 * customer login can coexist and never mix tokens.
 */

const TOKEN_KEY = "va_admin_token";
const USER_KEY = "va_admin_user";

const hasWindow = () => typeof window !== "undefined";

export function getAdminToken(): string | null {
  if (!hasWindow()) return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getAdminUser(): AuthUser | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function setAdminSession(user: AuthUser, token: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* storage blocked — session lives in React state for this tab */ }
}

export function clearAdminSession(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}
