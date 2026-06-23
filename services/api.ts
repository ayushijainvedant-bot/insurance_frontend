import axios, { AxiosError, AxiosHeaders } from "axios";

import { getToken, clearSession } from "@/services/tokenStorage";

/**
 * Central API layer — one configured axios instance shared by every
 * service. UI components never import axios directly; they go through a
 * service (e.g. `services/auth.ts`) which uses this client. That keeps
 * config, auth headers, and error handling in exactly one place.
 *
 * Base URL points at the backend's `/api` prefix (see insurance-backend
 * app.ts → `app.use('/api', apiRoutes)`), overridable per-environment via
 * NEXT_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

// Broadcast on 401 from an *authenticated* request (expired/invalid token)
// so the AuthProvider can drop the session without axios importing React.
export const AUTH_UNAUTHORIZED_EVENT = "va:auth-unauthorized";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach the access token to every call ──
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// ── Response interceptor: normalise errors + handle token expiry ──
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // A 401 on a request that carried a token means the session is no
    // longer valid (expired/invalid JWT) → clear it and notify the app.
    // 401s from the OTP endpoints (which carry no token) are normal auth
    // failures and must NOT log the user out, so we guard on the header.
    const sentAuth = Boolean(
      AxiosHeaders.from(error.config?.headers).get("Authorization"),
    );
    if (error.response?.status === 401 && sentAuth) {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Pull a human-readable message out of any axios failure. The backend's
 * `ReS` helper always returns `{ message, ...data }`, so we prefer that;
 * otherwise fall back to network/timeout/default copy.
 */
export function extractApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message as string | undefined;
    if (apiMessage) return apiMessage;
    if (error.code === "ECONNABORTED") return "Request timed out. Please try again.";
    if (!error.response) return "Network error. Check your connection and retry.";
  }
  return fallback;
}
