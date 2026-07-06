"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { FilterCatalog, QuoteFilters, SortKey } from "@/types";

interface FilterSidebarProps {
  filters: QuoteFilters;
  sortKey: SortKey;
  catalog?: FilterCatalog;   // supported filters (union across quoted insurers)
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
  catalog,
  onFiltersChange,
  onSortChange,
  onClearAll,
  totalPlans,
  filteredCount,
}: FilterSidebarProps) {
  const hasActiveFilters =
    filters.addons.length > 0 ||
    filters.deductible !== null ||
    filters.accessories.length > 0;

  const addons = catalog?.addons ?? [];
  const deductibles = catalog?.deductibles ?? [];
  const accessories = catalog?.accessories ?? [];

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

      {/* ── Addons ── */}
      {addons.length > 0 && (
        <Section title="Addons">
          {addons.map((name) => (
            <CheckItem
              key={name}
              id={`addon-${name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
              label={name}
              checked={filters.addons.includes(name)}
              onChange={(v) =>
                onFiltersChange({
                  ...filters,
                  addons: toggleArray(filters.addons, name, v),
                })
              }
            />
          ))}
        </Section>
      )}

      {/* ── Deductibles ── */}
      {deductibles.length > 0 && (
        <Section title="Deductibles" defaultOpen={false}>
          {deductibles.map((opt) => (
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
      )}

      {/* ── Accessories cover ── */}
      {accessories.length > 0 && (
        <Section title="Accessories cover" defaultOpen={false}>
          {accessories.map((label) => (
            <CheckItem
              key={label}
              id={`accessory-${label.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
              label={label}
              checked={filters.accessories.includes(label)}
              onChange={(v) =>
                onFiltersChange({
                  ...filters,
                  accessories: toggleArray(filters.accessories, label, v),
                })
              }
            />
          ))}
        </Section>
      )}

    </aside>
  );
}
