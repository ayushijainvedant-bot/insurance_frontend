"use client";

import {
  createContext, useContext, useEffect, useMemo, useState,
} from "react";

import { listProducts } from "@/services/products";
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
 * Backend-driven: the catalogue comes entirely from the products API. On
 * failure the list stays empty and `error` is surfaced so consumers can show
 * an appropriate message (no bundled static fallback).
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
        setCategories(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load insurance plans.");
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
