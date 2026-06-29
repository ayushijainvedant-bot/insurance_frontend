"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import SignInModal from "@/components/SignInModal";

function LogoMark() {
  return (
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="qgLg" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#2952FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#qgLg)" />
      <path d="M20 10l7 3v6c0 5-3.2 8.2-7 9.5C16.2 27.2 13 24 13 19v-6l7-3z" fill="white" />
      <path d="M16.5 19.6l2.6 2.6 5-5.6" stroke="#2952FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Full-screen gate shown when an unauthenticated user lands on /quotes.
 * Signing in (inline) flips `useAuth().user`, which re-renders the page
 * into the actual results — no quote fetch happens until then.
 */
export default function QuoteAuthGate() {
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-white to-paper px-4 text-center">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-xl font-bold text-ink">
          vedant<span className="text-brand">insurance</span>
        </span>
      </Link>

      <div className="mt-10 w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <Lock className="h-7 w-7 text-brand" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 font-display text-xl font-bold text-ink">
          Sign in to view your quotes
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          You need to be signed in to see your personalised insurance quotes.
        </p>

        <Button
          onClick={() => setSignInOpen(true)}
          className="mt-6 w-full bg-linear-to-r from-brand to-violet text-white hover:opacity-90"
        >
          Sign in to continue
        </Button>

        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </main>
  );
}
