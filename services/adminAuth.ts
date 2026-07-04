import { cmsApi } from "@/services/cmsApi";
import { extractApiError } from "@/services/api";
import type { AuthUser } from "@/types";

/**
 * Admin (CMS) auth service.
 *
 * Backend (insurance-backend src/routes/cms/auth.routes.ts):
 *   POST /cms/auth/login  { email, password } -> { user, token }
 *   GET  /cms/auth/me     (admin token)       -> { data: admin }
 */

export interface AdminAuthResult {
  user: AuthUser;
  token: string;
}

export async function adminLogin(email: string, password: string): Promise<AdminAuthResult> {
  try {
    const { data } = await cmsApi.post<AdminAuthResult & { message?: string }>(
      "/cms/auth/login",
      { email: email.trim(), password },
    );
    if (!data?.token || !data?.user) {
      throw new Error("Unexpected response from server.");
    }
    return { user: data.user, token: data.token };
  } catch (err) {
    throw new Error(extractApiError(err, "Incorrect email or password."));
  }
}
