"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminLogin } from "@/services/adminAuth";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function CmsLoginPage() {
  const router = useRouter();
  const { admin, ready, signIn } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string }>();

  // Already signed in → go to the CMS dashboard.
  useEffect(() => {
    if (ready && admin) router.replace("/cms");
  }, [ready, admin, router]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null); setLoading(true);
    try {
      signIn(await adminLogin(email, password));
      router.replace("/cms");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in. Please try again.");
    } finally { setLoading(false); }
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-ink via-[#111a2e] to-[#0b1220] px-4 py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl backdrop-blur sm:p-8"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand to-violet" />

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-violet shadow-lg shadow-brand/25">
          <LayoutDashboard className="h-6 w-6 text-white" strokeWidth={1.9} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Admin Console</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign in to the Vedant Insurance CMS.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-soft">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input type="email" autoFocus className={`${field} pl-10`} placeholder="admin@example.com"
                {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-coral">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-soft">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input type={show ? "text" : "password"} className={`${field} px-10`} placeholder="Your password"
                {...register("password", { required: "Password is required" })} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-brand" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-coral">{errors.password.message}</p>}
          </div>

          {error && <p className="text-xs text-coral">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-linear-to-r from-brand to-violet py-5 text-white hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
          <ShieldCheck className="h-3.5 w-3.5 text-teal" /> Authorised personnel only.
        </p>
      </motion.div>
    </main>
  );
}
