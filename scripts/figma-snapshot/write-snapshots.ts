/**
 * AG-1B: turn a raw plugin-runtime capture (see capture-in-figma.js) into
 * validated snapshots under agent/figma-snapshots/<fileKey>/<slug>.json.
 *
 *   npx tsx scripts/figma-snapshot/write-snapshots.ts <raw-capture.json> [--captured-at <ISO UTC>]
 *
 * Identity always comes from the registry's `figmaIdentity`, never from the
 * capture. A slug without a registry identity, or a capture of a different
 * node or file, is refused. Nothing is written unless every snapshot validates.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRegistryEntry } from "@/lib/component-registry";
import { normalizeFigmaSnapshot } from "@/lib/figma-snapshot/normalize";
import type { RawFigmaCapture } from "@/lib/figma-snapshot/raw-capture";
import { validateFigmaSnapshot } from "@/lib/figma-snapshot/validate";

export const FIGMA_SNAPSHOT_DIR = join("agent", "figma-snapshots");

function main(): void {
  const args = process.argv.slice(2);
  const rawPath = args[0];
  const atIndex = args.indexOf("--captured-at");
  const capturedAt = atIndex >= 0 ? args[atIndex + 1] : new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  if (!rawPath) {
    console.error("usage: write-snapshots.ts <raw-capture.json> [--captured-at <ISO UTC>]");
    process.exit(2);
  }

  const capture = JSON.parse(readFileSync(rawPath, "utf8")) as RawFigmaCapture;
  const outputs: Array<{ file: string; json: string }> = [];
  const failures: string[] = [];

  for (const target of capture.targets) {
    const slug = target.target.slug;
    const identity = getRegistryEntry(slug)?.figmaIdentity;
    if (!identity) {
      failures.push(`${slug}: no figmaIdentity in the registry`);
      continue;
    }
    try {
      const snapshot = normalizeFigmaSnapshot(capture, slug, identity, capturedAt);
      const problems = validateFigmaSnapshot(snapshot, identity);
      if (problems.length) {
        failures.push(...problems.map((p) => `${slug}: ${p}`));
        continue;
      }
      outputs.push({
        file: join(FIGMA_SNAPSHOT_DIR, identity.fileKey, `${slug}.json`),
        json: `${JSON.stringify(snapshot, null, 2)}\n`,
      });
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (failures.length) {
    console.error(`Refusing to write snapshots:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  for (const { file, json } of outputs) {
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, json);
    console.log(`wrote ${file}`);
  }
}

main();
