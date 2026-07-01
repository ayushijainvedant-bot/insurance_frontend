"use client";

import { Check, FileText, ShieldCheck, CreditCard } from "lucide-react";

const STEPS = [
  { label: "Proposal", icon: FileText },
  { label: "KYC", icon: ShieldCheck },
  { label: "Payment", icon: CreditCard },
];

/**
 * Horizontal progress stepper for the purchase journey. When `onStepClick` is
 * provided, already-completed steps become clickable so the user can go back
 * and edit an earlier step.
 */
export default function CheckoutStepper({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <div className="flex items-center">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = !!onStepClick && done;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              title={clickable ? `Back to ${label}` : undefined}
              className={`flex flex-col items-center gap-1.5 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300 ${
                  done
                    ? "bg-teal text-white shadow-md shadow-teal/30"
                    : active
                    ? "bg-linear-to-br from-brand to-violet text-white shadow-lg shadow-brand/30 ring-4 ring-brand/10"
                    : "border border-line bg-white text-ink-soft"
                } ${clickable ? "hover:ring-4 hover:ring-teal/15" : ""}`}
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
            </button>
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
