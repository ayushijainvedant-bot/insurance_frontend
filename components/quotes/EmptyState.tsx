"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-20 text-center">
      {/* Icon */}
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/8">
        <SlidersHorizontal className="h-8 w-8 text-brand" strokeWidth={1.5} />
      </span>

      <p className="mt-5 font-display text-xl font-bold text-ink">
        No plans match your filters
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        Try adjusting or removing some of your active filters to see available
        insurance plans.
      </p>

      <Button
        variant="outline"
        size="default"
        className="mt-7"
        onClick={onClearFilters}
        id="clear-filters-empty-state"
      >
        Clear All Filters
      </Button>
    </div>
  );
}
