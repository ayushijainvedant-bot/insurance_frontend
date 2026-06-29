import { api, extractApiError } from "@/services/api";
import type {
  InsurancePlan, QuickQuotePayload, QuoteContext, QuoteFilters, QuoteTabId, TwoWheelerQuoteInput,
} from "@/types";

/**
 * Quote service — the only module that knows the backend's quote contract.
 * UI goes through here; it never touches axios directly.
 *
 * Flow: the modal encodes the form inputs into the /quotes URL; the results
 * page decodes them and calls `fetchQuoteResults`, which hits the backend
 * quick-quote endpoint and maps the response into the UI's QuoteContext.
 * This keeps the URL the single source of truth (shareable, refresh-safe)
 * without persisting anything client-side.
 *
 * Backend endpoint (insurance-backend src/routes/front/quote.routes.ts):
 *   POST /user/quote/quick-quote   (auth required — JWT attached by the
 *   api request interceptor). Body is the flat shape the backend reshapes
 *   into the nested Go Digit payload.
 */

/* ── Backend response shapes ──────────────────────────────────────────── */
interface DigitVehicle {
  make?: string;
  model?: string;
  licensePlateNumber?: string;
  vehicleIDV?: { idv?: number };
}
interface DigitCoverage { selection?: boolean }
interface DigitCoverages {
  thirdPartyLiability?: { selection?: boolean; netPremium?: string; isTPPD?: boolean };
  ownDamage?: { selection?: boolean; withZeroDepNetPremium?: string; withoutZeroDepNetPremium?: string };
  fire?: DigitCoverage;
  theft?: DigitCoverage;
  personalAccident?: { selection?: boolean; coverTerm?: number; coverAvailability?: string; netPremium?: string };
  addons?: Record<string, { selection?: boolean | null } | undefined>;
}

/**
 * Motor add-ons / accessories the backend exposes under
 * contract.coverages.{addons,accessories}. Single source of truth for the
 * plan's add-on list AND the filter sidebar, so labels stay in sync.
 */
export const MOTOR_ADDONS: { key: string; label: string }[] = [
  { key: "partsDepreciation",  label: "Zero Depreciation" },
  { key: "roadSideAssistance", label: "24x7 Roadside Assistance" },
  { key: "engineProtection",   label: "Engine Protection" },
  { key: "tyreProtection",     label: "Tyre Protection" },
  { key: "rimProtection",      label: "Rim Protection" },
  { key: "returnToInvoice",    label: "Return to Invoice" },
  { key: "consumables",        label: "Consumables" },
  { key: "personalBelonging",  label: "Loss of Personal Belongings" },
  { key: "keyAndLockProtect",  label: "Key & Lock Protect" },
];

// CNG is intentionally omitted — Digit rejects it without full CNG-kit
// fitment details, which the lead form doesn't collect.
export const MOTOR_ACCESSORIES: { key: string; label: string }[] = [
  { key: "electrical",    label: "Electrical Accessories" },
  { key: "nonElectrical", label: "Non-Electrical Accessories" },
];

// Voluntary deductibles Go Digit accepts for this product, with the exact
// enum it expects. (2500 / 7500 are rejected by Digit, so not offered.)
export const MOTOR_DEDUCTIBLES: { value: string; label: string; digit: string }[] = [
  { value: "zero",  label: "Zero Deductible",            digit: "ZERO" },
  { value: "5000",  label: "₹5000 Voluntary Deductible",  digit: "FIVE_THOUSAND" },
  { value: "15000", label: "₹15000 Voluntary Deductible", digit: "FIFTEEN_THOUSAND" },
];

// Filter deductible value → the Digit `voluntaryDeductible` enum.
function toVoluntaryDeductible(value: string): string | undefined {
  return MOTOR_DEDUCTIBLES.find((d) => d.value === value)?.digit;
}
interface ProviderQuote {
  provider?: string;          // e.g. "DIGIT"
  premium?: number;           // gross premium as a number, e.g. 4030.88
  data?: {
    enquiryId?: string;
    grossPremium?: string;
    netPremium?: string;
    vehicle?: DigitVehicle;
    contract?: { endDate?: string; coverages?: DigitCoverages };
  };
}

/* ── Payload mapping ──────────────────────────────────────────────────── */

/**
 * Map the form's domain data onto the backend's flat quick-quote schema.
 * Note the backend field name `vehicleMaincode` (lowercase 'c').
 */
export function toQuickQuotePayload(
  input: TwoWheelerQuoteInput,
  filters?: QuoteFilters,
): QuickQuotePayload {
  const payload: QuickQuotePayload = {
    category: input.category,
    insuranceProductCode: input.productCode,
    subInsuranceProductCode: input.subProductCode ?? "",
    pincode: input.pincode || null,
    isVehicleNew: input.isVehicleNew,
    vehicleMaincode: input.vehicleMainCode,
    licensePlateNumber: input.licensePlateNumber,
    manufactureDate: input.manufactureDate || undefined,
    registrationDate: input.registrationDate || undefined,
  };

  // Re-pricing selections from the results-page filters → nested shape.
  if (filters) {
    const addons: Record<string, { selection: boolean }> = {};
    for (const a of MOTOR_ADDONS) {
      if (filters.addons.includes(a.label)) addons[a.key] = { selection: true };
    }
    if (Object.keys(addons).length) payload.addons = addons;

    const accessories: Record<string, { selection: boolean }> = {};
    for (const a of MOTOR_ACCESSORIES) {
      if (filters.accessories.includes(a.label)) accessories[a.key] = { selection: true };
    }
    if (Object.keys(accessories).length) payload.accessories = accessories;

    if (filters.deductible) {
      const vd = toVoluntaryDeductible(filters.deductible);
      if (vd) payload.voluntaryDeductible = vd;
    }
  }

  return payload;
}

