import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import * as ts from "typescript";
import type {
  ExportedNames,
  ImplementationFile,
  ImplementationOrigin,
  LocalImportFact,
} from "@/lib/audit/repo-facts-types";

/**
 * Conservative local source readers for the Audit Agent repo-facts collector.
 * They support only the import forms this repository actually uses (`@/…` and
 * relative specifiers) — this is not a general TypeScript module resolver.
 * Parsing uses the TypeScript Compiler API (already a dependency, same as
 * Guard), never regex over TS syntax.
 */

export const PUBLIC_BARREL = "components/ui/index.ts";

/** Never traversed: dependencies, generated public outputs, build output. */
const FORBIDDEN_PREFIXES = ["node_modules/", "public/", "dist/", ".next", "packages/", "make-kit/dist/", "audit/"];

const RESOLVE_EXTENSIONS = [".ts", ".tsx"];

export type SourceReader = (repoRelativePath: string) => string | undefined;

export function createFsSourceReader(repoRoot: string): SourceReader {
  return (path) => {
    const absolute = join(repoRoot, path);
    try {
      if (!existsSync(absolute) || !statSync(absolute).isFile()) return undefined;
      return readFileSync(absolute, "utf8");
    } catch {
      return undefined;
    }
  };
}

function toPosix(path: string): string {
  return path.split("\\").join("/");
}

type RawImport = { specifier: string; declaration: "import" | "export-from"; typeOnly: boolean };

function scriptKindFor(path: string): ts.ScriptKind {
  return path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function parse(path: string, source: string): ts.SourceFile {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, scriptKindFor(path));
}

/** Static `import … from` and `export … from` module specifiers, in source order. */
export function readRawImports(path: string, source: string): RawImport[] {
  const file = parse(path, source);
  const found: RawImport[] = [];
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      found.push({
        specifier: statement.moduleSpecifier.text,
        declaration: "import",
        typeOnly: Boolean(statement.importClause?.isTypeOnly),
      });
    } else if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      found.push({ specifier: statement.moduleSpecifier.text, declaration: "export-from", typeOnly: statement.isTypeOnly });
    }
  }
  return found;
}

export type Resolution =
  | { status: "resolved"; path: string }
  | { status: "external" }
  | { status: "unresolved"; reason: string }
  | { status: "skipped"; path: string; reason: string };

function isForbidden(path: string): boolean {
  return FORBIDDEN_PREFIXES.some((prefix) => path === prefix.replace(/\/$/, "") || path.startsWith(prefix));
}

/** Resolves a specifier against the repository. Bare package specifiers are `external`. */
export function resolveLocalSpecifier(from: string, specifier: string, read: SourceReader): Resolution {
  let base: string;
  if (specifier.startsWith("@/")) base = specifier.slice(2);
  else if (specifier.startsWith("./") || specifier.startsWith("../")) base = posix.normalize(posix.join(dirname(from), specifier));
  else return { status: "external" };

  base = toPosix(base);
  const candidates: string[] = [];
  if (/\.[a-z0-9]+$/i.test(base)) candidates.push(base);
  for (const extension of RESOLVE_EXTENSIONS) candidates.push(`${base}${extension}`);
  for (const extension of RESOLVE_EXTENSIONS) candidates.push(`${base}/index${extension}`);

  for (const candidate of candidates) {
    if (read(candidate) === undefined) continue;
    if (isForbidden(candidate)) return { status: "skipped", path: candidate, reason: "generated, build or dependency output is never traversed" };
    if (candidate === PUBLIC_BARREL) return { status: "skipped", path: candidate, reason: "public barrel is not traversed (it would pull in the whole library)" };
    return { status: "resolved", path: candidate };
  }
  return { status: "unresolved", reason: `no file found for "${specifier}" (tried ${candidates.length} candidates)` };
}

/** Names a source file declares as exports, split into runtime values and types. */
export function readDeclaredExports(path: string, source: string): ExportedNames {
  const file = parse(path, source);
  const values = new Set<string>();
  const types = new Set<string>();
  const hasExport = (node: ts.Node) =>
    ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
  const isDefault = (node: ts.Node) =>
    ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword);

  for (const statement of file.statements) {
    if (ts.isExportAssignment(statement)) {
      values.add("default");
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier && !statement.exportClause) {
        values.add("*");
        continue;
      }
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          (statement.isTypeOnly || element.isTypeOnly ? types : values).add(element.name.text);
        }
      }
      continue;
    }
    if (!hasExport(statement)) continue;
    if (isDefault(statement)) {
      values.add("default");
      continue;
    }
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      types.add(statement.name.text);
    } else if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) {
      if (statement.name) values.add(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) values.add(declaration.name.text);
      }
    }
  }
  return { values: Array.from(values).sort(), types: Array.from(types).sort() };
}

/**
 * What the public barrel (`components/ui/index.ts`) re-exports, grouped by the
 * source file each statement re-exports from. This IS the public surface.
 */
