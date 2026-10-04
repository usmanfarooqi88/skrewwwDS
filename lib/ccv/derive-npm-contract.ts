import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createFsSourceReader, readPublicBarrel, walkImplementationGraph, type SourceReader } from "@/lib/audit/repo-source";
import { analyzeCssSurface, readScriptSuppliedCustomProperties } from "@/lib/ccv/css-surface";
import { compareCodeUnits, sortedUnique } from "@/lib/ccv/serialize";
import { CCV_CONTRACT_SCHEMA_VERSION, type NpmConsumerContract, type NpmExpectations } from "@/lib/ccv/types";
import { componentRegistry, type ComponentRegistryEntry } from "@/lib/component-registry";
import { REACT_PACKAGE_ROUTER_MODULE, buildReactPackageEntry } from "@/lib/react-package/pilot-entry";
import {
  PACKED_ALLOWED_EXACT,
  PACKED_ALLOWED_PREFIXES,
  REQUIRED_PACKED_FILES,
  extractExportedNames,
} from "@/lib/react-package/release-checks";
import { extractFoundationCss } from "@/lib/shadcn-registry-generator";

/**
 * CCV-1 — derives the EXPECTED npm consumer contract of `@skrewww/react`.
 * Authorities: `packages/react/package.json` (identity, exports map, dependency
 * and lifecycle metadata), the package build's own entry logic
 * (`buildReactPackageEntry`, the same function the build runs) cross-checked
 * against the TypeScript reading of the public barrel, and the CSS the build
 * actually bundles. Nothing is built, packed, installed or fetched.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PACKAGE_MANIFEST = "packages/react/package.json";
const BARREL = "components/ui/index.ts";

export const NPM_PUBLIC_REGISTRY_ORIGIN = "https://registry.npmjs.org";

/** Scripts a consumer's installer may run. `prepare` also runs for git and local-directory installs. */
export const CONSUMER_RUN_LIFECYCLE_SCRIPTS: readonly string[] = ["preinstall", "install", "postinstall", "prepare"];

export type NpmContractMode = "LOCAL_TARBALL" | "PUBLIC_NPM";

export type DeriveNpmOptions = {
  gitSha: string;
  mode?: NpmContractMode;
  registry?: readonly ComponentRegistryEntry[];
  read?: SourceReader;
  /** Defaults to the generator's Foundation extraction (the CSS the build puts first in `styles.css`). */
  foundationCss?: string;
};

type PackageManifest = {
  name?: string;
  version?: string;
  type?: string;
  engines?: { node?: string };
  exports?: Record<string, unknown>;
  sideEffects?: string[] | boolean;
  publishConfig?: { access?: string; tag?: string };
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

function requireText(read: SourceReader, path: string): string {
  const text = read(path);
  if (text === undefined) throw new Error(`cannot derive the npm contract: ${path} is missing`);
  return text;
}

function sortedRecord(record: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).sort(([a], [b]) => compareCodeUnits(a, b)));
}

function specifierFor(pkg: string, subpath: string): string {
  if (subpath === ".") return pkg;
  if (!subpath.startsWith("./") || subpath.includes("*")) throw new Error(`unsupported exports key "${subpath}"`);
  return `${pkg}/${subpath.slice(2)}`;
}

/** The package build entry and the TypeScript reading of the barrel must agree on every pilot module. */
function crossCheckBarrel(read: SourceReader, byModule: Record<string, { values: string[]; types: string[] }>): void {
  const typescript = readPublicBarrel(read);
  for (const [module, names] of Object.entries(byModule)) {
    const path = Array.from(typescript.keys()).find((candidate) => candidate.startsWith(`components/ui/${module}.`));
    const reference = path ? typescript.get(path) : undefined;
    const sameValues = JSON.stringify(sortedUnique(names.values)) === JSON.stringify(reference?.values ?? []);
    const sameTypes = JSON.stringify(sortedUnique(names.types)) === JSON.stringify(reference?.types ?? []);
    if (!reference || !sameValues || !sameTypes) {
      throw new Error(`package entry and the TypeScript reading of ${BARREL} disagree about "${module}"`);
    }
  }
}

