import { builtinModules } from "node:module";
import { posix } from "node:path";
import { readRawImports } from "@/lib/audit/repo-source";

/**
 * CCV-2 — explicit import closure of the installed Skrewww source, using the
 * TypeScript Compiler API (via the AG-1C reader). A build passing is not taken
 * as proof: every specifier must resolve to an installed transported file, or to
 * a package that is both installed and declared (npm dependency or documented
 * host requirement) by the items that install the file.
 */

export type ImportProblem = {
  specifier: string;
  problem: "unresolved-local" | "outside-transported-set" | "undeclared-package" | "package-not-installed";
  detail: string;
};

export type FileImportVerdict = { installPath: string; resolvedLocal: number; resolvedPackages: string[]; problems: ImportProblem[] };

export type ImportClosureInput = {
  files: ReadonlyArray<{ installPath: string; content: string; declaredPackages: readonly string[] }>;
  /** Install paths written by the batch. */
  transported: ReadonlySet<string>;
  exists: (consumerRelativePath: string) => boolean;
  packageInstalled: (name: string) => boolean;
};

const EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".d.ts", "/index.ts", "/index.tsx", "/index.js"];

export function packageNameOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function localTarget(from: string, specifier: string): string | undefined {
  if (specifier.startsWith("@/")) return posix.normalize(specifier.slice(2));
  if (specifier.startsWith("./") || specifier.startsWith("../")) return posix.normalize(posix.join(posix.dirname(from), specifier));
  return undefined;
}

export function evaluateImportClosure(input: ImportClosureInput): FileImportVerdict[] {
  return input.files
    .filter((file) => /\.(tsx?|jsx?|mjs)$/.test(file.installPath))
    .map((file) => {
      const verdict: FileImportVerdict = { installPath: file.installPath, resolvedLocal: 0, resolvedPackages: [], problems: [] };
      const packages = new Set<string>();
      for (const raw of readRawImports(file.installPath, file.content)) {
        const specifier = raw.specifier;
        const local = localTarget(file.installPath, specifier);
        if (local !== undefined) {
          const hit = EXTENSIONS.map((extension) => `${local}${extension}`).find((candidate) => input.exists(candidate));
          if (!hit) verdict.problems.push({ specifier, problem: "unresolved-local", detail: `no installed file for ${local}` });
          else if (!input.transported.has(hit)) verdict.problems.push({ specifier, problem: "outside-transported-set", detail: `resolves to consumer file ${hit}, which no Skrewww item installs` });
          else verdict.resolvedLocal += 1;
          continue;
        }
        const name = packageNameOf(specifier);
        const builtin = specifier.startsWith("node:") || builtinModules.includes(name);
        if (!file.declaredPackages.includes(name)) {
          verdict.problems.push({ specifier, problem: "undeclared-package", detail: `${builtin ? "Node built-in" : "package"} ${name} is neither a declared npm dependency nor a documented host requirement of the installing items` });
        } else if (!builtin && !input.packageInstalled(name)) {
          verdict.problems.push({ specifier, problem: "package-not-installed", detail: `${name} is declared but not installed in the consumer` });
        } else packages.add(name);
      }
      verdict.resolvedPackages = Array.from(packages).sort();
      return verdict;
    });
}
