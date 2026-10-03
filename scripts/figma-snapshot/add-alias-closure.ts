/**
 * AG-1B 1.1.0 migration: add the transitive alias closure to the committed
 * snapshots without re-reading the whole node.
 *
 *   npx tsx scripts/figma-snapshot/add-alias-closure.ts <closure-variables.json> --captured-at <ISO UTC>
 *
 * `<closure-variables.json>` is a read-only capture of the alias-target
 * variables that are not bound in ANY committed snapshot, keyed by variable id:
 *   { "VariableID:…": [name, resolvedType, collectionId, collectionName, valuesByMode] }
 * (the same traversal `capture-in-figma.js` now performs natively on a full
 * capture; this script exists so existing snapshots can be upgraded in place).
 *
 * Variables bound in other pilots are resolved from those snapshots' own
 * `observed.variables`. Nothing is written unless every snapshot validates, and
 * a snapshot whose closure would be incomplete is refused — the upgrade is only
 * useful when absence becomes provable. Idempotent: running it twice with the
 * same input changes nothing.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRegistryEntry } from "@/lib/component-registry";
import { computeAliasClosure, type ClosureVariableSource } from "@/lib/figma-snapshot/alias-closure";
import type { RawVariableValue } from "@/lib/figma-snapshot/raw-capture";
import { FIGMA_SNAPSHOT_SCHEMA_VERSION, type FigmaSnapshot } from "@/lib/figma-snapshot/schema";
import { validateFigmaSnapshot } from "@/lib/figma-snapshot/validate";

type ClosureTuple = [name: string, resolvedType: string, collectionId: string, collectionName: string | null, valuesByMode: Record<string, unknown>];

const round = (n: number) => Math.round(n * 10000) / 10000;

/** Same literal rounding as `capture-in-figma.js` (`literal`), so closure values match the committed snapshots' precision. */
function literal(value: unknown): RawVariableValue {
  if (value && typeof value === "object" && "r" in value) {
    const color = value as { r: number; g: number; b: number; a?: number };
    return { r: round(color.r), g: round(color.g), b: round(color.b), a: round(color.a ?? 1) };
  }
  if (value && typeof value === "object" && "aliasId" in value) return value as RawVariableValue;
  return typeof value === "number" ? round(value) : (value as RawVariableValue);
}

function main(): void {
  const args = process.argv.slice(2);
  const closurePath = args[0];
  const atIndex = args.indexOf("--captured-at");
  const capturedAt = atIndex >= 0 ? args[atIndex + 1] : undefined;
  if (!closurePath || !capturedAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(capturedAt)) {
    console.error("usage: add-alias-closure.ts <closure-variables.json> --captured-at <ISO UTC, e.g. 2026-10-03T16:00:00Z>");
    process.exit(2);
  }

  const supplement = JSON.parse(readFileSync(closurePath, "utf8")) as Record<string, ClosureTuple>;
  const dir = join("agent", "figma-snapshots");
  const files: Array<{ path: string; slug: string; snapshot: FigmaSnapshot }> = [];
  for (const fileKey of readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    for (const name of readdirSync(join(dir, fileKey.name)).filter((entry) => entry.endsWith(".json")).sort()) {
      const path = join(dir, fileKey.name, name);
      files.push({ path, slug: name.replace(/\.json$/, ""), snapshot: JSON.parse(readFileSync(path, "utf8")) as FigmaSnapshot });
    }
  }

  const lookupTable = new Map<string, ClosureVariableSource>();
  for (const { snapshot } of files) {
    for (const variable of snapshot.observed.variables) {
      lookupTable.set(variable.id, { name: variable.name, resolvedType: variable.resolvedType, collection: variable.collection, valuesByMode: variable.valuesByMode });
    }
  }
  for (const [id, [name, resolvedType, , collectionName, valuesByMode]] of Object.entries(supplement)) {
    if (lookupTable.has(id)) continue;
    lookupTable.set(id, {
      name,
      resolvedType,
      collection: collectionName,
      valuesByMode: Object.fromEntries(Object.entries(valuesByMode).map(([mode, value]) => [mode, literal(value)])),
    });
  }

  const failures: string[] = [];
  const outputs: Array<{ path: string; json: string }> = [];
  for (const { path, slug, snapshot } of files) {
    const identity = getRegistryEntry(slug)?.figmaIdentity;
    if (!identity) {
      failures.push(`${slug}: no figmaIdentity in the registry`);
      continue;
    }
    const closure = computeAliasClosure(snapshot.observed.variables, (id) => lookupTable.get(id));
    if (closure.unresolvedIds.length > 0) {
      failures.push(`${slug}: ${closure.unresolvedIds.length} alias target(s) still unresolved: ${closure.unresolvedIds.join(", ")}`);
      continue;
    }
    const upgraded: FigmaSnapshot = {
      ...snapshot,
      schemaVersion: FIGMA_SNAPSHOT_SCHEMA_VERSION,
      capture: { ...snapshot.capture, aliasClosureCapturedAt: capturedAt },
      observed: { ...snapshot.observed, aliasClosure: closure },
      derived: { ...snapshot.derived, aliasClosureComplete: true },
      unknowns: snapshot.unknowns.map((unknown) =>
        unknown.fact === "renderedValues"
          ? {
              fact: "renderedValues",
              reason: "Variable bindings and their alias closure are captured, not rendered output; mode selection, fallbacks and rendered values are not evaluated.",
            }
          : unknown,
      ),
    };
    const problems = validateFigmaSnapshot(upgraded, identity);
    if (problems.length > 0) {
      failures.push(...problems.map((problem) => `${slug}: ${problem}`));
      continue;
    }
    outputs.push({ path, json: `${JSON.stringify(upgraded, null, 2)}\n` });
  }

  if (failures.length > 0) {
    console.error(`Refusing to write snapshots:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  for (const { path, json } of outputs) writeFileSync(path, json);
  console.log(`Upgraded ${outputs.length} snapshot(s) to schema ${FIGMA_SNAPSHOT_SCHEMA_VERSION}.`);
}

main();
