"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  Car,
  Star,
  Wrench,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanDetailDrawer from "@/components/quotes/PlanDetailDrawer";
import type { InsurancePlan } from "@/types";

interface PlanCardProps {
  plan: InsurancePlan;
  index: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

function InsurerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet font-display text-sm font-bold text-white shadow-md shadow-brand/25">
      {initials}
    </span>
  );
}

function CoverageTypeBadge({ type }: { type: InsurancePlan["coverageType"] }) {
  const map = {
    comprehensive: { label: "Comprehensive", class: "border-brand/30 bg-brand/8 text-brand" },
    "third-party": { label: "Third Party", class: "border-violet/30 bg-violet/8 text-violet" },
    "own-damage": { label: "Own Damage", class: "border-teal/30 bg-teal/8 text-teal" },
  };
  const { label, class: cls } = map[type];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold ${cls}`}>
      {label}
    </span>
  );
}

export default function PlanCard({ plan, index }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  // Carry the quote inputs (already in the URL) + this plan's identifiers
  // onto the proposal page.
  function buyNow() {
    const params = new URLSearchParams(window.location.search);
    params.set("enquiryId", plan.id);
    params.set("premium", String(plan.premiumAmount));
    params.set("insurer", plan.insurerName);
    // Carry the chosen insurer offering so create-quote targets the right provider.
    if (plan.providerProductId) params.set("providerProductId", plan.providerProductId);
    router.push(`/proposal?${params.toString()}`);
  }

  return (
    <motion.article
      id={`plan-card-${plan.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={`group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        plan.isRecommended
          ? "border-brand/40 bg-linear-to-br from-brand/6 via-white to-violet/6 ring-1 ring-brand/15"
          : "border-line bg-linear-to-br from-white to-paper"
      }`}
    >
      {/* Soft decorative glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-brand/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-violet/5 blur-3xl" />

      {/* Recommended ribbon */}
      {plan.isRecommended && (
        <div className="absolute -top-px left-5 flex items-center gap-1 rounded-b-lg bg-linear-to-r from-brand to-violet px-3 py-1 text-[0.65rem] font-bold text-white shadow-sm shadow-brand/30">
          <Sparkles className="h-3 w-3" />
          Recommended
        </div>
      )}

      <div className={`relative p-5 ${plan.isRecommended ? "pt-7" : ""}`}>
        {/* ── TOP ROW: insurer + premium ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Insurer identity */}
          <div className="flex items-center gap-3">
            <InsurerAvatar name={plan.insurerName} />
            <div>
              <p className="font-display text-[0.9rem] font-bold text-ink">
                {plan.insurerName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <CoverageTypeBadge type={plan.coverageType} />
                <span className="text-[0.65rem] text-ink-soft">
                  {plan.policyTenure}yr policy
                </span>
              </div>
            </div>
          </div>

          {/* Premium */}
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-ink">
              ₹{fmt(plan.premiumAmount)}
            </p>
            <p className="text-xs text-ink-soft">annual premium</p>
          </div>
        </div>

        {/* ── METRICS STRIP ── */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {/* IDV */}
          <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-white/70 p-3 backdrop-blur-sm">
            <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wide text-ink-soft">
              <Car className="h-3 w-3 text-brand" /> IDV
            </span>
            <span className="font-display text-sm font-bold text-ink">
              ₹{fmt(plan.idvAmount)}
            </span>
            <span className="text-[0.6rem] text-ink-soft">Coverage value</span>
          </div>

          {/* Claim ratio */}
          <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-white/70 p-3 backdrop-blur-sm">
            <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wide text-ink-soft">
              <Star className="h-3 w-3 text-amber" /> Claim
            </span>
            <span
              className={`font-display text-sm font-bold ${
                plan.claimSettlementRatio >= 98
                  ? "text-teal"
                  : plan.claimSettlementRatio >= 95
                  ? "text-amber"
                  : "text-coral"
              }`}
            >
              {plan.claimSettlementRatio}%
            </span>
            <span className="text-[0.6rem] text-ink-soft">Settlement ratio</span>
          </div>

          {/* Cashless garages */}
          <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-white/70 p-3 backdrop-blur-sm">
            <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wide text-ink-soft">
              <Wrench className="h-3 w-3 text-violet" /> Garages
            </span>
            <span className="font-display text-sm font-bold text-ink">
              {(plan.cashlessGarageCount / 1000).toFixed(1)}K+
            </span>
            <span className="text-[0.6rem] text-ink-soft">Cashless network</span>
          </div>
        </div>

        {/* ── KEY BENEFITS ── */}
        <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {plan.keyBenefits.slice(0, 4).map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs text-ink-soft">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
              {b}
            </li>
          ))}
        </ul>

        {/* ── ADD-ON HIGHLIGHTS ── */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.addOns
            .filter((a) => a.included)
            .map((a) => (
              <span
                key={a.name}
                className="rounded-full border border-violet/25 bg-violet/8 px-2 py-0.5 text-[0.65rem] font-semibold text-violet"
              >
                {a.name}
              </span>
            ))}
        </div>

        {/* ── FOOTER: expand + CTAs ── */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            id={`expand-${plan.id}`}
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-dark"
          >
            {expanded ? "Hide details" : "View coverage details"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <div className="flex items-center gap-2">
            <Button
              id={`details-${plan.id}`}
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((e) => !e)}
              className="text-xs"
            >
              Details
            </Button>
            <Button
              id={`buy-${plan.id}`}
              size="sm"
              onClick={buyNow}
              className="gap-1.5 bg-linear-to-r from-brand to-violet text-white shadow-md shadow-brand/25 hover:opacity-90"
            >
              Buy Now <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* ── INLINE DETAIL DRAWER ── */}
        <PlanDetailDrawer plan={plan} isOpen={expanded} />
      </div>
    </motion.article>
  );
}
