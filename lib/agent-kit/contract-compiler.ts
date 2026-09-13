import { componentRegistry } from "@/lib/component-registry";
import type { ComponentRegistryEntry } from "@/lib/component-registry";
import { allComponents } from "@/lib/data";
import type { ComponentDoc } from "@/lib/types";
import {
  AGENT_CONTRACT_GENERATOR_VERSION,
  CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,
} from "@/lib/agent-kit/contract-schema";
import type {
  AgentContractDistribution,
  AgentContractFigma,
  AgentContractIndex,
  AgentContractIndexEntry,
  AgentContractProvenance,
  ComponentAgentContract,
} from "@/lib/agent-kit/contract-schema";

/**
 * Deterministic, zero-LLM compiler: joins the canonical component registry
 * with its authored ComponentDoc counterpart by slug, validates the R1
 * token-subset invariant defensively, and emits one Agent Contract per
 * component plus a summary index. No network access, no wall-clock
 * timestamps, no randomness — the same (registry, content, options) input
 * always produces byte-identical output. See docs/architecture/agent-kit.md.
 */

export class ContractCompilerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractCompilerError";
  }
}

export type ContractCompilerOptions = {
  /** Full 40-char commit SHA the sources were compiled from. Never wall-clock time. */
  sourceGitSha: string;
  /** ISO 8601 commit timestamp of sourceGitSha — deterministic per SHA, never generation time. */
  sourceGitCommitTimestamp: string;
};

export type CompileAllResult = {
  contracts: ComponentAgentContract[];
  index: AgentContractIndex;
};

function buildProvenance(options: ContractCompilerOptions): AgentContractProvenance {
  return {
    schemaVersion: CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,
    generatorVersion: AGENT_CONTRACT_GENERATOR_VERSION,
    sourceGitSha: options.sourceGitSha,
    sourceGitCommitTimestamp: options.sourceGitCommitTimestamp,
  };
}

function buildBehavior(entry: ComponentRegistryEntry): ComponentAgentContract["behavior"] {
  const behavior: NonNullable<ComponentAgentContract["behavior"]> = {};
  if (entry.keyboardBehavior) behavior.keyboard = entry.keyboardBehavior;
  if (entry.focusBehavior) behavior.focus = entry.focusBehavior;
  if (entry.dismissalBehavior) behavior.dismissal = entry.dismissalBehavior;
  if (entry.motionBehavior) behavior.motion = entry.motionBehavior;
  if (entry.announcementBehavior) behavior.announcement = entry.announcementBehavior;
  return Object.keys(behavior).length > 0 ? behavior : undefined;
}

function buildDistribution(entry: ComponentRegistryEntry): AgentContractDistribution | undefined {
  const distribution: AgentContractDistribution = {};
  if (entry.files?.length) distribution.files = entry.files;
  if (entry.internalDependencies?.length) distribution.internalDependencies = entry.internalDependencies;
  if (entry.registryDependencies?.length) distribution.registryDependencies = entry.registryDependencies;
  if (entry.dependencies?.length) distribution.dependencies = entry.dependencies;
  if (entry.hostRequirements?.length) distribution.hostRequirements = entry.hostRequirements;
  if (entry.coreDependencies?.length) distribution.coreDependencies = entry.coreDependencies;
  if (entry.cssTokens?.length) distribution.cssTokens = entry.cssTokens;
  return Object.keys(distribution).length > 0 ? distribution : undefined;
}

function buildFigma(entry: ComponentRegistryEntry): AgentContractFigma {
  // `verified` reflects presence of a real Figma node ID on the canonical
  // registry entry only — never inferred, never assumed true by default.
  const figma: AgentContractFigma = { verified: Boolean(entry.figmaNodeId) };
  if (entry.figmaNodeId) figma.nodeId = entry.figmaNodeId;
  if (entry.figmaSourceUrl) figma.sourceUrl = entry.figmaSourceUrl;
  return figma;
}

/**
 * Compiles one component's Agent Contract from its registry entry + doc.
 *
 * Enforces the locked R1 rule defensively at compile time (not just at
 * audit time): `doc.tokensUsed` must be a subset of `entry.tokensUsed`.
 * `tokens.used` on the emitted contract is always `entry.tokensUsed` — the
 * registry array — never merged, unioned, or overridden by the doc's
 * editorial list. A violation throws rather than silently emitting a
 * contract with contradictory or fabricated token guidance.
 */
