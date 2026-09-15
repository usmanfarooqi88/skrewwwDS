/**
 * Writes the shadcn-compatible distribution manifests to public/r/.
 *
 * All actual generation logic lives in lib/shadcn-registry-generator.ts.
 * Run via `npm run generate:registry` (also part of `npm run build`).
 *
 * Individual `/r/<name>.json` files and `/r/registry.json` are both derived
 * from `buildDistributedRegistryItems()` — one distributed set, no second
 * allowlist (CE-3N).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDistributedRegistryItems,
  buildRegistryIndex,
} from "../lib/shadcn-registry-generator";

const OUT_DIR = join(process.cwd(), "public", "r");

mkdirSync(OUT_DIR, { recursive: true });

const manifests = buildDistributedRegistryItems();
const registryIndex = buildRegistryIndex(manifests);

console.log("Generated shadcn registry manifests:");
for (const manifest of manifests) {
  const filename = `${manifest.name}.json`;
  const path = join(OUT_DIR, filename);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(" -", path);
}

const registryPath = join(OUT_DIR, "registry.json");
writeFileSync(registryPath, `${JSON.stringify(registryIndex, null, 2)}\n`);
console.log(" -", registryPath);
console.log(`Generated ${manifests.length} item manifests + registry index (${registryIndex.items.length} discovery items).`);
