"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck, FileText, Clock, Wallet, BadgeCheck, Loader2, Car, Download,
  ArrowRight, Sparkles, AlertCircle, CreditCard, ReceiptText, RefreshCw, ChevronDown,
  SlidersHorizontal, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const POLICIES_PER_PAGE = 5;

import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboard,
  type Dashboard, type DashboardPolicy, type DashboardPayment,
} from "@/services/dashboard";
import { downloadPolicyPdf } from "@/services/policy";

/* ── helpers ── */
const fmtINR = (n?: number | null) =>
  n == null ? "—" : `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const isActive = (s?: string | null) => ["COMPLETE", "EFFECTIVE"].includes(String(s ?? "").toUpperCase());
const isPaid = (s?: string | null) => String(s ?? "").toUpperCase() === "PAID";
const titleCase = (s?: string | null) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—";

const initials = (name?: string | null) =>
  (name ?? "GD").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "GD";

export default function DashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);        // initial load (no data yet)
  const [refetching, setRefetching] = useState(false); // filter/page refetch
  const [error, setError] = useState<string | null>(null);

  // Policy filters + pagination — server-driven.
  const [statusFilter, setStatusFilter] = useState("all");       // exact policy status
  const [providerFilter, setProviderFilter] = useState("all");   // provider code
  const [categoryFilter, setCategoryFilter] = useState("all");   // product category
  const [paymentFilter, setPaymentFilter] = useState("all");     // client-side, on recent payments
  const [page, setPage] = useState(1);

  // Auth gate — bounce to login (preserving the return path) once we know
  // there's no session.
  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/dashboard");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    setError(null); setRefetching(true);
    try {
      setData(await getDashboard({
        page, limit: POLICIES_PER_PAGE,
        status: statusFilter, provider: providerFilter, category: categoryFilter,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your dashboard.");
    } finally { setRefetching(false); setLoading(false); }
  }, [page, statusFilter, providerFilter, categoryFilter]);

  /* eslint-disable-next-line react-hooks/set-state-in-effect -- (re)fetch when the user or query changes. */
  useEffect(() => { if (user) load(); }, [user, load]);

  const payments = data?.payments ?? [];
  const policiesPage = data?.policies;
  const policyRows = policiesPage?.rows ?? [];
  const total = policiesPage?.total ?? 0;
  const pageCount = policiesPage?.pageCount ?? 1;
  const currentPage = policiesPage?.page ?? page;
  const perPage = policiesPage?.limit ?? POLICIES_PER_PAGE;

  // Filter dropdown options come from the server (account-wide distinct values).
  const statusOptions = (data?.filters.statuses ?? []).map((s) => ({ value: s, label: titleCase(s) }));
  const providerOptions = (data?.filters.providers ?? []).map((p) => ({ value: p.code, label: p.name }));
  const categoryOptions = (data?.filters.categories ?? []).map((c) => ({ value: c.value, label: c.label }));

  const paymentStatusOptions = useMemo(() => {
    const m = new Map<string, string>();
    payments.forEach((p) => { if (p.status) m.set(p.status, titleCase(p.status)); });
    return [...m].map(([value, label]) => ({ value, label }));
  }, [payments]);
  const filteredPayments = useMemo(
    () => payments.filter((p) => paymentFilter === "all" || p.status === paymentFilter),
    [payments, paymentFilter],
  );

  // Changing a filter resets to page 1 (both state updates batch → one refetch).
  const changeStatus = (v: string) => { setStatusFilter(v); setPage(1); };
  const changeProvider = (v: string) => { setProviderFilter(v); setPage(1); };
  const changeCategory = (v: string) => { setCategoryFilter(v); setPage(1); };
  const filtersActive = statusFilter !== "all" || providerFilter !== "all" || categoryFilter !== "all";
  const clearFilters = () => {
    setStatusFilter("all"); setProviderFilter("all"); setCategoryFilter("all"); setPage(1);
  };

  if (!ready || (ready && !user)) return <FullLoader />;

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || "there";
  const stats = data?.stats;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-teal/5 via-paper to-paper pb-20">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-teal/10 bg-linear-to-br from-teal/8 via-brand/5 to-white">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative mx-auto max-w-295 px-4 py-10 sm:px-6">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Your dashboard
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Manage your policies, track payments, and download documents — all in one place.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-295 px-4 sm:px-6">
          {/* ── Stats ── */}
          <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard icon={FileText}   grad="from-brand to-brand" tint="from-brand/6 to-white"  border="border-brand/12" label="Total Policies" value={stats?.totalPolicies ?? 0}   loading={loading} />
            <StatCard icon={Clock}      grad="from-amber to-amber"  tint="from-amber/6 to-white"  border="border-amber/12" label="In Progress"    value={stats?.pendingPolicies ?? 0} loading={loading} />
            <StatCard icon={Wallet}     grad="from-teal to-brand"   filled                        label="Premium Value"  value={fmtINR(stats?.totalPremium)} loading={loading} />
          </section>

          {error && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/8 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-coral">
                <AlertCircle className="h-4 w-4" /> {error}
              </span>
              <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral/5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* ── Policies ── */}
            <section>
              <SectionHeader icon={ShieldCheck} title="Your Policies"
                sub={data ? `${data.stats.totalPolicies} total` : ""}
                busy={refetching} />

              {loading ? (
                <SkeletonList rows={3} />
              ) : (data?.stats.totalPolicies ?? 0) === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <FilterBar
                    status={statusFilter} onStatus={changeStatus} statusOptions={statusOptions}
                    provider={providerFilter} onProvider={changeProvider}
                    category={categoryFilter} onCategory={changeCategory}
                    providerOptions={providerOptions} categoryOptions={categoryOptions}
                    active={filtersActive} onClear={clearFilters}
                    showing={total} total={data?.stats.totalPolicies ?? total}
                  />
                  {total === 0 ? (
                    <NoMatches onClear={clearFilters} />
                  ) : (
                    <>
                      <div className={`space-y-3 transition-opacity ${refetching ? "opacity-60" : ""}`}>
                        {policyRows.map((p, i) => <PolicyCard key={p.id} policy={p} index={i} />)}
                      </div>
                      <Pagination
                        page={currentPage} pageCount={pageCount} onPage={setPage}
                        total={total} perPage={perPage}
                      />
                    </>
                  )}
                </>
              )}
            </section>

            {/* ── Payments ── */}
            <aside className="lg:sticky lg:top-22 lg:self-start">
              <SectionHeader icon={ReceiptText} title="Recent Payments"
                sub={data ? `${data.payments.length}` : ""} />
              {loading ? (
                <SkeletonList rows={3} compact />
              ) : !data || data.payments.length === 0 ? (
                <div className="rounded-2xl border border-line bg-white p-5 text-center text-sm text-ink-soft">
                  No payments yet.
                </div>
              ) : (
                <>
                  <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-line bg-white/70 p-2">
                    <FilterSelect value={paymentFilter} onChange={setPaymentFilter}
                      options={[{ value: "all", label: "All payments" }, ...paymentStatusOptions]} />
                    <span className="pr-1 text-[0.7rem] font-semibold text-ink-soft">
                      {filteredPayments.length} of {payments.length}
                    </span>
                  </div>
                  {filteredPayments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-line bg-white p-5 text-center text-xs text-ink-soft">
                      No payments match this filter.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredPayments.map((pay, i) => <PaymentRow key={pay.id} payment={pay} index={i} />)}
                    </div>
                  )}
                </>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

/* ── Policy card ── */
function PolicyCard({ policy, index }: { policy: DashboardPolicy; index: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const active = isActive(policy.status);
  const pp = policy.providerProduct;

  async function onDownload() {
    if (!policy.applicationId || !policy.providerProductId) {
      setErr("Policy document isn't available yet."); return;
    }
    setBusy(true); setErr(null);
    try { await downloadPolicyPdf(policy.applicationId, policy.providerProductId); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't download the policy."); }
    finally { setBusy(false); }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-3xl border border-teal/15 bg-linear-to-br from-teal/7 via-brand/3 to-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal/10"
    >
      {/* thin teal accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal/60 to-brand/60" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-teal/8 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet text-xs font-extrabold text-white shadow-md shadow-brand/25">
            {initials(policy.provider?.name)}
          </span>
          <div>
            <p className="font-display text-sm font-bold text-ink">
              {policy.productName ?? "Motor Insurance"}
            </p>
            <p className="text-xs text-ink-soft">{policy.provider?.name ?? "Insurer"}</p>
          </div>
        </div>
        <StatusPill status={policy.status} active={active} />
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta icon={FileText} label="Policy No." value={policy.policyNumber ?? "—"} mono />
        <Meta icon={Car} label="Category" value={titleCase(policy.category)} />
        <Meta icon={Clock} label="Valid till" value={fmtDate(policy.endDate)} />
        <Meta icon={Wallet} label="Premium" value={fmtINR(policy.premiumPaid)} />
      </div>

      {err && <p className="relative mt-3 text-xs text-coral">{err}</p>}

      <div className="relative mt-4 flex items-center justify-between border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand transition-colors hover:text-violet"
        >
          {open ? "Hide details" : "View details"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {active && (
          <button onClick={onDownload} disabled={busy} title="Download policy PDF"
            className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-brand to-violet px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-brand/25 hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download PDF
          </button>
        )}
      </div>

      {/* ── Full details ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 rounded-2xl border border-violet/12 bg-white/70 p-4 sm:grid-cols-2">
              <DetailRow label="Insurer" value={policy.provider?.name} />
              <DetailRow label="Plan" value={pp?.product?.name ?? policy.productName} />
              <DetailRow label="Vehicle type" value={titleCase(policy.category)} />
              <DetailRow label="Policy number" value={policy.policyNumber} mono />
              <DetailRow label="Status" value={titleCase(policy.status)} />
              <DetailRow label="Cover starts" value={fmtDate(policy.startDate)} />
              <DetailRow label="Valid till" value={fmtDate(policy.endDate)} />
              <DetailRow label="Premium paid" value={fmtINR(policy.premiumPaid)} />
              <DetailRow label="Purchased on" value={fmtDate(policy.createdAt)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ── Detail row (inside the expandable policy details) ── */
function DetailRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5">
      <span className="shrink-0 text-[0.7rem] font-semibold text-ink-soft">{label}</span>
      <span className={`min-w-0 truncate text-right text-xs font-bold text-ink ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ── Payment row ── */
