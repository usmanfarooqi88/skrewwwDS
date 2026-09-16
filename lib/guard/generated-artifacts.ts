import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Thin, pure-input loaders for the generated artifacts
 * `distribution/hostrequirements-leak` and
 * `distribution/hosthost-schema-consistency` validate — `public/r/*.json`
 * (shadcn manifests, `npm run generate:registry`) and
 * `public/agent/contracts/*.json` (Agent Kit contracts, `npm run
 * generate:agent-context`). Neither is invented here — both are real,
 * already-generated projections of the canonical registry; these rules
 * validate structured data directly rather than scanning arbitrary files
 * heuristically, per docs/architecture/guard-readiness-audit.md's G-1
 * brief.
 *
 * Rule functions themselves take already-loaded JSON (pure, matching
 * G-0's own filesystem-access discipline) — these loaders are the one
 * place that touches disk, kept separate so rule logic stays testable
 * against synthetic fixtures without real generated output present.
 */

export type GeneratedManifest = { fileName: string; json: Record<string, unknown> };
export type GeneratedContract = { fileName: string; json: Record<string, unknown> };

export function loadGeneratedManifests(root: string = process.cwd()): GeneratedManifest[] {
  const dir = join(root, "public", "r");
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json") && fileName !== "registry.json") // registry.json is the discovery index, a different shape entirely — not an install manifest
    .map((fileName) => ({
      fileName,
      json: JSON.parse(readFileSync(join(dir, fileName), "utf8")) as Record<string, unknown>,
    }));
}

export function loadGeneratedContracts(root: string = process.cwd()): GeneratedContract[] {
  const dir = join(root, "public", "agent", "contracts");
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => ({
      fileName,
      json: JSON.parse(readFileSync(join(dir, fileName), "utf8")) as Record<string, unknown>,
    }));
}
