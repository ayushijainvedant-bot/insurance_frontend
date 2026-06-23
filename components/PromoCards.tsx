"use client";

import { motion } from "framer-motion";
import { PiggyBank, Home, MessageCircleQuestion, ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: PiggyBank,
    eyebrow: "Reach your financial goals",
    title: "Make investment simple with our SIP calculator",
    cta: "Calculate now",
    gradient: "from-violet to-coral",
  },
  {
    icon: Home,
    eyebrow: "Home Insurance",
    title: "₹50 Lakh Cover for Your Home Insurance starting at Just ₹80/month*",
    cta: "Check premium",
    gradient: "from-teal to-brand",
  },
  {
    icon: MessageCircleQuestion,
    eyebrow: "AskVA",
    title: "Got a question about insurance? Write to us",
    cta: "Ask now",
    gradient: "from-coral to-amber",
  },
];

export default function PromoCards() {
  return (
    <section className="bg-paper px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-5 sm:grid-cols-3">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.a
              href="#"
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-white transition-transform hover:-translate-y-1`}
            >
              <Icon className="h-7 w-7 text-white/90" />
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-white/75">{card.eyebrow}</p>
              <p className="mt-1.5 font-display text-lg font-bold leading-snug">{card.title}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold">
                {card.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
