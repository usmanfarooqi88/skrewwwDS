import type { CcvFailureCode } from "@/lib/ccv/failure-codes";
import type { ShadcnFileType } from "@/lib/shadcn-registry-generator";

/**
 * CCV-1 — Consumer Contract Verification: schemas (docs/architecture/consumer-contract-verification.md).
 *
 * A `ConsumerContract` is an EXPECTATION derived offline from canonical Skrewww
 * sources: what an external consumer should receive. It contains no result, no
 * pass/fail and no canonical status. A `CcvResult` (defined here, produced from
 * CCV-2 on) compares observed evidence with a contract. CCV output is
 * verification evidence — never canonical, never an authority of its own.
 *
 * Nothing in `lib/ccv/` installs, fetches, spawns, renders or calls a model.
 */

export const CCV_CONTRACT_SCHEMA_VERSION = "1.0.0";
export const CCV_RESULT_SCHEMA_VERSION = "1.0.0";

export const CCV_DISTRIBUTIONS = ["shadcn-registry", "npm-package"] as const;
export type CcvDistribution = (typeof CCV_DISTRIBUTIONS)[number];

export const CCV_MODES = ["LOCAL_CANONICAL", "PUBLIC_REGISTRY", "LOCAL_TARBALL", "PUBLIC_NPM"] as const;
export type CcvMode = (typeof CCV_MODES)[number];

/** Which modes can verify which distribution. A mode never substitutes for another. */
export const CCV_MODES_BY_DISTRIBUTION: Record<CcvDistribution, readonly CcvMode[]> = {
  "shadcn-registry": ["LOCAL_CANONICAL", "PUBLIC_REGISTRY"],
  "npm-package": ["LOCAL_TARBALL", "PUBLIC_NPM"],
};

/**
 * The canonical source that defined an expectation. Recorded on every contract
 * area and on every result check so verification evidence never becomes its own
 * authority.
 */
export const CCV_AUTHORITIES = [
  "generator",
  "canonical-registry",
  "package-manifest",
  "public-barrel",
  "package-build-entry",
  "delivered-css",
  "release-tag",
  "npm-registry-metadata",
  "ccv-scenario",
] as const;
export type CcvAuthority = (typeof CCV_AUTHORITIES)[number];

// ── CSS consumer surface ────────────────────────────────────────────────────

/**
 * The CSS custom-property surface of CSS that is actually delivered to a
 * consumer. `var(--x, fallback)` is never treated as `var(--x)`.
 */
export type CssSurface = {
  /** Custom properties declared anywhere in the delivered CSS (any selector, any context). */
  declaredCustomProperties: string[];
  /** Every custom property referenced through `var()` (including inside fallbacks). */
  usedCustomProperties: string[];
  /**
   * Used at least once without a usable fallback while not declared in the set
   * the CSS resolves against. May still be supplied at runtime (for example an
   * inline `style` custom property); that is a runtime question, not a CCV-1 fact.
   */
  unresolvedWithoutFallback: string[];
  /** Not declared, but EVERY use is backed by a literal fallback (resolves only through the fallback). */
  fallbackBackedUses: string[];
  /** `[data-skrewww-shape="…"]` / `[data-skrewww-surface="…"]` selectors present in the delivered CSS. */
  modeSelectors: string[];
};

// ── shadcn contract ─────────────────────────────────────────────────────────

export type ShadcnFileKind = "own" | "internal" | "foundation";

export type ShadcnFileExpectation = {
  /** Manifest target, verbatim (`~/components/ui/Button.tsx`). */
  target: string;
  /** Consumer-relative path (`components/ui/Button.tsx`). */
  installPath: string;
  /** Repo-relative canonical source path the manifest names. */
  sourcePath: string;
  /** SHA-256 of the exact manifest content, before any installer transformation. */
  sha256: string;
  bytes: number;
  kind: ShadcnFileKind;
  fileType: ShadcnFileType;
  /**
   * The slug in the `@skrewww-component` origin marker of the CANONICAL content,
   * when present. It is part of the expected bytes: it is never stripped,
   * normalized or excused here (CCV-0 finding F1).
   */
  originMarker?: string;
};

export type ShadcnSharedTarget = {
  installPath: string;
  /** Items in the dependency closure that each declare this install path. */
  items: string[];
  /** Distinct content hashes across those items (one entry = they agree). */
  sha256: string[];
};

export type ShadcnExpectations = {
  item: {
    name: string;
    type: ShadcnFileType;
  };
  /** Exact top-level keys of the generated registry item and of each of its file entries. */
  manifest: { keys: string[]; fileEntryKeys: string[] };
  files: ShadcnFileExpectation[];
  dependencies: {
    /** Real npm dependencies the item declares. */
    npm: string[];
    /** `registryDependencies` as declared (`@skrewww/foundation`). */
    registry: string[];
  };
  /** Host requirements the item documents (never installed). Evidence only. */
  hostRequirements: string[];
  /** The transitive registry-dependency closure the installer must resolve. */
  closure: {
    items: string[];
    npm: string[];
    installPaths: string[];
    sharedTargets: ShadcnSharedTarget[];
  };
  /** Public barrel exports attributed to this item's own source files. */
  exports: {
    values: string[];
    types: string[];
    bySourcePath: Record<string, { values: string[]; types: string[] }>;
  };
  css: CssSurface & {
    /** Custom properties the item's transported TS/TSX assigns at runtime (e.g. an inline `style` key). Never subtracted from `unresolvedWithoutFallback`. */
    scriptSuppliedCustomProperties: string[];
    /** Delivered CSS files of this item (not its dependencies). */
    sourceFiles: string[];
    /** Item names whose CSS is also delivered, and against which `var()` resolution was judged. */
    resolvedAgainst: string[];
  };
  authorities: {
    files: CcvAuthority;
    dependencies: CcvAuthority;
    exports: CcvAuthority;
    css: CcvAuthority;
  };
};

