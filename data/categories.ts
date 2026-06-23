import { ShieldCheck, HeartPulse, Bike, Car, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeColor, InsuranceCategory } from "@/types";

/**
 * Presentation for each backend product `category` — the bits the backend
 * doesn't store (the Lucide icon and brand colour) plus the stable
 * frontend `id` (a QuoteTabId) used by the quote modal. Keyed by the
 * backend's snake_case category so `services/products.ts` can enrich the
 * API response. New/unknown categories fall back to DEFAULT_PRESENTATION.
 *
 * NOTE: this file holds presentation only — the actual product list
 * (names, badges, features, codes) comes entirely from the backend
 * products API. There is no static product catalogue.
 */
export interface CategoryPresentation {
  id: string;
  icon: LucideIcon;
  badgeColor: BadgeColor;
}

export const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  term_life:    { id: "term-life",    icon: ShieldCheck, badgeColor: "teal" },
  health:       { id: "health",       icon: HeartPulse,  badgeColor: "brand" },
  two_wheeler:  { id: "two-wheeler",  icon: Bike,        badgeColor: "coral" },
  four_wheeler: { id: "four-wheeler", icon: Car,         badgeColor: "teal" },
  investment:   { id: "investment",   icon: TrendingUp,  badgeColor: "amber" },
};

export const DEFAULT_PRESENTATION: CategoryPresentation = {
  id: "term-life",
  icon: ShieldCheck,
  badgeColor: "brand",
};

/**
 * Static fallback catalogue — used by ProductsProvider ONLY when the
 * products API can't be reached (or returns nothing), so the homepage and
 * quote modal still render the plans. Mirrors the backend seed content.
 */
export const categories: InsuranceCategory[] = [
  {
    id: "term-life",
    name: "Term Life Insurance",
    badge: "Upto 15% Discount",
    badgeColor: "teal",
    tagline: "Pure life cover at India's lowest premium.",
    cta: "Get Quote",
    icon: ShieldCheck,
    features: ["Coverage up to ₹5 Crore", "Claim settlement ratio 99%+", "No medical test up to 45 yrs"],
    productCode: "TERM_LIFE",
    subProductCode: null,
  },
  {
    id: "health",
    name: "Health Insurance",
    badge: "Lowest Price Guarantee",
    badgeColor: "brand",
    tagline: "Cashless treatment at 10,000+ hospitals.",
    cta: "Get Quote",
    icon: HeartPulse,
    features: ["Day 1 coverage", "No room rent sub-limit", "OPD & mental health included"],
    productCode: "HEALTH",
    subProductCode: null,
  },
  {
    id: "two-wheeler",
    name: "Two Wheeler Insurance",
    badge: "Upto 85% Discount",
    badgeColor: "coral",
    tagline: "Comprehensive bike cover from ₹482/year.",
    cta: "Get Quote",
    icon: Bike,
    features: ["Zero-depreciation add-on", "24×7 roadside assist", "Instant policy copy"],
    productCode: "TWO_WHEELER",
    subProductCode: null,
  },
  {
    id: "four-wheeler",
    name: "Four Wheeler Insurance",
    badge: "Lowest Price Guarantee",
    badgeColor: "teal",
    tagline: "Renew your car policy in under 3 minutes.",
    cta: "Get Quote",
    icon: Car,
    features: ["Engine & gearbox protection", "Return to invoice cover", "100+ add-on options"],
    productCode: "20102",
    subProductCode: "PB",
  },
  {
    id: "investment",
    name: "Investment Plans",
    badge: "Upto 7.4% Returns",
    badgeColor: "amber",
    tagline: "Market-linked returns with life cover built in.",
    cta: "Get Quote",
    icon: TrendingUp,
    features: ["Guaranteed return options", "Tax savings under 80C", "In-built life cover"],
    productCode: "INVESTMENT",
    subProductCode: null,
  },
];
