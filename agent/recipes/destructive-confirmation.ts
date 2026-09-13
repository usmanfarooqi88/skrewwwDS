import {
  CANONICAL_RECIPE_SCHEMA_VERSION,
} from "@/lib/agent-kit/recipe-schema";
import type { AuthoredRecipe } from "@/lib/agent-kit/recipe-schema";

/**
 * Pilot Recipe: destructive confirmation using Dialog's contractual
 * DialogBody / DialogFooter composition plus Button danger semantics.
 * Dialog is Stable but not currently shadcn-distributed — generated
 * installability must not invent a Dialog install command.
 */
export const destructiveConfirmationRecipe: AuthoredRecipe = {
  schemaVersion: CANONICAL_RECIPE_SCHEMA_VERSION,
  id: "destructive-confirmation",
  title: "Destructive confirmation",
  summary:
    "Confirm a destructive action with Dialog body/footer composition and a danger Button — not Toast or Alert as a modal substitute.",
  goal:
    "Require an explicit, focused confirmation before a destructive action, using Dialog's documented body/footer children and Button's danger variant.",
  status: "beta",
  version: "0.1.0",
  requiredComponents: ["dialog", "button"],
  whenToUse: [
    "The user must confirm a destructive or irreversible action before it runs.",
    "Focus must move into a modal task and restore on close.",
  ],
  whenNotToUse: [
    "Non-blocking status after an action already completed — use Toast or Alert instead.",
    "Inline form validation — use the validated-text-field Recipe.",
    "A full-page interstitial — Dialog is a modal overlay, not a route.",
  ],
  workflow: [
    {
      id: "open-state",
      intent: "Control Dialog open state and dismissal policy.",
      components: ["dialog"],
      guidance:
        "Use Dialog `open` / `onOpenChange` (or `defaultOpen`) from the Dialog contract. Treat closure reasons from `onOpenChange` as part of the product flow — do not invent undocumented Dialog props. Keep `closeOnOverlayClick` intentional for destructive flows (often false when accidental dismiss is costly).",
      apiReferences: [
        { component: "dialog", property: "open" },
        { component: "dialog", property: "onOpenChange" },
        { component: "dialog", property: "closeOnOverlayClick" },
      ],
      conditions: [
        "If Shape/Surface are confirmed in ProjectContext, preserve them for Dialog chrome and Buttons.",
      ],
    },
    {
      id: "body",
      intent: "Place the confirmation copy in DialogBody.",
      components: ["dialog"],
      guidance:
        "Put the explanation of consequences in DialogBody children. Do not invent a Dialog.Header slot or undocumented title prop — compose heading/text as ordinary children inside DialogBody as the contract describes (`DialogBody children`).",
      apiReferences: [{ component: "dialog", property: "DialogBody children" }],
    },
    {
      id: "actions",
      intent: "Put cancel and destructive actions in DialogFooter.",
      components: ["dialog", "button"],
      guidance:
        "Compose actions as DialogFooter children. Use Button `variant` `danger` for the confirming destructive action and a non-danger Button for cancel/dismiss. Do not invent ButtonGroup or Dialog.Footer APIs — only DialogFooter children and Button props that exist on the contracts.",
      apiReferences: [
        { component: "dialog", property: "DialogFooter children" },
        { component: "button", property: "variant", value: "danger" },
        { component: "button", property: "variant", value: "secondary" },
      ],
    },
    {
      id: "focus",
      intent: "Honor Dialog focus entry and restoration when the contracts model them.",
      components: ["dialog"],
      guidance:
        "When the product needs a specific initial or restore target, use `initialFocusRef` / `finalFocusRef` from the Dialog contract. Do not invent focus-trap props beyond what that contract lists; read Dialog `behavior` on the component contract for keyboard/focus narrative.",
      apiReferences: [
        { component: "dialog", property: "initialFocusRef" },
        { component: "dialog", property: "finalFocusRef" },
      ],
    },
  ],
  accessibilityNotes: [
    "Dialog must remain the confirmation surface — do not substitute Toast/Alert for a modal decision.",
    "Keep a clear action hierarchy in the footer: dismiss/cancel vs danger confirm.",
    "Prefer restoring focus to the invoking control via `finalFocusRef` when that control remains in the page.",
    "Do not rely on color alone for the destructive meaning — Button danger variant plus clear action text.",
  ],
  projectContextConsiderations: [
    "Dialog may be implemented but not shadcn-distributed — check generated installability before suggesting an install command.",
    "Reuse already-installed Button/Dialog files when ProjectContext confirms them.",
  ],
};
