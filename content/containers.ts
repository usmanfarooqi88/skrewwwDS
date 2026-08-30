import { ComponentDoc } from "@/lib/types";

export const containersComponents: ComponentDoc[] = [
  {
    slug: "card",
    name: "Card",
    category: "Containers & Overlays",
    variants: "Elevation (Flat/Raised) — 2 variants",
    purpose: "A general-purpose content container grouping related information with a clear visual boundary (header, body, footer).",
    whenToUse: "Grouping a discrete unit of related content and actions.",
    whenNotToUse: "A full-page-blocking decision — use Dialog.",
    accessibility: "If the whole Card is clickable, it needs a single clear interactive element, not the entire card silently clickable.",
    commonMistakes: "Overusing Card for every piece of content on a page, creating visual noise.",
    tokensUsed: ["semantic/surface/default", "semantic/border/default", "component/radius/container", "shadow-blur/3", "shadow-color/3"],
    properties: "Elevation as variants. Title (optional string). Body is children ReactNode. Footer is optional ReactNode for composed actions. React composition is ahead of Figma Card 2044:25756 (Title/Body TEXT + hardcoded Footer Buttons).",
  },
  {
    slug: "accordion",
    name: "Accordion",
    category: "Containers & Overlays",
    variants:
      "Expansion mode (Single/Multiple) — implementation; Figma confirms Accordion Item collapsed/expanded states only",
    purpose:
      "Stacked collapsible sections for progressive disclosure — FAQ lists, settings groups, and optional detail panels.",
    whenToUse:
      "Secondary information that benefits from being hidden by default and revealed on demand.",
    whenNotToUse:
      "Primary documentation, critical instructions, or content users must see immediately without an extra click.",
    accessibility:
      "Each header is a native button with aria-expanded and aria-controls. Panels use stable IDs and hidden when collapsed. Arrow-key roving is not implemented — Tab moves through triggers normally.",
    commonMistakes:
      "Hiding essential SEO documentation inside client-rendered collapsed panels, or making the entire row a single interactive target instead of a real button trigger.",
    tokensUsed: [
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/icon/muted",
      "component/radius/container",
    ],
    properties:
      "Composed Accordion API built from Figma Accordion Item building blocks. Title and content per item. Chevron rotation and panel visibility match expanded state. AccordionPanel children is optional ReactNode — Figma’s Content slot placeholder is design-tool affordance only and is not rendered in React.",
  },
  {
    slug: "accordion-item",
    name: "Accordion Item",
    category: "Containers & Overlays",
    variants: "State (Collapsed/Expanded) — 2 variants",
    purpose: "A single collapsible/expandable section, typically one of several stacked together (FAQ lists, progressive disclosure).",
    whenToUse: "Content that benefits from being hidden by default and revealed on demand.",
    whenNotToUse: "Content the user needs to see immediately without an extra click.",
    accessibility: "Header must be a real button with aria-expanded; content region needs aria-labelledby.",
    commonMistakes: "Making the entire row clickable but only visually indicating the chevron as interactive.",
    tokensUsed: ["semantic/border/default", "semantic/text/primary", "semantic/icon/muted"],
    properties: "State as variants — chevron rotation and content visibility both verified to genuinely match state. Title (text), Content (slot). React maps Content to optional AccordionPanel children; Figma’s instructional slot placeholder is not product UI.",
  },
  {
    slug: "dialog",
    name: "Dialog",
    category: "Containers & Overlays",
    variants: "Single component",
    purpose: "A modal window that interrupts the current flow, requiring the user's attention or a decision before returning to the page.",
    whenToUse: "Destructive action confirmation, a focused task, collecting required information before proceeding.",
    whenNotToUse: "Non-critical supplementary information — use Popover.",
    accessibility: "Must trap focus while open, return focus to trigger on close, support Escape-to-close, role=\"dialog\" with aria-modal=\"true\".",
    commonMistakes: "Not trapping focus, allowing Tab to escape to obscured page content behind the scrim.",
    tokensUsed: ["semantic/surface/default", "component/radius/container", "shadow-blur/5", "shadow-color/5"],
    properties:
      "Compound React API: DialogHeader/Title/Description/Close stay structured; DialogBody and DialogFooter accept arbitrary ReactNode. No canonical Figma Dialog COMPONENT_SET — React composition is the source of truth. Portal content unmounts when closed.",
  },
  {
    slug: "drawer",
    name: "Drawer",
    category: "Containers & Overlays",
    variants: "Single component",
    purpose: "A panel sliding in from a screen edge, similar to Dialog but anchored, for supplementary content, settings, or forms.",
    whenToUse: "Settings panels, filters, secondary forms.",
    whenNotToUse: "A decision needing the user's full, undivided attention — use Dialog.",
    accessibility: "Same focus-trapping and Escape-to-close requirements as Dialog.",
    commonMistakes: "Forgetting the same accessibility rigor as Dialog just because it feels visually less \"modal.\"",
    tokensUsed: ["semantic/surface/default", "component/radius/container", "shadow-blur/5", "shadow-color/5"],
    properties:
      "Compound React API matching Dialog: DrawerHeader/Title/Description/Close stay structured; DrawerBody and DrawerFooter accept arbitrary ReactNode. No canonical Figma Drawer COMPONENT_SET — React composition is the source of truth. Left viewport edge flush; exposed right corners rounded (topRightRadius=0 on the viewport-attached corner).",
  },
  {
    slug: "popover",
    name: "Popover",
    category: "Containers & Overlays",
    variants: "Single component",
    purpose: "A small floating panel showing richer content than a Tooltip, attached to a trigger element, non-blocking.",
    whenToUse: "Supplementary content or a small set of related options not needing Dialog's attention-commanding weight.",
    whenNotToUse: "A single short label/hint — use Tooltip. A decision requiring full attention — use Dialog.",
    accessibility: "Dismissible via Escape and outside click; does NOT need to trap focus, since it's non-blocking by design.",
    commonMistakes: "Confusing this with Tooltip and using it for a single short label.",
    tokensUsed: ["semantic/surface/default", "semantic/border/default", "shadow-blur/4", "shadow-color/4"],
    properties: "Title (text), Body (text). Single Bottom-pointing arrow variant.",
  },
];
