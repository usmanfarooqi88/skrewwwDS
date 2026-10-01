/**
 * Release-integrity checks for the @skrewww/react package. Pure functions plus
 * one filesystem walk, shared by `scripts/prepublish-react-package.ts` (which
 * `prepublishOnly` runs) and `scripts/smoke-react-package.ts`, so the rules
 * exist exactly once. Nothing here touches the network or publishes anything.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export type ReleaseIssue = { area: string; message: string };

type PackageManifest = {
  name?: string;
  version?: string;
  private?: boolean;
  type?: string;
  engines?: { node?: string };
  exports?: Record<string, unknown>;
  files?: string[];
  sideEffects?: string[] | boolean;
  publishConfig?: { access?: string; tag?: string };
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const FORBIDDEN_DEPENDENCIES = ["next", "recharts", "server-only", "@next/third-parties"];

/** Manifest rules that must hold before this package can be published. `private` is reported separately. */
export function checkManifest(pkg: PackageManifest): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  const add = (message: string) => issues.push({ area: "manifest", message });

  if (pkg.name !== "@skrewww/react") add(`name must be "@skrewww/react" (got ${JSON.stringify(pkg.name)})`);
  if (!pkg.version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version)) add(`version is not valid semver (${pkg.version})`);
  if (pkg.type !== "module") add('"type" must be "module" (ESM-only)');
  if (pkg.publishConfig?.access !== "public") add('publishConfig.access must be "public" (scoped packages default to private)');
  if (!pkg.publishConfig?.tag) add("publishConfig.tag must be set explicitly");
  if (pkg.version?.includes("-") && (!pkg.publishConfig?.tag || pkg.publishConfig.tag === "latest")) {
    add("a prerelease version must publish under a non-latest dist-tag");
  }
  if (!pkg.engines?.node) add("engines.node must be explicit");
  if (JSON.stringify(pkg.files) !== JSON.stringify(["dist", "README.md", "LICENSE"])) add('files must be exactly ["dist","README.md","LICENSE"]');
  if (JSON.stringify(pkg.sideEffects) !== JSON.stringify(["**/*.css"])) add('sideEffects must be ["**/*.css"] so consumer bundlers keep the stylesheet');
  const exportKeys = Object.keys(pkg.exports ?? {}).sort();
  if (JSON.stringify(exportKeys) !== JSON.stringify([".", "./package.json", "./styles.css"])) add(`exports must be exactly ".", "./styles.css", "./package.json" (got ${exportKeys.join(", ")})`);
  const peers = Object.keys(pkg.peerDependencies ?? {}).sort();
  if (JSON.stringify(peers) !== JSON.stringify(["react", "react-dom"])) add("peerDependencies must be exactly react and react-dom");
  if (!/^\^19\./.test(pkg.peerDependencies?.react ?? "")) add("react peer range must stay on the verified React 19 line");
  if (JSON.stringify(Object.keys(pkg.dependencies ?? {})) !== JSON.stringify(["@phosphor-icons/react"])) add("the only runtime dependency must be @phosphor-icons/react");
  const all = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies });
  for (const name of all) {
    if (FORBIDDEN_DEPENDENCIES.includes(name) || name.startsWith("@vercel/")) add(`forbidden dependency: ${name}`);
  }
  if (!pkg.scripts?.prepublishOnly) add("prepublishOnly guard is missing");
  return issues;
}

/** Whether npm would currently refuse to publish (`private: true`). Informational, not a failure. */
export function isPublishBlockedByPrivate(pkg: PackageManifest): boolean {
  return pkg.private === true;
}

const ALLOWED_PACKED = (path: string) =>
  path === "package.json" || path === "README.md" || path === "LICENSE" || path.startsWith("dist/");

/** The tarball may contain only package metadata and the built output. */
export function checkPackedFiles(paths: readonly string[]): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  for (const path of paths) {
    if (!ALLOWED_PACKED(path)) issues.push({ area: "tarball", message: `unexpected file in tarball: ${path}` });
  }
  for (const required of ["package.json", "README.md", "LICENSE", "dist/index.js", "dist/index.d.ts", "dist/styles.css"]) {
    if (!paths.includes(required)) issues.push({ area: "tarball", message: `required file missing from tarball: ${required}` });
  }
  return issues;
}

export type ExpectedExports = { values: string[]; types: string[] };

/** Names exported by the generated entry source, split into runtime values and type-only exports. */
export function extractExportedNames(entrySource: string): ExpectedExports {
  const values = new Set<string>();
  const types = new Set<string>();
  for (const block of Array.from(entrySource.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g))) {
    const target = block[1] ? types : values;
    for (const part of block[2].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) target.add(name);
    }
  }
  return { values: Array.from(values).sort(), types: Array.from(types).sort() };
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/**
 * Detects missing, incomplete or inconsistent `dist`: required files exist and
 * are non-empty, every name the generated entry exports is exported by both
 * the JS and the declarations, and every relative declaration import resolves.
 */
export function checkDistIntegrity(distDir: string, expected: ExpectedExports): ReleaseIssue[] {
  const issues: ReleaseIssue[] = [];
  const add = (message: string) => issues.push({ area: "dist", message });
  for (const file of ["index.js", "index.d.ts", "styles.css"]) {
    const path = join(distDir, file);
    if (!existsSync(path) || statSync(path).size === 0) add(`missing or empty: dist/${file}`);
  }
  if (issues.length > 0) return issues;

  const js = readFileSync(join(distDir, "index.js"), "utf8");
  const dts = readFileSync(join(distDir, "index.d.ts"), "utf8");
  const jsExportClause = /export\s*\{([\s\S]*?)\}\s*;?\s*$/.exec(js)?.[1] ?? "";
  const jsExports = new Set(
    jsExportClause.split(",").map((part) => part.trim().split(/\s+as\s+/).pop()?.trim()).filter(Boolean) as string[],
  );
  if (jsExports.size === 0) add("dist/index.js has no export clause");
  const dtsHas = (name: string) => new RegExp(`\\b${name}\\b`).test(dts);
  for (const name of expected.values) {
    if (!jsExports.has(name)) add(`dist/index.js does not export ${name}`);
    if (!dtsHas(name)) add(`dist/index.d.ts does not export ${name}`);
  }
  for (const name of expected.types) {
    if (!dtsHas(name)) add(`dist/index.d.ts does not export type ${name}`);
  }

  for (const file of walk(distDir).filter((f) => f.endsWith(".d.ts"))) {
    for (const match of Array.from(readFileSync(file, "utf8").matchAll(/from\s+["'](\.[^"']*)["']/g))) {
      const target = resolve(dirname(file), match[1]);
      if (!existsSync(`${target}.d.ts`) && !existsSync(join(target, "index.d.ts"))) {
        add(`unresolved declaration import ${match[1]} in ${file.slice(distDir.length + 1)}`);
      }
    }
  }
  return issues;
}
