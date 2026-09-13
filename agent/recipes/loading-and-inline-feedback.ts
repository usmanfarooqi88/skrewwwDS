import {
  CANONICAL_RECIPE_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";

/**
 * Pilot Recipe: loading placeholder + spinner + inline Alert for async
 * status without inventing Empty State (Beta) or Data Table composition.
 * Skeleton and Alert are Stable but not shadcn-distributed; Spinner is.
 */
export const loadingAndInlineFeedbackRecipe: AuthoredRecipe = {
  schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
  id: "loading-and-inline-feedback",
  title: "Loading and inline feedback",
  summary:
    "Show Skeleton while content loads, Spinner for in-progress work, and Alert for durable inline status — without inventing a page template.",
  goal:
    "Give agents a Stable, contract-backed pattern for pending and completed async UI states using Skeleton, Spinner, and Alert.",
  status: "beta",
  version: "0.1.0",
  requiredComponents: ["skeleton", "spinner", "alert"],
  whenToUse: [
    "A region is waiting on data and needs a non-interactive placeholder.",
    "An action is in progress and needs a labeled or decorative Spinner.",
    "A durable inline status (success/warning/error/info) should stay on the page.",
  ],
  whenNotToUse: [
    "Transient post-action confirmation that should not persist in layout — prefer Toast.",
    "A first-use or no-results empty canvas — that is a different Recipe (and may involve Beta Empty State).",
    "Modal confirmation of a destructive action — use destructive-confirmation.",
  ],
  workflow: [
    {
      id: "loading-placeholder",
      intent: "Reserve space with Skeleton while data is unknown.",
      components: ["skeleton"],
      guidance:
        "Use Skeleton `shape` / `width` / `height` from the Skeleton contract to approximate the eventual content geometry. Do not invent shimmer props or layout slots Skeleton does not declare.",
      apiReferences: [
        { component: "skeleton", property: "shape", value: "rectangle" },
        { component: "skeleton", property: "width" },
        { component: "skeleton", property: "height" },
      ],
    },
    {
      id: "in-progress",
      intent: "Indicate in-progress work with Spinner.",
      components: ["spinner"],
      guidance:
        "For standalone progress, prefer Spinner with a real `label` when the status is meaningful to users; use `decorative` only when a nearby text already names the busy state. Size via Spinner `size` values from the contract.",
      apiReferences: [
        { component: "spinner", property: "label" },
        { component: "spinner", property: "decorative" },
        { component: "spinner", property: "size" },
      ],
      conditions: [
        "If Spinner is already installed (it is currently shadcn-distributed), reuse it; otherwise install only when `@skrewww` is configured and installability is true.",
      ],
    },
    {
      id: "inline-status",
      intent: "Surface durable status with Alert.",
      components: ["alert"],
      guidance:
        "When the outcome should remain visible in the page, render Alert with a contractual `type` and `title`. Use `announce` / `dismissible` / `onDismiss` only as the Alert contract defines them — do not invent toast-like auto-dismiss on Alert.",
      apiReferences: [
        { component: "alert", property: "type", value: "error" },
        { component: "alert", property: "type", value: "success" },
        { component: "alert", property: "title" },
        { component: "alert", property: "announce" },
        { component: "alert", property: "dismissible" },
        { component: "alert", property: "onDismiss" },
      ],
    },
  ],
  accessibilityNotes: [
    "Prefer one meaningful busy/status announcement at a time — do not stack Spinner live text with a duplicate Alert for the same pending state.",
    "Skeleton is presentational; ensure the eventual content replaces it with real semantics rather than leaving placeholders indefinitely.",
    "Alert type + title must carry meaning; color alone is insufficient.",
  ],
  projectContextConsiderations: [
    "Treat installability per component from generated Recipe metadata — Spinner may be installable while Skeleton/Alert are not.",
    "Preserve confirmed Shape/Surface modes.",
  ],
};
