"use client";

import Link from "next/link";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 40 40" fill="none" aria-hidden>
      <defs>
        <linearGradient id="authLg" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#2952FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#authLg)" />
      <path d="M20 10l7 3v6c0 5-3.2 8.2-7 9.5C16.2 27.2 13 24 13 19v-6l7-3z" fill="white" />
      <path d="M16.5 19.6l2.6 2.6 5-5.6" stroke="#2952FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HIGHLIGHTS = [
  "Compare 50+ insurers in one place",
  "Buy in minutes — fully paperless",
  "24×7 claims & renewal support",
];

/** Friendly flat scene: someone relaxing on a bench with plants under the sun. */
function SceneArt() {
  return (
    <svg viewBox="0 0 320 240" className="w-full max-w-md" fill="none" aria-hidden>
      {/* sun */}
      <circle cx="278" cy="42" r="18" fill="#FBBF24" opacity="0.95" />
      {/* soft clouds */}
      <ellipse cx="70" cy="46" rx="26" ry="10" fill="#ffffff" opacity="0.25" />
      <ellipse cx="96" cy="52" rx="18" ry="8" fill="#ffffff" opacity="0.2" />

      {/* ground */}
      <path d="M0 206 Q160 182 320 206 L320 240 L0 240 Z" fill="rgba(255,255,255,0.16)" />
      <ellipse cx="160" cy="212" rx="132" ry="13" fill="rgba(0,0,0,0.10)" />

      {/* left cactus in a pot */}
      <g>
        <rect x="56" y="150" width="24" height="36" rx="10" fill="#0E9F94" />
        <rect x="70" y="158" width="26" height="11" rx="5" fill="#12B3A6" />
        <rect x="42" y="162" width="22" height="10" rx="5" fill="#12B3A6" />
        <path d="M50 186 h36 l-4 16 h-28 z" fill="#F59E0B" />
      </g>

      {/* bench */}
      <rect x="98" y="178" width="124" height="8" rx="4" fill="#F59E0B" />
      <rect x="106" y="186" width="6" height="22" rx="3" fill="#D97706" />
      <rect x="208" y="186" width="6" height="22" rx="3" fill="#D97706" />

      {/* person sitting */}
      <g>
        <rect x="151" y="172" width="9" height="26" rx="4" fill="#334155" />
        <rect x="163" y="172" width="9" height="26" rx="4" fill="#334155" />
        <rect x="148" y="196" width="16" height="7" rx="3" fill="#111827" />
        <rect x="160" y="196" width="16" height="7" rx="3" fill="#111827" />
        <rect x="147" y="140" width="28" height="36" rx="13" fill="#FF6B5B" />
        <path d="M174 148 q9 6 7 20" stroke="#F5C9A6" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="161" cy="128" r="13" fill="#F5C9A6" />
        <path d="M149 126 a12 12 0 0 1 24 -2 q-5 -7 -13 -7 q-9 0 -11 9 z" fill="#1E293B" />
      </g>

      {/* right leafy plant */}
      <g>
        <path d="M262 152 q-14 -30 0 -46 q7 18 6 32 z" fill="#0E9F94" />
        <path d="M266 154 q18 -26 36 -22 q-12 18 -32 30 z" fill="#12B3A6" />
        <path d="M264 154 q-24 -12 -32 0 q16 8 32 10 z" fill="#0E9F94" />
        <path d="M250 178 h38 l-5 22 h-28 z" fill="#F59E0B" />
        <rect x="246" y="174" width="46" height="8" rx="4" fill="#D97706" />
      </g>
    </svg>
  );
}

const THEME = {
  login: { grad: "from-brand via-brand to-violet", blob: "bg-violet/50" },
  signup: { grad: "from-teal via-teal to-brand", blob: "bg-teal/50" },
} as const;

/**
 * Split-screen shell for the auth pages: a friendly welcome scene on the left
 * (distinct gradient per `variant`) and the form on a soft surface on the
 * right. Collapses to a centered card with a compact logo on mobile.
 */
export default function AuthShell({
  children,
  variant = "login",
}: {
  children: React.ReactNode;
  variant?: "login" | "signup";
}) {
  const t = THEME[variant];

  return (
    <main className="min-h-screen bg-paper lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Welcome panel ── */}
      <aside className={`relative hidden overflow-hidden bg-linear-to-br ${t.grad} text-white lg:flex lg:flex-col lg:justify-between lg:p-12`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className={`pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full blur-3xl ${t.blob}`} />

        {/* bottom wave */}
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 60 C240 120 480 0 720 40 C960 80 1200 20 1440 60 L1440 120 L0 120 Z" fill="rgba(255,255,255,0.07)" />
        </svg>

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <span className="font-display text-xl font-bold">
            vedant<span className="text-white/75">insurance</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-[2.4rem] font-extrabold leading-[1.1]">
            Welcome!<br />Covered in minutes.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            Compare, buy, and manage every policy in one place — no paperwork, no waiting.
          </p>
          <div className="mt-6"><SceneArt /></div>
        </div>

        <div className="relative z-10">
          <ul className="space-y-2.5">
            {HIGHLIGHTS.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-1.5 text-xs text-white/70">
            <ShieldCheck className="h-3.5 w-3.5" /> IRDAI-regulated · Bank-grade encryption
          </p>
        </div>
      </aside>

      {/* ── Form surface ── */}
      <section className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8 ${
        variant === "signup"
          ? "bg-linear-to-br from-paper via-white to-teal/5"
          : "bg-linear-to-br from-paper via-white to-brand/5"
      }`}>
        <div className={`pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl ${variant === "signup" ? "bg-teal/10" : "bg-violet/10"}`} />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-lg font-bold text-ink">
              vedant<span className="text-brand">insurance</span>
            </span>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
