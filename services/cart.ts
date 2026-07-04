import { api, extractApiError } from "@/services/api";

/**
 * Cart service — saved quotes the customer can buy later.
 *
 * Backend (insurance-backend src/routes/front/cart.routes.ts, auth required):
 *   GET    /user/cart        -> { data: CartItem[] }
 *   POST   /user/cart        -> { data: CartItem }   (deduped by enquiryId)
 *   DELETE /user/cart/:id
 */

export interface CartItem {
  id: string;
  enquiryId: string;
  providerProductId: string | null;
  insurerName: string | null;
  premium: number | null;
  category: string | null;
  coverageType: string | null;
  vehicleLabel: string | null;
  proposalQuery: string;        // the /proposal query string that resumes checkout
  createdAt: string;
}

export interface AddCartInput {
  enquiryId: string;
  proposalQuery: string;
  providerProductId?: string | null;
  insurerName?: string;
  premium?: number | null;
  category?: string;
  coverageType?: string;
  vehicleLabel?: string;
}

export async function getCart(): Promise<CartItem[]> {
  try {
    const { data } = await api.get<{ data?: CartItem[] }>("/user/cart");
    return data?.data ?? [];
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't load your cart."));
  }
}

export async function addToCart(input: AddCartInput): Promise<CartItem> {
  try {
    const { data } = await api.post<{ data?: CartItem }>("/user/cart", input);
    if (!data?.data) throw new Error("Unexpected response from server.");
    return data.data;
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't add this plan to your cart."));
  }
}

export async function removeFromCart(id: string): Promise<void> {
  try {
    await api.delete(`/user/cart/${id}`);
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't remove this item."));
  }
}
