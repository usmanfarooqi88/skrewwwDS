import {
  CANONICAL_RECIPE_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";

/**
 * Pilot Recipe: a validated single-line field. Text Input is a COMPLETE field —
 * it composes Form Field internally and owns the label, supporting text,
 * required indicator and error (docs/architecture/form-field.md). The Recipe
 * therefore uses Text Input alone; Form Field and Validation Message are
 * optional components for other cases, never wrappers or siblings of it.
 */
export const validatedTextFieldRecipe: AuthoredRecipe = {
  schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
  id: "validated-text-field",
  title: "Validated text field",
  summary:
    "Use Text Input as a complete field — label, supporting text, required state and inline error through its own props.",
  goal:
    "Produce one accessible, labeled text field that surfaces validation errors, without wrapping Text Input in Form Field, adding a second label, or adding a separate Validation Message for the same error.",
  status: "beta",
  version: "0.2.0",
  requiredComponents: ["text-input"],
  optionalComponents: ["form-field", "validation-message"],
  whenToUse: [
    "A single-line text value needs a visible label, optional supporting text, and typed inline validation.",
    "Ordinary single-control product code: Text Input already composes Form Field, so no extra field shell is needed.",
  ],
  whenNotToUse: [
    "Wrapping Text Input in Form Field — it already renders the label, supporting text and error, and the wrapper would duplicate the label.",
    "A separate Validation Message beside Text Input for the same error — Text Input already renders it. Success, warning and info messages have no supported association with the input (passing your own aria-describedby replaces the wiring Text Input provides), so do not place them beside it as if they were linked.",
    "Multi-line entry — use Textarea with Form Field instead of this Recipe.",
    "Search-specific chrome (clear affordance, search semantics) — use Search Field.",
    "Custom or grouped controls with no complete field component — use Form Field directly with its render-prop children.",
  ],
  workflow: [
    {
      id: "field",
      intent: "Render Text Input as the complete field.",
      components: ["text-input"],
      guidance:
        "Render one Text Input and pass `label` (required), and as needed `supportingText` and `required`. Do not wrap it in Form Field, do not render a separate label element, and do not pass `aria-describedby` or `aria-invalid` yourself — Text Input wires them.",
      apiReferences: [
        { component: "text-input", property: "label" },
        { component: "text-input", property: "supportingText" },
        { component: "text-input", property: "required" },
      ],
      conditions: [
        "If ProjectContext confirms Shape/Surface modes, keep them — do not switch modes for this field alone.",
        "If Text Input is already installed (confirmed via registered file paths), reuse those files; do not reinstall.",
      ],
    },
    {
      id: "error",
      intent: "Drive the inline error through Text Input's `error` prop.",
      components: ["text-input"],
      guidance:
        "Set `error` to the message when the value is invalid and clear it when valid. Text Input renders that message through Validation Message and links it to the input with aria-invalid and aria-describedby. Do not render a second Validation Message for the same error.",
      apiReferences: [{ component: "text-input", property: "error" }],
    },
    {
      id: "standalone-message",
      intent: "Use a standalone Validation Message only where no field renders it.",
      components: ["validation-message", "form-field"],
      guidance:
        "A standalone Validation Message belongs beside a custom control wired through Form Field, or in a form-level message. Keep the default announce=\"off\" for a message already on screen at first render; use announce=\"assertive\" only for an error introduced after the page is shown, such as after a failed submit. Never render assertive on first paint.",
      apiReferences: [
        { component: "validation-message", property: "announce" },
        { component: "validation-message", property: "type", value: "error" },
        { component: "form-field", property: "children" },
      ],
    },
  ],
  accessibilityNotes: [
    "Exactly one visible label per field: Text Input supplies it through `label`. Do not add a second label or wrap Text Input in Form Field.",
    "Text Input and Form Field render the error with announce=\"off\"; it reaches assistive technology through aria-invalid and aria-describedby on the control, not a live region.",
    "A standalone Validation Message uses announce=\"off\" when present on first render and announce=\"assertive\" only for an error introduced afterwards — never assertive on first paint.",
    "Do not convey validity by color alone — the message text (and type) must carry the meaning.",
  ],
  projectContextConsiderations: [
    "Preserve confirmed Shape/Surface modes from ProjectContext.",
    "Only suggest `npx shadcn add @skrewww/...` when ProjectContext shows `@skrewww` configured and the Recipe's installability metadata marks that slug installable.",
  ],
};
