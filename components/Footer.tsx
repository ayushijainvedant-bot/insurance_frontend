import {
  Phone, Mail, MapPin,
  Send, Rss, MessageCircle, Globe,
  ShieldCheck,
} from "lucide-react";

const COL1 = {
  heading: "Insurance Plans",
  links: [
    { label: "Term Life Insurance",      href: "#" },
    { label: "Health Insurance",          href: "#" },
    { label: "Two Wheeler Insurance",     href: "#" },
    { label: "Four Wheeler Insurance",    href: "#" },
    { label: "Investment Plans",          href: "#" },
  ],
};
const COL2 = {
  heading: "Quick Links",
  links: [
    { label: "Compare Policies",  href: "#" },
    { label: "Renew Policy",      href: "#" },
    { label: "File a Claim",      href: "#" },
    { label: "Track Claim",       href: "#" },
    { label: "Calculators",       href: "#" },
  ],
};
const COL3 = {
  heading: "Company",
  links: [
    { label: "About Us",      href: "#" },
    { label: "Careers",       href: "#" },
    { label: "Media Room",    href: "#" },
    { label: "Partner With Us",href: "#" },
    { label: "Blog",          href: "#" },
  ],
};
const COL4 = {
  heading: "Legal & Support",
  links: [
    { label: "Privacy Policy",       href: "#" },
    { label: "Terms & Conditions",   href: "#" },
    { label: "Grievance Redressal",  href: "#" },
    { label: "IRDAI Registration",   href: "#" },
    { label: "Disclaimer",           href: "#" },
  ],
};
const COLS = [COL1, COL2, COL3, COL4];

const SOCIALS = [
  { icon: Send,          href: "#", label: "Telegram"  },
  { icon: Globe,         href: "#", label: "LinkedIn"  },
  { icon: MessageCircle, href: "#", label: "Instagram" },
  { icon: Rss,           href: "#", label: "YouTube"   },
];

function LogoMark() {
  return (
    <svg className="h-9 w-9 shrink-0" viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="fLg" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#2952FF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#fLg)" />
      <path d="M20 10l7 3v6c0 5-3.2 8.2-7 9.5C16.2 27.2 13 24 13 19v-6l7-3z" fill="white" />
      <path d="M16.5 19.6l2.6 2.6 5-5.6" stroke="#2952FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      {/* CTA banner */}
      <div className="bg-gradient-to-r from-brand to-violet px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Ready to get protected?
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Get the best quote for your plan in under 60 seconds.
            </p>
          </div>
          <a
            href="#"
            className="shrink-0 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Get Best Quote →
          </a>
        </div>
      </div>

      {/* Main footer body */}
      <div className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            {/* Brand column */}
            <div>
              <a href="#" className="flex items-center gap-2.5">
                <LogoMark />
                <span className="font-display text-lg font-bold text-white">
                  vedant<span className="text-brand">insurance</span>
                </span>
              </a>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                IRDAI registered insurance broker helping Indian families compare, buy and manage
                all their insurance plans from one trusted platform.
              </p>

              {/* Contact */}
              <div className="mt-6 space-y-2.5">
                <a href="tel:+911800000000" className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white">
                  <Phone className="h-4 w-4 text-brand" /> 1800-XXX-XXXX (Toll Free)
                </a>
                <a href="mailto:hello@vedantinsurance.in" className="flex items-center gap-2.5 text-sm text-white/70 hover:text-white">
                  <Mail className="h-4 w-4 text-brand" /> hello@vedantinsurance.in
                </a>
                <p className="flex items-start gap-2.5 text-sm text-white/70">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  123 Finance Tower, BKC, Mumbai — 400051
                </p>
              </div>

              {/* Socials */}
              <div className="mt-6 flex gap-3">
                {SOCIALS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-colors hover:bg-brand hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Link columns */}
            {COLS.map((col) => (
              <div key={col.heading}>
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
                  {col.heading}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck className="h-4 w-4 text-teal" />
              IRDAI Registered Insurance Broker · Reg. No. XXXXXX · Valid till DD/MM/YYYY
              {/* TODO: fill in your real registration details */}
            </div>
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} Vedant Insurance Limited. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
