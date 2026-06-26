"use client";

import { motion } from "framer-motion";
import { ScanSearch, Zap, ArrowRight, Target } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-295 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-[2rem] font-bold leading-[1.18] text-ink sm:text-[2.6rem] lg:text-[3.1rem]"
          >
            Let&apos;s find you<br />
            the <span className="bg-linear-to-r from-brand to-violet bg-clip-text text-transparent">Best Insurance</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 flex flex-wrap gap-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <ScanSearch className="h-5 w-5 text-brand" />
              </span>
              <span className="text-sm font-semibold text-ink">
                51 insurers offering<br />lowest prices
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/10">
                <Zap className="h-5 w-5 text-coral" />
              </span>
              <span className="text-sm font-semibold text-ink">
                Quick, easy &amp;<br />hassle free
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand via-brand to-violet p-8 text-white shadow-xl shadow-brand/20 sm:p-10"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/10" />
          <Target className="absolute right-6 top-1/2 h-28 w-28 -translate-y-1/2 text-white/15 sm:right-10 sm:h-36 sm:w-36" />

          <p className="relative font-mono text-xs uppercase tracking-wide text-white/70">Investment Plans</p>
          <p className="relative mt-3 font-display text-2xl font-bold leading-snug sm:text-3xl">
            Invest ₹10,000/month<br />and get
          </p>
          <p className="relative mt-1 font-display text-3xl font-extrabold text-amber sm:text-4xl">
            ₹1 Crore Returns*
          </p>
          <span className="relative mt-2 inline-block rounded-full bg-coral px-3 py-1 text-xs font-bold">
            In-Built Life Cover
          </span>

          <a
            href="#"
            className="relative mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand transition-transform hover:-translate-y-0.5"
          >
            View plans <ArrowRight className="h-4 w-4" />
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
