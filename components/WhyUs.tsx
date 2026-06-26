"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck, ScanSearch, Zap, HeartHandshake,
  BadgePercent, Clock3, FileCheck2, Users,
} from "lucide-react";

const CARDS = [
  {
    icon: BadgePercent,
    title: "Lowest Price Guarantee",
    body: "We negotiate directly with 51 insurers so you always see the best available price — no hidden markups, ever.",
    accent: "from-teal/20 to-teal/5",
    iconBg: "bg-teal/10 text-teal",
  },
  {
    icon: ScanSearch,
    title: "Unbiased Comparison",
    body: "Our algorithm ranks plans by your actual needs — coverage amount, hospitals near you, claim history — not by who pays us more.",
    accent: "from-brand/15 to-brand/5",
    iconBg: "bg-brand/10 text-brand",
  },
  {
    icon: Zap,
    title: "Instant Policy Issuance",
    body: "Zero paperwork. Fill your details once, buy online and get your policy document in your inbox within minutes.",
    accent: "from-amber/15 to-amber/5",
    iconBg: "bg-amber/10 text-amber",
  },
  {
    icon: HeartHandshake,
    title: "Claim Support 24 × 7",
    body: "Our dedicated claims team walks with you from the first document to the final settlement — we don't disappear after you buy.",
    accent: "from-coral/15 to-coral/5",
    iconBg: "bg-coral/10 text-coral",
  },
  {
    icon: Clock3,
    title: "Renew in 3 Minutes",
    body: "Existing policy expiring? Renew any of our five plans in under 3 minutes — no inspections, no waiting period extension.",
    accent: "from-violet/15 to-violet/5",
    iconBg: "bg-violet/10 text-violet",
  },
  {
    icon: FileCheck2,
    title: "IRDAI Regulated Broker",
    body: "We are a fully licensed IRDAI insurance broker. Every plan listed on our platform is verified, legal and genuine.",
    accent: "from-teal/20 to-teal/5",
    iconBg: "bg-teal/10 text-teal",
  },
  {
    icon: ShieldCheck,
    title: "100% Data Privacy",
    body: "Your personal information is encrypted end-to-end. We never sell your data to third parties — full stop.",
    accent: "from-brand/15 to-brand/5",
    iconBg: "bg-brand/10 text-brand",
  },
  {
    icon: Users,
    title: "Trusted by 9 Million+",
    body: "Families, freelancers, startups and corporates across India choose Vedant Insurance because trust is earned, not claimed.",
    accent: "from-coral/15 to-coral/5",
    iconBg: "bg-coral/10 text-coral",
  },
];

export default function WhyUs() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-295">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-brand">
            Why Vedant Insurance
          </p>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-[2rem]">
            We do things a little{" "}
            <span className="bg-linear-to-r from-brand to-violet bg-clip-text text-transparent">
              differently
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-[540px] text-sm text-ink-soft sm:text-base">
            From the moment you compare to the day you file a claim, we&apos;re with you — not just selling you a policy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 4) * 0.07 }}
                className={`group rounded-2xl bg-linear-to-br p-6 ${card.accent} border border-line`}
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className="h-5.5 w-5.5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-display text-[0.95rem] font-bold text-ink">{card.title}</h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft">{card.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
