"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Pencil, Trash2, Plus } from "lucide-react";

const input =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10";

/* ── Modal ── */
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand to-violet" />
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Fields ── */
export function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-bold text-ink-soft">{label}</label>
        {hint && <span className="text-[0.62rem] text-ink-soft/70">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={input} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${input} min-h-24 font-mono text-xs`} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={input}>{children}</select>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-teal" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
      {label && <span className="text-ink-soft">{label}</span>}
    </button>
  );
}

/* ── Modal footer buttons ── */
export function FormActions({ busy, onCancel, submitLabel = "Save" }: {
  busy?: boolean; onCancel: () => void; submitLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2">
      <button type="button" onClick={onCancel} disabled={busy}
        className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink-soft hover:bg-paper disabled:opacity-60">
        Cancel
      </button>
      <button type="submit" disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {submitLabel}
      </button>
    </div>
  );
}

/* ── Header "New" button ── */
export function NewButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-brand to-violet px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand/25 hover:opacity-90">
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

/* ── Row actions (edit / delete) ── */
export function RowActions({ onEdit, onDelete, busy }: { onEdit: () => void; onDelete: () => void; busy?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={onEdit} title="Edit" disabled={busy}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-brand/40 hover:text-brand disabled:opacity-50">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} title="Delete" disabled={busy}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-coral/40 hover:text-coral disabled:opacity-50">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
