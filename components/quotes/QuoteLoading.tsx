"use client";

import { motion } from "framer-motion";
import { Car, Bike } from "lucide-react";

function LogoMark() {
  return (
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="qlLg" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#2952FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#qlLg)" />
      <path d="M20 10l7 3v6c0 5-3.2 8.2-7 9.5C16.2 27.2 13 24 13 19v-6l7-3z" fill="white" />
      <path d="M16.5 19.6l2.6 2.6 5-5.6" stroke="#2952FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATS = [
  { value: "4.6★", label: "Customer rating" },
  { value: "9M+", label: "Customers insured" },
  { value: "51+", label: "Insurer partners" },
  { value: "₹500Cr+", label: "Claims settled" },
];

/**
 * Full-screen branded loader shown while the first quote is fetched
 * (PolicyBazaar-style). The vehicle matches the selected category.
 */
export default function QuoteLoading() {
  const category =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("category")
      : null;
  const Vehicle = category === "two_wheeler" ? Bike : Car;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-white to-paper px-4 text-center">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-xl font-bold text-ink">
          vedant<span className="text-brand">insurance</span>
        </span>
      </div>

      {/* Please wait + animated dots */}
      <p className="mt-12 flex items-center gap-2 text-sm font-semibold text-ink-soft">
        Please wait
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
        Finding the best plans for you
      </h1>

      {/* Driving animation */}
      <div className="relative mt-14 h-16 w-full max-w-xl overflow-hidden">
        <motion.div
          className="absolute bottom-3"
          initial={{ x: "-15%" }}
          animate={{ x: "115%" }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        >
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
            <Vehicle className="h-10 w-10 text-brand" strokeWidth={1.6} />
          </motion.div>
        </motion.div>
        <div className="absolute bottom-0 w-full border-b-2 border-dashed border-line" />
      </div>

      {/* Trust cards */}
      <div className="mt-12 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-line bg-white px-4 py-3 shadow-sm"
          >
            <p className="font-display text-lg font-bold text-ink">{s.value}</p>
            <p className="mt-0.5 text-[0.7rem] font-semibold text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
