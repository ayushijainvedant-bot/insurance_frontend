"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Car, Trash2, ArrowRight, Loader2, Sparkles, ShieldCheck, Lock,
  ChevronDown, FileText, CalendarDays, MapPin, BadgeCheck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/services/cart";

const fmtINR = (n?: number | null) =>
  n == null ? "—" : `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;

const titleCase = (s?: string | null) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—";

const initials = (name?: string | null) =>
  (name ?? "GD").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "GD";

// "2012-10-10" → "10 Oct 2012"
const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Pull the quote details we saved in the resume URL into labelled tiles.
function quoteDetails(query: string) {
  const p = new URLSearchParams(query);
  return [
    { icon: Car, label: "Registration No.", value: p.get("licensePlateNumber"), mono: true },
    { icon: ShieldCheck, label: "Vehicle Category", value: p.get("category") ? titleCase(p.get("category")) : "" },
    { icon: MapPin, label: "Pincode", value: p.get("pincode") },
    { icon: CalendarDays, label: "Manufacture Date", value: fmtDate(p.get("manufactureDate")) },
    { icon: CalendarDays, label: "Registration Date", value: fmtDate(p.get("registrationDate")) },
    { icon: BadgeCheck, label: "Vehicle Condition", value: p.get("isVehicleNew") == null ? "" : p.get("isVehicleNew") === "true" ? "New" : "Used" },
  ].filter((d) => d.value) as { icon: React.ElementType; label: string; value: string; mono?: boolean }[];
}

export default function CartPage() {
  const { user, ready } = useAuth();
  const { items, count, loading, remove } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/cart");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-brand/6 via-paper to-paper pb-20">
        <section className="relative overflow-hidden border-b border-line bg-linear-to-br from-brand/8 via-violet/5 to-white">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Saved for later
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              Your cart {count > 0 && <span className="text-ink-soft">· {count}</span>}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">Plans you saved — pick up checkout whenever you&apos;re ready.</p>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
          {loading && items.length === 0 ? (
            <div className="space-y-3">
              {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl border border-line bg-white" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyCart />
          ) : (
            <>
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {items.map((item) => <CartRow key={item.id} item={item} onRemove={remove} />)}
                </AnimatePresence>
              </div>
              <p className="mt-6 flex items-center justify-center gap-1.5 text-[0.72rem] text-ink-soft">
                <Lock className="h-3 w-3 text-teal" /> Premiums are indicative and inclusive of GST · Encrypted · IRDAI regulated
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function CartRow({ item, onRemove }: { item: CartItem; onRemove: (id: string) => Promise<void> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const buy = () => router.push(`/proposal?${item.proposalQuery}`);
  const removeItem = async () => {
    setBusy(true);
    try { await onRemove(item.id); } finally { setBusy(false); }
  };

  const details = quoteDetails(item.proposalQuery);
  // Total is GST-inclusive; show an indicative base + 18% GST split.
  const total = item.premium ?? null;
  const base = total == null ? null : Math.round(total / 1.18);
  const gst = total == null || base == null ? null : total - base;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* accent strip */}
      <span className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand via-violet to-teal" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-brand/5 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet text-sm font-extrabold text-white shadow-md shadow-brand/25">
              {initials(item.insurerName)}
            </span>
            <div>
              <p className="font-display text-base font-bold text-ink">{item.insurerName ?? "Insurer"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                {item.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 font-semibold">
                    <Car className="h-3 w-3" /> {titleCase(item.category)}
                  </span>
                )}
                {item.coverageType && (
                  <span className="rounded-full border border-brand/25 bg-brand/8 px-2 py-0.5 font-bold text-brand">
                    {titleCase(item.coverageType)}
                  </span>
                )}
                {item.vehicleLabel && <span className="font-mono">{item.vehicleLabel}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-ink">{fmtINR(item.premium)}</p>
            <p className="text-[0.7rem] text-ink-soft">annual premium · incl. GST</p>
          </div>
        </div>

        {/* Details dropdown */}
        {details.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand transition hover:text-violet"
              aria-expanded={open}
            >
              <FileText className="h-3.5 w-3.5" />
              {open ? "Hide details" : "View details"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {details.map((d) => (
                      <div key={d.label} className="flex items-center gap-3 rounded-xl border border-line bg-paper/60 px-3.5 py-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                          <d.icon className="h-4 w-4 text-brand" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">{d.label}</p>
                          <p className={`truncate text-sm font-bold text-ink ${d.mono ? "font-mono" : ""}`}>{d.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indicative premium split */}
                  {total != null && (
                    <div className="mt-3 rounded-xl border border-brand/15 bg-brand/5 p-4">
                      <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">Premium breakdown (indicative)</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between text-ink-soft">
                          <span>Base premium</span><span className="font-semibold text-ink">{fmtINR(base)}</span>
                        </div>
                        <div className="flex items-center justify-between text-ink-soft">
                          <span>GST (18%)</span><span className="font-semibold text-ink">{fmtINR(gst)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-brand/15 pt-1.5">
                          <span className="font-bold text-ink">Total payable</span>
                          <span className="font-display text-base font-extrabold text-ink">{fmtINR(total)}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[0.66rem] leading-relaxed text-ink-soft">
                        Final premium &amp; exact tax split are confirmed on the proposal page.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <button onClick={removeItem} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink-soft transition hover:border-coral/40 hover:text-coral disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
          </button>
          <Button onClick={buy} size="sm"
            className="gap-1.5 bg-linear-to-r from-brand to-violet text-white shadow-md shadow-brand/25 hover:opacity-90">
            Buy now <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function EmptyCart() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-line bg-white p-12 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
        <ShoppingCart className="h-8 w-8 text-brand" />
      </span>
      <p className="mt-5 font-display text-lg font-bold text-ink">Your cart is empty</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">
        Compare plans and tap “Add to cart” to save them here for later.
      </p>
      <Link href="/" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90">
        Get a quote <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
        <ShieldCheck className="h-3.5 w-3.5 text-teal" /> <Lock className="h-3 w-3" /> Encrypted · IRDAI regulated
      </p>
    </div>
  );
}
