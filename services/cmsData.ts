import { cmsApi } from "@/services/cmsApi";
import { extractApiError } from "@/services/api";

/**
 * CMS data service — admin dashboard reads (insurance-backend cms/report.*).
 *   GET /cms/dashboard
 *   GET /cms/customers?page=&limit=&search=
 *   GET /cms/policies?page=&limit=&status=&provider=&search=
 *   GET /cms/payments?page=&limit=&status=
 */

export interface AdminStats {
  totalCustomers: number;
  totalPolicies: number;
  activePolicies: number;
  pendingPolicies: number;
  totalProviders: number;
  totalProducts: number;
  totalOfferings: number;
  paidPayments: number;
  pendingPayments: number;
  cartItems: number;
  revenue: number;
  policyValue: number;
}

export interface AdminPolicy {
  id: string;
  policyNumber: string | null;
  applicationId: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  premiumPaid: number | null;
  createdAt: string;
  customer: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  provider: { code: string; name: string } | null;
  productName: string | null;
  category: string | null;
}

export interface AdminPayment {
  id: string;
  policyNumber: string | null;
  applicationId: string | null;
  status: string | null;
  premium: number | null;
  paymentMode: string | null;
  createdAt: string;
  customer: { id: string; name: string | null; email: string | null } | null;
}

export interface AdminCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  policyCount: number;
}

export interface AdminDashboard {
  stats: AdminStats;
  recentPolicies: AdminPolicy[];
  recentPayments: AdminPayment[];
}

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

const emptyPage = <T>(page = 1, limit = 10): Page<T> => ({ rows: [], total: 0, page, limit, pageCount: 1 });

export async function getAdminDashboard(): Promise<AdminDashboard> {
  try {
    const { data } = await cmsApi.get<{ data?: AdminDashboard }>("/cms/dashboard");
    return data?.data ?? {
      stats: {
        totalCustomers: 0, totalPolicies: 0, activePolicies: 0, pendingPolicies: 0,
        totalProviders: 0, totalProducts: 0, totalOfferings: 0,
        paidPayments: 0, pendingPayments: 0, cartItems: 0, revenue: 0, policyValue: 0,
      },
      recentPolicies: [], recentPayments: [],
    };
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't load the dashboard."));
  }
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  provider?: string;
}

function buildParams(q: ListQuery): Record<string, string | number> {
  const p: Record<string, string | number> = { page: q.page ?? 1, limit: q.limit ?? 10 };
  if (q.search) p.search = q.search;
  if (q.status && q.status !== "all") p.status = q.status;
  if (q.provider && q.provider !== "all") p.provider = q.provider;
  return p;
}

export async function listCustomers(q: ListQuery = {}): Promise<Page<AdminCustomer>> {
  try {
    const { data } = await cmsApi.get<{ data?: Page<AdminCustomer> }>("/cms/customers", { params: buildParams(q) });
    return data?.data ?? emptyPage<AdminCustomer>(q.page, q.limit);
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't load customers."));
  }
}

export async function listPolicies(q: ListQuery = {}): Promise<Page<AdminPolicy>> {
  try {
    const { data } = await cmsApi.get<{ data?: Page<AdminPolicy> }>("/cms/policies", { params: buildParams(q) });
    return data?.data ?? emptyPage<AdminPolicy>(q.page, q.limit);
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't load policies."));
  }
}

export async function listPayments(q: ListQuery = {}): Promise<Page<AdminPayment>> {
  try {
    const { data } = await cmsApi.get<{ data?: Page<AdminPayment> }>("/cms/payments", { params: buildParams(q) });
    return data?.data ?? emptyPage<AdminPayment>(q.page, q.limit);
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't load payments."));
  }
}
