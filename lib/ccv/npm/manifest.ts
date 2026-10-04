import { compareCodeUnits, stableStringify } from "@/lib/ccv/serialize";
import type { NpmExpectations } from "@/lib/ccv/types";

/**
 * CCV-3 — the INSTALLED package manifest against the CCV-1 npm contract.
 * Identity fields are compared exactly; dependencies, peers and optional
 * dependencies by name AND declared range, in both directions.
 */

export type InstalledManifest = {
  name?: string;
  version?: string;
  type?: string;
  engines?: { node?: string };
  exports?: unknown;
  sideEffects?: unknown;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export type FieldComparison = { field: string; expected: string; actual: string; ok: boolean };

const show = (value: unknown) => (value === undefined ? "(absent)" : typeof value === "string" ? value : stableStringify(value).trim());

export function compareIdentity(manifest: InstalledManifest, expected: NpmExpectations["package"]): FieldComparison[] {
  const pairs: Array<[string, unknown, unknown]> = [
    ["name", expected.name, manifest.name],
    ["version", expected.version, manifest.version],
    ["type", expected.type, manifest.type ?? "commonjs"],
    ["engines", expected.engines ?? undefined, manifest.engines?.node],
    ["exports", expected.exportsMap, manifest.exports],
    ["side-effects", expected.sideEffects ?? undefined, manifest.sideEffects],
  ];
  return pairs.map(([field, want, got]) => ({ field, expected: show(want), actual: show(got), ok: show(want) === show(got) }));
}

export type DependencyKind = "dependency" | "peer" | "optional";

export type DependencyComparison = { kind: DependencyKind; name: string; expected?: string; actual?: string; ok: boolean };

export function compareDependencies(manifest: InstalledManifest, expected: NpmExpectations["dependencies"]): DependencyComparison[] {
  const kinds: Array<[DependencyKind, Record<string, string>, Record<string, string> | undefined]> = [
    ["dependency", expected.ranges.npm, manifest.dependencies],
    ["peer", expected.ranges.peers, manifest.peerDependencies],
    ["optional", expected.ranges.optional, manifest.optionalDependencies],
  ];
  const out: DependencyComparison[] = [];
  for (const [kind, want, got] of kinds) {
    const names = Array.from(new Set([...Object.keys(want), ...Object.keys(got ?? {})])).sort(compareCodeUnits);
    for (const name of names) {
      const entry: DependencyComparison = { kind, name, ok: want[name] !== undefined && want[name] === got?.[name] };
      if (want[name] !== undefined) entry.expected = want[name];
      if (got?.[name] !== undefined) entry.actual = got[name];
      out.push(entry);
    }
  }
  return out;
}

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;

/** Minimal range check for the forms the package uses (`^x.y.z`, `~x.y.z`, `x.y.z`, `>=x.y.z`). `undefined` = cannot judge. */
export function satisfiesRange(version: string, range: string): boolean | undefined {
  const v = VERSION.exec(version);
  const match = /^(\^|~|>=)?(\d+)\.(\d+)\.(\d+)$/.exec(range.trim());
  if (!v || !match) return undefined;
  const [major, minor, patch] = [Number(v[1]), Number(v[2]), Number(v[3])];
  const [rMajor, rMinor, rPatch] = [Number(match[2]), Number(match[3]), Number(match[4])];
  const cmp = major - rMajor || minor - rMinor || patch - rPatch;
  switch (match[1]) {
    case "^": return cmp >= 0 && (rMajor > 0 ? major === rMajor : rMinor > 0 ? major === 0 && minor === rMinor : major === 0 && minor === 0 && patch === rPatch);
    case "~": return cmp >= 0 && major === rMajor && minor === rMinor;
    case ">=": return cmp >= 0;
    default: return cmp === 0;
  }
}
