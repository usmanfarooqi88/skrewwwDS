import type { AvailabilityStatus, MaturityStatus } from "@/lib/component-registry";

/**
 * Versions the shape of ComponentAgentContract / SystemAgentContract /
 * AgentContractIndex below. Independent of CANONICAL_REGISTRY_SCHEMA_VERSION
 * (lib/component-registry.ts) and PublicRegistryMetadata.schemaVersion
 * (lib/registry-public.ts) — see docs/architecture/agent-kit.md for why
 * these three stay separate.
 */
export const CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION = "1.0.0";

/** Versions contract-compiler.ts's own generation logic, independent of the schema it emits. */
export const AGENT_CONTRACT_GENERATOR_VERSION = "1.0.0";

export type AgentContractApiProp = {
  name: string;
  type: string;
  default?: string;
  description: string;
};

export type AgentContractRelatedLink = {
  label: string;
  href: string;
};

/**
 * `verified: false` means a node ID / URL is not present on the canonical
 * registry entry — the compiler never infers one. Consumers must treat an
 * unverified Figma reference as "not currently checkable," not "assumed
 * matching."
 */
export type AgentContractFigma = {
  verified: boolean;
  nodeId?: string;
  sourceUrl?: string;
};

/**
 * CLI-resolution / distribution fields, mirrored 1:1 from the canonical
 * registry (see ComponentRegistryEntry in lib/component-registry.ts).
 * Omitted entirely when the registry carries none of these fields — see
 * docs/project-status.md for which entries currently have real data
 * (8/47 as of the AK-0 audit).
 */
export type AgentContractDistribution = {
  files?: string[];
  internalDependencies?: string[];
  registryDependencies?: string[];
  dependencies?: string[];
  hostRequirements?: string[];
  coreDependencies?: string[];
  cssTokens?: string[];
};

/**
 * Behavioral metadata is sparse on the canonical registry (AK-0 measured
 * coverage: keyboard 74%, focus 26%, dismissal 13%, motion 4%,
 * announcement 40%). Every field here is optional and omitted rather than
 * fabricated when the registry entry doesn't carry it — see AK-0 §"DO NOT
 * INVENT".
 */
export type AgentContractBehavior = {
  keyboard?: string;
  focus?: string;
  dismissal?: string;
  motion?: string;
  announcement?: string;
};

export type AgentContractProvenance = {
  schemaVersion: string;
  generatorVersion: string;
  sourceGitSha: string;
  /** ISO 8601 commit timestamp of sourceGitSha — deterministic, never wall-clock generation time. */
  sourceGitCommitTimestamp: string;
};

/**
 * One component's compiled Agent Contract — a join of its canonical
 * registry entry (machine facts) and its ComponentDoc (authored guidance),
 * reconciled per the locked R1 rule: `tokens.used` comes from the registry
 * only; content's tokensUsed is editorial-only and never consulted here.
 *
 * Fields NOT present on this type are deliberately not modeled in AK-1:
 * component states, Slots, composition structures, forbidden patterns,
 * responsive contracts — see AK-0 §"DO NOT INVENT" and docs/architecture/agent-kit.md.
 */
export type ComponentAgentContract = {
  schemaVersion: string;
  slug: string;
  name: string;
  category: string;
  status: MaturityStatus;
  version: string;
  summary: string;
  availability: {
    react: AvailabilityStatus;
    figma: AvailabilityStatus;
  };
  accessibilityLevel: string;
  guidance: {
    purpose: string;
    whenToUse: string;
    whenNotToUse: string;
    commonMistakes: string;
    accessibility: string;
    knownLimitation?: string;
  };
  api: {
    properties: AgentContractApiProp[];
    variants: string[];
    sizes: string[];
  };
  tokens: {
    used: string[];
  };
  behavior?: AgentContractBehavior;
  figma: AgentContractFigma;
  distribution?: AgentContractDistribution;
  relatedComponents: AgentContractRelatedLink[];
  openQuestions: string[];
  provenance: AgentContractProvenance;
};

/**
 * The one authored (not compiled) Agent Kit artifact — system-level policy
 * that cannot be derived from any single source. See system-contract.ts.
 * Intentionally does not duplicate any per-component fact.
 */
export type SystemAgentContract = {
  schemaVersion: string;
  principles: string[];
  neverInvent: string[];
  tokenPolicy: string[];
  shapePolicy: string[];
  surfacePolicy: string[];
  accessibilityBaseline: string[];
  namingRules: string[];
  provenance: Pick<AgentContractProvenance, "schemaVersion" | "generatorVersion">;
};

/**
 * The machine-checkable allow-list: exactly which components and API prop
 * names AK-1 confirms exist on the canonical registry. An agent (or a
 * future eval/Guard check) can test "is this component/prop real?" against
 * this file without loading all 47 full contracts.
 */
export type AgentContractIndexEntry = {
  slug: string;
  name: string;
  category: string;
  status: MaturityStatus;
  apiPropertyNames: string[];
};

export type AgentContractIndex = {
  schemaVersion: string;
  totalComponents: number;
  stableCount: number;
  betaCount: number;
  totalApiProps: number;
  components: AgentContractIndexEntry[];
  provenance: AgentContractProvenance;
};
