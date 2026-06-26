"use client";

import { useQuoteResults } from "@/hooks/useQuoteResults";
import Navbar from "@/components/Navbar";
import VehicleSummaryBar from "@/components/quotes/VehicleSummaryBar";
import FilterSidebar from "@/components/quotes/FilterSidebar";
import PlanCard from "@/components/quotes/PlanCard";
import QuoteResultsSkeleton from "@/components/quotes/QuoteResultsSkeleton";
import EmptyState from "@/components/quotes/EmptyState";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QuoteResultsPage() {
  const {
    context,
    allPlans,
    filteredPlans,
    filters,
    sortKey,
    loading,
    setFilters,
    setSortKey,
    clearFilters,
  } = useQuoteResults();

  return (
    <>
      <Navbar />

      {/* Vehicle summary + mobile filter trigger */}
      {context && (
        <VehicleSummaryBar
          context={context}
          filters={filters}
          sortKey={sortKey}
          onFiltersChange={setFilters}
          onSortChange={setSortKey}
          onClearFilters={clearFilters}
          totalPlans={allPlans.length}
          filteredCount={filteredPlans.length}
        />
      )}

      <main className="mx-auto max-w-295 px-4 py-8 sm:px-6">
        {/* Page heading */}
        <div className="mb-6">
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-brand"
            id="back-to-home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Available Insurance Plans
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {loading
                  ? "Fetching the best quotes for you…"
                  : `${filteredPlans.length} plan${filteredPlans.length !== 1 ? "s" : ""} found · Compare and choose what suits you best`}
              </p>
            </div>

            {/* Trust signal */}
            <div className="flex items-center gap-2 rounded-xl border border-teal/25 bg-teal/8 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-teal" strokeWidth={1.8} />
              <span className="text-xs font-semibold text-teal">
                51+ Insurer Partners · Prices 100% Transparent
              </span>
            </div>
          </div>
        </div>

        {/* ── Two-column layout: sidebar + plan list ── */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-32.5">
              <FilterSidebar
                filters={filters}
                sortKey={sortKey}
                onFiltersChange={setFilters}
                onSortChange={setSortKey}
                onClearAll={clearFilters}
                totalPlans={allPlans.length}
                filteredCount={filteredPlans.length}
              />
            </div>
          </aside>

          {/* Plan list */}
          <section aria-label="Insurance plan results">
            {loading ? (
              <QuoteResultsSkeleton />
            ) : filteredPlans.length === 0 ? (
              <EmptyState onClearFilters={clearFilters} />
            ) : (
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {filteredPlans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} index={i} />
                ))}
              </motion.div>
            )}

            {/* Footer note */}
            {!loading && filteredPlans.length > 0 && (
              <p className="mt-8 text-center text-xs leading-relaxed text-ink-soft">
                Premiums shown are indicative and inclusive of GST. Final premium may vary based on
                insurer underwriting. All plans are regulated by IRDAI.
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
