"use client";

import {
  createContext, useContext, useEffect, useMemo, useState,
} from "react";

import { listProducts } from "@/services/products";
import { categories as staticCategories } from "@/data/categories";
import type { InsuranceCategory } from "@/types";

interface ProductsContextValue {
  categories: InsuranceCategory[];
  loading: boolean;
  error: string | null;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

/**
 * App-wide products state (the project's Context-API pattern, alongside
 * AuthProvider). Fetches the catalogue ONCE at the provider and shares it
 * with every consumer — so CategoryGrid, GetQuoteModal, etc. all read the
 * same data and the API is hit a single time per load, instead of each
 * component firing its own request.
 *
 * Backend-driven with a safety net: if the products API can't be reached
 * (or returns nothing), it falls back to the bundled static catalogue so
 * the homepage and quote modal still render the plans. `error` is still
 * surfaced for visibility even when the fallback is used.
 */
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<InsuranceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listProducts()
      .then((data) => {
        if (!active) return;
        // Empty response → use the static catalogue rather than render blank.
        setCategories(data.length ? data : staticCategories);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load insurance plans.");
        setCategories(staticCategories); // graceful fallback to static values
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(
    () => ({ categories, loading, error }),
    [categories, loading, error],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within a <ProductsProvider>");
  return ctx;
}
