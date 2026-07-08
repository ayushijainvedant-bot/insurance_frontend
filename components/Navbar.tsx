"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Phone, ShieldCheck, HeartPulse, Bike, Car, TrendingUp, Sparkles, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import ComingSoonToast from "@/components/ComingSoonToast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
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
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 40 46" fill="none" aria-hidden>
      <defs>
        <linearGradient id="shield" x1="4" y1="2" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E6BFF" />
          <stop offset="1" stopColor="#12B39B" />
        </linearGradient>
      </defs>
      <path d="M20 2l16 6v13c0 12-7 20-16 23C11 41 4 33 4 21V8l16-6z" fill="url(#shield)" />
      <path d="M13.5 23.5l4.5 4.5 9-11" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { user, ready, signOut } = useAuth();
  const { count } = useCart();
  const { categories } = useProducts();
  const { openQuote } = useQuoteModal();

  // A plan is quotable when the backend has insurers for it. While the products
  // list is still loading (empty), allow the click — the modal gates it anyway.
  const isQuotable = (id: QuoteTabId) =>
    categories.length === 0 || categories.some((c) => c.id === id && c.isQuotable);

  // Open the quote modal for a live plan; otherwise show a "coming soon" toast.
  const selectPlan = (id: QuoteTabId, label: string, close: () => void) => {
    close();
    if (isQuotable(id)) openQuote(id);
    else setToast(`${label} is coming soon — stay tuned!`);
  };

  // Cart icon + count badge (only meaningful when signed in).
  const cartButton = ready && user && (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-brand/40 hover:text-brand"
    >
      <ShoppingCart className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-linear-to-r from-brand to-violet px-1 text-[0.6rem] font-bold text-white shadow-sm">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );

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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark />
          <span className="leading-tight">
            <span className="block whitespace-nowrap font-display text-[1.02rem] font-bold text-ink">
              Vedant <span className="text-brand">Insurance</span>
            </span>
            <span className="hidden whitespace-nowrap text-[0.58rem] font-semibold tracking-wide text-ink-soft xl:block">
              Secure Today, Protected Tomorrow
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {/* Products dropdown — hand-rolled so we can hover-open without needing Radix */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className={`relative flex items-center gap-1 whitespace-nowrap text-sm font-semibold transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-linear-to-r after:from-brand after:to-violet after:transition-all ${productsOpen ? "text-brand after:w-full" : "text-ink hover:text-brand after:w-0"}`}>
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
                        onClick={() => selectPlan(p.id, p.label, () => setProductsOpen(false))}
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
              className="relative whitespace-nowrap text-sm font-semibold text-ink transition-colors hover:text-brand after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-linear-to-r after:from-brand after:to-violet after:transition-all hover:after:w-full">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <a href="#" className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper/70 px-3 py-1.5 text-xs font-bold text-ink transition hover:border-brand/30 hover:text-brand">
            <Phone className="h-3.5 w-3.5 text-brand" /> 1800-XXX-XXXX
          </a>
          {/* Auth slot: the signed-out "Sign in" button is the default so
              SSR and the first client render agree (no hydration mismatch);
              once `ready` confirms a stored session we swap to the chip. */}
          <ThemeToggle />
          {cartButton}
          {ready && user
            ? <UserMenu user={user} onSignOut={signOut} />
            : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-ink hover:text-brand"><Link href="/login">Sign in</Link></Button>
                <Button asChild variant="solid" size="sm" className="border border-brand bg-brand font-bold text-white shadow-sm hover:bg-brand-dark"><Link href="/signup">Create account</Link></Button>
              </>
            )
          }
          {/* ★ the new "Get Best Quote" button lives here */}
          {quoteButton}
        </div>

        {/* Mobile: cart + theme toggle + hamburger */}
        <div className="flex items-center gap-1.5 lg:hidden">
          {cartButton}
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center text-ink"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
                    onClick={() => selectPlan(p.id, p.label, () => setMobileOpen(false))}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-paper">
                    <Icon className={`h-4 w-4 ${p.color}`} strokeWidth={1.8} />
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                  </button>
                );
              })}
              <div className="my-2 h-px bg-line" />
              {NAV.map((l) => (
                <a key={l.label} href={l.href}
                  className="rounded-lg px-2 py-2.5 text-sm font-semibold text-ink hover:bg-paper">
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

      <ComingSoonToast message={toast} onDone={() => setToast(null)} />
    </header>
  );
}
