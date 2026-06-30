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
  policyStatus?: string;
  policyNumber?: string;
  kycStatus?: { kycVerificationStatus?: string };
}

export async function getPolicyStatus(policyNumber: string): Promise<PolicyStatusResult> {
  try {
    const { data } = await api.post("/user/policy/status", { policyNumber });
    return inner<PolicyStatusResult>(data);
  } catch (err) {
    throw new Error(extractApiError(err, "Couldn't fetch the policy status."));
  }
}

/** Start KYC — returns the Digit KYC link the customer completes. */
export async function startKyc(payload: Record<string, unknown>): Promise<{ kyc?: { link?: string } }> {
  try {
    const { data } = await api.post("/user/policy/kyc", payload);
    return inner<{ kyc?: { link?: string } }>(data);
  } catch (err) {
    throw new Error(extractApiError(err, "KYC could not be started. Please try again."));
  }
}

/** Initiate payment — returns the Digit payment (dispatcher) link. */
export async function initiatePayment(payload: Record<string, unknown>): Promise<{ dispatcherResponse?: string }> {
  try {
    const { data } = await api.post("/user/policy/payment", payload);
    return inner<{ dispatcherResponse?: string }>(data);
  } catch (err) {
    throw new Error(extractApiError(err, "Payment could not be initiated. Please try again."));
  }
}

/**
 * Download the policy PDF. The backend STREAMS the raw bytes (no link),
 * so we pull it as a blob and trigger a browser download.
 */
export async function downloadPolicyPdf(policyId: string): Promise<void> {
  try {
    const res = await api.post("/user/policy/pdf", { policyId }, { responseType: "blob" });
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
