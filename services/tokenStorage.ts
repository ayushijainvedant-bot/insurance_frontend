import type { AuthUser } from "@/types";

/**
 * Centralised auth-session persistence — the single place that knows
 * *where* and *how* the token + user are stored. Both the axios layer
 * (`services/api.ts`) and the React context (`hooks/useAuth.tsx`) read
 * through here so there's exactly one storage convention to reason about.
 *
 * Storage choice: the backend returns the JWT in the response body and
 * expects it back as an `Authorization: Bearer` header, so the token has
 * to be readable by JS — localStorage is the right fit for this stack.
 * (A more locked-down setup would have the backend set an httpOnly cookie;
 * that's a backend change, out of scope here.) Swapping the storage
 * backend later means editing only this file.
 *
 * The backend issues a single access token with no refresh token, so
 * there is intentionally no refresh-token slot below.
 */

const TOKEN_KEY = "va_auth_token";
const USER_KEY = "va_auth_user";

// SSR guard: these run in the browser only.
const hasWindow = () => typeof window !== "undefined";

export function getToken(): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: AuthUser, token: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // storage blocked/full — session still lives in React state for this tab
  }
}

export function clearSession(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}
