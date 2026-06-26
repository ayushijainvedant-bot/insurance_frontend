"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import {
  Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { quickQuote } from "@/services/quote";
import { setQuoteContext } from "@/services/quoteStore";
import type { InsurancePlan, QuoteContext, QuoteTabId, TwoWheelerQuoteInput } from "@/types";

const input =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const BADGE: Record<string, string> = {
  teal: "border-teal/40 bg-teal/8 text-teal",
  brand:"border-brand/40 bg-brand/8 text-brand",
  coral:"border-coral/40 bg-coral/8 text-coral",
  amber:"border-amber/40 bg-amber/8 text-amber",
  violet:"border-violet/40 bg-violet/8 text-violet",
};

// Shape of the backend quick-quote response: { message, data: ProviderQuote[] }.
interface DigitVehicle {
  make?: string;
  model?: string;
  licensePlateNumber?: string;
  vehicleIDV?: { idv?: number };
}
interface DigitCoverage { selection?: boolean }
interface DigitCoverages {
  thirdPartyLiability?: { selection?: boolean; netPremium?: string; isTPPD?: boolean };
  ownDamage?: { selection?: boolean; withZeroDepNetPremium?: string; withoutZeroDepNetPremium?: string };
  fire?: DigitCoverage;
  theft?: DigitCoverage;
  personalAccident?: { selection?: boolean; coverTerm?: number; coverAvailability?: string; netPremium?: string };
  addons?: {
    partsDepreciation?: DigitCoverage;
    engineProtection?: DigitCoverage;
    roadSideAssistance?: DigitCoverage;
    returnToInvoice?: DigitCoverage;
    consumables?: DigitCoverage;
    tyreProtection?: DigitCoverage;
  };
}
interface ProviderQuote {
  provider?: string;          // e.g. "DIGIT"
  premium?: number;           // gross premium as a number, e.g. 4030.88
  data?: {
    enquiryId?: string;
    grossPremium?: string;    // e.g. "INR 4030.88"
    netPremium?: string;
    vehicle?: DigitVehicle;
    contract?: { endDate?: string; coverages?: DigitCoverages };
  };
}

