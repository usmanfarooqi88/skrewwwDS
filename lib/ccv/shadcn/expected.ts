import { compareCodeUnits, sortedUnique } from "@/lib/ccv/serialize";
import type { ShadcnConsumerContract, ShadcnFileKind } from "@/lib/ccv/types";
import type { ShadcnRegistryItem } from "@/lib/shadcn-registry-generator";

/**
 * CCV-2 — the expected installed result of a batch, assembled ONLY from CCV-1
 * contracts (no second file list, no second item list). Every install path the
 * subjects' registry-dependency closures can write is expected exactly once;
 * when several items contribute the same path, all their expected hashes are
 * kept so a disagreement is visible instead of resolved.
 */

export type ExpectedInstalledFile = {
  installPath: string;
  /** Items in the batch closure that each install this path. */
  items: string[];
  /** Distinct expected SHA-256 across contributors (one entry = they agree). */
  sha256: string[];
  sourcePaths: string[];
  kinds: ShadcnFileKind[];
  originMarker?: string;
  /** npm dependencies and host requirements declared by the contributing items (for import attribution). */
  declaredPackages: string[];
};

export type BatchExpectation = {
  subjects: string[];
  closureItems: string[];
  files: ExpectedInstalledFile[];
  npm: string[];
  hostRequirements: string[];
  /** Public exports attributed to installed own source files, keyed by install path. */
  exports: Array<{ installPath: string; sourcePath: string; item: string; values: string[]; types: string[] }>;
};

/**
 * The batch subjects: every distributed item a consumer installs as a component
 * (`registry:ui`). Other items (Foundation) are verified through the derived
 * registry-dependency closure, not requested directly. Generator order.
 */
export function deriveBatchSubjects(items: readonly ShadcnRegistryItem[]): string[] {
  return items.filter((item) => item.type === "registry:ui").map((item) => item.name);
}

export function buildBatchExpectation(subjects: readonly string[], contracts: readonly ShadcnConsumerContract[]): BatchExpectation {
  const byName = new Map(contracts.map((contract) => [contract.subject, contract]));
  const closure = new Set<string>();
  for (const subject of subjects) {
    const contract = byName.get(subject);
    if (!contract) throw new Error(`no contract for subject "${subject}"`);
    for (const name of contract.expectations.closure.items) closure.add(name);
  }
  const closureItems = sortedUnique(closure);
  const grouped = new Map<string, ExpectedInstalledFile & { _hashes: Set<string> }>();
  const exports: BatchExpectation["exports"] = [];
  const npm = new Set<string>();
  const hosts = new Set<string>();
  for (const name of closureItems) {
    const contract = byName.get(name);
    if (!contract) throw new Error(`closure item "${name}" has no contract`);
    const e = contract.expectations;
    e.dependencies.npm.forEach((dep) => npm.add(dep));
    e.hostRequirements.forEach((host) => hosts.add(host));
    const declared = sortedUnique([...e.closure.npm, ...e.hostRequirements]);
    for (const file of e.files) {
      const entry = grouped.get(file.installPath) ?? {
        installPath: file.installPath, items: [], sha256: [], sourcePaths: [], kinds: [], declaredPackages: [], _hashes: new Set<string>(),
      };
      entry.items.push(name);
      entry._hashes.add(file.sha256);
      entry.sourcePaths.push(file.sourcePath);
      entry.kinds.push(file.kind);
      entry.declaredPackages.push(...declared);
      if (file.originMarker !== undefined) entry.originMarker = file.originMarker;
      grouped.set(file.installPath, entry);
    }
    for (const [sourcePath, names] of Object.entries(e.exports.bySourcePath)) {
      const file = e.files.find((candidate) => candidate.sourcePath === sourcePath);
      if (!file) throw new Error(`"${name}" attributes exports to ${sourcePath}, which it does not transport`);
      exports.push({ installPath: file.installPath, sourcePath, item: name, values: [...names.values], types: [...names.types] });
    }
  }
  const files = Array.from(grouped.values())
    .map(({ _hashes, ...entry }) => ({
      ...entry,
      items: sortedUnique(entry.items),
      sha256: sortedUnique(_hashes),
      sourcePaths: sortedUnique(entry.sourcePaths),
      kinds: sortedUnique(entry.kinds) as ShadcnFileKind[],
      declaredPackages: sortedUnique(entry.declaredPackages),
    }))
    .sort((a, b) => compareCodeUnits(a.installPath, b.installPath));
  exports.sort((a, b) => compareCodeUnits(a.installPath, b.installPath));
  return { subjects: [...subjects], closureItems, files, npm: sortedUnique(npm), hostRequirements: sortedUnique(hosts), exports };
}
