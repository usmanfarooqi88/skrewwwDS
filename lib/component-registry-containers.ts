import type { ComponentRegistryEntry } from "@/lib/component-registry";
import { getComponentDocumentationUrl } from "@/lib/site-config";

const sharedConcepts = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape",
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface",
  },
};

const REACT_DATE = "2026-07-11";
const DOCS_DATE = "2026-06-01";

export const containersRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "accordion",
    name: "Accordion",
    category: "Containers & Overlays",
    summary:
      "Accordion is a set of stacked collapsible sections for progressive disclosure, built from Accordion Item building blocks.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference:
      "Containers / Accordion Item — collapsed/expanded states; public API composes Accordion Item",
    documentationUrl: getComponentDocumentationUrl("accordion"),
    supportedVariants: ["single", "multiple"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/card/border",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "component/radius/container",
      "semantic/focus-ring",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Accordion.tsx", "components/ui/accordion.module.css"],
    cssTokens: [
      "--accordion-motion-duration",
      "--accordion-motion-easing",
      "--accordion-panel-padding",
      "--accordion-panel-text",
      "--accordion-radius",
      "--accordion-trigger-gap",
      "--accordion-trigger-height",
      "--accordion-trigger-padding",
      "--component-card-border",
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--component-surface-gradient-overlay",
      "--semantic-focus-ring",
      "--semantic-text-primary",
    ],
    relatedComponents: [
      { label: "Tabs — mutually exclusive views with tablist semantics", href: "/components/tabs" },
      { label: "Card — static grouped content", href: "/components/card" },
      { label: "Dialog — modal attention pattern", href: "/components/dialog" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma documents Accordion Item only — single vs multiple expansion is an implementation convention, not a separate Figma variant.",
      "Disabled accordion items, leading icons, and size variants are not confirmed in Figma.",
      "Arrow-key roving accordion pattern is intentionally not implemented.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Accordion composes Accordion Item building blocks: Accordion + AccordionItem + AccordionTrigger + AccordionPanel.",
    keyboardBehavior:
      "Enter or Space toggles the focused trigger through native button activation. Tab moves through triggers normally. Arrow keys, Home, and End are not implemented.",
    focusBehavior: "Focus remains on the trigger after toggling expansion.",
    motionBehavior:
      "Chevron rotation respects prefers-reduced-motion. Panels use hidden attribute — no height animation that blocks screen-reader access.",
    comparisons: [
      {
        title: "What is the difference between Accordion and Tabs?",
        body: "Tabs switch mutually exclusive views with tablist semantics. Accordion expands inline sections within the same flow.",
      },
      {
        title: "Can multiple Accordion items be open?",
        body: "Yes when type=\"multiple\". Default type=\"single\" keeps one section open; collapsible allows closing all in single mode.",
      },
      {
        title: "How does Accordion work with a keyboard?",
        body: "Each trigger is a native button — Enter/Space toggles. Tab moves between triggers. No arrow-key roving is implemented.",
      },
      {
        title: "When should content remain permanently visible?",
        body: "Essential instructions, primary documentation, and SEO-critical content must not live only inside collapsed client-rendered panels.",
      },
      {
        title: "Does React render Figma’s Content slot placeholder?",
        body: "No. Figma may show an instructional placeholder so designers can discover the Content slot. That is authoring affordance only. AccordionPanel children is optional application content (React.ReactNode, default undefined). When omitted or null, React injects no placeholder copy and does not render an empty content wrapper.",
      },
    ],
    apiProps: [
      { name: "type", type: '"single" | "multiple"', default: '"single"', description: "Expansion mode." },
      { name: "value", type: "string | string[]", description: "Controlled open item(s)." },
      { name: "defaultValue", type: "string | string[]", description: "Initial open item(s)." },
      { name: "onValueChange", type: "(value: string | string[]) => void", description: "Called when expansion changes." },
      { name: "collapsible", type: "boolean", default: "false", description: "Allow closing all items in single mode." },
      {
        name: "AccordionPanel children",
        type: "React.ReactNode",
        default: "undefined",
        description:
          "Application body content for a panel. Optional. Figma’s Content slot placeholder is not part of this API and is never injected.",
      },
    ],
    reactExample: `"use client";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/Accordion";

export function Example() {
  return (
    <Accordion type="single" collapsible defaultValue="faq-1">
      <AccordionItem value="faq-1">
        <AccordionTrigger>What is Skrewww?</AccordionTrigger>
        <AccordionPanel>A token-driven design system with Beta React components.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="faq-2">
        <AccordionTrigger>Is Accordion for primary docs?</AccordionTrigger>
        <AccordionPanel>No — keep essential documentation visible by default.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}`,
  },
  {
    slug: "dialog",
    name: "Dialog",
    category: "Containers & Overlays",
    summary:
      "Dialog is a modal overlay that interrupts workflow for focused attention, information, or a decision.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference:
      "No canonical Dialog COMPONENT_SET/master. React compound composition is the source of truth.",
    documentationUrl: getComponentDocumentationUrl("dialog"),
    supportedVariants: ["modal"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/card/border-highlight-1",
      "component/card/border-highlight-2",
      "component/card/border-highlight-3",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "component/radius/container",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Popover — non-blocking supplementary panel", href: "/components/popover" },
      { label: "Drawer — edge-anchored panel", href: "/components/drawer" },
      { label: "Card — non-modal content grouping", href: "/components/card" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "component/card/surface", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Destructive alertdialog variant not confirmed as a separate Figma pattern — use Dialog with danger actions for now.",
      "Full-screen mobile Dialog layout not confirmed — viewport padding and max-height cap used instead.",
      "No canonical Figma Dialog COMPONENT_SET — a future Figma build should follow React DialogBody/DialogFooter composition, not instructional placeholders.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Dialog content is exposed through role=\"dialog\" naming — not a live region.",
    anatomy:
      "Dialog = scrim + dialog surface + title + optional description + body + optional footer + close control.",
    keyboardBehavior:
      "Escape closes the topmost overlay. Tab cycles within Dialog. Background content is inert while open. Focus returns to trigger or finalFocusRef on close.",
    focusBehavior:
      "Initial focus uses initialFocusRef, then the first interactive control, otherwise the dialog container. finalFocusRef overrides trigger restoration.",
    dismissalBehavior:
      "Escape, close button, and optional overlay pointer dismissal request closure through onOpenChange(false, reason). Controlled parents must apply the close request.",
    comparisons: [
      {
        title: "What is the difference between Dialog and Popover?",
        body: "Dialog is modal, inerts the background, and traps focus. Popover is non-blocking supplementary content attached to a trigger.",
      },
      {
        title: "Should clicking the overlay close a Dialog?",
        body: "Yes when closeOnOverlayClick is enabled and the pointer down occurs on the backdrop, not when dragging out of content.",
      },
      {
        title: "Why does a Dialog require an accessible title?",
        body: "Modal dialogs must expose an accessible name through DialogTitle or aria-label so screen-reader users know what interrupted the page.",
      },
      {
        title: "How does nested overlay Escape work?",
        body: "Escape closes only the topmost overlay. Tooltip inside Popover inside Dialog closes in that order.",
      },
      {
        title: "Does Dialog body/footer accept arbitrary composition?",
        body: "Yes. DialogBody and DialogFooter take ReactNode children — forms, alerts, multiple buttons, or custom layout. There is no Figma instructional placeholder in React. Closed Dialogs unmount portal content by design (focus trap / portal lifecycle), unlike Accordion’s CSS-hidden panels.",
      },
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      {
        name: "onOpenChange",
        type: "(open: boolean, reason?: DialogCloseReason) => void",
        description: "Closure requests always emit false with a reason.",
      },
      { name: "closeOnOverlayClick", type: "boolean", default: "true", description: "Backdrop dismissal." },
      { name: "DialogBody children", type: "React.ReactNode", description: "Arbitrary body composition." },
      { name: "DialogFooter children", type: "React.ReactNode", description: "Arbitrary action/footer composition." },
      { name: "initialFocusRef", type: "RefObject<HTMLElement>", description: "Preferred initial focus target on DialogContent." },
      { name: "finalFocusRef", type: "RefObject<HTMLElement>", description: "Preferred focus restoration target on close." },
    ],
    reactExample: `"use client";

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button type="button">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save changes?</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogDescription>Review updates before publishing documentation.</DialogDescription>
        <DialogBody>
          <p>Dialog body content.</p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary">Cancel</Button>
          <Button type="button">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`,
  },
  {
    slug: "popover",
    name: "Popover",
    category: "Containers & Overlays",
    summary:
      "Popover is a non-modal floating panel for supplementary or lightly interactive content anchored to a trigger.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: "2026-08-31",
    figmaReference:
      "Containers / Popover 2044:26011 — Content 2044:26006 + Arrow 2044:26010",
    documentationUrl: getComponentDocumentationUrl("popover"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/card/border",
      "component/card/border-highlight-1",
      "component/card/border-highlight-2",
      "component/card/border-highlight-3",
      "component/surface/blur",
      "component/radius/container",
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/border/default",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Tooltip — short non-interactive hint", href: "/components/tooltip" },
      { label: "Dialog — modal attention pattern", href: "/components/dialog" },
      { label: "Card — bounded static content", href: "/components/card" },
    ],
    relatedTokens: [
      { label: "component/card/surface", href: "/foundations" },
      { label: "component/card/border-highlight-1", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "component/radius/container", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Confirm whether additional arrow placements beyond the Figma bottom variant are required.",
      "Popover inside scrollable clipped containers may need dedicated collision tuning.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior:
      "Named Popovers use role=\"dialog\" without aria-modal. Simple unnamed supplementary Popovers use a semantic-neutral container with no landmark role.",
    anatomy:
      "Popover = trigger + floating surface + optional title + body + optional close + optional arrow.",
    keyboardBehavior:
      "Enter/Space toggles on trigger. Escape closes the topmost overlay and restores focus when appropriate.",
    focusBehavior:
      "focusMode=\"trigger\" keeps focus on the trigger. focusMode=\"content\" moves focus into the panel without trapping.",
    dismissalBehavior:
      "Escape, outside pointer down, explicit close control, and trigger toggle. Outside dismissal preserves clicked target focus.",
    comparisons: [
      {
        title: "What is the difference between Popover and Tooltip?",
        body: "Tooltip is hover/focus explanatory text without interactive controls. Popover supports richer supplementary content and actions.",
      },
      {
        title: "What is the difference between Popover and Dialog?",
        body: "Dialog is modal and inerts the page. Popover does not trap focus or block background interaction.",
      },
      {
        title: "Should focus move into a Popover?",
        body: "Only when focusMode=\"content\" for an interactive mini-workflow. Informational Popovers keep focus on the trigger.",
      },
      {
        title: "Should a Popover trap focus?",
        body: "No. Background content remains keyboard reachable unless a parent modal Dialog is open.",
      },
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      { name: "placement", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred placement." },
      { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment along the placement axis." },
      { name: "focusMode", type: '"trigger" | "content"', default: '"trigger"', description: "Focus entry strategy." },
      { name: "showArrow", type: "boolean", default: "true", description: "Render the confirmed arrow variant." },
    ],
    reactExample: `"use client";

import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button type="button">View details</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Project settings</PopoverTitle>
        <PopoverBody>
          <p>Adjust visibility and notification preferences.</p>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}`,
  },
  {
    slug: "drawer",
    name: "Drawer",
    category: "Containers & Overlays",
    summary:
      "Drawer is an edge-anchored modal panel for supplementary settings, filters, or secondary forms.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference:
      "No canonical Drawer COMPONENT_SET/master. React compound composition is the source of truth. Implemented left-edge geometry: viewport-attached left edge flush, exposed right corners rounded.",
    documentationUrl: getComponentDocumentationUrl("drawer"),
    supportedVariants: ["left"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "component/radius/container",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Dialog — centered modal attention", href: "/components/dialog" },
      { label: "Popover — non-blocking supplementary panel", href: "/components/popover" },
      { label: "Card — static content grouping", href: "/components/card" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "component/card/surface", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Right, top, and bottom placements are not confirmed in Figma — only left placement is implemented.",
      "Swipe-to-close, drag handles, and snap points are not confirmed.",
      "Full-screen mobile Drawer layout is not confirmed — max-width cap used instead.",
      "Figma prose said “left corners rounded, right edge flush” but topRightRadius=0 refers to the viewport-attached corner. Implementation uses left edge flush with right-corner radius per edge-attachment geometry.",
      "No canonical Figma Drawer COMPONENT_SET — a future Figma build should follow React DrawerBody/DrawerFooter composition, not instructional placeholders.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior:
      "Drawer uses role=\"dialog\" with aria-modal=\"true\" and the same modality model as Dialog.",
    anatomy:
      "Drawer = scrim + edge-anchored panel + title + optional description + body + optional footer + close control.",
    keyboardBehavior:
      "Escape closes the topmost overlay. Tab cycles within Drawer. Background is inert while open.",
    focusBehavior:
      "Initial focus uses initialFocusRef, then the first interactive control, otherwise the panel container.",
    dismissalBehavior:
      "Escape, close button, and optional overlay pointer dismissal request closure through onOpenChange(false, reason).",
    motionBehavior:
      "Left placement slides in from the viewport edge. prefers-reduced-motion uses opacity-only entry.",
    comparisons: [
      {
        title: "What is the difference between Drawer and Dialog?",
        body: "Dialog is centered and interrupts workflow for decisions. Drawer is edge-anchored for supplementary content or settings.",
      },
      {
        title: "When should a Drawer be used?",
        body: "Use Drawer for settings panels, filters, or secondary forms that need more space than a Popover but less urgency than Dialog.",
      },
      {
        title: "Should clicking the overlay close Drawer?",
        body: "Yes when closeOnOverlayClick is enabled and the pointer down occurs on the backdrop.",
      },
      {
        title: "When should Drawer not use swipe gestures?",
        body: "Swipe-to-close is not confirmed in Figma and is intentionally omitted until a verified pattern exists.",
      },
      {
        title: "Does Drawer body/footer accept arbitrary composition?",
        body: "Yes. DrawerBody and DrawerFooter take ReactNode children. React composition is canonical because no Figma Drawer master exists. Closed Drawers unmount portal content by design, unlike Accordion’s CSS-hidden panels.",
      },
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      {
        name: "onOpenChange",
        type: "(open: boolean, reason?: DrawerCloseReason) => void",
        description: "Closure requests always emit false with a reason.",
      },
      { name: "placement", type: '"left"', default: '"left"', description: "Implemented left-edge placement." },
      { name: "closeOnOverlayClick", type: "boolean", default: "true", description: "Backdrop dismissal." },
      { name: "DrawerBody children", type: "React.ReactNode", description: "Arbitrary body composition." },
      { name: "DrawerFooter children", type: "React.ReactNode", description: "Arbitrary action/footer composition." },
      { name: "initialFocusRef", type: "RefObject<HTMLElement>", description: "Preferred initial focus target." },
      { name: "finalFocusRef", type: "RefObject<HTMLElement>", description: "Preferred focus restoration target." },
    ],
    reactExample: `"use client";

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Drawer placement="left">
      <DrawerTrigger>
        <Button type="button">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <p>Drawer body content.</p>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button">Apply</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}`,
  },
];
