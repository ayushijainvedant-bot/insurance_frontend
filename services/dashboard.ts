import { api, extractApiError } from "@/services/api";
import type { AuthUser } from "@/types";

/**
 * Dashboard service — the signed-in customer's overview.
 *
 * Backend endpoint (insurance-backend src/routes/front/dashboard.routes.ts):
 *   GET /user/dashboard  (auth required — JWT attached by the api interceptor)
 *   -> { data: { user, stats, policies, payments } }
 */

export interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  pendingPolicies: number;
  totalPremium: number;
}

export interface ProviderRef {
  id?: string;
  code: string;
  name: string;
}

export interface DashboardProviderProduct {
  id: string;
  productCode: string | null;
  subProductCode: string | null;
  provider: ProviderRef | null;
  product: { id: string; name: string; category: string } | null;
}

export interface DashboardPolicy {
  id: string;
  policyNumber: string | null;
  applicationId: string | null;
  status: string | null;              // COMPLETE | INCOMPLETE | EFFECTIVE …
  startDate: string | null;
  endDate: string | null;
  premiumPaid: number | null;
  createdAt: string;
  providerProductId: string | null;
  // Which provider + product this policy was bought under.
  providerProduct: DashboardProviderProduct | null;
  provider: ProviderRef | null;       // flat convenience (from providerProduct.provider)
  productName: string | null;
  category: string | null;
}

export interface DashboardPayment {
  id: string;
  applicationId: string | null;
  policyNumber: string | null;
  status: string | null;              // PAID | NOT_PAID | PENDING …
  premium: number | null;
  paymentMode: string | null;
  paymentLink: string | null;
  createdAt: string;
}

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
}

export interface DashboardFilters {
  statuses: string[];
  providers: { code: string; name: string }[];
  categories: { value: string; label: string }[];
}

export interface PoliciesPage {
  rows: DashboardPolicy[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface Dashboard {
  user: DashboardUser | null;
  stats: DashboardStats;
  filters: DashboardFilters;
  policies: PoliciesPage;
  payments: DashboardPayment[];
}

export interface DashboardQuery {
  page?: number;
  limit?: number;
  status?: string;    // exact policy status
  provider?: string;  // provider code
  category?: string;  // product category
}

const EMPTY_FILTERS: DashboardFilters = { statuses: [], providers: [], categories: [] };
const emptyPolicies = (page: number, limit: number): PoliciesPage => ({
  rows: [], total: 0, page, limit, pageCount: 1,
});

export async function getDashboard(query: DashboardQuery = {}): Promise<Dashboard> {
  const { page = 1, limit = 5, status, provider, category } = query;
  const params: Record<string, string | number> = { page, limit };
  if (status && status !== "all") params.status = status;
  if (provider && provider !== "all") params.provider = provider;
  if (category && category !== "all") params.category = category;

  try {
    const { data } = await api.get<{ data?: Dashboard }>("/user/dashboard", { params });
    const d = data?.data;
    return {
      user: d?.user ?? null,
      stats: d?.stats ?? { totalPolicies: 0, activePolicies: 0, pendingPolicies: 0, totalPremium: 0 },
      filters: d?.filters ?? EMPTY_FILTERS,
      policies: d?.policies ?? emptyPolicies(page, limit),
      payments: d?.payments ?? [],
    };
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't load your dashboard. Please try again."));
  }
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;   // E.164, e.g. "+919876543210"
  dob?: string;     // YYYY-MM-DD
}

/** Update the signed-in user's profile → the refreshed user record. */
export async function updateProfile(payload: ProfileUpdate): Promise<AuthUser> {
  try {
    const { data } = await api.put<{ data?: AuthUser }>("/user/profile", payload);
    if (!data?.data) throw new Error("Unexpected response from server.");
    return data.data;
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't update your profile. Please try again."));
  }
}