// Rotating soft tints so each payment row gets its own colour.
const PAY_COLORS = [
  { bg: "from-teal/8 to-white",   border: "border-teal/15",   chip: "bg-teal/15 text-teal" },
  { bg: "from-brand/8 to-white",  border: "border-brand/15",  chip: "bg-brand/15 text-brand" },
  { bg: "from-amber/8 to-white",  border: "border-amber/15",  chip: "bg-amber/15 text-amber" },
  { bg: "from-coral/8 to-white",  border: "border-coral/15",  chip: "bg-coral/15 text-coral" },
  { bg: "from-violet/8 to-white", border: "border-violet/15", chip: "bg-violet/15 text-violet" },
];

function PaymentRow({ payment, index }: { payment: DashboardPayment; index: number }) {
  const paid = isPaid(payment.status);
  const c = PAY_COLORS[index % PAY_COLORS.length];
  return (
    <div className={`flex items-center gap-3 rounded-2xl border bg-linear-to-br p-3.5 shadow-sm transition hover:shadow-md ${c.border} ${c.bg}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.chip}`}>
        <CreditCard className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{fmtINR(payment.premium)}</p>
        <p className="truncate font-mono text-[0.68rem] text-ink-soft">{payment.policyNumber ?? payment.applicationId ?? "—"}</p>
      </div>
      <div className="text-right">
        <span className={`inline-block rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${paid ? "bg-teal/10 text-teal" : "bg-amber/10 text-amber"}`}>
          {titleCase(payment.status)}
        </span>
        <p className="mt-0.5 text-[0.62rem] text-ink-soft">{fmtDate(payment.createdAt)}</p>
      </div>
    </div>
  );
}

