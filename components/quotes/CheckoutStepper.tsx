"use client";

import { Check, FileText, ShieldCheck, CreditCard, BadgeCheck } from "lucide-react";

const STEPS = [
  { label: "Proposal", icon: FileText },
  { label: "KYC", icon: ShieldCheck },
  { label: "Payment", icon: CreditCard },
  { label: "Policy", icon: BadgeCheck },
];

/** Horizontal progress stepper for the purchase journey. */
export default function CheckoutStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300 ${
                  done
                    ? "bg-teal text-white shadow-md shadow-teal/30"
                    : active
                    ? "bg-linear-to-br from-brand to-violet text-white shadow-lg shadow-brand/30 ring-4 ring-brand/10"
                    : "border border-line bg-white text-ink-soft"
                }`}
              >
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />}
              </span>
              <span
                className={`text-[0.7rem] font-bold tracking-wide transition-colors ${
                  active ? "text-brand" : done ? "text-ink" : "text-ink-soft"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="relative mx-2 -mt-5 h-0.5 flex-1 overflow-hidden rounded-full bg-line sm:mx-3">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-teal to-teal transition-all duration-500 ${
                    done ? "w-full" : "w-0"
                  }`}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
