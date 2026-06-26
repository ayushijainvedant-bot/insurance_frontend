"use client";

import { motion } from "framer-motion";
import { useProducts } from "@/hooks/useProducts";
import { useQuoteModal } from "@/hooks/useQuoteModal";
import type { QuoteTabId } from "@/types";

const BADGE: Record<string, string> = {
  teal:  "bg-teal/10 text-teal",
  brand: "bg-brand/10 text-brand",
  coral: "bg-coral/10 text-coral",
  amber: "bg-amber/10 text-amber",
  violet:"bg-violet/10 text-violet",
};
const ICON_BG: Record<string, string> = {
  teal:  "bg-teal/10   text-teal",
  brand: "bg-brand/10  text-brand",
  coral: "bg-coral/10  text-coral",
  amber: "bg-amber/10  text-amber",
  violet:"bg-violet/10 text-violet",
};

export default function CategoryGrid() {
  const { categories, loading, error } = useProducts();
  const { openQuote } = useQuoteModal();

  return (
    <section className="bg-paper px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-295">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-brand">
              Our Plans
            </p>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Five plans. Every need covered.
            </h2>
          </div>
          <a href="#" className="hidden text-sm font-bold text-brand hover:underline sm:block">
            Compare all plans →
          </a>
        </div>

        {/* Backend-driven: no static catalogue. Show an error/empty state
            if the products API returns nothing. */}
        {!loading && categories.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-ink">
              {error ?? "No plans available right now."}
            </p>
            <p className="mt-1 text-xs text-ink-soft">Please refresh the page to try again.</p>
          </div>
        ) : (
        /* 5-card grid: on desktop, 5 equal columns */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {loading && categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
                >
                  <span className="h-7 bg-paper" />
                  <div className="flex flex-1 flex-col items-center gap-3 px-4 pb-5 pt-5">
                    <span className="h-14 w-14 rounded-2xl bg-paper" />
                    <span className="h-3 w-24 rounded bg-paper" />
                    <span className="h-2 w-32 rounded bg-paper" />
                    <div className="mt-1 w-full space-y-1.5">
                      <span className="block h-2 w-full rounded bg-paper" />
                      <span className="block h-2 w-5/6 rounded bg-paper" />
                      <span className="block h-2 w-4/6 rounded bg-paper" />
                    </div>
                  </div>
                  <div className="border-t border-line px-4 py-3">
                    <span className="mx-auto block h-3 w-20 rounded bg-paper" />
                  </div>
                </div>
              ))
            : categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                type="button"
                onClick={() => openQuote(cat.id as QuoteTabId)}
                key={cat.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                whileHover={{ y: -5 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand/8"
              >
                {/* badge */}
                <span className={`px-3 py-1.5 text-center text-[0.7rem] font-bold ${BADGE[cat.badgeColor]}`}>
                  {cat.badge}
                </span>

                {/* icon + name */}
                <div className="flex flex-1 flex-col items-center gap-3 px-4 pb-5 pt-5 text-center">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${ICON_BG[cat.badgeColor]}`}>
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[0.9rem] font-bold leading-tight text-ink">{cat.name}</p>
                    <p className="mt-1 text-xs text-ink-soft">{cat.tagline}</p>
                  </div>
                  <ul className="mt-1 w-full space-y-1 text-left">
                    {cat.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[0.72rem] text-ink-soft">
                        <span className="mt-0.5 text-teal">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA strip */}
                <div className="border-t border-line px-4 py-3">
                  <span className="block w-full text-center text-sm font-bold text-brand group-hover:underline">
                    {cat.cta} →
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
