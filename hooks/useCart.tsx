"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { getCart, addToCart, removeFromCart, type CartItem, type AddCartInput } from "@/services/cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  loading: boolean;
  add: (input: AddCartInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  has: (enquiryId: string) => boolean;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * App-wide cart state (saved quotes), following the project's Context pattern.
 * Loads the cart once the user is known and clears it on sign-out. Must live
 * inside <AuthProvider> since it reads the auth session.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try { setItems(await getCart()); } catch { /* keep whatever we have */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (ready) refresh(); }, [ready, user, refresh]);

  const add = useCallback(async (input: AddCartInput) => {
    const item = await addToCart(input);
    // Dedup by enquiryId (backend upserts) and put the newest first.
    setItems((prev) => [item, ...prev.filter((p) => p.enquiryId !== item.enquiryId)]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await removeFromCart(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const has = useCallback((enquiryId: string) => items.some((i) => i.enquiryId === enquiryId), [items]);

  const value = useMemo(
    () => ({ items, count: items.length, loading, add, remove, has, refresh }),
    [items, loading, add, remove, has, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a <CartProvider>");
  return ctx;
}
