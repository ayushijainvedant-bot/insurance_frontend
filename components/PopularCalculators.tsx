"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { calculatorGroups } from "@/data/calculators";

export default function PopularCalculators() {
  return (
    <section className="bg-paper px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-295">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Popular calculators</h2>
        <p className="mt-3 max-w-[680px] text-sm text-ink-soft sm:text-base">
          User-friendly calculators built to help you make informed financial decisions — explore the
          options below to get started.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {calculatorGroups.map((group, i) => {
            const Icon = group.icon;
            return (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <div className={`flex items-center gap-3 bg-linear-to-br ${group.gradient} px-5 py-5`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70">
                    <Icon className="h-5 w-5 text-ink" />
                  </span>
                  <p className="font-display text-base font-bold text-ink">{group.title}</p>
                </div>
                <ul className="divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-ink hover:bg-paper">
                        {item}
                        <ArrowRight className="h-4 w-4 text-ink-soft" />
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#" className="rounded-full border border-brand px-6 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white">
            View all health calculators
          </a>
          <a href="#" className="rounded-full border border-brand px-6 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white">
            View all financial calculators
          </a>
        </div>
      </div>
    </section>
  );
}
