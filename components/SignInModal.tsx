"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { requestOtp, verifyOtp, AuthError } from "@/services/auth";
import type { VerifyOtpResult } from "@/types";

// Same field styling used across the app's forms (see GetQuoteModal).
const input =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

const OTP_LENGTH = 6;
// Backend doesn't return a retry window, so we enforce a client-side
// cooldown before "Resend OTP" becomes available again.
const RESEND_COOLDOWN = 30;

interface PhoneForm {
  mobile: string;
}

export default function SignInModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  // Dev-only convenience: the backend echoes the OTP in development.
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const {
    register, handleSubmit, formState: { errors },
  } = useForm<PhoneForm>();

  // ── Resend countdown ──
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // ── STEP 1 → request OTP ──
  const onPhoneSubmit = handleSubmit(async ({ mobile: m }) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { devOtp: code } = await requestOtp(m);
      setMobile(m);
      setDevOtp(code ?? null);
      setResendIn(RESEND_COOLDOWN);
      setStep("otp");
    } catch (err) {
      setAuthError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  });

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setAuthError(null);
    try {
      const { devOtp: code } = await requestOtp(mobile);
      setDevOtp(code ?? null);
      setResendIn(RESEND_COOLDOWN);
    } catch (err) {
      setAuthError(err instanceof AuthError ? err.message : "Couldn't resend the OTP.");
    }
  }

  // ── STEP 2 → verify OTP ──
  async function handleVerify(code: string) {
    setAuthError(null);
    setLoading(true);
    try {
      const result: VerifyOtpResult = await verifyOtp(mobile, code);
      signIn(result);
      setStep("done");
      // Successful login → settle on the done state, then close and
      // refresh so the rest of the app re-renders as signed-in. (Only "/"
      // exists today; swap this for router.push("/dashboard") later.)
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 1300);
    } catch (err) {
      setAuthError(err instanceof AuthError ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Reset everything after the close animation finishes.
  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setTimeout(() => {
        setStep("phone");
        setMobile("");
        setLoading(false);
        setAuthError(null);
        setResendIn(0);
        setDevOtp(null);
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-md overflow-y-auto"
        // Close ONLY via the ✕ button: ignore outside clicks, focus loss
        // (e.g. switching tabs to read the OTP SMS), and the Escape key.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">

          {/* ── STEP 1: mobile number ── */}
          {step === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <DialogHeader>
                <DialogTitle>Sign in to vedant<span className="text-brand">insurance</span></DialogTitle>
                <DialogDescription>
                  For a more personalised experience, sign in with your registered mobile number.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onPhoneSubmit} className="space-y-4 px-6 pb-6">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink-soft">Mobile Number</label>
                  <div className="flex items-stretch gap-2">
                    <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-ink">
                      <span aria-hidden>🇮🇳</span> +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      autoFocus
                      className={input}
                      placeholder="Enter mobile number"
                      aria-invalid={!!errors.mobile}
                      {...register("mobile", {
                        required: "Mobile number is required",
                        pattern: { value: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" },
                      })}
                    />
                  </div>
                  {errors.mobile && <p className="mt-1 text-xs text-coral">{errors.mobile.message}</p>}
                  {authError && <p className="mt-1 text-xs text-coral">{authError}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-linear-to-r from-brand to-violet text-white hover:opacity-90"
                >
                  {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP…</>) : "Sign in with OTP"}
                </Button>

                <p className="flex items-center justify-center gap-1.5 pt-1 text-[0.7rem] text-ink-soft">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal" />
                  Your number is encrypted and never shared.
                </p>
              </form>
            </motion.div>
          )}

          {/* ── STEP 2: verify OTP ── */}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DialogHeader>
                <DialogTitle>Verify OTP</DialogTitle>
                <DialogDescription>
                  Enter the 6-digit OTP sent to <span className="font-semibold text-ink">+91 {mobile}</span>.{" "}
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setAuthError(null); }}
                    className="font-semibold text-brand hover:underline"
                  >
                    Change number
                  </button>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-6 pb-6">
                <OtpInput
                  disabled={loading}
                  error={!!authError}
                  onComplete={handleVerify}
                />

                {authError && <p className="text-center text-xs text-coral">{authError}</p>}

                {devOtp && (
                  <p className="text-center text-[0.7rem] text-ink-soft">
                    Dev mode — your OTP is <span className="font-mono font-semibold text-ink">{devOtp}</span>.
                  </p>
                )}

                <div className="flex items-center justify-center text-xs text-ink-soft">
                  Didn&apos;t get the code?{" "}
                  {resendIn > 0 ? (
                    <span className="ml-1">Resend in {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={handleResend} className="ml-1 font-semibold text-brand hover:underline">
                      Resend OTP
                    </button>
                  )}
                </div>

                {loading && (
                  <p className="flex items-center justify-center gap-2 text-xs text-ink-soft">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" /> Verifying…
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: success ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center px-6 py-14 text-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                <CheckCircle2 className="h-9 w-9 text-teal" />
              </span>
              <p className="mt-5 font-display text-xl font-bold text-ink">You&apos;re signed in!</p>
              <p className="mt-2 text-sm text-ink-soft">
                Welcome to vedant<span className="font-semibold text-brand">insurance</span> — taking you back to where you left off.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────
   OTP input — six auto-advancing boxes with paste support.
   Calls onComplete once all six digits are filled.
   ──────────────────────────────────────────────────────────── */
function OtpInput({
  disabled,
  error,
  onComplete,
}: {
  disabled?: boolean;
  error?: boolean;
  onComplete: (code: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const submit = useCallback((next: string[]) => {
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  }, [onComplete]);

  function setAt(i: number, val: string) {
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    return next;
  }

  function handleChange(i: number, raw: string) {
    const val = raw.replace(/\D/g, "").slice(-1); // keep last typed digit
    const next = setAt(i, val);
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
    submit(next);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      setAt(i - 1, "");
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("").map((_, idx) => pasted[idx] ?? "");
    setDigits(next);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    submit(next);
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoFocus={i === 0}
          disabled={disabled}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`h-12 w-11 rounded-lg border bg-paper text-center text-lg font-bold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 ${
            error ? "border-coral ring-2 ring-coral/20" : "border-line"
          }`}
        />
      ))}
    </div>
  );
}
