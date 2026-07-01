"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, User, Mail, Lock, Calendar, ShieldCheck, Eye, EyeOff } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signup, AuthError } from "@/services/auth";

const input =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10";

type SignupForm = {
  name: string;
  mobile: string;
  email: string;
  dob?: string;
  password: string;
};

// Backend field names → this form's field names (backend uses "phone").
const FIELD_MAP: Record<string, keyof SignupForm> = {
  name: "name", phone: "mobile", mobile: "mobile", email: "email", dob: "dob", password: "password",
};

// Post-signup redirect target from `?next=` — same-origin relative paths only.
function safeNext(): string {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<SignupForm>();

  const onSubmit = handleSubmit(async (form) => {
    setErr(null); setLoading(true);
    try {
      const result = await signup(form);
      signIn(result);
      router.push(safeNext());
    } catch (e) {
      if (e instanceof AuthError && e.fields) {
        // Surface each backend validation reason on its field.
        for (const [field, reason] of Object.entries(e.fields)) {
          const key = FIELD_MAP[field];
          if (key) setError(key, { message: reason });
        }
      }
      setErr(e instanceof AuthError ? e.message : "Could not create your account. Please try again.");
    } finally { setLoading(false); }
  });

  return (
    <AuthShell variant="signup">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-7 shadow-2xl shadow-teal/10 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-teal to-brand" />
        <h1 className="font-display text-2xl font-extrabold text-ink">Welcome!</h1>
        <p className="mt-1 text-sm text-ink-soft">Sign up in less than 5 minutes.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Full Name" error={errors.name?.message}>
            <IconInput icon={User}>
              <input autoFocus className={`${input} pl-10`} placeholder="Your full name"
                {...register("name", { required: "Name is required", minLength: { value: 2, message: "Enter your full name" } })} />
            </IconInput>
          </Field>

          <Field label="Mobile Number" error={errors.mobile?.message}>
            <div className="flex items-stretch gap-2">
              <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink">
                <span aria-hidden>🇮🇳</span> +91
              </span>
              <input type="tel" inputMode="numeric" maxLength={10} className={input} placeholder="10-digit number"
                {...register("mobile", { required: "Mobile number is required", pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" } })} />
            </div>
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <IconInput icon={Mail}>
              <input type="email" className={`${input} pl-10`} placeholder="you@example.com"
                {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />
            </IconInput>
          </Field>

          <Field label="Date of Birth" hint="Optional" error={errors.dob?.message}>
            <IconInput icon={Calendar}>
              <input type="date" max={new Date().toISOString().slice(0, 10)} className={`${input} pl-10`}
                {...register("dob")} />
            </IconInput>
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <IconInput icon={Lock}>
              <input type={show ? "text" : "password"} className={`${input} px-10`} placeholder="At least 8 characters"
                {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-brand" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </IconInput>
          </Field>

          {err && <p className="text-xs text-coral">{err}</p>}

          <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-linear-to-r from-teal to-brand py-5 text-white hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create account"}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[0.7rem] text-ink-soft">
            <ShieldCheck className="h-3.5 w-3.5 text-teal" /> Your details are encrypted and never shared.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-bold text-ink-soft">{label}</label>
        {hint && <span className="text-[0.65rem] font-semibold text-ink-soft/70">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}

function IconInput({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      {children}
    </div>
  );
}
