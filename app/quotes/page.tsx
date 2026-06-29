"use client";

import { useQuoteResults } from "@/hooks/useQuoteResults";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import VehicleSummaryBar from "@/components/quotes/VehicleSummaryBar";
import FilterSidebar from "@/components/quotes/FilterSidebar";
import PlanCard from "@/components/quotes/PlanCard";
import QuoteLoading from "@/components/quotes/QuoteLoading";
import QuoteAuthGate from "@/components/quotes/QuoteAuthGate";
import EmptyState from "@/components/quotes/EmptyState";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function QuoteResultsPage() {
  const { user, ready } = useAuth();

  // Protected route: never render the quotes UI (or fetch) for a signed-out
  // user. Wait for auth to hydrate, then either gate or show the results.
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }
  if (!user) return <QuoteAuthGate />;

  return <QuoteResultsContent />;
}

function QuoteResultsContent() {
  const {
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
  } = useQuoteResults();

  // Full-screen branded loader while the first quote is fetched.
  if (loading) return <QuoteLoading />;

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
            {error ? (
              <div className="rounded-2xl border border-coral/30 bg-white px-6 py-12 text-center shadow-sm">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/10">
                  <AlertCircle className="h-7 w-7 text-coral" strokeWidth={1.8} />
                </span>
                <p className="mt-5 font-display text-lg font-bold text-ink">
                  {/(log ?in|sign ?in|token|unauthor)/i.test(error)
                    ? "Please sign in to see your quotes"
                    : "We couldn't fetch your quotes"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{error}</p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Home
                </Link>
              </div>
            ) : filteredPlans.length === 0 ? (
              <EmptyState onClearFilters={clearFilters} />
            ) : (
              <div className="relative">
                {/* Re-pricing overlay while filters update the quote */}
                {updating && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/60 pt-10 backdrop-blur-[1px]">
                    <span className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink shadow-md">
                      <Loader2 className="h-4 w-4 animate-spin text-brand" /> Updating prices…
                    </span>
                  </div>
                )}
                <motion.div
                  className={`space-y-4 transition-opacity ${updating ? "opacity-60" : ""}`}
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                >
                  {filteredPlans.map((plan, i) => (
                    <PlanCard key={plan.id} plan={plan} index={i} />
                  ))}
                </motion.div>
              </div>
            )}

            {/* Footer note */}
            {filteredPlans.length > 0 && (
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
