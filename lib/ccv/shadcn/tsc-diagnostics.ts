import type { HarnessLine } from "@/lib/ccv/shadcn/exports-harness";

/**
 * CCV-2 — TypeScript diagnostics from `tsc --pretty false`, mapped to CCV
 * meaning: an error on an export-harness line is a missing export; a
 * module-not-found error inside installed Skrewww source is an unresolved
 * import; anything else is a type-check failure.
 */

export type TscDiagnostic = { file: string; line: number; column: number; code: string; message: string };

const DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const MODULE_NOT_FOUND = new Set(["TS2307", "TS2792", "TS2875"]);

export function parseTscOutput(text: string): TscDiagnostic[] {
  return text
    .split(/\r?\n/)
    .map((line) => DIAGNOSTIC.exec(line.trim()))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => ({ file: match[1].split("\\").join("/"), line: Number(match[2]), column: Number(match[3]), code: match[4], message: match[5] }));
}

export type ClassifiedDiagnostics = {
  missingExports: Array<HarnessLine & { code: string; message: string }>;
  unresolvedImports: TscDiagnostic[];
  other: TscDiagnostic[];
};

export function classifyDiagnostics(diagnostics: readonly TscDiagnostic[], harness: { path: string; lines: Map<number, HarnessLine> }, installed: ReadonlySet<string>): ClassifiedDiagnostics {
  const result: ClassifiedDiagnostics = { missingExports: [], unresolvedImports: [], other: [] };
  for (const diagnostic of diagnostics) {
    const line = diagnostic.file === harness.path ? harness.lines.get(diagnostic.line) : undefined;
    if (line) result.missingExports.push({ ...line, code: diagnostic.code, message: diagnostic.message });
    else if (installed.has(diagnostic.file) && MODULE_NOT_FOUND.has(diagnostic.code)) result.unresolvedImports.push(diagnostic);
    else result.other.push(diagnostic);
  }
  return result;
}
