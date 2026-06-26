"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Priya Sharma",
    location: "Mumbai, Maharashtra",
    plan: "Health Insurance",
    rating: 5,
    body: "I compared 8 plans in 5 minutes. The claim settlement ratio column was the thing that finally made me decide. Got my policy in under 10 minutes.",
    color: "border-teal/40 bg-teal/5",
    accent: "text-teal",
  },
  {
    name: "Rahul Mehta",
    location: "Bengaluru, Karnataka",
    plan: "Term Life Insurance",
    rating: 5,
    body: "Bought a ₹1 Crore term plan for just ₹780/month. The advisor explained the difference between policies without pushing me to the expensive one.",
    color: "border-brand/40 bg-brand/5",
    accent: "text-brand",
  },
  {
    name: "Anjali Verma",
    location: "Delhi, NCR",
    plan: "Two Wheeler Insurance",
    rating: 5,
    body: "Renewed my bike insurance in literally 3 minutes. Last year my company made me wait 2 days. Never going back.",
    color: "border-coral/40 bg-coral/5",
    accent: "text-coral",
  },
  {
    name: "Suresh Kumar",
    location: "Chennai, Tamil Nadu",
    plan: "Four Wheeler Insurance",
    rating: 5,
    body: "Filed a claim after an accident. The team helped me with every document and the insurer settled within 7 days. Genuinely impressive.",
    color: "border-violet/40 bg-violet/5",
    accent: "text-violet",
  },
  {
    name: "Neha Agarwal",
    location: "Pune, Maharashtra",
    plan: "Investment Plans",
    rating: 5,
    body: "The calculator showed me exactly what ₹5,000/month could grow to in 20 years. Bought a ULIP with in-built life cover. Very transparent.",
    color: "border-amber/40 bg-amber/5",
    accent: "text-amber",
  },
  {
    name: "Vikram Singh",
    location: "Jaipur, Rajasthan",
    plan: "Health Insurance",
    rating: 5,
    body: "Got my entire family covered — wife, two kids, and parents — under a single floater plan at a price I didn't think was possible.",
    color: "border-teal/40 bg-teal/5",
    accent: "text-teal",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-paper px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-295">
        <div className="mb-12 text-center">
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-brand">Real Reviews</p>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-[2rem]">
            9 million+ families{" "}
            <span className="bg-linear-to-r from-brand to-teal bg-clip-text text-transparent">trust us</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-sm text-ink-soft">
            Honest reviews from real customers — across all five plans we offer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
              className={`flex flex-col gap-4 rounded-2xl border-2 p-6 ${r.color}`}
            >
              <Quote className={`h-6 w-6 ${r.accent}`} />
              <p className="flex-1 text-[0.88rem] leading-relaxed text-ink">"{r.body}"</p>
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber text-amber" />
                  ))}
                </div>
                <p className="mt-1.5 text-sm font-bold text-ink">{r.name}</p>
                <p className="text-xs text-ink-soft">{r.location}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${r.color} ${r.accent}`}>
                  {r.plan}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
