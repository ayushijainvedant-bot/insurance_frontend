"use client";

import { useEffect, useState } from "react";
import { Car, Info, Sparkles } from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MOTOR_PREVIOUS_INSURERS, MOTOR_NCB } from "@/services/quote";

const field =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export interface PreviousPolicy {
  previousInsurerCode: string;
  previousPolicyNumber: string;
  previousPolicyExpiryDate: string;
  previousNoClaimBonus: string;
  isClaimInLastYear: boolean;
}

export default function PreviousPolicyModal({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: PreviousPolicy | null;
  onSave: (v: PreviousPolicy) => void;
}) {
  const [insurer, setInsurer] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ncb, setNcb] = useState("ZERO");
  const [claim, setClaim] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Sync from the saved value each time the modal opens (fresh add or edit).
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- seed fields from the
       saved value when the dialog opens; intentional. */
    setInsurer(value?.previousInsurerCode ?? "");
    setPolicyNumber(value?.previousPolicyNumber ?? "");
    setExpiry(value?.previousPolicyExpiryDate ?? "");
    setNcb(value?.previousNoClaimBonus ?? "ZERO");
    setClaim(value?.isClaimInLastYear ?? false);
    setErr(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, value]);

  function handleSave() {
    if (!insurer || !policyNumber.trim() || !expiry) {
      setErr("Please enter your insurer, previous policy number and expiry date.");
      return;
    }
    onSave({
      previousInsurerCode: insurer,
      previousPolicyNumber: policyNumber.trim(),
      previousPolicyExpiryDate: expiry,
      // A claim last year resets the NCB to zero.
      previousNoClaimBonus: claim ? "ZERO" : ncb,
      isClaimInLastYear: claim,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-md shadow-brand/25">
            <Car className="h-6 w-6 text-white" strokeWidth={1.8} />
          </span>
          <DialogTitle>Previous policy details</DialogTitle>
          <DialogDescription>
            Tell us about your existing car policy to unlock your No Claim Bonus discount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-soft">Previous Insurer</label>
            <select className={field} value={insurer} onChange={(e) => setInsurer(e.target.value)}>
              <option value="" disabled>Select insurer</option>
              {MOTOR_PREVIOUS_INSURERS.map((i) => (
                <option key={i.code} value={i.code}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-soft">Previous Policy Number</label>
              <input
                className={field}
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="e.g. D700739276"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-soft">Policy Expiry Date</label>
              <input type="date" className={field} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-soft">Did you make a claim last year?</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ l: "No", v: false }, { l: "Yes", v: true }].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => setClaim(o.v)}
                  className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${
                    claim === o.v
                      ? "border-brand bg-brand/8 text-brand"
                      : "border-line text-ink-soft hover:border-brand/40"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {!claim && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink-soft">Previous No Claim Bonus (NCB)</label>
              <select className={field} value={ncb} onChange={(e) => setNcb(e.target.value)}>
                {MOTOR_NCB.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-teal/8 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={1.8} />
            <p className="text-[0.72rem] leading-relaxed text-ink-soft">
              Your NCB can save you up to <span className="font-bold text-teal">50%</span> on own-damage
              premium — a claim last year resets it to 0%.
            </p>
          </div>

          {err && <p className="text-xs text-coral">{err}</p>}

          <Button onClick={handleSave} className="w-full gap-1.5 bg-linear-to-r from-brand to-violet text-white hover:opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Save details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
