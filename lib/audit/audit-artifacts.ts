import type { AuditComparison } from "@/lib/audit/audit-types";
import { buildExplanationRequest } from "@/lib/audit/build-explanation-request";
import { serializeAuditComparison } from "@/lib/audit/compare-audit-evidence";
import { renderValidated } from "@/lib/audit/explain-audit";
import type { ExplanationProblem } from "@/lib/audit/explanation-types";
import { renderAuditReport } from "@/lib/audit/render-audit-report";

/**
 * AG-1F — pure construction of the two AG-1 output artifacts (§17):
 *
 *   audit/<slug>.<sha>.json   the deterministic AuditComparison (findings, counts, provenance)
 *   audit/<slug>.<sha>.md     the deterministic Markdown report
 *
 * Nothing here touches the file system, a model or the network. Same
 * comparison (+ same validated explanation response) → byte-identical output.
 * The file name carries the exact repo SHA the evidence was collected at;
 * the same SHA is in the JSON's provenance.
 */

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const GIT_SHA = /^[0-9a-f]{40}$/;

export type AuditArtifacts = {
  /** `<slug>.<sha>` */
  baseName: string;
  jsonName: string;
  markdownName: string;
  json: string;
  markdown: string;
};

export type BuildAuditArtifactsInput = {
  comparison: AuditComparison;
  /** A provider-neutral explanation response, exactly as received. `undefined`/`null`: deterministic-only report. */
  response?: unknown;
  includeNotApplicable?: boolean;
};

export type BuildAuditArtifactsResult =
  | { ok: true; artifacts: AuditArtifacts }
  | { ok: false; error: { code: "INVALID_ARTIFACT_NAME" | "EXPLANATION_REJECTED"; message: string; problems?: ExplanationProblem[] } };

export function buildAuditArtifacts({ comparison, response, includeNotApplicable }: BuildAuditArtifactsInput): BuildAuditArtifactsResult {
  const { slug } = comparison.component;
  const sha = comparison.provenance.repoGitSha;
  if (!SLUG.test(slug) || !GIT_SHA.test(sha)) {
    return { ok: false, error: { code: "INVALID_ARTIFACT_NAME", message: `cannot name artifacts for slug "${slug}" at "${sha}": need a kebab-case slug and a full 40-hex git SHA` } };
  }
  const request = buildExplanationRequest(comparison, { includeNotApplicable });
  let markdown: string;
  if (response === undefined || response === null) {
    markdown = renderAuditReport({ comparison, request, explanations: null });
  } else {
    const rendered = renderValidated(comparison, request, response);
    if (!rendered.ok) {
      return { ok: false, error: { code: "EXPLANATION_REJECTED", message: rendered.error.message, problems: rendered.error.problems } };
    }
    markdown = rendered.markdown;
  }
  const baseName = `${slug}.${sha}`;
  return {
    ok: true,
    artifacts: { baseName, jsonName: `${baseName}.json`, markdownName: `${baseName}.md`, json: serializeAuditComparison(comparison), markdown },
  };
}
