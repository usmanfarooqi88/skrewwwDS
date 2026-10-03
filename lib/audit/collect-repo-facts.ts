import { execFileSync } from "node:child_process";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import type { ComponentAgentContract } from "@/lib/agent-kit/contract-schema";
import {
  evaluateInternalGuard,
  filterGuardEvaluationsForSlug,
  GUARD_SOURCE,
  internalGuardRuleIds,
  summarizeGuard,
} from "@/lib/audit/repo-guard";
import {
  readCssCustomPropertyDeclarations,
  readCssVarReferences,
  resolveToken,
} from "@/lib/audit/repo-css";
import {
  createFsSourceReader,
  PUBLIC_BARREL,
  readDeclaredExports,
  readPublicBarrel,
  walkImplementationGraph,
  type SourceReader,
} from "@/lib/audit/repo-source";
import {
  REPO_FACTS_SCHEMA_VERSION,
  type ApiNameKind,
  type CollectRepoFactsResult,
  type CssCustomPropertyUse,
  type CssLocalDeclaration,
  type DocumentedApiProperty,
  type ExportedNames,
  type RepoFacts,
  type RepoFactsProvenance,
  type RuntimeDeclaration,
} from "@/lib/audit/repo-facts-types";
import { componentRegistry, type ApiProp, type ComponentRegistryEntry } from "@/lib/component-registry";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * AG-1C — repo facts collector.
 *
 *   slug → registry entry → compiled Agent contract → React sources and public
 *   exports → own + internal + reachable CSS → token declarations and parity
 *   labels → Guard internal evaluations filtered to the slug → RepoFacts
 *
 * Pure with respect to the repository: it reads files and runs `git` read-only
 * commands, never writes, never checks out a ref, never reads Figma, never
 * compares with Figma and never calls a model. v1 observes the CURRENT checkout
 * only (see `REF_NOT_CHECKED_OUT`); historical-ref collection is deferred.
 */

export const TOKENS_CSS = "styles/tokens.css";

export type GitInfo = { sha: string; commitTimestamp: string; workingTreeDirty: boolean };

export type CollectRepoFactsOptions = {
  repoRoot: string;
  slug: string;
  /** Must equal the current checkout's HEAD when supplied. */
  gitSha?: string;
  /** Test seam: replaces the `git` read-only commands. */
  git?: GitInfo;
  /** Test seam / stale-contract check: use this contract instead of compiling one. */
  contract?: ComponentAgentContract;
  /** Test seam: Guard evaluations to filter instead of running Guard. */
  guardEvaluations?: readonly RuleEvaluation[];
  /** Test seam: replaces the filesystem source reader (repo-relative paths). */
  read?: SourceReader;
  /** Test seam: replaces the canonical registry. */
  registry?: readonly ComponentRegistryEntry[];
};

function runGit(repoRoot: string, args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

export function readGitInfo(repoRoot: string): GitInfo {
  const sha = runGit(repoRoot, ["rev-parse", "HEAD"]);
  const commitTimestamp = runGit(repoRoot, ["log", "-1", "--format=%cI", "HEAD"]);
  const workingTreeDirty = runGit(repoRoot, ["status", "--porcelain", "--untracked-files=no"]).length > 0;
  return { sha, commitTimestamp, workingTreeDirty };
}

export function classifyApiName(name: string): ApiNameKind {
  if (/[\s.()]/.test(name)) return "free-form";
  if (/^[A-Za-z_$][\w$-]*$/.test(name)) return "identifier";
  return "unknown-structure";
}

function documentedProperty(prop: ApiProp): DocumentedApiProperty {
  const documented: DocumentedApiProperty = {
    name: prop.name,
    nameKind: classifyApiName(prop.name),
    type: prop.type,
    description: prop.description,
  };
  if (prop.default !== undefined) documented.default = prop.default;
  return documented;
}

const sorted = (values: readonly string[] | undefined): string[] => Array.from(new Set(values ?? [])).sort();

function mergeExports(into: ExportedNames, from: ExportedNames): void {
  into.values = sorted([...into.values, ...from.values]);
  into.types = sorted([...into.types, ...from.types]);
}

function isTsPath(path: string): boolean {
  return path.endsWith(".ts") || path.endsWith(".tsx");
}

/** Recursively sorts object keys so equal facts serialize to identical bytes. */
export function serializeRepoFacts(facts: RepoFacts): string {
  const normalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, entry]) => entry !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, normalize(entry)]),
      );
    }
    return value;
  };
  return `${JSON.stringify(normalize(facts), null, 2)}\n`;
}

