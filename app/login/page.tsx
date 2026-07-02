"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2, Smartphone, Mail, Lock, ShieldCheck, Eye, EyeOff, UserPlus, ArrowRight,
} from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import OtpInput from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { requestOtp, verifyOtp, loginWithPassword, AuthError } from "@/services/auth";

const input =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10";
const RESEND_COOLDOWN = 30;

// Post-login redirect target from `?next=`. Only same-origin relative paths are
// allowed (blocks "//evil.com" and absolute URLs → no open redirect).
function safeNext(): string {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const anim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [tab, setTab] = useState<"otp" | "email">("otp");

  function onSignedIn(result: Parameters<typeof signIn>[0]) {
    signIn(result);
    router.push(safeNext());
  }

  return (
    <AuthShell>
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-7 shadow-2xl shadow-brand/10 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand to-violet" />
        <h1 className="font-display text-2xl font-extrabold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign in to manage your policies and quotes.</p>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
          <TabButton active={tab === "otp"} onClick={() => setTab("otp")} icon={Smartphone} label="Mobile OTP" />
          <TabButton active={tab === "email"} onClick={() => setTab("email")} icon={Mail} label="Email" />
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {tab === "otp" ? (
              <motion.div key="otp" {...anim}><OtpTab onSignedIn={onSignedIn} /></motion.div>
            ) : (
              <motion.div key="email" {...anim}><EmailTab onSignedIn={onSignedIn} /></motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          New to vedant<span className="font-semibold text-brand">insurance</span>?{" "}
          <Link href="/signup" className="font-bold text-brand hover:underline">Create an account</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
        active ? "bg-white text-brand shadow-sm" : "text-ink-soft hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/* ── Tab 1: Mobile + OTP ── */
function OtpTab({ onSignedIn }: { onSignedIn: (r: Awaited<ReturnType<typeof verifyOtp>>) => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "notFound">("phone");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<{ mobile: string }>();

  // Send them to sign up with the number (and any ?next) prefilled.
  const goSignup = useCallback(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    const params = new URLSearchParams({ mobile });
    if (next && next.startsWith("/") && !next.startsWith("//")) params.set("next", next);
    router.push(`/signup?${params.toString()}`);
  }, [mobile, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // After showing the "no account" notice, auto-continue to sign up.
  useEffect(() => {
    if (step !== "notFound") return;
    const id = setTimeout(goSignup, 3200);
    return () => clearTimeout(id);
  }, [step, goSignup]);

  const sendOtp = handleSubmit(async ({ mobile: m }) => {
    setErr(null); setLoading(true);
    try {
      const { devOtp: code } = await requestOtp(m);
      setMobile(m); setDevOtp(code ?? null); setResendIn(RESEND_COOLDOWN); setStep("otp");
    } catch (e) {
      // Unknown number → show a friendly "sign up first" notice, then redirect.
      if (e instanceof AuthError && e.code === "USER_NOT_FOUND") {
        setMobile(m); setStep("notFound");
        return;
      }
      setErr(e instanceof AuthError ? e.message : "Could not send OTP. Please try again.");
    } finally { setLoading(false); }
  });

  async function resend() {
    if (resendIn > 0 || loading) return;
    setErr(null);
    try {
      const { devOtp: code } = await requestOtp(mobile);
      setDevOtp(code ?? null); setResendIn(RESEND_COOLDOWN);
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Couldn't resend the OTP.");
    }
  }

  async function verify(code: string) {
    setErr(null); setLoading(true);
    try {
      onSignedIn(await verifyOtp(mobile, code));
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Verification failed. Please try again.");
    } finally { setLoading(false); }
  }

  if (step === "notFound") {
    return (
      <motion.div {...anim} className="space-y-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber to-orange-500 shadow-lg shadow-amber/30">
          <UserPlus className="h-7 w-7 text-white" strokeWidth={1.9} />
        </span>
        <div>
          <p className="font-display text-lg font-bold text-ink">No account found</p>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink-soft">
            We couldn&apos;t find an account for <span className="font-semibold text-ink">+91 {mobile}</span>. Let&apos;s create one — it only takes a minute.
          </p>
        </div>
        <Button onClick={goSignup} className="w-full gap-1.5 bg-linear-to-r from-brand to-violet py-5 text-white shadow-lg shadow-brand/25 hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Create your account <ArrowRight className="h-4 w-4" />
        </Button>
        <button type="button" onClick={() => { setStep("phone"); setErr(null); }} className="text-xs font-semibold text-brand hover:underline">
          Use a different number
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
          <Loader2 className="h-3 w-3 animate-spin text-brand" /> Taking you to sign up…
        </p>
      </motion.div>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          Enter the code sent to <span className="font-semibold text-ink">+91 {mobile}</span>.{" "}
          <button type="button" onClick={() => { setStep("phone"); setErr(null); }} className="font-semibold text-brand hover:underline">Change</button>
        </p>
        <OtpInput disabled={loading} error={!!err} onComplete={verify} />
        {err && <p className="text-center text-xs text-coral">{err}</p>}
        {devOtp && <p className="text-center text-[0.7rem] text-ink-soft">Dev mode — OTP is <span className="font-mono font-semibold text-ink">{devOtp}</span>.</p>}
        <div className="flex items-center justify-center text-xs text-ink-soft">
          Didn&apos;t get it?{" "}
          {resendIn > 0
            ? <span className="ml-1">Resend in {resendIn}s</span>
            : <button type="button" onClick={resend} className="ml-1 font-semibold text-brand hover:underline">Resend OTP</button>}
        </div>
        {loading && <p className="flex items-center justify-center gap-2 text-xs text-ink-soft"><Loader2 className="h-4 w-4 animate-spin text-brand" /> Verifying…</p>}
      </div>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Mobile Number</label>
        <div className="flex items-stretch gap-2">
          <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink">
            <span aria-hidden>🇮🇳</span> +91
          </span>
          <input type="tel" inputMode="numeric" maxLength={10} autoFocus className={input} placeholder="Enter mobile number"
            {...register("mobile", { required: "Mobile number is required", pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" } })} />
        </div>
        {errors.mobile && <p className="mt-1 text-xs text-coral">{errors.mobile.message}</p>}
        {err && <p className="mt-1 text-xs text-coral">{err}</p>}
      </div>
      <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-linear-to-r from-brand to-violet py-5 text-white hover:opacity-90">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP…</> : "Send OTP"}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
        <ShieldCheck className="h-3.5 w-3.5 text-teal" /> Your number is encrypted and never shared.
      </p>
    </form>
  );
}

/* ── Tab 2: Email + password ── */
function EmailTab({ onSignedIn }: { onSignedIn: (r: Awaited<ReturnType<typeof loginWithPassword>>) => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; password: string }>();

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setErr(null); setLoading(true);
    try {
      onSignedIn(await loginWithPassword(email, password));
    } catch (e) {
      setErr(e instanceof AuthError ? e.message : "Incorrect email or password.");
    } finally { setLoading(false); }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input type="email" autoFocus className={`${input} pl-10`} placeholder="you@example.com"
            {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />
        </div>
        {errors.email && <p className="mt-1 text-xs text-coral">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-ink-soft">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input type={show ? "text" : "password"} className={`${input} px-10`} placeholder="Your password"
            {...register("password", { required: "Password is required" })} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-brand" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-coral">{errors.password.message}</p>}
      </div>
      {err && <p className="text-xs text-coral">{err}</p>}
      <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-linear-to-r from-brand to-violet py-5 text-white hover:opacity-90">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
      </Button>
    </form>
  );
}
