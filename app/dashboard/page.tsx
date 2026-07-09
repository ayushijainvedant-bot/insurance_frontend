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
  LayoutDashboard, Mail, Phone, HeartPulse, TrendingUp, Bike, Plus,
  User, Pencil, Check, CalendarDays,
} from "lucide-react";

const POLICIES_PER_PAGE = 5;

import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboard, updateProfile,
  type Dashboard, type DashboardPolicy, type DashboardPayment, type DashboardUser, type ProfileUpdate,
} from "@/services/dashboard";
import { downloadPolicyPdf } from "@/services/policy";
import PolicyDetailsModal from "@/components/dashboard/PolicyDetailsModal";
import { toE164 } from "@/services/auth";
import type { AuthUser } from "@/types";

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

// Date + time — for created-at timestamps ("08 Jul 2026, 3:35 PM").
const fmtDateTime = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const isActive = (s?: string | null) => ["COMPLETE", "EFFECTIVE"].includes(String(s ?? "").toUpperCase());
const isPaid = (s?: string | null) => String(s ?? "").toUpperCase() === "PAID";
const titleCase = (s?: string | null) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—";

const initials = (name?: string | null) =>
  (name ?? "GD").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "GD";

export default function DashboardPage() {
  const { user, ready, updateUser } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);        // initial load (no data yet)
  const [refetching, setRefetching] = useState(false); // filter/page refetch
  const [error, setError] = useState<string | null>(null);

  // Sidebar section (dashboard-app style tabs, client-side). Honour a `?tab=`
  // deep link (e.g. the navbar's Profile → /dashboard?tab=profile).
  const initialTab = ((): "overview" | "policies" | "payments" | "profile" => {
    if (typeof window === "undefined") return "overview";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "policies" || t === "payments" || t === "profile" ? t : "overview";
  })();
  const [tab, setTab] = useState<"overview" | "policies" | "payments" | "profile">(initialTab);
  // Every policy (one call) — used to group "Your Insurances" by category with
  // real counts/premiums. The Policies tab still paginates server-side.
  const [allPolicies, setAllPolicies] = useState<DashboardPolicy[]>([]);

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

  // One-shot fetch of all policies for the category summary (async → not a
  // synchronous set-state-in-effect).
  useEffect(() => {
    if (!user) return;
    let active = true;
    getDashboard({ limit: 500 })
      .then((d) => { if (active) setAllPolicies(d.policies.rows); })
      .catch(() => { /* the overview just won't show category cards */ });
    return () => { active = false; };
  }, [user]);

  // Group every policy by category → real count / active / premium per category.
  const categoryGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number; active: number; premium: number }>();
    for (const p of allPolicies) {
      const key = (p.category ?? "other").toLowerCase();
      const g = map.get(key) ?? { key: p.category ?? "other", label: `${titleCase(p.category)} Insurance`, count: 0, active: 0, premium: 0 };
      g.count += 1;
      if (isActive(p.status)) g.active += 1;
      g.premium += p.premiumPaid ?? 0;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [allPolicies]);

  // Jump from a category card into the filtered Policies list.
  const openCategory = (value: string) => {
    setCategoryFilter(value); setStatusFilter("all"); setProviderFilter("all"); setPage(1);
    setTab("policies");
  };

  // After a profile edit: refresh the auth session + the dashboard's user record.
  const handleProfileUpdated = (u: AuthUser) => {
    updateUser(u);
    setData((prev) => prev ? { ...prev, user: { id: u.id, name: u.name ?? null, email: u.email, phone: u.phone, dob: u.dob ?? null } } : prev);
  };

  // Wrapped so its identity is stable across renders (used in useMemo deps below).
  const payments = useMemo(() => data?.payments ?? [], [data]);
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
    // Always offer Paid + Not Paid, then add any other statuses present in data.
    const m = new Map<string, string>([["PAID", "Paid"], ["NOT_PAID", "Not Paid"]]);
    payments.forEach((p) => { if (p.status && !m.has(p.status)) m.set(p.status, titleCase(p.status)); });
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

  if (!ready || !user) return <FullLoader />;

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || "there";
  const stats = data?.stats;

  const errorBanner = error && (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/8 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-coral">
        <AlertCircle className="h-4 w-4" /> {error}
      </span>
      <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral/5">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-teal/5 via-paper to-paper pb-16">
        <div className="mx-auto max-w-295 gap-6 px-4 sm:px-6 lg:flex lg:py-8">
          {/* ── Sidebar: profile + nav ── */}
          <DashboardSidebar user={user} tab={tab} onTab={setTab} onNewQuote={() => router.push("/")} />

          {/* ── Content ── */}
          <div className="min-w-0 flex-1 pt-6 lg:pt-0">
            {errorBanner}

            {/* OVERVIEW */}
            {tab === "overview" && (
              <>
                <WelcomeHero name={firstName} />

                <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                  <StatCard icon={FileText} grad="from-brand to-brand" tint="from-brand/6 to-white" border="border-brand/12" label="Total Policies" value={stats?.totalPolicies ?? 0} loading={loading} />
                  <StatCard icon={Clock}    grad="from-amber to-amber" tint="from-amber/6 to-white" border="border-amber/12" label="In Progress"   value={stats?.pendingPolicies ?? 0} loading={loading} />
                  <StatCard icon={Wallet}   grad="from-teal to-brand"  filled                       label="Premium Value" value={fmtINR(stats?.totalPremium)} loading={loading} />
                </section>

                {/* Your Insurances — category-wise */}
                <div className="mt-8">
                  <SectionHeader icon={ShieldCheck} title="Your Insurances"
                    sub={categoryGroups.length ? `${categoryGroups.length} categories` : ""} />
                  {loading && categoryGroups.length === 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl border border-line bg-white" />)}
                    </div>
                  ) : categoryGroups.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryGroups.map((g, i) => (
                        <CategoryCard key={g.key} group={g} index={i} onOpen={() => openCategory(g.key)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent payments preview */}
                <div className="mt-8">
                  <div className="mb-3.5 flex items-center justify-between">
                    <SectionHeader icon={ReceiptText} title="Recent Payments" sub={payments.length ? `${payments.length}` : ""} />
                    {payments.length > 0 && (
                      <button onClick={() => setTab("payments")} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {loading ? <SkeletonList rows={3} compact />
                    : payments.length === 0 ? (
                      <div className="rounded-2xl border border-line bg-white p-5 text-center text-sm text-ink-soft">No payments yet.</div>
                    ) : (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {payments.slice(0, 4).map((pay, i) => <PaymentRow key={pay.id} payment={pay} index={i} />)}
                      </div>
                    )}
                </div>
              </>
            )}

            {/* POLICIES */}
            {tab === "policies" && (
              <>
                <PageHead eyebrow="Manage" title="My Policies"
                  sub={data ? `${data.stats.totalPolicies} total` : ""} busy={refetching} />
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
                        <Pagination page={currentPage} pageCount={pageCount} onPage={setPage} total={total} perPage={perPage} />
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* PAYMENTS */}
            {tab === "payments" && (
              <>
                <PageHead eyebrow="Billing" title="Payments" sub={payments.length ? `${payments.length} total` : ""} />
                {loading ? (
                  <SkeletonList rows={4} compact />
                ) : payments.length === 0 ? (
                  <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink-soft">No payments yet.</div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-white/70 p-2">
                      <FilterSelect value={paymentFilter} onChange={setPaymentFilter}
                        options={[{ value: "all", label: "All payments" }, ...paymentStatusOptions]} />
                      <span className="pr-1 text-[0.7rem] font-semibold text-ink-soft">{filteredPayments.length} of {payments.length}</span>
                    </div>
                    {filteredPayments.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-line bg-white p-5 text-center text-xs text-ink-soft">No payments match this filter.</div>
                    ) : (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {filteredPayments.map((pay, i) => <PaymentRow key={pay.id} payment={pay} index={i} />)}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* PROFILE */}
            {tab === "profile" && (
              <>
                <PageHead eyebrow="Account" title="Your Profile" sub="Manage your details" />
                {loading && !data ? (
                  <div className="h-64 animate-pulse rounded-3xl border border-line bg-white" />
                ) : (
                  <ProfileCard user={data?.user ?? { id: user.id, name: user.name ?? null, email: user.email, phone: user.phone, dob: user.dob ?? null }}
                    onUpdated={handleProfileUpdated} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

/* ── Sidebar (profile + nav) ── */
type TabId = "overview" | "policies" | "payments" | "profile";
const NAV: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "policies", label: "My Policies", icon: ShieldCheck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "profile", label: "Profile", icon: User },
];
function DashboardSidebar({ user, tab, onTab, onNewQuote }: {
  user: AuthUser; tab: string; onTab: (t: TabId) => void; onNewQuote: () => void;
}) {
  return (
    <aside className="lg:sticky lg:top-22 lg:h-fit lg:w-64 lg:shrink-0">
      {/* Account chip */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet text-sm font-extrabold text-white shadow-md shadow-brand/25">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-ink">{user.name || "Your account"}</p>
          <p className="truncate text-[0.7rem] text-ink-soft">{user.email || user.phone}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex gap-2 overflow-x-auto rounded-2xl border border-line bg-white p-2 lg:flex-col lg:gap-1">
        {NAV.map((n) => {
          const active = tab === n.id;
          const Icon = n.icon;
          return (
            <button key={n.id} type="button" onClick={() => onTab(n.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition lg:w-full ${
                active ? "bg-linear-to-r from-brand to-violet text-white shadow-sm shadow-brand/25"
                       : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.2 : 1.8} /> {n.label}
            </button>
          );
        })}
      </nav>

      <button onClick={onNewQuote}
        className="mt-4 hidden w-full items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90 lg:flex">
        <Plus className="h-4 w-4" /> Get new quote
      </button>
    </aside>
  );
}

/* ── Category ("Your Insurances") card ── */
const CAT_ICON: Record<string, React.ElementType> = {
  four_wheeler: Car, "four wheeler": Car, fourwheeler: Car,
  two_wheeler: Bike, "two wheeler": Bike, twowheeler: Bike,
  health: HeartPulse, term_life: ShieldCheck, "term life": ShieldCheck,
  investment: TrendingUp,
};
const CAT_TONE = [
  { grad: "from-brand to-violet", tint: "from-brand/8 to-white", border: "border-brand/15", bar: "from-brand to-violet" },
  { grad: "from-teal to-emerald-500", tint: "from-teal/8 to-white", border: "border-teal/15", bar: "from-teal to-brand" },
  { grad: "from-coral to-rose-500", tint: "from-coral/8 to-white", border: "border-coral/15", bar: "from-coral to-amber" },
  { grad: "from-amber to-orange-500", tint: "from-amber/8 to-white", border: "border-amber/15", bar: "from-amber to-coral" },
  { grad: "from-violet to-brand", tint: "from-violet/8 to-white", border: "border-violet/15", bar: "from-violet to-brand" },
];
function CategoryCard({ group, index, onOpen }: {
  group: { key: string; label: string; count: number; active: number; premium: number }; index: number; onOpen: () => void;
}) {
  const Icon = CAT_ICON[group.key.toLowerCase()] ?? ShieldCheck;
  const t = CAT_TONE[index % CAT_TONE.length];
  const pct = group.count ? Math.round((group.active / group.count) * 100) : 0;
  return (
    <motion.button type="button" onClick={onOpen}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-3xl border bg-linear-to-br p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${t.tint} ${t.border}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br shadow-md ${t.grad}`}>
          <Icon className="h-6 w-6 text-white" strokeWidth={1.9} />
        </span>
        <ArrowRight className="h-4 w-4 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
      <p className="mt-3 font-display text-base font-bold text-ink">{group.label}</p>
      <p className="text-xs text-ink-soft">{group.count} {group.count === 1 ? "policy" : "policies"} · {group.active} active</p>

      {/* active ratio bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
        <span className={`block h-full rounded-full bg-linear-to-r ${t.bar}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">Total premium</span>
        <span className="font-display text-lg font-extrabold text-ink">{fmtINR(group.premium)}</span>
      </div>
    </motion.button>
  );
}

/* ── Profile (view + edit) ── */
function ProfileCard({ user, onUpdated }: { user: DashboardUser; onUpdated: (u: AuthUser) => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toLocal = () => ({
    name: user.name ?? "",
    email: user.email ?? "",
    phone: (user.phone ?? "").replace(/\D/g, "").slice(-10),
    dob: user.dob ?? "",
  });
  const [form, setForm] = useState(toLocal);

  const startEdit = () => { setForm(toLocal()); setErr(null); setEditing(true); };
  const set = (k: keyof ReturnType<typeof toLocal>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true); setErr(null);
    try {
      const payload: ProfileUpdate = {};
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = toE164(form.phone.trim());
      if (form.dob) payload.dob = form.dob;
      onUpdated(await updateProfile(payload));
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't update your profile.");
    } finally { setBusy(false); }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      {/* gradient header — avatar + name live inside it (frosted avatar so it
          stands out on the gradient), so nothing overlaps or gets clipped. */}
      <div className="relative bg-linear-to-br from-brand via-violet to-teal p-6 text-white">
        <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/12" />
        <span className="pointer-events-none absolute right-28 top-8 h-10 w-10 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute bottom-4 left-12 h-2.5 w-2.5 rounded-full bg-white/50" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-extrabold ring-1 ring-white/30 backdrop-blur-sm">
              {initials(user.name)}
            </span>
            <div>
              <p className="font-display text-lg font-bold">{user.name || "—"}</p>
              <p className="text-xs text-white/80">{user.email || user.phone}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide ring-1 ring-white/25">
                <ShieldCheck className="h-3 w-3" /> Verified customer
              </span>
            </div>
          </div>
          {!editing && (
            <button onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
      {!editing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={User} label="Full name" value={user.name || "—"} />
          <InfoRow icon={Mail} label="Email" value={user.email || "—"} />
          <InfoRow icon={Phone} label="Phone" value={user.phone || "—"} />
          <InfoRow icon={CalendarDays} label="Date of birth" value={user.dob ? fmtDate(user.dob) : "—"} />
        </div>
      ) : (
        <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
          <EditField label="Full name">
            <input value={form.name} onChange={set("name")} placeholder="Your name" className={profileInput} />
          </EditField>
          <EditField label="Email">
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={profileInput} />
          </EditField>
          <EditField label="Phone">
            <div className="flex items-stretch gap-2">
              <span className="flex shrink-0 items-center rounded-lg border border-line bg-paper px-2.5 text-xs font-bold text-ink">+91</span>
              <input inputMode="numeric" maxLength={10} value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                placeholder="10-digit number" className={profileInput} />
            </div>
          </EditField>
          <EditField label="Date of birth">
            <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={set("dob")} className={profileInput} />
          </EditField>

          {err && <p className="text-xs text-coral sm:col-span-2">{err}</p>}

          <div className="flex items-center gap-2 pt-1 sm:col-span-2">
            <button onClick={save} disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-brand to-violet px-5 py-2 text-xs font-bold text-white shadow-sm shadow-brand/25 hover:opacity-90 disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save changes
            </button>
            <button onClick={() => { setEditing(false); setErr(null); }} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink-soft hover:bg-paper disabled:opacity-60">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const profileInput =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[0.62rem] font-bold uppercase tracking-wide text-ink-soft">{label}</label>
      {children}
    </div>
  );
}

/* ── Cute welcome hero (overview) ── */
function WelcomeHero({ name }: { name: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-brand via-violet to-teal p-6 text-white shadow-xl shadow-brand/25 sm:p-8"
    >
      {/* floating decorative bubbles */}
      <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/12" />
      <span className="pointer-events-none absolute right-28 top-10 h-16 w-16 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-14 left-16 h-36 w-36 rounded-full bg-white/8" />
      <span className="pointer-events-none absolute bottom-6 right-10 h-3 w-3 rounded-full bg-white/50" />
      <span className="pointer-events-none absolute top-8 left-1/2 h-2 w-2 rounded-full bg-white/40" />

      <div className="relative">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-white/75">
          <Sparkles className="h-3.5 w-3.5" /> Your dashboard
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-extrabold sm:text-3xl">
          Welcome back, {name} <span className="inline-block origin-bottom-right animate-[wave_1.6s_ease-in-out_infinite]">👋</span>
        </h1>
        <p className="mt-1 text-sm text-white/85">Here&apos;s a cheerful look at your insurance today.</p>
      </div>

      {/* keyframes for the waving hand */}
      <style>{`@keyframes wave{0%,60%,100%{transform:rotate(0)}15%{transform:rotate(16deg)}30%{transform:rotate(-8deg)}45%{transform:rotate(14deg)}}`}</style>
    </motion.section>
  );
}

/* ── Page heading (per tab) ── */
function PageHead({ eyebrow, title, sub, busy }: { eyebrow: string; title: string; sub?: string; busy?: boolean }) {
  return (
    <div className="mb-6">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
        <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2.5">
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {sub && <span className="rounded-full bg-paper px-2.5 py-0.5 text-[0.7rem] font-bold text-ink-soft">{sub}</span>}
        {busy && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
      </div>
    </div>
  );
}

/* ── Policy card ── */
// Rotating pastel themes so the policy list is colourful, not monotone.
const POLICY_TONE = [
  { border: "border-brand/15",  bg: "from-brand/7 via-white to-violet/5",  accent: "from-brand to-violet",     glow: "bg-brand/10",  av: "from-brand to-violet",       hover: "hover:shadow-brand/10" },
  { border: "border-teal/15",   bg: "from-teal/8 via-white to-brand/5",    accent: "from-teal to-brand",       glow: "bg-teal/10",   av: "from-teal to-emerald-500",   hover: "hover:shadow-teal/10" },
  { border: "border-coral/15",  bg: "from-coral/8 via-white to-amber/5",   accent: "from-coral to-amber",      glow: "bg-coral/10",  av: "from-coral to-rose-500",     hover: "hover:shadow-coral/10" },
  { border: "border-violet/15", bg: "from-violet/8 via-white to-brand/5",  accent: "from-violet to-brand",     glow: "bg-violet/10", av: "from-violet to-brand",       hover: "hover:shadow-violet/10" },
  { border: "border-amber/15",  bg: "from-amber/8 via-white to-coral/5",   accent: "from-amber to-orange-500", glow: "bg-amber/10",  av: "from-amber to-orange-500",   hover: "hover:shadow-amber/10" },
];
function PolicyCard({ policy, index }: { policy: DashboardPolicy; index: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const active = isActive(policy.status);
  const pp = policy.providerProduct;
  const t = POLICY_TONE[index % POLICY_TONE.length];
  const CatIcon = CAT_ICON[(policy.category ?? "").toLowerCase()] ?? Car;

  async function onDownload() {
    if (!policy.applicationId || !policy.providerProductId) {
      setErr("Policy document isn't available yet."); return;
    }
    setBusy(true); setErr(null);
    try { await downloadPolicyPdf(policy.applicationId, policy.providerProductId, `policy-${policy.policyNumber ?? policy.id}.pdf`); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't download the policy."); }
    finally { setBusy(false); }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-3xl border bg-linear-to-br p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${t.border} ${t.bg} ${t.hover}`}
    >
      {/* soft glow */}
      <div className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl ${t.glow}`} />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-md transition-transform group-hover:scale-105 ${t.av}`}>
            <CatIcon className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-ink">
              {policy.productName ?? "Motor Insurance"}
            </p>
            <p className="flex items-center gap-1 text-xs text-ink-soft">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-ink/8 text-[0.5rem] font-extrabold text-ink-soft">
                {initials(policy.provider?.name)}
              </span>
              {policy.provider?.name ?? "Insurer"}
            </p>
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
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand transition-colors hover:text-violet"
        >
          View details
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        {active && (
          <button onClick={onDownload} disabled={busy} title="Download policy PDF"
            className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-brand to-violet px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-brand/25 hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download PDF
          </button>
        )}
      </div>

      {/* ── Full details modal (live policy status from the insurer) ── */}
      {open && policy.policyNumber && policy.providerProductId && (
        <PolicyDetailsModal
          policyNumber={policy.policyNumber}
          providerProductId={policy.providerProductId}
          heading={policy.productName ?? pp?.product?.name ?? "Policy"}
          subheading={policy.provider?.name ?? undefined}
          onClose={() => setOpen(false)}
        />
      )}
    </motion.article>
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
        <p className="mt-0.5 text-[0.62rem] text-ink-soft">{fmtDateTime(payment.createdAt)}</p>
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
