"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import type { InsurancePlan } from "@/types";

interface PlanDetailDrawerProps {
  plan: InsurancePlan;
  isOpen: boolean;
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2.5 pr-4 text-xs font-semibold text-ink-soft">{label}</td>
      <td className="py-2.5 text-xs font-semibold text-ink">
        {value ?? <span className="text-ink-soft/60">—</span>}
      </td>
    </tr>
  );
}

export default function PlanDetailDrawer({ plan, isOpen }: PlanDetailDrawerProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="drawer"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="mt-4 border-t border-line pt-4">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Coverage breakdown */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">
                  <Info className="h-3.5 w-3.5" />
                  Coverage Breakdown
                </p>
                <table className="w-full">
                  <tbody>
                    <Row label="Own Damage" value={plan.coverageDetails?.ownDamage} />
                    <Row label="Third-Party Liability" value={plan.coverageDetails?.thirdPartyLiability} />
                    <Row label="Personal Accident" value={plan.coverageDetails?.personalAccident} />
                    <Row label="Natural Calamities" value={plan.coverageDetails?.naturalCalamities} />
                    <Row label="Theft" value={plan.coverageDetails?.theft} />
                  </tbody>
                </table>
              </div>

              {/* Add-ons list */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
                  Add-ons
                </p>
                <ul className="space-y-1.5">
                  {plan.addOns.map((addon) => (
                    <li key={addon.name} className="flex items-center gap-2">
                      {addon.included ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-ink-soft/40" />
                      )}
                      <span
                        className={`text-xs font-semibold ${
                          addon.included ? "text-ink" : "text-ink-soft/60"
                        }`}
                      >
                        {addon.name}
                        {addon.included && (
                          <span className="ml-1.5 rounded-full border border-teal/30 bg-teal/8 px-1.5 py-0.5 text-[0.6rem] font-bold text-teal">
                            Included
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Exclusions */}
            {plan.exclusions && plan.exclusions.length > 0 && (
              <div className="mt-4 rounded-xl border border-coral/20 bg-coral/5 p-3.5">
                <p className="mb-2 text-xs font-bold text-coral">Key Exclusions</p>
                <ul className="space-y-1">
                  {plan.exclusions.map((ex) => (
                    <li key={ex} className="flex items-start gap-2 text-xs text-ink-soft">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral/50" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-[0.65rem] leading-relaxed text-ink-soft/60">
              *Terms & conditions apply. Coverage subject to policy wordings. Premium inclusive of GST.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
