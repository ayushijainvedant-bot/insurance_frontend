import { cmsApi } from "@/services/cmsApi";
import { extractApiError } from "@/services/api";

/**
 * CMS catalog CRUD — products, providers, provider-products (offerings).
 * Backend: insurance-backend src/routes/cms/catalog.routes.ts (admin token).
 */

export interface CmsProduct {
  id: string;
  category: string;
  name: string;
  description: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt?: string;
}

export interface CmsProvider {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt?: string;
}

export interface CmsOffering {
  id: string;
  productId: string;
  providerId: string;
  productCode: string;
  subProductCode: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  product?: { id: string; name: string; category: string } | null;
  provider?: { id: string; code: string; name: string } | null;
  createdAt?: string;
}

async function run<T>(fn: () => Promise<T>, fallback: string): Promise<T> {
  try { return await fn(); }
  catch (err) { throw new Error(extractApiError(err, fallback)); }
}

/* ── Products ── */
export const listProductsCms = () =>
  run(async () => (await cmsApi.get<{ data?: CmsProduct[] }>("/cms/products")).data?.data ?? [], "Couldn't load products.");
export const createProductCms = (body: Partial<CmsProduct>) =>
  run(async () => (await cmsApi.post<{ data?: CmsProduct }>("/cms/products", body)).data?.data!, "Couldn't create product.");
export const updateProductCms = (id: string, body: Partial<CmsProduct>) =>
  run(async () => (await cmsApi.put<{ data?: CmsProduct }>(`/cms/products/${id}`, body)).data?.data!, "Couldn't update product.");
export const deleteProductCms = (id: string) =>
  run(async () => { await cmsApi.delete(`/cms/products/${id}`); }, "Couldn't delete product.");
export const setProductStatusCms = (id: string, isActive: boolean) =>
  run(async () => (await cmsApi.patch<{ data?: CmsProduct }>(`/cms/products/${id}/status`, { isActive })).data?.data!, "Couldn't change status.");

/* ── Providers ── */
export const listProvidersCms = () =>
  run(async () => (await cmsApi.get<{ data?: CmsProvider[] }>("/cms/providers")).data?.data ?? [], "Couldn't load providers.");
export const createProviderCms = (body: Partial<CmsProvider>) =>
  run(async () => (await cmsApi.post<{ data?: CmsProvider }>("/cms/providers", body)).data?.data!, "Couldn't create provider.");
export const updateProviderCms = (id: string, body: Partial<CmsProvider>) =>
  run(async () => (await cmsApi.put<{ data?: CmsProvider }>(`/cms/providers/${id}`, body)).data?.data!, "Couldn't update provider.");
export const deleteProviderCms = (id: string) =>
  run(async () => { await cmsApi.delete(`/cms/providers/${id}`); }, "Couldn't delete provider.");
export const setProviderStatusCms = (id: string, isActive: boolean) =>
  run(async () => (await cmsApi.patch<{ data?: CmsProvider }>(`/cms/providers/${id}/status`, { isActive })).data?.data!, "Couldn't change status.");

/* ── Offerings (provider-products) ── */
export const listOfferingsCms = () =>
  run(async () => (await cmsApi.get<{ data?: CmsOffering[] }>("/cms/provider-products")).data?.data ?? [], "Couldn't load offerings.");
export const createOfferingCms = (body: Partial<CmsOffering>) =>
  run(async () => (await cmsApi.post<{ data?: CmsOffering }>("/cms/provider-products", body)).data?.data!, "Couldn't create offering.");
export const updateOfferingCms = (id: string, body: Partial<CmsOffering>) =>
  run(async () => (await cmsApi.put<{ data?: CmsOffering }>(`/cms/provider-products/${id}`, body)).data?.data!, "Couldn't update offering.");
export const deleteOfferingCms = (id: string) =>
  run(async () => { await cmsApi.delete(`/cms/provider-products/${id}`); }, "Couldn't delete offering.");
export const setOfferingStatusCms = (id: string, isActive: boolean) =>
  run(async () => (await cmsApi.patch<{ data?: CmsOffering }>(`/cms/provider-products/${id}/status`, { isActive })).data?.data!, "Couldn't change status.");
