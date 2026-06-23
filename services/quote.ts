import { api, extractApiError } from "@/services/api";
import type { QuickQuotePayload, TwoWheelerQuoteInput } from "@/types";

/**
 * Quote service — the only module that knows the backend's quote contract.
 * UI goes through here; it never touches axios directly.
 *
 * Backend endpoint (insurance-backend src/routes/front/quote.routes.ts):
 *   POST /user/quote/quick-quote   (auth required — JWT attached by the
 *   api request interceptor). The backend forwards the body verbatim to
 *   Go Digit's /digit/quote, so we send Digit's nested shape here.
 */

/**
 * Map the form's domain data onto the backend's flat quick-quote schema.
 * The backend reshapes this into the nested Go Digit payload. Note the
 * backend field name `vehicleMaincode` (lowercase 'c').
 */
export function toQuickQuotePayload(input: TwoWheelerQuoteInput): QuickQuotePayload {
  return {
    insuranceProductCode: input.productCode,
    subInsuranceProductCode: input.subProductCode ?? "",
    pincode: input.pincode || null,
    isVehicleNew: input.isVehicleNew,
    vehicleMaincode: input.vehicleMainCode,
    licensePlateNumber: input.licensePlateNumber,
    manufactureDate: input.manufactureDate || undefined,
    registrationDate: input.registrationDate || undefined,
  };
}

/** Submit a two-wheeler lead and fetch a quick quote from the backend. */
export async function quickQuote(input: TwoWheelerQuoteInput): Promise<unknown> {
  try {
    const { data } = await api.post("/user/quote/quick-quote", toQuickQuotePayload(input));
    return data;
  } catch (err) {
    throw new Error(extractApiError(err, "Could not fetch quotes. Please try again."));
  }
}
