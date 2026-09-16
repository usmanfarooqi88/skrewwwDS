import type { GuardDiagnostic, GuardExecutionError } from "@/lib/guard/diagnostics";

/**
 * Human-readable Guard formatter — compact, plain, terminal-safe.
 * No color dependency; no decorative boxes.
 * docs/architecture/guard-readiness-audit.md §18 / G-2 brief Parts 8–9.
 */

export type FormatGuardResultInput = {
  diagnostics: GuardDiagnostic[];
  executionErrors?: GuardExecutionError[];
};

function formatSeverity(severity: GuardDiagnostic["severity"]): string {
  return severity.toUpperCase();
}

function formatOneDiagnostic(d: GuardDiagnostic): string {
  const lines: string[] = [];
  lines.push(`${formatSeverity(d.severity)} ${d.ruleId}`);
  if (d.location?.file) {
    const loc =
      d.location.line !== undefined
        ? d.location.column !== undefined
          ? `${d.location.file}:${d.location.line}:${d.location.column}`
          : `${d.location.file}:${d.location.line}`
        : d.location.file;
    lines.push(loc);
  }
  lines.push(d.message);
  if (d.remediation) {
    lines.push(`Fix: ${d.remediation}`);
  }
  return lines.join("\n");
}

function formatOneExecutionError(err: GuardExecutionError): string {
  const prefix = err.file ? `ERROR tool/${err.kind}\n${err.file}\n` : `ERROR tool/${err.kind}\n`;
  return `${prefix}${err.message}`;
}

export function formatGuardSummary(diagnostics: GuardDiagnostic[]): string {
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length === 0) {
    return "Guard: no errors found";
  }
  const files = new Set(
    errors.map((d) => d.location?.file).filter((f): f is string => typeof f === "string" && f.length > 0),
  );
  const errorWord = errors.length === 1 ? "error" : "errors";
  if (files.size === 0) {
    return `Guard: ${errors.length} ${errorWord}`;
  }
  const fileWord = files.size === 1 ? "file" : "files";
  return `Guard: ${errors.length} ${errorWord} in ${files.size} ${fileWord}`;
}

/**
 * Full human-readable CLI body (diagnostics + optional tool errors + summary).
 * Deterministic given sorted diagnostics.
 */
export function formatGuardResult(input: FormatGuardResultInput): string {
  const blocks: string[] = [];

  for (const err of input.executionErrors ?? []) {
    blocks.push(formatOneExecutionError(err));
  }
  for (const d of input.diagnostics) {
    blocks.push(formatOneDiagnostic(d));
  }

  const body = blocks.length > 0 ? `${blocks.join("\n\n")}\n\n` : "";
  return `${body}${formatGuardSummary(input.diagnostics)}\n`;
}
