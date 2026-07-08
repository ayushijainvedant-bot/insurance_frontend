"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Loader2, Sparkles, ArrowRight, Hash, Car, MapPin, Calendar, ShieldCheck, Lock } from "lucide-react";

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
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10";
const inputIcon =
  "w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10";
// Gradient for each plan's icon badge, keyed by the category's brand colour.
const ICON_GRAD: Record<string, string> = {
  teal:  "from-teal to-brand",
  brand: "from-brand to-violet",
  coral: "from-coral to-rose-500",
  amber: "from-amber to-orange-500",
  violet:"from-violet to-brand",
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
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>();
  const { categories, loading, error } = useProducts();
  const router = useRouter();

  const chosenCat = categories.find((c) => c.id === chosen);
  const ChosenIcon = chosenCat?.icon;
  // Two- and four-wheeler share the motor vehicle form + quick-quote API.
  const isMotor = chosen === "two-wheeler" || chosen === "four-wheeler";
  // Existing (renewal) vehicle needs previous-policy details.
  const isVehicleNew = useWatch({ control, name: "isVehicleNew" });
  const isRenewal = isMotor && !isVehicleNew;

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
        productId: chosenCat?.productId ?? "",
        category: chosenCat?.category ?? "",
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
        className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
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
                  // No insurer offers this product yet → show it, but disabled.
                  const disabled = !cat.isQuotable;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => pickPlan(cat.id as QuoteTabId)}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                        disabled
                          ? "cursor-not-allowed border-line bg-paper/50"
                          : "border-line bg-white hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/10"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-md ${ICON_GRAD[cat.badgeColor]} ${
                          disabled ? "opacity-45 grayscale" : "shadow-brand/20"
                        }`}
                      >
                        <Icon className="h-5 w-5 text-white" strokeWidth={1.9} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className={`text-sm font-bold ${disabled ? "text-ink-soft" : "text-ink"}`}>{cat.name}</p>
                          {disabled && (
                            <span className="rounded-full bg-ink/8 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-ink-soft">
                              Coming soon
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-soft">{cat.tagline}</p>
                      </div>

                      {!disabled && (
                        <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                      )}
                    </button>
                  );
                })}
              </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: details form ── */}
          {step === "details" && chosenCat && (
            <motion.div key="details" className="grid md:grid-cols-[288px_1fr]"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Decorative illustrated panel (desktop) */}
              <QuoteSideArt Icon={ChosenIcon} isMotor={isMotor} name={chosenCat.name} />

              {/* Form column */}
              <div>
              <DialogHeader>
                <button
                  type="button"
                  onClick={() => { setStep("pick"); setChosen(null); }}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  ← Back
                </button>
                {ChosenIcon && (
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-md shadow-brand/25 md:hidden">
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
                      <IconField label="Vehicle Main Code" icon={Hash} error={errors.vehicleMainCode?.message}>
                        <input className={inputIcon} placeholder="e.g. 20102"
                          {...register("vehicleMainCode", { required: "Required" })} />
                      </IconField>
                      <IconField label="License Plate Number" icon={Car} error={errors.licensePlateNumber?.message}>
                        <input className={inputIcon} placeholder="BR-01-AB-1234"
                          {...register("licensePlateNumber", { required: "Required" })} />
                      </IconField>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <IconField label="Pincode" icon={MapPin} error={errors.pincode?.message}>
                        <input inputMode="numeric" maxLength={6} className={inputIcon} placeholder="e.g. 800001"
                          {...register("pincode", {
                            required: "Required",
                            pattern: { value: /^\d{6}$/, message: "Enter a valid 6-digit pincode" },
                          })} />
                      </IconField>
                      <IconField label="Manufacture Date" icon={Calendar} error={errors.manufactureDate?.message}>
                        <input type="date" className={inputIcon}
                          {...register("manufactureDate", { required: "Required" })} />
                      </IconField>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <IconField label="Registration Date" icon={Calendar} error={errors.registrationDate?.message}>
                        <input type="date" className={inputIcon}
                          {...register("registrationDate", { required: "Required" })} />
                      </IconField>
                      <div className="flex items-end">
                        <label htmlFor="isVehicleNew"
                          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 transition hover:border-brand/40">
                          <span className="text-xs font-bold text-ink">Is Vehicle New?</span>
                          <input id="isVehicleNew" type="checkbox"
                            className="h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand/20"
                            {...register("isVehicleNew")} />
                        </label>
                      </div>
                    </div>

                    {/* Existing (renewal) vehicle → collect previous-policy details in a dialog */}
                    {isRenewal && (
                      <div className="rounded-xl border border-brand/15 bg-linear-to-br from-brand/5 to-white p-4">
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
                <div className="rounded-xl border border-teal/20 bg-linear-to-br from-teal/8 to-white p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink">
                    <Sparkles className="h-3.5 w-3.5 text-teal" /> What you get with {chosenCat.name}
                  </p>
                  {chosenCat.features.map((f) => (
                    <p key={f} className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" /> {f}
                    </p>
                  ))}
                </div>

                <Button type="submit" className="w-full gap-1.5 bg-linear-to-r from-brand to-violet py-5 text-white shadow-lg shadow-brand/25 transition hover:opacity-90">
                  <Sparkles className="h-4 w-4" /> Show Me the Best Quotes <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-[0.7rem] text-ink-soft">
                  No spam. Your data is encrypted and never sold.
                </p>
              </form>
              </div>
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

/** Decorative left panel for the details step — illustration + trust points.
 *  Hidden on mobile so the form takes the full width. */
function QuoteSideArt({ Icon, isMotor, name }: { Icon?: React.ElementType; isMotor: boolean; name: string }) {
  const BENEFITS = [
    "Compare 51+ insurers",
    "Lowest price, guaranteed",
    "No spam calls — ever",
    "Instant policy issuance",
  ];
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-brand via-brand to-violet p-7 text-white md:flex">
      {/* floating accents */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/12 blur-xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/8 blur-xl" />

      <div className="relative">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-white/70">{name}</p>
        <h3 className="mt-1 font-display text-xl font-extrabold leading-tight">
          Best quote in<br />3 minutes
        </h3>
      </div>

      {/* Illustration: a flat car + shield for motor, else the plan icon in a glass badge */}
      {isMotor ? (
        <CarShieldArt className="relative mx-auto my-5 w-full max-w-[210px]" />
      ) : (
        <span className="relative mx-auto my-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          {Icon && <Icon className="h-14 w-14 text-white" strokeWidth={1.5} />}
        </span>
      )}

      <ul className="relative space-y-2.5">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm font-medium text-white/90">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" strokeWidth={2.2} /> {b}
          </li>
        ))}
      </ul>

      <div className="relative mt-5 flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2.5 text-[0.72rem] font-semibold ring-1 ring-white/15">
        <ShieldCheck className="h-4 w-4 shrink-0" /> IRDAI regulated
        <span className="mx-1 h-3 w-px bg-white/30" />
        <Lock className="h-3.5 w-3.5 shrink-0" /> 256-bit secure
      </div>
    </div>
  );
}

/** Flat side-view car with a shield badge — inline SVG (CSP-safe, no assets). */
function CarShieldArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" fill="none" className={className} aria-hidden>
      {/* ground shadow */}
      <ellipse cx="132" cy="146" rx="104" ry="9" fill="#000" opacity="0.15" />
      {/* body */}
      <path
        d="M22 110 C22 94 34 90 46 88 L74 64 C80 58 88 55 98 55 L166 55 C178 55 186 60 192 70 L206 90 C222 92 238 96 238 110 L238 118 C238 124 234 127 228 127 L32 127 C26 127 22 124 22 118 Z"
        fill="white"
      />
      {/* windows */}
      <path d="M96 66 L150 66 C159 66 165 70 169 78 L176 88 L100 88 Z" fill="#1e2b52" opacity="0.9" />
      <path d="M100 66 L120 66 L120 88 L104 88 Z" fill="#2f47a0" opacity="0.55" />
      {/* door seam + handle */}
      <path d="M132 90 L132 122" stroke="#c9d3e8" strokeWidth="2" />
      <rect x="140" y="98" width="12" height="3" rx="1.5" fill="#c9d3e8" />
      {/* headlight / taillight */}
      <circle cx="231" cy="106" r="4" fill="#ffd54a" />
      <rect x="24" y="103" width="7" height="6" rx="2" fill="#ff6b5b" />
      {/* wheels */}
      <circle cx="80" cy="125" r="18" fill="#0f172a" />
      <circle cx="80" cy="125" r="7.5" fill="white" />
      <circle cx="196" cy="125" r="18" fill="#0f172a" />
      <circle cx="196" cy="125" r="7.5" fill="white" />
      {/* shield badge */}
      <g transform="translate(150 12)">
        <path d="M24 2 l19 7 v11 c0 11-8 18-19 22 -11-4-19-11-19-22 V9 z" fill="#12B39B" stroke="white" strokeWidth="2.5" />
        <path d="M15 22 l6 6 11-13" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Labelled field with a leading icon inside the input. */
function IconField({
  label, icon: Icon, error, children,
}: {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand/60" strokeWidth={1.9} />
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
