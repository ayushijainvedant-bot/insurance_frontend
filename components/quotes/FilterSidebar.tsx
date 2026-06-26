"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuoteFilters, SortKey } from "@/types";

interface FilterSidebarProps {
  filters: QuoteFilters;
  sortKey: SortKey;
  onFiltersChange: (f: QuoteFilters) => void;
  onSortChange: (s: SortKey) => void;
  onClearAll: () => void;
  totalPlans: number;
  filteredCount: number;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "premium_asc", label: "Premium low to high" },
  { key: "premium_desc", label: "Premium high to low" },
  { key: "idv_desc", label: "IDV high to low" },
  { key: "idv_asc", label: "IDV low to high" },
];

const RECOMMENDED_ADDONS = [
  "Zero Depreciation",
  "24x7 Roadside Assistance",
  "Battery Protection Cover",
  "Consumables"
];

const OTHER_ADDONS = [
  "Key & Lock Replacement",
  "Invoice Price Cover",
  "Tyre Protector",
  "Loss of Personal Belongings"
];

const DEDUCTIBLES = [
  { value: "zero", label: "Zero Deductible" },
  { value: "2500", label: "₹2500 Voluntary Deductible" },
  { value: "5000", label: "₹5000 Voluntary Deductible" },
  { value: "7500", label: "₹7500 Voluntary Deductible" },
  { value: "15000", label: "₹15000 Voluntary Deductible" },
];

const ACCIDENT_COVERS = [
  "Owner-Driver PA Cover",
  "Paid Driver Cover",
  "₹1 Lac Unnamed Passenger Cover",
  "₹2 Lac Unnamed Passenger Cover"
];

const ACCESSORIES_COVERS = [
  "Electrical Accessories",
  "Non-Electrical Accessories"
];

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wide text-ink"
      >
        {title}
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-ink-soft" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-ink-soft" />
        )}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line text-brand focus:ring-2 focus:ring-brand/20"
      />
      <span className="text-xs font-semibold text-ink-soft hover:text-ink">{label}</span>
    </label>
  );
}

function RadioItem({
  label,
  checked,
  onChange,
  name,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  name: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 border-line text-brand focus:ring-2 focus:ring-brand/20"
      />
      <span className="text-xs font-semibold text-ink-soft hover:text-ink">{label}</span>
    </label>
  );
}

export default function FilterSidebar({
  filters,
  sortKey,
  onFiltersChange,
  onSortChange,
  onClearAll,
  totalPlans,
  filteredCount,
}: FilterSidebarProps) {
  const hasActiveFilters =
    filters.recommendedAddons.length > 0 ||
    filters.otherAddons.length > 0 ||
    filters.deductible !== null ||
    filters.accidentCovers.length > 0 ||
    filters.accessoriesCovers.length > 0;

  function toggleArray(list: string[], item: string, checked: boolean) {
    return checked ? [...list, item] : list.filter((i) => i !== item);
  }

  return (
    <aside
      id="filter-sidebar"
      className="w-full rounded-2xl border border-line bg-white p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          <span className="font-display text-sm font-bold text-ink">Sort & Filter</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            id="clear-all-filters"
            className="flex items-center gap-1 text-[0.7rem] font-semibold text-coral hover:text-coral/80"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Sort ── */}
      <Section title="Sort by">
        {SORT_OPTIONS.map((opt) => (
          <RadioItem
            key={opt.key}
            id={`sort-${opt.key}`}
            name="sort"
            label={opt.label}
            checked={sortKey === opt.key}
            onChange={() => onSortChange(opt.key)}
          />
        ))}
      </Section>

      {/* ── Recommended Addons ── */}
      <Section title="Recommended Addons">
        {RECOMMENDED_ADDONS.map((name) => (
          <CheckItem
            key={name}
            id={`addon-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
            label={name}
            checked={filters.recommendedAddons.includes(name)}
            onChange={(v) =>
              onFiltersChange({
                ...filters,
                recommendedAddons: toggleArray(filters.recommendedAddons, name, v),
              })
            }
          />
        ))}
      </Section>

      {/* ── Other Addons ── */}
      <Section title="Other Addons" defaultOpen={false}>
        {OTHER_ADDONS.map((name) => (
          <CheckItem
            key={name}
            id={`addon-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
            label={name}
            checked={filters.otherAddons.includes(name)}
            onChange={(v) =>
              onFiltersChange({
                ...filters,
                otherAddons: toggleArray(filters.otherAddons, name, v),
              })
            }
          />
        ))}
      </Section>

      {/* ── Deductibles ── */}
      <Section title="Deductibles" defaultOpen={false}>
        {DEDUCTIBLES.map((opt) => (
          <RadioItem
            key={opt.value}
            id={`deductible-${opt.value}`}
            name="deductible"
            label={opt.label}
            checked={filters.deductible === opt.value}
            onChange={() => onFiltersChange({ ...filters, deductible: opt.value })}
          />
        ))}
      </Section>

      {/* ── Accident covers ── */}
      <Section title="Accident covers" defaultOpen={false}>
        {ACCIDENT_COVERS.map((name) => (
          <CheckItem
            key={name}
            id={`accident-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
            label={name}
            checked={filters.accidentCovers.includes(name)}
            onChange={(v) =>
              onFiltersChange({
                ...filters,
                accidentCovers: toggleArray(filters.accidentCovers, name, v),
              })
            }
          />
        ))}
      </Section>

      {/* ── Accessories cover ── */}
      <Section title="Accessories cover" defaultOpen={false}>
        {ACCESSORIES_COVERS.map((name) => (
          <CheckItem
            key={name}
            id={`accessory-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
            label={name}
            checked={filters.accessoriesCovers.includes(name)}
            onChange={(v) =>
              onFiltersChange({
                ...filters,
                accessoriesCovers: toggleArray(filters.accessoriesCovers, name, v),
              })
            }
          />
        ))}
      </Section>

      {hasActiveFilters && (
        <div className="mt-2">
          <Button
            id="apply-filters-btn"
            size="sm"
            className="w-full bg-linear-to-r from-brand to-violet text-white"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </aside>
  );
}