export function readPublicBarrel(read: SourceReader): Map<string, ExportedNames> {
  const source = read(PUBLIC_BARREL);
  const byFile = new Map<string, ExportedNames>();
  if (source === undefined) return byFile;
  const file = parse(PUBLIC_BARREL, source);
  for (const statement of file.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const resolved = resolveLocalSpecifier(PUBLIC_BARREL, statement.moduleSpecifier.text, read);
    if (resolved.status !== "resolved") continue;
    const entry = byFile.get(resolved.path) ?? { values: [], types: [] };
    if (!statement.exportClause) {
      entry.values.push("*");
    } else if (ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        (statement.isTypeOnly || element.isTypeOnly ? entry.types : entry.values).push(element.name.text);
      }
    }
    byFile.set(resolved.path, entry);
  }
  for (const entry of Array.from(byFile.values())) {
    entry.values = Array.from(new Set(entry.values)).sort();
    entry.types = Array.from(new Set(entry.types)).sort();
  }
  return byFile;
}

/** Imports referenced from CSS: `@import "x.css"` and CSS Modules `composes: a from "./x.module.css"`. */
export function readCssImports(css: string): string[] {
  const found = new Set<string>();
  for (const match of Array.from(css.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g))) found.add(match[1]);
  for (const match of Array.from(css.matchAll(/composes\s*:[^;]*\sfrom\s+["']([^"']+)["']/g))) found.add(match[1]);
  return Array.from(found).sort();
}

export type GraphInput = {
  /** Repo-relative roots from the registry. */
  files: readonly string[];
  internalDependencies: readonly string[];
  read: SourceReader;
};

export type GraphResult = {
  implementationFiles: ImplementationFile[];
  cssFiles: ImplementationFile[];
  /** Direct imports of the own TS/TSX source files. */
  directImports: LocalImportFact[];
  /** Resolution failures anywhere in the graph. */
  unresolved: { from: string; specifier: string; reason: string }[];
};

function isTsFile(path: string): boolean {
  return path.endsWith(".ts") || path.endsWith(".tsx");
}

function isCssFile(path: string): boolean {
  return path.endsWith(".css");
}

/**
 * Traverses the local implementation graph from the registry's own files and
 * declared internal dependencies. Cycle-safe (visited set), never enters
 * dependencies, generated or build output or the public barrel, and records —
 * never silently drops — anything it cannot resolve.
 */
export function walkImplementationGraph(input: GraphInput): GraphResult {
  const own = new Set(input.files);
  const internal = new Set(input.internalDependencies);
  const originOf = (path: string): ImplementationOrigin => (own.has(path) ? "own" : internal.has(path) ? "internal" : "reachable");

  const visited = new Map<string, ImplementationFile>();
  const queue: string[] = [];
  const unresolved: GraphResult["unresolved"] = [];
  const directImports: LocalImportFact[] = [];

  const enqueue = (path: string, reachedFrom?: string) => {
    if (visited.has(path)) return;
    const entry: ImplementationFile = { path, origin: originOf(path) };
    // Roots (declared in the registry) carry no `reachedFrom`; everything else records its first importer.
    if (reachedFrom && !own.has(path) && !internal.has(path)) entry.reachedFrom = reachedFrom;
    visited.set(path, entry);
    queue.push(path);
  };

  for (const path of [...input.files, ...input.internalDependencies]) {
    if (input.read(path) === undefined) {
      unresolved.push({ from: "(registry)", specifier: path, reason: "registry-listed file does not exist" });
      continue;
    }
    enqueue(path);
  }

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const source = input.read(current);
    if (source === undefined) continue;

    if (isCssFile(current)) {
      for (const specifier of readCssImports(source)) {
        const resolution = resolveLocalSpecifier(current, specifier, input.read);
        if (resolution.status === "resolved") enqueue(resolution.path, current);
        else if (resolution.status === "unresolved") unresolved.push({ from: current, specifier, reason: resolution.reason });
      }
      continue;
    }
    if (!isTsFile(current)) continue;

    for (const raw of readRawImports(current, source)) {
      const resolution = resolveLocalSpecifier(current, raw.specifier, input.read);
      const fact: LocalImportFact = {
        from: current,
        specifier: raw.specifier,
        declaration: raw.declaration,
        typeOnly: raw.typeOnly,
        status: resolution.status,
      };
      if (resolution.status === "resolved") {
        fact.resolved = resolution.path;
        enqueue(resolution.path, current);
      } else if (resolution.status === "skipped") {
        fact.resolved = resolution.path;
        fact.reason = resolution.reason;
      } else if (resolution.status === "unresolved") {
        fact.reason = resolution.reason;
        unresolved.push({ from: current, specifier: raw.specifier, reason: resolution.reason });
      }
      if (own.has(current)) directImports.push(fact);
    }
  }

  const all = Array.from(visited.values()).sort((a, b) => a.path.localeCompare(b.path));
  return {
    implementationFiles: all.filter((file) => !isCssFile(file.path)),
    cssFiles: all.filter((file) => isCssFile(file.path)),
    directImports: directImports.sort((a, b) => a.from.localeCompare(b.from) || a.specifier.localeCompare(b.specifier)),
    unresolved: unresolved.sort((a, b) => a.from.localeCompare(b.from) || a.specifier.localeCompare(b.specifier)),
  };
}
