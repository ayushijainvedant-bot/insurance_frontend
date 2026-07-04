"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, User, ShieldCheck, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";

import { StatusPill, fmtINR, fmtDate, titleCase } from "@/components/cms/ui";
import { getPolicy, type AdminPolicyDetail } from "@/services/cmsData";

function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs font-semibold text-ink-soft">{label}</span>
      <span className={`min-w-0 break-all text-right text-sm text-ink ${mono ? "font-mono text-xs" : "font-semibold"}`}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/50 p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="text-brand">{icon}</span> {title}
      </h3>
      <div className="divide-y divide-line/70">{children}</div>
    </div>
  );
}

export default function PolicyDetailModal({ policyId, onClose }: { policyId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminPolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    getPolicy(policyId)
      .then((d) => { if (alive) setDetail(d); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : "Couldn't load this policy."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [policyId]);

  return (
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
              <p className="text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">Policy</p>
              <h2 className="font-display text-lg font-bold text-ink">
                {loading ? "Loading…" : detail?.policyNumber ?? "—"}
              </h2>
              {detail && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusPill status={detail.status} />
                  <span className="text-xs text-ink-soft">Payment</span>
                  <StatusPill status={detail.paymentStatus} />
                </div>
              )}
            </div>
            <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-paper hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
            ) : error ? (
              <div className="flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/8 px-4 py-3 text-sm text-coral">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            ) : detail ? (
              <>
                <Section icon={<User className="h-4 w-4" />} title="Customer">
                  <Row label="Name" value={
                    detail.customer?.id ? (
                      <Link href={`/cms/customers/${detail.customer.id}`} onClick={onClose} className="text-brand hover:underline">
                        {detail.customer?.name ?? "—"}
                      </Link>
                    ) : (detail.customer?.name ?? "—")
                  } />
                  <Row label="Email" value={detail.customer?.email} />
                  <Row label="Phone" value={detail.customer?.phone} mono />
                  <Row label="Date of birth" value={fmtDate(detail.customer?.dob)} />
                </Section>

                <Section icon={<Building2 className="h-4 w-4" />} title="Insurer & product">
                  <Row label="Insurer" value={detail.provider?.name ?? "—"} />
                  <Row label="Provider code" value={detail.provider?.code} mono />
                  <Row label="Product" value={detail.productName ?? titleCase(detail.category)} />
                  <Row label="Category" value={titleCase(detail.category)} />
                  <Row label="Product code" value={detail.offering?.productCode} mono />
                  <Row label="Sub-product code" value={detail.offering?.subProductCode ?? "—"} mono />
                </Section>

                <Section icon={<ShieldCheck className="h-4 w-4" />} title="Policy">
                  <Row label="Policy number" value={detail.policyNumber} mono />
                  <Row label="Application ID" value={detail.applicationId} mono />
                  <Row label="Enquiry ID" value={detail.enquiryId} mono />
                  <Row label="Status" value={<StatusPill status={detail.status} />} />
                  <Row label="Cover start" value={fmtDate(detail.startDate)} />
                  <Row label="Cover end" value={fmtDate(detail.endDate)} />
                  <Row label="Premium" value={fmtINR(detail.premiumPaid)} />
                  <Row label="Purchased" value={fmtDate(detail.createdAt)} />
                </Section>

                <Section icon={<CreditCard className="h-4 w-4" />} title={`Payments (${detail.payments.length})`}>
                  {detail.payments.length === 0 ? (
                    <p className="py-2 text-sm text-ink-soft">No payments recorded.</p>
                  ) : (
                    detail.payments.map((pay) => (
                      <div key={pay.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="flex items-center gap-2">
                          <StatusPill status={pay.status} />
                          <span className="text-xs text-ink-soft">{titleCase(pay.paymentMode)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-ink">{fmtINR(pay.premium)}</span>
                          <span className="text-[0.7rem] text-ink-soft">{fmtDate(pay.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </Section>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