export function compileComponentContract(
  entry: ComponentRegistryEntry,
  doc: ComponentDoc,
  options: ContractCompilerOptions,
): ComponentAgentContract {
  if (entry.slug !== doc.slug) {
    throw new ContractCompilerError(
      `slug mismatch: registry entry "${entry.slug}" was passed doc "${doc.slug}"`,
    );
  }

  const registryTokenSet = new Set(entry.tokensUsed);
  const tokenViolations = doc.tokensUsed.filter((token) => !registryTokenSet.has(token));
  if (tokenViolations.length > 0) {
    throw new ContractCompilerError(
      `${entry.slug}: content.tokensUsed is not a subset of registry.tokensUsed -> ${tokenViolations.join(", ")}`,
    );
  }

  const behavior = buildBehavior(entry);
  const distribution = buildDistribution(entry);

  const contract: ComponentAgentContract = {
    schemaVersion: CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,
    slug: entry.slug,
    name: entry.name,
    category: entry.category,
    status: entry.status,
    version: entry.version,
    summary: entry.summary,
    availability: {
      react: entry.reactAvailability,
      figma: entry.figmaAvailability,
    },
    accessibilityLevel: entry.accessibilityLevel,
    guidance: {
      purpose: doc.purpose,
      whenToUse: doc.whenToUse,
      whenNotToUse: doc.whenNotToUse,
      commonMistakes: doc.commonMistakes,
      accessibility: doc.accessibility,
      ...(doc.knownLimitation ? { knownLimitation: doc.knownLimitation } : {}),
    },
    api: {
      properties: entry.apiProps,
      variants: entry.supportedVariants,
      sizes: entry.supportedSizes,
    },
    tokens: {
      used: entry.tokensUsed,
    },
    ...(behavior ? { behavior } : {}),
    figma: buildFigma(entry),
    ...(distribution ? { distribution } : {}),
    relatedComponents: entry.relatedComponents,
    openQuestions: entry.openQuestions,
    provenance: buildProvenance(options),
  };

  return contract;
}

function buildIndex(
  contracts: ComponentAgentContract[],
  options: ContractCompilerOptions,
): AgentContractIndex {
  const components: AgentContractIndexEntry[] = contracts.map((contract) => ({
    slug: contract.slug,
    name: contract.name,
    category: contract.category,
    status: contract.status,
    apiPropertyNames: contract.api.properties.map((prop) => prop.name),
  }));

  return {
    schemaVersion: CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,
    totalComponents: contracts.length,
    stableCount: contracts.filter((contract) => contract.status === "stable").length,
    betaCount: contracts.filter((contract) => contract.status === "beta").length,
    totalApiProps: contracts.reduce((sum, contract) => sum + contract.api.properties.length, 0),
    components,
    provenance: buildProvenance(options),
  };
}

/**
 * Compiles every registry component into a contract and builds the summary
 * index. Iterates `componentRegistry` in its own declared (stable, literal
 * array) order — never re-sorted by a non-deterministic key — so output
 * order never varies between runs at the same source SHA.
 *
 * Fails loudly (throws) rather than silently on:
 * - a registry entry with no matching ComponentDoc (join failure)
 * - any R1 token-subset violation (see compileComponentContract)
 *
 * Uses the module-level `componentRegistry` / `allComponents` imports
 * directly (source of truth), rather than accepting them as parameters, so
 * this function cannot silently compile against stale or substituted data.
 */
export function compileAllContracts(options: ContractCompilerOptions): CompileAllResult {
  const contracts: ComponentAgentContract[] = [];
  const joinErrors: string[] = [];

  for (const entry of componentRegistry) {
    const doc = allComponents.find((candidate) => candidate.slug === entry.slug);
    if (!doc) {
      joinErrors.push(`${entry.slug}: no matching ComponentDoc in content/*.ts`);
      continue;
    }
    contracts.push(compileComponentContract(entry, doc, options));
  }

  if (joinErrors.length > 0) {
    throw new ContractCompilerError(`Contract compilation join failures:\n${joinErrors.join("\n")}`);
  }

  return { contracts, index: buildIndex(contracts, options) };
}
