import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { loadInternalComponentFacts, type ComponentFactSource } from "@/lib/guard/component-facts";
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
import {
  defaultPackagedConsumerFactsPath,
  defaultRepoConsumerFactsPath,
  loadConsumerFactsFromFile,
} from "@/lib/guard/load-consumer-facts";
import { toProjectRelativePath, sanitizePathInMessage } from "@/lib/guard/paths";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";
import type { Finding, RuleId } from "@/lib/guard/rule-types";
import type { InstallabilityClaim, MaturityClaim } from "@/lib/guard/structured-claims";

/**
 * G-2/G-3 runner + pre-release portable facts.
 *
 * Fact sources:
 * - `internal` — live canonical registry (Skrewww repo only)
 * - `packaged` — committed/packaged consumer-facts.json (external consumers)
 *
 * Provenance:
 * - internal facts → internal-paths (`@/components/ui`)
 * - packaged facts → origin-marker only (`@skrewww-component`)
 */

export type GuardMode = "consumer" | "internal";
export type GuardFactSourceKind = "internal" | "packaged";

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
  factSource?: GuardFactSourceKind;
};

export type RunGuardOptions = {
  target?: string;
  projectRoot?: string;
  mode?: GuardMode;
  /**
   * Consumer fact source. Default: `internal` for repo CLI compatibility.
   * Public package CLI forces `packaged`.
   */
  factSource?: GuardFactSourceKind;
  /** Override path to consumer-facts.json when factSource is `packaged`. */
  consumerFactsPath?: string;
  claimsPath?: string;
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

function resolvePackagedFacts(
  options: RunGuardOptions,
  projectRoot: string,
): { ok: true; source: ComponentFactSource } | { ok: false; message: string; file?: string } {
  const path =
    options.consumerFactsPath ??
    (existsSync(defaultRepoConsumerFactsPath(projectRoot))
      ? defaultRepoConsumerFactsPath(projectRoot)
      : defaultPackagedConsumerFactsPath());
  const loaded = loadConsumerFactsFromFile(path);
  if (!loaded.ok) {
    return { ok: false, message: loaded.message, file: toProjectRelativePath(path, projectRoot) };
  }
  return { ok: true, source: loaded.source };
}

function runConsumerSource(
  projectRoot: string,
  target: string,
  factKind: GuardFactSourceKind,
  components: ComponentFactSource,
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

  const knownSlugs = new Set(components.listSlugs());
  const provenanceMode = factKind === "packaged" ? "origin-marker" : "internal-paths";

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
        message: first?.message ? `Source parse failed: ${first.message}` : "Source parse failed",
        file: loc,
      });
      continue;
    }

    findings.push(
      ...collectFindings(
        evaluateSourceRules(facts, {
          provenanceMode,
          projectRoot,
          knownSlugs: factKind === "packaged" ? knownSlugs : undefined,
        }),
      ),
    );
  }

  return { findings, executionErrors, filesScanned: files };
}

function runClaims(
  projectRoot: string,
  claims: { maturity?: MaturityClaim[]; installability?: InstallabilityClaim[] },
  components: ComponentFactSource,
): Finding[] {
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

      const findings = collectFindings(evaluateInternalRegistryRules({ root: absoluteTarget }));
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

  const factSource: GuardFactSourceKind = options.factSource ?? "internal";
  const evaluatedRuleIds = publicRuleIds();
  const executionErrors: GuardExecutionError[] = [];

  let components: ComponentFactSource;
  if (factSource === "packaged") {
    const loaded = resolvePackagedFacts(options, projectRoot);
    if (!loaded.ok) {
      return {
        diagnostics: [],
        executionErrors: [
          {
            kind: "io",
            message: sanitizePathInMessage(loaded.message, projectRoot),
            file: loaded.file,
          },
        ],
        evaluatedRuleIds,
        summary: buildSummary([]),
        exitCode: 2,
        mode,
        factSource,
      };
    }
    components = loaded.source;
  } else {
    components = loadInternalComponentFacts();
  }

  const { findings: sourceFindings, executionErrors: sourceErrors, filesScanned } = runConsumerSource(
    projectRoot,
    target,
    factSource,
    components,
  );
  executionErrors.push(...sourceErrors);

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
      claimFindings = runClaims(projectRoot, loaded.claims, components);
    }
  } else if (options.claims) {
    claimFindings = runClaims(projectRoot, options.claims, components);
  }

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
    factSource,
  };
}
