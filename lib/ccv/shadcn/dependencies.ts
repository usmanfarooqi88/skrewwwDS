/**
 * CCV-2 — the consumer's direct-dependency delta across the install, compared
 * with the union of the contracts' declared npm dependencies. The scaffold's own
 * dependencies are the baseline, never blamed on Skrewww; host requirements
 * (react, react-dom, …) are never expected to be installed by the add.
 */

export type DependencyMap = Record<string, string>;

export function readDirectDependencies(packageJson: string): DependencyMap {
  const parsed = JSON.parse(packageJson) as { dependencies?: DependencyMap; devDependencies?: DependencyMap };
  return { ...(parsed.devDependencies ?? {}), ...(parsed.dependencies ?? {}) };
}

export type DependencyDelta = { added: DependencyMap; removed: string[]; changed: Array<{ name: string; before: string; after: string }> };

export function dependencyDelta(before: DependencyMap, after: DependencyMap): DependencyDelta {
  const added: DependencyMap = {};
  const changed: DependencyDelta["changed"] = [];
  for (const [name, spec] of Object.entries(after).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (!(name in before)) added[name] = spec;
    else if (before[name] !== spec) changed.push({ name, before: before[name], after: spec });
  }
  const removed = Object.keys(before).filter((name) => !(name in after)).sort();
  return { added, removed, changed };
}

export type DependencyVerdict = { present: Array<{ name: string; spec: string }>; missing: string[]; unexpected: Array<{ name: string; spec: string }>; removed: string[]; changed: DependencyDelta["changed"] };

export function evaluateDependencies(delta: DependencyDelta, expected: readonly string[]): DependencyVerdict {
  const present = expected.filter((name) => name in delta.added).map((name) => ({ name, spec: delta.added[name] }));
  return {
    present,
    missing: expected.filter((name) => !(name in delta.added)),
    unexpected: Object.entries(delta.added).filter(([name]) => !expected.includes(name)).map(([name, spec]) => ({ name, spec })),
    removed: delta.removed,
    changed: delta.changed,
  };
}
