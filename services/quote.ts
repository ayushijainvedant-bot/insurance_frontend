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

/**
 * Previous insurers for renewals — the motor previous-insurer master (code →
 * name) sourced from Digit's official list.
 */
export const MOTOR_PREVIOUS_INSURERS: { code: string; name: string }[] = [
  { code: "058", name: "National Insurance Co. Ltd." },
  { code: "102", name: "Royal Sundaram General Insurance Co. Limited" },
  { code: "103", name: "Reliance General Insurance Co. Ltd." },
  { code: "106", name: "IFFCO Tokio General Insurance Co. Ltd." },
  { code: "108", name: "Tata AIG General Insurance Co. Ltd." },
  { code: "113", name: "Bajaj Allianz General Insurance Co. Ltd." },
  { code: "115", name: "ICICI Lombard General Insurance Co. Ltd." },
  { code: "123", name: "Cholamandalam MS General Insurance Co. Ltd." },
  { code: "125", name: "HDFC ERGO General Insurance Co. Ltd." },
  { code: "132", name: "Future Generali India Insurance Company Limited" },
  { code: "134", name: "Universal Sompo General Insurance Co. Ltd." },
  { code: "137", name: "Shriram General Insurance Company Limited" },
  { code: "139", name: "Bharti AXA General Insurance Company Limited" },
  { code: "141", name: "Raheja QBE General Insurance Company Limited" },
  { code: "144", name: "SBI General Insurance Company Limited" },
  { code: "149", name: "Magma HDI General Insurance Company Limited" },
  { code: "150", name: "Liberty Videocon General Insurance Company Limited" },
  { code: "152", name: "Kotak Mahindra General Insurance Company Limited" },
  { code: "155", name: "Navi General Insurance Limited" },
  { code: "158", name: "Go Digit General Insurance Limited" },
  { code: "159", name: "Acko General Insurance Limited" },
  { code: "161", name: "Zuno General Insurance Company Limited" },
  { code: "190", name: "The New India Assurance Co. Ltd." },
  { code: "545", name: "United India Insurance Co. Ltd." },
  { code: "556", name: "The Oriental Insurance Co. Ltd." },
  { code: "XXX", name: "DHFL General Insurance Limited" },
];

// No-claim-bonus tiers Digit accepts (enum → display %).
export const MOTOR_NCB: { value: string; label: string }[] = [
  { value: "ZERO",        label: "0%" },
  { value: "TWENTY",      label: "20%" },
  { value: "TWENTY_FIVE", label: "25%" },
  { value: "THIRTY_FIVE", label: "35%" },
  { value: "FORTY_FIVE",  label: "45%" },
  { value: "FIFTY",       label: "50%" },
];
interface ProviderQuote {
  provider?: string;          // e.g. "DIGIT"
  providerProductId?: string | null;  // the insurer offering that produced this quote
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
    productId: input.productId,
    category: input.category,
    pincode: input.pincode || null,
    isVehicleNew: input.isVehicleNew,
    vehicleMaincode: input.vehicleMainCode,
    licensePlateNumber: input.licensePlateNumber,
    manufactureDate: input.manufactureDate || undefined,
    registrationDate: input.registrationDate || undefined,
  };

  // Existing vehicle (renewal) → Digit requires the previous-policy block.
  if (!input.isVehicleNew) {
    // Previous insurer is "known" when the user picked one in the modal.
    payload.isPreviousInsurerKnown = !!input.previousInsurerCode;
    payload.previousInsurerCode = input.previousInsurerCode || undefined;
    payload.previousPolicyNumber = input.previousPolicyNumber || undefined;
    payload.previousPolicyExpiryDate = input.previousPolicyExpiryDate || undefined;
    payload.isClaimInLastYear = input.isClaimInLastYear ?? false;
    if (input.previousNoClaimBonus) payload.previousNoClaimBonus = input.previousNoClaimBonus;
  }

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
    productId: input.productId,
    category: input.category,
    vehicleMainCode: input.vehicleMainCode,
    licensePlateNumber: input.licensePlateNumber,
    pincode: input.pincode,
    manufactureDate: input.manufactureDate,
    registrationDate: input.registrationDate,
    isVehicleNew: String(input.isVehicleNew),
  });
  // Renewal (existing vehicle) → carry the previous-policy details too.
  if (!input.isVehicleNew) {
    if (input.previousInsurerCode) p.set("previousInsurerCode", input.previousInsurerCode);
    if (input.previousPolicyNumber) p.set("previousPolicyNumber", input.previousPolicyNumber);
    if (input.previousPolicyExpiryDate) p.set("previousPolicyExpiryDate", input.previousPolicyExpiryDate);
    if (input.previousNoClaimBonus) p.set("previousNoClaimBonus", input.previousNoClaimBonus);
    if (input.isClaimInLastYear) p.set("isClaimInLastYear", "true");
  }
  return p.toString();
}

