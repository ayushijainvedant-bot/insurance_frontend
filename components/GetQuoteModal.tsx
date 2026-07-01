"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

import {
  Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { encodeQuoteInput, MOTOR_PREVIOUS_INSURERS, MOTOR_NCB } from "@/services/quote";
import PreviousPolicyModal, { type PreviousPolicy } from "@/components/PreviousPolicyModal";
import type { QuoteTabId, TwoWheelerQuoteInput } from "@/types";

const input =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const BADGE: Record<string, string> = {
  teal: "border-teal/40 bg-teal/8 text-teal",
  brand:"border-brand/40 bg-brand/8 text-brand",
  coral:"border-coral/40 bg-coral/8 text-coral",
  amber:"border-amber/40 bg-amber/8 text-amber",
  violet:"border-violet/40 bg-violet/8 text-violet",
};

interface FormValues {
  // Common lead fields (term-life / health / four-wheeler / investment)
  name: string;
  mobile: string;
  city: string;
  dob: string;
  reg?: string;
  amount?: string;
  // Two-wheeler (motor) vehicle fields → sent to the quick-quote API
  vehicleMainCode?: string;
  licensePlateNumber?: string;
  pincode?: string;
  manufactureDate?: string;
  registrationDate?: string;
  isVehicleNew?: boolean;
}

export default function GetQuoteModal({
  open,
  onOpenChange,
  preselect = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselect?: QuoteTabId | null;
}) {
  const [step, setStep] = useState<"pick" | "details" | "done">("pick");
  const [chosen, setChosen] = useState<QuoteTabId | null>(null);
  const [prevPolicy, setPrevPolicy] = useState<PreviousPolicy | null>(null);
  const [prevModalOpen, setPrevModalOpen] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>();
  const { categories, loading, error } = useProducts();
  const router = useRouter();

  const chosenCat = categories.find((c) => c.id === chosen);
  const ChosenIcon = chosenCat?.icon;
  // Two- and four-wheeler share the motor vehicle form + quick-quote API.
  const isMotor = chosen === "two-wheeler" || chosen === "four-wheeler";
  // Existing (renewal) vehicle needs previous-policy details.
  const isRenewal = isMotor && !watch("isVehicleNew");

  // When opened, jump straight to a preselected plan's form (card click) or
  // start at the plan picker (the navbar "Get Best Quote" button).
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect --
       syncing the externally-controlled open/preselect props into the
       modal's starting step; intentional. */
    if (preselect) {
      setChosen(preselect);
      setStep("details");
    } else {
      setChosen(null);
      setStep("pick");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, preselect]);

  function pickPlan(id: QuoteTabId) {
    setChosen(id);
    setStep("details");
  }

  function onSubmit(values: FormValues) {
    // Motor (two/four-wheeler): encode the inputs into the /quotes URL and
    // let the results page fetch from the backend. The URL is the single
    // source of truth, so the link is shareable + refresh-safe (no client
    // storage). Other categories keep the lead-capture confirmation.
    if (isMotor) {
      const renewal = !values.isVehicleNew;
      // Previous-policy details are optional — sent only if the user added
      // them via the checkbox; we never block or auto-open the modal.
      const quoteInput: TwoWheelerQuoteInput = {
        category: chosenCat?.category ?? "",
        productCode: chosenCat?.productCode ?? "",
        subProductCode: chosenCat?.subProductCode ?? null,
        vehicleMainCode: values.vehicleMainCode ?? "",
        licensePlateNumber: values.licensePlateNumber ?? "",
        pincode: values.pincode ?? "",
        manufactureDate: values.manufactureDate ?? "",
        registrationDate: values.registrationDate ?? "",
        isVehicleNew: !!values.isVehicleNew,
        // Sent only for an existing (renewal) vehicle.
        ...(renewal && prevPolicy ? prevPolicy : {}),
      };
      onOpenChange(false);
      router.push(`/quotes?${encodeQuoteInput(quoteInput)}`);
      return;
    }
    setStep("done");
  }

  function handleOpen(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setStep("pick"); setChosen(null); reset();
        setPrevPolicy(null); setPrevModalOpen(false);
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        // Belt-and-suspenders: don't let interactions with the nested
        // "Previous policy" modal bubble up and close this one.
        onInteractOutside={(e) => { if (prevModalOpen) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (prevModalOpen) e.preventDefault(); }}
      >
        <AnimatePresence mode="wait">

          {/* ── STEP 1: pick a plan ── */}
          {step === "pick" && (
            <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <DialogHeader>
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-md shadow-brand/25">
                  <Sparkles className="h-6 w-6 text-white" strokeWidth={1.8} />
                </span>
                <DialogTitle>Which plan are you looking for?</DialogTitle>
                <DialogDescription>We offer 5 plans — pick one and we&apos;ll find the best quote for you.</DialogDescription>
              </DialogHeader>

              {loading && categories.length === 0 ? (
                <div className="flex items-center justify-center px-6 pb-10 pt-4 text-ink-soft">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : categories.length === 0 ? (
                <div className="px-6 pb-8 pt-2 text-center">
                  <p className="text-sm font-semibold text-ink">
                    {error ?? "No plans available right now."}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">Please try again in a moment.</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => pickPlan(cat.id as QuoteTabId)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${BADGE[cat.badgeColor]}`}
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
                      <div>
                        <p className="text-sm font-bold">{cat.name}</p>
                        <p className="mt-0.5 text-xs opacity-75">{cat.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: details form ── */}
          {step === "details" && chosenCat && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DialogHeader>
                <button
                  type="button"
                  onClick={() => { setStep("pick"); setChosen(null); }}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  ← Back
                </button>
                {ChosenIcon && (
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-md shadow-brand/25">
                    <ChosenIcon className="h-6 w-6 text-white" strokeWidth={1.8} />
                  </span>
                )}
                <DialogTitle>{chosenCat.name}</DialogTitle>
                <DialogDescription>Fill in a few details and we&apos;ll show you the best available quotes.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 pb-6">
                {isMotor ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Vehicle Main Code</label>
                        <input className={input} placeholder="e.g. 20102"
                          {...register("vehicleMainCode", { required: "Required" })} />
                        {errors.vehicleMainCode && <p className="mt-1 text-xs text-coral">{errors.vehicleMainCode.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-ink-soft">License Plate Number</label>
                        <input className={input} placeholder="BR-01-AB-1234"
                          {...register("licensePlateNumber", { required: "Required" })} />
                        {errors.licensePlateNumber && <p className="mt-1 text-xs text-coral">{errors.licensePlateNumber.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Pincode</label>
                        <input inputMode="numeric" maxLength={6} className={input} placeholder="e.g. 800001"
                          {...register("pincode", {
                            required: "Required",
                            pattern: { value: /^\d{6}$/, message: "Enter a valid 6-digit pincode" },
                          })} />
                        {errors.pincode && <p className="mt-1 text-xs text-coral">{errors.pincode.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Manufacture Date</label>
                        <input type="date" className={input}
                          {...register("manufactureDate", { required: "Required" })} />
                        {errors.manufactureDate && <p className="mt-1 text-xs text-coral">{errors.manufactureDate.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Registration Date</label>
                        <input type="date" className={input}
                          {...register("registrationDate", { required: "Required" })} />
                        {errors.registrationDate && <p className="mt-1 text-xs text-coral">{errors.registrationDate.message}</p>}
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input id="isVehicleNew" type="checkbox"
                          className="h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand/20"
                          {...register("isVehicleNew")} />
                        <label htmlFor="isVehicleNew" className="text-xs font-bold text-ink-soft">Is Vehicle New?</label>
                      </div>
                    </div>

                    {/* Existing (renewal) vehicle → collect previous-policy details in a dialog */}
                    {isRenewal && (
                      <div className="rounded-xl bg-paper p-4">
                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={!!prevPolicy}
                            onChange={(e) => {
                              if (e.target.checked) setPrevModalOpen(true);
                              else setPrevPolicy(null);
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand/20"
                          />
                          <span>
                            <span className="text-xs font-bold text-ink">Is previous insurer known?</span>
                            <span className="mt-0.5 block text-[0.7rem] text-ink-soft">
                              Renewals need your previous policy — it unlocks your No Claim Bonus discount.
                            </span>
                          </span>
                        </label>

                        {prevPolicy && (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5">
                            <div className="min-w-0 text-xs">
                              <p className="font-bold text-ink">
                                {MOTOR_PREVIOUS_INSURERS.find((i) => i.code === prevPolicy.previousInsurerCode)?.name
                                  ?? "Previous insurer"}
                              </p>
                              <p className="mt-0.5 text-ink-soft">
                                Policy {prevPolicy.previousPolicyNumber}
                                {" · Expires "}{prevPolicy.previousPolicyExpiryDate}
                                {" · NCB "}
                                {MOTOR_NCB.find((n) => n.value === prevPolicy.previousNoClaimBonus)?.label ?? "0%"}
                                {prevPolicy.isClaimInLastYear ? " · Claim made" : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPrevModalOpen(true)}
                              className="shrink-0 text-xs font-semibold text-brand hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink-soft">Full Name</label>
                    <input className={input} placeholder="Your full name"
                      {...register("name", { required: "Required" })} />
                    {errors.name && <p className="mt-1 text-xs text-coral">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink-soft">Mobile Number</label>
                    <input className={input} placeholder="98XXXXXXXX"
                      {...register("mobile", {
                        required: "Required",
                        pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" },
                      })} />
                    {errors.mobile && <p className="mt-1 text-xs text-coral">{errors.mobile.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink-soft">City</label>
                    <input className={input} placeholder="e.g. Mumbai"
                      {...register("city", { required: "Required" })} />
                    {errors.city && <p className="mt-1 text-xs text-coral">{errors.city.message}</p>}
                  </div>
                  {/* Show DOB for life/health */}
                  {(chosen === "term-life" || chosen === "health") && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-ink-soft">Date of Birth</label>
                      <input type="date" className={input}
                        {...register("dob", { required: "Required" })} />
                      {errors.dob && <p className="mt-1 text-xs text-coral">{errors.dob.message}</p>}
                    </div>
                  )}
                  {chosen === "investment" && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-ink-soft">Monthly Investment Amount (₹)</label>
                      <input type="number" className={input} placeholder="e.g. 10000"
                        {...register("amount", { required: "Required" })} />
                      {errors.amount && <p className="mt-1 text-xs text-coral">{errors.amount.message}</p>}
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Feature highlights */}
                <div className="rounded-xl bg-paper p-4">
                  <p className="mb-2 text-xs font-bold text-ink">What you get with {chosenCat.name}:</p>
                  {chosenCat.features.map((f) => (
                    <p key={f} className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" /> {f}
                    </p>
                  ))}
                </div>

                <Button type="submit" className="w-full bg-linear-to-r from-brand to-violet text-white">
                  Show Me the Best Quotes →
                </Button>
                <p className="text-center text-[0.7rem] text-ink-soft">
                  No spam. Your data is encrypted and never sold.
                </p>
              </form>
            </motion.div>
          )}

          {/* ── STEP 3: confirmation ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center px-6 py-14 text-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                <CheckCircle2 className="h-9 w-9 text-teal" />
              </span>
              <p className="mt-5 font-display text-xl font-bold text-ink">Quotes are on their way!</p>
              <p className="mt-2 text-sm text-ink-soft">
                We&apos;ve matched your needs with 51+ insurers. Check your mobile for a personalised comparison link.
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Our advisor will call you within 30 minutes during business hours.
              </p>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Nested so Radix's dismiss-layer stack keeps it independent —
            closing it must NOT close the quote modal. */}
        <PreviousPolicyModal
          open={prevModalOpen}
          onOpenChange={setPrevModalOpen}
          value={prevPolicy}
          onSave={setPrevPolicy}
        />
      </DialogContent>
    </Dialog>
  );
}
