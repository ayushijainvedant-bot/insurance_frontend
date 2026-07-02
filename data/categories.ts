import { ShieldCheck, HeartPulse, Bike, Car, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeColor } from "@/types";

/**
 * Presentation for each backend product `category` — the bits the backend
 * doesn't store (the Lucide icon and brand colour) plus the stable
 * frontend `id` (a QuoteTabId) used by the quote modal. Keyed by the
 * backend's snake_case category so `services/products.ts` can enrich the
 * API response. New/unknown categories fall back to DEFAULT_PRESENTATION.
 *
 * NOTE: this file holds presentation only — the actual product list
 * (names, badges, features, quotability) comes entirely from the backend
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
