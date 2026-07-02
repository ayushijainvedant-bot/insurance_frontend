import { api, extractApiError } from "@/services/api";

/**
 * Policy service — the post-create-quote steps of the buy journey:
 * status (KYC + policy) → KYC link → payment link → policy PDF.
 *
 * Backend endpoints (insurance-backend src/routes/front/policy.routes.ts);
 * each returns the Digit payload under `{ data }`, which we unwrap here.
 *   POST /user/policy/status   { policyNumber }
 *   POST /user/policy/kyc      { …kyc… }            -> { kyc: { link } }
 *   POST /user/policy/payment  { applicationId, … } -> { dispatcherResponse }
 *   POST /user/policy/pdf      { policyId }          -> policy document
 */

type Envelope = { data?: unknown };
const inner = <T>(body: unknown): T => ((body as Envelope)?.data ?? {}) as T;

export interface PolicyStatusResult {
  policyStatus?: string;                 // INCOMPLETE | COMPLETE …
  policyNumber?: string;
  kycStatus?: {
    kycVerificationStatus?: string;      // NOT_DONE | IN_PROGRESS | DONE …
    paymentStatus?: string;              // NOT_PAID | PAID — the payment source of truth
    policyStatus?: string;
  };
}

export async function getPolicyStatus(
  policyNumber: string,
  providerProductId: string,
): Promise<PolicyStatusResult> {
  try {
    const { data } = await api.post("/user/policy/status", { policyNumber, providerProductId });
    return inner<PolicyStatusResult>(data);
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't fetch the policy status."));
  }
}

/**
 * KYC verification input. Policy number, date of birth and gender come from the
 * successful create-quote step (never re-collected from the user); the customer
 * only chooses the document types and uploads the proof files.
 */
export interface StartKycInput {
  providerProductId: string;           // chosen insurer offering → provider dispatch
  policyNumber: string;
  dateOfBirth: string;                 // YYYY-MM-DD — from create-quote
  gender: string;                      // MALE | FEMALE — from create-quote
  policyHolderType?: string;           // defaults to INDIVIDUAL
  idVerificationDocType: string;
  addressVerificationDocType: string;
  idVerificationDoc: File[];           // [front] or [front, back]
  addressVerificationDoc: File[];      // [front] or [front, back]
  successReturnURL?: string;
  failureReturnURL?: string;
}

/**
 * Start KYC — returns the Digit KYC link the customer completes.
 *
 * Sent as multipart/form-data: the text fields go as form fields (companyFlag +
 * policyNumber nested inside the `queryParam` JSON field, which the backend
 * flattens), and the proof documents are uploaded as files. The backend
 * converts each file to a Base64 string and builds the Digit KYC payload.
 */
export async function startKyc(input: StartKycInput): Promise<{ kyc?: { link?: string } }> {
  try {
    const fd = new FormData();
    fd.append("providerProductId", input.providerProductId);
    fd.append("queryParam", JSON.stringify({ companyFlag: "GI", policyNumber: input.policyNumber }));
    fd.append("policyHolderType", input.policyHolderType ?? "INDIVIDUAL");
    fd.append("dateOfBirth", input.dateOfBirth);
    fd.append("gender", input.gender);
    fd.append("idVerificationDocType", input.idVerificationDocType);
    fd.append("addressVerificationDocType", input.addressVerificationDocType);
    if (input.successReturnURL) fd.append("successReturnURL", input.successReturnURL);
    if (input.failureReturnURL) fd.append("failureReturnURL", input.failureReturnURL);
    input.idVerificationDoc.forEach((file) => fd.append("idVerificationDoc", file));
    input.addressVerificationDoc.forEach((file) => fd.append("addressVerificationDoc", file));

    // Override the api client's default `application/json` Content-Type — with a
    // JSON content type axios serialises FormData to JSON (turning files into
    // `{}`). Setting multipart/form-data makes axios send the raw FormData and
    // the browser fills in the boundary.
    const { data } = await api.post("/user/policy/kyc", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return inner<{ kyc?: { link?: string } }>(data);
  } catch (err) {
    throw new Error(extractApiError(err, "KYC could not be started. Please try again."));
  }
}

export interface PaymentResult {
  paymentLink?: string;       // Digit gateway URL the customer is redirected to
  requestReference?: string;
  digitPaymentId?: string;
  premium?: number;
  paymentType?: string;
}

/** Initiate payment — returns the Digit payment gateway link to redirect to. */
export async function initiatePayment(payload: Record<string, unknown>): Promise<PaymentResult> {
  try {
    const { data } = await api.post("/user/policy/payment", payload);
    return inner<PaymentResult>(data);
  } catch (err) {
    throw new Error(extractApiError(err, "Payment could not be initiated. Please try again."));
  }
}

/**
 * Download the policy PDF. The backend STREAMS the raw bytes (no link),
 * so we pull it as a blob and trigger a browser download.
 */
export async function downloadPolicyPdf(policyId: string, providerProductId: string): Promise<void> {
  try {
    const res = await api.post("/user/policy/pdf", { policyId, providerProductId }, { responseType: "blob" });
    const blob = res.data as Blob;

    // A JSON error body can arrive with a blob responseType — surface it.
    if (blob.type && blob.type.includes("application/json")) {
      const text = await blob.text();
      throw new Error(JSON.parse(text)?.message ?? "Policy document isn't ready yet.");
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-${policyId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    if (err instanceof Error && !("isAxiosError" in (err as object))) throw err;
    throw new Error(extractApiError(err, "Couldn't download the policy document."));
  }
}
