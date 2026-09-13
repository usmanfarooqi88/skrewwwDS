import type { ComponentAgentContract } from "@/lib/agent-kit/contract-schema";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import {
  CANONICAL_FEATURE_KIT_SCHEMA_VERSION,
  CANONICAL_RECIPE_SCHEMA_VERSION,
  FEATURE_KIT_GENERATOR_VERSION,
  RECIPE_GENERATOR_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type {
  AuthoredFeatureKit,
  AuthoredRecipe,
  FeatureKitIndex,
  GeneratedFeatureKit,
  GeneratedRecipe,
  RecipeApiReference,
  RecipeComponentMaturitySummary,
  RecipeIndex,
  RecipeResolvedComponent,
} from "@/lib/agent-kit/recipe-schema";

/**
 * Deterministic Recipe / Feature Kit compiler. Pure: contracts and authored
 * sources are passed in — no filesystem I/O. Component facts always come
 * from the current ComponentAgentContract map; Recipes never redefine them.
 */

export class RecipeCompilerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecipeCompilerError";
  }
}

export type RecipeCompilerOptions = {
  sourceGitSha: string;
  sourceGitCommitTimestamp: string;
};

export type CompileRecipesResult = {
  recipes: GeneratedRecipe[];
  index: RecipeIndex;
};

export type CompileFeatureKitsResult = {
  featureKits: GeneratedFeatureKit[];
  index: FeatureKitIndex;
};

function assertUniqueStrings(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new RecipeCompilerError(`${label} contains duplicate "${value}"`);
    }
    seen.add(value);
  }
}

function assertSlugList(
  slugs: string[],
  contractsBySlug: Map<string, ComponentAgentContract>,
  label: string,
): void {
  for (const slug of slugs) {
    if (!contractsBySlug.has(slug)) {
      throw new RecipeCompilerError(`${label} references unknown component slug "${slug}"`);
    }
  }
}

function validateApiReference(
  recipeId: string,
  ref: RecipeApiReference,
  contractsBySlug: Map<string, ComponentAgentContract>,
): void {
  const contract = contractsBySlug.get(ref.component);
  if (!contract) {
    throw new RecipeCompilerError(
      `Recipe "${recipeId}" apiReference cites unknown component "${ref.component}"`,
    );
  }
  const propertyNames = contract.api.properties.map((p) => p.name);
  if (!propertyNames.includes(ref.property)) {
    throw new RecipeCompilerError(
      `Recipe "${recipeId}" cites property "${ref.property}" on "${ref.component}", ` +
        `but that property is not in the current component contract`,
    );
  }
  if (ref.value !== undefined) {
    const allowed = new Set([...contract.api.variants, ...contract.api.sizes]);
    if (!allowed.has(ref.value)) {
      throw new RecipeCompilerError(
        `Recipe "${recipeId}" cites value "${ref.value}" for "${ref.component}.${ref.property}", ` +
          `but it is not in that contract's api.variants or api.sizes`,
      );
    }
  }
}

function deriveComponentMaturity(
  slugs: string[],
  contractsBySlug: Map<string, ComponentAgentContract>,
): RecipeComponentMaturitySummary {
  for (const slug of slugs) {
    const status = contractsBySlug.get(slug)!.status;
    if (status !== "stable") return "containsBeta";
  }
  return "allStable";
}

function resolveComponents(
  recipe: AuthoredRecipe,
  contractsBySlug: Map<string, ComponentAgentContract>,
): RecipeResolvedComponent[] {
  const required = recipe.requiredComponents.map((slug) => {
    const contract = contractsBySlug.get(slug)!;
    const installable = isDistributedViaSkrewwwRegistry(slug);
    const resolved: RecipeResolvedComponent = {
      slug,
      role: "required",
      status: contract.status,
      installableViaSkrewwwRegistry: installable,
    };
    if (installable) {
      resolved.installCommand = `npx shadcn add @skrewww/${slug}`;
    }
    return resolved;
  });
  const optional = (recipe.optionalComponents ?? []).map((slug) => {
    const contract = contractsBySlug.get(slug)!;
    const installable = isDistributedViaSkrewwwRegistry(slug);
    const resolved: RecipeResolvedComponent = {
      slug,
      role: "optional",
      status: contract.status,
      installableViaSkrewwwRegistry: installable,
    };
    if (installable) {
      resolved.installCommand = `npx shadcn add @skrewww/${slug}`;
    }
    return resolved;
  });
  return [...required, ...optional];
}

