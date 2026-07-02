"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck, Sparkles, FileText, Loader2, ArrowLeft, Lock, AlertCircle, RefreshCw, XCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getPolicyStatus, downloadPolicyPdf, type PolicyStatusResult } from "@/services/policy";

/**
 * Payment success landing page. Go Digit redirects the browser here after a
 * payment (PAYMENT_SUCCESS_RETURN_URL → /payment/success) — but that redirect is
 * a *trigger, not proof*. The real decision is made by polling the Policy Status
 * API: policyStatus === "COMPLETE" means paid, "INCOMPLETE" means keep waiting.
 *
 * The checkout tab's React state is gone by now, so we recover the policy
 * context from the URL (if Digit appends it) or from what we stashed in
 * localStorage before redirecting. The policy PDF is NOT downloaded
 * automatically — the customer gets a button once payment is confirmed.
 */

type Ctx = { policyNumber: string; applicationId: string; insurer: string; providerProductId: string };
type Phase = "verifying" | "paid" | "pending" | "denied";

// Payment is the source of truth: paymentStatus === "PAID" (COMPLETE policy is a
// secondary confirmation). Anything else → not paid yet.
const isPaid = (s: PolicyStatusResult) =>
  s.kycStatus?.paymentStatus === "PAID" || s.policyStatus === "COMPLETE";

// Drop the checkout context we stashed before redirecting — no longer needed
// once payment is confirmed.
const clearStash = () => { try { localStorage.removeItem("va:payment"); } catch { /* ignore */ } };

