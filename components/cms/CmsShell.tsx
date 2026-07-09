"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldCheck, CreditCard, LogOut, Loader2,
  Package, Building2, Layers,
} from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const NAV = [
  { href: "/cms",                  label: "Dashboard", icon: LayoutDashboard, group: "Operations" },
  { href: "/cms/customers",        label: "Customers", icon: Users,           group: "Operations" },
  { href: "/cms/policies",         label: "Policies",  icon: ShieldCheck,     group: "Operations" },
  { href: "/cms/payments",         label: "Payments",  icon: CreditCard,      group: "Operations" },
  { href: "/cms/products",         label: "Products",  icon: Package,         group: "Catalog" },
  { href: "/cms/providers",        label: "Providers", icon: Building2,       group: "Catalog" },
  { href: "/cms/provider-products", label: "Offerings", icon: Layers,         group: "Catalog" },
];

const initial = (name?: string | null) => (name ?? "A").trim().charAt(0).toUpperCase();

// Shared brand shield (same mark as the public site navbar).
function LogoMark() {
  return (
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 40 46" fill="none" aria-hidden>
      <defs>
        <linearGradient id="cms-shield" x1="4" y1="2" x2="36" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E6BFF" />
          <stop offset="1" stopColor="#12B39B" />
        </linearGradient>
      </defs>
      <path d="M20 2l16 6v13c0 12-7 20-16 23C11 41 4 33 4 21V8l16-6z" fill="url(#cms-shield)" />
      <path d="M13.5 23.5l4.5 4.5 9-11" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CmsShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { admin, ready, signOut } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !admin) router.replace("/cms/login");
  }, [ready, admin, router]);

  if (!ready || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/cms" ? pathname === "/cms" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <LogoMark />
          <span className="leading-tight">
            <span className="block font-display text-[0.95rem] font-bold text-ink">
              Vedant <span className="text-brand">Insurance</span>
            </span>
            <span className="text-[0.56rem] font-bold uppercase tracking-wider text-ink-soft">Admin Console</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n, i) => {
            const Icon = n.icon;
            const active = isActive(n.href);
            const showGroup = i === 0 || NAV[i - 1].group !== n.group;
            return (
              <div key={n.href}>
                {showGroup && (
                  <p className="px-3 pb-1.5 pt-3 text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">{n.group}</p>
                )}
                <Link href={n.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-linear-to-r from-brand to-violet text-white shadow-sm shadow-brand/25"
                           : "text-ink-soft hover:bg-paper hover:text-ink"
                  }`}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.2 : 1.8} /> {n.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <button onClick={() => { signOut(); router.replace("/cms/login"); }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-coral/8 hover:text-coral">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <h1 className="font-display text-lg font-bold text-ink">{title}</h1>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 sm:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-brand to-violet text-[0.6rem] font-bold text-white">
                  {initial(admin.name)}
                </span>
                <span className="text-xs text-ink-soft">{admin.email} · <span className="font-bold uppercase text-brand">{admin.role}</span></span>
              </span>
              <ThemeToggle />
            </div>
          </div>
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link key={n.href} href={n.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    active ? "bg-brand text-white" : "bg-paper text-ink-soft"
                  }`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 bg-linear-to-b from-brand/5 via-paper to-paper p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
