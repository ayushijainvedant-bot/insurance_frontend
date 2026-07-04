"use client";

import { Check, FileText, ShieldCheck, CreditCard } from "lucide-react";

const STEPS = [
  { label: "Proposal", icon: FileText },
  { label: "KYC", icon: ShieldCheck },
  { label: "Payment", icon: CreditCard },
];

/**
 * Circular-icon progress stepper for the purchase journey. Completed steps show
 * a teal ring + green check badge, the active step is a filled brand circle, and
 * upcoming steps are outlined with a number badge. When `onStepClick` is
 * provided, completed steps become clickable to go back and edit.
 */
export default function CheckoutStepper({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <div className="flex items-start">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = !!onStepClick && done;
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              title={clickable ? `Back to ${label}` : undefined}
              className={`flex flex-col items-center gap-2 ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-14 sm:w-14 ${
                  done
                    ? "border-2 border-teal bg-white text-teal"
                    : active
                    ? "bg-linear-to-br from-brand to-violet text-white shadow-lg shadow-brand/30 ring-4 ring-brand/10"
                    : "border-2 border-line bg-white text-ink-soft"
                } ${clickable ? "hover:ring-4 hover:ring-teal/15" : ""}`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.9} />
                {/* corner badge: check when done, number otherwise */}
                <span
                  className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-extrabold ring-2 ring-white ${
                    done
                      ? "bg-teal text-white"
                      : active
                      ? "bg-white text-brand shadow-sm"
                      : "bg-paper text-ink-soft"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
              </span>
              <span
                className={`text-[0.72rem] font-bold tracking-wide transition-colors ${
                  active ? "text-brand" : done ? "text-ink" : "text-ink-soft"
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="relative mx-2 mt-6 h-1 flex-1 self-start overflow-hidden rounded-full bg-line sm:mx-3 sm:mt-7">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full bg-teal transition-all duration-500 ${
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