export function collectRepoFacts(options: CollectRepoFactsOptions): CollectRepoFactsResult {
  const { repoRoot, slug } = options;
  const registry = options.registry ?? componentRegistry;
  const read = options.read ?? createFsSourceReader(repoRoot);

  // 1. Slug identity — canonical slug only; never fuzzy-matched.
  const entry = registry.find((candidate) => candidate.slug === slug);
  if (!entry) {
    return { ok: false, error: { code: "UNKNOWN_SLUG", message: `"${slug}" is not a canonical component slug in lib/component-registry.ts` } };
  }

  // 2. Provenance — current checkout only.
  let git: GitInfo;
  try {
    git = options.git ?? readGitInfo(repoRoot);
  } catch (error) {
    return { ok: false, error: { code: "GIT_UNAVAILABLE", message: `could not read git state: ${error instanceof Error ? error.message : String(error)}` } };
  }
  if (options.gitSha && options.gitSha !== git.sha) {
    return {
      ok: false,
      error: {
        code: "REF_NOT_CHECKED_OUT",
        message: `requested ref ${options.gitSha} is not the current checkout (${git.sha}); v1 reads the current checkout only and never checks out another ref`,
      },
    };
  }
  const provenance: RepoFactsProvenance = {
    gitSha: git.sha,
    gitCommitTimestamp: git.commitTimestamp,
    workingTreeDirty: git.workingTreeDirty,
    refMode: "current-checkout",
  };

  // 3. Contract — compiled in memory from canonical sources at this SHA, or a supplied one that must match.
  const sourceMode = options.contract ? "supplied" : "compiled-in-memory";
  const contract =
    options.contract ??
    compileAllContracts({ sourceGitSha: git.sha, sourceGitCommitTimestamp: git.commitTimestamp }).contracts.find(
      (candidate) => candidate.slug === slug,
    );
  if (!contract || contract.slug !== slug) {
    return { ok: false, error: { code: "CONTRACT_MISMATCH", message: `no Agent contract for "${slug}" (got "${contract?.slug ?? "none"}")` } };
  }
  if (contract.provenance.sourceGitSha !== git.sha) {
    return {
      ok: false,
      error: {
        code: "STALE_CONTRACT",
        message: `contract for "${slug}" was compiled at ${contract.provenance.sourceGitSha}, not the observed ${git.sha}; a stale contract is not current evidence`,
      },
    };
  }

  // 4. React sources, public exports and the local import graph.
  const files = sorted(entry.files);
  const internalDependencies = sorted(entry.internalDependencies);
  const sourceFiles = files.filter(isTsPath);
  const graph = walkImplementationGraph({ files, internalDependencies, read });

  const barrel = readPublicBarrel(read);
  const publicExports: ExportedNames = { values: [], types: [] };
  const publicExportsByFile: Record<string, ExportedNames> = {};
  const declaredExportsByFile: Record<string, ExportedNames> = {};
  const notInPublicBarrel: ExportedNames = { values: [], types: [] };
  for (const file of sourceFiles) {
    const source = read(file);
    const declared = source === undefined ? { values: [], types: [] } : readDeclaredExports(file, source);
    declaredExportsByFile[file] = declared;
    const exported = barrel.get(file);
    if (exported) {
      publicExportsByFile[file] = exported;
      mergeExports(publicExports, exported);
    }
    const publicValues = new Set(exported?.values ?? []);
    const publicTypes = new Set(exported?.types ?? []);
    mergeExports(notInPublicBarrel, {
      values: declared.values.filter((name) => !publicValues.has(name)),
      types: declared.types.filter((name) => !publicTypes.has(name)),
    });
  }

  // 5. CSS evidence across the implementation graph.
  const cssUse = new Map<string, Map<string, "own" | "internal" | "reachable">>();
  const localDeclarations: CssLocalDeclaration[] = [];
  const localDeclarationMap = new Map<string, RuntimeDeclaration[]>();
  for (const css of graph.cssFiles) {
    const source = read(css.path);
    if (source === undefined) continue;
    for (const name of readCssVarReferences(source)) {
      const byFile = cssUse.get(name) ?? new Map<string, "own" | "internal" | "reachable">();
      byFile.set(css.path, css.origin);
      cssUse.set(name, byFile);
    }
    for (const declaration of readCssCustomPropertyDeclarations(source)) {
      localDeclarations.push({ name: declaration.name, file: css.path, line: declaration.line, value: declaration.value });
      const { name, ...rest } = declaration;
      const list = localDeclarationMap.get(name) ?? [];
      list.push({ file: css.path, ...rest });
      localDeclarationMap.set(name, list);
    }
  }
  const customPropertiesUsed: CssCustomPropertyUse[] = Array.from(cssUse.entries())
    .map(([name, byFile]) => ({
      name,
      usedIn: Array.from(byFile.entries())
        .map(([file, origin]) => ({ file, origin }))
        .sort((a, b) => a.file.localeCompare(b.file)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // 6. Token declarations for every observed custom property.
  const tokensSource = read(TOKENS_CSS);
  const tokenDeclarationMap = new Map<string, RuntimeDeclaration[]>();
  if (tokensSource !== undefined) {
    for (const declaration of readCssCustomPropertyDeclarations(tokensSource)) {
      const { name, ...rest } = declaration;
      const list = tokenDeclarationMap.get(name) ?? [];
      list.push({ file: TOKENS_CSS, ...rest });
      tokenDeclarationMap.set(name, list);
    }
  }
  const runtimeDeclarations = customPropertiesUsed.map((use) => resolveToken(use.name, tokenDeclarationMap, localDeclarationMap));

  // 7. Guard — keep every evaluation state, filtered to this slug.
  const evaluations = options.guardEvaluations ?? evaluateInternalGuard(repoRoot, git.sha, git.commitTimestamp);
  const guardFacts = filterGuardEvaluationsForSlug(evaluations, slug);

  const documentedApiProperties = entry.apiProps.map(documentedProperty);
  const figmaIdentity = entry.figmaIdentity;

  const facts: RepoFacts = {
    schemaVersion: REPO_FACTS_SCHEMA_VERSION,
    component: { slug: entry.slug, name: entry.name, category: entry.category, status: entry.status, version: entry.version },
    provenance,
    registry: {
      reactAvailability: entry.reactAvailability,
      figmaAvailability: entry.figmaAvailability,
      documentationCompleteness: entry.documentationCompleteness,
      tokensUsed: sorted(entry.tokensUsed),
      cssTokens: sorted(entry.cssTokens),
      files,
      internalDependencies,
      registryDependencies: sorted(entry.registryDependencies),
      hostRequirements: sorted(entry.hostRequirements),
      documentedApiProperties,
      supportedVariants: sorted(entry.supportedVariants),
      supportedSizes: sorted(entry.supportedSizes),
      openQuestions: [...entry.openQuestions],
      ...(entry.figmaReference ? { figmaReference: entry.figmaReference } : {}),
      ...(figmaIdentity
        ? {
            figmaIdentity: {
              fileKey: figmaIdentity.fileKey,
              nodeId: figmaIdentity.nodeId,
              nodeType: figmaIdentity.nodeType,
              role: figmaIdentity.role,
              verifiedAt: figmaIdentity.verifiedAt,
            },
          }
        : {}),
    },
    contract: {
      schemaVersion: contract.schemaVersion,
      provenance: { ...contract.provenance },
      sourceMode,
      provenanceMatchesRepoSha: contract.provenance.sourceGitSha === git.sha,
      api: {
        properties: contract.api.properties.map((prop) => documentedProperty(prop as ApiProp)),
        variants: [...contract.api.variants],
        sizes: [...contract.api.sizes],
      },
      guidance: { ...contract.guidance } as Record<string, string>,
      ...(contract.distribution ? { distribution: Object.fromEntries(Object.entries(contract.distribution).map(([key, value]) => [key, [...(value as string[])]])) } : {}),
      figma: {
        verified: contract.figma.verified,
        ...(contract.figma.nodeId ? { nodeId: contract.figma.nodeId } : {}),
        ...(contract.figma.sourceUrl ? { sourceUrl: contract.figma.sourceUrl } : {}),
      },
      tokens: { used: sorted(contract.tokens.used) },
    },
    react: {
      sourceFiles,
      publicBarrel: PUBLIC_BARREL,
      publicExports,
      publicExportsByFile,
      declaredExportsByFile,
      notInPublicBarrel,
      localImports: graph.directImports,
      implementationFiles: graph.implementationFiles,
      unresolvedImports: graph.unresolved,
    },
    css: {
      files: graph.cssFiles,
      customPropertiesUsed,
      localDeclarations: localDeclarations.sort(
        (a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file) || a.line - b.line,
      ),
    },
    tokens: {
      figmaNamedDependencies: sorted(entry.tokensUsed),
      declaredCssTokens: sorted(entry.cssTokens),
      runtimeDeclarations,
      unresolved: runtimeDeclarations.filter((token) => token.resolution === "unresolved").map((token) => token.name),
    },
    guard: {
      source: options.guardEvaluations ? "supplied evaluations" : GUARD_SOURCE,
      rulesEvaluated: internalGuardRuleIds(),
      evidenceSourceGitSha: git.sha,
      evaluations: guardFacts,
      summary: summarizeGuard(guardFacts),
    },
  };
  return { ok: true, facts };
}
