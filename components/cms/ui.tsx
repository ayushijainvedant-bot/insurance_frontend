"use client";

import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";

/* ── formatters ── */
export const fmtINR = (n?: number | null) =>
  n == null ? "—" : `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;

export const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const titleCase = (s?: string | null) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—";

export const initials = (name?: string | null) =>
  (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

/* ── status pill (policy + payment) ── */
const STATUS_TONE: Record<string, string> = {
  COMPLETE: "bg-teal/10 text-teal", EFFECTIVE: "bg-teal/10 text-teal", PAID: "bg-teal/10 text-teal",
  INCOMPLETE: "bg-amber/10 text-amber", PENDING: "bg-amber/10 text-amber", NOT_PAID: "bg-amber/10 text-amber",
  PENDING_DOCUMENTS: "bg-amber/10 text-amber",
};
export function StatusPill({ status }: { status?: string | null }) {
  const key = String(status ?? "").toUpperCase();
  const tone = STATUS_TONE[key] ?? "bg-ink/8 text-ink-soft";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${tone}`}>
      {titleCase(status) || "—"}
    </span>
  );
}

export function ActivePill({ active }: { active: boolean }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${active ? "bg-teal/10 text-teal" : "bg-ink/8 text-ink-soft"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ── avatar ── */
export function Avatar({ name }: { name?: string | null }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-violet text-[0.6rem] font-bold text-white">
      {initials(name)}
    </span>
  );
}

/* ── search box ── */
export function SearchBox({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
      />
    </div>
  );
}

/* ── table shell ── */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-brand/5 via-white to-violet/5 shadow-sm ${className}`}>
      {/* subtle brand accent so cards read as designed, not plain white */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-brand/60 via-violet/60 to-teal/60" />
      {children}
    </div>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      {/* Tinted header + zebra rows so tables don't read as a flat white grid.
          Applies to every CMS table via arbitrary variants (no per-page edits). */}
      <table
        className="w-full min-w-[640px] text-left text-sm
          [&_thead]:bg-linear-to-r [&_thead]:from-brand/6 [&_thead]:to-violet/6
          [&_thead_th]:border-b [&_thead_th]:border-line
          [&_tbody_tr:nth-child(even)]:bg-ink/4"
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft ${className}`}>{children}</th>;
}

export function Td({ children, className = "", title }: { children?: React.ReactNode; className?: string; title?: string }) {
  return <td title={title} className={`whitespace-nowrap px-4 py-3 align-middle text-ink ${className}`}>{children}</td>;
}

export function LoadingRows({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-line">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3"><div className="h-4 w-full max-w-32 animate-pulse rounded bg-paper" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr className="border-t border-line">
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-ink-soft">{label}</td>
    </tr>
  );
}

/* ── pagination ── */
export function Pagination({ page, pageCount, total, onPage, busy }: {
  page: number; pageCount: number; total: number; onPage: (p: number) => void; busy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <span className="flex items-center gap-2 text-xs text-ink-soft">
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
        <span>Page <b className="text-ink">{page}</b> of {pageCount} · {total} total</span>
      </span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button disabled={page >= pageCount} onClick={() => onPage(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
