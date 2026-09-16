import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { loadInternalComponentFacts } from "@/lib/guard/component-facts";
import {
  findingsToDiagnostics,
  severityAffectsExit,
  type GuardDiagnostic,
  type GuardExecutionError,
} from "@/lib/guard/diagnostics";
import { discoverSourceFiles } from "@/lib/guard/discover";
import {
  evaluateInternalRegistryRules,
  evaluateSourceRules,
  evaluateStructuredClaims,
} from "@/lib/guard/evaluate";
import { extractSourceFacts } from "@/lib/guard/facts";
import { loadStructuredClaimsFromFile, type StructuredClaimsFile } from "@/lib/guard/claims-file";
import { toProjectRelativePath, sanitizePathInMessage } from "@/lib/guard/paths";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";
import type { Finding, RuleId } from "@/lib/guard/rule-types";
import type { InstallabilityClaim, MaturityClaim } from "@/lib/guard/structured-claims";

/**
 * G-2 programmatic Guard runner — PARSE → EXTRACT → EVALUATE → DIAGNOSE.
 * No `--json` CLI flag (deferred); consumers use this API instead of
 * parsing terminal text.
 */

export type GuardMode = "consumer" | "internal";

export type GuardExitCode = 0 | 1 | 2;

export type GuardSummary = {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fileCount: number;
};

export type GuardResult = {
  diagnostics: GuardDiagnostic[];
  executionErrors: GuardExecutionError[];
  evaluatedRuleIds: RuleId[];
  summary: GuardSummary;
  exitCode: GuardExitCode;
  mode: GuardMode;
};

export type RunGuardOptions = {
  /** Absolute or relative target path (file or directory). Default: projectRoot. */
  target?: string;
  /** Project root for path normalization. Default: process.cwd(). */
  projectRoot?: string;
  /**
   * `consumer` (default): source rules + optional structured claims.
   * `internal`: this-repo registry/artifact rules only — never on arbitrary consumer trees.
   */
  mode?: GuardMode;
  /** Path to a narrow JSON structured-claims data file (consumer mode). */
  claimsPath?: string;
  /** In-memory claims (tests / programmatic). Ignored if claimsPath is set. */
  claims?: StructuredClaimsFile;
};

function collectFindings(evaluations: { status: string; finding?: Finding }[]): Finding[] {
  const findings: Finding[] = [];
  for (const evaluation of evaluations) {
    if (evaluation.status === "violation" && evaluation.finding) {
      findings.push(evaluation.finding);
    }
  }
  return findings;
}

function buildSummary(diagnostics: GuardDiagnostic[]): GuardSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  const files = new Set<string>();
  for (const d of diagnostics) {
    if (d.severity === "error") errorCount += 1;
    else if (d.severity === "warning") warningCount += 1;
    else infoCount += 1;
    if (d.location?.file) files.add(d.location.file);
  }
  return { errorCount, warningCount, infoCount, fileCount: files.size };
}

function exitCodeFor(diagnostics: GuardDiagnostic[], executionErrors: GuardExecutionError[]): GuardExitCode {
  if (executionErrors.length > 0) return 2;
  if (diagnostics.some((d) => severityAffectsExit(d.severity))) return 1;
  return 0;
}

function publicRuleIds(): RuleId[] {
  return GUARD_RULE_CATALOG.filter((e) => e.domain === "public").map((e) => e.id);
}

function internalRuleIds(): RuleId[] {
  return GUARD_RULE_CATALOG.filter((e) => e.domain === "internal").map((e) => e.id);
}

