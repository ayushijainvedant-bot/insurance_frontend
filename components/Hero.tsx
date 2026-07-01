"use client";

import { motion } from "framer-motion";
import { ScanSearch, Zap, ArrowRight, Target, Star, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: ScanSearch, tint: "bg-brand/10 text-brand", title: "51 insurers", sub: "offering lowest prices" },
  { icon: Zap, tint: "bg-coral/10 text-coral", title: "Quick & easy", sub: "buy in 3 minutes" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-white to-paper px-4 py-14 sm:px-6 lg:py-20">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-violet/8 blur-3xl" />

      <div className="relative mx-auto grid max-w-295 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          {/* Trust badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/5 px-3 py-1.5 text-xs font-bold text-brand"
          >
            <span className="flex items-center gap-0.5 text-amber">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber text-amber" />)}
            </span>
            Trusted by 2M+ Indians · IRDAI regulated
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
            className="relative mt-5 font-display text-[2rem] font-bold leading-[1.18] text-ink sm:text-[2.6rem] lg:text-[3.1rem]"
          >
            Let&apos;s find you<br />
            the{" "}
            <span className="relative inline-block">
              <span className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-brand/25 to-violet/25 blur-2xl" />
              <span className="bg-linear-to-r from-brand to-violet bg-clip-text text-transparent">Best Insurance</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base"
          >
            Compare plans from India&apos;s top insurers, get the lowest price, and buy in minutes — no spam calls, no paperwork.
          </motion.p>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-8 grid gap-3 sm:grid-cols-2"
          >
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${f.tint}`}>
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="text-sm text-ink">
                  <span className="block font-bold">{f.title}</span>
                  <span className="text-ink-soft">{f.sub}</span>
                </span>
              </div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-5 flex items-center gap-1.5 text-xs text-ink-soft"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-teal" /> 100% secure · Free to compare · Your data is never shared.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.15 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand via-brand to-violet p-8 text-white shadow-2xl shadow-brand/25 sm:p-10"
        >
          {/* Floating accents */}
          <motion.div
            animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10"
          />
          <motion.div
            animate={{ y: [0, 10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/10"
          />
          <Target className="absolute right-6 top-1/2 h-28 w-28 -translate-y-1/2 text-white/15 sm:right-10 sm:h-36 sm:w-36" />

          <p className="relative font-mono text-xs uppercase tracking-wide text-white/70">Investment Plans</p>
          <p className="relative mt-3 font-display text-2xl font-bold leading-snug sm:text-3xl">
            Invest ₹10,000/month<br />and get
          </p>
          <p className="relative mt-1 font-display text-3xl font-extrabold text-amber sm:text-4xl">
            ₹1 Crore Returns*
          </p>
          <span className="relative mt-2 inline-block rounded-full bg-coral px-3 py-1 text-xs font-bold shadow-lg shadow-coral/30">
            In-Built Life Cover
          </span>

          <a
            href="#"
            className="group relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand shadow-lg transition-transform hover:-translate-y-0.5"
          >
            View plans <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          <p className="relative mt-6 text-[0.65rem] leading-snug text-white/60">
            *Standard T&amp;C Apply. In Unit Linked Insurance Plans, investment risk in the investment
            portfolio is borne by the policyholder and returns are not guaranteed.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