// ── npm contract ────────────────────────────────────────────────────────────

export type NpmLifecycleExpectations = {
  /** Lifecycle scripts a consumer's installer runs that Skrewww allows. Policy: none. */
  allowedConsumerRun: string[];
  /** Scripts the manifest declares that a consumer install would run (`preinstall`, `install`, `postinstall`, `prepare`). */
  declaredConsumerRun: string[];
  /** Scripts the manifest declares that only run for the publisher (`prepublishOnly`, `prepack`, …). */
  declaredPublisherOnly: string[];
};

export type NpmExpectations = {
  package: {
    name: string;
    version: string;
    type: string;
    engines: string | null;
    /** The `exports` map, verbatim from the manifest. */
    exportsMap: Record<string, unknown>;
    /** Import specifiers a consumer may use. Everything else in the tarball is denied. */
    publicSpecifiers: string[];
    files: { required: string[]; allowedExact: string[]; allowedPrefixes: string[] };
    lifecycleScripts: NpmLifecycleExpectations;
    publishConfig: { access: string | null; tag: string | null };
    sideEffects: string[] | boolean | null;
  };
  dependencies: {
    npm: string[];
    peers: string[];
    optional: string[];
    ranges: { npm: Record<string, string>; peers: Record<string, string>; optional: Record<string, string> };
  };
  exports: {
    /** Runtime value exports of the package root. */
    values: string[];
    /** Type-only exports of the package root. */
    types: string[];
    /** Specifiers that must NOT resolve (deep imports into a packed file the `exports` map does not expose). */
    denied: string[];
    byModule: Record<string, { values: string[]; types: string[] }>;
  };
  css: CssSurface & {
    /** Custom properties assigned at runtime by the TS/TSX the package bundles. Never subtracted from `unresolvedWithoutFallback`. */
    scriptSuppliedCustomProperties: string[];
    /** The stylesheet export, e.g. `@skrewww/react/styles.css`. */
    stylesheetSpecifier: string;
    /** Repo-relative CSS inputs bundled into the stylesheet (after the Foundation extraction). */
    sourceFiles: string[];
  };
  authorities: {
    package: CcvAuthority;
    dependencies: CcvAuthority;
    exports: CcvAuthority;
    css: CcvAuthority;
  };
};

// ── contract ────────────────────────────────────────────────────────────────

type ContractBase = {
  schemaVersion: string;
  mode: CcvMode;
  /** shadcn: the registry item name. npm: the package name. */
  subject: string;
  source: {
    /** The commit the expectations were derived from. */
    gitSha: string;
    packageVersion?: string;
    registryOrigin?: string;
  };
  /** Pinned consumer tooling, when a later slice supplies it. Never derived from a floating `latest`. */
  tools?: Record<string, string>;
};

export type ShadcnConsumerContract = ContractBase & {
  distribution: "shadcn-registry";
  expectations: ShadcnExpectations;
};

export type NpmConsumerContract = ContractBase & {
  distribution: "npm-package";
  expectations: NpmExpectations;
};

export type ConsumerContract = ShadcnConsumerContract | NpmConsumerContract;

// ── result and evidence (defined now, produced from CCV-2 on) ───────────────

export type CcvCheckStatus = "pass" | "fail" | "unknown" | "not-applicable";

export const CCV_EVIDENCE_KINDS = ["file", "hash", "export", "css", "tool", "command", "package-metadata", "registry-payload", "source"] as const;
export type CcvEvidenceKind = (typeof CCV_EVIDENCE_KINDS)[number];

/** Concise and reproducible. Never a log dump, a file body or `node_modules`. */
export type CcvEvidence = {
  kind: CcvEvidenceKind;
  /** Stable reference: a path, import specifier, command phase, source ref or tool name. */
  ref: string;
  /** The observed value, at most `CCV_EVIDENCE_OBSERVED_LIMIT` characters. */
  observed: string;
  sha256?: string;
};

export const CCV_EVIDENCE_OBSERVED_LIMIT = 400;

export type CcvCheck = {
  /** Stable machine-readable id, e.g. `shadcn:button:file:components/ui/Button.tsx`. Never an index. */
  checkId: string;
  status: CcvCheckStatus;
  failureCode?: CcvFailureCode;
  claim: string;
  expected?: string;
  actual?: string;
  /** The canonical source that defined the expectation. */
  authority: CcvAuthority;
  evidence: CcvEvidence[];
};

export type CcvResult = {
  schemaVersion: string;
  distribution: CcvDistribution;
  mode: CcvMode;
  subject: string;
  environment: {
    node?: string;
    platform?: string;
    packageManager?: string;
    tools?: Record<string, string>;
  };
  source: {
    expectedGitSha: string;
    observedGitSha?: string;
    packageVersion?: string;
    integrity?: string;
  };
  checks: CcvCheck[];
  summary: { pass: number; fail: number; unknown: number; notApplicable: number };
  /** The only non-deterministic block; absent from any contract. */
  volatile?: { startedAt?: string; durationMs?: number };
};