/* ── small pieces ── */
function StatCard({ icon: Icon, grad, tint, border, filled, label, value, loading }: {
  icon: React.ElementType; grad: string; tint?: string; border?: string; filled?: boolean;
  label: string; value: React.ReactNode; loading: boolean;
}) {
  if (filled) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${grad} p-4 text-white shadow-lg shadow-brand/25 sm:p-5`}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </span>
        <p className="relative mt-3 text-[0.68rem] font-bold uppercase tracking-wide text-white/80">{label}</p>
        {loading
          ? <div className="relative mt-1 h-7 w-16 animate-pulse rounded-md bg-white/25" />
          : <p className="relative mt-0.5 font-display text-2xl font-extrabold">{value}</p>}
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-3xl border ${border ?? "border-line"} bg-linear-to-br ${tint ?? "from-white to-white"} p-4 shadow-sm sm:p-5`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${grad} shadow-md`}>
        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
      </span>
      <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      {loading
        ? <div className="mt-1 h-7 w-16 animate-pulse rounded-md bg-white/60" />
        : <p className="mt-0.5 font-display text-2xl font-extrabold text-ink">{value}</p>}
    </div>
  );
}

function StatusPill({ status, active }: { status: string | null; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
      active ? "bg-teal/10 text-teal" : "bg-amber/10 text-amber"
    }`}>
      {active ? <BadgeCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {active ? "Active" : titleCase(status)}
    </span>
  );
}

