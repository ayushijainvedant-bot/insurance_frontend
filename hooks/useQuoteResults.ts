"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InsurancePlan, QuoteContext, QuoteFilters, SortKey } from "@/types";
import { MOCK_PLANS } from "@/data/mockPlans";

import { getQuoteContext, clearQuoteContext } from "@/services/quoteStore";

const DEFAULT_FILTERS: QuoteFilters = {
  recommendedAddons: [],
  otherAddons: [],
  deductible: null,
  accidentCovers: [],
  accessoriesCovers: [],
};

function applyFilters(plans: InsurancePlan[], filters: QuoteFilters): InsurancePlan[] {
  return plans.filter((plan) => {
    // In a real app, these filters would check plan.addOns and plan.coverageDetails
    // Since we only have one Digit plan right now, we can just return true or filter based on mock logic.
    // For now, let's keep it simple: if any filter requires something not in the plan, exclude it.
    const planAddonNames = plan.addOns.filter((a) => a.included).map((a) => a.name);
    
    if (filters.recommendedAddons.length > 0) {
      const hasAll = filters.recommendedAddons.every((name) => planAddonNames.includes(name));
      if (!hasAll) return false;
    }
    
    if (filters.otherAddons.length > 0) {
      const hasAll = filters.otherAddons.every((name) => planAddonNames.includes(name));
      if (!hasAll) return false;
    }
    
    return true;
  });
}

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
  loading: boolean;
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
  const router = useRouter();
  useEffect(() => {
    try {
      const ctx = getQuoteContext();
      if (ctx) {
        setContext(ctx);
        setAllPlans(ctx.plans || []);
        setLoading(false);
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/");
    }
  }, [router]);

  // Derived filter + sort
  const filteredPlans = useMemo(
    () => applySorting(applyFilters(allPlans, filters), sortKey),
    [allPlans, filters, sortKey],
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
    setFilters,
    setSortKey,
    clearFilters,
  };
}