export function deriveNpmContract(options: DeriveNpmOptions): NpmConsumerContract {
  const read = options.read ?? createFsSourceReader(REPO_ROOT);
  const registry = options.registry ?? componentRegistry;
  const manifest = JSON.parse(requireText(read, PACKAGE_MANIFEST)) as PackageManifest;
  if (!manifest.name || !manifest.version) throw new Error(`${PACKAGE_MANIFEST} has no name or version`);
  const pkg = manifest.name;

  // Exports: the build's own entry logic, not display names or capitalization.
  const { source, components, exportsByModule } = buildReactPackageEntry(registry, requireText(read, BARREL));
  const named = extractExportedNames(source);
  crossCheckBarrel(read, exportsByModule);
  const byModule = Object.fromEntries(
    Object.entries(exportsByModule)
      .sort(([a], [b]) => compareCodeUnits(a, b))
      .map(([module, names]) => [module, { values: sortedUnique(names.values), types: sortedUnique(names.types) }]),
  );

  // Public vs denied specifiers, from the exports map and the tarball contract.
  const exportsMap = manifest.exports ?? {};
  const publicSpecifiers = sortedUnique(Object.keys(exportsMap).map((subpath) => specifierFor(pkg, subpath)));
  const packedPaths = sortedUnique([...REQUIRED_PACKED_FILES, ...PACKED_ALLOWED_EXACT]);
  const denied = sortedUnique(
    [
      ...packedPaths.map((path) => `${pkg}/${path}`),
      ...components.map((component) => `${pkg}/components/ui/${component.module}`),
      `${pkg}/components/ui/${REACT_PACKAGE_ROUTER_MODULE}`,
    ].filter((specifier) => !publicSpecifiers.includes(specifier)),
  );

  // Lifecycle scripts.
  const scriptNames = Object.keys(manifest.scripts ?? {});
  const lifecycleScripts = {
    allowedConsumerRun: [] as string[],
    declaredConsumerRun: sortedUnique(scriptNames.filter((name) => CONSUMER_RUN_LIFECYCLE_SCRIPTS.includes(name))),
    declaredPublisherOnly: sortedUnique(scriptNames.filter((name) => !CONSUMER_RUN_LIFECYCLE_SCRIPTS.includes(name))),
  };

  // CSS the build bundles: the Foundation extraction first, then every CSS module reachable from the entry modules.
  const roots = [...components.map((component) => component.module), REACT_PACKAGE_ROUTER_MODULE].map((module) => `components/ui/${module}.tsx`);
  const graph = walkImplementationGraph({ files: roots, internalDependencies: [], read });
  if (graph.unresolved.length > 0) {
    throw new Error(`the package import graph has unresolved local imports: ${graph.unresolved.map((entry) => `${entry.from} → ${entry.specifier}`).join(", ")}`);
  }
  const cssPaths = graph.cssFiles.map((file) => file.path).sort(compareCodeUnits);
  const foundation = options.foundationCss ?? extractFoundationCss();
  const css = analyzeCssSurface([foundation, ...cssPaths.map((path) => requireText(read, path))]);

  const expectations: NpmExpectations = {
    package: {
      name: pkg,
      version: manifest.version,
      type: manifest.type ?? "commonjs",
      engines: manifest.engines?.node ?? null,
      exportsMap: JSON.parse(JSON.stringify(exportsMap)) as Record<string, unknown>,
      publicSpecifiers,
      files: {
        required: sortedUnique(REQUIRED_PACKED_FILES),
        allowedExact: sortedUnique(PACKED_ALLOWED_EXACT),
        allowedPrefixes: sortedUnique(PACKED_ALLOWED_PREFIXES),
      },
      lifecycleScripts,
      publishConfig: { access: manifest.publishConfig?.access ?? null, tag: manifest.publishConfig?.tag ?? null },
      sideEffects: manifest.sideEffects ?? null,
    },
    dependencies: {
      npm: sortedUnique(Object.keys(manifest.dependencies ?? {})),
      peers: sortedUnique(Object.keys(manifest.peerDependencies ?? {})),
      optional: sortedUnique(Object.keys(manifest.optionalDependencies ?? {})),
      ranges: {
        npm: sortedRecord(manifest.dependencies),
        peers: sortedRecord(manifest.peerDependencies),
        optional: sortedRecord(manifest.optionalDependencies),
      },
    },
    exports: { values: named.values, types: named.types, denied, byModule },
    css: {
      ...css,
      scriptSuppliedCustomProperties: readScriptSuppliedCustomProperties(
        graph.implementationFiles.map((file) => read(file.path) ?? ""),
      ),
      stylesheetSpecifier: `${pkg}/styles.css`,
      sourceFiles: sortedUnique(["styles/foundation.css", "styles/tokens.css", ...cssPaths]),
    },
    authorities: { package: "package-manifest", dependencies: "package-manifest", exports: "package-build-entry", css: "delivered-css" },
  };

  const contract: NpmConsumerContract = {
    schemaVersion: CCV_CONTRACT_SCHEMA_VERSION,
    distribution: "npm-package",
    mode: options.mode ?? "LOCAL_TARBALL",
    subject: pkg,
    source: { gitSha: options.gitSha, packageVersion: manifest.version },
    expectations,
  };
  if (contract.mode === "PUBLIC_NPM") contract.source.registryOrigin = NPM_PUBLIC_REGISTRY_ORIGIN;
  return contract;
}