/** Parse the inputs back out of the URL. Returns null if required keys are missing. */
export function decodeQuoteInput(sp: URLSearchParams): TwoWheelerQuoteInput | null {
  const productId = sp.get("productId");
  const category = sp.get("category");
  const vehicleMainCode = sp.get("vehicleMainCode");
  const licensePlateNumber = sp.get("licensePlateNumber");
  const pincode = sp.get("pincode");
  if (!productId || !category || !vehicleMainCode || !licensePlateNumber || !pincode) {
    return null;
  }
  return {
    productId,
    category,
    vehicleMainCode,
    licensePlateNumber,
    pincode,
    manufactureDate: sp.get("manufactureDate") ?? "",
    registrationDate: sp.get("registrationDate") ?? "",
    isVehicleNew: sp.get("isVehicleNew") === "true",
    previousInsurerCode: sp.get("previousInsurerCode") ?? undefined,
    previousPolicyNumber: sp.get("previousPolicyNumber") ?? undefined,
    previousPolicyExpiryDate: sp.get("previousPolicyExpiryDate") ?? undefined,
    isClaimInLastYear: sp.get("isClaimInLastYear") === "true",
    previousNoClaimBonus: sp.get("previousNoClaimBonus") ?? undefined,
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
    providerProductId: q.providerProductId ?? null,
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

/* ── Create quote (proposal / buy) ────────────────────────────────────── */

/** Proposer + vehicle-identity details collected on the proposal page. */
export interface ProposalForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;            // YYYY-MM-DD
  gender: string;                 // MALE | FEMALE
  email: string;
  mobile: string;                 // 10 digits
  street: string;
  city: string;
  state: string;                  // Digit state code (e.g. "29")
  pincode: string;
  vehicleIdentificationNumber: string;  // chassis / VIN (required by Digit)
  engineNumber: string;
  // Optional nominee — only sent when `addNominee` is checked.
  addNominee?: boolean;
  nomineeName?: string;           // full name; split into first/last for Digit
  nomineeDateOfBirth?: string;    // YYYY-MM-DD
  nomineeRelation?: string;       // SPOUSE | SON | …
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Assemble the full Go Digit create-quote (proposal) payload from the quote
 * inputs + the proposal form. Policy period defaults to one year starting
 * tomorrow. KYC uses a placeholder CKYC reference (a real flow would run the
 * KYC step first); coverages default to a standard PA cover.
 */
export function buildCreateQuotePayload(
  input: TwoWheelerQuoteInput,
  enquiryId: string,
  form: ProposalForm,
  providerProductId?: string | null,
): Record<string, unknown> {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);

  const payload: Record<string, unknown> = {
    enquiryId,
    category: input.category,
    // The backend resolves the insurer + its codes from this offering.
    ...(providerProductId ? { providerProductId } : {}),
    startDate: isoDate(start),
    endDate: isoDate(end),
    coverages: { personalAccident: { selection: true, insuredAmount: 1500000, coverTerm: 1 } },
    vehicle: {
      isVehicleNew: input.isVehicleNew,
      vehicleMaincode: input.vehicleMainCode,
      licensePlateNumber: input.licensePlateNumber,
      vehicleIdentificationNumber: form.vehicleIdentificationNumber,
      engineNumber: form.engineNumber || undefined,
      manufactureDate: input.manufactureDate,
      registrationDate: input.registrationDate,
    },
    proposer: {
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      email: form.email,
      mobile: form.mobile,
      address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
    },
    // KYC is a separate step AFTER create-quote — sent empty here.
    kyc: {},
    pospInfo: { isPOSP: false },
  };

  // Optional nominee — only when the proposer opted to add one. The single name
  // field is split into first/last (Digit requires both); a single-word name
  // reuses it as the last name so the required field is satisfied.
  if (form.addNominee && form.nomineeName?.trim() && form.nomineeDateOfBirth) {
    const parts = form.nomineeName.trim().split(/\s+/);
    payload.nominee = {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ") || parts[0],
      dateOfBirth: form.nomineeDateOfBirth,
      relation: form.nomineeRelation || undefined,
    };
  }

  // Existing vehicle → Digit requires the previous-insurer block. Only send
  // fields that actually have a value — an empty expiry date ("") fails the
  // backend's YYYY-MM-DD validation, so omit it entirely when blank.
  if (!input.isVehicleNew) {
    const known = !!input.previousInsurerCode;
    const prev: Record<string, unknown> = {
      isPreviousInsurerKnown: known,
      isClaimInLastYear: input.isClaimInLastYear ?? false,
    };
    if (input.previousInsurerCode) prev.previousInsurerCode = input.previousInsurerCode;
    if (input.previousPolicyNumber) prev.previousPolicyNumber = input.previousPolicyNumber;
    if (input.previousPolicyExpiryDate) prev.previousPolicyExpiryDate = input.previousPolicyExpiryDate;
    if (input.previousNoClaimBonus) prev.previousNoClaimBonus = input.previousNoClaimBonus;
    payload.previousInsurer = prev;
  }
  return payload;
}

/**
 * POST the proposal to the backend create-quote endpoint.
 *
 * The insurer's proposal call is slow (can take 20–30s), so we override the
 * api client's default 15s timeout with a longer one — otherwise the client
 * aborts a request that would have succeeded. If the insurer itself times out
 * (504), surface a retry-friendly message.
 */
export async function createQuoteRequest(payload: Record<string, unknown>): Promise<unknown> {
  try {
    const { data } = await api.post("/user/quote/create-quote", payload, { timeout: 60_000 });
    return data;
  } catch (err) {
    throw new Error(
      extractApiError(err, "The insurer is taking longer than usual to respond. Please try again in a moment."),
    );
  }
}
