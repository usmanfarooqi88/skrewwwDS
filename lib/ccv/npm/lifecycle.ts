import { CONSUMER_RUN_LIFECYCLE_SCRIPTS } from "@/lib/ccv/derive-npm-contract";
import { sortedUnique } from "@/lib/ccv/serialize";

/**
 * CCV-3 — lifecycle scripts. Consumer-run scripts are those a consumer's
 * `npm install` executes for an installed package (`preinstall`, `install`,
 * `postinstall`; `prepare` for git/directory installs — counted conservatively,
 * CCV-1's list), plus npm's IMPLICIT `node-gyp rebuild` install when a package ships
 * a `binding.gyp` and declares no install script. Everything else (`prepublishOnly`,
 * `prepack`, …) runs only for the publisher.
 */

export const IMPLICIT_NODE_GYP = "install:implicit-node-gyp";

export type ScriptClassification = { consumerRun: string[]; publisherOnly: string[] };

export function classifyScripts(scripts: Record<string, string> | undefined, options: { hasBindingGyp?: boolean } = {}): ScriptClassification {
  const names = Object.keys(scripts ?? {});
  const consumerRun = names.filter((name) => CONSUMER_RUN_LIFECYCLE_SCRIPTS.includes(name));
  if (options.hasBindingGyp && !names.includes("install") && !names.includes("preinstall")) consumerRun.push(IMPLICIT_NODE_GYP);
  return { consumerRun: sortedUnique(consumerRun), publisherOnly: sortedUnique(names.filter((name) => !CONSUMER_RUN_LIFECYCLE_SCRIPTS.includes(name))) };
}

export type DependencyNode = { name: string; version: string; consumerRun: string[] };

export type ManifestReader = (packageDir: string) => { version?: string; dependencies?: Record<string, string>; optionalDependencies?: Record<string, string>; scripts?: Record<string, string>; hasBindingGyp?: boolean } | undefined;

/**
 * The runtime dependency tree of an installed package (dependencies and optional
 * dependencies, not peers — the consumer provides those), resolved the way Node
 * does: nested `node_modules` first, then the consumer's top level.
 */
export function walkDependencyTree(consumerRoot: string, packageName: string, read: ManifestReader): { nodes: DependencyNode[]; unresolved: string[] } {
  const nodes = new Map<string, DependencyNode>();
  const unresolved: string[] = [];
  const visit = (dir: string) => {
    const manifest = read(dir);
    if (!manifest) return;
    for (const name of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies }).sort()) {
      const candidates = [`${dir}/node_modules/${name}`, `${consumerRoot}/node_modules/${name}`];
      const found = candidates.find((candidate) => read(candidate) !== undefined);
      if (!found) {
        if (!(name in (manifest.optionalDependencies ?? {}))) unresolved.push(name);
        continue;
      }
      if (nodes.has(found)) continue;
      const dependency = read(found)!;
      nodes.set(found, { name, version: dependency.version ?? "?", consumerRun: classifyScripts(dependency.scripts, { hasBindingGyp: dependency.hasBindingGyp }).consumerRun });
      visit(found);
    }
  };
  visit(`${consumerRoot}/node_modules/${packageName}`);
  return { nodes: Array.from(nodes.values()).sort((a, b) => (a.name < b.name ? -1 : 1)), unresolved: sortedUnique(unresolved) };
}
