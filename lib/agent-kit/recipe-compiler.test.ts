import { describe, expect, it } from "vitest";
import { authoredFeatureKits, authoredRecipes } from "@/agent/recipes";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import {
  compileAllFeatureKits,
  compileAllRecipes,
  compileRecipe,
  RecipeCompilerError,
} from "@/lib/agent-kit/recipe-compiler";
import {
  CANONICAL_RECIPE_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";

const PROVENANCE = {
  sourceGitSha: "0".repeat(40),
  sourceGitCommitTimestamp: "2026-01-01T00:00:00Z",
};

function contractsBySlugMap() {
  const { contracts } = compileAllContracts(PROVENANCE);
  return {
    contracts,
    bySlug: new Map(contracts.map((c) => [c.slug, c])),
  };
}

describe("Recipe authoring — pilot set integrity", () => {
  it("keeps Recipe ids unique and kebab-case", () => {
    const ids = authoredRecipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("does not embed full component catalogs in authored Recipe source", () => {
    for (const recipe of authoredRecipes) {
      expect(recipe).not.toHaveProperty("api");
      expect(recipe).not.toHaveProperty("tokens");
      expect(JSON.stringify(recipe)).not.toMatch(/"properties"\s*:\s*\[/);
    }
  });
});

describe("Recipe compiler — validation", () => {
  it("compiles the pilot set against current component contracts", () => {
    const { contracts } = contractsBySlugMap();
    const { recipes, index } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    expect(recipes.length).toBe(authoredRecipes.length);
    expect(index.totalRecipes).toBe(authoredRecipes.length);
    expect(index.recipes.map((r) => r.id)).toEqual(
      [...authoredRecipes.map((r) => r.id)].sort(),
    );
  });

  it("rejects an unknown required component slug", () => {
    const { bySlug, contracts } = contractsBySlugMap();
    const bad: AuthoredRecipe = {
      ...authoredRecipes[0],
      id: "bad-unknown-slug",
      requiredComponents: ["not-a-real-component"],
      workflow: [
        {
          id: "step",
          intent: "x",
          guidance: "y",
          components: ["not-a-real-component"],
        },
      ],
    };
    expect(() => compileRecipe(bad, bySlug, PROVENANCE)).toThrow(RecipeCompilerError);
    expect(() => compileAllRecipes([bad], contracts, PROVENANCE)).toThrow(/unknown component slug/);
  });

  it("rejects duplicate required component refs", () => {
    const { bySlug } = contractsBySlugMap();
    const bad: AuthoredRecipe = {
      ...authoredRecipes[0],
      id: "bad-dup-required",
      requiredComponents: ["form-field", "form-field"],
    };
    expect(() => compileRecipe(bad, bySlug, PROVENANCE)).toThrow(/duplicate "form-field"/);
  });

  it("rejects a required/optional conflict", () => {
    const { bySlug } = contractsBySlugMap();
    const bad: AuthoredRecipe = {
      ...authoredRecipes[0],
      id: "bad-overlap",
      requiredComponents: ["form-field", "text-input"],
      optionalComponents: ["text-input"],
    };
    expect(() => compileRecipe(bad, bySlug, PROVENANCE)).toThrow(/both required and optional/);
  });

  it("rejects an invalid explicit API property reference", () => {
    const { bySlug } = contractsBySlugMap();
    const bad: AuthoredRecipe = {
      ...authoredRecipes[0],
      id: "bad-api-prop",
      workflow: [
        {
          id: "step",
          intent: "x",
          guidance: "y",
          components: ["button"],
          apiReferences: [{ component: "button", property: "inventedProp" }],
        },
      ],
      requiredComponents: ["button"],
    };
    expect(() => compileRecipe(bad, bySlug, PROVENANCE)).toThrow(/inventedProp/);
  });

  it("rejects an invalid enumerated API value", () => {
    const { bySlug } = contractsBySlugMap();
    const bad: AuthoredRecipe = {
      ...authoredRecipes[0],
      id: "bad-api-value",
      requiredComponents: ["button"],
      workflow: [
        {
          id: "step",
          intent: "x",
          guidance: "y",
          components: ["button"],
          apiReferences: [{ component: "button", property: "variant", value: "neon" }],
        },
      ],
    };
    expect(() => compileRecipe(bad, bySlug, PROVENANCE)).toThrow(/neon/);
  });
});

describe("Recipe compiler — maturity and installability", () => {
  it("derives allStable when every constituent is Stable", () => {
    const { contracts } = contractsBySlugMap();
    const { recipes } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    const validated = recipes.find((r) => r.id === "validated-text-field")!;
    expect(validated.componentMaturity).toBe("allStable");
    expect(validated.components.every((c) => c.status === "stable")).toBe(true);
  });

  it("derives containsBeta when any constituent is Beta", () => {
    const { contracts } = contractsBySlugMap();
    const { recipes } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    const search = recipes.find((r) => r.id === "search-no-results")!;
    expect(search.componentMaturity).toBe("containsBeta");
    expect(search.components.some((c) => c.status === "beta")).toBe(true);
  });

  it("derives installability from the registry — never invents install commands", () => {
    const { contracts } = compileAllContracts(PROVENANCE);
    const { recipes } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    for (const recipe of recipes) {
      for (const component of recipe.components) {
        const expected = isDistributedViaSkrewwwRegistry(component.slug);
        expect(component.installableViaSkrewwwRegistry).toBe(expected);
        if (expected) {
          expect(component.installCommand).toBe(`npx shadcn add @skrewww/${component.slug}`);
        } else {
          expect(component.installCommand).toBeUndefined();
          expect(JSON.stringify(component)).not.toMatch(/npx shadcn add/);
        }
      }
    }

    // dialog became @skrewww-distributed in CE-3J — this spot-check now
    // exercises the "correctly derived true" side rather than "false" (no
    // authored recipe currently references a still-undistributed
    // component, so there is no valid "false" example to hardcode here;
    // the loop above already covers every recipe/component pair
    // dynamically against the live registry regardless).
    const confirmation = recipes.find((r) => r.id === "destructive-confirmation")!;
    const dialog = confirmation.components.find((c) => c.slug === "dialog")!;
    expect(dialog.installableViaSkrewwwRegistry).toBe(true);
    expect(dialog.installCommand).toBe("npx shadcn add @skrewww/dialog");
  });
});

describe("Recipe compiler — determinism and public safety", () => {
  it("produces byte-identical output for the same inputs", () => {
    const { contracts } = contractsBySlugMap();
    const a = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    const b = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("sorts generated Recipes by id regardless of authored order", () => {
    const { contracts } = contractsBySlugMap();
    const reversed = [...authoredRecipes].reverse();
    const { recipes } = compileAllRecipes(reversed, contracts, PROVENANCE);
    const ids = recipes.map((r) => r.id);
    expect(ids).toEqual([...ids].sort());
  });

  it("emits no absolute local paths, env secrets, or hostnames in generated Recipes", () => {
    const { contracts } = contractsBySlugMap();
    const { recipes, index } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    const blob = JSON.stringify({ recipes, index });
    expect(blob).not.toMatch(/\/Users\//);
    expect(blob).not.toMatch(/\/home\/[a-z]/);
    expect(blob).not.toMatch(/\bprocess\.env\b/);
    expect(blob).not.toMatch(/localhost:\d+/);
    expect(blob).not.toMatch(/\bapi[_-]?key\b/i);
  });

  it("uses the Recipe schema version, not wall-clock provenance fields beyond git inputs", () => {
    const { contracts } = contractsBySlugMap();
    const { recipes } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);
    for (const recipe of recipes) {
      expect(recipe.schemaVersion).toBe(CANONICAL_RECIPE_SCHEMA_VERSION);
      expect(recipe.provenance.sourceGitSha).toBe(PROVENANCE.sourceGitSha);
      expect(recipe.provenance.sourceGitCommitTimestamp).toBe(PROVENANCE.sourceGitCommitTimestamp);
      expect(JSON.stringify(recipe.provenance)).not.toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    }
  });
});

describe("Feature Kit compiler", () => {
  it("compiles the pilot Feature Kit against Recipe ids only", () => {
    const recipeIds = authoredRecipes.map((r) => r.id);
    const { featureKits, index } = compileAllFeatureKits(authoredFeatureKits, recipeIds, PROVENANCE);
    expect(featureKits).toHaveLength(1);
    expect(index.totalFeatureKits).toBe(1);
    expect(featureKits[0].recipeIds).toEqual(authoredFeatureKits[0].recipeIds);
    expect(JSON.stringify(featureKits[0])).not.toContain("workflow");
  });

  it("rejects unknown and duplicate Recipe ids", () => {
    const recipeIds = authoredRecipes.map((r) => r.id);
    expect(() =>
      compileAllFeatureKits(
        [
          {
            ...authoredFeatureKits[0],
            id: "bad-kit-unknown",
            recipeIds: ["does-not-exist"],
          },
        ],
        recipeIds,
        PROVENANCE,
      ),
    ).toThrow(/unknown Recipe id/);

    expect(() =>
      compileAllFeatureKits(
        [
          {
            ...authoredFeatureKits[0],
            id: "bad-kit-dup",
            recipeIds: ["validated-text-field", "validated-text-field"],
          },
        ],
        recipeIds,
        PROVENANCE,
      ),
    ).toThrow(/duplicate/);
  });
});

describe("Recipe consumption smoke — plumbing only", () => {
  it("resolves a higher-level intent to Recipe → contracts → installability → context fields", () => {
    const { contracts } = contractsBySlugMap();
    const { index, recipes } = compileAllRecipes(authoredRecipes, contracts, PROVENANCE);

    // Higher-level intent stand-in: validated field flow.
    const match = index.recipes.find((entry) => entry.id === "validated-text-field");
    expect(match).toBeDefined();

    const recipe = recipes.find((r) => r.id === match!.id)!;
    expect(recipe.requiredComponents).toEqual(["form-field", "text-input", "validation-message"]);

    for (const slug of recipe.requiredComponents) {
      const contract = contracts.find((c) => c.slug === slug);
      expect(contract).toBeDefined();
      expect(contract!.slug).toBe(slug);
    }

    for (const component of recipe.components) {
      expect(component.installableViaSkrewwwRegistry).toBe(isDistributedViaSkrewwwRegistry(component.slug));
    }

    // ProjectContext is not re-detected here — AK-3 owns detection. Prove the
    // Recipe only *considers* confirmed-or-unknown guidance, never embeds a
    // second detector.
    expect(recipe.projectContextConsiderations?.length).toBeGreaterThan(0);
    expect(JSON.stringify(recipe)).not.toMatch(/detectProjectContext/);
  });
});
