import { destructiveConfirmationRecipe } from "@/agent/recipes/destructive-confirmation";
import { loadingAndInlineFeedbackRecipe } from "@/agent/recipes/loading-and-inline-feedback";
import { searchNoResultsRecipe } from "@/agent/recipes/search-no-results";
import { validatedTextFieldRecipe } from "@/agent/recipes/validated-text-field";
import {
  CANONICAL_FEATURE_KIT_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredFeatureKit, AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";

/** Canonical AK-4 pilot Recipes — authored source, never generated JSON. */
export const authoredRecipes: readonly AuthoredRecipe[] = [
  validatedTextFieldRecipe,
  destructiveConfirmationRecipe,
  loadingAndInlineFeedbackRecipe,
  searchNoResultsRecipe,
];

/**
 * One thin Feature Kit for AK-4: Recipe IDs only. No duplicated Recipe bodies.
 * Groups the all-Stable-composition pilots that share form/feedback intent;
 * search-no-results stays discoverable via the Recipe index alone because it
 * intentionally pulls a Beta Empty State.
 */
export const formsAndFeedbackFeatureKit: AuthoredFeatureKit = {
  schemaVersion: CANONICAL_FEATURE_KIT_SCHEMA_VERSION,
  id: "forms-and-feedback",
  title: "Forms and feedback",
  summary:
    "Validated fields, destructive confirmation, and loading/inline status Recipes for common product flows.",
  status: "beta",
  version: "0.1.0",
  recipeIds: [
    "validated-text-field",
    "destructive-confirmation",
    "loading-and-inline-feedback",
  ],
};

export const authoredFeatureKits: readonly AuthoredFeatureKit[] = [formsAndFeedbackFeatureKit];
