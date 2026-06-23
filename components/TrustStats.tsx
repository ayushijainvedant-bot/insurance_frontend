"use client";

import { motion } from "framer-motion";

import { trustStats } from "@/data/trust-stats";

export default function TrustStats() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          What makes{" "}
          <span className="bg-gradient-to-r from-brand to-violet bg-clip-text text-transparent">
            Vedant Insurance
          </span>{" "}
          one of India&apos;s most trusted insurance marketplaces
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="rounded-xl border-l-4 border-brand bg-paper p-5"
            >
              <p className="font-display text-2xl font-extrabold text-brand sm:text-3xl">{stat.num}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
