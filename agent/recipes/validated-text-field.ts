import {
  CANONICAL_RECIPE_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";

/**
 * Pilot Recipe: validated single-line field using the Form Field composition
 * that Text Input and Validation Message already document as related.
 * All three constituents are Stable and currently shadcn-distributed.
 */
export const validatedTextFieldRecipe: AuthoredRecipe = {
  schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
  id: "validated-text-field",
  title: "Validated text field",
  summary:
    "Compose Form Field, Text Input, and Validation Message for a labeled field with inline error feedback.",
  goal:
    "Produce one accessible, labeled text field that surfaces validation errors through Validation Message — without inventing a parallel label/error API.",
  status: "beta",
  version: "0.1.0",
  requiredComponents: ["form-field", "text-input", "validation-message"],
  whenToUse: [
    "A single-line text value needs a visible label, optional supporting text, and typed inline validation.",
    "The product already uses Form Field as the shared label/helper shell for other controls.",
  ],
  whenNotToUse: [
    "Multi-line entry — use Textarea with Form Field instead of this Recipe.",
    "Search-specific chrome (clear affordance, search semantics) — use Search Field.",
    "A standalone Validation Message outside a field — that is not this Recipe.",
  ],
  workflow: [
    {
      id: "shell",
      intent: "Establish the Form Field shell with a stable control id.",
      components: ["form-field"],
      guidance:
        "Render Form Field as the outer shell. Pass a stable `controlId` that the nested Text Input will use as its id so the label association stays real. Use Form Field `label`, `required`, and `supportingText` from the Form Field contract — do not invent a second label element beside the input.",
      apiReferences: [
        { component: "form-field", property: "label" },
        { component: "form-field", property: "controlId" },
        { component: "form-field", property: "required" },
        { component: "form-field", property: "supportingText" },
      ],
      conditions: [
        "If ProjectContext confirms Shape/Surface modes, keep them — do not switch modes for this field alone.",
        "If Form Field / Text Input / Validation Message are already installed (confirmed via registered file paths), reuse those files; do not reinstall.",
      ],
    },
    {
      id: "control",
      intent: "Place Text Input as the Form Field child control.",
      components: ["form-field", "text-input"],
      guidance:
        "Pass Text Input as Form Field `children`. Align Text Input `error` / `required` with the field's validation state using only props those contracts declare. Prefer Text Input's own `label` only when Form Field is not wrapping it — in this Recipe, Form Field owns the visible label.",
      apiReferences: [
        { component: "form-field", property: "children" },
        { component: "form-field", property: "error" },
        { component: "text-input", property: "error" },
        { component: "text-input", property: "required" },
      ],
    },
    {
      id: "feedback",
      intent: "Attach typed Validation Message when the field is invalid.",
      components: ["form-field", "validation-message"],
      guidance:
        "When invalid, set Form Field `error` and render Validation Message with `type` matching the error path. Wire `id` / `announce` per the Validation Message contract so assistive tech gets one coherent announcement — do not invent an error-summary region for a single field.",
      apiReferences: [
        { component: "validation-message", property: "type", value: "error" },
        { component: "validation-message", property: "announce" },
        { component: "validation-message", property: "id" },
        { component: "form-field", property: "error" },
      ],
    },
  ],
  accessibilityNotes: [
    "Keep a single visible label via Form Field — do not duplicate an unlabeled Text Input label beside it.",
    "Associate the control id with the label through Form Field `controlId` so focus and naming stay native.",
    "Prefer one Validation Message announcement for this field; avoid stacking duplicate live regions for the same error.",
    "Do not convey validity by color alone — Validation Message text (and type) must carry the meaning.",
  ],
  projectContextConsiderations: [
    "Preserve confirmed Shape/Surface modes from ProjectContext.",
    "Only suggest `npx shadcn add @skrewww/...` when ProjectContext shows `@skrewww` configured and the Recipe's installability metadata marks that slug installable.",
  ],
};
