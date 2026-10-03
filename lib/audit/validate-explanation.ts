import {
  ACTION_TARGETS,
  EXPLANATION_SCHEMA_VERSION,
  type AuditExplanationRequest,
  type AuditExplanationResponse,
  type ExplanationErrorCode,
  type ExplanationProblem,
  type ExplanationRequestFinding,
  type ValidateExplanationResult,
} from "@/lib/audit/explanation-types";

/**
 * AG-1E — strict validation of a provider response against the request it
 * answers. Any problem rejects the WHOLE response: invalid claims are never
 * dropped silently while the rest is rendered as trusted.
 *
 * Structural protections: only known fields are accepted (no `status`,
 * `severity`, `expected`, `actual`, `reasonCode`); every citation must be an
 * evidence ID of the same finding; every required finding must be explained
 * exactly once. Content protections: no URLs, invented source references,
 * patches, shell commands, claims of having changed something, scores,
 * attempts to (re)classify a status, or overclaiming on an `unknown`.
 */

const RESPONSE_KEYS = new Set(["schemaVersion", "componentSlug", "explanations"]);
const EXPLANATION_KEYS = new Set(["findingId", "summary", "statements", "suggestedAction", "missingEvidence"]);
const CITED_KEYS = new Set(["text", "citations"]);
const STATEMENT_KEYS = new Set(["text", "kind", "citations"]);
const ACTION_KEYS = new Set(["target", "description", "citations"]);
const MISSING_KEYS = new Set(["description", "wouldResolveBy"]);
const FORBIDDEN_OVERRIDE_KEYS = new Set(["status", "severity", "expected", "actual", "reasonCode", "basis", "confidence", "requiresHumanDecision", "evidence"]);

const SOURCE_REF_PATTERN = /\b(?:figma|registry|contract|css|tsx|guard|manifest|audit-map|docs):[^\s`'"),\]]+/g;

type ForbiddenPattern = { code: ExplanationErrorCode; pattern: RegExp; label: string };

const FORBIDDEN_CONTENT: ForbiddenPattern[] = [
  { code: "FORBIDDEN_CONTENT", pattern: /https?:\/\/|www\./i, label: "a URL" },
  { code: "FORBIDDEN_CONTENT", pattern: /```|^\s*diff --git|^\s*[-+]{3}\s|@@ [-+]\d/m, label: "a patch or code block" },
  {
    code: "FORBIDDEN_CONTENT",
    pattern: /(^|\s)(\$\s|sudo\s|rm\s+-|git\s+(commit|push|reset|checkout|add)\b|npm\s+(publish|install|run)\b|npx\s)/i,
    label: "a shell command",
  },
  {
    code: "FORBIDDEN_CONTENT",
    pattern: /\b(I|we)\s+(have\s+)?(changed|updated|fixed|modified|applied|committed|deleted|edited|rewrote|published|removed)\b/i,
    label: "a claim of having made a change",
  },
  { code: "FORBIDDEN_CONTENT", pattern: /\b\d{1,3}(\.\d+)?\s?%|\bquality score\b|\bparity score\b|\branking\b/i, label: "a score, percentage or ranking" },
  { code: "STATUS_CONTRADICTION", pattern: /\bparity\s+(is\s+)?(verified|confirmed|proven|guaranteed)\b/i, label: "a parity claim" },
  {
    code: "STATUS_CONTRADICTION",
    pattern: /\b(everything|all checks?|the (whole )?component)\s+(is|are)\s+(verified|fine|passing|correct|in parity)\b/i,
    label: "a blanket verification claim",
  },
  {
    code: "STATUS_CONTRADICTION",
    pattern: /\b(mark|marked|reclassify|reclassified|change|changed|set|override|upgrade|downgrade)\b[^.]{0,40}\b(as\s+)?(pass|passed|fail|failed|unknown|not-applicable|intentional[- ]difference)\b/i,
    label: "an attempt to (re)classify a status",
  },
];

