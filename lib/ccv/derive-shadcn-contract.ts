import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createFsSourceReader, readPublicBarrel, type SourceReader } from "@/lib/audit/repo-source";
import { analyzeCssSurface, readScriptSuppliedCustomProperties } from "@/lib/ccv/css-surface";
import { compareCodeUnits, sha256Hex, sortedUnique } from "@/lib/ccv/serialize";
import {
  CCV_CONTRACT_SCHEMA_VERSION,
  type ShadcnConsumerContract,
  type ShadcnExpectations,
  type ShadcnFileExpectation,
  type ShadcnFileKind,
  type ShadcnSharedTarget,
} from "@/lib/ccv/types";
import { componentRegistry, type ComponentRegistryEntry } from "@/lib/component-registry";
import { extractSkrewwwComponentMarker } from "@/lib/guard/provenance-marker";
import {
  SKREWWW_SHADCN_REGISTRY_HOMEPAGE,
  buildDistributedRegistryItems,
  type ShadcnRegistryItem,
} from "@/lib/shadcn-registry-generator";

/**
 * CCV-1 — derives the EXPECTED shadcn consumer contract of every distributed
 * registry item. The item list is `buildDistributedRegistryItems()` itself (no
 * second slug allowlist — CCV-0 finding F5); per-file bytes are the exact
 * generator output; ownership comes from the canonical registry entry; exports
 * come from the public barrel; the CSS surface comes from the delivered CSS.
 *
 * Offline and pure given the repository: no install, no network, no CLI, no
 * browser. The `@skrewww-component` origin marker stays part of the expected
 * bytes — it is recorded, never stripped or excused (CCV-0 finding F1).
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REGISTRY_PREFIX = "@skrewww/";
const FOUNDATION = "foundation";

export type ShadcnContractMode = "LOCAL_CANONICAL" | "PUBLIC_REGISTRY";

export type DeriveShadcnOptions = {
  /** The commit the expectations are derived from. */
  gitSha: string;
  mode?: ShadcnContractMode;
  /** Defaults to `buildDistributedRegistryItems()`. */
  items?: readonly ShadcnRegistryItem[];
  /** Defaults to the canonical `componentRegistry`. */
  registry?: readonly ComponentRegistryEntry[];
  /** Defaults to a reader over this repository. */
  read?: SourceReader;
};

const installPathOf = (target: string): string => {
  if (!target.startsWith("~/")) throw new Error(`shadcn target "${target}" is not "~/"-rooted`);
  return target.slice(2);
};

const registryName = (dependency: string): string => (dependency.startsWith(REGISTRY_PREFIX) ? dependency.slice(REGISTRY_PREFIX.length) : dependency);

function hostRequirementsOf(entry: ComponentRegistryEntry | undefined): string[] {
  return sortedUnique(entry?.hostRequirements ?? []);
}

type DerivationContext = {
  mode: ShadcnContractMode;
  gitSha: string;
  items: readonly ShadcnRegistryItem[];
  byName: Map<string, ShadcnRegistryItem>;
  registry: readonly ComponentRegistryEntry[];
  barrel: Map<string, { values: string[]; types: string[] }>;
  cssDeclaredByItem: Map<string, string[]>;
};

function createContext(options: DeriveShadcnOptions): DerivationContext {
  const items = options.items ?? buildDistributedRegistryItems();
  const byName = new Map<string, ShadcnRegistryItem>();
  for (const item of items) {
    if (byName.has(item.name)) throw new Error(`duplicate registry item "${item.name}"`);
    byName.set(item.name, item);
  }
  const read = options.read ?? createFsSourceReader(REPO_ROOT);
  return {
    mode: options.mode ?? "LOCAL_CANONICAL",
    gitSha: options.gitSha,
    items,
    byName,
    registry: options.registry ?? componentRegistry,
    barrel: readPublicBarrel(read),
    cssDeclaredByItem: new Map(),
  };
}

function cssTextsOf(item: ShadcnRegistryItem): string[] {
  return item.files.filter((file) => installPathOf(file.target).endsWith(".css")).map((file) => file.content);
}

function closureOf(ctx: DerivationContext, name: string): string[] {
  const seen = new Set<string>();
  const visit = (current: string) => {
    if (seen.has(current)) return;
    const item = ctx.byName.get(current);
    if (!item) throw new Error(`registry dependency "${current}" is not a distributed item`);
    seen.add(current);
    for (const dependency of item.registryDependencies) visit(registryName(dependency));
  };
  visit(name);
  return sortedUnique(seen);
}

function declaredByItem(ctx: DerivationContext, name: string): string[] {
  let declared = ctx.cssDeclaredByItem.get(name);
  if (!declared) {
    declared = analyzeCssSurface(cssTextsOf(ctx.byName.get(name) as ShadcnRegistryItem)).declaredCustomProperties;
    ctx.cssDeclaredByItem.set(name, declared);
  }
  return declared;
}