/* ── URL <-> input (so the /quotes URL carries the inputs) ────────────── */

export function encodeQuoteInput(input: TwoWheelerQuoteInput): string {
  const p = new URLSearchParams({
    category: input.category,
    productCode: input.productCode,
    vehicleMainCode: input.vehicleMainCode,
    licensePlateNumber: input.licensePlateNumber,
    pincode: input.pincode,
    manufactureDate: input.manufactureDate,
    registrationDate: input.registrationDate,
    isVehicleNew: String(input.isVehicleNew),
  });
  if (input.subProductCode) p.set("subProductCode", input.subProductCode);
  return p.toString();
}

/** Parse the inputs back out of the URL. Returns null if required keys are missing. */
export function decodeQuoteInput(sp: URLSearchParams): TwoWheelerQuoteInput | null {
  const category = sp.get("category");
  const productCode = sp.get("productCode");
  const vehicleMainCode = sp.get("vehicleMainCode");
  const licensePlateNumber = sp.get("licensePlateNumber");
  const pincode = sp.get("pincode");
  if (!category || !productCode || !vehicleMainCode || !licensePlateNumber || !pincode) {
    return null;
  }
  return {
    category,
    productCode,
    subProductCode: sp.get("subProductCode"),
    vehicleMainCode,
    licensePlateNumber,
    pincode,
    manufactureDate: sp.get("manufactureDate") ?? "",
    registrationDate: sp.get("registrationDate") ?? "",
    isVehicleNew: sp.get("isVehicleNew") === "true",
  };
}

/* ── Fetch + map ──────────────────────────────────────────────────────── */

const labelFor = (provider?: string) =>
  provider === "DIGIT" ? "Go Digit" : (provider ?? "Insurer");

/** "INR 3416.00" → "₹3,416". Returns null when there's no usable value. */
function formatINR(val?: string | number): string | null {
  if (val == null) return null;
  const n = Number(String(val).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;
  return `₹${n.toLocaleString("en-IN")}`;
}

function toPlan(q: ProviderQuote, i: number): InsurancePlan {
  const cov = q.data?.contract?.coverages;
  const tpl = cov?.thirdPartyLiability;
  const od = cov?.ownDamage;
  const pa = cov?.personalAccident;
  const ad = cov?.addons;
  const tplPremium = formatINR(tpl?.netPremium);
  const paPremium = formatINR(pa?.netPremium);

  return {
    id: q.data?.enquiryId || `${q.provider ?? "quote"}-${i}`,
    insurerName: labelFor(q.provider),
    insurerLogo: undefined,
    premiumAmount: q.premium ?? 0,
    idvAmount: q.data?.vehicle?.vehicleIDV?.idv ?? 0,
    claimSettlementRatio: 96.5,   // not in quick-quote response
    cashlessGarageCount: 10500,   // not in quick-quote response
    keyBenefits: [
      od ? "Comprehensive own-damage cover" : null,
      tpl ? `Third-party liability${tplPremium ? ` · ${tplPremium}` : ""}` : null,
      pa?.coverAvailability === "AVAILABLE" ? "Personal accident cover available" : null,
      "Cashless garage network",
    ].filter(Boolean) as string[],
    addOns: MOTOR_ADDONS.map((a) => ({
      name: a.label,
      included: !!ad?.[a.key]?.selection,
    })),
    isRecommended: i === 0,
    coverageType: "comprehensive",
    policyTenure: 1,
    coverageDetails: {
      ownDamage: od
        ? `Own-damage cover against accidents, fire & theft${od.withZeroDepNetPremium != null ? " · zero-depreciation available" : ""}.`
        : "Comprehensive own-damage protection.",
      thirdPartyLiability: tpl
        ? `Third-party property & injury liability${tplPremium ? ` · net premium ${tplPremium}` : ""}.`
        : "Covers third-party property damage and injuries.",
      personalAccident: pa
        ? `${pa.coverAvailability === "AVAILABLE" ? "Available" : "Owner-driver cover"}${paPremium ? ` · ${paPremium}` : ""}${pa.coverTerm ? ` · ${pa.coverTerm}-yr term` : ""}.`
        : "Personal accident cover for owner-driver.",
      naturalCalamities: cov?.fire?.selection ? "Covered" : "Included in comprehensive cover",
      theft: cov?.theft?.selection ? "Covered" : "Included in comprehensive cover",
    },
  };
}

/** Submit the inputs (+ optional re-pricing filters) and map the response. */
export async function fetchQuoteResults(
  input: TwoWheelerQuoteInput,
  filters?: QuoteFilters,
): Promise<QuoteContext> {
  let result: { data?: ProviderQuote[] } | undefined;
  try {
    const { data } = await api.post("/user/quote/quick-quote", toQuickQuotePayload(input, filters));
    result = data;
  } catch (err) {
    throw new Error(extractApiError(err, "Could not fetch quotes. Please try again."));
  }

  const quotes: ProviderQuote[] = Array.isArray(result?.data) ? result.data : [];
  const plans = quotes
    .filter((q) => typeof q.premium === "number" && q.premium > 0)
    .map(toPlan);

  const vehicle = quotes[0]?.data?.vehicle;
  const vehicleModel = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ")
    || input.vehicleMainCode || "Your Vehicle";

  return {
    registrationNumber: vehicle?.licensePlateNumber || input.licensePlateNumber || "",
    vehicleModel,
    policyExpiry: quotes[0]?.data?.contract?.endDate ?? input.registrationDate ?? null,
    selectedIdv: plans[0]?.idvAmount || null,
    quoteType: input.category.replace(/_/g, "-") as QuoteTabId,
    plans,
  };
}