/** Status claims about the finding itself; allowed only when they match the deterministic status. */
const STATUS_CLAIMS: Array<{ pattern: RegExp; claims: "pass" | "fail" }> = [
  { pattern: /\b(this|it|the finding|the check|this check)\s+(actually\s+|really\s+|definitely\s+|clearly\s+|in fact\s+)?(passes|is passing|is a pass)\b/i, claims: "pass" },
  { pattern: /\b(this|it|the finding|the check|this check)\s+(actually\s+|really\s+|definitely\s+|clearly\s+|in fact\s+)?(fails|is failing|is a fail(ure)?)\b/i, claims: "fail" },
  { pattern: /\bactually\s+(passes|is fine|is correct|is verified)\b/i, claims: "pass" },
];

/** On an `unknown`, a provider may not assert a proven defect or mismatch. */
const UNKNOWN_OVERCLAIM = /\b(definitely|certainly|clearly|confirmed|proven|obviously)\b[^.]{0,60}\b(broken|wrong|mismatch(ed)?|fail(s|ed|ure)?|incorrect|defect(ive)?|stale)\b|\b(is|are)\s+(definitely\s+)?(broken|wrong|incorrect)\b/i;

/** On a `fail`, a provider may explain the difference but not soften it into a non-problem. */
const FAIL_SOFTENING =
  /\b(?:not|isn't|is not|aren't|are not)\s+(?:really\s+|actually\s+|truly\s+)?(?:an?\s+)?(?:real\s+|true\s+|genuine\s+)?(?:fail(?:ure)?|defect|mismatch|problem|drift|error|violation|issue|discrepancy)\b|\b(?:harmless|safe to ignore|can be ignored|can safely be ignored|no real (?:problem|issue)|nothing to (?:fix|change)|merely cosmetic|only cosmetic|just cosmetic|negligible|insignificant)\b/i;

/** On a `fail` or `unknown`, a provider may not claim the sides agree. */
const AGREEMENT_CLAIM = /(?<!whether\s)(?<!if\s)(?<!not\s)(?<!whether the )(?<!if the )\b(?:both sides|the two sides|the sides|these|they)\s+(?:agree|match|are (?:equal|equivalent|consistent|in sync|aligned))\b/i;

/** Intent can only come from an exact structured record (an `intentional-difference` finding), never from provider prose. */
const INTENT_CLAIM = /\b(?:is|are|was|were)\s+(?:an?\s+)?(?:intentional(?:ly)?|deliberate(?:ly)?|by design|expected behaviou?r)\b|\bintended\s+(?:difference|behaviou?r)\b/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateExplanationResponse(request: AuditExplanationRequest, raw: unknown): ValidateExplanationResult {
  const problems: ExplanationProblem[] = [];
  const add = (code: ExplanationErrorCode, message: string, findingId?: string) => problems.push(findingId ? { code, message, findingId } : { code, message });

  const findingsById = new Map(request.findings.map((finding) => [finding.findingId, finding]));
  const allEvidenceIds = new Set(request.findings.flatMap((finding) => finding.evidence.map((evidence) => evidence.evidenceId)));

  if (!isPlainObject(raw)) {
    return reject([{ code: "INVALID_EXPLANATION_RESPONSE", message: "response is not a JSON object" }]);
  }
  for (const key of Object.keys(raw)) if (!RESPONSE_KEYS.has(key)) add("FORBIDDEN_FIELD", `response field "${key}" is not allowed`);
  if (raw.schemaVersion !== EXPLANATION_SCHEMA_VERSION) {
    add("UNSUPPORTED_SCHEMA", `schemaVersion ${String(raw.schemaVersion)} is not ${EXPLANATION_SCHEMA_VERSION}`);
  }
  if (raw.componentSlug !== request.component.slug) {
    add("INVALID_EXPLANATION_RESPONSE", `componentSlug "${String(raw.componentSlug)}" is not "${request.component.slug}"`);
  }
  if (!Array.isArray(raw.explanations)) {
    add("INVALID_EXPLANATION_RESPONSE", "explanations must be a list");
    return reject(problems);
  }

  const seen = new Set<string>();
  for (const item of raw.explanations as unknown[]) {
    if (!isPlainObject(item)) {
      add("INVALID_EXPLANATION_RESPONSE", "an explanation is not an object");
      continue;
    }
    const findingId = typeof item.findingId === "string" ? item.findingId : "";
    const finding = findingsById.get(findingId);
    if (!finding) {
      add("UNKNOWN_FINDING_ID", `explanation for "${findingId}", which is not a finding in the request`);
      continue;
    }
    if (seen.has(findingId)) {
      add("DUPLICATE_EXPLANATION", `"${findingId}" is explained more than once`, findingId);
      continue;
    }
    seen.add(findingId);
    validateExplanation(item, finding, allEvidenceIds, add);
  }

  for (const finding of request.findings) {
    if (finding.explanationRequired && !seen.has(finding.findingId)) {
      add("MISSING_EXPLANATION", `required ${finding.status} finding "${finding.findingId}" is not explained`, finding.findingId);
    }
  }

  if (problems.length > 0) return reject(problems);
  return { ok: true, response: raw as unknown as AuditExplanationResponse };
}

