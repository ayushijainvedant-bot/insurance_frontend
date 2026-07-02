"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User as UserIcon, Mail, Phone, CalendarDays, ShieldCheck, Loader2, Check,
  Sparkles, AlertCircle, BadgeCheck, LayoutDashboard, Pencil, X,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, type ProfileUpdate } from "@/services/dashboard";
import { toE164 } from "@/services/auth";
import type { AuthUser } from "@/types";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

const initials = (name?: string | null) =>
  (name ?? "U").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d
    : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ProfilePage() {
  const { user, ready, updateUser } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toLocal = (u: AuthUser | null) => ({
    name: u?.name ?? "",
    email: u?.email ?? "",
    phone: (u?.phone ?? "").replace(/\D/g, "").slice(-10),
    dob: u?.dob ?? "",
  });
  const [form, setForm] = useState(() => toLocal(user));

  // Auth gate.
  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/profile");
  }, [ready, user, router]);

  // Keep the form in sync when the user first loads.
  useEffect(() => {
    if (user && !editing) setForm(toLocal(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  const startEdit = () => { setForm(toLocal(user)); setError(null); setDone(false); setEditing(true); };
  const set = (k: keyof ReturnType<typeof toLocal>) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true); setError(null); setDone(false);
    try {
      const payload: ProfileUpdate = {};
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = toE164(form.phone.trim());
      if (form.dob) payload.dob = form.dob;
      const updated = await updateProfile(payload);
      updateUser(updated);
      setEditing(false);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update your profile.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-brand/6 via-paper to-paper pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line bg-linear-to-br from-brand/8 via-violet/5 to-white">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Account
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-extrabold text-ink sm:text-4xl">Profile settings</h1>
            <p className="mt-1 text-sm text-ink-soft">View and update your personal details.</p>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/5 blur-3xl" />

            {/* Identity header */}
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet text-lg font-extrabold text-white shadow-lg shadow-brand/25">
                  {initials(user.name)}
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-ink">{user.name || "Your account"}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                    <BadgeCheck className="h-3.5 w-3.5 text-teal" /> {user.role} · Member since {fmtDate(user.createdAt)}
                  </p>
                </div>
              </div>
              {!editing && (
                <button onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-bold text-brand transition hover:border-brand/40 hover:bg-brand/5">
                  <Pencil className="h-4 w-4" /> Edit profile
                </button>
              )}
            </div>

            {done && (
              <div className="relative mt-5 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/8 px-3.5 py-2.5 text-sm font-semibold text-teal">
                <Check className="h-4 w-4" /> Profile updated successfully.
              </div>
            )}
            {error && (
              <div className="relative mt-5 flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/8 px-3.5 py-2.5 text-sm text-coral">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {/* Fields */}
            {!editing ? (
              <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
                <ViewField icon={UserIcon} label="Full name" value={user.name || "—"} />
                <ViewField icon={Mail} label="Email" value={user.email || "—"} />
                <ViewField icon={Phone} label="Phone" value={user.phone || "—"} />
                <ViewField icon={CalendarDays} label="Date of birth" value={fmtDate(user.dob)} />
              </div>
            ) : (
              <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <input value={form.name} onChange={set("name")} placeholder="Your name" className={field} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={field} />
                </Field>
                <Field label="Phone">
                  <div className="flex items-stretch gap-2">
                    <span className="flex shrink-0 items-center rounded-xl border border-line bg-paper px-3 text-sm font-bold text-ink">+91</span>
                    <input inputMode="numeric" maxLength={10} value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                      placeholder="10-digit number" className={field} />
                  </div>
                </Field>
                <Field label="Date of birth">
                  <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={set("dob")} className={field} />
                </Field>

                <div className="flex items-center gap-2 pt-1 sm:col-span-2">
                  <Button onClick={save} disabled={busy}
                    className="gap-1.5 bg-linear-to-r from-brand to-violet text-white shadow-lg shadow-brand/25 hover:opacity-90">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes
                  </Button>
                  <button onClick={() => { setEditing(false); setError(null); }} disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink-soft hover:bg-paper disabled:opacity-60">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Footer links */}
            <div className="relative mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:bg-paper">
                <LayoutDashboard className="h-4 w-4 text-brand" /> Go to dashboard
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <ShieldCheck className="h-3.5 w-3.5 text-teal" /> Your details are encrypted and never shared.
              </span>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}

function ViewField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper/50 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</label>
      {children}
    </div>
  );
}
