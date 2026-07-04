import axios, { AxiosHeaders } from "axios";

import { API_BASE_URL } from "@/services/api";
import { getAdminToken, clearAdminSession } from "@/services/adminTokenStorage";

// Fired when a CMS request returns 401 with an admin token attached (expired /
// invalid) so the AdminAuthProvider can drop the session.
export const ADMIN_UNAUTHORIZED_EVENT = "va:admin-unauthorized";

/** Separate axios client for the CMS API — attaches the ADMIN token, not the customer one. */
export const cmsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

cmsApi.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

cmsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentAuth = Boolean(AxiosHeaders.from(error.config?.headers).get("Authorization"));
    if (error.response?.status === 401 && sentAuth) {
      clearAdminSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ADMIN_UNAUTHORIZED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);
