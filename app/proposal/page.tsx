"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Lock, User, FileCheck2,
  FileText, BadgeCheck, ExternalLink, Sparkles, RefreshCw,
  AlertCircle, Phone, Clock, Car, CalendarDays, Check, Pencil, X,
  Heart, Cake, MapPin, History, Building2, BadgeInfo, Users,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import QuoteAuthGate from "@/components/quotes/QuoteAuthGate";
import CheckoutStepper from "@/components/quotes/CheckoutStepper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  decodeQuoteInput, buildCreateQuotePayload, createQuoteRequest,
  MOTOR_PREVIOUS_INSURERS, MOTOR_NCB, type ProposalForm,
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
  odPremium: number;
  tpPremium: number;
  addonPremium: number;
  discount: number;
  idv: number;
  engineNumber: string;
  mfgDate: string;
  fuelType: string;
  covers: CoverItem[];          // base coverages that are included (Selected Plan)
  selectedAddons: CoverItem[];  // add-ons the customer actually chose
  groups: CoverGroup[];         // full breakdown for the details modal
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  address: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeDob: string;
  prevInsurer: PrevInsurer | null;
};

type CoverItem = { name: string; selected: boolean; premium: number };
type CoverGroup = { title: string; items: CoverItem[] };
type PrevInsurer = {
  name: string; policyNumber: string; expiry: string;
  policyType: string; ncb: string; claimLastYear: boolean;
};

const insurerName = (code?: string) =>
  MOTOR_PREVIOUS_INSURERS.find((i) => i.code === code)?.name ?? code ?? "";
const ncbLabel = (v?: string) => MOTOR_NCB.find((n) => n.value === v)?.label ?? v ?? "";
const stateName = (code?: string) => STATES.find((s) => s.code === code)?.name ?? code ?? "";

// "ZERO_DEPRECIATION" / "roadSideAssistance" → "Zero Depreciation" / "Road Side Assistance"
const humanizeAddon = (k: string) =>
  k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Pull every one-level-deep entry that carries a `selection` flag into a flat
