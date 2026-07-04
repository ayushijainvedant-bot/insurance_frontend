"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, ShieldCheck, BadgeCheck, Clock, Wallet, Building2, Package, Layers,
  CreditCard, AlertCircle, RefreshCw, ArrowRight,
} from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import {
  Card, TableWrap, Th, Td, LoadingRows, EmptyRow, StatusPill, Avatar,
  fmtINR, titleCase,
} from "@/components/cms/ui";
import { getAdminDashboard, type AdminDashboard } from "@/services/cmsData";

export default function CmsDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await getAdminDashboard()); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load the dashboard."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = data?.stats;

  return (
    <CmsShell title="Dashboard">
      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/8 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-coral"><AlertCircle className="h-4 w-4" /> {error}</span>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral/5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Primary stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={Users}      grad="from-brand to-violet"    label="Customers"        value={s?.totalCustomers} loading={loading} />
        <Stat icon={ShieldCheck} grad="from-violet to-brand"   label="Policies"         value={s?.totalPolicies}  loading={loading} />
        <Stat icon={BadgeCheck} grad="from-teal to-emerald-500" label="Active Policies" value={s?.activePolicies} loading={loading} />
        <Stat icon={Wallet}     grad="from-brand to-teal"      label="Policy Value"     value={fmtINR(s?.policyValue)} loading={loading} money />
      </section>

      {/* Secondary stats */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat icon={CreditCard}  label="Paid"        value={s?.paidPayments} loading={loading} tone="teal" />
        <MiniStat icon={Clock}       label="Unpaid"      value={s?.pendingPayments} loading={loading} tone="amber" />
        <MiniStat icon={Wallet}      label="Revenue"     value={fmtINR(s?.revenue)} loading={loading} tone="brand" money />
        <MiniStat icon={Building2}   label="Providers"   value={s?.totalProviders} loading={loading} tone="violet" />
        <MiniStat icon={Package}     label="Products"    value={s?.totalProducts} loading={loading} tone="brand" />
        <MiniStat icon={Layers}      label="Offerings"   value={s?.totalOfferings} loading={loading} tone="teal" />
      </section>

      {/* Recent activity */}
      <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent policies */}
        <Card>
          <SectionHead icon={ShieldCheck} title="Recent Policies" href="/cms/policies" />
          <TableWrap>
            <thead><tr>
              <Th>Customer</Th><Th>Insurer</Th><Th>Policy No.</Th><Th>Status</Th><Th className="text-right">Premium</Th>
            </tr></thead>
            <tbody>
              {loading ? <LoadingRows cols={5} rows={5} />
                : !data || data.recentPolicies.length === 0 ? <EmptyRow cols={5} label="No policies yet." />
                : data.recentPolicies.map((p) => (
                  <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.customer?.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{p.customer?.name ?? "—"}</p>
                          <p className="truncate text-[0.7rem] text-ink-soft">{p.productName ?? titleCase(p.category)}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-ink-soft">{p.provider?.name ?? "—"}</Td>
                    <Td className="font-mono text-xs">{p.policyNumber ?? "—"}</Td>
                    <Td><StatusPill status={p.status} /></Td>
                    <Td className="text-right font-semibold">{fmtINR(p.premiumPaid)}</Td>
                  </tr>
                ))}
            </tbody>
          </TableWrap>
        </Card>

        {/* Recent payments */}
        <Card>
          <SectionHead icon={CreditCard} title="Recent Payments" href="/cms/payments" />
          <TableWrap>
            <thead><tr><Th>Policy No.</Th><Th>Status</Th><Th className="text-right">Amount</Th></tr></thead>
            <tbody>
              {loading ? <LoadingRows cols={3} rows={5} />
                : !data || data.recentPayments.length === 0 ? <EmptyRow cols={3} label="No payments yet." />
                : data.recentPayments.map((p) => (
                  <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                    <Td className="font-mono text-xs">{p.policyNumber ?? "—"}</Td>
                    <Td><StatusPill status={p.status} /></Td>
                    <Td className="text-right font-semibold">{fmtINR(p.premium)}</Td>
                  </tr>
                ))}
            </tbody>
          </TableWrap>
        </Card>
      </section>
    </CmsShell>
  );
}

/* ── pieces ── */
function Stat({ icon: Icon, grad, label, value, loading, money }: {
  icon: React.ElementType; grad: string; label: string; value: React.ReactNode; loading: boolean; money?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand/5 blur-2xl" />
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${grad} shadow-md`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
      </span>
      <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      {loading ? <div className="mt-1 h-7 w-16 animate-pulse rounded bg-paper" />
        : <p className={`mt-0.5 font-display font-extrabold text-ink ${money ? "text-xl" : "text-2xl"}`}>{value ?? 0}</p>}
    </motion.div>
  );
}

const TONE: Record<string, string> = {
  teal: "text-teal bg-teal/10", amber: "text-amber bg-amber/10", brand: "text-brand bg-brand/10", violet: "text-violet bg-violet/10",
};
function MiniStat({ icon: Icon, label, value, loading, tone, money }: {
  icon: React.ElementType; label: string; value: React.ReactNode; loading: boolean; tone: string; money?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.6rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
        {loading ? <div className="mt-0.5 h-5 w-12 animate-pulse rounded bg-paper" />
          : <p className={`font-display font-bold text-ink ${money ? "text-sm" : "text-lg"}`}>{value ?? 0}</p>}
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, title, href }: { icon: React.ElementType; title: string; href: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <span className="flex items-center gap-2 font-display text-sm font-bold text-ink">
        <Icon className="h-4 w-4 text-brand" /> {title}
      </span>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