function reject(problems: ExplanationProblem[]): ValidateExplanationResult {
  return {
    ok: false,
    error: { code: problems[0].code, message: `explanation response rejected (${problems.length} problem${problems.length === 1 ? "" : "s"})`, problems },
  };
}

type Add = (code: ExplanationErrorCode, message: string, findingId?: string) => void;

function validateExplanation(item: Record<string, unknown>, finding: ExplanationRequestFinding, allEvidenceIds: Set<string>, add: Add): void {
  const id = finding.findingId;
  const ownIds = new Set(finding.evidence.map((evidence) => evidence.evidenceId));
  const ownRefs = new Set(finding.evidence.map((evidence) => evidence.sourceRef));
  const cited = new Set<string>();

  for (const key of Object.keys(item)) {
    if (EXPLANATION_KEYS.has(key)) continue;
    if (FORBIDDEN_OVERRIDE_KEYS.has(key)) add("FORBIDDEN_FIELD", `"${key}" is owned by the deterministic comparator and cannot be returned`, id);
    else add("FORBIDDEN_FIELD", `explanation field "${key}" is not allowed`, id);
  }

  const checkCitations = (value: unknown, where: string): string[] => {
    if (!Array.isArray(value) || value.length === 0 || !value.every((entry) => typeof entry === "string")) {
      add("MISSING_CITATION", `${where} has no evidence citations`, id);
      return [];
    }
    for (const evidenceId of value as string[]) {
      if (!ownIds.has(evidenceId)) {
        add(
          "UNKNOWN_EVIDENCE_ID",
          allEvidenceIds.has(evidenceId) ? `${where} cites ${evidenceId}, which belongs to another finding` : `${where} cites ${evidenceId}, which is not in the request`,
          id,
        );
      } else {
        cited.add(evidenceId);
      }
    }
    return value as string[];
  };

  const checkText = (value: unknown, where: string, citations: readonly string[] | null): void => {
    if (typeof value !== "string" || value.trim().length === 0) {
      add("INVALID_EXPLANATION_RESPONSE", `${where} must be non-empty text`, id);
      return;
    }
    for (const forbidden of FORBIDDEN_CONTENT) {
      if (forbidden.pattern.test(value)) add(forbidden.code, `${where} contains ${forbidden.label}`, id);
    }
    for (const claim of STATUS_CLAIMS) {
      if (claim.pattern.test(value) && claim.claims !== finding.status) {
        add("STATUS_CONTRADICTION", `${where} claims "${claim.claims}" but the deterministic status is "${finding.status}"`, id);
      }
    }
    if (finding.status === "fail" && FAIL_SOFTENING.test(value)) {
      add("STATUS_CONTRADICTION", `${where} softens a deterministic fail`, id);
    }
    if ((finding.status === "fail" || finding.status === "unknown") && AGREEMENT_CLAIM.test(value)) {
      add("STATUS_CONTRADICTION", `${where} claims the compared sides agree on a ${finding.status} finding`, id);
    }
    if (finding.status !== "intentional-difference" && INTENT_CLAIM.test(value)) {
      add("STATUS_CONTRADICTION", `${where} claims intent, but no structured intentional-difference record exists for this finding`, id);
    }
    if (finding.status === "unknown" && UNKNOWN_OVERCLAIM.test(value)) {
      add("STATUS_CONTRADICTION", `${where} asserts a proven defect on an unknown finding`, id);
    }
    for (const match of Array.from(value.matchAll(/\[(E\d+)\]/g))) {
      if (citations ? !citations.includes(match[1]) : !ownIds.has(match[1])) {
        add("UNKNOWN_EVIDENCE_ID", `${where} references [${match[1]}] without citing it`, id);
      }
    }
    for (const match of Array.from(value.matchAll(SOURCE_REF_PATTERN))) {
      const ref = match[0].replace(/[.;:]+$/, "");
      if (!Array.from(ownRefs).some((own) => own === ref || own.startsWith(ref))) {
        add("UNKNOWN_EVIDENCE_ID", `${where} mentions source reference "${ref}", which is not evidence of this finding`, id);
      }
    }
  };

  // summary
  if (!isPlainObject(item.summary)) {
    add("INVALID_EXPLANATION_RESPONSE", "summary must be { text, citations }", id);
  } else {
    for (const key of Object.keys(item.summary)) if (!CITED_KEYS.has(key)) add("FORBIDDEN_FIELD", `summary field "${key}" is not allowed`, id);
    const citations = checkCitations(item.summary.citations, "summary");
    checkText(item.summary.text, "summary", citations);
  }

  // statements
  if (!Array.isArray(item.statements) || item.statements.length === 0) {
    add("INVALID_EXPLANATION_RESPONSE", "statements must be a non-empty list", id);
  } else {
    (item.statements as unknown[]).forEach((statement, index) => {
      const where = `statement ${index + 1}`;
      if (!isPlainObject(statement)) {
        add("INVALID_EXPLANATION_RESPONSE", `${where} is not an object`, id);
        return;
      }
      for (const key of Object.keys(statement)) if (!STATEMENT_KEYS.has(key)) add("FORBIDDEN_FIELD", `${where} field "${key}" is not allowed`, id);
      if (statement.kind !== "observed" && statement.kind !== "inferred") add("INVALID_EXPLANATION_RESPONSE", `${where} kind must be observed or inferred`, id);
      const citations = checkCitations(statement.citations, where);
      checkText(statement.text, where, citations);
    });
  }

  // suggested action — advisory only
  if (item.suggestedAction !== undefined) {
    const action = item.suggestedAction;
    if (!isPlainObject(action)) {
      add("INVALID_EXPLANATION_RESPONSE", "suggestedAction must be an object", id);
    } else {
      for (const key of Object.keys(action)) if (!ACTION_KEYS.has(key)) add("FORBIDDEN_FIELD", `suggestedAction field "${key}" is not allowed`, id);
      if (!(ACTION_TARGETS as readonly unknown[]).includes(action.target)) {
        add("INVALID_ACTION_TARGET", `suggestedAction target "${String(action.target)}" is not one of ${ACTION_TARGETS.join(", ")}`, id);
      }
      const citations = checkCitations(action.citations, "suggestedAction");
      checkText(action.description, "suggestedAction", citations);
    }
  }

  // missing evidence — required for unknown
  if (item.missingEvidence !== undefined) {
    const missing = item.missingEvidence;
    if (!isPlainObject(missing)) {
      add("INVALID_EXPLANATION_RESPONSE", "missingEvidence must be an object", id);
    } else {
      for (const key of Object.keys(missing)) if (!MISSING_KEYS.has(key)) add("FORBIDDEN_FIELD", `missingEvidence field "${key}" is not allowed`, id);
      checkText(missing.description, "missingEvidence.description", null);
      checkText(missing.wouldResolveBy, "missingEvidence.wouldResolveBy", null);
    }
  } else if (finding.status === "unknown") {
    add("MISSING_EVIDENCE_CONTEXT", "an unknown finding must state what evidence is missing and what would resolve it", id);
  }

  // side coverage
  if (finding.status === "fail" && cited.size < 2) add("MISSING_CITATION", "a fail explanation must cite both compared sides", id);
  if (finding.status === "intentional-difference") {
    const recordIds = finding.evidence.filter((evidence) => evidence.sourceType === "docs").map((evidence) => evidence.evidenceId);
    if (cited.size < 2) add("MISSING_CITATION", "an intentional-difference explanation must cite both differing sides", id);
    if (!recordIds.some((evidenceId) => cited.has(evidenceId))) add("MISSING_CITATION", "an intentional-difference explanation must cite the intentional-difference record", id);
  }
}
