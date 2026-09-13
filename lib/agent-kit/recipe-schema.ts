import type { MaturityStatus } from "@/lib/component-registry";
import type { AgentContractProvenance } from "@/lib/agent-kit/contract-schema";

/**
 * Versions the Recipe / Feature Kit shapes below. Independent of
 * CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION — Recipes are a separate
 * projection layer above component contracts, not an extension of them.
 */
export const CANONICAL_RECIPE_SCHEMA_VERSION = "1.0.0";

/** Versions recipe-compiler.ts generation logic, independent of the schema. */
export const RECIPE_GENERATOR_VERSION = "1.0.0";

export const CANONICAL_FEATURE_KIT_SCHEMA_VERSION = "1.0.0";
export const FEATURE_KIT_GENERATOR_VERSION = "1.0.0";

/** Pilot Recipes stay Beta until AK-5 evals and governance say otherwise. */
export type RecipeStatus = "experimental" | "beta";

/**
 * A prop (and optional enumerated value) a Recipe claims is real.
 * Validated at compile time against the current ComponentAgentContract —
 * never invented in authored prose without this check.
 */
export type RecipeApiReference = {
  /** Canonical component slug. */
  component: string;
  /** Must match a name in that contract's `api.properties`. */
  property: string;
  /**
   * When set, must appear in that contract's `api.variants` or `api.sizes`.
   * Use for enumerated visual values (e.g. Button `variant` → `danger`).
   * Omit for free-form props (strings, booleans, callbacks).
   */
  value?: string;
};

export type RecipeWorkflowStep = {
  id: string;
  intent: string;
  /** Subset of this Recipe's required/optional component slugs used in the step. */
  components?: string[];
  guidance: string;
  /**
   * Conditional notes that depend on confirmed ProjectContext (Shape/Surface/
   * already-installed components / registry config). Never invent a default
   * when context is unknown — see AK-3 ProjectContext rules.
   */
  conditions?: string[];
  apiReferences?: RecipeApiReference[];
};

/**
 * Canonical authored Recipe — component facts stay as slug references only.
 * Do not embed full component objects or duplicate contract fields here.
 */
export type AuthoredRecipe = {
  schemaVersion: string;
  id: string;
  title: string;
  summary: string;
  goal: string;
  status: RecipeStatus;
  version: string;
  requiredComponents: string[];
  optionalComponents?: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  workflow: RecipeWorkflowStep[];
  /** Composition-level a11y only — not a paste of each component's contract. */
  accessibilityNotes: string[];
  projectContextConsiderations?: string[];
};

export type RecipeComponentMaturitySummary = "allStable" | "containsBeta";

export type RecipeResolvedComponent = {
  slug: string;
  role: "required" | "optional";
  status: MaturityStatus;
  /** Derived via `isDistributedViaSkrewwwRegistry` — never authored. */
  installableViaSkrewwwRegistry: boolean;
  /**
   * Present only when installable. Never invented for implemented-but-
   * undistributed components.
   */
  installCommand?: string;
};

/**
 * Generated Recipe contract: authored fields plus derived maturity,
 * installability, and provenance. Public under `/agent/recipes/`.
 */
export type GeneratedRecipe = AuthoredRecipe & {
  componentMaturity: RecipeComponentMaturitySummary;
  components: RecipeResolvedComponent[];
  provenance: AgentContractProvenance;
};

export type RecipeIndexEntry = {
  id: string;
  title: string;
  summary: string;
  status: RecipeStatus;
  version: string;
  requiredComponents: string[];
  optionalComponents: string[];
  componentMaturity: RecipeComponentMaturitySummary;
};

export type RecipeIndex = {
  schemaVersion: string;
  totalRecipes: number;
  recipes: RecipeIndexEntry[];
  provenance: AgentContractProvenance;
};

export type AuthoredFeatureKit = {
  schemaVersion: string;
  id: string;
  title: string;
  summary: string;
  status: RecipeStatus;
  version: string;
  /** Recipe IDs only — never embed Recipe bodies. */
  recipeIds: string[];
};

export type GeneratedFeatureKit = AuthoredFeatureKit & {
  provenance: AgentContractProvenance;
};

export type FeatureKitIndexEntry = {
  id: string;
  title: string;
  summary: string;
  status: RecipeStatus;
  version: string;
  recipeIds: string[];
};

export type FeatureKitIndex = {
  schemaVersion: string;
  totalFeatureKits: number;
  featureKits: FeatureKitIndexEntry[];
  provenance: AgentContractProvenance;
};