function Meta({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`mt-0.5 truncate text-xs font-bold text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub, busy }: { icon: React.ElementType; title: string; sub?: string; busy?: boolean }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-brand to-violet shadow-sm shadow-brand/25">
        <Icon className="h-4 w-4 text-white" strokeWidth={2} />
      </span>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {sub && <span className="rounded-full bg-paper px-2 py-0.5 text-[0.65rem] font-bold text-ink-soft">{sub}</span>}
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
    </div>
  );
}

/* ── filters ── */
type Opt = { value: string; label: string };

function FilterBar({
  status, onStatus, statusOptions, provider, onProvider, category, onCategory,
  providerOptions, categoryOptions, active, onClear, showing, total,
}: {
  status: string; onStatus: (v: string) => void; statusOptions: Opt[];
  provider: string; onProvider: (v: string) => void;
  category: string; onCategory: (v: string) => void;
  providerOptions: Opt[]; categoryOptions: Opt[];
  active: boolean; onClear: () => void; showing: number; total: number;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white/70 p-2.5">
      <span className="inline-flex items-center gap-1.5 pl-1 text-xs font-bold text-ink-soft">
        <SlidersHorizontal className="h-3.5 w-3.5 text-brand" /> Filter
      </span>
      <FilterSelect value={status} onChange={onStatus}
        options={[{ value: "all", label: "All status" }, ...statusOptions]} />
      <FilterSelect value={provider} onChange={onProvider}
        options={[{ value: "all", label: "All insurers" }, ...providerOptions]} />
      <FilterSelect value={category} onChange={onCategory}
        options={[{ value: "all", label: "All products" }, ...categoryOptions]} />
      {active && (
        <button onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink-soft transition hover:border-coral/40 hover:text-coral">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
      <span className="ml-auto pr-1 text-[0.7rem] font-semibold text-ink-soft">{showing} of {total}</span>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: Opt[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-line bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-ink outline-none transition hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}

function Pagination({ page, pageCount, onPage, total, perPage }: {
  page: number; pageCount: number; onPage: (p: number) => void; total: number; perPage: number;
}) {
  if (pageCount <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs text-ink-soft">
        Showing <b className="text-ink">{start}–{end}</b> of {total}
      </span>
      <div className="flex items-center gap-1">
        <PageBtn disabled={page <= 1} onClick={() => onPage(page - 1)} label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </PageBtn>
        {pages.map((n) => (
          <button key={n} onClick={() => onPage(n)}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
              n === page
                ? "bg-linear-to-r from-brand to-violet text-white shadow-sm shadow-brand/25"
                : "border border-line bg-white text-ink-soft hover:border-brand/40 hover:text-brand"
            }`}>
            {n}
          </button>
        ))}
        <PageBtn disabled={page >= pageCount} onClick={() => onPage(page + 1)} label="Next page">
          <ChevronRight className="h-4 w-4" />
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ disabled, onClick, children, label }: {
  disabled: boolean; onClick: () => void; children: React.ReactNode; label: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
      <p className="text-sm font-bold text-ink">No policies match these filters</p>
      <p className="mt-1 text-xs text-ink-soft">Adjust or clear the filters to see all your policies.</p>
      <button onClick={onClear}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-brand hover:bg-paper">
        <X className="h-3.5 w-3.5" /> Clear filters
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-line bg-white p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
        <ShieldCheck className="h-7 w-7 text-brand" />
      </span>
      <p className="mt-4 font-display text-base font-bold text-ink">No policies yet</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">
        Get a quote in minutes and your policies will show up here.
      </p>
      <Link href="/" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90">
        Get your first quote <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function SkeletonList({ rows, compact }: { rows: number; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-2xl border border-line bg-white ${compact ? "h-16" : "h-40"}`} />
      ))}
    </div>
  );
}

function FullLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
    </div>
  );
}
