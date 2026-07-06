"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { QuoteFilters } from "@/types";

/**
 * Holds the results-page filter selection (addons / deductible / accessories)
 * so it survives the client-side navigation from /quotes to /proposal without
 * bloating the URL. Keyed by enquiryId so the proposal only applies the filters
 * that belong to the quote being bought.
 *
 * In-memory only (Context): a hard refresh on /proposal clears it and the
 * proposal falls back to no extra filters — which still creates a valid quote.
 */
interface SelectedFiltersValue {
  set: (enquiryId: string, filters: QuoteFilters) => void;
  get: (enquiryId: string) => QuoteFilters | undefined;
}

const SelectedFiltersContext = createContext<SelectedFiltersValue | null>(null);

export function SelectedFiltersProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Record<string, QuoteFilters>>({});

  const set = useCallback((enquiryId: string, filters: QuoteFilters) => {
    if (!enquiryId) return;
    setStore((prev) => ({ ...prev, [enquiryId]: filters }));
  }, []);

  const get = useCallback(
    (enquiryId: string) => (enquiryId ? store[enquiryId] : undefined),
    [store],
  );

  const value = useMemo(() => ({ set, get }), [set, get]);
  return <SelectedFiltersContext.Provider value={value}>{children}</SelectedFiltersContext.Provider>;
}

export function useSelectedFilters(): SelectedFiltersValue {
  const ctx = useContext(SelectedFiltersContext);
  if (!ctx) throw new Error("useSelectedFilters must be used within a <SelectedFiltersProvider>");
  return ctx;
}
