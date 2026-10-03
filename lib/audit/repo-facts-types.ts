/**
 * AG-1C — normalized repository evidence for the Audit Agent.
 *
 * `RepoFacts` is a COLLECTED SNAPSHOT of canonical repository evidence for one
 * component at one git SHA. It is evidence for an audit run, never a source of
 * truth: authority stays with the registry, the React source, the token source,
 * the content files and the Guard rules, depending on claim type
 * (docs/architecture/source-of-truth.md).
 *
 * Deliberately absent: any Figma snapshot fact, any comparison, any parity
 * verdict, any model-derived prose. Those belong to AG-1D and later.
 *
 * Every field is JSON-serializable. Arrays whose order carries no meaning are
 * sorted by the collector so the same slug at the same SHA serializes
 * identically.
 */

export const REPO_FACTS_SCHEMA_VERSION = "1.0.0";

/** Documented-API property names are free text in the registry; classify, never parse. */
export type ApiNameKind =
  /** Looks like a prop or attribute name (`variant`, `aria-label`). */
  | "identifier"
  /** Contains whitespace, a dot or parentheses (`DialogBody children`, `MenuItem.onSelect`, `useDataTableSort(options)`). */
  | "free-form"
  | "unknown-structure";

/** Parity comments found in `styles/tokens.css`. Preserved as evidence; they are not audit statuses. */
export type ParityLabel = "VERIFIED" | "TEMPORARY" | "EXPERIMENTAL" | "ALIASED" | "UNRESOLVED";

/**
 * Where an implementation file sits relative to the component:
 * - `own`       — listed in the registry entry's `files`
 * - `internal`  — listed in the registry entry's `internalDependencies`
 * - `reachable` — neither, but reached through local imports (e.g. another component this one composes)
 */
export type ImplementationOrigin = "own" | "internal" | "reachable";

export type ImplementationFile = {
  path: string;
  origin: ImplementationOrigin;
  /** First importer that reached this file; absent for files that are roots (own / internal declared in the registry). */
  reachedFrom?: string;
};

export type LocalImportFact = {
  /** Repo-relative file containing the import. */
  from: string;
  specifier: string;
  /** `export … from` re-exports are recorded as imports too. */
  declaration: "import" | "export-from";
  typeOnly: boolean;
  status: "resolved" | "external" | "unresolved" | "skipped";
  /** Repo-relative target when `status` is `resolved`. */
  resolved?: string;
  /** Why a resolved target was not traversed (`skipped`) or could not be resolved. */
  reason?: string;
};

export type ExportedNames = { values: string[]; types: string[] };

export type DocumentedApiProperty = {
  name: string;
  nameKind: ApiNameKind;
  type: string;
  default?: string;
  description: string;
};

export type CssFileFact = {
  path: string;
  origin: ImplementationOrigin;
  reachedFrom?: string;
};

export type CssCustomPropertyUse = {
  /** Custom property referenced through `var(--…)`. */
  name: string;
  /** Every CSS file that references it, with that file's origin. */
  usedIn: { file: string; origin: ImplementationOrigin }[];
};

export type CssLocalDeclaration = {
  name: string;
  file: string;
  line: number;
  value: string;
};

export type RuntimeDeclaration = {
  /** Source file of the declaration (`styles/tokens.css` or a component CSS file). */
  file: string;
  line: number;
  /** Selector / at-rule context, e.g. `:root` or `[data-skrewww-shape="pill"]`. */
  context: string;
  /** Raw declaration value, whitespace-normalized. */
  value: string;
  /** Direct alias target when the value is exactly `var(--other)`. */
  aliasTarget?: string;
  parityLabel?: ParityLabel;
  /** Where the label was read from. */
  labelSource?: "inline" | "preceding-comment" | "section";
  /** The comment text the label came from, trimmed. */
  comment?: string;
};

export type AliasHop = { name: string; value: string };

export type TokenResolution = {
  name: string;
  resolution: "declared" | "declared-locally" | "unresolved";
  declarations: RuntimeDeclaration[];
  /** Shallow chain following exact `var(--x)` aliases from the first `:root` declaration. Not a computed-style evaluation. */
  aliasChain: AliasHop[];
  chainEnd: "literal" | "unresolved" | "cycle" | "depth-limit" | "none";
};

export type GuardEvaluationFact = {
  ruleId: string;
  status: "violation" | "pass" | "not-applicable" | "unknown";
  subject?: { kind: string; id: string };
  /** `not-applicable` and `unknown` reason. */
  reason?: string;
  finding?: {
    severity: string;
    canonicalEvidence: string;
    details?: string;
    location?: { path: string };
  };
  /** How the evaluation was attributed to this slug. */
  attribution: "subject" | "evidence-text";
};

