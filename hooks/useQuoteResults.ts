"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { InsurancePlan, QuoteContext, QuoteFilters, SortKey } from "@/types";

import { decodeQuoteInput, fetchQuoteResults } from "@/services/quote";

const DEFAULT_FILTERS: QuoteFilters = {
  addons: [],
  deductible: null,
  accessories: [],
};

// Session-lived cache of successful quote results, keyed by the quote inputs +
// filters. Lets back-navigation (e.g. cart → back) re-show results instantly
// instead of re-hitting the flaky upstream quote API and risking an error.
// Cleared on a full page reload.
const RESULTS_CACHE = new Map<string, QuoteContext>();
const cacheKey = (filters: QuoteFilters) =>
  (typeof window !== "undefined" ? window.location.search : "") + "|" + JSON.stringify(filters);

function applySorting(plans: InsurancePlan[], sort: SortKey): InsurancePlan[] {
  const copy = [...plans];
  switch (sort) {
    case "premium_asc":
      return copy.sort((a, b) => a.premiumAmount - b.premiumAmount);
    case "premium_desc":
      return copy.sort((a, b) => b.premiumAmount - a.premiumAmount);
    case "idv_desc":
      return copy.sort((a, b) => b.idvAmount - a.idvAmount);
    case "idv_asc":
      return copy.sort((a, b) => a.idvAmount - b.idvAmount);
    default:
      return copy.sort((a, b) => a.premiumAmount - b.premiumAmount);
  }
}

export interface UseQuoteResultsReturn {
  context: QuoteContext | null;
  allPlans: InsurancePlan[];
  filteredPlans: InsurancePlan[];
  filters: QuoteFilters;
  sortKey: SortKey;
  loading: boolean;      // initial fetch
  updating: boolean;     // re-pricing after a filter change
  error: string | null;
  setFilters: (f: QuoteFilters) => void;
  setSortKey: (s: SortKey) => void;
  clearFilters: () => void;
}

export function useQuoteResults(): UseQuoteResultsReturn {
  const [context, setContext] = useState<QuoteContext | null>(null);
  const [allPlans, setAllPlans] = useState<InsurancePlan[]>([]);
  const [filters, setFilters] = useState<QuoteFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("premium_asc");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loadedRef = useRef(false);

  // Fetch on mount AND whenever the filters change (re-price). The inputs
  // come from the URL; the selected add-ons/accessories/deductible are sent
  // to the backend so it re-prices. A short debounce coalesces rapid toggles.
  useEffect(() => {
    const input = decodeQuoteInput(new URLSearchParams(window.location.search));
    if (!input) {
      router.replace("/");
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect --
       hydrating from cache / starting a fetch on mount or filter change; intentional. */
    // Serve from the session cache when we've already fetched these exact
    // inputs — avoids the failing re-fetch after back-navigation.
    const key = cacheKey(filters);
    const cached = RESULTS_CACHE.get(key);
    if (cached) {
      setContext(cached);
      setAllPlans(cached.plans || []);
      loadedRef.current = true;
      setLoading(false);
      setUpdating(false);
      setError(null);
      return;
    }

    const first = !loadedRef.current;
    let active = true;
    if (first) setLoading(true); else setUpdating(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const timer = setTimeout(() => {
      fetchQuoteResults(input, filters)
        .then((ctx) => {
          if (!active) return;
          RESULTS_CACHE.set(key, ctx);
          setContext(ctx);
          setAllPlans(ctx.plans || []);
          loadedRef.current = true;
        })
        .catch((err: unknown) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : "Could not fetch quotes. Please try again.");
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
          setUpdating(false);
        });
    }, first ? 0 : 350);

    return () => { active = false; clearTimeout(timer); };
  }, [filters, router]);

  // Sorting stays client-side; filtering/re-pricing is server-side.
  const filteredPlans = useMemo(
    () => applySorting(allPlans, sortKey),
    [allPlans, sortKey],
  );

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  return {
    context,
    allPlans,
    filteredPlans,
    filters,
    sortKey,
    loading,
    updating,
    error,
    setFilters,
    setSortKey,
    clearFilters,
  };
}
