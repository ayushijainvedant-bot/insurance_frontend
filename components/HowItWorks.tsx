"use client";

import { motion } from "framer-motion";
import { ClipboardList, GitCompareArrows, CreditCard, FileCheck2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: ClipboardList,
    title: "Tell us your needs",
    body: "Click 'Get Best Quote', choose your plan type and fill in three quick fields. Takes 60 seconds.",
    color: "text-brand",
    bg: "bg-brand/10",
  },
  {
    n: "02",
    icon: GitCompareArrows,
    title: "Compare real quotes",
    body: "We instantly compare prices, coverage, and claim ratios from 51 insurers — side by side, no jargon.",
    color: "text-violet",
    bg: "bg-violet/10",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Buy online in minutes",
    body: "Pay securely. Your policy document lands in your email before you finish your chai.",
    color: "text-teal",
    bg: "bg-teal/10",
  },
  {
    n: "04",
    icon: FileCheck2,
    title: "We handle your claims",
    body: "If you ever need to file a claim, call us. Our team handles every step so you don't have to fight alone.",
    color: "text-coral",
    bg: "bg-coral/10",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-paper px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-295">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-brand">
            Simple Process
          </p>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-[2rem]">
            From comparison to claim in{" "}
            <span className="bg-linear-to-r from-coral to-amber bg-clip-text text-transparent">4 easy steps</span>
          </h2>
        </div>

        {/* connector line visible on desktop */}
        <div className="relative">
          <div className="absolute top-10 hidden h-px w-full bg-linear-to-r from-brand/20 via-teal/30 to-coral/20 lg:block" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.1 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <span className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg ${s.bg}`}>
                    <Icon className={`h-8 w-8 ${s.color}`} strokeWidth={1.6} />
                    <span className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-black text-white ${s.bg.replace("/10","").replace("bg-","bg-")} ${s.color.replace("text-","bg-").replace("/10","")}`}>
                      {s.n}
                    </span>
                  </span>
                  <h3 className="mt-5 font-display text-base font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft">{s.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
