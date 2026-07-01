"use client";

import { useCallback, useRef, useState } from "react";

/**
 * OTP entry — auto-advancing boxes with paste + backspace support. Calls
 * `onComplete` once every box is filled. Length is configurable (backend
 * accepts 4–8 digits; defaults to 6).
 */
export default function OtpInput({
  length = 6,
  disabled,
  error,
  onComplete,
}: {
  length?: number;
  disabled?: boolean;
  error?: boolean;
  onComplete: (code: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const submit = useCallback(
    (next: string[]) => {
      if (next.every((d) => d !== "")) onComplete(next.join(""));
    },
    [onComplete],
  );

  function setAt(i: number, val: string) {
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    return next;
  }

  function handleChange(i: number, raw: string) {
    const val = raw.replace(/\D/g, "").slice(-1);
    const next = setAt(i, val);
    if (val && i < length - 1) refs.current[i + 1]?.focus();
    submit(next);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      setAt(i - 1, "");
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(length).fill("").map((_, idx) => pasted[idx] ?? "");
    setDigits(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
    submit(next);
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
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
          className={`h-13 w-11 rounded-xl border bg-white text-center text-lg font-bold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60 ${
            error ? "border-coral ring-4 ring-coral/15" : "border-line"
          }`}
        />
      ))}
    </div>
  );
}
