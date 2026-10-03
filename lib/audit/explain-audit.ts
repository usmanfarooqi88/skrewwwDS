import type { AuditComparison } from "@/lib/audit/audit-types";
import { buildExplanationRequest, type BuildExplanationRequestOptions } from "@/lib/audit/build-explanation-request";
import type {
  AuditExplanationProvider,
  AuditExplanationRequest,
  AuditExplanationResponse,
  ExplanationProblem,
  ValidateExplanationResult,
} from "@/lib/audit/explanation-types";
import { renderAuditReport } from "@/lib/audit/render-audit-report";
import { validateExplanationResponse } from "@/lib/audit/validate-explanation";

/**
 * AG-1E orchestration: comparison → request → injected provider → strict
 * validation → deterministic Markdown. The provider is the only
 * nondeterministic part and is passed in; this module has no vendor SDK, no
 * network code and no write path. AG-1D does not import anything from AG-1E.
 */

export type ExplainAuditResult =
  | { ok: true; request: AuditExplanationRequest; response: AuditExplanationResponse; markdown: string }
  | { ok: false; request: AuditExplanationRequest; error: { code: string; message: string; problems: ExplanationProblem[] } };

export async function explainAudit(input: {
  comparison: AuditComparison;
  provider: AuditExplanationProvider;
  options?: BuildExplanationRequestOptions;
}): Promise<ExplainAuditResult> {
  const request = buildExplanationRequest(input.comparison, input.options);
  let raw: unknown;
  try {
    // The provider gets a copy, so it cannot mutate the request the response is validated against.
    raw = await input.provider.explain(JSON.parse(JSON.stringify(request)) as AuditExplanationRequest);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, request, error: { code: "PROVIDER_ERROR", message, problems: [{ code: "PROVIDER_ERROR", message }] } };
  }
  return renderValidated(input.comparison, request, raw);
}

/** Validates an externally produced response (e.g. a file from a manual or remote model run) and renders it. */
export function renderValidated(comparison: AuditComparison, request: AuditExplanationRequest, raw: unknown): ExplainAuditResult {
  const validated: ValidateExplanationResult = validateExplanationResponse(request, raw);
  if (!validated.ok) return { ok: false, request, error: validated.error };
  return { ok: true, request, response: validated.response, markdown: renderAuditReport({ comparison, request, explanations: validated.response }) };
}

/**
 * Boundary helper: a provider backed by an already-produced response (a JSON
 * file written by Claude, OpenAI, Gemini, a hosted service or a person). The
 * response is still fully validated; this helper performs no I/O itself.
 */
export function createStaticResponseProvider(response: unknown): AuditExplanationProvider {
  return { explain: async () => response as AuditExplanationResponse };
}
