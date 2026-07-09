"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, AlertCircle, ShieldCheck, Car, FileText, CreditCard, CheckCircle2,
  History, User, RefreshCw,
} from "lucide-react";

import { getPolicyDetails, type PolicyDetails } from "@/services/policy";
import { MOTOR_PREVIOUS_INSURERS } from "@/services/quote";

/* ── helpers ── */
const fmtINR = (v?: string | number | null) => {
  if (v == null) return "—";
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}` : "—";
};
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const titleCase = (s?: string | null) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—";
const humanize = (k: string) =>
  k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const insurerName = (code?: string) =>
  MOTOR_PREVIOUS_INSURERS.find((i) => i.code === code)?.name ?? code ?? "—";

type CoverItem = { name: string; selected: boolean; premium: number; sumInsured?: number; note?: string };
// Flatten one-level coverage entries carrying a `selection` flag.
function pickCoverItems(obj: unknown): CoverItem[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj as Record<string, unknown>)
    .filter(([, v]) => v && typeof v === "object" && "selection" in (v as object))
    .map(([k, v]) => {
      const o = v as { selection?: boolean; netPremium?: string; insuredAmount?: number; coverAvailability?: string };
      const n = Number(String(o.netPremium ?? "").replace(/[^0-9.]/g, ""));
      return {
        name: humanize(k),
        selected: o.selection === true,
        premium: Number.isFinite(n) ? n : 0,
        sumInsured: typeof o.insuredAmount === "number" && o.insuredAmount > 0 ? o.insuredAmount : undefined,
        note: o.coverAvailability === "NOT_AVAILABLE" ? "Not available" : undefined,
      };
    });
}

function StatusPill({ label, status }: { label: string; status?: string | null }) {
  if (!status) return null;
  const key = String(status).toUpperCase();
  const tone =
    ["COMPLETE", "EFFECTIVE", "PAID", "DONE", "VERIFIED"].includes(key) ? "bg-teal/12 text-teal"
    : ["INCOMPLETE", "PENDING", "IN_PROGRESS", "NOT_PAID", "NOT_DONE"].includes(key) ? "bg-amber/12 text-amber"
    : "bg-ink/8 text-ink-soft";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold">
      <span className="text-ink-soft">{label}</span>
      <span className={`rounded-full px-2 py-0.5 ${tone}`}>{titleCase(status)}</span>
    </span>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/50 p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><Icon className="h-4 w-4 text-brand" /> {title}</h3>
      <div className="divide-y divide-line/70">{children}</div>
    </div>
  );
}
function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs font-semibold text-ink-soft">{label}</span>
      <span className={`min-w-0 text-right text-sm break-all text-ink ${mono ? "font-mono text-xs" : "font-semibold"}`}>{value ?? "—"}</span>
    </div>
  );
}
function CoverGroup({ title, items }: { title: string; items: CoverItem[] }) {
  return (
    <Section icon={FileText} title={title}>
      {items.map((it) => (
        <div key={it.name} className="flex items-center justify-between gap-3 py-1.5">
          <span className="flex items-center gap-2 text-sm text-ink">
            {it.selected
              ? <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" strokeWidth={2} />
              : <span className="h-4 w-4 shrink-0 rounded-full border border-line" />}
            <span className={it.selected ? "font-semibold" : "text-ink-soft"}>{it.name}</span>
          </span>
          <span className="shrink-0 text-xs font-bold text-ink">
            {it.premium > 0 ? fmtINR(it.premium)
              : it.selected ? "Included"
              : it.sumInsured ? <span className="text-ink-soft">Cover {fmtINR(it.sumInsured)}</span>
              : it.note ? <span className="text-ink-soft">{it.note}</span>
              : <span className="text-ink-soft">Not selected</span>}
          </span>
        </div>
      ))}
    </Section>
  );
}

function SkelBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink/8 ${className}`} />;
}
function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      {/* status pills */}
      <div className="flex flex-wrap gap-2">
        <SkelBar className="h-6 w-20 rounded-full" />
        <SkelBar className="h-6 w-16 rounded-full" />
        <SkelBar className="h-6 w-24 rounded-full" />
      </div>
      {/* section cards */}
      {[4, 6, 3].map((rows, s) => (
        <div key={s} className="rounded-2xl border border-line bg-paper/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <SkelBar className="h-4 w-4 rounded-md" />
            <SkelBar className="h-3.5 w-28" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="flex items-center justify-between gap-4">
                <SkelBar className="h-3 w-28" />
                <SkelBar className="h-3 w-20 bg-ink/12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props {
  policyNumber: string;
  providerProductId: string;
  heading?: string;
  subheading?: string;
  onClose: () => void;
}

export default function PolicyDetailsModal({ policyNumber, providerProductId, heading, subheading, onClose }: Props) {
  const [data, setData] = useState<PolicyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag for the portal. */
  useEffect(() => { setMounted(true); }, []);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    getPolicyDetails(policyNumber, providerProductId)
      .then(setData)
      // Keep it human — never surface raw/technical error text.
      .catch(() => setError("We couldn't load these details right now. Please try again."))
      .finally(() => setLoading(false));
  }, [policyNumber, providerProductId]);

  // Fetch once per modal instance. The ref guard stops React Strict Mode's
  // dev-only double-invoke from hitting Digit's status API twice.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    load();
  }, [load]);

  // Loosely-typed view of the Digit response for the deep, optional fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Digit's status payload is deeply dynamic; typed access below is optional-chained.
  const d = data as any;
  const cov = d?.contract?.coverages;
  const v = d?.vehicle;
  const prev = d?.previousInsurer;
  const person = Array.isArray(d?.persons) ? d.persons[0] : null;
  const addr = person?.addresses?.[0];
  const vehicleName = [v?.make, v?.model].filter(Boolean).join(" ");
  const discountAmt = Number(String(d?.discounts?.specialDiscountAmount ?? "").replace(/[^0-9.]/g, "")) || 0;

  const coverGroups: { title: string; items: CoverItem[] }[] = cov
    ? [
        { title: "Coverages", items: pickCoverItems(cov) },
        { title: "Add-ons", items: pickCoverItems(cov.addons) },
        { title: "Accessories", items: pickCoverItems(cov.accessories) },
        { title: "Legal Liability", items: pickCoverItems(cov.legalLiability) },
        { title: "Unnamed Person Accident", items: pickCoverItems(cov.unnamedPA) },
      ].filter((g) => g.items.length > 0)
    : [];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand to-violet" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">Policy details</p>
              <h2 className="truncate font-display text-lg font-bold text-ink">{heading ?? "Policy"}</h2>
              <p className="truncate text-xs text-ink-soft">
                {subheading ? `${subheading} · ` : ""}<span className="font-mono">{policyNumber}</span>
              </p>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-paper hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[72vh] space-y-4 overflow-y-auto p-6">
            {loading ? (
              <DetailsSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-coral/20 bg-coral/5 px-6 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                  <AlertCircle className="h-6 w-6" strokeWidth={1.9} />
                </span>
                <p className="text-sm font-semibold text-ink">{error}</p>
                <button onClick={load}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90">
                  <RefreshCw className="h-4 w-4" /> Try again
                </button>
              </div>
            ) : data ? (
              <>
                {/* status pills */}
                <div className="flex flex-wrap gap-2">
                  <StatusPill label="Policy" status={d.policyStatus ?? d.policyState} />
                  <StatusPill label="KYC" status={d.kycStatus?.kycVerificationStatus} />
                  <StatusPill label="Payment" status={d.kycStatus?.paymentStatus} />
                </div>

                <Section icon={ShieldCheck} title="Policy">
                  <Row label="Policy number" value={d.policyNumber ?? policyNumber} mono />
                  {d.applicationId && <Row label="Application ID" value={d.applicationId} mono />}
                  {d.enquiryId && <Row label="Enquiry ID" value={d.enquiryId} mono />}
                  <Row label="Cover start" value={fmtDate(d.contract?.startDate)} />
                  <Row label="Cover end" value={fmtDate(d.contract?.endDate)} />
                  {d.contract?.insuranceProductCode && <Row label="Product code" value={d.contract.insuranceProductCode} mono />}
                  {d.contract?.subInsuranceProductCode && <Row label="Sub-product code" value={d.contract.subInsuranceProductCode} mono />}
                  {d.contract?.currentNoClaimBonus && <Row label="No-claim bonus" value={titleCase(d.contract.currentNoClaimBonus)} />}
                </Section>

                {(vehicleName || v?.licensePlateNumber) && (
                  <Section icon={Car} title="Vehicle">
                    {vehicleName && <Row label="Vehicle" value={vehicleName} />}
                    {v?.licensePlateNumber && <Row label="Registration No." value={v.licensePlateNumber} mono />}
                    {v?.vehicleIdentificationNumber && <Row label="VIN / Chassis" value={v.vehicleIdentificationNumber} mono />}
                    {v?.engineNumber && <Row label="Engine No." value={v.engineNumber} mono />}
                    <Row label="IDV (Insured Declared Value)" value={fmtINR(v?.vehicleIDV?.idv)} />
                    {v?.vehicleCapacity ? <Row label="Engine capacity" value={`${v.vehicleCapacity} cc`} /> : null}
                    {v?.seatingCapacity ? <Row label="Seating capacity" value={String(v.seatingCapacity)} /> : null}
                    {v?.power ? <Row label="Power" value={`${v.power} kW`} /> : null}
                    {v?.grossVehicleWeight?.grossVehicleWeight ? <Row label="Gross weight" value={`${v.grossVehicleWeight.grossVehicleWeight} kg`} /> : null}
                    {v?.manufactureDate && <Row label="Manufactured" value={fmtDate(v.manufactureDate)} />}
                    {v?.registrationDate && <Row label="Registered" value={fmtDate(v.registrationDate)} />}
                  </Section>
                )}

                <Section icon={CreditCard} title="Premium">
                  <Row label="Net premium" value={fmtINR(d.netPremium)} />
                  <Row label="GST" value={fmtINR(d.serviceTax?.totalTax)} />
                  {discountAmt > 0 && <Row label="Discount" value={<span className="text-teal">− {fmtINR(discountAmt)}</span>} />}
                  <Row label="Total payable (gross)" value={<span className="font-display text-base font-extrabold">{fmtINR(d.grossPremium)}</span>} />
                </Section>

                {coverGroups.map((g) => <CoverGroup key={g.title} title={g.title} items={g.items} />)}

                {prev?.isPreviousInsurerKnown && (
                  <Section icon={History} title="Previous Insurer">
                    <Row label="Insurer" value={insurerName(prev.previousInsurerCode)} />
                    {prev.previousPolicyNumber && <Row label="Policy number" value={prev.previousPolicyNumber} mono />}
                    {prev.previousPolicyExpiryDate && <Row label="Expiry" value={fmtDate(prev.previousPolicyExpiryDate)} />}
                    {prev.previousNoClaimBonus && <Row label="Previous NCB" value={titleCase(prev.previousNoClaimBonus)} />}
                    <Row label="Claim last year" value={prev.isClaimInLastYear ? "Yes" : "No"} />
                  </Section>
                )}

                {person && (
                  <Section icon={User} title="Proposer">
                    <Row label="Name" value={[person.firstName, person.lastName].filter(Boolean).join(" ") || "—"} />
                    {person.dateOfBirth && <Row label="Date of birth" value={fmtDate(person.dateOfBirth)} />}
                    {person.gender && <Row label="Gender" value={titleCase(person.gender)} />}
                    {addr && <Row label="Address" value={[addr.city, addr.district, addr.pincode].filter(Boolean).join(", ")} />}
                  </Section>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
