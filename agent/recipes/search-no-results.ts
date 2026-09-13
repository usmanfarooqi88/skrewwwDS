import {
  CANONICAL_RECIPE_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";

/**
 * Pilot Recipe that deliberately includes a Beta constituent (Empty State)
 * so maturity derivation is exercised honestly. Neither Search Field nor
 * Empty State is currently shadcn-distributed.
 */
export const searchNoResultsRecipe: AuthoredRecipe = {
  schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
  id: "search-no-results",
  title: "Search with no-results empty state",
  summary:
    "Pair Search Field with Empty State when a query returns no matches — surfacing Empty State's Beta maturity in the generated Recipe.",
  goal:
    "Guide agents to keep search chrome on Search Field and reserve Empty State for the no-results outcome, without inventing a combined SearchResults component.",
  status: "beta",
  version: "0.1.0",
  requiredComponents: ["search-field", "empty-state"],
  whenToUse: [
    "A searchable collection can return zero matches and needs an intentional empty canvas.",
    "The product already treats Empty State `no-results` as the empty outcome (Beta — do not call it Stable).",
  ],
  whenNotToUse: [
    "Inline field validation errors — use validated-text-field.",
    "Initial first-run empty product with no query yet — prefer Empty State `first-use` guidance on its own contract, not this Recipe.",
    "Sortable/paged tables — Data Table composition is a separate, higher-risk Recipe and is not this pilot.",
  ],
  workflow: [
    {
      id: "search-chrome",
      intent: "Provide search input chrome via Search Field.",
      components: ["search-field"],
      guidance:
        "Use Search Field `label`, `showClear`, `onValueChange`, and `error` from its contract. Do not invent filter-chip or facet APIs on Search Field.",
      apiReferences: [
        { component: "search-field", property: "label" },
        { component: "search-field", property: "showClear" },
        { component: "search-field", property: "onValueChange" },
        { component: "search-field", property: "error" },
      ],
    },
    {
      id: "empty-outcome",
      intent: "When the query has no matches, render Empty State.",
      components: ["empty-state"],
      guidance:
        "For a no-match outcome after a query, use Empty State with variant semantics from its contract (`no-results`). Pass `title` / `description` / actions only through documented Empty State props. Do not invent a Search Field empty slot.",
      apiReferences: [
        { component: "empty-state", property: "title" },
        { component: "empty-state", property: "description" },
        { component: "empty-state", property: "primaryAction" },
        { component: "empty-state", property: "secondaryAction" },
      ],
      conditions: [
        "Treat Empty State as Beta in any user-facing claim — generated componentMaturity will be containsBeta.",
        "Neither component currently claims shadcn installability — do not invent install commands.",
      ],
    },
  ],
  accessibilityNotes: [
    "Search Field must keep an accessible name via its `label`.",
    "Empty State actions must be real actionable controls with names — do not present decorative-only CTAs.",
    "Announce the empty outcome once; do not also invent a duplicate live region on Search Field for the same no-results state.",
  ],
  projectContextConsiderations: [
    "Do not suggest `@skrewww` install commands unless generated installability is true for that slug.",
    "If Empty State's Beta status is unacceptable for the product, stop and ask — do not silently substitute a custom empty div.",
  ],
};
