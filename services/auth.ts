import { api, extractApiError, extractFieldErrors } from "@/services/api";
import type { RequestOtpResult, VerifyOtpResult } from "@/types";

/**
 * Auth service — the only module that knows the backend's auth contract.
 * Components/hooks call these functions; they never touch axios directly.
 *
 * Backend endpoints (base http://localhost:4000/api/user/auth):
 *   POST /user/auth/signup     { name, phone, email, dob?, password } -> 201 { user, token }
 *   POST /user/auth/login      { email, password }                    -> { user, token }
 *   POST /user/auth/login-otp  { phone }                              -> { message, devOtp? }
 *   POST /user/auth/otp-verify { phone, otp }                         -> { message, user, token }
 *
 * Both reject with an `AuthError` carrying a user-facing message so the
 * UI can render auth-failure states without parsing raw axios errors.
 */

export class AuthError extends Error {
  /** Per-field validation reasons from a 400 (e.g. { email: "already in use" }). */
  fields?: Record<string, string>;
  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "AuthError";
    this.fields = fields;
  }
}

/** Details a new customer provides on the signup screen. */
export interface SignupInput {
  name: string;
  mobile: string;          // 10-digit or E.164 — normalised via toE164
  email: string;
  dob?: string;            // YYYY-MM-DD (optional)
  password: string;
}

/**
 * Convert a 10-digit Indian mobile number to the E.164 format the backend
 * validates against (`/^\+?[1-9]\d{7,14}$/`). The exact same string must
 * be sent to both endpoints, since the backend looks the user up by phone.
 */
export function toE164(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (mobile.trim().startsWith("+")) return `+${digits}`;
  // Assume an Indian number when no country code is supplied.
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

/** Create a new account. Returns the signed-in user + token (backend 201). */
export async function signup(input: SignupInput): Promise<VerifyOtpResult> {
  try {
    const { data } = await api.post<VerifyOtpResult & { message?: string }>(
      "/user/auth/signup",
      {
        name: input.name.trim(),
        phone: toE164(input.mobile),
        email: input.email.trim(),
        ...(input.dob ? { dob: input.dob } : {}),
        password: input.password,
      },
    );
    if (!data?.token || !data?.user) {
      throw new AuthError("Unexpected response from server. Please try again.");
    }
    return { user: data.user, token: data.token };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    // 400 → validation / duplicate email or phone; carry field reasons through.
    throw new AuthError(
      extractApiError(err, "Could not create your account. Please try again."),
      extractFieldErrors(err),
    );
  }
}

/** Email + password login. Returns the signed-in user + token. */
export async function loginWithPassword(email: string, password: string): Promise<VerifyOtpResult> {
  try {
    const { data } = await api.post<VerifyOtpResult & { message?: string }>(
      "/user/auth/login",
      { email: email.trim(), password },
    );
    if (!data?.token || !data?.user) {
      throw new AuthError("Unexpected response from server. Please try again.");
    }
    return { user: data.user, token: data.token };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    // 401 → invalid credentials.
    throw new AuthError(
      extractApiError(err, "Incorrect email or password."),
      extractFieldErrors(err),
    );
  }
}

/** Step 1 — request an OTP for a mobile number. */
export async function requestOtp(mobile: string): Promise<RequestOtpResult> {
  try {
    const { data } = await api.post<RequestOtpResult & { message?: string }>(
      "/user/auth/login-otp",
      { phone: toE164(mobile) },
    );
    return { devOtp: data?.devOtp };
  } catch (err) {
    throw new AuthError(extractApiError(err, "Could not send OTP. Please try again."));
  }
}

/** Step 2 — verify the OTP and return the signed-in user + token. */
export async function verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResult> {
  try {
    const { data } = await api.post<VerifyOtpResult & { message?: string }>(
      "/user/auth/otp-verify",
      { phone: toE164(mobile), otp },
    );
    if (!data?.token || !data?.user) {
      throw new AuthError("Unexpected response from server. Please try again.");
    }
    return { user: data.user, token: data.token };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    // 401 here → "Invalid or expired OTP" from the backend.
    throw new AuthError(extractApiError(err, "Incorrect OTP. Please check and try again."));
  }
}
