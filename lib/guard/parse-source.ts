import * as ts from "typescript";
import type { GuardParseError, GuardSourceRange } from "@/lib/guard/types";

/**
 * Deterministic TypeScript Compiler API parsing — no new dependency (see
 * docs/architecture/guard-readiness-audit.md §12/§36: `typescript` is
 * already an installed dependency; its Compiler API is sufficient for
 * every locked v0.1 rule's extraction needs). No regex fallback: a
 * genuine syntax error is reported as a real, typed `GuardParseError`,
 * never silently swallowed or worked around.
 *
 * Uses a real `ts.Program` (not a bare `ts.createSourceFile` call) purely
 * so `program.getSyntacticDiagnostics()` — public API — can be used for
 * error detection, instead of the internal/undocumented
 * `sourceFile.parseDiagnostics` property some tools rely on. One
 * single-file, in-memory `ts.CompilerHost` per call; no real filesystem
 * access, no project-wide module resolution (see Part 13 of the G-0
 * brief: full recursive module resolution is deliberately out of scope).
 */

function scriptKindFor(path: string): ts.ScriptKind {
  if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (path.endsWith(".ts")) return ts.ScriptKind.TS;
  // Any other extension is treated as TSX — JSX is a superset concern for
  // this tool's purposes, and every real Skrewww/consumer file this
  // module is meant to analyze is .ts/.tsx (see Part 1 audit: no other
  // extension appears in component/consumer source in this repo).
  return ts.ScriptKind.TSX;
}

function toGuardRange(sourceFile: ts.SourceFile, start: number, end: number): GuardSourceRange {
  const startPos = sourceFile.getLineAndCharacterOfPosition(start);
  const endPos = sourceFile.getLineAndCharacterOfPosition(end);
  return {
    start: { line: startPos.line, column: startPos.character },
    end: { line: endPos.line, column: endPos.character },
  };
}

export type ParsedSource = {
  ok: true;
  sourceFile: ts.SourceFile;
  /** Bound to `sourceFile` so downstream extraction never needs to recompute line/column math itself. */
  toRange: (start: number, end: number) => GuardSourceRange;
};

export type ParsedSourceFailure = {
  ok: false;
  errors: GuardParseError[];
};

/**
 * Parses one in-memory TypeScript/TSX source file deterministically.
 * Never touches the real filesystem, never resolves imports against
 * `node_modules` or `tsconfig.json` paths — `moduleSpecifier` strings in
 * the extracted facts are recorded verbatim, never resolved to a real
 * file here (path resolution belongs to the fact loader / provenance
 * layer, not parsing — see extract-imports.ts and provenance.ts).
 */
export function parseSource(path: string, content: string): ParsedSource | ParsedSourceFailure {
  const scriptKind = scriptKindFor(path);
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    jsx: ts.JsxEmit.ReactJSX,
    allowJs: true,
    noResolve: true,
  };

  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind);

  const host: ts.CompilerHost = {
    getSourceFile: (fileName) => (fileName === path ? sourceFile : undefined),
    getDefaultLibFileName: () => "lib.d.ts",
    writeFile: () => {
      /* no-op — this tool never emits output */
    },
    getCurrentDirectory: () => "",
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (fileName) => fileName === path,
    readFile: (fileName) => (fileName === path ? content : undefined),
  };

  const program = ts.createProgram([path], compilerOptions, host);
  const programSourceFile = program.getSourceFile(path);

  if (!programSourceFile) {
    return {
      ok: false,
      errors: [
        {
          kind: "parse-error",
          message: `TypeScript could not produce a source file for "${path}".`,
          range: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } },
        },
      ],
    };
  }

  const diagnostics = program.getSyntacticDiagnostics(programSourceFile);
  if (diagnostics.length > 0) {
    const errors: GuardParseError[] = diagnostics.map((diagnostic) => {
      const start = diagnostic.start ?? 0;
      const length = diagnostic.length ?? 0;
      return {
        kind: "parse-error",
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        range: toGuardRange(programSourceFile, start, start + length),
      };
    });
    return { ok: false, errors };
  }

  return {
    ok: true,
    sourceFile: programSourceFile,
    toRange: (start, end) => toGuardRange(programSourceFile, start, end),
  };
}
