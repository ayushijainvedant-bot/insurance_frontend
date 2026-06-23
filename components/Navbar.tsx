"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Phone, ShieldCheck, HeartPulse, Bike, Car, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import GetQuoteModal from "@/components/GetQuoteModal";
import SignInModal from "@/components/SignInModal";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";

const PRODUCTS = [
  { label: "Term Life Insurance", href: "#", icon: ShieldCheck, color: "text-teal", bg: "bg-teal/10" },
  { label: "Health Insurance",    href: "#", icon: HeartPulse,  color: "text-brand", bg: "bg-brand/10" },
  { label: "Two Wheeler Insurance",href: "#",icon: Bike,        color: "text-coral", bg: "bg-coral/10" },
  { label: "Four Wheeler Insurance",href:"#",icon: Car,         color: "text-teal",  bg: "bg-teal/10"  },
  { label: "Investment Plans",    href: "#", icon: TrendingUp,  color: "text-amber", bg: "bg-amber/10" },
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
  const [signInOpen, setSignInOpen] = useState(false);
  const { user, ready, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[1.05rem] font-bold text-ink">
            vedant<span className="text-brand">insurance</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {/* Products dropdown — hand-rolled so we can hover-open without needing Radix */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm font-semibold text-ink/80 transition-colors hover:text-brand">
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
                      <a
                        key={p.label}
                        href={p.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-paper"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${p.bg}`}>
                          <Icon className={`h-4 w-4 ${p.color}`} strokeWidth={1.8} />
                        </span>
                        <span className="text-sm font-semibold text-ink">{p.label}</span>
                      </a>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV.map((l) => (
            <a key={l.label} href={l.href}
              className="text-sm font-semibold text-ink/80 transition-colors hover:text-brand">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <a href="#" className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 hover:text-brand">
            <Phone className="h-3.5 w-3.5" /> 1800-XXX-XXXX
          </a>
          {/* Auth slot: the signed-out "Sign in" button is the default so
              SSR and the first client render agree (no hydration mismatch);
              once `ready` confirms a stored session we swap to the chip. */}
          {ready && user
            ? <UserMenu user={user} onSignOut={signOut} />
            : <Button variant="ghost" size="sm" onClick={() => setSignInOpen(true)}>Sign in</Button>
          }
          {/* ★ the new "Get Best Quote" button lives here */}
          <GetQuoteModal />
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
                  <a key={p.label} href={p.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-paper">
                    <Icon className={`h-4 w-4 ${p.color}`} strokeWidth={1.8} />
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                  </a>
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
                <GetQuoteModal />
                {ready && user
                  ? <UserMenu user={user} onSignOut={signOut} />
                  : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-ink"
                      onClick={() => { setMobileOpen(false); setSignInOpen(true); }}
                    >
                      Sign in
                    </Button>
                  )
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* One controlled sign-in modal shared by the desktop + mobile triggers */}
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </header>
  );
}
