"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Lock, User, FileCheck2,
  CreditCard, FileText, BadgeCheck, ExternalLink, Sparkles, RefreshCw,
  AlertCircle, Phone, Clock, Car, CalendarDays,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import QuoteAuthGate from "@/components/quotes/QuoteAuthGate";
import CheckoutStepper from "@/components/quotes/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  decodeQuoteInput, buildCreateQuotePayload, createQuoteRequest, type ProposalForm,
} from "@/services/quote";
import { getPolicyStatus, startKyc, initiatePayment, downloadPolicyPdf, type StartKycInput } from "@/services/policy";
import type { TwoWheelerQuoteInput, AuthUser } from "@/types";

const field =
  "w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

const STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" }
];
const DOC_TYPES = ["PAN", "AADHAAR", "DRIVING_LICENSE", "PASSPORT", "VOTER_ID"];
const NOMINEE_RELATIONS = [
  { value: "SPOUSE", label: "Spouse" },
  { value: "SON", label: "Son" },
  { value: "DAUGHTER", label: "Daughter" },
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "BROTHER", label: "Brother" },
  { value: "SISTER", label: "Sister" },
  { value: "OTHER", label: "Other" },
];
// Two-sided documents need a back image; single-page ones (PAN/Passport) don't.
const docNeedsBack = (t: string) => t === "AADHAAR" || t === "DRIVING_LICENSE" || t === "VOTER_ID";
const MAX_DOC_BYTES = 500 * 1024; // backend multer limit — 500 KB per file
const tooBig = (v: FileList) => v?.[0] && v[0].size > MAX_DOC_BYTES;

const isKycDone = (s?: string) => /done|verif|success|complete/i.test(s ?? "");
const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));
// "INR 4420.28" → 4420.28
const inr = (s?: string) => Number(String(s ?? "").replace(/[^0-9.]/g, "")) || 0;
// "2027-05-29" → "29 May 2027"
const fmtDate = (d?: string) => {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type QuoteSummary = {
  policyNumber: string;
  vehicle: string;
  registration: string;
  startDate: string;
  endDate: string;
  netPremium: number;
  tax: number;
  grossPremium: number;
};

type KycForm = {
  idVerificationDocType: string;
  addressVerificationDocType: string;
  idFront: FileList;
  idBack: FileList;
  addressFront: FileList;
  addressBack: FileList;
};

const anim = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
};

export default function ProposalPage() {
  const { user, ready } = useAuth();
  if (!ready) return <FullLoader />;
  if (!user) return <QuoteAuthGate />;
  return <CheckoutContent user={user} />;
}

