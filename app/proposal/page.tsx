"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Lock, User, FileCheck2,
  CreditCard, FileText, BadgeCheck, ExternalLink, Sparkles, RefreshCw,
  AlertCircle, Phone, Clock,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import QuoteAuthGate from "@/components/quotes/QuoteAuthGate";
import CheckoutStepper from "@/components/quotes/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  decodeQuoteInput, buildCreateQuotePayload, createQuoteRequest, type ProposalForm,
} from "@/services/quote";
import { getPolicyStatus, startKyc, initiatePayment, downloadPolicyPdf } from "@/services/policy";
import type { TwoWheelerQuoteInput } from "@/types";

const field =
  "w-full rounded-xl border border-line bg-paper/60 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

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
const ID_TYPES = ["PAN", "AADHAAR", "DRIVING_LICENSE", "PASSPORT"];

const isKycDone = (s?: string) => /done|verif|success|complete/i.test(s ?? "");
const isEffective = (s?: string) => /effective|active|issued|inforce|in_force/i.test(s ?? "");
const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

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
  return <CheckoutContent userPhone={user.phone} />;
}

function CheckoutContent({ userPhone }: { userPhone: string | null }) {
  const router = useRouter();

  const [ctx, setCtx] = useState<
    { input: TwoWheelerQuoteInput; enquiryId: string; premium: number; insurer: string } | null
  >(null);
  const [step, setStep] = useState(0);          // 0 Proposal · 1 KYC · 2 Payment · 3 Policy
  const [policyNumber, setPolicyNumber] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [kycLink, setKycLink] = useState("");
  const [payLink, setPayLink] = useState("");
  const [waiting, setWaiting] = useState(false); // polling after opening a Digit link
  const [statusText, setStatusText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proposal = useForm<ProposalForm>({
    defaultValues: { gender: "MALE", mobile: userPhone?.replace(/^\+?91/, "") ?? "" },
  });
  const kycForm = useForm<{ idType: string; idNumber: string }>({ defaultValues: { idType: "PAN" } });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  useEffect(() => () => stopPoll(), []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const input = decodeQuoteInput(sp);
    const enquiryId = sp.get("enquiryId") ?? "";
    if (!input || !enquiryId) { router.replace("/"); return; }
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time URL read. */
    setCtx({ input, enquiryId, premium: Number(sp.get("premium") ?? 0), insurer: sp.get("insurer") ?? "Your insurer" });
  }, [router]);

  if (!ctx) return <FullLoader />;

  const { input, enquiryId, premium, insurer } = ctx;
  const gst = premium * 0.18;
  const total = premium + gst;

  // ── Steps 1–2 → create-quote, then CHECK policy status to branch on KYC ──
  const onProposal = proposal.handleSubmit(async (form) => {
    setError(null); setBusy(true);
    try {
      const res = await createQuoteRequest(buildCreateQuotePayload(input, enquiryId, form)) as {
        data?: { policyNumber?: string; applicationId?: string; kycStatus?: { kycVerificationStatus?: string } };
      };
      const pn = res?.data?.policyNumber ?? "";
      setPolicyNumber(pn);
      setApplicationId(res?.data?.applicationId ?? "");

      // Step 2 — call Policy Status to read the live KYC verification status.
      const live = pn ? await getPolicyStatus(pn).catch(() => null) : null;
      const kycVal = live?.kycStatus?.kycVerificationStatus ?? res?.data?.kycStatus?.kycVerificationStatus;
      setStep(isKycDone(kycVal) ? 2 : 1);   // DONE → Payment, else → KYC
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  });

  // Poll Policy Status until a condition is met, then advance.
  function poll(done: (s: { policyStatus?: string; kycStatus?: { kycVerificationStatus?: string } }) => boolean, onDone: () => void) {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getPolicyStatus(policyNumber);
        setStatusText(s.kycStatus?.kycVerificationStatus || s.policyStatus || "");
        if (done(s)) { stopPoll(); setWaiting(false); onDone(); }
      } catch { /* keep polling */ }
    }, 6000);
  }

  // ── Step 3 → KYC: get link, open it, poll until DONE ──
  const onStartKyc = kycForm.handleSubmit(async ({ idType, idNumber }) => {
    setError(null); setBusy(true);
    try {
      const { kyc } = await startKyc({
        queryParam: { companyFlag: "I", policyNumber },
        policyHolderType: "INDIVIDUAL",
        dateOfBirth: proposal.getValues("dateOfBirth"),
        gender: proposal.getValues("gender"),
        idVerificationDocType: idType,
        idVerificationDoc: [idNumber],
        addressVerificationDocType: idType,
        addressVerificationDoc: [idNumber],
        successReturnURL: window.location.origin,
        failureReturnURL: window.location.origin,
      });
      if (kyc?.link) { setKycLink(kyc.link); window.open(kyc.link, "_blank", "noopener"); }
      setWaiting(true);
      poll((s) => isKycDone(s.kycStatus?.kycVerificationStatus), () => setStep(2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "KYC could not be started.");
    } finally { setBusy(false); }
  });

  // ── Step 4 → payment: get dispatcher link, open it, poll until EFFECTIVE ──
  async function onPay() {
    setError(null); setBusy(true);
    try {
      const { dispatcherResponse } = await initiatePayment({
        applicationId,
        paymentMode: "EB",
        successReturnUrl: window.location.origin,
        cancelReturnUrl: window.location.origin,
      });
      if (dispatcherResponse) { setPayLink(dispatcherResponse); window.open(dispatcherResponse, "_blank", "noopener"); }
      setWaiting(true);
      poll((s) => isEffective(s.policyStatus), () => setStep(3));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be initiated.");
    } finally { setBusy(false); }
  }

  // Manual "check now" while waiting.
  async function checkNow(kind: "kyc" | "payment") {
    setBusy(true);
    try {
      const s = await getPolicyStatus(policyNumber);
      setStatusText(s.kycStatus?.kycVerificationStatus || s.policyStatus || "");
      if (kind === "kyc" && isKycDone(s.kycStatus?.kycVerificationStatus)) { stopPoll(); setWaiting(false); setStep(2); }
      if (kind === "payment" && isEffective(s.policyStatus)) { stopPoll(); setWaiting(false); setStep(3); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check status.");
    } finally { setBusy(false); }
  }

  async function onDownload() {
    setBusy(true); setError(null);
    try { await downloadPolicyPdf(applicationId); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't download the policy."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-paper pb-16">
        {/* Header — clean application bar */}
        <div className="relative overflow-hidden border-b border-line bg-linear-to-b from-brand/[0.05] to-white">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-violet/10 blur-3xl" />
          <div className="relative mx-auto max-w-295 px-4 py-6 sm:px-6">
            <button
              type="button"
              onClick={() => (step > 0 && step < 3 && !waiting ? setStep((s) => s - 1) : router.back())}
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
              <CheckoutStepper current={step} />
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
                  <Card title="Personal details" icon={User}>
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
                  <Card title="Address" icon={ShieldCheck}>
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
                  <Card title="Vehicle identification" icon={FileText}>
                    <Grid>
                      <Input label="Chassis / VIN Number" err={proposal.formState.errors.vehicleIdentificationNumber?.message}
                        reg={proposal.register("vehicleIdentificationNumber", { required: "Required" })} />
                      <Input label="Engine Number" err={proposal.formState.errors.engineNumber?.message}
                        reg={proposal.register("engineNumber", { required: "Required" })} />
                    </Grid>
                  </Card>
                </motion.form>
              )}

              {/* STEP 2 — KYC */}
              {step === 1 && (
                <motion.div key="s1" className="space-y-6" {...anim}>
                  <StepHeader icon={FileCheck2} title="KYC verification" subtitle="A regulatory step — required before your policy is issued." />
                  {!waiting ? (
                    <form id="step-form" onSubmit={onStartKyc}>
                      <Card title="Identity document" icon={FileCheck2}>
                        <Grid>
                          <Field label="Document Type">
                            <select className={field} {...kycForm.register("idType", { required: true })}>
                              {ID_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                            </select>
                          </Field>
                          <Input label="Document Number" err={kycForm.formState.errors.idNumber?.message}
                            reg={kycForm.register("idNumber", { required: "Required" })} />
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
                  {!waiting ? (
                    <Card title="Ready to pay" icon={Lock}>
                      <p className="text-sm leading-relaxed text-ink-soft">
                        You&apos;ll be taken to Go Digit&apos;s secure payment page. Your policy activates the moment payment succeeds.
                      </p>
                      <InfoNote>Payments are processed by Go Digit over an encrypted, PCI-DSS compliant gateway.</InfoNote>
                    </Card>
                  ) : (
                    <WaitingPanel
                      title="Complete your payment"
                      body="A secure payment page opened in a new tab. Once you've paid, your policy will activate automatically."
                      statusLabel="Policy status"
                      statusText={statusText}
                      link={payLink}
                      linkLabel="Reopen payment page"
                    />
                  )}
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
                  <Row label="Base premium" value={`₹${fmt(premium)}`} />
                  <Row label="GST @ 18%" value={`₹${fmt(gst)}`} />
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-sm font-bold text-ink">Total premium</span>
                    <span className="font-display text-lg font-extrabold text-ink">₹{fmt(total)}</span>
                  </div>
                </div>

                {error && <div className="mt-4"><Alert message={error} /></div>}

                {/* Per-step CTA */}
                {step === 0 && <Cta form="step-form" busy={busy} label="Continue to KYC →" busyLabel="Creating proposal…" />}
                {step === 1 && !waiting && <Cta form="step-form" busy={busy} label="Start KYC →" busyLabel="Starting KYC…" />}
                {step === 1 && waiting && <Cta onClick={() => checkNow("kyc")} busy={busy} icon={<RefreshCw className="h-3.5 w-3.5" />} label="I've completed KYC" busyLabel="Checking…" />}
                {step === 2 && !waiting && <Cta onClick={onPay} busy={busy} icon={<Lock className="h-3.5 w-3.5" />} label="Proceed to payment" busyLabel="Opening payment…" />}
                {step === 2 && waiting && <Cta onClick={() => checkNow("payment")} busy={busy} icon={<RefreshCw className="h-3.5 w-3.5" />} label="I've paid — check status" busyLabel="Checking…" />}

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
function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <h3 className="mb-5 flex items-center gap-2.5 font-display text-sm font-bold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10">
          <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
function Alert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-coral/30 bg-coral/8 px-3.5 py-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
      <div>
        <p className="text-xs font-bold text-coral">We couldn&apos;t continue</p>
        <p className="mt-0.5 text-[0.72rem] leading-snug text-ink-soft">{message}</p>
      </div>
    </div>
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
function Input({ label, err, reg, type = "text" }: { label: string; err?: string; reg: UseFormRegisterReturn; type?: string }) {
  return (<Field label={label} err={err}><input type={type} className={field} {...reg} /></Field>);
}
