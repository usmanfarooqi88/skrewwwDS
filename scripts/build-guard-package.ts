/**
 * Build @skrewww/guard package candidate (no publish).
 *
 * - Ensures consumer facts are generated
 * - Copies facts into packages/guard/facts/
 * - Bundles public CLI with esbuild (typescript external)
 */
import { cpSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { buildConsumerFactsBundle, serializeConsumerFactsBundle } from "../lib/guard/build-consumer-facts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgRoot = join(root, "packages", "guard");
const factsOut = join(pkgRoot, "facts", "consumer-facts.json");
const repoFacts = join(root, "lib", "guard", "generated", "consumer-facts.json");

async function main(): Promise<void> {
mkdirSync(dirname(repoFacts), { recursive: true });
mkdirSync(dirname(factsOut), { recursive: true });

const bundle = buildConsumerFactsBundle();
const serialized = serializeConsumerFactsBundle(bundle);
writeFileSync(repoFacts, serialized, "utf8");
writeFileSync(factsOut, serialized, "utf8");

mkdirSync(join(pkgRoot, "dist"), { recursive: true });

await esbuild.build({
  entryPoints: [join(root, "packages/guard/src/cli.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: join(pkgRoot, "dist/cli.js"),
  banner: {
    js: "#!/usr/bin/env node\n",
  },
  external: ["typescript"],
  alias: {
    "@": root,
  },
  logLevel: "info",
});

chmodSync(join(pkgRoot, "dist/cli.js"), 0o755);

// Ensure LICENSE is present
cpSync(join(root, "LICENSE"), join(pkgRoot, "LICENSE"));

const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  version: string;
};
console.log(`Built @skrewww/guard@${pkg.version}`);
console.log(`  facts: ${bundle.components.length} components`);
console.log(`  dist: packages/guard/dist/cli.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