function runConsumerSource(
  projectRoot: string,
  target: string,
): { findings: Finding[]; executionErrors: GuardExecutionError[]; filesScanned: string[] } {
  const executionErrors: GuardExecutionError[] = [];
  const findings: Finding[] = [];
  const absoluteTarget = resolve(projectRoot, target);

  if (!existsSync(absoluteTarget)) {
    executionErrors.push({
      kind: "io",
      message: `Target path does not exist: ${toProjectRelativePath(absoluteTarget, projectRoot)}`,
      file: toProjectRelativePath(absoluteTarget, projectRoot),
    });
    return { findings, executionErrors, filesScanned: [] };
  }

  let files: string[];
  try {
    const st = statSync(absoluteTarget);
    if (st.isFile() && !absoluteTarget.endsWith(".ts") && !absoluteTarget.endsWith(".tsx")) {
      executionErrors.push({
        kind: "io",
        message: `Target is not a .ts/.tsx source file: ${toProjectRelativePath(absoluteTarget, projectRoot)}`,
        file: toProjectRelativePath(absoluteTarget, projectRoot),
      });
      return { findings, executionErrors, filesScanned: [] };
    }
    files = discoverSourceFiles(target, projectRoot);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    executionErrors.push({
      kind: "io",
      message: sanitizePathInMessage(`Could not read target: ${msg}`, projectRoot),
    });
    return { findings, executionErrors, filesScanned: [] };
  }

  for (const relPath of files) {
    const abs = resolve(projectRoot, relPath);
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      executionErrors.push({
        kind: "io",
        message: sanitizePathInMessage(`Unreadable file: ${msg}`, projectRoot),
        file: relPath,
      });
      continue;
    }

    const facts = extractSourceFacts({ path: relPath, content });
    if (!facts.ok) {
      const first = facts.errors[0];
      const loc =
        first !== undefined
          ? `${relPath}:${first.range.start.line + 1}:${first.range.start.column + 1}`
          : relPath;
      executionErrors.push({
        kind: "parse",
        message: first?.message
          ? `Source parse failed: ${first.message}`
          : "Source parse failed",
        file: loc,
      });
      // Do not evaluate rules against invalid extracted facts.
      continue;
    }

    findings.push(...collectFindings(evaluateSourceRules(facts)));
  }

  return { findings, executionErrors, filesScanned: files };
}

function runClaims(
  projectRoot: string,
  claims: { maturity?: MaturityClaim[]; installability?: InstallabilityClaim[] },
): Finding[] {
  const components = loadInternalComponentFacts();
  return collectFindings(evaluateStructuredClaims(claims, components)).map((finding) => {
    if (!finding.location?.path) return finding;
    return {
      ...finding,
      location: {
        ...finding.location,
        path: toProjectRelativePath(finding.location.path, projectRoot),
      },
    };
  });
}

/**
 * Run Guard in the requested mode and return structured results.
 */
export function runGuard(options: RunGuardOptions = {}): GuardResult {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const mode: GuardMode = options.mode ?? "consumer";
  const target = options.target ?? ".";

  if (mode === "internal") {
    const evaluatedRuleIds = internalRuleIds();
    try {
      const absoluteTarget = resolve(projectRoot, target);
      if (!existsSync(absoluteTarget)) {
        const executionErrors: GuardExecutionError[] = [
          {
            kind: "io",
            message: `Target path does not exist: ${toProjectRelativePath(absoluteTarget, projectRoot)}`,
            file: toProjectRelativePath(absoluteTarget, projectRoot),
          },
        ];
        return {
          diagnostics: [],
          executionErrors,
          evaluatedRuleIds,
          summary: buildSummary([]),
          exitCode: 2,
          mode,
        };
      }

      const findings = collectFindings(
        evaluateInternalRegistryRules({ root: absoluteTarget }),
      );
      const diagnostics = findingsToDiagnostics(findings, { projectRoot });
      const executionErrors: GuardExecutionError[] = [];
      return {
        diagnostics,
        executionErrors,
        evaluatedRuleIds,
        summary: buildSummary(diagnostics),
        exitCode: exitCodeFor(diagnostics, executionErrors),
        mode,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const executionErrors: GuardExecutionError[] = [
        {
          kind: "internal",
          message: sanitizePathInMessage(`Internal Guard failure: ${msg}`, projectRoot),
        },
      ];
      return {
        diagnostics: [],
        executionErrors,
        evaluatedRuleIds,
        summary: buildSummary([]),
        exitCode: 2,
        mode,
      };
    }
  }

  // Consumer / public mode
  const evaluatedRuleIds = publicRuleIds();
  const { findings: sourceFindings, executionErrors, filesScanned } = runConsumerSource(
    projectRoot,
    target,
  );

  let claimFindings: Finding[] = [];
  if (options.claimsPath) {
    const loaded = loadStructuredClaimsFromFile(resolve(projectRoot, options.claimsPath));
    if (!loaded.ok) {
      executionErrors.push({
        kind: "claims",
        message: sanitizePathInMessage(loaded.message, projectRoot),
        file: toProjectRelativePath(resolve(projectRoot, options.claimsPath), projectRoot),
      });
    } else {
      claimFindings = runClaims(projectRoot, loaded.claims);
    }
  } else if (options.claims) {
    claimFindings = runClaims(projectRoot, options.claims);
  }

  // If the only issue is "no files found" under an existing empty dir,
  // that is exit 0 (nothing to check), not a tool failure.
  void filesScanned;

  const diagnostics = findingsToDiagnostics([...sourceFindings, ...claimFindings], {
    projectRoot,
  });

  return {
    diagnostics,
    executionErrors,
    evaluatedRuleIds,
    summary: buildSummary(diagnostics),
    exitCode: exitCodeFor(diagnostics, executionErrors),
    mode,
  };
}
