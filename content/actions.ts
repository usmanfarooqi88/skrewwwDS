import { ComponentDoc } from "@/lib/types";

export const actionsComponents: ComponentDoc[] = [
  {
    slug: "button",
    name: "Button",
    category: "Actions",
    variants: "Style (Primary/Secondary/Danger) × Size (Small/Medium/Large) × State (Default/Hover/Pressed/Focused/Disabled) — 45 variants",
    purpose: "Primary interactive trigger for user actions — submit, confirm, navigate, initiate a process.",
    whenToUse: "For the main action(s) in a view. Use Primary for the single most important action, Secondary for alternative/less prominent actions, Danger for destructive actions requiring confirmation.",
    whenNotToUse: "For page-to-page navigation (use Link). For toggling a binary state (use Switch). For a single icon-only action (use Icon Button).",
    accessibility: "Renders as a real <button>, not a styled <div>. Keyboard: Tab to focus, Enter/Space to activate. Focus uses semantic/focus-ring (5.31:1 contrast, confirmed on the Accessibility page). Never rely on the Disabled state alone to explain unavailability — pair with visible explanatory text nearby.",
    commonMistakes: "More than one Primary button in the same view (dilutes hierarchy). Not disabling the button during an async action (allows double-submission). Skipping a confirmation step for Danger actions just because the button is red.",
    tokensUsed: ["component/radius/control", "semantic/action/primary", "semantic/action/danger", "semantic/surface/default", "semantic/text/inverse", "semantic/text/primary", "semantic/focus-ring", "opacity/disabled"],
    properties: "Style × Size × State as variants. Label (text). Has Icon (boolean) + Icon (instance-swap). React icons inherit Button's CSS color via SVG currentColor — Primary/Danger follow surface-content (light on Flat/Gradient, dark on Glass); Secondary follows primary text. Button does not recolor or rewrite icon artwork.",
  },
  {
    slug: "icon-button",
    name: "Icon Button",
    category: "Actions",
    variants: "Style × Size × State — 45 variants",
    purpose: "Icon Button is a compact, icon-only trigger for a single action — used when space is limited or the icon's meaning is universally understood (close, more options, edit).",
    whenToUse: "Toolbars, table row actions, card corner actions — anywhere a text label would be redundant given context.",
    whenNotToUse: "When the icon's meaning isn't obvious without a label — pair with visible text (use Button) or add a Tooltip.",
    accessibility: "MUST have an accessible name via aria-label, since there is no visible text. This component includes a hidden \"Accessible Label\" layer specifically to document what that aria-label should say per instance — never ship an instance without setting it to something real. In React, use Button with aria-label and an icon child or leadingIcon — the same currentColor foreground contract as labelled Button, not a separate component.",
    commonMistakes: "Leaving the Accessible Label at its generic placeholder instead of describing the actual action. Using an ambiguous icon with no tooltip as a fallback.",
    tokensUsed: ["component/radius/control", "semantic/action/primary", "semantic/action/danger", "semantic/surface/default"],
    properties: "Style × Size × State as variants. Icon (instance-swap). Accessible Label (text, hidden layer, drives aria-label in code).",
  },
  {
    slug: "link",
    name: "Link",
    category: "Actions",
    variants: "Style × Size × State — 45 variants",
    purpose: "Inline or standalone navigational/action text, styled to read as part of the content rather than a standalone control.",
    whenToUse: "Navigating to another page or view, or a lower-emphasis action embedded in body text or a list.",
    whenNotToUse: "For the primary action in a form or flow — use Button. Links carry less visual weight and shouldn't be the only way to complete an important task.",
    accessibility: "Renders as a real <a>, not a <button> or <span>. Always underlined by default — a fixed baseline, not a toggle — so link-vs-plain-text is never conveyed by color alone. This was a deliberate accessibility decision made after an earlier draft included a non-functional underline toggle property.",
    commonMistakes: "Using Link where Button is semantically correct (e.g. a form submit action) — affects both code semantics and user expectation.",
    tokensUsed: ["semantic/text/secondary", "semantic/action/primary", "semantic/text/danger", "color/brand/700", "semantic/focus-ring"],
    properties: "Style × Size × State as variants. Label (text). Show trailing icon (boolean) + Trailing Icon (instance-swap).",
  },
  {
    slug: "button-group",
    name: "Button Group",
    category: "Actions",
    variants: "Style × Count (2/3/4) — 9 Figma variants; React uses children + divider chrome",
    purpose:
      "Button Group joins related independent Buttons with shared outer border and a 2px divider gap — visual grouping only.",
    whenToUse:
      "When 2–4 related actions should read as one joined unit (for example List/Grid view triggers or compact action clusters).",
    whenNotToUse:
      "For mutually exclusive selection/state — use Tabs or wait for a dedicated Toggle Group. For one primary action plus a related menu — use Split Button (CE-1C). For unrelated actions, keep separate Buttons.",
    accessibility:
      "Renders as role=\"group\" with optional aria-label. Each child remains an independent Button (Tab / Enter / Space). Not role=radiogroup — Beta does not implement selection.",
    commonMistakes:
      "Giving each segment its own outer border (double seams). Putting Button variant/size/loading on the group. Treating the group as a segmented control with selection state.",
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "color/brand/700",
      "color/danger/700",
    ],
    properties:
      "Figma: Style × Count. React: children (Buttons) + divider (neutral|primary|danger) for gap chrome. Count is not a React prop.",
    knownLimitation:
      "Figma prose describes mutually exclusive segments; React Beta ships independent actions (CE-1B). Vertical orientation, equal-width, and wrapping are not verified in Figma.",
  },
  {
    slug: "split-button",
    name: "Split Button",
    category: "Actions",
    variants: "Style × Size — 9 variants",
    purpose:
      "Split Button joins one primary default action with an adjacent menu trigger for closely related alternatives (e.g. \"Save\" + a chevron revealing \"Save as draft\" / \"Save and publish\").",
    whenToUse:
      "When there's one clear default action but a few related variants a user occasionally wants instead.",
    whenNotToUse:
      "When all options are equally likely — use Menu or Select. When actions are peer siblings without a default — use Button Group. Do not use for exclusive selection (Tabs / future Toggle Group).",
    accessibility:
      "Two independently focusable, independently labeled controls (two real buttons) inside role=\"group\". Primary Button has no menu ARIA. MenuTrigger Button owns aria-haspopup / aria-expanded. Natural Tab order; Escape closes via Menu.",
    commonMistakes:
      "Treating this as one button. Putting Button or Menu props on SplitButton. Opening the menu from the primary action. Replacing Menu with a custom dropdown. Confusing with Button Group.",
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "color/brand/700",
      "color/danger/700",
    ],
    properties:
      "Figma: Style × Size + Label (main action only). React: children (primary Button + Menu composition) + divider (neutral|primary|danger). Menu items are Menu’s API, not SplitButton props.",
    knownLimitation:
      "Figma set has no State / Shape / Surface / menu-open axes — those stay on Button and Menu. Chevron segment padding follows Button (may be slightly wider than Figma’s tighter trigger). /r deferred to CE-3.",
  },
];
