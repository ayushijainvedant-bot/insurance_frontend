"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Phone, ShieldCheck, HeartPulse, Bike, Car, TrendingUp, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useQuoteModal } from "@/hooks/useQuoteModal";
import type { QuoteTabId } from "@/types";

const PRODUCTS: { label: string; id: QuoteTabId; icon: typeof ShieldCheck; color: string; bg: string }[] = [
  { label: "Term Life Insurance",   id: "term-life",    icon: ShieldCheck, color: "text-teal",  bg: "bg-teal/10"  },
  { label: "Health Insurance",      id: "health",       icon: HeartPulse,  color: "text-brand", bg: "bg-brand/10" },
  { label: "Two Wheeler Insurance", id: "two-wheeler",  icon: Bike,        color: "text-coral", bg: "bg-coral/10" },
  { label: "Four Wheeler Insurance",id: "four-wheeler", icon: Car,         color: "text-teal",  bg: "bg-teal/10"  },
  { label: "Investment Plans",      id: "investment",   icon: TrendingUp,  color: "text-amber", bg: "bg-amber/10" },
];

const NAV = [
  { label: "Renew Policy", href: "#" },
  { label: "Claims",       href: "#" },
  { label: "Support",      href: "#" },
];

function LogoMark() {
  return (
    <svg className="h-8 w-8 shrink-0" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#2952FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#lg)" />
      <path d="M20 10l7 3v6c0 5-3.2 8.2-7 9.5C16.2 27.2 13 24 13 19v-6l7-3z" fill="white" />
      <path d="M16.5 19.6l2.6 2.6 5-5.6" stroke="#2952FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const { user, ready, signOut } = useAuth();
  const { openQuote } = useQuoteModal();

  const quoteButton = (
    <Button
      variant="solid"
      size="sm"
      onClick={() => openQuote()}
      className="gap-1.5 bg-linear-to-r from-brand to-violet text-white shadow-md shadow-brand/25 hover:opacity-90"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Get Best Quote
    </Button>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-295 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[1.05rem] font-bold text-ink">
            vedant<span className="text-brand">insurance</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {/* Products dropdown — hand-rolled so we can hover-open without needing Radix */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className={`relative flex items-center gap-1 text-sm font-semibold transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-linear-to-r after:from-brand after:to-violet after:transition-all ${productsOpen ? "text-brand after:w-full" : "text-ink/80 hover:text-brand after:w-0"}`}>
              Our Insurance
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-xl shadow-ink/8"
                >
                  {PRODUCTS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { openQuote(p.id); setProductsOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-paper"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${p.bg}`}>
                          <Icon className={`h-4 w-4 ${p.color}`} strokeWidth={1.8} />
                        </span>
                        <span className="text-sm font-semibold text-ink">{p.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV.map((l) => (
            <a key={l.label} href={l.href}
              className="relative text-sm font-semibold text-ink/80 transition-colors hover:text-brand after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-linear-to-r after:from-brand after:to-violet after:transition-all hover:after:w-full">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <a href="#" className="flex items-center gap-1.5 rounded-full border border-line bg-paper/70 px-3 py-1.5 text-xs font-bold text-ink/70 transition hover:border-brand/30 hover:text-brand">
            <Phone className="h-3.5 w-3.5 text-brand" /> 1800-XXX-XXXX
          </a>
          {/* Auth slot: the signed-out "Sign in" button is the default so
              SSR and the first client render agree (no hydration mismatch);
              once `ready` confirms a stored session we swap to the chip. */}
          {ready && user
            ? <UserMenu user={user} onSignOut={signOut} />
            : (
              <>
                <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/signup">Create account</Link></Button>
              </>
            )
          }
          {/* ★ the new "Get Best Quote" button lives here */}
          {quoteButton}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center text-ink lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-line bg-white lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              <p className="px-2 pb-1 text-[0.7rem] font-bold uppercase tracking-widest text-ink-soft">
                Our Plans
              </p>
              {PRODUCTS.map((p) => {
                const Icon = p.icon;
                return (
                  <button key={p.label} type="button"
                    onClick={() => { openQuote(p.id); setMobileOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-paper">
                    <Icon className={`h-4 w-4 ${p.color}`} strokeWidth={1.8} />
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                  </button>
                );
              })}
              <div className="my-2 h-px bg-line" />
              {NAV.map((l) => (
                <a key={l.label} href={l.href}
                  className="rounded-lg px-2 py-2.5 text-sm font-semibold text-ink/80 hover:bg-paper">
                  {l.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                {quoteButton}
                {ready && user
                  ? <UserMenu user={user} onSignOut={signOut} />
                  : (
                    <>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                      </Button>
                      <Button asChild variant="solid" size="sm" className="w-full">
                        <Link href="/signup" onClick={() => setMobileOpen(false)}>Create account</Link>
                      </Button>
                    </>
                  )
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