function validateWorkflow(
  recipe: AuthoredRecipe,
  knownSlugs: Set<string>,
  contractsBySlug: Map<string, ComponentAgentContract>,
): void {
  if (recipe.workflow.length === 0) {
    throw new RecipeCompilerError(`Recipe "${recipe.id}" must declare at least one workflow step`);
  }
  const stepIds = recipe.workflow.map((step) => step.id);
  assertUniqueStrings(stepIds, `Recipe "${recipe.id}" workflow step ids`);

  for (const step of recipe.workflow) {
    for (const slug of step.components ?? []) {
      if (!knownSlugs.has(slug)) {
        throw new RecipeCompilerError(
          `Recipe "${recipe.id}" step "${step.id}" references component "${slug}" ` +
            `that is not in requiredComponents or optionalComponents`,
        );
      }
    }
    for (const ref of step.apiReferences ?? []) {
      if (!knownSlugs.has(ref.component)) {
        throw new RecipeCompilerError(
          `Recipe "${recipe.id}" step "${step.id}" apiReference component "${ref.component}" ` +
            `is not listed on the Recipe`,
        );
      }
      validateApiReference(recipe.id, ref, contractsBySlug);
    }
  }
}

/**
 * Compile one authored Recipe against the current component-contract map.
 */
export function compileRecipe(
  recipe: AuthoredRecipe,
  contractsBySlug: Map<string, ComponentAgentContract>,
  options: RecipeCompilerOptions,
): GeneratedRecipe {
  if (recipe.schemaVersion !== CANONICAL_RECIPE_SCHEMA_VERSION) {
    throw new RecipeCompilerError(
      `Recipe "${recipe.id}" schemaVersion "${recipe.schemaVersion}" ` +
        `does not match ${CANONICAL_RECIPE_SCHEMA_VERSION}`,
    );
  }
  if (!recipe.id || !/^[a-z][a-z0-9-]*$/.test(recipe.id)) {
    throw new RecipeCompilerError(`Recipe id "${recipe.id}" must be a kebab-case slug`);
  }
  if (recipe.requiredComponents.length === 0) {
    throw new RecipeCompilerError(`Recipe "${recipe.id}" must list at least one requiredComponents entry`);
  }

  assertUniqueStrings(recipe.requiredComponents, `Recipe "${recipe.id}" requiredComponents`);
  const optional = recipe.optionalComponents ?? [];
  assertUniqueStrings(optional, `Recipe "${recipe.id}" optionalComponents`);

  const overlap = recipe.requiredComponents.filter((slug) => optional.includes(slug));
  if (overlap.length > 0) {
    throw new RecipeCompilerError(
      `Recipe "${recipe.id}" lists "${overlap.join(", ")}" in both required and optional`,
    );
  }

  assertSlugList(recipe.requiredComponents, contractsBySlug, `Recipe "${recipe.id}" requiredComponents`);
  assertSlugList(optional, contractsBySlug, `Recipe "${recipe.id}" optionalComponents`);

  const knownSlugs = new Set([...recipe.requiredComponents, ...optional]);
  validateWorkflow(recipe, knownSlugs, contractsBySlug);

  const allSlugs = Array.from(knownSlugs);
  const componentMaturity = deriveComponentMaturity(allSlugs, contractsBySlug);
  const components = resolveComponents(recipe, contractsBySlug);

  return {
    ...recipe,
    optionalComponents: optional,
    componentMaturity,
    components,
    provenance: {
      schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
      generatorVersion: RECIPE_GENERATOR_VERSION,
      sourceGitSha: options.sourceGitSha,
      sourceGitCommitTimestamp: options.sourceGitCommitTimestamp,
    },
  };
}

