/**
 * Build the @skrewww/react package candidate (MK-1). Never publishes.
 *
 * The package is a distribution boundary over the canonical components:
 *  - the entry is generated from the registry + public barrel (lib/react-package/pilot-entry.ts)
 *  - JS + component CSS Modules are bundled from components/ui with esbuild
 *  - dist/styles.css = Foundation (tokens + .sr-only, the same extraction the
 *    shadcn transport ships) followed by the compiled component CSS
 *  - declarations are emitted by tsc, then repository `@/` aliases are
 *    rewritten to relative paths so consumers need no path mapping
 *  - the output is checked for next/recharts/@vercel/alias leaks and the
 *    build fails if any are found
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { componentRegistry } from "../lib/component-registry";
import { extractFoundationCss } from "../lib/shadcn-registry-generator";
import { buildReactPackageEntry, type PilotComponentFact } from "../lib/react-package/pilot-entry";
import { checkBuiltFile, type OutputViolation } from "../lib/react-package/output-checks";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgRoot = join(root, "packages", "react");
const dist = join(pkgRoot, "dist");
const buildDir = join(pkgRoot, ".build");
const typesDir = join(dist, "types");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Rewrites `@/x` specifiers in emitted declarations to paths relative to the emitted tree. */
export function rewriteAliasSpecifiers(content: string, fileDir: string, typesRoot: string): string {
  return content.replace(/(from\s+|import\s*\(\s*|import\s+)(["'])@\/([^"']+)\2/g, (_m, lead: string, quote: string, spec: string) => {
    let rel = relative(fileDir, join(typesRoot, spec)).split(sep).join("/");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return `${lead}${quote}${rel}${quote}`;
  });
}

export async function buildReactPackage(): Promise<void> {
  rmSync(dist, { recursive: true, force: true });
  rmSync(buildDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(dist, { recursive: true });

  // 1. Canonical-source driven entry.
  const barrel = readFileSync(join(root, "components", "ui", "index.ts"), "utf8");
  const { source, components } = buildReactPackageEntry(componentRegistry, barrel);
  const entry = join(buildDir, "index.ts");
  writeFileSync(entry, source, "utf8");
  printComponents(components);

  // 2. JS + component CSS (CSS Modules are hashed by esbuild's local-css).
  await esbuild.build({
    entryPoints: [entry],
    outfile: join(dist, "index.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    tsconfig: join(root, "tsconfig.json"),
    external: ["react", "react-dom", "react/jsx-runtime", "react-dom/*", "@phosphor-icons/react", "@phosphor-icons/react/*"],
    banner: { js: '"use client";' },
    legalComments: "none",
    logLevel: "warning",
    logOverride: { "unsupported-directive": "silent", "ignored-directive": "silent" },
  });

  // 3. One public stylesheet: Foundation first, then compiled component CSS.
  const componentCss = readFileSync(join(dist, "index.css"), "utf8");
  rmSync(join(dist, "index.css"));
  writeFileSync(
    join(dist, "styles.css"),
    [
      "/* @skrewww/react — Foundation (design tokens + accessibility utilities), then compiled component styles. */",
      extractFoundationCss().trimEnd(),
      "",
      componentCss.trim(),
      "",
    ].join("\n"),
    "utf8",
  );

  // 4. Declarations: emit, relocate the entry, rewrite repository aliases.
  execFileSync(join(root, "node_modules", ".bin", "tsc"), ["-p", join(pkgRoot, "tsconfig.build.json")], { cwd: root, stdio: "inherit" });
  const emittedEntry = join(typesDir, "packages", "react", ".build", "index.d.ts");
  writeFileSync(join(dist, "index.d.ts"), readFileSync(emittedEntry, "utf8"), "utf8");
  rmSync(join(typesDir, "packages"), { recursive: true, force: true });
  for (const file of [...walk(typesDir), join(dist, "index.d.ts")].filter((f) => f.endsWith(".d.ts"))) {
    const before = readFileSync(file, "utf8");
    const after = rewriteAliasSpecifiers(before, dirname(file), typesDir);
    if (after !== before) writeFileSync(file, after, "utf8");
  }
  rmSync(buildDir, { recursive: true, force: true });

  // 5. Fail the build on any leak of next/recharts/@vercel/repository aliases.
  const violations: OutputViolation[] = walk(dist).flatMap((file) =>
    checkBuiltFile(relative(pkgRoot, file), readFileSync(file, "utf8")),
  );
  if (violations.length > 0) {
    for (const v of violations) console.error(`  ✖ ${v.file}: ${v.rule} (${v.match})`);
    throw new Error(`@skrewww/react output failed regression checks (${violations.length}).`);
  }

  const files = walk(dist);
  console.log(`@skrewww/react built: ${files.length} files in packages/react/dist (not published).`);
}

function printComponents(components: PilotComponentFact[]): void {
  console.log("Pilot components (status read from the canonical registry):");
  for (const c of components) console.log(`  - ${c.slug} (${c.status}) ← components/ui/${c.module}.tsx`);
}


if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  buildReactPackage().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
