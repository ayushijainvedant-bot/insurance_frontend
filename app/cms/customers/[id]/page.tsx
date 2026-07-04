"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, RefreshCw, Loader2, Mail, Phone, Calendar, ShieldCheck, CreditCard } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import {
  Card, TableWrap, Th, Td, EmptyRow, StatusPill, ActivePill, Avatar, fmtDate, fmtINR, titleCase,
} from "@/components/cms/ui";
import { getCustomer, type AdminCustomerDetail } from "@/services/cmsData";

export default function CmsCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try { setDetail(await getCustomer(id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load this customer."); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const c = detail?.customer;

  return (
    <CmsShell title="Customer">
      <button onClick={() => router.push("/cms/customers")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </button>

      {loading && !detail ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/8 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-coral"><AlertCircle className="h-4 w-4" /> {error}</span>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral/5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : !detail || !c ? (
        <p className="text-sm text-ink-soft">Customer not found.</p>
      ) : (
        <div className="space-y-6">
          {/* Profile header */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start gap-4">
              <div className="scale-125 origin-top-left"><Avatar name={c.name} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-ink">{c.name ?? "—"}</h2>
                  <ActivePill active={c.isActive} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {c.email ?? "—"}</span>
                  <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone ?? "—"}</span>
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> DOB {fmtDate(c.dob)}</span>
                  <span className="inline-flex items-center gap-1.5">Joined {fmtDate(c.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Policies" value={detail.policies.length} />
                <Stat icon={<CreditCard className="h-4 w-4" />} label="Payments" value={detail.payments.length} />
              </div>
            </div>
          </Card>

          {/* Policies */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><ShieldCheck className="h-4 w-4 text-brand" /> Policies</h3>
            <Card>
              <TableWrap>
                <thead><tr>
                  <Th>Policy No.</Th><Th>Product</Th><Th>Insurer</Th><Th>Status</Th><Th className="text-right">Premium</Th><Th>Purchased</Th>
                </tr></thead>
                <tbody>
                  {detail.policies.length === 0 ? <EmptyRow cols={6} label="No policies yet." />
                    : detail.policies.map((p) => (
                      <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                        <Td className="font-mono text-xs">{p.policyNumber ?? "—"}</Td>
                        <Td className="font-semibold">{p.productName ?? titleCase(p.category)}</Td>
                        <Td className="text-ink-soft">{p.provider?.name ?? "—"}</Td>
                        <Td><StatusPill status={p.status} /></Td>
                        <Td className="text-right font-semibold">{fmtINR(p.premiumPaid)}</Td>
                        <Td className="text-ink-soft">{fmtDate(p.createdAt)}</Td>
                      </tr>
                    ))}
                </tbody>
              </TableWrap>
            </Card>
          </section>

          {/* Payments */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><CreditCard className="h-4 w-4 text-brand" /> Payments</h3>
            <Card>
              <TableWrap>
                <thead><tr>
                  <Th>Policy No.</Th><Th>Mode</Th><Th>Status</Th><Th className="text-right">Amount</Th><Th>Date</Th>
                </tr></thead>
                <tbody>
                  {detail.payments.length === 0 ? <EmptyRow cols={5} label="No payments yet." />
                    : detail.payments.map((p) => (
                      <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                        <Td className="font-mono text-xs">{p.policyNumber ?? "—"}</Td>
                        <Td className="text-ink-soft">{titleCase(p.paymentMode)}</Td>
                        <Td><StatusPill status={p.status} /></Td>
                        <Td className="text-right font-semibold">{fmtINR(p.premium)}</Td>
                        <Td className="text-ink-soft">{fmtDate(p.createdAt)}</Td>
                      </tr>
                    ))}
                </tbody>
              </TableWrap>
            </Card>
          </section>
        </div>
      )}
    </CmsShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-paper px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-1.5 text-ink-soft">{icon}<span className="text-[0.62rem] font-bold uppercase tracking-wide">{label}</span></div>
      <p className="font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