export type RepoFactsProvenance = {
  gitSha: string;
  /** Committer timestamp of `gitSha` — deterministic per SHA, never wall-clock time. */
  gitCommitTimestamp: string;
  /** True when tracked files differ from `gitSha`, so collected facts may not equal that commit. */
  workingTreeDirty: boolean;
  /** v1 reads the current checkout only; historical refs are not supported. */
  refMode: "current-checkout";
};

export type RepoFacts = {
  schemaVersion: string;
  component: {
    slug: string;
    name: string;
    category: string;
    status: string;
    version: string;
  };
  provenance: RepoFactsProvenance;

  /** Evidence read directly from the canonical component registry entry. */
  registry: {
    reactAvailability: string;
    figmaAvailability: string;
    documentationCompleteness: string;
    /** Canonical Figma-named token dependency set. */
    tokensUsed: string[];
    /** Declared set of CSS custom properties the entry's OWN CSS references. */
    cssTokens: string[];
    files: string[];
    internalDependencies: string[];
    registryDependencies: string[];
    hostRequirements: string[];
    documentedApiProperties: DocumentedApiProperty[];
    supportedVariants: string[];
    supportedSizes: string[];
    openQuestions: string[];
    /** Recorded Figma reference text and identity — evidence only; `verified` is never parity. */
    figmaReference?: string;
    figmaIdentity?: {
      fileKey: string;
      nodeId: string;
      nodeType: string;
      role: string;
      verifiedAt: string;
    };
  };

  /** The compiled Agent contract for the same slug at the same SHA. Kept distinct from `registry`. */
  contract: {
    schemaVersion: string;
    provenance: { schemaVersion: string; generatorVersion: string; sourceGitSha: string; sourceGitCommitTimestamp: string };
    sourceMode: "compiled-in-memory" | "supplied";
    provenanceMatchesRepoSha: boolean;
    api: { properties: DocumentedApiProperty[]; variants: string[]; sizes: string[] };
    guidance: Record<string, string>;
    distribution?: Record<string, string[]>;
    figma: { verified: boolean; nodeId?: string; sourceUrl?: string };
    tokens: { used: string[] };
  };

  react: {
    /** The registry's own TS/TSX source files. */
    sourceFiles: string[];
    /** Public barrel the exports were read from. */
    publicBarrel: string;
    /** Public symbols re-exported by the barrel from this component's own source files. */
    publicExports: ExportedNames;
    /** Per own source file: what the barrel re-exports from it. */
    publicExportsByFile: Record<string, ExportedNames>;
    /** Per own source file: names the file itself declares as exports (public or not). */
    declaredExportsByFile: Record<string, ExportedNames>;
    /** Declared by an own source file but absent from the barrel — not public API. */
    notInPublicBarrel: ExportedNames;
    /** Direct imports of the own source files. */
    localImports: LocalImportFact[];
    /** Every implementation file reached from the own + declared-internal roots. */
    implementationFiles: ImplementationFile[];
    /** Imports reached anywhere in the graph that could not be resolved. */
    unresolvedImports: { from: string; specifier: string; reason: string }[];
  };

  css: {
    files: CssFileFact[];
    /** Every `var(--…)` actually referenced across the implementation graph, with source files. */
    customPropertiesUsed: CssCustomPropertyUse[];
    /** Custom properties declared inside component CSS (not tokens.css). */
    localDeclarations: CssLocalDeclaration[];
  };

  tokens: {
    /** Registry `tokensUsed` — Figma-named domain, not mechanically mappable to CSS names. */
    figmaNamedDependencies: string[];
    /** Registry `cssTokens` — declared, separate from observed usage. */
    declaredCssTokens: string[];
    /** Resolution of every observed custom property against the repo token source. */
    runtimeDeclarations: TokenResolution[];
    unresolved: string[];
  };

  guard: {
    source: string;
    /** Guard internal rule ids that were evaluated. */
    rulesEvaluated: string[];
    /** Git SHA of the repository the evaluations were computed from. */
    evidenceSourceGitSha: string;
    evaluations: GuardEvaluationFact[];
    summary: { violation: number; pass: number; notApplicable: number; unknown: number };
  };
};

export type CollectRepoFactsErrorCode =
  | "UNKNOWN_SLUG"
  | "REF_NOT_CHECKED_OUT"
  | "CONTRACT_MISMATCH"
  | "STALE_CONTRACT"
  | "GIT_UNAVAILABLE";

export type CollectRepoFactsResult =
  | { ok: true; facts: RepoFacts }
  | { ok: false; error: { code: CollectRepoFactsErrorCode; message: string } };