export function compileAllRecipes(
  authored: readonly AuthoredRecipe[],
  contracts: readonly ComponentAgentContract[],
  options: RecipeCompilerOptions,
): CompileRecipesResult {
  assertUniqueStrings(
    authored.map((r) => r.id),
    "Authored Recipe ids",
  );

  const contractsBySlug = new Map(contracts.map((c) => [c.slug, c]));
  // Stable sort by id so generation is independent of authored array order.
  const sorted = [...authored].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const recipes = sorted.map((recipe) => compileRecipe(recipe, contractsBySlug, options));

  const index: RecipeIndex = {
    schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
    totalRecipes: recipes.length,
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      summary: recipe.summary,
      status: recipe.status,
      version: recipe.version,
      requiredComponents: recipe.requiredComponents,
      optionalComponents: recipe.optionalComponents ?? [],
      componentMaturity: recipe.componentMaturity,
    })),
    provenance: {
      schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
      generatorVersion: RECIPE_GENERATOR_VERSION,
      sourceGitSha: options.sourceGitSha,
      sourceGitCommitTimestamp: options.sourceGitCommitTimestamp,
    },
  };

  return { recipes, index };
}

export function compileFeatureKit(
  kit: AuthoredFeatureKit,
  recipeIds: ReadonlySet<string>,
  options: RecipeCompilerOptions,
): GeneratedFeatureKit {
  if (kit.schemaVersion !== CANONICAL_FEATURE_KIT_SCHEMA_VERSION) {
    throw new RecipeCompilerError(
      `Feature Kit "${kit.id}" schemaVersion "${kit.schemaVersion}" ` +
        `does not match ${CANONICAL_FEATURE_KIT_SCHEMA_VERSION}`,
    );
  }
  if (!kit.id || !/^[a-z][a-z0-9-]*$/.test(kit.id)) {
    throw new RecipeCompilerError(`Feature Kit id "${kit.id}" must be a kebab-case slug`);
  }
  if (kit.recipeIds.length === 0) {
    throw new RecipeCompilerError(`Feature Kit "${kit.id}" must list at least one recipeIds entry`);
  }
  assertUniqueStrings(kit.recipeIds, `Feature Kit "${kit.id}" recipeIds`);
  for (const recipeId of kit.recipeIds) {
    if (!recipeIds.has(recipeId)) {
      throw new RecipeCompilerError(
        `Feature Kit "${kit.id}" references unknown Recipe id "${recipeId}"`,
      );
    }
  }

  return {
    ...kit,
    provenance: {
      schemaVersion: CANONICAL_FEATURE_KIT_SCHEMA_VERSION,
      generatorVersion: FEATURE_KIT_GENERATOR_VERSION,
      sourceGitSha: options.sourceGitSha,
      sourceGitCommitTimestamp: options.sourceGitCommitTimestamp,
    },
  };
}

export function compileAllFeatureKits(
  authored: readonly AuthoredFeatureKit[],
  recipeIds: readonly string[],
  options: RecipeCompilerOptions,
): CompileFeatureKitsResult {
  assertUniqueStrings(
    authored.map((k) => k.id),
    "Authored Feature Kit ids",
  );
  const recipeIdSet = new Set(recipeIds);
  const sorted = [...authored].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const featureKits = sorted.map((kit) => compileFeatureKit(kit, recipeIdSet, options));

  const index: FeatureKitIndex = {
    schemaVersion: CANONICAL_FEATURE_KIT_SCHEMA_VERSION,
    totalFeatureKits: featureKits.length,
    featureKits: featureKits.map((kit) => ({
      id: kit.id,
      title: kit.title,
      summary: kit.summary,
      status: kit.status,
      version: kit.version,
      recipeIds: kit.recipeIds,
    })),
    provenance: {
      schemaVersion: CANONICAL_FEATURE_KIT_SCHEMA_VERSION,
      generatorVersion: FEATURE_KIT_GENERATOR_VERSION,
      sourceGitSha: options.sourceGitSha,
      sourceGitCommitTimestamp: options.sourceGitCommitTimestamp,
    },
  };

  return { featureKits, index };
}
