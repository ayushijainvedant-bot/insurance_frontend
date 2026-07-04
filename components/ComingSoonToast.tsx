"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";

/**
 * Lightweight, self-dismissing "coming soon" toast. Controlled by the parent:
 * pass a `message` to show it; it clears itself via `onDone` after a few seconds.
 */
export default function ComingSoonToast({
  message,
  onDone,
}: {
  message: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed inset-x-0 bottom-6 z-100 mx-auto flex w-fit max-w-[90vw] items-center gap-2.5 rounded-full border border-brand/20 bg-white px-5 py-3 shadow-xl shadow-brand/10"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-violet">
            <Clock className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-ink">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
