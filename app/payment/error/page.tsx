"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, ArrowLeft, Lock } from "lucide-react";

import Navbar from "@/components/Navbar";

/**
 * Payment failure / cancellation landing page. Go Digit redirects the browser
 * here when a payment is cancelled or fails (PAYMENT_CANCEL_RETURN_URL →
 * /payment/error). Purely presentational — no charge has been made and no state
 * changes here; the customer simply returns to the app to retry.
 */
export default function PaymentErrorPage() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-paper px-4 py-16">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-coral/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-violet/15 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-white/90 p-8 text-center shadow-2xl shadow-coral/10 backdrop-blur sm:p-12"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-coral to-violet" />

          <motion.span
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
            className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-coral to-rose-500 shadow-lg shadow-coral/30"
          >
            <XCircle className="h-11 w-11 text-white" strokeWidth={1.8} />
          </motion.span>

          <h1 className="mt-6 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Payment unsuccessful
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Your payment was cancelled or could not be completed, and no amount has been charged.
            You can head back and try again.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/proposal"
              className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/25 hover:opacity-90">
              <RefreshCw className="h-4 w-4" /> Return &amp; try again
            </Link>
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-paper">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>

          <p className="mt-7 flex items-center justify-center gap-1.5 border-t border-line pt-5 text-[0.7rem] text-ink-soft">
            <Lock className="h-3 w-3" /> Secured by Go Digit · IRDAI regulated
          </p>
        </motion.div>
      </main>
    </>
  );
}
