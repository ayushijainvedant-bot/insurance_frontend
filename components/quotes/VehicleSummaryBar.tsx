"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  CalendarClock,
  Shield,
  Pencil,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterSidebar from "@/components/quotes/FilterSidebar";
import type { QuoteContext, QuoteFilters, SortKey } from "@/types";

interface VehicleSummaryBarProps {
  context: QuoteContext;
  filters: QuoteFilters;
  sortKey: SortKey;
  onFiltersChange: (f: QuoteFilters) => void;
  onSortChange: (s: SortKey) => void;
  onClearFilters: () => void;
  totalPlans: number;
  filteredCount: number;
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
        <Icon className="h-4 w-4 text-brand" strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-[0.6rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export default function VehicleSummaryBar({
  context,
  filters,
  sortKey,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  totalPlans,
  filteredCount,
}: VehicleSummaryBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const expiryFormatted = context.policyExpiry
    ? new Date(context.policyExpiry).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const hasActiveFilters =
    filters.addons.length > 0 ||
    filters.deductible !== null ||
    filters.accessories.length > 0;

  return (
    <>
      {/* Sticky summary bar */}
      <div className="sticky top-[64px] z-30 border-b border-line bg-white/96 backdrop-blur-sm">
        <div className="mx-auto max-w-295 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Vehicle info */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-violet">
                  <Car className="h-5 w-5 text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-display text-[0.9rem] font-bold text-ink leading-tight">
                    {context.vehicleModel}
                  </p>
                  <p className="font-mono text-xs font-semibold text-ink-soft">
                    {context.registrationNumber}
                  </p>
                </div>
              </div>

              {/* Stats — hidden on mobile unless expanded */}
              <div
                className={`flex flex-wrap gap-4 transition-all ${
                  summaryExpanded ? "flex" : "hidden sm:flex"
                }`}
              >
                <Stat
                  icon={CalendarClock}
                  label="Policy Expiry"
                  value={expiryFormatted}
                />
                {context.selectedIdv !== null && (
                  <Stat
                    icon={Shield}
                    label="Selected IDV"
                    value={`₹${fmt(context.selectedIdv)}`}
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile: toggle stats */}
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand sm:hidden"
                onClick={() => setSummaryExpanded((o) => !o)}
                aria-label="Toggle vehicle details"
              >
                {summaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Mobile: filter button */}
              <button
                id="mobile-filter-toggle"
                type="button"
                onClick={() => setMobileFilterOpen((o) => !o)}
                className="relative flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand lg:hidden"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[0.55rem] font-bold text-white">
                    !
                  </span>
                )}
              </button>

              {/* Edit quote */}
              <Button
                id="edit-quote-btn"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Pencil className="h-3 w-3" />
                <span className="hidden sm:inline">Edit Quote</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFilterOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm overflow-y-auto bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-display text-sm font-bold text-ink">Filters & Sort</p>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="rounded-md p-1 text-ink-soft hover:text-ink"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <FilterSidebar
                  filters={filters}
                  sortKey={sortKey}
                  onFiltersChange={onFiltersChange}
                  onSortChange={onSortChange}
                  onClearAll={() => {
                    onClearFilters();
                    setMobileFilterOpen(false);
                  }}
                  totalPlans={totalPlans}
                  filteredCount={filteredCount}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