function CheckoutContent({ user }: { user: AuthUser }) {
  const router = useRouter();

  // Split the user's full name into first + last for the proposer fields.
  const [firstName, ...restName] = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = restName.join(" ");

  const [ctx, setCtx] = useState<
    { input: TwoWheelerQuoteInput; enquiryId: string; premium: number; insurer: string; providerProductId: string | null } | null
  >(null);
  const [step, setStep] = useState(0);          // 0 Proposal · 1 KYC · 2 Payment · 3 Policy
  const [policyNumber, setPolicyNumber] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  const [kycLink, setKycLink] = useState("");
  const [waiting, setWaiting] = useState(false); // polling after opening the Digit KYC link
  const [statusText, setStatusText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proposal = useForm<ProposalForm>({
    // Prefill from the signed-in user's profile. Name is split into first/last;
    // DOB (YYYY-MM-DD) and email map straight across.
    defaultValues: {
      gender: "MALE",
      firstName: firstName ?? "",
      lastName: lastName,
      email: user.email ?? "",
      dateOfBirth: user.dob ?? "",
      mobile: user.phone?.replace(/^\+?91/, "") ?? "",
    },
  });
  // KYC identity/address proof. Policy number, DOB and gender are NOT collected
  // here — they come from create-quote (see kycPrefill) and are sent automatically.
  const kycForm = useForm<KycForm>({
    defaultValues: { idVerificationDocType: "PAN", addressVerificationDocType: "AADHAAR" },
  });
  const [kycPrefill, setKycPrefill] = useState<{ dateOfBirth: string; gender: string }>({
    dateOfBirth: "",
    gender: "",
  });
  const idDocType = useWatch({ control: kycForm.control, name: "idVerificationDocType" });
  const addressDocType = useWatch({ control: kycForm.control, name: "addressVerificationDocType" });
  const addNominee = useWatch({ control: proposal.control, name: "addNominee" });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPoll(), []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const input = decodeQuoteInput(sp);
    const enquiryId = sp.get("enquiryId") ?? "";
    if (!input || !enquiryId) { router.replace("/"); return; }
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time URL read on mount. */
    setCtx({
      input,
      enquiryId,
      premium: Number(sp.get("premium") ?? 0),
      insurer: sp.get("insurer") ?? "Your insurer",
      providerProductId: sp.get("providerProductId"),
    });
  }, [router]);

  if (!ctx) return <FullLoader />;

  const { input, enquiryId, premium, insurer, providerProductId } = ctx;
  // Before create-quote we only have the quick-quote estimate from the URL.
  // Once the quote is created, switch to Digit's exact figures (net + tax =
  // gross) so the sidebar and the Payment summary always agree.
  const basePremium = summary?.netPremium ?? premium;
  const gst = summary ? summary.tax : premium * 0.18;
  const total = summary?.grossPremium ?? premium + premium * 0.18;

  // ── Step 1 → create-quote, then branch on the returned KYC status ──
  const onProposal = proposal.handleSubmit(async (form) => {
    setError(null); setBusy(true);
    try {
      const res = await createQuoteRequest(buildCreateQuotePayload(input, enquiryId, form, providerProductId)) as {
        data?: {
          policyNumber?: string;
          applicationId?: string;
          kycStatus?: { kycVerificationStatus?: string };
          grossPremium?: string;
          netPremium?: string;
          serviceTax?: { totalTax?: string };
          contract?: { startDate?: string; endDate?: string };
          vehicle?: { make?: string; model?: string; licensePlateNumber?: string };
        };
      };
      const d = res?.data;
      setPolicyNumber(d?.policyNumber ?? "");
      // applicationId comes straight from create-quote and is reused for payment.
      setApplicationId(d?.applicationId ?? "");
      // Snapshot the details we want to show on the Payment step.
      setSummary({
        policyNumber: d?.policyNumber ?? "",
        vehicle: [d?.vehicle?.make, d?.vehicle?.model].filter(Boolean).join(" ") || "Your vehicle",
        registration: d?.vehicle?.licensePlateNumber ?? "",
        startDate: d?.contract?.startDate ?? "",
        endDate: d?.contract?.endDate ?? "",
        netPremium: inr(d?.netPremium),
        tax: inr(d?.serviceTax?.totalTax),
        grossPremium: inr(d?.grossPremium),
      });
      // Carry DOB + gender forward so the KYC step can send them automatically
      // without re-asking the customer.
      setKycPrefill({ dateOfBirth: form.dateOfBirth, gender: form.gender });

      // KYC still pending (IN_PROGRESS / NOT_DONE / FAILED) → KYC step;
      // anything else (e.g. DONE) → skip straight to Payment.
      const kycStatus = res?.data?.kycStatus?.kycVerificationStatus;
      const kycPending =
        kycStatus === "IN_PROGRESS" || kycStatus === "NOT_DONE" || kycStatus === "FAILED";
      setStep(kycPending ? 2 : 2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  });

  // Poll Policy Status until a condition is met, then advance.
  function poll(done: (s: { policyStatus?: string; kycStatus?: { kycVerificationStatus?: string } }) => boolean, onDone: () => void) {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getPolicyStatus(policyNumber, providerProductId ?? "");
        setStatusText(s.kycStatus?.kycVerificationStatus || s.policyStatus || "");
        if (done(s)) { stopPoll(); setWaiting(false); onDone(); }
      } catch { /* keep polling */ }
    }, 6000);
  }

  // ── Step 3 → KYC: upload documents, get link, open it, poll until DONE ──
  /* eslint-disable-next-line react-hooks/refs -- RHF handleSubmit returns a handler; it doesn't read refs during render. */
  const onStartKyc = kycForm.handleSubmit(async (v) => {
    setError(null); setBusy(true);
    try {
      // Front is mandatory; back is only included when the document has one.
      const idDocs = [v.idFront?.[0], v.idBack?.[0]].filter(Boolean) as File[];
      const addressDocs = [v.addressFront?.[0], v.addressBack?.[0]].filter(Boolean) as File[];

      const payload: StartKycInput = {
        providerProductId: providerProductId ?? "",
        policyNumber,
        dateOfBirth: kycPrefill.dateOfBirth,   // from create-quote, not re-asked
        gender: kycPrefill.gender,             // from create-quote, not re-asked
        idVerificationDocType: v.idVerificationDocType,
        addressVerificationDocType: v.addressVerificationDocType,
        idVerificationDoc: idDocs,
        addressVerificationDoc: addressDocs,
        successReturnURL: window.location.origin,
        failureReturnURL: window.location.origin,
      };
      const { kyc } = await startKyc(payload);
      if (kyc?.link) { setKycLink(kyc.link); window.open(kyc.link, "_blank", "noopener"); }
      setWaiting(true);
      poll((s) => isKycDone(s.kycStatus?.kycVerificationStatus), () => setStep(2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC could not be started.");
    } finally { setBusy(false); }
  });

  // ── Step 4 → payment: get the Digit gateway link and redirect to it. Digit
  // then redirects the browser to our server-configured success / error pages.
  async function onPay() {
    setError(null); setBusy(true);
    try {
      const { paymentLink } = await initiatePayment({ applicationId, paymentMode: "EB", providerProductId: providerProductId ?? "" });
      if (!paymentLink) throw new Error("Payment link was not returned. Please try again.");
      // Stash the policy context so /payment/success can recover it after the
      // gateway redirects back (the checkout tab's React state is gone by then).
      try {
        localStorage.setItem("va:payment", JSON.stringify({ policyNumber, applicationId, insurer, providerProductId }));
      } catch { /* localStorage unavailable — success page still shows a generic message */ }
      // TEMP (testing): skip the Digit gateway and go straight to the success
      // page to exercise the policy-status check. Restore the line below to go live.
      // window.location.href = paymentLink;
      router.push("/payment/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be initiated.");
      setBusy(false); // on success we navigate away, so only reset on failure
    }
  }

  // Manual "I've completed KYC" check while waiting on the KYC tab.
  async function checkKyc() {
    setBusy(true);
    try {
      const s = await getPolicyStatus(policyNumber, providerProductId ?? "");
      setStatusText(s.kycStatus?.kycVerificationStatus || s.policyStatus || "");
      if (isKycDone(s.kycStatus?.kycVerificationStatus)) { stopPoll(); setWaiting(false); setStep(2); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check status.");
    } finally { setBusy(false); }
  }

  async function onDownload() {
    setBusy(true); setError(null);
    try { await downloadPolicyPdf(applicationId, providerProductId ?? ""); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't download the policy."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <Navbar />

      {/* Attractive overlay while the proposal / quote is being created */}
      <AnimatePresence>
        {busy && step === 0 && (
          <motion.div
            key="creating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-paper/70 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-white p-8 text-center shadow-2xl shadow-brand/10"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-violet/10 blur-2xl" />

              <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-spin rounded-full border-4 border-brand/15 border-t-brand" />
                <ShieldCheck className="h-7 w-7 text-brand" strokeWidth={2} />
              </span>

              <h3 className="relative mt-5 font-display text-lg font-bold text-ink">Creating your proposal</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-ink-soft">
                Securely fetching your quote from Go Digit — this only takes a moment.
              </p>

              <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                <motion.span
                  className="block h-full w-1/3 rounded-full bg-linear-to-r from-brand to-violet"
                  animate={{ x: ["-100%", "320%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <p className="relative mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
                <Lock className="h-3 w-3" /> Encrypted · IRDAI regulated
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-paper pb-16">
        {/* Header — clean application bar */}
        <div className="relative overflow-hidden border-b border-line bg-linear-to-b from-brand/5 to-white">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-violet/10 blur-3xl" />
          <div className="relative mx-auto max-w-295 px-4 py-6 sm:px-6">
            <button
              type="button"
              onClick={() => {
                // Waiting on a KYC tab → drop back to the form. Otherwise step
                // back through the flow; only leave the page from step 0.
                if (waiting) { stopPoll(); setWaiting(false); return; }
                if (step > 0) { setError(null); setStep((s) => s - 1); return; }
                router.back();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition hover:text-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <h1 className="mt-2.5 font-display text-xl font-bold text-ink sm:text-2xl">
              Complete your proposal
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Motor policy with {insurer} · Comprehensive cover
            </p>
            <div className="mt-6 max-w-3xl">
              <CheckoutStepper
                current={step}
                onStepClick={(i) => {
                  // Jump back to an earlier step to review / edit it. Form values
                  // are preserved by react-hook-form.
                  if (i >= step) return;
                  stopPoll(); setWaiting(false); setError(null);
                  setStep(i);
                }}
              />
            </div>
          </div>
        </div>

        <div className={`mx-auto mt-8 max-w-295 px-4 sm:px-6 ${step < 3 ? "grid gap-6 lg:grid-cols-[1fr_360px]" : ""}`}>
          <div>
            <AnimatePresence mode="wait">
              {/* STEP 1 — Proposer */}
              {step === 0 && (
                <motion.form key="s0" id="step-form" onSubmit={onProposal} className="space-y-6" {...anim}>
                  <StepHeader icon={User} title="Proposer details" subtitle="Tell us who this policy is for." />
                  <Card title="Personal details" icon={User} tone="brand">
                    <Grid>
                      <Input label="First Name" err={proposal.formState.errors.firstName?.message} reg={proposal.register("firstName", { required: "Required" })} />
                      <Input label="Last Name" err={proposal.formState.errors.lastName?.message} reg={proposal.register("lastName", { required: "Required" })} />
                      <Field label="Date of Birth" err={proposal.formState.errors.dateOfBirth?.message}>
                        <input type="date" className={field} {...proposal.register("dateOfBirth", { required: "Required" })} />
                      </Field>
                      <Field label="Gender">
                        <select className={field} {...proposal.register("gender", { required: "Required" })}>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </Field>
                      <Input label="Email" type="email" err={proposal.formState.errors.email?.message}
                        reg={proposal.register("email", { required: "Required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />
                      <Input label="Mobile Number" err={proposal.formState.errors.mobile?.message}
                        reg={proposal.register("mobile", { required: "Required", pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" } })} />
                    </Grid>
                  </Card>
                  <Card title="Address" icon={ShieldCheck} tone="teal">
                    <Grid>
                      <div className="sm:col-span-2">
                        <Input label="Street / Address" err={proposal.formState.errors.street?.message} reg={proposal.register("street", { required: "Required" })} />
                      </div>
                      <Input label="City" err={proposal.formState.errors.city?.message} reg={proposal.register("city", { required: "Required" })} />
                      <Field label="State" err={proposal.formState.errors.state?.message}>
                        <select className={field} defaultValue="" {...proposal.register("state", { required: "Required" })}>
                          <option value="" disabled>Select state</option>
                          {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                        </select>
                      </Field>
                      <Input label="Pincode" err={proposal.formState.errors.pincode?.message}
                        reg={proposal.register("pincode", { required: "Required", pattern: { value: /^\d{6}$/, message: "Enter a valid 6-digit pincode" } })} />
                    </Grid>
                  </Card>
                  <Card title="Vehicle identification" icon={FileText} tone="amber">
                    <Grid>
                      <Input label="Chassis / VIN Number" err={proposal.formState.errors.vehicleIdentificationNumber?.message}
                        reg={proposal.register("vehicleIdentificationNumber", { required: "Required" })} />
                      <Input label="Engine Number" err={proposal.formState.errors.engineNumber?.message}
                        reg={proposal.register("engineNumber", { required: "Required" })} />
                    </Grid>
                  </Card>

                  <Card title="Nominee" icon={User} tone="violet">
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-2 focus:ring-brand/20"
                        {...proposal.register("addNominee")} />
                      <span>
                        <span className="text-xs font-bold text-ink">Add a nominee (optional)</span>
                        <span className="mt-0.5 block text-[0.72rem] text-ink-soft">
                          The person who receives the claim benefit. You can add this later too.
                        </span>
                      </span>
                    </label>

                    {addNominee && (
                      <div className="mt-5 border-t border-line pt-5">
                        <Grid>
                          <Input label="Nominee Name" err={proposal.formState.errors.nomineeName?.message}
                            reg={proposal.register("nomineeName", { required: "Required", shouldUnregister: true })} />
                          <Field label="Nominee Date of Birth" err={proposal.formState.errors.nomineeDateOfBirth?.message}>
                            <input type="date" className={field}
                              {...proposal.register("nomineeDateOfBirth", { required: "Required", shouldUnregister: true })} />
                          </Field>
                          <Field label="Relation to Nominee">
                            <select className={field} defaultValue="" {...proposal.register("nomineeRelation", { shouldUnregister: true })}>
                              <option value="" disabled>Select relation</option>
                              {NOMINEE_RELATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </Field>
                        </Grid>
                      </div>
                    )}
                  </Card>
                </motion.form>
              )}

              {/* STEP 2 — KYC */}
              {step === 1 && (
                <motion.div key="s1" className="space-y-6" {...anim}>
                  <StepHeader icon={FileCheck2} title="KYC verification" subtitle="A regulatory step — required before your policy is issued." />
                  {!waiting ? (
                    <form id="step-form" onSubmit={onStartKyc} className="space-y-6">
                      <Card title="Identity proof" icon={FileCheck2} tone="teal">
                        <Grid>
                          <Field label="ID Verification Document Type">
                            <select className={field} {...kycForm.register("idVerificationDocType", { required: true })}>
                              {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                            </select>
                          </Field>
                          <div className="hidden sm:block" />
                          <FileInput label="ID proof — front" err={kycForm.formState.errors.idFront?.message}
                            reg={kycForm.register("idFront", {
                              validate: (v: FileList) => (!v?.length ? "Upload the front of your ID" : !tooBig(v) || "File must be under 500 KB"),
                            })} />
                          <FileInput label={`ID proof — back${docNeedsBack(idDocType) ? "" : " (optional)"}`} err={kycForm.formState.errors.idBack?.message}
                            reg={kycForm.register("idBack", {
                              validate: (v: FileList) =>
                                docNeedsBack(idDocType) && !v?.length ? "Upload the back of your ID" : !tooBig(v) || "File must be under 500 KB",
                            })} />
                        </Grid>
                        <InfoNote>Upload a clear photo or PDF (max 500 KB per file). We&apos;ll send these securely to Go Digit for verification.</InfoNote>
                      </Card>

                      <Card title="Address proof" icon={ShieldCheck} tone="brand">
                        <Grid>
                          <Field label="Address Verification Document Type">
                            <select className={field} {...kycForm.register("addressVerificationDocType", { required: true })}>
                              {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                            </select>
                          </Field>
                          <div className="hidden sm:block" />
                          <FileInput label="Address proof — front" err={kycForm.formState.errors.addressFront?.message}
                            reg={kycForm.register("addressFront", {
                              validate: (v: FileList) => (!v?.length ? "Upload the front of your address proof" : !tooBig(v) || "File must be under 500 KB"),
                            })} />
                          {docNeedsBack(addressDocType) && (
                            <FileInput label="Address proof — back" err={kycForm.formState.errors.addressBack?.message}
                              reg={kycForm.register("addressBack", {
                                shouldUnregister: true,
                                validate: (v: FileList) => (!v?.length ? "Upload the back of your address proof" : !tooBig(v) || "File must be under 500 KB"),
                              })} />
                          )}
                        </Grid>
                        <InfoNote>You&apos;ll be taken to Go Digit&apos;s secure KYC page to finish verification, then brought right back here.</InfoNote>
                      </Card>
                    </form>
                  ) : (
                    <WaitingPanel
                      title="Complete your KYC"
                      body="A secure KYC page opened in a new tab. Finish it there — we'll detect it automatically and move you forward."
                      statusLabel="KYC status"
                      statusText={statusText}
                      link={kycLink}
                      linkLabel="Reopen KYC page"
                    />
                  )}
                </motion.div>
              )}

              {/* STEP 3 — Payment */}
              {step === 2 && (
                <motion.div key="s2" className="space-y-6" {...anim}>
                  <StepHeader icon={CreditCard} title="Payment" subtitle="Pay securely to activate your policy." />

                  {/* Policy summary — what you're about to pay for */}
                  {summary && (
                    <section className="relative overflow-hidden rounded-2xl border border-brand/15 bg-linear-to-br from-brand/8 via-violet/5 to-white p-6 shadow-sm sm:p-7">
                      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet/10 blur-3xl" />

                      <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-lg shadow-brand/25">
                            <Car className="h-5 w-5 text-white" strokeWidth={2} />
                          </span>
                          <div>
                            <p className="font-display text-base font-bold text-ink">{summary.vehicle}</p>
                            {summary.registration && <p className="font-mono text-xs text-ink-soft">{summary.registration}</p>}
                          </div>
                        </div>
                        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[0.7rem] font-bold text-teal">Comprehensive</span>
                      </div>

                      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                        {summary.policyNumber && (
                          <SummaryTile icon={FileText} label="Policy number" value={summary.policyNumber} mono />
                        )}
                        {(summary.startDate || summary.endDate) && (
                          <SummaryTile icon={CalendarDays} label="Coverage period"
                            value={`${fmtDate(summary.startDate)} – ${fmtDate(summary.endDate)}`} />
                        )}
                      </div>

                      <div className="relative mt-4 flex flex-wrap gap-1.5">
                        {["Own-damage cover", "Third-party liability", "Personal accident"].map((c) => (
                          <span key={c} className="inline-flex items-center gap-1 rounded-full border border-teal/25 bg-teal/8 px-2.5 py-1 text-[0.68rem] font-semibold text-teal">
                            <CheckCircle2 className="h-3 w-3" /> {c}
                          </span>
                        ))}
                      </div>

                      {summary.grossPremium > 0 && (
                        <div className="relative mt-5 space-y-2 rounded-2xl border border-line bg-white/70 p-4 text-sm backdrop-blur-sm">
                          <Row label="Net premium" value={`₹${fmt(summary.netPremium)}`} />
                          <Row label="GST" value={`₹${fmt(summary.tax)}`} />
                          <div className="flex items-center justify-between border-t border-line pt-3">
                            <span className="text-sm font-bold text-ink">Total payable</span>
                            <span className="font-display text-xl font-extrabold text-ink">₹{fmt(summary.grossPremium)}</span>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  <section className="relative overflow-hidden rounded-2xl border border-teal/15 bg-linear-to-br from-teal/8 via-brand/5 to-white p-6 shadow-sm sm:p-7">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />

                    <div className="relative flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-lg shadow-brand/25">
                        <Lock className="h-5 w-5 text-white" strokeWidth={2} />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-bold text-ink">Ready to pay</h3>
                        <p className="text-xs text-ink-soft">You&apos;ll be redirected to Go Digit&apos;s secure gateway — your policy activates the moment payment succeeds.</p>
                      </div>
                    </div>

                    {/* Amount highlight */}
                    <div className="relative mt-6 flex items-center justify-between rounded-2xl border border-line bg-linear-to-r from-brand/6 to-violet/6 px-5 py-4">
                      <span className="text-sm font-semibold text-ink-soft">Amount payable</span>
                      <span className="font-display text-2xl font-extrabold text-ink">₹{fmt(total)}</span>
                    </div>

                    {/* Trust badges */}
                    <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        { icon: ShieldCheck, label: "256-bit encrypted" },
                        { icon: Sparkles, label: "Instant activation" },
                        { icon: BadgeCheck, label: "IRDAI regulated" },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                          <Icon className="h-4 w-4 shrink-0 text-teal" strokeWidth={2} />
                          <span className="text-xs font-semibold text-ink">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Accepted methods */}
                    <div className="relative mt-5 flex flex-wrap items-center gap-2">
                      <span className="text-[0.7rem] font-semibold text-ink-soft">We accept</span>
                      {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"].map((m) => (
                        <span key={m} className="rounded-md border border-line bg-paper px-2 py-1 text-[0.68rem] font-bold text-ink-soft">{m}</span>
                      ))}
                    </div>

                    <InfoNote>Processed by Go Digit over an encrypted, PCI-DSS compliant gateway. No card details are stored on our servers.</InfoNote>
                  </section>
                </motion.div>
              )}

              {/* STEP 4 — Policy issued */}
              {step === 3 && (
                <motion.div key="s3" {...anim}
                  className="relative overflow-hidden rounded-3xl border border-line bg-white p-8 text-center shadow-xl shadow-teal/5 sm:p-12">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal/10 blur-2xl" />
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-teal to-brand shadow-lg shadow-teal/30">
                    <BadgeCheck className="h-11 w-11 text-white" strokeWidth={1.8} />
                  </motion.span>
                  <h2 className="relative mt-6 flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                    <Sparkles className="h-6 w-6 text-amber" /> Policy active!
                  </h2>
                  <p className="relative mx-auto mt-2 max-w-md text-sm text-ink-soft">
                    Your {insurer} policy is live and ready. Download your policy document below.
                  </p>
                  {policyNumber && (
                    <div className="relative mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 font-mono text-xs text-ink">
                      <FileText className="h-4 w-4 text-brand" /> Policy No: <span className="font-bold">{policyNumber}</span>
                    </div>
                  )}
                  {error && <div className="relative mx-auto mt-4 max-w-sm text-left"><Alert message={error} /></div>}
                  <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
                    <Button type="button" onClick={onDownload} disabled={busy}
                      className="gap-1.5 bg-linear-to-r from-brand to-violet px-6 text-white shadow-lg shadow-brand/25 hover:opacity-90">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Download Policy PDF
                    </Button>
                    <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-paper">
                      <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Plan summary + per-step CTA (steps 1–3) */}
          {step < 3 && (
            <aside className="lg:sticky lg:top-22 lg:self-start">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">Selected plan</p>
                    <p className="mt-0.5 font-display text-base font-bold text-ink">{insurer}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[0.7rem] font-bold text-brand">
                    Comprehensive
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-line pt-4">
                  {["Own-damage cover", "Third-party liability", "Personal accident cover"].map((b) => (
                    <p key={b} className="flex items-center gap-2 text-xs text-ink-soft">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" /> {b}
                    </p>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  <Row label="Base premium" value={`₹${fmt(basePremium)}`} />
                  <Row label="GST @ 18%" value={`₹${fmt(gst)}`} />
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-sm font-bold text-ink">Total premium</span>
                    <span className="font-display text-lg font-extrabold text-ink">₹{fmt(total)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4">
                    <Alert
                      message={error}
                      onRetry={
                        step === 0 ? () => onProposal()
                        : step === 1 && !waiting ? () => onStartKyc()
                        : step === 2 ? onPay
                        : undefined
                      }
                    />
                  </div>
                )}

                {/* Per-step CTA */}
                {step === 0 && <Cta form="step-form" busy={busy} label="Continue to KYC →" busyLabel="Creating proposal…" />}
                {step === 1 && !waiting && <Cta form="step-form" busy={busy} label="Start KYC →" busyLabel="Starting KYC…" />}
                {step === 1 && waiting && <Cta onClick={checkKyc} busy={busy} icon={<RefreshCw className="h-3.5 w-3.5" />} label="I've completed KYC" busyLabel="Checking…" />}
                {step === 2 && <Cta onClick={onPay} busy={busy} icon={<Lock className="h-3.5 w-3.5" />} label="Proceed to payment" busyLabel="Redirecting…" />}

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
                  <Lock className="h-3 w-3" /> Secured by Go Digit · IRDAI regulated
                </p>
              </div>

              {/* Help / reassurance — insurance touch */}
              <div className="mt-4 rounded-2xl border border-line bg-white p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-ink">
                  <Phone className="h-3.5 w-3.5 text-brand" /> Need help?
                </p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-ink-soft">
                  Our advisors are here for you at <span className="font-semibold text-ink">1800-XXX-XXXX</span>.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
                  <Clock className="h-3 w-3 text-teal" /> Mon–Sat, 9 AM – 7 PM
                </p>
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

/* ── presentational helpers ── */
function FullLoader() {
  return <div className="flex min-h-screen items-center justify-center bg-paper"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
}
function Cta({ form, onClick, busy, label, busyLabel, icon }: {
  form?: string; onClick?: () => void; busy: boolean; label: string; busyLabel: string; icon?: React.ReactNode;
}) {
  return (
    <Button type={form ? "submit" : "button"} form={form} onClick={onClick} disabled={busy}
      className="mt-4 w-full gap-1.5 bg-linear-to-r from-brand to-violet py-5 text-sm text-white shadow-lg shadow-brand/25 hover:opacity-90">
      {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> {busyLabel}</>) : (<>{icon}{label}</>)}
    </Button>
  );
}
function WaitingPanel({ title, body, statusLabel, statusText, link, linkLabel }: {
  title: string; body: string; statusLabel: string; statusText: string; link?: string; linkLabel: string;
}) {
  return (
    <Card title={title} icon={Loader2}>
      <div className="flex items-start gap-4">
        <span className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand/15" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-ink-soft">{body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {link && (
              <button type="button" onClick={() => window.open(link, "_blank", "noopener")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-brand hover:bg-paper">
                <ExternalLink className="h-3.5 w-3.5" /> {linkLabel}
              </button>
            )}
            {statusText && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber/10 px-3 py-1.5 text-xs font-semibold text-ink">
                {statusLabel}: <span className="font-bold">{statusText}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
function StepHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-lg shadow-brand/25">
        <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
      </span>
      <div>
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        <p className="text-xs text-ink-soft">{subtitle}</p>
      </div>
    </div>
  );
}
const CARD_TONES = {
  brand:  { bg: "from-brand/6 via-brand/3 to-white",   border: "border-brand/12",  glow: "bg-brand/10",  icon: "from-brand to-violet" },
  teal:   { bg: "from-teal/7 via-teal/3 to-white",     border: "border-teal/15",   glow: "bg-teal/10",   icon: "from-teal to-brand" },
  amber:  { bg: "from-amber/8 via-amber/3 to-white",   border: "border-amber/15",  glow: "bg-amber/10",  icon: "from-amber to-orange-500" },
  violet: { bg: "from-violet/7 via-violet/3 to-white", border: "border-violet/15", glow: "bg-violet/10", icon: "from-violet to-brand" },
} as const;

function Card({ title, icon: Icon, tone = "brand", children }: {
  title: string; icon: React.ElementType; tone?: keyof typeof CARD_TONES; children: React.ReactNode;
}) {
  const t = CARD_TONES[tone];
  return (
    <section className={`relative overflow-hidden rounded-2xl border bg-linear-to-br p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${t.border} ${t.bg}`}>
      <div className={`pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full blur-2xl ${t.glow}`} />
      <h3 className="relative mb-5 flex items-center gap-2.5 font-display text-sm font-bold text-ink">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br shadow-sm ${t.icon}`}>
          <Icon className="h-4 w-4 text-white" strokeWidth={2} />
        </span>
        {title}
      </h3>
      <div className="relative">{children}</div>
    </section>
  );
}
function Alert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-coral/30 bg-linear-to-br from-coral/10 via-coral/5 to-white p-4 shadow-sm"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-coral/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral/15">
          <AlertCircle className="h-4 w-4 text-coral" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-coral">We couldn&apos;t continue</p>
          <p className="mt-0.5 text-xs leading-snug text-ink-soft">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral transition hover:bg-coral/5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-xl bg-teal/8 p-3 text-[0.72rem] leading-relaxed text-ink-soft">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {children}
    </p>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-bold text-ink-soft">{children}</label>;
}
function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-coral">{children}</p>;
}
function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (<div><Label>{label}</Label>{children}{err && <Err>{err}</Err>}</div>);
}
function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex items-center justify-between text-ink-soft"><span>{label}</span><span className="font-semibold text-ink">{value}</span></div>);
}
function SummaryTile({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-4 py-3 backdrop-blur-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
        <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className={`truncate text-sm font-bold text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
function Input({ label, err, reg, type = "text" }: { label: string; err?: string; reg: UseFormRegisterReturn; type?: string }) {
  return (<Field label={label} err={err}><input type={type} className={field} {...reg} /></Field>);
}
const fileField =
  "w-full rounded-xl border border-line bg-paper/60 text-sm text-ink outline-none transition file:mr-3 file:cursor-pointer file:border-0 file:bg-brand/10 file:px-4 file:py-3 file:text-xs file:font-bold file:text-brand hover:file:bg-brand/15 focus:border-brand focus:ring-4 focus:ring-brand/10";
function FileInput({ label, err, reg }: { label: string; err?: string; reg: UseFormRegisterReturn }) {
  return (
    <Field label={label} err={err}>
      <input type="file" accept="image/jpeg,image/png,application/pdf" className={fileField} {...reg} />
    </Field>
  );
}