function deriveExpectations(ctx: DerivationContext, item: ShadcnRegistryItem): ShadcnExpectations {
  const entry = ctx.registry.find((candidate) => candidate.slug === item.name);
  if (!entry && item.name !== FOUNDATION) {
    throw new Error(`distributed item "${item.name}" has no canonical registry entry`);
  }
  const own = new Set(entry?.files ?? []);
  const internal = new Set(entry?.internalDependencies ?? []);

  const files: ShadcnFileExpectation[] = item.files.map((file) => {
    const kind: ShadcnFileKind = item.name === FOUNDATION ? "foundation" : own.has(file.path) ? "own" : internal.has(file.path) ? "internal" : (() => {
      throw new Error(`"${item.name}" file "${file.path}" is neither an own file nor an internal dependency of its canonical entry`);
    })();
    const marker = extractSkrewwwComponentMarker(file.content);
    const expectation: ShadcnFileExpectation = {
      target: file.target,
      installPath: installPathOf(file.target),
      sourcePath: file.path,
      sha256: sha256Hex(file.content),
      bytes: Buffer.byteLength(file.content, "utf8"),
      kind,
      fileType: file.type,
    };
    if (marker !== undefined) expectation.originMarker = marker;
    return expectation;
  });
  files.sort((a, b) => compareCodeUnits(a.installPath, b.installPath));

  const closureNames = closureOf(ctx, item.name);
  const closureItems = closureNames.map((name) => ctx.byName.get(name) as ShadcnRegistryItem);
  const installers = new Map<string, { items: Set<string>; sha: Set<string> }>();
  for (const closureItem of closureItems) {
    for (const file of closureItem.files) {
      const installPath = installPathOf(file.target);
      const entryFor = installers.get(installPath) ?? { items: new Set<string>(), sha: new Set<string>() };
      entryFor.items.add(closureItem.name);
      entryFor.sha.add(sha256Hex(file.content));
      installers.set(installPath, entryFor);
    }
  }
  const sharedTargets: ShadcnSharedTarget[] = Array.from(installers.entries())
    .filter(([, value]) => value.items.size > 1)
    .map(([installPath, value]) => ({ installPath, items: sortedUnique(value.items), sha256: sortedUnique(value.sha) }))
    .sort((a, b) => compareCodeUnits(a.installPath, b.installPath));

  const bySourcePath: Record<string, { values: string[]; types: string[] }> = {};
  for (const file of files) {
    if (file.kind !== "own") continue;
    const exported = ctx.barrel.get(file.sourcePath);
    if (exported) bySourcePath[file.sourcePath] = { values: [...exported.values], types: [...exported.types] };
  }
  const allValues = sortedUnique(Object.values(bySourcePath).flatMap((entryExports) => entryExports.values));
  const allTypes = sortedUnique(Object.values(bySourcePath).flatMap((entryExports) => entryExports.types));

  const alsoDeclared = closureNames.filter((name) => name !== item.name).flatMap((name) => declaredByItem(ctx, name));
  const css = analyzeCssSurface(cssTextsOf(item), { alsoDeclared });

  return {
    item: { name: item.name, type: item.type },
    manifest: {
      keys: Object.keys(item).sort(compareCodeUnits),
      fileEntryKeys: sortedUnique(item.files.flatMap((file) => Object.keys(file))),
    },
    files,
    dependencies: { npm: sortedUnique(item.dependencies), registry: sortedUnique(item.registryDependencies) },
    hostRequirements: hostRequirementsOf(entry),
    closure: {
      items: closureNames,
      npm: sortedUnique(closureItems.flatMap((closureItem) => closureItem.dependencies)),
      installPaths: sortedUnique(closureItems.flatMap((closureItem) => closureItem.files.map((file) => installPathOf(file.target)))),
      sharedTargets,
    },
    exports: { values: allValues, types: allTypes, bySourcePath },
    css: {
      ...css,
      scriptSuppliedCustomProperties: readScriptSuppliedCustomProperties(
        item.files.filter((file) => /\.tsx?$/.test(file.path)).map((file) => file.content),
      ),
      sourceFiles: files.filter((file) => file.installPath.endsWith(".css")).map((file) => file.sourcePath).sort(compareCodeUnits),
      resolvedAgainst: closureNames,
    },
    authorities: { files: "generator", dependencies: "canonical-registry", exports: "public-barrel", css: "delivered-css" },
  };
}

function toContract(ctx: DerivationContext, item: ShadcnRegistryItem): ShadcnConsumerContract {
  const contract: ShadcnConsumerContract = {
    schemaVersion: CCV_CONTRACT_SCHEMA_VERSION,
    distribution: "shadcn-registry",
    mode: ctx.mode,
    subject: item.name,
    source: { gitSha: ctx.gitSha },
    expectations: deriveExpectations(ctx, item),
  };
  if (ctx.mode === "PUBLIC_REGISTRY") contract.source.registryOrigin = SKREWWW_SHADCN_REGISTRY_HOMEPAGE;
  return contract;
}

/** Contracts for every distributed item, in generator order. */
export function deriveAllShadcnContracts(options: DeriveShadcnOptions): ShadcnConsumerContract[] {
  const ctx = createContext(options);
  return ctx.items.map((item) => toContract(ctx, item));
}

/** The contract of one distributed item, or `undefined` when `subject` is not a distributed item. */
export function deriveShadcnContract(subject: string, options: DeriveShadcnOptions): ShadcnConsumerContract | undefined {
  const ctx = createContext(options);
  const item = ctx.byName.get(subject);
  return item ? toContract(ctx, item) : undefined;
}

/** Names of the distributed items — the generator's own list, exposed for tooling. */
export function listDistributedItemNames(items: readonly ShadcnRegistryItem[] = buildDistributedRegistryItems()): string[] {
  return items.map((item) => item.name);
}