function readContext(): Ctx {
  const sp = new URLSearchParams(window.location.search);
  let stored: Partial<Ctx> = {};
  try { stored = JSON.parse(localStorage.getItem("va:payment") ?? "{}"); } catch { /* ignore */ }
  return {
    policyNumber: sp.get("policyNumber") || sp.get("policyNo") || stored.policyNumber || "",
    applicationId: sp.get("applicationId") || stored.applicationId || "",
    insurer: stored.insurer || "your insurer",
    providerProductId: sp.get("providerProductId") || stored.providerProductId || "",
  };
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [phase, setPhase] = useState<Phase>("verifying");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<Ctx | null>(null);

  // Read the payment context ONCE and consume it: we clear the stash right away
  // so this page is single-use and can't be re-opened by typing the URL. A visit
  // with no context (direct access) is denied and redirected home.
  useEffect(() => {
    if (!ctxRef.current) {
      ctxRef.current = readContext();
      clearStash();
    }
    const c = ctxRef.current;
    setCtx(c);
    if (!c.policyNumber) { setPhase("denied"); return; }

    let cancelled = false;
    (async () => {
      try {
        const s = await getPolicyStatus(c.policyNumber, c.providerProductId);
        if (cancelled) return;
        setPhase(isPaid(s) ? "paid" : "pending");
      } catch {
        if (!cancelled) setPhase("pending");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Direct/expired access → show the notice briefly, then send them home.
  useEffect(() => {
    if (phase !== "denied") return;
    const id = setTimeout(() => router.replace("/"), 5000);
    return () => clearTimeout(id);
  }, [phase, router]);

  // Manual re-check when the first call showed the payment still processing.
  async function recheck() {
    if (!ctx?.policyNumber) return;
    setBusy(true); setError(null);
    try {
      const s = await getPolicyStatus(ctx.policyNumber, ctx.providerProductId);
      if (isPaid(s)) { setPhase("paid"); clearStash(); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check the payment status.");
    } finally { setBusy(false); }
  }

  async function onDownload() {
    if (!ctx?.applicationId) return;
    setBusy(true); setError(null);
    try { await downloadPolicyPdf(ctx.applicationId, ctx.providerProductId); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't download the policy."); }
    finally { setBusy(false); }
  }

  const paid = phase === "paid";
  const verifying = phase === "verifying";

  // Direct access (no active payment) → brief notice, then redirect home.
  if (phase === "denied") {
    return (
      <>
        <Navbar />
        <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-paper px-4 py-16">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet/10 blur-3xl" />
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white/90 p-8 text-center shadow-2xl shadow-brand/10 backdrop-blur sm:p-10"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-brand to-violet" />
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
              <Lock className="h-7 w-7 text-brand" strokeWidth={1.9} />
            </span>
            <h1 className="mt-5 font-display text-xl font-bold text-ink sm:text-2xl">Nothing to show here</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
              This page opens only right after a payment. Taking you back to the home page…
            </p>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" /> Redirecting…
            </p>
            <Link href="/" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90">
              <ArrowLeft className="h-4 w-4" /> Go home now
            </Link>
          </motion.div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-paper px-4 py-16">
        <div className={`pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full blur-3xl ${paid ? "bg-teal/15" : phase === "pending" ? "bg-coral/15" : "bg-brand/10"}`} />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet/15 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-white/90 p-8 text-center shadow-2xl shadow-teal/10 backdrop-blur sm:p-12"
        >
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 ${paid ? "bg-linear-to-r from-teal to-brand" : phase === "pending" ? "bg-linear-to-r from-coral to-rose-500" : "bg-linear-to-r from-brand to-violet"}`} />

          {/* ── Badge ── */}
          {paid ? (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-teal to-brand shadow-lg shadow-teal/30"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-teal/20" />
              <BadgeCheck className="relative h-11 w-11 text-white" strokeWidth={1.8} />
            </motion.span>
          ) : verifying ? (
            <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
              <Loader2 className="h-10 w-10 animate-spin text-brand" strokeWidth={1.8} />
            </span>
          ) : (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-coral to-rose-500 shadow-lg shadow-coral/30"
            >
              <XCircle className="h-11 w-11 text-white" strokeWidth={1.8} />
            </motion.span>
          )}

          {/* ── Heading + copy ── */}
          {paid ? (
            <>
              <h1 className="mt-6 flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                <Sparkles className="h-6 w-6 text-amber" /> Payment successful
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                Your payment is confirmed and your {ctx?.insurer} policy is active. Download your
                policy document below.
              </p>
            </>
          ) : verifying ? (
            <>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-ink sm:text-3xl">Confirming your payment…</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                We&apos;re verifying your payment with Go Digit. This usually takes only a moment — please keep this tab open.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-display text-2xl font-extrabold text-ink sm:text-3xl">Payment unsuccessful</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                We couldn&apos;t confirm your payment. If any amount was deducted it will be refunded.
                If you did complete the payment, tap “Check again”.
              </p>
            </>
          )}

          {ctx?.policyNumber && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 font-mono text-xs text-ink">
              <FileText className="h-4 w-4 text-brand" /> Policy No: <span className="font-bold">{ctx.policyNumber}</span>
            </div>
          )}

          {error && (
            <div className="mx-auto mt-5 flex max-w-sm items-start gap-2.5 rounded-xl border border-coral/30 bg-coral/8 px-3.5 py-3 text-left">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
              <p className="text-[0.72rem] leading-snug text-ink-soft">{error}</p>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {paid && ctx?.applicationId && (
              <Button type="button" onClick={onDownload} disabled={busy}
                className="gap-1.5 bg-linear-to-r from-brand to-violet px-6 text-white shadow-lg shadow-brand/25 hover:opacity-90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Download Policy PDF
              </Button>
            )}
            {phase === "pending" && (
              <Button type="button" onClick={recheck} disabled={busy}
                className="gap-1.5 bg-linear-to-r from-brand to-violet px-6 text-white shadow-lg shadow-brand/25 hover:opacity-90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check again
              </Button>
            )}
            {!verifying && (
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-paper">
                <ArrowLeft className="h-4 w-4" /> Back to Home
              </Link>
            )}
          </div>

          <p className="mt-7 flex items-center justify-center gap-1.5 border-t border-line pt-5 text-[0.7rem] text-ink-soft">
            <Lock className="h-3 w-3" /> Secured by Go Digit · IRDAI regulated
          </p>
        </motion.div>
      </main>
    </>
  );
}
