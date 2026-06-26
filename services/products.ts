import { api, extractApiError } from "@/services/api";
import { CATEGORY_PRESENTATION, DEFAULT_PRESENTATION } from "@/data/categories";
import type { BackendProduct, InsuranceCategory } from "@/types";

/**
 * Products service — the only module that knows the backend's product
 * contract. UI components go through `useProducts` (which calls this);
 * they never touch axios directly.
 *
 * Backend endpoint (insurance-backend src/routes/front/product.routes.ts):
 *   GET /user/products[?category=]  ->  { message, data: BackendProduct[] }
 */

/** Map a raw backend product onto the InsuranceCategory shape the UI renders. */
export function toInsuranceCategory(product: BackendProduct): InsuranceCategory {
  const presentation = CATEGORY_PRESENTATION[product.category] ?? DEFAULT_PRESENTATION;
  return {
    id: presentation.id,
    name: product.name,
    badge: product.config?.badge ?? "",
    badgeColor: presentation.badgeColor,
    tagline: product.description ?? "",
    cta: "Get Quote",
    icon: presentation.icon,
    features: product.config?.features ?? [],
    category: product.category,
    productCode: product.productCode,
    subProductCode: product.subProductCode,
  };
}

/**
 * Fetch active products and map them to the homepage category cards.
 * Called once by the ProductsProvider, which holds the result in context
 * and shares it across the app (so the API is hit a single time).
 */
export async function listProducts(): Promise<InsuranceCategory[]> {
  try {
    const { data } = await api.get<{ message?: string; data?: BackendProduct[] }>(
      "/user/products",
    );
    return (data?.data ?? []).map(toInsuranceCategory);
  } catch (err) {
    throw new Error(extractApiError(err, "Could not load insurance plans."));
  }
}