// list of {name, selected, premium} — used to render coverage groups faithfully.
function pickCoverItems(obj: unknown): CoverItem[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj as Record<string, unknown>)
    .filter(([, v]) => v && typeof v === "object" && "selection" in (v as object))
    .map(([k, v]) => {
      const o = v as { selection?: boolean; netPremium?: string };
      return { name: humanizeAddon(k), selected: o.selection === true, premium: inr(o.netPremium) };
    });
}

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
  const [detailsOpen, setDetailsOpen] = useState(false); // full coverage-breakdown modal
  // Whether KYC is already verified (from create-quote) or was completed here.
  // When true, the KYC step is skipped so Back from Payment returns to Proposal.
  const [kycDone, setKycDone] = useState(false);

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
          discounts?: { otherDiscounts?: { discountAmount?: string }[] };
          contract?: {
            startDate?: string; endDate?: string;
            coverages?: {
              ownDamage?: { netPremium?: string };
              thirdPartyLiability?: { netPremium?: string };
              accessories?: unknown;
              addons?: unknown;
              legalLiability?: unknown;
              unnamedPA?: unknown;
              [k: string]: unknown;
            };
          };
          vehicle?: {
            make?: string; model?: string; licensePlateNumber?: string;
            manufactureDate?: string; engineNumber?: string; fuelType?: string; vehicleIDV?: { idv?: number };
          };
          previousInsurer?: {
            isPreviousInsurerKnown?: boolean;
            previousInsurerCode?: string;
            previousPolicyNumber?: string;
            previousPolicyExpiryDate?: string;
            previousPolicyType?: string;
            previousNoClaimBonus?: string;
            isClaimInLastYear?: boolean;
          };
        };
      };
      const d = res?.data;
      setPolicyNumber(d?.policyNumber ?? "");
      // applicationId comes straight from create-quote and is reused for payment.
      setApplicationId(d?.applicationId ?? "");
      // Snapshot the details we want to show on the Payment step. The premium
      // breakdown reconciles: OD + TP − discount = net; net + GST = gross.
      const cov = d?.contract?.coverages;
      const od = inr(cov?.ownDamage?.netPremium);
      const tp = inr(cov?.thirdPartyLiability?.netPremium);
      const discount = (d?.discounts?.otherDiscounts ?? []).reduce((s, x) => s + inr(x.discountAmount), 0);
      const net = inr(d?.netPremium);

      // Categorise everything the response returns, straight from the data.
      const baseCovers = pickCoverItems(cov);                    // OD, TP, PA, fire, theft
      const accessoryItems = pickCoverItems(cov?.accessories);
      const addonItems = pickCoverItems(cov?.addons);
      const legalItems = pickCoverItems(cov?.legalLiability);
      const unnamedItems = pickCoverItems(cov?.unnamedPA);
      // Selected Plan shows base covers that are active (chosen or priced —
      // Third-party is mandatory so it carries a premium even when unflagged).
      const covers = baseCovers.filter((c) => c.selected || c.premium > 0);
      const selectedAddons = addonItems.filter((a) => a.selected);
      // Everything, grouped, for the "View Details" modal (empty groups dropped).
      const groups: CoverGroup[] = [
        { title: "Coverages", items: baseCovers },
        { title: "Accessories", items: accessoryItems },
        { title: "Add-ons", items: addonItems },
        { title: "Legal Liability", items: legalItems },
        { title: "Unnamed Person Accident", items: unnamedItems },
      ].filter((g) => g.items.length > 0);
      setSummary({
        policyNumber: d?.policyNumber ?? "",
        vehicle: [d?.vehicle?.make, d?.vehicle?.model].filter(Boolean).join(" ") || "Your vehicle",
        registration: d?.vehicle?.licensePlateNumber ?? "",
        startDate: d?.contract?.startDate ?? "",
        endDate: d?.contract?.endDate ?? "",
        netPremium: net,
        tax: inr(d?.serviceTax?.totalTax),
        grossPremium: inr(d?.grossPremium),
        odPremium: od,
        tpPremium: tp,
        // Residual bucket for any selected add-ons (0 when none).
        addonPremium: Math.max(0, Math.round((net - od - tp + discount) * 100) / 100),
        discount,
        idv: d?.vehicle?.vehicleIDV?.idv ?? 0,
        engineNumber: d?.vehicle?.engineNumber ?? "",
        mfgDate: d?.vehicle?.manufactureDate ?? "",
        fuelType: d?.vehicle?.fuelType ?? "",
        covers,
        selectedAddons,
        groups,
        customerName: [form.firstName, form.lastName].filter(Boolean).join(" ").trim(),
        customerMobile: form.mobile ?? "",
        customerEmail: form.email ?? "",
        // Proposer address from what the customer entered (state code → name).
        address: [form.street, form.city, stateName(form.state), form.pincode]
          .filter(Boolean).join(", "),
        // The response doesn't echo the nominee, so show what the customer entered.
        nomineeName: form.addNominee ? (form.nomineeName ?? "").trim() : "",
        nomineeRelation: form.addNominee ? (form.nomineeRelation ?? "") : "",
        nomineeDob: form.addNominee ? (form.nomineeDateOfBirth ?? "") : "",
        // Previous-insurer details straight from the response (code → name).
        prevInsurer: d?.previousInsurer?.isPreviousInsurerKnown
          ? {
              name: insurerName(d.previousInsurer.previousInsurerCode),
              policyNumber: d.previousInsurer.previousPolicyNumber ?? "",
              expiry: d.previousInsurer.previousPolicyExpiryDate ?? "",
              policyType: d.previousInsurer.previousPolicyType ?? "",
              ncb: ncbLabel(d.previousInsurer.previousNoClaimBonus),
              claimLastYear: d.previousInsurer.isClaimInLastYear === true,
            }
          : null,
      });
      // Carry DOB + gender forward so the KYC step can send them automatically
      // without re-asking the customer.
      setKycPrefill({ dateOfBirth: form.dateOfBirth, gender: form.gender });

      // Decide the next step from the create-quote KYC status. If KYC is already
      // verified (DONE/verified/complete) skip the KYC step and go straight to
      // Payment — and remember it so Back from Payment returns to Proposal, not
      // KYC. Otherwise (IN_PROGRESS / NOT_DONE / FAILED) show the KYC step.
      const kycStatus = res?.data?.kycStatus?.kycVerificationStatus;
      const alreadyVerified = isKycDone(kycStatus);
      setKycDone(alreadyVerified);
      setStep(alreadyVerified ? 2 : 1);
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
      poll((s) => isKycDone(s.kycStatus?.kycVerificationStatus), () => { setKycDone(true); setStep(2); });
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
      if (isKycDone(s.kycStatus?.kycVerificationStatus)) { stopPoll(); setWaiting(false); setKycDone(true); setStep(2); }
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
                // back through the flow; only leave the page from step 0. When
                // KYC is already done, skip it: Payment → Proposal directly.
                if (waiting) { stopPoll(); setWaiting(false); return; }
                if (step > 0) {
                  setError(null);
                  setStep((s) => (s === 2 && kycDone ? 0 : s - 1));
                  return;
                }
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
                  // are preserved by react-hook-form. When KYC is already done,
                  // it's locked — clicking it does nothing.
                  if (i >= step) return;
                  if (i === 1 && kycDone) return;
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

              {/* STEP 3 — Review & Payment */}
              {step === 2 && (
                <motion.div key="s2" className="space-y-5" {...anim}>
                  {/* Heading row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-lg shadow-brand/25">
                        <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2} />
                      </span>
                      <div>
                        <h2 className="font-display text-xl font-bold text-ink">Review Your Policy</h2>
                        <p className="text-xs text-ink-soft">Please review your details and premium before proceeding.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-teal/25 bg-teal/8 px-3 py-2">
                      <ShieldCheck className="h-4 w-4 text-teal" strokeWidth={2} />
                      <div className="leading-tight">
                        <p className="text-[0.72rem] font-bold text-ink">Secure Checkout</p>
                        <p className="text-[0.62rem] text-ink-soft">Your data is 100% safe with us.</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  {summary && (
                    <ReviewCard
                      icon={Car}
                      title="Vehicle Details"
                      action={<EditLink onClick={() => setStep(0)} label="Edit" />}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-display text-lg font-bold text-ink">{summary.vehicle}</p>
                        {summary.fuelType && (
                          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[0.68rem] font-bold text-brand">
                            {summary.fuelType.charAt(0) + summary.fuelType.slice(1).toLowerCase()}
                          </span>
                        )}
                        <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[0.68rem] font-bold text-teal">Comprehensive</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {summary.registration && <SummaryTile icon={Car} label="Registration No." value={summary.registration} mono />}
                        {summary.mfgDate && <SummaryTile icon={CalendarDays} label="Manufacturing Year" value={summary.mfgDate.slice(0, 4)} />}
                        {summary.engineNumber && <SummaryTile icon={FileText} label="Engine No." value={summary.engineNumber} mono />}
                        {summary.idv > 0 && <SummaryTile icon={ShieldCheck} label="IDV (Insured Declared Value)" value={`₹${fmt(summary.idv)}`} />}
                        {summary.policyNumber && <SummaryTile icon={FileText} label="Policy Number" value={summary.policyNumber} mono />}
                        {(summary.startDate || summary.endDate) && (
                          <SummaryTile icon={CalendarDays} label="Coverage Period"
                            value={`${fmtDate(summary.startDate)} – ${fmtDate(summary.endDate)}`} />
                        )}
                      </div>
                    </ReviewCard>
                  )}

                  {/* Selected Plan — covers reflect the premiums Digit returned */}
                  {summary && (
                    <ReviewCard
                      icon={ShieldCheck}
                      title="Selected Plan"
                      action={
                        summary.groups.length > 0 ? (
                          <button type="button" onClick={() => setDetailsOpen(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline">
                            <FileText className="h-3.5 w-3.5" /> View Details
                          </button>
                        ) : undefined
                      }
                    >
                      <div className="rounded-2xl border border-brand/15 bg-brand/5 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-bold text-brand">{insurer} Comprehensive Plan</p>
                          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[0.66rem] font-bold text-brand">Comprehensive</span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {summary.covers.map((c) => (
                            <span key={c.name} className="flex items-center justify-between gap-1.5 text-xs font-semibold text-ink">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" strokeWidth={2} /> {c.name}
                              </span>
                              {c.premium > 0 && <span className="text-ink-soft">₹{fmt(c.premium)}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </ReviewCard>
                  )}

                  {/* Add-ons — only the ones actually selected on the quote */}
                  {summary && summary.selectedAddons.length > 0 && (
                    <ReviewCard icon={Sparkles} title="Add-ons">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {summary.selectedAddons.map((a) => (
                          <div key={a.name} className="relative rounded-2xl border border-line bg-paper/60 p-4 text-center">
                            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                              <Sparkles className="h-5 w-5 text-brand" strokeWidth={1.8} />
                            </span>
                            <p className="mt-2 text-xs font-bold text-ink">{a.name}</p>
                            {a.premium > 0 && <p className="mt-0.5 text-sm font-extrabold text-ink">₹{fmt(a.premium)}</p>}
                          </div>
                        ))}
                      </div>
                    </ReviewCard>
                  )}

                  {/* Nominee — only when added; each field a distinct icon */}
                  {summary?.nomineeName && (
                    <ReviewCard icon={Heart} title="Nominee Details">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <SummaryTile icon={User} label="Name" value={summary.nomineeName} />
                        {summary.nomineeRelation && (
                          <SummaryTile icon={Users} label="Relation"
                            value={summary.nomineeRelation.charAt(0) + summary.nomineeRelation.slice(1).toLowerCase()} />
                        )}
                        {summary.nomineeDob && <SummaryTile icon={Cake} label="Date of Birth" value={fmtDate(summary.nomineeDob)} />}
                      </div>
                    </ReviewCard>
                  )}

                  {/* Previous Insurer — only when the customer had a known prior policy */}
                  {summary?.prevInsurer && (
                    <ReviewCard icon={History} title="Previous Insurer">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {summary.prevInsurer.name && <SummaryTile icon={Building2} label="Insurer" value={summary.prevInsurer.name} />}
                        {summary.prevInsurer.policyNumber && <SummaryTile icon={FileText} label="Policy Number" value={summary.prevInsurer.policyNumber} mono />}
                        {summary.prevInsurer.expiry && <SummaryTile icon={CalendarDays} label="Policy Expiry" value={fmtDate(summary.prevInsurer.expiry)} />}
                        {summary.prevInsurer.policyType && <SummaryTile icon={ShieldCheck} label="Policy Type" value={summary.prevInsurer.policyType} />}
                        {summary.prevInsurer.ncb && <SummaryTile icon={BadgeInfo} label="No-Claim Bonus" value={summary.prevInsurer.ncb} />}
                        <SummaryTile icon={AlertCircle} label="Claim Last Year" value={summary.prevInsurer.claimLastYear ? "Yes" : "No"} />
                      </div>
                    </ReviewCard>
                  )}

                  {/* Customer Details */}
                  {summary && (
                    <ReviewCard
                      icon={User}
                      title="Customer Details"
                      action={<EditLink onClick={() => setStep(0)} label="Edit Details" />}
                    >
                      <div className="grid gap-4 sm:grid-cols-3">
                        {summary.customerName && <DetailField label="Name" value={summary.customerName} />}
                        {summary.customerMobile && <DetailField label="Mobile Number" value={summary.customerMobile} />}
                        {summary.customerEmail && <DetailField label="Email ID" value={summary.customerEmail} />}
                      </div>
                      {summary.address && (
                        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-paper/60 p-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                            <MapPin className="h-4 w-4 text-brand" strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft">Address</p>
                            <p className="text-sm font-semibold text-ink break-words">{summary.address}</p>
                          </div>
                        </div>
                      )}
                      <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand/6 p-3 text-[0.72rem] leading-relaxed text-ink-soft">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> These details will be used for policy communication and updates.
                      </p>
                    </ReviewCard>
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
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                {/* Gradient header */}
                <div className="flex items-center justify-between bg-linear-to-r from-brand to-violet px-5 py-4">
                  <p className="font-display text-base font-bold text-white">Premium Summary</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                    <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
                  </span>
                </div>

                <div className="p-5">
                  {/* Plan */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">Selected plan</p>
                      <p className="mt-0.5 font-display text-sm font-bold text-ink">{insurer}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-teal/10 px-2.5 py-1 text-[0.7rem] font-bold text-teal">
                      Comprehensive
                    </span>
                  </div>

                  {/* Line items — full breakdown once the quote is created */}
                  <div className="space-y-2.5 border-t border-line pt-4 text-sm">
                    {summary ? (
                      <>
                        <Row label="Own Damage Premium" value={`₹${fmt(summary.odPremium)}`} />
                        <Row label="Third Party Premium" value={`₹${fmt(summary.tpPremium)}`} />
                        {summary.addonPremium > 0 && <Row label="Add-on Premium" value={`₹${fmt(summary.addonPremium)}`} />}
                        <Row label="GST (18%)" value={`₹${fmt(summary.tax)}`} />
                        {summary.discount > 0 && (
                          <div className="flex items-center justify-between text-teal">
                            <span>Discount</span>
                            <span className="font-semibold">− ₹{fmt(summary.discount)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Row label="Net premium" value={`₹${fmt(basePremium)}`} />
                        <Row label="GST (18%)" value={`₹${fmt(gst)}`} />
                      </>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                    <div>
                      <p className="text-sm font-bold text-ink">Total Payable</p>
                      <p className="text-[0.66rem] text-ink-soft">Inclusive of all taxes</p>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-ink">₹{fmt(total)}</span>
                  </div>

                  {/* Savings */}
                  {summary && summary.discount > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal/10 px-3 py-2.5 text-xs font-bold text-teal">
                      <Sparkles className="h-4 w-4" /> You are saving ₹{fmt(summary.discount)} on this policy
                    </div>
                  )}

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
                    <Lock className="h-3 w-3" /> Secured by 256-bit SSL · IRDAI regulated
                  </p>

                  {/* Trust points */}
                  <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                    {[
                      { icon: BadgeCheck, label: "Instant policy issuance" },
                      { icon: CheckCircle2, label: "No hidden charges" },
                      { icon: Lock, label: "Secure & safe payments" },
                      { icon: Phone, label: "24×7 customer support" },
                    ].map(({ icon: Icon, label }) => (
                      <p key={label} className="flex items-center gap-2.5 text-xs font-medium text-ink-soft">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/8">
                          <Icon className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
                        </span>
                        {label}
                      </p>
                    ))}
                  </div>
                </div>
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

      {/* Full coverage breakdown — every group Digit returned, selected or not */}
      <CoverageModal open={detailsOpen} groups={summary?.groups ?? []} onClose={() => setDetailsOpen(false)} />
    </>
  );
}

function CoverageModal({ open, groups, onClose }: { open: boolean; groups: CoverGroup[]; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 bg-linear-to-r from-brand to-violet px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
                </span>
                <p className="font-display text-base font-bold text-white">Coverage Details</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 text-[0.66rem] font-bold uppercase tracking-wider text-ink-soft">{g.title}</p>
                  <div className="divide-y divide-line rounded-xl border border-line">
                    {g.items.map((it) => (
                      <div key={it.name} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                        <span className="flex items-center gap-2 text-sm text-ink">
                          {it.selected
                            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" strokeWidth={2} />
                            : <span className="h-4 w-4 shrink-0 rounded-full border border-line" />}
                          <span className={it.selected ? "font-semibold" : "text-ink-soft"}>{it.name}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-ink">
                          {it.premium > 0 ? `₹${fmt(it.premium)}` : it.selected ? "Included" : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
/** Plain white review card with an icon-badge title and optional top-right action. */
function ReviewCard({ icon: Icon, title, action, children }: {
  icon: React.ElementType; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-display text-sm font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
            <Icon className="h-4.5 w-4.5 text-brand" strokeWidth={1.9} />
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}
function EditLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/5">
      <Pencil className="h-3 w-3" /> {label}
    </button>
  );
}
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink break-words">{value}</p>
    </div>
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
