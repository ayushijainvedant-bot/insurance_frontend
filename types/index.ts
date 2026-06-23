import type { LucideIcon } from "lucide-react";

export type BadgeColor = "teal" | "amber" | "violet" | "coral" | "brand";

export interface InsuranceCategory {
  id: string;
  name: string;
  badge: string;
  badgeColor: BadgeColor;
  tagline: string;
  cta: string;
  icon: LucideIcon;
  features: string[];   // used in the quote modal
  productCode: string;          // backend product code (e.g. "TWO_WHEELER", "20102")
  subProductCode: string | null;
}

/**
 * Raw insurance product as returned by the backend's product API
 * (insurance-backend src/models/product.model.ts). Marketing/display
 * extras live in `config`; presentation (icon, colour) is added on the
 * frontend when mapping to an InsuranceCategory.
 */
export interface BackendProduct {
  id: string;
  category: string;            // e.g. "term_life", "four_wheeler"
  name: string;
  productCode: string;
  subProductCode: string | null;
  description: string | null;
  isActive: boolean;
  config: {
    badge?: string;
    features?: string[];
    priceFrom?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlsoBuyItem {
  tag: string;
  tagColor: "violet" | "coral" | "brand";
  name: string;
}

export interface TrustStat {
  num: string;
  label: string;
}

export interface WhyItem {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
}

export interface Testimonial {
  name: string;
  location: string;
  plan: string;
  rating: number;
  body: string;
}

export interface CalculatorGroup {
  title: string;
  gradient: string;
  icon: LucideIcon;
  items: string[];
}

export interface NavLink {
  label: string;
  href: string;
}

export type QuoteTabId = "term-life" | "health" | "two-wheeler" | "four-wheeler" | "investment";

/**
 * Domain data collected by the Two Wheeler form. The quote service maps
 * this onto the Go Digit `QuickQuotePayload` before sending.
 */
export interface TwoWheelerQuoteInput {
  productCode: string;          // from the selected product
  subProductCode: string | null;
  vehicleMainCode: string;
  licensePlateNumber: string;
  pincode: string;
  manufactureDate: string;
  registrationDate: string;
  isVehicleNew: boolean;
}

/**
 * Flat quick-quote body the backend expects (see insurance-backend
 * src/services/validation/quote.validation.ts → quickQuoteInputSchema).
 * The backend injects policyHolderType/enquiryId and reshapes this into
 * the nested Go Digit payload itself. Note: `vehicleMaincode` is the
 * backend's exact (lowercase-c) field name.
 */
export interface QuickQuotePayload {
  insuranceProductCode: string;
  subInsuranceProductCode: string;
  pincode?: string | null;
  isVehicleNew: boolean;
  vehicleMaincode: string;
  licensePlateNumber: string;
  manufactureDate?: string;
  registrationDate?: string;
  vehicleIDV?: number | null;
  // Required by the backend only for an existing vehicle (isVehicleNew=false).
  previousInsurerCode?: string;
  previousPolicyExpiryDate?: string;
  previousNoClaimBonus?: string;
  previousPolicyType?: string;
}

export interface QuoteTab {
  id: QuoteTabId;
  label: string;
}

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

/* ── Auth ──
   Mirrors the backend's `PublicUser` (see insurance-backend
   src/models/user.model.ts → toPublicUser). The frontend never sees the
   password hash or OTP fields. */
export type UserRole = "customer" | "agent" | "admin" | "ops";

export interface AuthUser {
  id: string;                 // BIGSERIAL → serialized as a string
  email: string | null;
  phone: string | null;       // E.164, e.g. "+919876543210"
  role: UserRole;
  isActive: boolean;
  createdAt: string;          // ISO timestamp
}

// Shape the auth service promises resolve to. Functions reject with an
// AuthError on failure, so the success shape stays clean.
export interface RequestOtpResult {
  // In development the backend echoes the generated OTP to ease testing;
  // omitted in production. Surfaced as a hint in the UI when present.
  devOtp?: string;
}
export interface VerifyOtpResult {
  user: AuthUser;
  token: string;              // JWT access token (no refresh token issued)
}