/** "INR 3416.00" → "₹3,416". Returns null when there's no usable value. */
function formatINR(val?: string | number): string | null {
  if (val == null) return null;
  const n = Number(String(val).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return `₹${n.toLocaleString("en-IN")}`;
}

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const { categories, loading, error } = useProducts();
  const router = useRouter();

  const chosenCat = categories.find((c) => c.id === chosen);
  // Two- and four-wheeler share the motor vehicle form + quick-quote API.
  const isMotor = chosen === "two-wheeler" || chosen === "four-wheeler";

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

  async function onSubmit(values: FormValues) {
    // Motor (two/four-wheeler) submits the vehicle payload to the backend
    // quick-quote API; the other categories keep the lead-capture flow.
    if (isMotor) {
      setSubmitError(null);
      setSubmitting(true);
      try {
        const payload: TwoWheelerQuoteInput = {
          category: chosenCat?.category ?? "",
          productCode: chosenCat?.productCode ?? "",
          subProductCode: chosenCat?.subProductCode ?? null,
          vehicleMainCode: values.vehicleMainCode ?? "",
          licensePlateNumber: values.licensePlateNumber ?? "",
          pincode: values.pincode ?? "",
          manufactureDate: values.manufactureDate ?? "",
          registrationDate: values.registrationDate ?? "",
          isVehicleNew: !!values.isVehicleNew,
        };
        const result = await quickQuote(payload) as { data?: ProviderQuote[] } | undefined;
        const quotes: ProviderQuote[] = Array.isArray(result?.data) ? result.data : [];

        const labelFor = (provider?: string) =>
          provider === "DIGIT" ? "Go Digit" : (provider ?? "Insurer");

        // Map each provider quote → an InsurancePlan, pulling the coverage
        // breakdown + add-ons from the response's contract.coverages.
        const plans: InsurancePlan[] = quotes
          .filter((q) => typeof q.premium === "number" && q.premium > 0)
          .map((q, i): InsurancePlan => {
            const cov = q.data?.contract?.coverages;
            const tpl = cov?.thirdPartyLiability;
            const od = cov?.ownDamage;
            const pa = cov?.personalAccident;
            const ad = cov?.addons;

            const tplPremium = formatINR(tpl?.netPremium);
            const paPremium = formatINR(pa?.netPremium);

            return {
              id: q.data?.enquiryId || `${q.provider ?? "quote"}-${i}`,
              insurerName: labelFor(q.provider),
              insurerLogo: undefined,
              premiumAmount: q.premium ?? 0,
              idvAmount: q.data?.vehicle?.vehicleIDV?.idv ?? 0,
              claimSettlementRatio: 96.5,   // not in quick-quote response
              cashlessGarageCount: 10500,   // not in quick-quote response
              keyBenefits: [
                od ? "Comprehensive own-damage cover" : null,
                tpl ? `Third-party liability${tplPremium ? ` · ${tplPremium}` : ""}` : null,
                pa?.coverAvailability === "AVAILABLE" ? "Personal accident cover available" : null,
                "Cashless garage network",
              ].filter(Boolean) as string[],
              addOns: [
                { name: "Zero Depreciation", included: !!ad?.partsDepreciation?.selection },
                { name: "Engine Protection", included: !!ad?.engineProtection?.selection },
                { name: "Roadside Assistance", included: !!ad?.roadSideAssistance?.selection },
                { name: "Return to Invoice", included: !!ad?.returnToInvoice?.selection },
                { name: "Consumables", included: !!ad?.consumables?.selection },
              ],
              isRecommended: i === 0,
              coverageType: "comprehensive",
              policyTenure: 1,
              coverageDetails: {
                ownDamage: od
                  ? `Own-damage cover against accidents, fire & theft${od.withZeroDepNetPremium != null ? " · zero-depreciation available" : ""}.`
                  : "Comprehensive own-damage protection.",
                thirdPartyLiability: tpl
                  ? `Third-party property & injury liability${tplPremium ? ` · net premium ${tplPremium}` : ""}.`
                  : "Covers third-party property damage and injuries.",
                personalAccident: pa
                  ? `${pa.coverAvailability === "AVAILABLE" ? "Available" : "Owner-driver cover"}${paPremium ? ` · ${paPremium}` : ""}${pa.coverTerm ? ` · ${pa.coverTerm}-yr term` : ""}.`
                  : "Personal accident cover for owner-driver.",
                naturalCalamities: cov?.fire?.selection ? "Covered" : "Included in comprehensive cover",
                theft: cov?.theft?.selection ? "Covered" : "Included in comprehensive cover",
              },
            };
          });

        // Build a friendly vehicle summary from the first quote's vehicle data.
        const vehicle = quotes[0]?.data?.vehicle;
        const vehicleModel = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ")
          || values.vehicleMainCode || "Your Vehicle";

        const ctx: QuoteContext = {
          registrationNumber: vehicle?.licensePlateNumber || values.licensePlateNumber || "",
          vehicleModel,
          policyExpiry: quotes[0]?.data?.contract?.endDate ?? values.registrationDate ?? null,
          selectedIdv: plans[0]?.idvAmount || null,
          quoteType: chosen ?? "two-wheeler",
          plans,
        };
        setQuoteContext(ctx);

        // Close modal and navigate to the results page
        onOpenChange(false);
        router.push("/quotes");
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep("done");
  }

  function handleOpen(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setStep("pick"); setChosen(null); reset();
        setSubmitting(false); setSubmitError(null);
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: pick a plan ── */}
          {step === "pick" && (
            <motion.div key="pick" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <DialogHeader>
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
                <p className="mb-1">
                  <button
                    type="button"
                    onClick={() => { setStep("pick"); setChosen(null); }}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    ← Back
                  </button>
                </p>
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

                {submitError && (
                  <motion.div
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral/8 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral/15">
                      <AlertCircle className="h-4 w-4 text-coral" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">
                        {/(log ?in|sign ?in|token|unauthor)/i.test(submitError)
                          ? "Please sign in to continue"
                          : "We couldn't fetch your quotes"}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{submitError}</p>
                    </div>
                  </motion.div>
                )}

                <Button type="submit" disabled={submitting} className="w-full bg-linear-to-r from-brand to-violet text-white">
                  {submitting
                    ? (<><Loader2 className="h-4 w-4 animate-spin" /> Fetching quotes…</>)
                    : "Show Me the Best Quotes →"}
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
      </DialogContent>
    </Dialog>
  );
}
