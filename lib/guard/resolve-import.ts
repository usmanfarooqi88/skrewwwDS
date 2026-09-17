import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import * as ts from "typescript";

/**
 * Minimal deterministic import → file resolution for Guard consumer
 * provenance. Uses TypeScript config parsing for `@/*`-style aliases.
 * Does not implement a full bundler resolver.
 */

export type ResolvedImportFile = {
  absolutePath: string;
  content: string;
};

function tryReadSource(candidate: string): ResolvedImportFile | undefined {
  const normalized = normalize(candidate);
  const candidates = [
    normalized,
    `${normalized}.tsx`,
    `${normalized}.ts`,
    join(normalized, "index.tsx"),
    join(normalized, "index.ts"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return { absolutePath: path, content: readFileSync(path, "utf8") };
    } catch {
      continue;
    }
  }
  return undefined;
}

function loadTsconfigPaths(projectRoot: string): { baseUrl: string; paths: Record<string, string[]> } {
  const configPath = join(projectRoot, "tsconfig.json");
  if (!existsSync(configPath)) {
    return { baseUrl: projectRoot, paths: {} };
  }
  const text = readFileSync(configPath, "utf8");
  const parsed = ts.parseConfigFileTextToJson(configPath, text);
  if (!parsed.config || typeof parsed.config !== "object") {
    return { baseUrl: projectRoot, paths: {} };
  }
  const config = parsed.config as {
    compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
  };
  const baseUrlRel = config.compilerOptions?.baseUrl ?? ".";
  const baseUrl = resolve(projectRoot, baseUrlRel);
  const paths = config.compilerOptions?.paths ?? {};
  return { baseUrl, paths };
}

function applyPathMapping(
  moduleSpecifier: string,
  baseUrl: string,
  paths: Record<string, string[]>,
): string | undefined {
  for (const [pattern, targets] of Object.entries(paths)) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1); // "@/*" → "@/"
      if (moduleSpecifier.startsWith(prefix)) {
        const rest = moduleSpecifier.slice(prefix.length);
        const target = targets[0];
        if (!target) continue;
        const mapped = target.endsWith("/*") ? `${target.slice(0, -1)}${rest}` : target.replace("*", rest);
        return resolve(baseUrl, mapped);
      }
    } else if (moduleSpecifier === pattern) {
      const target = targets[0];
      if (!target) continue;
      return resolve(baseUrl, target);
    }
  }
  return undefined;
}

/**
 * Resolve a module specifier relative to an importing file and project root.
 * Returns undefined when resolution fails (caller treats as unknown provenance).
 */
export function resolveImportToFile(
  importerPath: string,
  moduleSpecifier: string,
  projectRoot: string,
): ResolvedImportFile | undefined {
  if (moduleSpecifier.startsWith(".")) {
    const fromDir = dirname(resolve(projectRoot, importerPath));
    return tryReadSource(resolve(fromDir, moduleSpecifier));
  }

  const { baseUrl, paths } = loadTsconfigPaths(projectRoot);
  const mapped = applyPathMapping(moduleSpecifier, baseUrl, paths);
  if (mapped) {
    return tryReadSource(mapped);
  }

  // Common shadcn default without paths entry: @/ → project root
  if (moduleSpecifier.startsWith("@/")) {
    return tryReadSource(resolve(projectRoot, moduleSpecifier.slice(2)));
  }

  return undefined;
}

/** Project-relative path for diagnostics (posix separators). */
export function toLogicalImportPath(absolutePath: string, projectRoot: string): string {
  const rel = relative(resolve(projectRoot), absolutePath);
  if (!rel || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    return absolutePath.split(sep).join("/");
  }
  return rel.split(sep).join("/");
}
