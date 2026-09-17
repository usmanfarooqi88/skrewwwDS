#!/usr/bin/env node


// lib/guard/cli-public.ts
import { existsSync as existsSync7 } from "node:fs";
import { dirname as dirname3, join as join7, resolve as resolve5 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// lib/guard/format.ts
function formatSeverity(severity) {
  return severity.toUpperCase();
}
function formatOneDiagnostic(d) {
  const lines = [];
  lines.push(`${formatSeverity(d.severity)} ${d.ruleId}`);
  if (d.location?.file) {
    const loc = d.location.line !== void 0 ? d.location.column !== void 0 ? `${d.location.file}:${d.location.line}:${d.location.column}` : `${d.location.file}:${d.location.line}` : d.location.file;
    lines.push(loc);
  }
  lines.push(d.message);
  if (d.remediation) {
    lines.push(`Fix: ${d.remediation}`);
  }
  return lines.join("\n");
}
function formatOneExecutionError(err) {
  const prefix = err.file ? `ERROR tool/${err.kind}
${err.file}
` : `ERROR tool/${err.kind}
`;
  return `${prefix}${err.message}`;
}
function formatGuardSummary(diagnostics) {
  const errors = diagnostics.filter((d) => d.severity === "error");
  if (errors.length === 0) {
    return "Guard: no errors found";
  }
  const files = new Set(
    errors.map((d) => d.location?.file).filter((f) => typeof f === "string" && f.length > 0)
  );
  const errorWord = errors.length === 1 ? "error" : "errors";
  if (files.size === 0) {
    return `Guard: ${errors.length} ${errorWord}`;
  }
  const fileWord = files.size === 1 ? "file" : "files";
  return `Guard: ${errors.length} ${errorWord} in ${files.size} ${fileWord}`;
}
function formatGuardResult(input) {
  const blocks = [];
  for (const err of input.executionErrors ?? []) {
    blocks.push(formatOneExecutionError(err));
  }
  for (const d of input.diagnostics) {
    blocks.push(formatOneDiagnostic(d));
  }
  const body = blocks.length > 0 ? `${blocks.join("\n\n")}

` : "";
  return `${body}${formatGuardSummary(input.diagnostics)}
`;
}

// lib/guard/run.ts
import { existsSync as existsSync6, readFileSync as readFileSync7, statSync as statSync2 } from "node:fs";
import { resolve as resolve4 } from "node:path";

// lib/site-config.ts
var PRODUCTION_FALLBACK_ORIGIN = "https://skrewww.com";
function resolveSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return PRODUCTION_FALLBACK_ORIGIN;
}
var siteConfig = {
  name: "Skrewww Design System",
  shortName: "Skrewww",
  organizationName: "Skrewww",
  description: "AI-first design system platform with token-driven components, native-first form semantics with accessible custom controls where native HTML cannot represent the confirmed interaction model, and documentation for designers, developers, and coding agents.",
  origin: resolveSiteOrigin(),
  designSystemVersion: "1.0.0",
  documentationVersion: "1.0.0",
  /** Fixed source date — do not regenerate on every build. */
  lastUpdated: "2026-07-13",
  documentationPublished: "2026-06-01",
  /** Next.js serves /opengraph-image automatically — keep absolute URL helper aligned. */
  defaultSocialImagePath: "/opengraph-image",
  repositoryUrl: "https://github.com/usmanfarooqi88/skrewwwDS",
  figmaUrl: void 0,
  accessibilityBaseline: "WCAG 2.2 AA (target)"
};
function absoluteUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.origin}${normalized}`;
}
function getComponentDocumentationUrl(slug) {
  return absoluteUrl(`/components/${slug}`);
}

// lib/component-registry-calendar.ts
var sharedConcepts = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var REACT_DATE = "2026-07-12";
var DOCS_DATE = "2026-06-01";
var calendarRegistryEntries = [
  {
    slug: "calendar-day",
    name: "Calendar Day",
    category: "Content & Data",
    summary: "Calendar Day is a single selectable day cell inside a month calendar grid.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Calendar Day \u2014 Default/Today/Selected/Disabled/Outside",
    documentationUrl: getComponentDocumentationUrl("calendar-day"),
    supportedVariants: ["default", "today", "selected", "disabled", "outside"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/primary",
      "semantic/text/disabled",
      "semantic/action/primary",
      "component/button/primary/background",
      "component/surface/content",
      "component/surface/blur",
      "radius/full"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/calendar-date.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/CalendarDay.tsx", "components/ui/calendar-day.module.css"],
    cssTokens: [
      "--calendar-day-code-only-min-touch",
      "--calendar-day-code-only-radius",
      "--calendar-day-code-only-size",
      "--calendar-day-disabled-text",
      "--calendar-day-hover-surface",
      "--calendar-day-min-touch",
      "--calendar-day-muted-text",
      "--calendar-day-radius",
      "--calendar-day-range-middle-hover-surface",
      "--calendar-day-range-middle-surface",
      "--calendar-day-range-preview-border",
      "--calendar-day-range-preview-hover-surface",
      "--calendar-day-range-preview-surface",
      "--calendar-day-selected-hover-surface",
      "--calendar-day-selected-surface",
      "--calendar-day-selected-text",
      "--calendar-day-size",
      "--calendar-day-text",
      "--calendar-day-today-indicator",
      "--component-brand-fill-glass",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg",
      "--opacity-disabled",
      "--semantic-action-primary",
      "--semantic-focus-ring"
    ],
    relatedComponents: [
      { label: "Calendar Grid \u2014 month composition", href: "/components/calendar-grid" },
      { label: "Date Picker \u2014 popover field composition", href: "/components/date-picker" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary (Today stroke)", href: "/foundations" },
      { label: "component/button/primary/background (Selected fill)", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "semantic/text/disabled (Disabled and Outside)", href: "/foundations" },
      { label: "radius/full", href: "/foundations" }
    ],
    // Genuine Surface participant, confirmed via Figma master-component
    // inspection 2026-08-11 (component set 2058:2146, Selected 2058:2143)
    // — the resting Selected fill and its text both respond to Surface
    // mode. Previously omitted here; that was a real metadata gap, not an
    // intentional Flat-only exclusion. Range start/middle/end and
    // hover-on-selected are code-only/unverified. Calendar Day itself binds
    // radius/full and does not participate in Figma's global Shape modes.
    relatedConcepts: [sharedConcepts.surface],
    openQuestions: [
      "Range Start / Range End / Range Middle / range preview are React-first \xB7 Figma parity pending \u2014 live Calendar Day masters only expose Default, Today, Selected, Disabled, and Outside (set 2058:2146). Do not invent Figma range variants for Stable-v1.",
      "Hover, selected hover, pressed, and focused Calendar Day visuals remain unverified against Figma masters.",
      "Calendar Day should be composed inside Calendar Grid \u2014 not used standalone without grid context."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Calendar Day = native button + visible day number. Today is represented by the verified inside stroke.",
    comparisons: [
      {
        title: "What is the difference between today and selected?",
        body: "Today marks the current calendar date with an inside stroke. Selected marks the chosen value with the Surface-dependent primary fill."
      },
      {
        title: "How is a Calendar Day labelled for screen readers?",
        body: "Each day exposes a full understandable date such as \u201C14 July 2026\u201D, not only the visible numeral."
      },
      {
        title: "Can Calendar Day be used outside Calendar Grid?",
        body: "Only for previews or documentation. Production usage should compose Calendar Day through Calendar Grid for keyboard and grid semantics."
      }
    ],
    apiProps: [
      { name: "date", type: "YYYY-MM-DD", description: "Canonical date-only value." },
      { name: "selected", type: "boolean", description: "Selected state." },
      { name: "today", type: "boolean", description: "Highlights current date." },
      { name: "disabled", type: "boolean", description: "Non-selectable day." },
      { name: "outsideMonth", type: "boolean", description: "Adjacent-month day styling." },
      { name: "onDateSelect", type: "(date) => void", description: "Pointer selection callback." }
    ],
    reactExample: `import { CalendarDay } from "@/components/ui/CalendarDay";

export function Example() {
  return <CalendarDay date="2026-07-14" selected />;
}`
  },
  {
    slug: "calendar-grid",
    name: "Calendar Grid",
    category: "Content & Data",
    summary: "Calendar Grid is a composed month-view calendar with single-date or range selection and grid keyboard navigation.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "partial",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Calendar Day composition \u2014 7\xD76 month grid (inferred)",
    documentationUrl: getComponentDocumentationUrl("calendar-grid"),
    supportedVariants: ["single-date", "range"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/text/secondary",
      "component/radius/container",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/CalendarMonthCell.tsx",
      "components/ui/CalendarYearCell.tsx",
      "components/ui/calendar-period-cell.module.css",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/calendar-date.ts",
      "components/ui/internal/calendar-math.ts",
      "components/ui/internal/useCalendarKeyboard.ts",
      "components/ui/internal/useCalendarCellGridKeyboard.ts"
    ],
    registryDependencies: ["@skrewww/calendar-day", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/CalendarGrid.tsx", "components/ui/calendar-grid.module.css"],
    cssTokens: [
      "--calendar-grid-border",
      "--calendar-grid-day-gap",
      "--calendar-grid-header-gap",
      "--calendar-grid-month-text",
      "--calendar-grid-padding",
      "--calendar-grid-radius",
      "--calendar-grid-surface",
      "--calendar-grid-week-gap",
      "--calendar-grid-weekday-text",
      "--calendar-grid-width",
      "--glass-backdrop-filter-md",
      "--glass-mix-md",
      "--glass-mix-md-fallback",
      "--semantic-focus-ring",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Calendar Day \u2014 day cell building block", href: "/components/calendar-day" },
      { label: "Date Picker \u2014 field + popover composition", href: "/components/date-picker" },
      { label: "Popover \u2014 non-modal calendar shell in Date Picker", href: "/components/popover" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Month/year drill-up and range selection are implemented on Calendar Grid.",
      "Six-week grid with outside-month days visible is an initial policy \u2014 not fully verified in Figma Month Grid."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Calendar Grid composes Calendar Day: header + previous/next month buttons + weekday row + week rows. Clicking the header drills up to a month grid, then a year grid, for fast month/year navigation.",
    keyboardBehavior: "Arrow keys move by day; Home/End move within week; Page Up/Page Down change month; Enter/Space selects focused day. Roving tabindex keeps one day in tab order. The month and year drill-up grids use the same roving-tabindex model with arrow keys, Home/End, and Enter/Space over their own cells.",
    focusBehavior: "Month navigation buttons remain in tab order. Arrow-key navigation does not move focus back to the trigger.",
    comparisons: [
      {
        title: "How does Calendar Grid work with a keyboard?",
        body: 'The grid uses role="grid" with roving tabindex on day buttons and explicit arrow/Home/End/Page Up/Page Down handling.'
      },
      {
        title: "How does focus move between months?",
        body: "Page Up/Page Down and month buttons update the visible month while preserving the focused weekday where possible through date clamping."
      },
      {
        title: "How are outside-month dates handled?",
        body: "Outside-month days remain visible and selectable unless disabled. They use muted styling."
      },
      {
        title: "What week-start and locale assumptions are used?",
        body: "Initial batch uses en-GB formatting and Monday week start. Stored values remain locale-neutral YYYY-MM-DD strings."
      },
      {
        title: "How does range selection work?",
        body: `Set mode="range" and use rangeValue/defaultRangeValue/onRangeValueChange ({ start, end }) instead of value. First click sets start; second click commits end (swapped into chronological order if picked backwards); clicking inside a completed range starts fresh. Hovering or moving keyboard focus after start is set shows a live provisional preview of the range before it's committed.`
      }
    ],
    apiProps: [
      { name: "mode", type: '"single" | "range"', description: "Selection mode. Defaults to single-date; range mode uses separate range props below." },
      { name: "value", type: "YYYY-MM-DD", description: "Controlled selected date (single mode)." },
      { name: "defaultValue", type: "YYYY-MM-DD", description: "Initial selected date (single mode)." },
      { name: "onValueChange", type: "(date) => void", description: "Selection callback (single mode)." },
      { name: "rangeValue", type: "{ start, end }", description: "Controlled range value (range mode)." },
      { name: "defaultRangeValue", type: "{ start, end }", description: "Initial range value (range mode)." },
      { name: "onRangeValueChange", type: "(range) => void", description: "Range selection callback (range mode)." },
      { name: "visibleMonth", type: "{ year, month }", description: "Controlled visible month." },
      { name: "defaultVisibleMonth", type: "{ year, month }", description: "Initial visible month." }
    ],
    reactExample: `import { CalendarGrid } from "@/components/ui/CalendarGrid";

export function Example() {
  return <CalendarGrid defaultValue="2026-07-14" />;
}`
  }
];

// lib/component-registry-containers.ts
var sharedConcepts2 = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var REACT_DATE2 = "2026-07-11";
var DOCS_DATE2 = "2026-06-01";
var containersRegistryEntries = [
  {
    slug: "accordion",
    name: "Accordion",
    category: "Containers & Overlays",
    summary: "Accordion is a set of stacked collapsible sections for progressive disclosure, built from Accordion Item building blocks.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE2,
    reactLastUpdated: REACT_DATE2,
    figmaReference: "Containers / Accordion Item \u2014 collapsed/expanded states; public API composes Accordion Item",
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
      "semantic/focus-ring"
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
      "--semantic-text-primary"
    ],
    relatedComponents: [
      { label: "Tabs \u2014 mutually exclusive views with tablist semantics", href: "/components/tabs" },
      { label: "Card \u2014 static grouped content", href: "/components/card" },
      { label: "Dialog \u2014 modal attention pattern", href: "/components/dialog" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts2.shape, sharedConcepts2.surface],
    openQuestions: [
      "Figma documents Accordion Item only \u2014 single vs multiple expansion is an implementation convention, not a separate Figma variant.",
      "Disabled accordion items, leading icons, and size variants are not confirmed in Figma.",
      "Arrow-key roving accordion pattern is intentionally not implemented."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Accordion composes Accordion Item building blocks: Accordion + AccordionItem + AccordionTrigger + AccordionPanel.",
    keyboardBehavior: "Enter or Space toggles the focused trigger through native button activation. Tab moves through triggers normally. Arrow keys, Home, and End are not implemented.",
    focusBehavior: "Focus remains on the trigger after toggling expansion.",
    motionBehavior: "Chevron rotation respects prefers-reduced-motion. Panels use hidden attribute \u2014 no height animation that blocks screen-reader access.",
    comparisons: [
      {
        title: "What is the difference between Accordion and Tabs?",
        body: "Tabs switch mutually exclusive views with tablist semantics. Accordion expands inline sections within the same flow."
      },
      {
        title: "Can multiple Accordion items be open?",
        body: 'Yes when type="multiple". Default type="single" keeps one section open; collapsible allows closing all in single mode.'
      },
      {
        title: "How does Accordion work with a keyboard?",
        body: "Each trigger is a native button \u2014 Enter/Space toggles. Tab moves between triggers. No arrow-key roving is implemented."
      },
      {
        title: "When should content remain permanently visible?",
        body: "Essential instructions, primary documentation, and SEO-critical content must not live only inside collapsed client-rendered panels."
      },
      {
        title: "Does React render Figma\u2019s Content slot placeholder?",
        body: "No. Figma may show an instructional placeholder so designers can discover the Content slot. That is authoring affordance only. AccordionPanel children is optional application content (React.ReactNode, default undefined). When omitted or null, React injects no placeholder copy and does not render an empty content wrapper."
      }
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
        description: "Application body content for a panel. Optional. Figma\u2019s Content slot placeholder is not part of this API and is never injected."
      }
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
        <AccordionPanel>No \u2014 keep essential documentation visible by default.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}`
  },
  {
    slug: "dialog",
    name: "Dialog",
    category: "Containers & Overlays",
    summary: "Dialog is a modal overlay that interrupts workflow for focused attention, information, or a decision.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE2,
    reactLastUpdated: REACT_DATE2,
    figmaReference: "No canonical Dialog COMPONENT_SET/master. React compound composition is the source of truth.",
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
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/Portal.tsx",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/OverlayScopeContext.tsx",
      "components/ui/internal/useBackgroundInert.ts",
      "components/ui/internal/useBodyScrollLock.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useFocusTrap.ts",
      "components/ui/internal/focus-utils.ts",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/overlay-types.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Dialog.tsx", "components/ui/dialog.module.css"],
    cssTokens: [
      "--component-card-border-gradient",
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--component-surface-gradient-overlay",
      "--dialog-body-gap",
      "--dialog-close-size",
      "--dialog-header-gap",
      "--dialog-max-height",
      "--dialog-motion-easing",
      "--dialog-open-duration",
      "--dialog-overlay-background",
      "--dialog-overlay-background-opaque",
      "--dialog-padding",
      "--dialog-radius",
      "--dialog-viewport-padding",
      "--dialog-width",
      "--dialog-z-index",
      "--semantic-focus-ring",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Popover \u2014 non-blocking supplementary panel", href: "/components/popover" },
      { label: "Drawer \u2014 edge-anchored panel", href: "/components/drawer" },
      { label: "Card \u2014 non-modal content grouping", href: "/components/card" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "component/card/surface", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts2.shape, sharedConcepts2.surface],
    openQuestions: [
      "Destructive alertdialog variant not confirmed as a separate Figma pattern \u2014 use Dialog with danger actions for now.",
      "Full-screen mobile Dialog layout not confirmed \u2014 viewport padding and max-height cap used instead.",
      "No canonical Figma Dialog COMPONENT_SET \u2014 a future Figma build should follow React DialogBody/DialogFooter composition, not instructional placeholders."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: 'Dialog content is exposed through role="dialog" naming \u2014 not a live region.',
    anatomy: "Dialog = scrim + dialog surface + title + optional description + body + optional footer + close control.",
    keyboardBehavior: "Escape closes the topmost overlay. Tab cycles within Dialog. Background content is inert while open. Focus returns to trigger or finalFocusRef on close.",
    focusBehavior: "Initial focus uses initialFocusRef, then the first interactive control, otherwise the dialog container. finalFocusRef overrides trigger restoration.",
    dismissalBehavior: "Escape, close button, and optional overlay pointer dismissal request closure through onOpenChange(false, reason). Controlled parents must apply the close request.",
    comparisons: [
      {
        title: "What is the difference between Dialog and Popover?",
        body: "Dialog is modal, inerts the background, and traps focus. Popover is non-blocking supplementary content attached to a trigger."
      },
      {
        title: "Should clicking the overlay close a Dialog?",
        body: "Yes when closeOnOverlayClick is enabled and the pointer down occurs on the backdrop, not when dragging out of content."
      },
      {
        title: "Why does a Dialog require an accessible title?",
        body: "Modal dialogs must expose an accessible name through DialogTitle or aria-label so screen-reader users know what interrupted the page."
      },
      {
        title: "How does nested overlay Escape work?",
        body: "Escape closes only the topmost overlay. Tooltip inside Popover inside Dialog closes in that order."
      },
      {
        title: "Does Dialog body/footer accept arbitrary composition?",
        body: "Yes. DialogBody and DialogFooter take ReactNode children \u2014 forms, alerts, multiple buttons, or custom layout. There is no Figma instructional placeholder in React. Closed Dialogs unmount portal content by design (focus trap / portal lifecycle), unlike Accordion\u2019s CSS-hidden panels."
      }
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      {
        name: "onOpenChange",
        type: "(open: boolean, reason?: DialogCloseReason) => void",
        description: "Closure requests always emit false with a reason."
      },
      { name: "closeOnOverlayClick", type: "boolean", default: "true", description: "Backdrop dismissal." },
      { name: "DialogBody children", type: "React.ReactNode", description: "Arbitrary body composition." },
      { name: "DialogFooter children", type: "React.ReactNode", description: "Arbitrary action/footer composition." },
      { name: "initialFocusRef", type: "RefObject<HTMLElement>", description: "Preferred initial focus target on DialogContent." },
      { name: "finalFocusRef", type: "RefObject<HTMLElement>", description: "Preferred focus restoration target on close." }
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
}`
  },
  {
    slug: "popover",
    name: "Popover",
    category: "Containers & Overlays",
    summary: "Popover is a non-modal floating panel for supplementary or lightly interactive content anchored to a trigger.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE2,
    reactLastUpdated: "2026-08-31",
    figmaReference: "Containers / Popover 2044:26011 \u2014 Content 2044:26006 + Arrow 2044:26010",
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
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/Portal.tsx",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/OverlayScopeContext.tsx",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useOutsidePointer.ts",
      "components/ui/internal/popover-position.ts",
      "components/ui/internal/focus-utils.ts",
      "components/ui/internal/useFloatingPosition.ts",
      "components/ui/internal/assign-ref.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Popover.tsx", "components/ui/popover.module.css"],
    cssTokens: [
      "--component-card-border",
      "--component-card-border-gradient",
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--popover-arrow-size",
      "--popover-body-gap",
      "--popover-border",
      "--popover-max-width",
      "--popover-motion-easing",
      "--popover-open-duration",
      "--popover-padding",
      "--popover-radius",
      "--popover-text",
      "--popover-viewport-padding",
      "--popover-z-index",
      "--semantic-focus-ring",
      "--semantic-text-secondary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Tooltip \u2014 short non-interactive hint", href: "/components/tooltip" },
      { label: "Dialog \u2014 modal attention pattern", href: "/components/dialog" },
      { label: "Card \u2014 bounded static content", href: "/components/card" }
    ],
    relatedTokens: [
      { label: "component/card/surface", href: "/foundations" },
      { label: "component/card/border-highlight-1", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "component/radius/container", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts2.shape, sharedConcepts2.surface],
    openQuestions: [
      "Confirm whether additional arrow placements beyond the Figma bottom variant are required.",
      "Popover inside scrollable clipped containers may need dedicated collision tuning."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: 'Named Popovers use role="dialog" without aria-modal. Simple unnamed supplementary Popovers use a semantic-neutral container with no landmark role.',
    anatomy: "Popover = trigger + floating surface + optional title + body + optional close + optional arrow.",
    keyboardBehavior: "Enter/Space toggles on trigger. Escape closes the topmost overlay and restores focus when appropriate.",
    focusBehavior: 'focusMode="trigger" keeps focus on the trigger. focusMode="content" moves focus into the panel without trapping.',
    dismissalBehavior: "Escape, outside pointer down, explicit close control, and trigger toggle. Outside dismissal preserves clicked target focus.",
    comparisons: [
      {
        title: "What is the difference between Popover and Tooltip?",
        body: "Tooltip is hover/focus explanatory text without interactive controls. Popover supports richer supplementary content and actions."
      },
      {
        title: "What is the difference between Popover and Dialog?",
        body: "Dialog is modal and inerts the page. Popover does not trap focus or block background interaction."
      },
      {
        title: "Should focus move into a Popover?",
        body: 'Only when focusMode="content" for an interactive mini-workflow. Informational Popovers keep focus on the trigger.'
      },
      {
        title: "Should a Popover trap focus?",
        body: "No. Background content remains keyboard reachable unless a parent modal Dialog is open."
      }
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      { name: "placement", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred placement." },
      { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment along the placement axis." },
      { name: "focusMode", type: '"trigger" | "content"', default: '"trigger"', description: "Focus entry strategy." },
      { name: "showArrow", type: "boolean", default: "true", description: "Render the confirmed arrow variant." }
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
}`
  },
  {
    slug: "drawer",
    name: "Drawer",
    category: "Containers & Overlays",
    summary: "Drawer is an edge-anchored modal panel for supplementary settings, filters, or secondary forms.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: DOCS_DATE2,
    reactLastUpdated: REACT_DATE2,
    figmaReference: "No canonical Drawer COMPONENT_SET/master. React compound composition is the source of truth. Implemented left-edge geometry: viewport-attached left edge flush, exposed right corners rounded.",
    documentationUrl: getComponentDocumentationUrl("drawer"),
    supportedVariants: ["left"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "component/radius/container",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/Portal.tsx",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/OverlayScopeContext.tsx",
      "components/ui/internal/useBackgroundInert.ts",
      "components/ui/internal/useBodyScrollLock.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/useLatestRef.ts",
      "components/ui/internal/useFocusTrap.ts",
      "components/ui/internal/focus-utils.ts",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/overlay-types.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Drawer.tsx", "components/ui/drawer.module.css"],
    cssTokens: [
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--component-surface-gradient-overlay",
      "--drawer-body-gap",
      "--drawer-close-size",
      "--drawer-header-gap",
      "--drawer-max-width",
      "--drawer-motion-easing",
      "--drawer-open-duration",
      "--drawer-overlay-background",
      "--drawer-overlay-background-opaque",
      "--drawer-padding",
      "--drawer-radius",
      "--drawer-width",
      "--drawer-z-index",
      "--semantic-focus-ring",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-control",
      "--squircle-clip-path-container-right",
      "--squircle-clip-path-control"
    ],
    relatedComponents: [
      { label: "Dialog \u2014 centered modal attention", href: "/components/dialog" },
      { label: "Popover \u2014 non-blocking supplementary panel", href: "/components/popover" },
      { label: "Card \u2014 static content grouping", href: "/components/card" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "component/card/surface", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts2.shape, sharedConcepts2.surface],
    openQuestions: [
      "Right, top, and bottom placements are not confirmed in Figma \u2014 only left placement is implemented.",
      "Swipe-to-close, drag handles, and snap points are not confirmed.",
      "Full-screen mobile Drawer layout is not confirmed \u2014 max-width cap used instead.",
      "Figma prose said \u201Cleft corners rounded, right edge flush\u201D but topRightRadius=0 refers to the viewport-attached corner. Implementation uses left edge flush with right-corner radius per edge-attachment geometry.",
      "No canonical Figma Drawer COMPONENT_SET \u2014 a future Figma build should follow React DrawerBody/DrawerFooter composition, not instructional placeholders."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: 'Drawer uses role="dialog" with aria-modal="true" and the same modality model as Dialog.',
    anatomy: "Drawer = scrim + edge-anchored panel + title + optional description + body + optional footer + close control.",
    keyboardBehavior: "Escape closes the topmost overlay. Tab cycles within Drawer. Background is inert while open.",
    focusBehavior: "Initial focus uses initialFocusRef, then the first interactive control, otherwise the panel container.",
    dismissalBehavior: "Escape, close button, and optional overlay pointer dismissal request closure through onOpenChange(false, reason).",
    motionBehavior: "Left placement slides in from the viewport edge. prefers-reduced-motion uses opacity-only entry.",
    comparisons: [
      {
        title: "What is the difference between Drawer and Dialog?",
        body: "Dialog is centered and interrupts workflow for decisions. Drawer is edge-anchored for supplementary content or settings."
      },
      {
        title: "When should a Drawer be used?",
        body: "Use Drawer for settings panels, filters, or secondary forms that need more space than a Popover but less urgency than Dialog."
      },
      {
        title: "Should clicking the overlay close Drawer?",
        body: "Yes when closeOnOverlayClick is enabled and the pointer down occurs on the backdrop."
      },
      {
        title: "When should Drawer not use swipe gestures?",
        body: "Swipe-to-close is not confirmed in Figma and is intentionally omitted until a verified pattern exists."
      },
      {
        title: "Does Drawer body/footer accept arbitrary composition?",
        body: "Yes. DrawerBody and DrawerFooter take ReactNode children. React composition is canonical because no Figma Drawer master exists. Closed Drawers unmount portal content by design, unlike Accordion\u2019s CSS-hidden panels."
      }
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      {
        name: "onOpenChange",
        type: "(open: boolean, reason?: DrawerCloseReason) => void",
        description: "Closure requests always emit false with a reason."
      },
      { name: "placement", type: '"left"', default: '"left"', description: "Implemented left-edge placement." },
      { name: "closeOnOverlayClick", type: "boolean", default: "true", description: "Backdrop dismissal." },
      { name: "DrawerBody children", type: "React.ReactNode", description: "Arbitrary body composition." },
      { name: "DrawerFooter children", type: "React.ReactNode", description: "Arbitrary action/footer composition." },
      { name: "initialFocusRef", type: "RefObject<HTMLElement>", description: "Preferred initial focus target." },
      { name: "finalFocusRef", type: "RefObject<HTMLElement>", description: "Preferred focus restoration target." }
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
}`
  }
];

// lib/table-figma-metadata.ts
var TABLE_FIGMA_SOURCE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2321-1964";
var TABLE_FIGMA_COMPONENT_NODE_ID = "2321:1964";

// lib/data-table-figma-metadata.ts
var DATA_TABLE_COLUMN_HEADER_FIGMA_NODE_ID = "2805:859";
var DATA_TABLE_COLUMN_HEADER_FIGMA_SOURCE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2805-859";

// lib/tree-view-figma-metadata.ts
var TREE_VIEW_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-1988";
var TREE_VIEW_FIGMA_COMPONENT_SET_NODE_ID = "2058:1988";

// lib/charts-figma-metadata.ts
var CHARTS_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-2568";
var BAR_CHART_FIGMA_EXAMPLE_NODE_ID = "2058:2532";
var LINE_CHART_FIGMA_EXAMPLE_NODE_ID = "2058:2559";

// lib/banking-figma-metadata.ts
var BANKING_FIGMA_COMPONENT_SET_NODE_ID = null;

// lib/timeline-figma-metadata.ts
var TIMELINE_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-2092";
var TIMELINE_FIGMA_COMPONENT_SET_NODE_ID = "2058:2092";

// lib/component-registry-content-data.ts
var sharedConcepts3 = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var REACT_DATE3 = "2026-07-13";
var DOCS_DATE3 = "2026-06-01";
var TABLE_DOCS_DATE = "2026-08-14";
var contentDataRegistryEntries = [
  {
    slug: "tag",
    name: "Tag",
    category: "Content & Data",
    summary: "Tag is a compact classification label for categories, filters, or user-applied values \u2014 distinct from read-only Badge status metadata.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE3,
    reactLastUpdated: REACT_DATE3,
    figmaReference: "Content & Data / Tag \u2014 Label + optional remove control",
    documentationUrl: getComponentDocumentationUrl("tag"),
    supportedVariants: ["default", "removable"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/icon/muted",
      "radius/full"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Tag.tsx", "components/ui/tag.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--shape-radius-control",
      "--tag-border",
      "--tag-gap",
      "--tag-icon-size",
      "--tag-min-height",
      "--tag-padding-x",
      "--tag-radius",
      "--tag-remove-size",
      "--tag-surface",
      "--tag-text"
    ],
    relatedComponents: [
      { label: "Badge \u2014 read-only status metadata", href: "/components/badge" },
      { label: "Button \u2014 primary actions", href: "/components/button" }
    ],
    relatedTokens: [
      { label: "semantic/surface/elevated", href: "/foundations" },
      { label: "radius/full", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.shape],
    openQuestions: [
      "Selectable or filter-chip Tag behavior is not confirmed in Figma \u2014 only removable label is implemented.",
      "Chip is not a separate Figma component \u2014 Tag is the canonical name."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Tag = label text + optional leading icon + optional remove button.",
    comparisons: [
      {
        title: "What is the difference between Tag and Badge?",
        body: "Badge communicates compact read-only status or counts. Tag represents an assigned category or filter value and may include a separate remove control."
      },
      {
        title: "Is Tag interactive?",
        body: "Default Tag is a non-interactive span. Only the optional remove button is interactive \u2014 the label itself is not a button."
      },
      {
        title: "How should a removable Tag be labelled?",
        body: "The remove button uses an accessible name such as \u201CRemove Design Systems\u201D. Decorative icons use aria-hidden."
      }
    ],
    apiProps: [
      { name: "children", type: "ReactNode", description: "Tag label text." },
      { name: "removable", type: "boolean", default: "false", description: "Shows a separate remove button." },
      { name: "onRemove", type: "() => void", description: "Called when remove is activated." },
      { name: "removeLabel", type: "string", description: "Override remove button accessible name." },
      { name: "leadingIcon", type: "ReactNode", description: "Optional leading icon (decorative)." }
    ],
    reactExample: `import { Tag } from "@/components/ui/Tag";

export function Example() {
  return (
    <Tag removable onRemove={() => undefined}>
      Design Systems
    </Tag>
  );
}`
  },
  {
    slug: "avatar",
    name: "Avatar",
    category: "Content & Data",
    summary: "Avatar is a circular visual identity for a user or entity with image, initials, or icon fallback.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE3,
    reactLastUpdated: REACT_DATE3,
    figmaReference: "Content & Data / Avatar \u2014 Size (Small/Medium/Large), initials fallback",
    documentationUrl: getComponentDocumentationUrl("avatar"),
    supportedVariants: ["image", "initials", "icon"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/button/primary/background",
      "component/surface/content",
      "component/surface/blur",
      "radius/full"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Avatar.tsx", "components/ui/avatar.module.css"],
    cssTokens: [
      "--avatar-background",
      "--avatar-image-fit",
      "--avatar-radius",
      "--avatar-size-lg",
      "--avatar-size-md",
      "--avatar-size-sm",
      "--avatar-text",
      "--component-brand-fill-glass",
      "--component-button-primary-fill",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg"
    ],
    relatedComponents: [
      { label: "List Item \u2014 row composition with Avatar", href: "/components/list-item" },
      { label: "Badge \u2014 status metadata, not identity", href: "/components/badge" }
    ],
    relatedTokens: [
      { label: "component/button/primary/background", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "radius/full", href: "/foundations" }
    ],
    // Genuine Surface participant, confirmed via Figma master-component
    // inspection 2026-08-11 (node 2044:26027) — the initials-fallback
    // background and content color both respond to Surface mode
    // (component/button/primary/background family + component/surface/
    // content). Previously omitted here; that was a real metadata gap,
    // not an intentional Flat-only exclusion.
    relatedConcepts: [sharedConcepts3.shape, sharedConcepts3.surface],
    openQuestions: [
      "Avatar Group overflow behavior is not confirmed \u2014 deferred.",
      "Status indicator ring on Avatar is not confirmed in Figma."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Avatar = circular frame + image OR initials OR icon fallback.",
    comparisons: [
      {
        title: "When should Avatar use empty alt text?",
        body: "When the person\u2019s name is visible adjacent to the Avatar and the image is decorative. Use meaningful alt or label when Avatar is the sole identification."
      },
      {
        title: "How should initials be announced?",
        body: "Initials alone are not sufficient when a full legal name is required. Provide label for informative contexts; hide decorative avatars from assistive technology."
      },
      {
        title: "What happens when the Avatar image fails?",
        body: "The component falls back to initials when provided, otherwise to the icon fallback \u2014 no broken-image UI."
      }
    ],
    apiProps: [
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Confirmed Figma sizes." },
      { name: "src", type: "string", description: "Image source URL." },
      { name: "alt", type: "string", description: "Image alternative text when informative." },
      { name: "initials", type: "string", description: "Fallback initials when image unavailable." },
      { name: "label", type: "string", description: "Accessible name for initials/icon fallback." },
      { name: "decorative", type: "boolean", default: "false", description: "Hides identity from assistive technology." }
    ],
    reactExample: `import { Avatar } from "@/components/ui/Avatar";

export function Example() {
  return (
    <div className="flex items-center gap-2">
      <Avatar src="/avatar.jpg" alt="" decorative />
      <span>Usman Farooqi</span>
    </div>
  );
}`
  },
  {
    slug: "divider",
    name: "Divider",
    category: "Content & Data",
    summary: "Divider is a thin separator line between content sections \u2014 horizontal or vertical, semantic or decorative.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE3,
    reactLastUpdated: REACT_DATE3,
    figmaReference: 'Content & Data / Divider \u2014 Orientation (Horizontal/Vertical), component set 2044:26035. Both variants confirmed token-bound to semantic/border/default. In-context usage shown in demo frame "Divider (example \u2014 in context)", node 2116:2.',
    documentationUrl: getComponentDocumentationUrl("divider"),
    supportedVariants: ["thematic", "decorative", "structural"],
    supportedSizes: [],
    tokensUsed: ["semantic/border/default"],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Divider.tsx", "components/ui/divider.module.css"],
    cssTokens: [
      "--divider-color",
      "--divider-spacing-x",
      "--divider-spacing-y",
      "--divider-thickness",
      "--divider-vertical-min-height"
    ],
    relatedComponents: [
      { label: "Card \u2014 grouped content with optional footer border", href: "/components/card" }
    ],
    relatedTokens: [{ label: "semantic/border/default", href: "/foundations" }],
    relatedConcepts: [sharedConcepts3.shape],
    openQuestions: [
      "Separator is a synonym \u2014 Divider is the established Figma name.",
      "Inset divider variants are not confirmed."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Divider = 1px line using token thickness and color.",
    comparisons: [
      {
        title: "When should Divider use an hr element?",
        body: 'Use variant="thematic" (default) when the line represents a meaningful content break. Use decorative for purely visual separation.'
      },
      {
        title: "Is a decorative Divider announced?",
        body: 'No \u2014 decorative dividers use aria-hidden and role="presentation".'
      },
      {
        title: "What is the difference between Divider and spacing?",
        body: "Whitespace groups related content. Divider signals a stronger break between distinct sections \u2014 do not replace layout spacing with dividers everywhere."
      },
      {
        title: "Why doesn't Figma have a variant for thematic/decorative/structural?",
        body: "By design, not a gap \u2014 all three variant values render the identical CSS class (only the underlying element, role, and aria attributes differ), so there is nothing visually distinct for Figma to represent. Confirmed via direct Figma inspection 2026-07-15: the component set (2044:26035) intentionally has only the Orientation property."
      }
    ],
    apiProps: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Confirmed Figma orientations."
      },
      {
        name: "variant",
        type: '"thematic" | "decorative" | "structural"',
        default: '"thematic"',
        description: "Semantic mode: hr, hidden decorative, or role=separator."
      }
    ],
    reactExample: `import { Divider } from "@/components/ui/Divider";

export function Example() {
  return (
    <>
      <p>Section one</p>
      <Divider />
      <p>Section two</p>
    </>
  );
}`
  },
  {
    slug: "list-item",
    name: "List Item",
    category: "Content & Data",
    summary: "List Item is a single row inside a collection \u2014 avatar, title, description, metadata, and optional trailing content.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE3,
    reactLastUpdated: REACT_DATE3,
    figmaReference: "Content & Data / List Item \u2014 Default/Hover; Title, Subtitle, Meta",
    figmaNodeId: "2044:26095",
    documentationUrl: getComponentDocumentationUrl("list-item"),
    supportedVariants: ["static", "navigational", "action"],
    supportedSizes: [],
    tokensUsed: [
      "component/menu/item-hover",
      "component/surface/blur",
      "component/list-item/supporting-text",
      "semantic/text/primary",
      "component/radius/control",
      "semantic/focus-ring"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/link-utils.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ListItem.tsx", "components/ui/list-item.module.css"],
    cssTokens: [
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--list-item-description-text",
      "--list-item-gap",
      "--list-item-hover-surface",
      "--list-item-leading-size",
      "--list-item-metadata-text",
      "--list-item-min-height",
      "--list-item-padding-x",
      "--list-item-padding-y",
      "--list-item-radius",
      "--list-item-title-text",
      "--opacity-disabled",
      "--semantic-focus-ring"
    ],
    relatedComponents: [
      { label: "Avatar \u2014 leading identity", href: "/components/avatar" },
      { label: "Badge \u2014 trailing status metadata", href: "/components/badge" },
      { label: "Menu Item \u2014 command/menu semantics", href: "/components/menu-item" },
      { label: "Card \u2014 grouped static content", href: "/components/card" }
    ],
    relatedTokens: [
      { label: "component/menu/item-hover", href: "/foundations" },
      { label: "component/list-item/supporting-text", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.shape, sharedConcepts3.surface],
    openQuestions: [
      "Selected and density variants are not confirmed in Figma \u2014 not implemented.",
      "Compose List Item inside native ul/ol \u2014 no separate List component.",
      "Nested Avatar initials cannot be driven from List Item Figma properties."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "List Item composes optional Avatar, Badge, Tag, Button, or icon leading/trailing slots: li + row + leading + title + description + metadata + trailing.",
    keyboardBehavior: "Navigational rows use native link activation. Action rows use native button activation. Static rows are not tab stops unless they contain separate controls.",
    comparisons: [
      {
        title: "When should a List Item be interactive?",
        body: "Only when navigation or a row action is intentional. Default rows are static content inside ul/ol."
      },
      {
        title: "What is the difference between List Item and Menu Item?",
        body: "List Item is generic collection content without menu or listbox roles. Menu Item belongs inside menu semantics."
      },
      {
        title: "Can a List Item contain another action?",
        body: "Yes on static rows \u2014 trailing actions must be separate controls. Do not combine row-level href/onClick with trailing buttons."
      },
      {
        title: "Which semantics should List Item use?",
        body: 'Native li for all modes. Navigational uses anchor/NextLink. Action uses button type="button". No menuitem, option, or listbox roles.'
      },
      {
        title: "Why do Description and Metadata use their own token instead of the shared muted-content token?",
        body: "component/list-item/supporting-text is List Item's own Surface-aware contract \u2014 semantic/text/secondary in Flat/Gradient, semantic/text/primary in Glass. It is intentionally distinct from component/surface/content-muted (used by File Upload, Table, and List Item's own leading icon) to guarantee WCAG AA contrast (4.5:1) for this row's supporting text."
      }
    ],
    apiProps: [
      { name: "title", type: "ReactNode", description: "Primary row label." },
      { name: "description", type: "ReactNode", description: "Secondary text (Figma Subtitle)." },
      { name: "metadata", type: "ReactNode", description: "Trailing metadata such as time or Badge." },
      { name: "leading", type: "ReactNode", description: "Avatar, icon, or other leading content." },
      { name: "trailing", type: "ReactNode", description: "Static trailing content or separate action on static rows." },
      { name: "href", type: "string", description: "Navigational mode \u2014 real anchor." },
      { name: "onClick", type: "() => void", description: "Action mode \u2014 native button." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables action rows." }
    ],
    reactExample: `import { Avatar } from "@/components/ui/Avatar";
import { ListItem } from "@/components/ui/ListItem";

export function Example() {
  return (
    <ul>
      <ListItem
        leading={<Avatar size="sm" initials="UF" decorative alt="" />}
        title="Usman Farooqi"
        description="Updated documentation"
        metadata="2h ago"
      />
      <ListItem href="/components/button" title="Button" description="Actions" />
    </ul>
  );
}`
  },
  {
    slug: "table",
    name: "Table",
    category: "Content & Data",
    summary: "Table is a native HTML table foundation with captions, headers, body rows, footers, cell alignment, responsive overflow, RTL support, print-friendly scrolling, and composition patterns for empty/loading/error \u2014 not the interactive Data Table pattern (no sorting, selection, or pagination).",
    status: "beta",
    version: "0.1.1-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-08-31",
    reactLastUpdated: TABLE_DOCS_DATE,
    figmaReference: "Canonical reusable basic Table architecture: Content/Table shell 2321:1964; Content/Table Header Row 2321:1903; Content/Table Body Row 2321:1920; Content/Table Cell 2321:1872. Native Slot composition: Rows#2791:12, Header Cells#2791:0, Body Cells#2791:6. Stable-v1 is Flat-only with no Surface property and Rounded-only at radius/lg 12px with cornerSmoothing=0 and no Shape property. Historical example 2044:26192 is reference evidence, not canonical.",
    figmaSourceUrl: TABLE_FIGMA_SOURCE_URL,
    figmaNodeId: TABLE_FIGMA_COMPONENT_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("table"),
    supportedVariants: ["layout-auto", "layout-fixed"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "component/card/surface",
      "component/card/border",
      "component/surface/content-muted",
      "radius/lg",
      "semantic/focus-ring",
      "table-surface",
      "table-cell-padding-inline",
      "table-scroll-shadow"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Table.tsx", "components/ui/table.module.css"],
    cssTokens: [
      "--component-card-border",
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--semantic-border-default",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-default",
      "--semantic-text-secondary",
      "--table-body-surface",
      "--table-border",
      "--table-caption-gap",
      "--table-caption-text",
      "--table-cell-padding-block",
      "--table-cell-padding-inline",
      "--table-footer-surface",
      "--table-header-border",
      "--table-header-surface",
      "--table-header-text",
      "--table-radius",
      "--table-row-border",
      "--table-scroll-fade-size",
      "--table-scroll-shadow",
      "--table-surface",
      "--table-text"
    ],
    relatedComponents: [
      { label: "List Item \u2014 single-column rows, not multi-column tables", href: "/components/list-item" },
      { label: "Badge \u2014 status metadata inside cells", href: "/components/badge" },
      { label: "Link \u2014 navigational cell content", href: "/components/link" },
      { label: "Menu \u2014 row actions inside cells", href: "/components/menu" },
      { label: "Checkbox \u2014 selection controls inside cells (composition only)", href: "/components/checkbox" },
      { label: "Empty State \u2014 compose manually when a table has no rows", href: "/components/empty-state" },
      { label: "Skeleton \u2014 loading placeholder rows", href: "/components/skeleton" },
      { label: "Alert \u2014 error messaging above or beside tables", href: "/components/alert" },
      { label: "Pagination \u2014 external composition for paged data", href: "/components/pagination" }
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/surface/elevated", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.shape, sharedConcepts3.surface],
    openQuestions: [
      "Canonical Caption and Footer visual treatments are still pending in Figma; React preserves its semantic caption/footer API without claiming visual parity for those parts.",
      "Stable-v1 Table is intentionally Rounded-only at radius/lg (12px), with Figma cornerSmoothing=0 and no Shape property. Controlled Table Shape mapping is deferred; global Sharp/Pill/Squircle contexts do not alter the shell.",
      "The responsive TableScrollArea edge-fade treatment remains React-only; Figma documents horizontal overflow as composition rather than native Table anatomy.",
      "Table presentation QA remains separate: budget/date wrapping, column presentation, Pagination number visibility, Table/Pagination spacing, and interactive-cell alignment are still open.",
      "Data Table (implemented 2026-07-15) composes Table for the narrow MVP scope approved 2026-07-13 \u2014 sorting only, external Pagination; selection, sticky headers, and density remain excluded from v1."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "TableScrollArea (optional) + Table + TableCaption + TableHeader/Body/Footer + TableRow + TableHead/TableCell. Multi-level headers via native colSpan/rowSpan/headers. Empty/loading/error via composition, not Table props.",
    keyboardBehavior: 'No composite keyboard model. Tab moves to interactive descendants only. Arrow keys are not captured. TableScrollArea tabIndex is consumer-controlled \u2014 recommend tabIndex={0} for known horizontal overflow. Spreadsheet-style cell navigation is out of scope \u2014 Data Table does not use role="grid".',
    focusBehavior: "Static cells are not focusable. Interactive cell content (links, buttons, checkboxes, menu triggers) owns focus. Focus-visible ring applies when a scroll area is intentionally focusable.",
    announcementBehavior: "Caption provides the accessible table name. Screen-reader captions remain in the accessibility tree. Scroll regions should use a distinct accessibleLabel \u2014 do not duplicate the caption verbatim.",
    comparisons: [
      {
        title: "What is the difference between Table and Data Table?",
        body: "Table is a semantic presentational foundation. Data Table is the higher-level interaction pattern that composes Table \u2014 its narrow MVP scope (sorting only, external Pagination) was approved 2026-07-13 and implemented 2026-07-15."
      },
      {
        title: "Why does Table use native HTML?",
        body: "Native table elements provide captions, header associations, and screen-reader navigation without redundant ARIA roles."
      },
      {
        title: 'Does Table use role="grid"?',
        body: 'No. Ordinary tabular UI uses native HTML table elements. role="grid" is reserved for spreadsheet-like cell navigation and is not part of this foundation.'
      },
      {
        title: "When should a table include a caption?",
        body: 'Always provide a meaningful caption that describes the table\u2019s purpose. Use visibility="screen-reader" when a visible caption is visually redundant. Do not replace caption with aria-label by default.'
      },
      {
        title: "How should row headers be marked?",
        body: 'Use TableHead with scope="row" for the identifying column. Table does not infer scope automatically.'
      },
      {
        title: "Can cells contain buttons and links?",
        body: "Yes. Compose real Link, Button, Menu, Checkbox, and Badge elements. Keep the row non-interactive."
      },
      {
        title: "How does Table work on mobile?",
        body: "TableScrollArea owns horizontal overflow with Temporary edge fades. Rows do not transform into cards. Native table structure remains intact."
      },
      {
        title: "Does Table support sorting?",
        body: "No \u2014 sorting is unsupported on Table itself. Sorting is the MVP interactive pillar Data Table (which composes Table) implemented for its approved scope."
      },
      {
        title: "Does Table support row selection?",
        body: "No selection API. Consumers may place Checkbox controls inside cells as composition only."
      },
      {
        title: "When should a true ARIA Grid be used?",
        body: "Only for spreadsheet-like cell navigation with managed focus. Conventional data tables should stay native HTML and compose Table."
      }
    ],
    apiProps: [
      { name: "layout", type: '"auto" | "fixed"', default: '"auto"', description: "Table layout algorithm." },
      { name: "TableCaption.visibility", type: '"visible" | "screen-reader"', default: '"visible"', description: "Caption visibility while remaining accessible." },
      { name: "TableHead.align / TableCell.align", type: '"start" | "center" | "end"', default: '"start"', description: "Logical text alignment via CSS \u2014 not HTML align." },
      { name: "TableScrollArea.accessibleLabel", type: "string", description: "Names the overflow region when horizontal scrolling needs a landmark. Keep distinct from the caption." },
      { name: "TableScrollArea.tabIndex", type: "number", description: "Consumer-controlled. Recommend 0 for known horizontally scrollable tables; omit when the table fits." },
      { name: "data-table-wrap", type: '"nowrap"', description: "Optional attribute on TableHead/TableCell to prevent wrapping (action columns)." }
    ],
    reactExample: `import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";

export function Example() {
  return (
    <TableScrollArea accessibleLabel="Scrollable projects table" tabIndex={0}>
      <Table>
        <TableCaption>Active projects</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Project</TableHead>
            <TableHead scope="col" align="end">
              Budget
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Atlas</TableHead>
            <TableCell align="end">$24,000</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableScrollArea>
  );
}`
  },
  {
    slug: "data-table",
    name: "Data Table",
    category: "Content & Data",
    summary: "Data Table is an interactive data-table pattern composing Table with header sorting and external Pagination \u2014 no columns-config prop; the consumer writes their own Table/TableHead/TableBody markup and drops in DataTableSortHeader for sortable columns.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "partial",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-08-31",
    reactLastUpdated: "2026-07-15",
    figmaReference: "DataTableSortHeader maps to Content/Data Table Column Header 2805:859 (Sort Unsorted/Ascending/Descending, Align Start/End, Disabled False/True, Label). No Content/Data Table master exists \u2014 customer examples are composition-only on presentation frame 2491:932.",
    figmaSourceUrl: DATA_TABLE_COLUMN_HEADER_FIGMA_SOURCE_URL,
    figmaNodeId: DATA_TABLE_COLUMN_HEADER_FIGMA_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("data-table"),
    supportedVariants: ["sortable-header"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/icon/muted",
      "semantic/focus-ring",
      "table-header-text"
    ],
    // DataTableSortHeader.tsx directly imports TableHead from Table.tsx
    // (a real value import) — @skrewww/table is therefore a genuine
    // registryDependency, not re-transported files. Pagination/Menu/
    // Checkbox (below) are documented composition EXAMPLES only —
    // DataTableSortHeader.tsx never imports any of them — so they are
    // deliberately NOT declared as registryDependencies here.
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts", "lib/use-data-table-sort.ts"],
    registryDependencies: ["@skrewww/table", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/DataTableSortHeader.tsx", "components/ui/data-table-sort-header.module.css"],
    cssTokens: ["--semantic-focus-ring", "--semantic-icon-muted", "--table-header-text"],
    relatedComponents: [
      { label: "Table \u2014 presentational foundation Data Table composes", href: "/components/table" },
      { label: "Pagination \u2014 external composition for paged data", href: "/components/pagination" },
      { label: "Menu \u2014 row actions inside cells", href: "/components/menu" },
      { label: "Checkbox \u2014 selection controls inside cells (composition only, not a Data Table API)", href: "/components/checkbox" }
    ],
    relatedTokens: [
      { label: "semantic/focus-ring", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.shape, sharedConcepts3.surface],
    openQuestions: [
      "No Content/Data Table master exists \u2014 Figma ships a Column Header primitive plus composition examples, not a shell component.",
      "Selection, row actions, loading, and empty are Figma composition examples only \u2014 not Data Table React APIs. A Data Table Row primitive is not required unless selected/hover chrome or denser action rows become a product requirement.",
      "Free currently has no Basic Table family; Column Header and Data Table presentation stay deferred until a coherent Table-family port. Technical sequencing, not Pro-exclusive gating."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Data Table is a pattern, not a wrapper component: compose Table/TableScrollArea/TableCaption/TableHeader/TableBody as usual, and use DataTableSortHeader in place of TableHead for sortable columns. useDataTableSort manages which column is sorted and in which direction. Pagination composes alongside, outside Table, with no embedded page API.",
    keyboardBehavior: `DataTableSortHeader renders a real button \u2014 Tab reaches it as a normal focusable control, Enter and Space activate it like any button. No composite/grid keyboard model; arrow keys are not captured. Table's own keyboard rules (no role="grid", tabIndex on TableScrollArea consumer-controlled) are unchanged.`,
    focusBehavior: "Clicking or activating a sort header does not move focus elsewhere \u2014 focus stays on the button that was activated, so repeated Enter/Space presses can cycle through sort states without hunting for focus.",
    announcementBehavior: 'aria-sort on the th communicates the current sort state to assistive technology per column ("ascending"/"descending"/"none"). Data Table does not add a live region announcing sort changes \u2014 the aria-sort update itself is the accessible signal.',
    comparisons: [
      {
        title: "What is the difference between Table and Data Table?",
        body: "Table is the presentational foundation \u2014 captions, headers, rows, cells, overflow. Data Table is the interaction pattern: it composes Table and adds a sortable header building block (DataTableSortHeader) plus a sort-state hook (useDataTableSort). Data Table does not fork Table's markup or add its own role."
      },
      {
        title: "Why doesn't Data Table take a columns prop?",
        body: "Data Table deliberately has no columns-config API. The consumer still writes real Table/TableHead/TableBody markup \u2014 Data Table only supplies the sortable header building block and the sort-state hook on top of markup the consumer already owns, keeping Table's audited semantics (native scope, RTL, TableScrollArea) as the single source of truth."
      },
      {
        title: "Is Data Table's sort state controlled or uncontrolled?",
        body: "Both \u2014 useDataTableSort uses the same useControllableState hook as Accordion, Dialog, Drawer, and CalendarGrid's range mode. Pass sortState + onSortStateChange for controlled usage, or defaultSortState for uncontrolled usage; omit both for a fully internal default."
      },
      {
        title: "What is the sort cycle?",
        body: "Per column: none -> ascending -> descending -> none. Activating a different column always resets it to ascending and clears the previous column's sort \u2014 only one column sorts at a time in this MVP."
      },
      {
        title: "Does Data Table support row selection?",
        body: "Not in v1 \u2014 explicitly deferred. Consumers may still compose Checkbox inside a TableCell manually, the same way they can with plain Table, but Data Table has no selection API of its own. Figma shows optional selection as composition only."
      },
      {
        title: "Does a Data Table Figma master exist?",
        body: "No. DataTableSortHeader maps to Content/Data Table Column Header 2805:859. Customer-facing examples live on the Content/Presentation/Data Table frame 2491:932. There is no Content/Data Table component master."
      },
      {
        title: "How does pagination work with Data Table?",
        body: "External composition only \u2014 render the existing Pagination component alongside your Table, driving it from your own current-page state. Data Table has no embedded or compound pagination API."
      }
    ],
    apiProps: [
      {
        name: "DataTableSortHeader.sortDirection",
        type: '"ascending" | "descending" | "none"',
        description: "This column's current sort state \u2014 typically from useDataTableSort's getSortDirection(column)."
      },
      {
        name: "DataTableSortHeader.onSort",
        type: "() => void",
        description: "Called when the header is activated. Typically calls useDataTableSort's toggleSort(column)."
      },
      {
        name: "DataTableSortHeader.disabled",
        type: "boolean",
        default: "false",
        description: "Disables the sort button for this column."
      },
      {
        name: "useDataTableSort(options)",
        type: "{ sortState?, defaultSortState?, onSortStateChange? }",
        description: "Dual controlled/uncontrolled sort-state hook. Returns { sortState, getSortDirection, toggleSort }."
      }
    ],
    reactExample: `import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
  TableScrollArea,
  DataTableSortHeader,
} from "@/components/ui";
import { useDataTableSort } from "@/lib/use-data-table-sort";
import { Pagination, buildPaginationItems } from "@/components/ui";

const projects = [
  { id: "atlas", name: "Atlas", budget: 24000 },
  { id: "north-star", name: "North Star", budget: 18500 },
  { id: "harbor", name: "Harbor Analytics", budget: 9250 },
];

export function Example() {
  const { sortState, getSortDirection, toggleSort } = useDataTableSort<"name" | "budget">();
  const [page, setPage] = useState(1);

  const sorted = [...projects].sort((a, b) => {
    if (!sortState.column) return 0;
    const factor = sortState.direction === "ascending" ? 1 : -1;
    return a[sortState.column] > b[sortState.column] ? factor : -factor;
  });

  return (
    <>
      <TableScrollArea accessibleLabel="Scrollable projects table">
        <Table>
          <TableCaption>Projects</TableCaption>
          <TableHeader>
            <TableRow>
              <DataTableSortHeader
                scope="col"
                sortDirection={getSortDirection("name")}
                onSort={() => toggleSort("name")}
              >
                Project
              </DataTableSortHeader>
              <DataTableSortHeader
                scope="col"
                align="end"
                sortDirection={getSortDirection("budget")}
                onSort={() => toggleSort("budget")}
              >
                Budget
              </DataTableSortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell align="end">\${project.budget.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      <Pagination
        items={buildPaginationItems({ currentPage: page, totalPages: 3 })}
        onPageChange={setPage}
      />
    </>
  );
}`
  },
  {
    slug: "tree-view",
    name: "Tree View",
    category: "Content & Data",
    summary: "Tree View is a hierarchical, keyboard-navigable tree \u2014 file explorers, nested category browsers, org charts. Composes Content/Tree Item rows with roving-tabindex keyboard navigation and depth-based indentation.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-18",
    reactLastUpdated: "2026-07-18",
    figmaReference: 'Content & Data / Content/Tree Item component set (node 2058:1988; Label, Show chevron, State: Default/Hover/Selected \u2014 variant nodes 2058:1985/1986/1987) + the "Tree View (example)" composed demo (node 2058:1998), confirming 20px-per-depth indentation. Parent section "Content/Tree View", node 2058:2071. Node IDs confirmed via direct Figma inspection 2026-07-18.',
    figmaSourceUrl: TREE_VIEW_FIGMA_FILE_URL,
    figmaNodeId: TREE_VIEW_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("tree-view"),
    supportedVariants: ["default", "hover", "selected"],
    supportedSizes: [],
    tokensUsed: [
      "component/menu/item-hover",
      "semantic/action/primary",
      "semantic/icon/muted",
      "semantic/text/primary",
      "component/radius/control",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/TreeItem.tsx",
      "components/ui/internal/tree-item.module.css",
      "components/ui/internal/tree-flatten.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/TreeView.tsx", "components/ui/tree-view.module.css"],
    relatedComponents: [
      { label: "List Item \u2014 flat, non-nested row alternative", href: "/components/list-item" },
      { label: "Menu \u2014 the item-hover token Tree Item reuses", href: "/components/menu" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.shape, sharedConcepts3.surface],
    openQuestions: [
      "Multi-select is a deferred v2 \u2014 not shown in the Figma reference and not built here.",
      "Drag-and-drop reordering, virtualization, and async/lazy-loaded children are all out of scope \u2014 none are shown in the Figma reference."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: `Tree View renders a flat, depth-first list of visible Tree Item rows (role="treeitem") inside a role="tree" container \u2014 not nested DOM groups. Each row is Chevron (hidden on leaf nodes) + an optional consumer-supplied icon (16x16 ReactNode slot, matching Figma's deliberate lack of a formal icon-swap property) + Label. Indentation is depth * 20px computed as padding-left per row, matching the 20px-per-depth unit confirmed in Figma's composed example \u2014 never a fixed set of per-depth variants.`,
    keyboardBehavior: "Roving tabindex \u2014 exactly one row is in the Tab sequence at a time. ArrowDown/ArrowUp move focus between visible rows. ArrowRight expands a collapsed node and moves focus onto its newly-visible first child (or moves directly to the first child if already expanded); a no-op on leaf nodes. ArrowLeft collapses an expanded node in place, or moves focus to its parent if already collapsed or a leaf. Enter and Space select the focused row. Clicking the chevron toggles expand/collapse only; clicking the row body selects only \u2014 the two are deliberately independent actions.",
    focusBehavior: "Focus recovers onto the first visible row if the previously-focused node stops being visible (e.g. a controlled `expanded` update collapses its parent). Expanding a node via ArrowRight defers the actual DOM focus() call to after the new child row commits, since it doesn't exist in the DOM at keydown time.",
    announcementBehavior: "aria-expanded is present only on rows with children (omitted entirely on leaf rows). aria-level, aria-setsize, and aria-posinset are set explicitly on every row from the flattened depth-first position, since Tree View does not nest DOM groups the way the WAI-ARIA authoring practice's canonical example does.",
    comparisons: [
      {
        title: "When should I use Tree View instead of List Item?",
        body: "Tree View is for content with genuine hierarchical depth where indentation communicates real structure (file trees, nested categories, org charts). List Item is for flat, non-nested rows \u2014 don't reach for Tree View just to get List Item's visual density."
      },
      {
        title: "Is Tree View's expanded/selected state controlled or uncontrolled?",
        body: "Both, independently \u2014 expanded (string[] of node ids) and selected (a single string | null) each use the same useControllableState hook as Accordion, Dialog, Drawer, CalendarGrid's range mode, and Data Table's sort state. Pass expanded + onExpandedChange or selected + onSelectedChange for controlled usage, or defaultExpanded / defaultSelected for uncontrolled."
      },
      {
        title: "Does Tree View support selecting multiple nodes?",
        body: "No \u2014 single-select only in this Beta. Multi-select is a deferred v2 with no clear signal it's needed yet, and isn't shown anywhere in the Figma reference."
      },
      {
        title: "Why is indentation computed instead of a Figma variant?",
        body: "Figma's own component description calls this out as the #1 common mistake: building indentation as a fixed per-component property. The real anatomy demonstrates it as a genuine per-instance depth spacer (verified at exactly 20px x depth in the composed example), so the React implementation computes the same depth * 20px value as padding-left rather than hardcoding per-level classes or variants."
      },
      {
        title: "Why doesn't the Icon have its own swap property?",
        body: "Figma deliberately leaves icon selection as a consumer-supplied slot \u2014 different rows in the Figma demo use different icons purely through manual instance swaps, with no property backing it. Tree Item's `icon` field is a plain optional ReactNode for the same reason, not a fixed folder/file enum."
      }
    ],
    apiProps: [
      {
        name: "data",
        type: "TreeNode[]",
        description: "Recursive node data: { id, label, icon?, children? }. The only shape Tree View accepts."
      },
      {
        name: "expanded / defaultExpanded",
        type: "string[]",
        description: "Controlled or uncontrolled list of expanded node ids."
      },
      {
        name: "onExpandedChange",
        type: "(expanded: string[]) => void",
        description: "Called whenever the expanded set changes, from click or keyboard."
      },
      {
        name: "selected / defaultSelected",
        type: "string | null",
        description: "Controlled or uncontrolled single selected node id."
      },
      {
        name: "onSelectedChange",
        type: "(id: string | null) => void",
        description: "Called when a row is selected via click, Enter, or Space."
      }
    ],
    reactExample: `import { useState } from "react";
import { TreeView } from "@/components/ui";

const data = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "components", label: "components", children: [
        { id: "button", label: "Button.tsx" },
      ] },
      { id: "index", label: "index.tsx" },
    ],
  },
  { id: "readme", label: "README.md" },
];

export function Example() {
  const [expanded, setExpanded] = useState<string[]>(["src"]);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <TreeView
      data={data}
      expanded={expanded}
      onExpandedChange={setExpanded}
      selected={selected}
      onSelectedChange={setSelected}
      aria-label="Project files"
    />
  );
}`
  },
  {
    slug: "bar-chart",
    name: "Bar Chart",
    category: "Content & Data",
    summary: "Bar Chart is a single-series, static bar chart built on recharts \u2014 real proportional bar heights, month labels below, no Y-axis/gridlines/legend/tooltip.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-18",
    reactLastUpdated: "2026-07-18",
    figmaReference: 'Content & Data / "Bar Chart (example)" (Content/Charts section, node 2058:2568), frame node 2058:2532 \u2014 6 bars (Jan-Jun), single semantic/action/primary fill, real proportional heights (58/95/76/128/108/140 out of a 160px plot area), semantic/text/secondary month labels. No Y-axis, gridlines, legend, or tooltip in the Figma reference. Node IDs confirmed via direct Figma inspection 2026-07-18.',
    figmaSourceUrl: CHARTS_FIGMA_FILE_URL,
    figmaNodeId: BAR_CHART_FIGMA_EXAMPLE_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("bar-chart"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: ["semantic/action/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Line Chart \u2014 trend data over the same single-series shape", href: "/components/line-chart" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" }
    ],
    relatedConcepts: [],
    openQuestions: [
      "Multi-series support is deferred \u2014 not shown in the Figma reference and not built here; v1 is single-series only.",
      "Interactivity (hover tooltips, legend interactivity) is deferred \u2014 v1 is deliberately static, per the approved v1 scope.",
      "A Y-axis and gridlines beyond the existing X-axis month labels are deferred \u2014 not shown in the Figma reference.",
      "Bar corner radius/spacing beyond fill color and the X-axis label treatment is this implementation's own decision, not something Figma specified."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: 'A recharts BarChart inside ResponsiveContainer (fluid width, fixed height \u2014 genuinely fills its parent, not a fixed pixel box), one Bar per datum filled with semantic/action/primary, and an XAxis rendering only text labels (axisLine and tickLine both disabled) in semantic/text/secondary. A visually-hidden (`sr-only`) data table with the same label/value pairs is rendered alongside, and the chart\'s own SVG is aria-hidden with role="img" + aria-label + aria-describedby pointing at the table \u2014 so the underlying data is genuinely available to assistive tech, not just implied by bar heights.',
    announcementBehavior: "The chart container exposes role=\"img\" with an accessible name (the required `label` prop) and aria-describedby pointing at a visually-hidden table containing the exact label/value pairs. The chart's own SVG is aria-hidden so assistive tech doesn't attempt to read partial axis text out of context.",
    comparisons: [
      {
        title: "Why ResponsiveContainer instead of fixed pixel dimensions?",
        body: "A real consumer embeds this in a variable-width dashboard/card, so the chart should genuinely fill its parent \u2014 fixed dimensions were an earlier draft, justified partly by a jsdom/ResizeObserver test limitation that has a standard fix (a ResizeObserver polyfill in vitest.setup.ts) rather than a reason to constrain real-world sizing. Height stays a fixed prop (default 240) since chart height is typically design-determined, not fluid."
      },
      {
        title: "Why is there no Y-axis?",
        body: `Figma's own "Bar Chart (example)" frame has no Y-axis, gridlines, legend, or tooltip \u2014 only bars and X-axis month labels. This component matches that reference exactly rather than inferring additional chrome Figma didn't show.`
      },
      {
        title: "How is the underlying data exposed to screen readers?",
        body: "A visually-hidden (sr-only) table with the same label/value pairs, linked to the chart via aria-describedby. Bar heights alone convey nothing to assistive tech, so this is a real accessibility mechanism, not optional polish."
      }
    ],
    apiProps: [
      { name: "data", type: "{ label: string; value: number }[]", description: "Single-series data. Multi-series is deferred." },
      { name: "label", type: "string", description: "Accessible name for the chart \u2014 also used as the hidden data table's caption." },
      { name: "height", type: "number", default: "240", description: "Fixed pixel height. Width is fluid (ResponsiveContainer), filling the parent." }
    ],
    reactExample: `import { BarChart } from "@/components/ui";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

export function Example() {
  return <BarChart data={monthlySignups} label="Monthly signups" />;
}`,
    dependencies: ["recharts"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/BarChart.tsx", "components/ui/bar-chart.module.css"]
  },
  {
    slug: "line-chart",
    name: "Line Chart",
    category: "Content & Data",
    summary: "Line Chart is a single-series, static line chart built on recharts \u2014 a single stroked path with hollow-ring point markers, no axes/gridlines/legend/tooltip.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-18",
    reactLastUpdated: "2026-07-18",
    figmaReference: 'Content & Data / "Line Chart (example)" (Content/Charts section, node 2058:2568), frame node 2058:2559 \u2014 single 2px semantic/action/primary stroke, 7 data points as 6px hollow-ring markers (fill: semantic/surface/default, stroke: semantic/action/primary, 2px). No axis labels, gridlines, or legend in the Figma reference. Node IDs confirmed via direct Figma inspection 2026-07-18.',
    figmaSourceUrl: CHARTS_FIGMA_FILE_URL,
    figmaNodeId: LINE_CHART_FIGMA_EXAMPLE_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("line-chart"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: ["semantic/action/primary", "semantic/surface/default"],
    relatedComponents: [
      { label: "Bar Chart \u2014 categorical data over the same single-series shape", href: "/components/bar-chart" }
    ],
    relatedTokens: [{ label: "semantic/action/primary", href: "/foundations" }],
    relatedConcepts: [],
    openQuestions: [
      "Multi-series support is deferred \u2014 not shown in the Figma reference and not built here; v1 is single-series only.",
      "Interactivity (hover tooltips, legend interactivity) is deferred \u2014 v1 is deliberately static, per the approved v1 scope.",
      "Axis labels and gridlines are deferred \u2014 the Figma reference has none at all for Line Chart.",
      "Fixed chart height (width is fluid) is this implementation's own decision, not something Figma specified."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: 'A recharts LineChart inside ResponsiveContainer (fluid width, fixed height \u2014 genuinely fills its parent, not a fixed pixel box), a single Line stroked in semantic/action/primary at 2px, with a 3px-radius hollow-ring dot per point (semantic/surface/default fill, semantic/action/primary stroke). Curve type is "linear" (straight segments between points) \u2014 confirmed by reading the actual vector path data for node 2058:2560 via the Figma Plugin API: every segment is a straight "L" (lineto) command, with no curve commands at all. No XAxis or YAxis rendered at all, matching the Figma reference exactly. A visually-hidden (`sr-only`) data table with the same label/value pairs is rendered alongside, and the chart\'s own SVG is aria-hidden with role="img" + aria-label + aria-describedby pointing at the table.',
    announcementBehavior: 'The chart container exposes role="img" with an accessible name (the required `label` prop) and aria-describedby pointing at a visually-hidden table containing the exact label/value pairs. The chart\'s own SVG is aria-hidden.',
    comparisons: [
      {
        title: "Why is there no axis at all, not even X-axis labels?",
        body: `Figma's own "Line Chart (example)" frame has no axis labels at all \u2014 unlike Bar Chart, which does show month labels. This component matches that reference exactly rather than adding chrome Figma didn't show.`
      },
      {
        title: 'Why "linear" curve type, not a smoothed curve?',
        body: 'Verified, not guessed: the actual vector path data for the Figma "Line" node (2058:2560), read directly via the Figma Plugin API, is "M 0 140 L 43.3 93.3 L 86.7 110.8 L 130 43.75 ..." \u2014 every segment is a straight lineto ("L") command. An earlier draft used "monotone" (a smoothed curve) as an unverified default; that was corrected to "linear" once the real path data was checked.'
      },
      {
        title: "Why ResponsiveContainer instead of fixed pixel dimensions?",
        body: "A real consumer embeds this in a variable-width dashboard/card, so the chart should genuinely fill its parent \u2014 fixed dimensions were an earlier draft, justified partly by a jsdom/ResizeObserver test limitation that has a standard fix (a ResizeObserver polyfill in vitest.setup.ts) rather than a reason to constrain real-world sizing."
      },
      {
        title: "How is the underlying data exposed to screen readers?",
        body: "A visually-hidden (sr-only) table with the same label/value pairs, linked to the chart via aria-describedby \u2014 the same mechanism Bar Chart uses."
      }
    ],
    apiProps: [
      { name: "data", type: "{ label: string; value: number }[]", description: "Single-series data. Multi-series is deferred." },
      { name: "label", type: "string", description: "Accessible name for the chart \u2014 also used as the hidden data table's caption." },
      { name: "height", type: "number", default: "240", description: "Fixed pixel height. Width is fluid (ResponsiveContainer), filling the parent." }
    ],
    reactExample: `import { LineChart } from "@/components/ui";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

export function Example() {
  return <LineChart data={monthlySignups} label="Monthly signups" />;
}`,
    dependencies: ["recharts"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/LineChart.tsx", "components/ui/line-chart.module.css"]
  },
  {
    slug: "timeline",
    name: "Timeline",
    category: "Content & Data",
    summary: "Timeline is a vertical, chronological event list built on Content/Timeline Item rows \u2014 Default outlined-ring or Highlighted solid-dot markers, connector suppression purely positional.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-19",
    reactLastUpdated: "2026-07-19",
    figmaReference: `Content & Data / "Content/Timeline Item" component set (node 2058:2092; Title/Timestamp/Description text properties + State: Default/Highlighted variant) + the "Timeline (example)" composed demo (node 2058:2102). Parent section "Content/Timeline", node 2058:2130. Node IDs confirmed via direct Figma Plugin API inspection 2026-07-24. Confirmed anatomy: Default is a 10x10 stroke-only dot (1.5px, semantic/action/primary) + a 2x48px Connector Line (semantic/border/default); Highlighted is a 12x12 solid-fill dot (semantic/action/primary), no stroke. Title is always semantic/text/primary; Timestamp/Description are always semantic/text/secondary in both states. Connector-line suppression is purely positional and structural \u2014 the last item's Marker Column has no Connector Line child at all, independent of state; there is no formal "Show connector" boolean property on the component.`,
    figmaSourceUrl: TIMELINE_FIGMA_FILE_URL,
    figmaNodeId: TIMELINE_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("timeline"),
    supportedVariants: ["default", "highlighted"],
    supportedSizes: [],
    tokensUsed: ["semantic/action/primary", "semantic/border/default", "semantic/text/primary"],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/TimelineItemRow.tsx",
      "components/ui/internal/timeline-item-row.module.css"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Timeline.tsx", "components/ui/timeline.module.css"],
    relatedComponents: [
      { label: "Tree View \u2014 hierarchical rather than chronological structure", href: "/components/tree-view" },
      { label: "List Item \u2014 flat, non-chronological row alternative", href: "/components/list-item" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" }
    ],
    relatedConcepts: [],
    openQuestions: [
      "Exact marker/connector pixel sizing, using one shared marker color across both states, and the Timestamp/Description secondary-text token choice are this implementation's own decisions where the given facts didn't specify them.",
      "No truncation is applied anywhere (Title, Timestamp, or Description) \u2014 Alert and Card don't truncate their titles either, and Figma's own reference shows the Description wrapping, not truncating, at 220px. List Item does truncate, but its single-line row density isn't comparable to Timeline's larger content blocks.",
      "An empty data array renders nothing (null) \u2014 no other collection component in this codebase (Table, Tree View, Bar Chart, Line Chart) has an established empty-state convention to follow instead."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "An <ol> of Timeline Item rows. Each row is a CSS grid of two columns: a marker column (a circular marker \u2014 outlined ring for Default, larger solid dot for Highlighted \u2014 plus a connector line beneath it) and a content column (Title + Timestamp on one line, Description wrapping below). The connector's length is computed via CSS (flex: 1 inside a grid row stretched to the taller of its two columns), not a fixed pixel value, so it reaches the next item's marker regardless of how tall the current row's description makes it. Connector visibility is purely positional \u2014 only the last row omits it \u2014 entirely independent of each row's own state.",
    keyboardBehavior: "Purely presentational \u2014 Timeline has no interactive elements and captures no keyboard input of its own.",
    announcementBehavior: "Renders as a real ordered list; each Timestamp is visible text read in document order, not implied by marker position or state alone.",
    comparisons: [
      {
        title: "Why is connector visibility based on position, not state?",
        body: "They're independent concerns. A Default (outlined-ring) item can be the last event in the list and must suppress its connector for that reason alone \u2014 not because it's unhighlighted. A Highlighted item can sit in the middle of the list and must keep its connector. Coupling the two would produce a visibly broken timeline the moment a Default item happens to be last, or a Highlighted item happens to not be."
      },
      {
        title: "How does the connector reach the next item's marker when a description is long?",
        body: "The connector is a flex: 1 element inside a flex column (the marker column) that's stretched by CSS Grid to match the height of the row's taller column \u2014 usually the content column, which grows with description length. This is computed by the browser's layout engine, not a fixed pixel height copied from one Figma example."
      },
      {
        title: "Why no truncation on Title, Timestamp, or Description?",
        body: `Checked precedent first: List Item does truncate its title/description to a single line, but Alert and Card \u2014 the more structurally comparable "content block with a title" components \u2014 don't truncate at all. Figma's own Timeline reference also shows the Description wrapping to 2 lines rather than truncating. Given that mixed signal, this implementation defaults to natural wrapping everywhere, matching the majority precedent and the literal Figma behavior, rather than inventing truncation Timeline alone would need to justify.`
      },
      {
        title: "What happens with an empty data array?",
        body: "Renders nothing. No other collection component in this codebase (Table, Tree View, Bar Chart, Line Chart) auto-composes an empty-state pattern for zero items \u2014 EmptyState is always a separate, consumer-composed choice. Inventing a Timeline-specific empty-state behavior would be inconsistent with every sibling component."
      }
    ],
    apiProps: [
      {
        name: "data",
        type: '{ title: string; timestamp: string; description: string; state?: "default" | "highlighted" }[]',
        description: 'Chronological list of events, in display order. state defaults to "default".'
      }
    ],
    reactExample: `import { Timeline } from "@/components/ui";

const events = [
  { title: "Order placed", timestamp: "Jan 3, 9:14 AM", description: "Order #48213 received." },
  {
    title: "Payment confirmed",
    timestamp: "Jan 3, 9:16 AM",
    description: "Charge captured successfully.",
    state: "highlighted",
  },
  { title: "Delivered", timestamp: "Jan 6, 2:41 PM", description: "Left at front door." },
];

export function Example() {
  return <Timeline data={events} />;
}`
  },
  {
    slug: "empty-state",
    name: "Empty State",
    category: "Content & Data",
    summary: "Empty State is a zero-content placeholder with title, description, and optional recovery actions for collections, search, or first-use flows.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE3,
    reactLastUpdated: REACT_DATE3,
    figmaReference: "Content & Data / Empty State \u2014 Title, Description, Button CTA",
    documentationUrl: getComponentDocumentationUrl("empty-state"),
    supportedVariants: ["first-use", "no-results", "informational"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "semantic/text/secondary"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/button", "@skrewww/link", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/EmptyState.tsx", "components/ui/empty-state.module.css"],
    cssTokens: [
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--component-surface-gradient-overlay",
      "--empty-state-action-gap",
      "--empty-state-content-gap",
      "--empty-state-description-text",
      "--empty-state-icon-size",
      "--empty-state-illustration-size",
      "--empty-state-max-width",
      "--empty-state-padding-x",
      "--empty-state-padding-y",
      "--semantic-text-primary"
    ],
    relatedComponents: [
      { label: "Alert \u2014 persistent inline feedback, not empty collections", href: "/components/alert" },
      { label: "Skeleton \u2014 loading placeholder", href: "/components/skeleton" },
      { label: "Button \u2014 primary recovery actions", href: "/components/button" },
      { label: "Link \u2014 secondary navigation actions", href: "/components/link" }
    ],
    relatedTokens: [
      { label: "component/card/surface", href: "/foundations" },
      { label: "component/surface/content-muted", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.surface],
    openQuestions: [
      "No Results, Placeholder State, and Result Empty State are synonyms \u2014 Empty State is canonical.",
      "Permission-restricted empty states are not confirmed as a separate variant.",
      "Error states remain separate from Empty State."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Empty State composes optional decorative icon, title, description, and Button or Link actions inside a section.",
    announcementBehavior: "No automatic live region on the component. Parent results regions may announce dynamic no-results updates.",
    comparisons: [
      {
        title: "When should an Empty State be shown?",
        body: "After loading completes and a collection, search, or workflow genuinely has zero items \u2014 not while data is still loading."
      },
      {
        title: "What is the difference between Empty State and Alert?",
        body: "Empty State explains absent content with recovery guidance. Alert communicates persistent status or errors inline."
      },
      {
        title: "How should \u201CNo results\u201D be announced?",
        body: "Announce from the surrounding results region when content changes dynamically \u2014 not from every child element."
      },
      {
        title: "Should an Empty State always include an action?",
        body: "No \u2014 informational empty states may omit actions when no recovery step exists."
      },
      {
        title: "When should an illustration be hidden from screen readers?",
        body: "When the icon or illustration is decorative and the title or description already conveys the message."
      }
    ],
    apiProps: [
      { name: "title", type: "string", description: "Visible heading and accessible section label." },
      { name: "description", type: "ReactNode", description: "Supporting guidance or recovery copy." },
      { name: "icon", type: "ReactNode", description: "Decorative Phosphor icon." },
      { name: "illustration", type: "ReactNode", description: "Optional illustration slot." },
      { name: "primaryAction", type: "{ label, href?, onClick? }", description: "Primary recovery action." },
      { name: "secondaryAction", type: "{ label, href?, onClick? }", description: "Secondary action or link." }
    ],
    reactExample: `import { EmptyState } from "@/components/ui/EmptyState";

export function Example() {
  return (
    <EmptyState
      title="No components match your search"
      description="Try a different term or clear active filters."
      primaryAction={{ label: "Clear filters", onClick: () => undefined }}
      secondaryAction={{ label: "Browse components", href: "/components" }}
    />
  );
}`
  },
  {
    slug: "banking-transaction-row",
    name: "Banking Transaction Row",
    category: "Content & Data",
    industry: "Banking",
    summary: "Banking Transaction Row is a single financial transaction entry \u2014 merchant, date, amount, and status \u2014 with a Popover for full transaction detail.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-25",
    reactLastUpdated: "2026-07-25",
    figmaReference: 'Layer 4 Industry Systems (Banking pilot) \u2014 no Figma reference exists. Confirmed via a full Figma file search (every page checked) on 2026-07-25: no Industry Systems page and no Banking-related frame or component exists anywhere in the design file. This is a confirmed absence, not a pending MCP check (see lib/banking-figma-metadata.ts, BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25").',
    figmaNodeId: BANKING_FIGMA_COMPONENT_SET_NODE_ID ?? void 0,
    documentationUrl: getComponentDocumentationUrl("banking-transaction-row"),
    supportedVariants: ["success", "warning", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/feedback/success",
      "semantic/feedback/warning",
      "semantic/text/danger",
      "semantic/text/primary",
      "semantic/text/secondary"
    ],
    relatedComponents: [
      { label: "List Item \u2014 the row shell this composes", href: "/components/list-item" },
      { label: "Avatar \u2014 merchant/counterparty logo or initials", href: "/components/avatar" },
      { label: "Badge \u2014 the status indicator this composes", href: "/components/badge" },
      { label: "Popover \u2014 the detail-view trigger this composes", href: "/components/popover" },
      { label: "Banking Account Card \u2014 sibling Layer 4 Banking pilot component", href: "/components/banking-account-card" }
    ],
    relatedTokens: [
      { label: "semantic/feedback/success", href: "/foundations" },
      { label: "semantic/feedback/warning", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" }
    ],
    relatedConcepts: [],
    openQuestions: [
      "No Figma reference exists for this component or for Industry Systems generally \u2014 confirmed absent via full file search on 2026-07-25, not an oversight.",
      "List Item gained aria-expanded/aria-haspopup/aria-controls passthrough for this component's disclosure trigger \u2014 a genuine Layer 2 extension, not a Banking-specific workaround (see components/ui/ListItem.tsx).",
      "Currency/amount formatting is the consumer's responsibility \u2014 amount is a pre-formatted display string, not a number with a built-in formatter, consistent with how Account Card and Balance Summary also take pre-formatted figures."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Composes: List Item (row shell) + Avatar (merchant logo/initials) + Badge (status) + Popover (detail trigger, anchored via PopoverAnchor since List Item does not forward a ref).",
    keyboardBehavior: "The row is a single native button (List Item's action mode) \u2014 Enter/Space toggles the anchored Popover open/closed, matching native button semantics. No composite keyboard model beyond that.",
    comparisons: [
      {
        title: "Why Popover instead of Drawer for the detail view?",
        body: `Popover's own documented purpose ("non-modal floating panel for supplementary or lightly interactive content anchored to a trigger") precisely matches viewing a handful of read-only detail fields for one row without leaving the transaction list. Drawer's placement is currently left-edge-only, an unconventional position for a per-row detail panel, and Drawer's own description ("supplementary settings, filters, or secondary forms") targets a heavier, more form-like use case than this.`
      },
      {
        title: "Why PopoverAnchor instead of PopoverTrigger?",
        body: "PopoverTrigger clones its child and injects a ref for position tracking \u2014 List Item does not forward a ref to its underlying interactive element, so that ref would silently fail to attach. PopoverAnchor wrapping a plain div is the same pattern Combobox already uses for its own non-button trigger (its text input)."
      }
    ],
    apiProps: [
      { name: "merchant", type: "string", description: "Merchant or counterparty name \u2014 also the row's title and the Avatar's accessible label." },
      { name: "merchantLogoSrc", type: "string", description: "Optional merchant logo image URL." },
      { name: "merchantInitials", type: "string", description: "Fallback initials shown when merchantLogoSrc is absent or fails to load." },
      { name: "date", type: "string", description: "Display date/time string \u2014 formatting is the consumer's responsibility." },
      { name: "amount", type: "string", description: `Pre-formatted amount string (e.g. "-$42.50") \u2014 currency formatting is the consumer's responsibility.` },
      { name: "status", type: '"success" | "warning" | "error"', description: "Drives Badge variant and amount color via existing semantic status tokens." },
      { name: "statusLabel", type: "string", description: 'Visible status text (e.g. "Completed", "Pending", "Declined").' },
      { name: "detail", type: "ReactNode", description: "Content shown in the anchored Popover \u2014 typically BankingTransactionDetailRow items." }
    ],
    reactExample: `import {
  BankingTransactionRow,
  BankingTransactionDetailRow,
} from "@/components/ui/BankingTransactionRow";

export function Example() {
  return (
    <ul>
      <BankingTransactionRow
        merchant="Coffee Collective"
        merchantInitials="CC"
        date="Jan 12"
        amount="-$4.75"
        status="success"
        statusLabel="Completed"
        detail={
          <>
            <BankingTransactionDetailRow label="Category" value="Dining" />
            <BankingTransactionDetailRow label="Transaction ID" value="TX-48213" />
          </>
        }
      />
    </ul>
  );
}`
  },
  {
    slug: "banking-account-card",
    name: "Banking Account Card",
    category: "Content & Data",
    industry: "Banking",
    summary: "Banking Account Card is a summary card for one financial account \u2014 account type, current balance, a compact balance-history sparkline, and an action button.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-25",
    reactLastUpdated: "2026-07-25",
    figmaReference: 'Layer 4 Industry Systems (Banking pilot) \u2014 no Figma reference exists. Confirmed via a full Figma file search (every page checked) on 2026-07-25 (see lib/banking-figma-metadata.ts, BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25").',
    figmaNodeId: BANKING_FIGMA_COMPONENT_SET_NODE_ID ?? void 0,
    documentationUrl: getComponentDocumentationUrl("banking-account-card"),
    supportedVariants: [],
    supportedSizes: [],
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Card \u2014 the surface shell this composes", href: "/components/card" },
      { label: "Tag \u2014 the account-type indicator this composes", href: "/components/tag" },
      { label: "Button \u2014 the action trigger this composes", href: "/components/button" },
      { label: "Line Chart \u2014 the balance-history sparkline this composes", href: "/components/line-chart" },
      { label: "Banking Transaction Row \u2014 sibling Layer 4 Banking pilot component", href: "/components/banking-transaction-row" }
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts3.shape, sharedConcepts3.surface],
    openQuestions: [
      "No Figma reference exists for this component or for Industry Systems generally \u2014 confirmed absent via full file search on 2026-07-25, not an oversight.",
      "Line Chart gained an additive `sparkline` prop for this component's balance-history treatment \u2014 a genuine Layer 2 extension (suppresses point-marker dots, uses a thinner stroke), not a Banking-specific style override (see components/ui/LineChart.tsx).",
      "Glass Surface + Pill Shape inheritance was verified live (not assumed) \u2014 this component sets no background-color or border-radius of its own anywhere in its stylesheet; every surface property comes from Card's own custom properties."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Composes: Card (surface shell, title + footer slots) + Tag (account type) + Button (action trigger, in Card's footer slot) + Line Chart in sparkline mode (balance history).",
    comparisons: [
      {
        title: "Does Account Card need its own Surface/Shape handling?",
        body: "No \u2014 it inherits Card's `--surface-fill-default` and `--shape-radius-container` custom properties entirely through the CSS cascade. Verified live in Glass Surface + Pill Shape mode rather than assumed from Card's own behavior."
      },
      {
        title: "Why does Line Chart need a sparkline prop instead of just a small height?",
        body: "Line Chart's base design already has no axes, gridlines, or legend, so a small height alone gets most of the way there \u2014 but its hollow-ring point-marker dots are unconditional in the base design and dominate the visual at sparkline scale. The additive `sparkline` prop suppresses them and uses a thinner stroke."
      }
    ],
    apiProps: [
      { name: "accountName", type: "string", description: "Shown as the Card's title heading." },
      { name: "accountType", type: "string", description: 'e.g. "Checking", "Savings", "Credit" \u2014 shown as a Tag.' },
      { name: "balance", type: "string", description: `Pre-formatted balance string (e.g. "$4,231.09") \u2014 currency formatting is the consumer's responsibility.` },
      { name: "balanceHistory", type: "LineChartDatum[]", description: "Recent balance history for the sparkline \u2014 same shape as Line Chart's own data prop." },
      { name: "balanceHistoryLabel", type: "string", description: "Accessible name for the sparkline chart." },
      { name: "actionLabel", type: "string", description: "Label for the footer action button." },
      { name: "onAction", type: "() => void", description: "Called when the action button is activated." }
    ],
    reactExample: `import { BankingAccountCard } from "@/components/ui/BankingAccountCard";

export function Example() {
  return (
    <BankingAccountCard
      accountName="Everyday Checking"
      accountType="Checking"
      balance="$4,231.09"
      balanceHistory={[
        { label: "Week 1", value: 4100 },
        { label: "Week 2", value: 4180 },
        { label: "Week 3", value: 4050 },
        { label: "Week 4", value: 4231 },
      ]}
      balanceHistoryLabel="30-day balance history for Everyday Checking"
      actionLabel="View transactions"
      onAction={() => undefined}
    />
  );
}`
  },
  {
    slug: "banking-balance-summary",
    name: "Banking Balance Summary",
    category: "Content & Data",
    industry: "Banking",
    summary: "Banking Balance Summary is a spending/income overview card with a time-range-filtered Bar Chart and a loading state.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-25",
    reactLastUpdated: "2026-07-25",
    figmaReference: 'Layer 4 Industry Systems (Banking pilot) \u2014 no Figma reference exists. Confirmed via a full Figma file search (every page checked) on 2026-07-25 (see lib/banking-figma-metadata.ts, BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25").',
    figmaNodeId: BANKING_FIGMA_COMPONENT_SET_NODE_ID ?? void 0,
    documentationUrl: getComponentDocumentationUrl("banking-balance-summary"),
    supportedVariants: [],
    supportedSizes: [],
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Card \u2014 the layout wrapper this composes", href: "/components/card" },
      { label: "Bar Chart \u2014 the spending/income visualization this composes", href: "/components/bar-chart" },
      { label: "Tabs \u2014 the time-range filter this composes", href: "/components/tabs" },
      { label: "Skeleton \u2014 the loading state this composes", href: "/components/skeleton" },
      { label: "Banking Transaction Row \u2014 sibling Layer 4 Banking pilot component", href: "/components/banking-transaction-row" }
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" }
    ],
    relatedConcepts: [],
    openQuestions: [
      "No Figma reference exists for this component or for Industry Systems generally \u2014 confirmed absent via full file search on 2026-07-25, not an oversight.",
      "Each time range renders its own Bar Chart instance inside its own Tabs panel \u2014 real per-range data is expected from the consumer, not one dataset re-scaled across ranges."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Composes: Card (layout wrapper, title slot) + Tabs (time-range filter, one TabsPanel per range) + Bar Chart (one instance per range, inside its panel) + Skeleton / SkeletonLoading (loading state, replaces the total figure and Tabs entirely while loading).",
    apiProps: [
      { name: "title", type: "string", description: 'Card title, e.g. "Spending overview".' },
      { name: "totalLabel", type: "string", description: 'Label shown next to the total figure, e.g. "Total spent".' },
      { name: "total", type: "string", description: `Pre-formatted total figure (e.g. "$1,284.32") \u2014 currency formatting is the consumer's responsibility.` },
      { name: "ranges", type: "{ value, label, data: BarChartDatum[] }[]", description: "One entry per selectable time range, each with its own real data." },
      { name: "defaultRange", type: "string", description: "Defaults to the first range's value when omitted." },
      { name: "loading", type: "boolean", default: "false", description: "Shows Skeleton placeholders instead of the total figure and Tabs." },
      { name: "loadingLabel", type: "string", default: '"Loading spending summary"', description: "Accessible label announced while loading." }
    ],
    reactExample: `import { BankingBalanceSummary } from "@/components/ui/BankingBalanceSummary";

export function Example() {
  return (
    <BankingBalanceSummary
      title="Spending overview"
      totalLabel="Total spent"
      total="$1,284.32"
      ranges={[
        {
          value: "7d",
          label: "7D",
          data: [
            { label: "Mon", value: 42 },
            { label: "Tue", value: 88 },
          ],
        },
        {
          value: "30d",
          label: "30D",
          data: [
            { label: "Week 1", value: 320 },
            { label: "Week 2", value: 410 },
          ],
        },
      ]}
    />
  );
}`
  }
];

// lib/component-registry-feedback.ts
var sharedConcepts4 = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var REACT_DATE4 = "2026-07-11";
var DOCS_DATE4 = "2026-06-01";
var feedbackRegistryEntries = [
  {
    slug: "alert",
    name: "Alert",
    category: "Feedback",
    summary: "Alert is a persistent inline feedback block for contextual status tied to page content \u2014 not auto-dismissing.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Alert \u2014 Type (Info/Success/Warning/Error)",
    documentationUrl: getComponentDocumentationUrl("alert"),
    supportedVariants: ["info", "success", "warning", "error"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/container",
      "component/feedback/info/surface",
      "component/feedback/success/surface",
      "component/feedback/warning/surface",
      "component/feedback/danger/surface",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/secondary",
      "semantic/text/primary",
      "semantic/feedback/info",
      "semantic/feedback/success",
      "semantic/feedback/warning",
      "semantic/action/danger"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/FeedbackSurface.tsx",
      "components/ui/internal/feedback-surface.module.css",
      "components/ui/internal/feedback-icons.tsx",
      "components/ui/internal/feedback-types.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Alert.tsx"],
    relatedComponents: [
      { label: "Toast \u2014 transient notifications", href: "/components/toast" },
      { label: "Validation Message \u2014 field-level feedback only", href: "/components/validation-message" }
    ],
    relatedTokens: [
      { label: "semantic/feedback/info", href: "/foundations" },
      { label: "semantic/action/danger", href: "/foundations" },
      { label: "semantic/text/secondary (Alert description)", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.shape, sharedConcepts4.surface],
    openQuestions: [
      "Optional action slot semantics pending Figma confirmation for primary action placement."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Default off. Use polite for non-urgent dynamic updates. Use assertive only for dynamically introduced urgent errors.",
    anatomy: "Alert = status icon + title + description + optional action + optional dismiss.",
    keyboardBehavior: "Dismiss and action controls follow native button keyboard behavior. Alert container is not focusable by default.",
    comparisons: [
      {
        title: "What is the difference between Alert and Toast?",
        body: "Alert stays in page content for persistent contextual messages. Toast floats temporarily above the page for transient confirmations."
      }
    ],
    apiProps: [
      { name: "type", type: '"info" | "success" | "warning" | "error"', default: '"info"', description: "Status variant." },
      { name: "title", type: "string", description: "Optional alert title." },
      { name: "announce", type: '"off" | "polite" | "assertive"', default: '"off"', description: "Live region behavior." },
      { name: "dismissible", type: "boolean", default: "false", description: "Shows dismiss control." },
      { name: "onDismiss", type: "() => void", description: "Called when dismissed." }
    ],
    reactExample: `import { Alert } from "@/components/ui/Alert";

export function Example() {
  return (
    <Alert
      type="warning"
      title="Beta component"
      description="APIs may change while Figma parity gaps remain open."
    />
  );
}`
  },
  {
    slug: "toast",
    name: "Toast",
    category: "Feedback",
    summary: "Toast is a transient floating notification for confirming actions or reporting short-lived events.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Toast \u2014 Type (4 variants)",
    documentationUrl: getComponentDocumentationUrl("toast"),
    supportedVariants: ["info", "success", "warning", "error"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/container",
      "component/card/surface",
      "component/card/border",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "semantic/feedback/info",
      "semantic/feedback/success"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/FeedbackSurface.tsx",
      "components/ui/internal/feedback-surface.module.css",
      "components/ui/internal/feedback-icons.tsx",
      "components/ui/internal/feedback-types.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ToastProvider.tsx", "components/ui/toast.module.css"],
    cssTokens: ["--toast-max-width", "--toast-viewport-offset"],
    relatedComponents: [
      { label: "Alert \u2014 persistent inline feedback", href: "/components/alert" },
      { label: "Dialog \u2014 decisions requiring explicit confirmation", href: "/components/dialog" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "component/card/surface", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.surface],
    openQuestions: [
      "Undo action pattern pending Figma confirmation for Toast action slot."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Success and info use polite live regions. Error may use assertive when urgent. Toasts do not steal focus.",
    anatomy: "Toast = viewport + queued toast surfaces with title/description, close, optional action.",
    keyboardBehavior: "Close button is focusable. Escape dismisses focused toast when supported. New toasts do not move focus.",
    comparisons: [
      {
        title: "When should a Toast remain visible?",
        body: "Keep Toasts visible long enough to read the message. Critical persistent errors belong in Alert, not Toast."
      }
    ],
    apiProps: [
      { name: "type", type: '"info" | "success" | "warning" | "error"', default: '"info"', description: "Status variant." },
      { name: "title", type: "string", description: "Optional toast title." },
      { name: "duration", type: "number", default: "5000", description: "Auto-dismiss ms. Set 0 to persist." },
      { name: "announce", type: '"polite" | "assertive"', default: '"polite"', description: "Live region politeness." }
    ],
    reactExample: `"use client";

import { ToastProvider, useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";

function Demo() {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ type: "success", title: "Saved", description: "Changes were saved." })}>
      Save
    </Button>
  );
}

export function Example() {
  return (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
}`
  },
  {
    slug: "progress-bar",
    name: "Progress Bar",
    category: "Feedback",
    summary: "Progress Bar is determinate or indeterminate progress toward a known or unknown completion point.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Progress Bar \u2014 Style (Default/Success/Warning/Danger)",
    documentationUrl: getComponentDocumentationUrl("progress-bar"),
    supportedVariants: ["default", "success", "warning", "danger"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/feedback/success",
      "semantic/feedback/warning",
      "semantic/action/danger"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ProgressBar.tsx", "components/ui/progress-bar.module.css"],
    cssTokens: [
      "--progress-animation-duration",
      "--progress-indicator",
      "--progress-track-height",
      "--semantic-action-danger",
      "--semantic-action-primary",
      "--semantic-border-default",
      "--semantic-feedback-success",
      "--semantic-feedback-warning",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Spinner \u2014 indeterminate loading without measurable progress", href: "/components/spinner" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.shape],
    openQuestions: [
      "Figma has no numeric value property \u2014 React exposes value/max for determinate usage."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "No live region by default. Do not announce every percentage change.",
    anatomy: "Progress Bar = label + native progress or indeterminate track + optional value text.",
    keyboardBehavior: "Not focusable unless paired with a control that owns the operation.",
    comparisons: [
      {
        title: "What is the difference between Progress Bar and Spinner?",
        body: "Use Progress Bar when completion is measurable or indeterminate progress must be communicated semantically. Spinner covers decorative or standalone loading indicators."
      }
    ],
    apiProps: [
      { name: "value", type: "number", description: "Current progress value." },
      { name: "max", type: "number", default: "100", description: "Maximum progress value." },
      { name: "label", type: "string", description: "Accessible name." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Unknown-duration progress." },
      { name: "variant", type: '"default" | "success" | "warning" | "danger"', default: '"default"', description: "Semantic style." }
    ],
    reactExample: `import { ProgressBar } from "@/components/ui/ProgressBar";

export function Example() {
  return <ProgressBar label="Uploading files" value={42} max={100} showValue />;
}`
  },
  {
    slug: "spinner",
    name: "Spinner",
    category: "Feedback",
    summary: "Spinner is an indeterminate loading indicator for operations without a meaningful completion percentage.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Spinner \u2014 Size (Small/Medium/Large)",
    documentationUrl: getComponentDocumentationUrl("spinner"),
    supportedVariants: ["decorative", "labeled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: ["semantic/border/default", "semantic/action/primary"],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Spinner.tsx", "components/ui/spinner.module.css"],
    cssTokens: [
      "--semantic-action-primary",
      "--semantic-border-default",
      "--spinner-animation-duration",
      "--spinner-size-lg",
      "--spinner-size-md",
      "--spinner-size-sm"
    ],
    relatedComponents: [
      { label: "Progress Bar \u2014 measurable progress", href: "/components/progress-bar" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.shape],
    openQuestions: [
      "Reduced-motion fallback uses stepped opacity pulse rather than rotation."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Decorative spinners are aria-hidden. Standalone spinners expose one status label.",
    anatomy: "Spinner = rotating arc indicator with optional visible or screen-reader-only label.",
    keyboardBehavior: "Not interactive.",
    comparisons: [
      {
        title: "When should Spinner be hidden from screen readers?",
        body: "Hide the spinner when visible loading text already communicates status. Provide a label when the spinner is the only loading indicator."
      }
    ],
    apiProps: [
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Spinner dimensions." },
      { name: "label", type: "string", description: "Accessible name for standalone usage." },
      { name: "decorative", type: "boolean", default: "false", description: "Hides spinner from assistive technology." }
    ],
    reactExample: `import { Spinner } from "@/components/ui/Spinner";

export function Example() {
  return <Spinner label="Loading results" />;
}`
  },
  {
    slug: "badge",
    name: "Badge",
    category: "Feedback",
    summary: "Badge is a compact non-interactive label for status, classification, or numeric counts at a glance.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Badge \u2014 Style \xD7 Size (Figma: 6 styles \xD7 Small/Medium; React: 5 styles \xD7 sm/md/lg, no Primary)",
    documentationUrl: getComponentDocumentationUrl("badge"),
    supportedVariants: ["neutral", "info", "success", "warning", "error"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "semantic/surface/elevated",
      "semantic/text/primary",
      "semantic/border/default",
      "--badge-info-text",
      "--badge-success-text",
      "--badge-warning-text",
      "--badge-error-text",
      "color/warning/800",
      "component/radius/control"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/feedback-types.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Badge.tsx", "components/ui/badge.module.css"],
    cssTokens: [
      "--badge-error-border",
      "--badge-error-surface",
      "--badge-error-text",
      "--badge-font-size-lg",
      "--badge-font-size-md",
      "--badge-font-size-sm",
      "--badge-gap",
      "--badge-icon-size-lg",
      "--badge-icon-size-md",
      "--badge-icon-size-sm",
      "--badge-info-border",
      "--badge-info-surface",
      "--badge-info-text",
      "--badge-min-height-lg",
      "--badge-min-height-md",
      "--badge-min-height-sm",
      "--badge-neutral-border",
      "--badge-neutral-surface",
      "--badge-neutral-text",
      "--badge-padding-x-lg",
      "--badge-padding-x-md",
      "--badge-padding-x-sm",
      "--badge-padding-y-lg",
      "--badge-padding-y-md",
      "--badge-padding-y-sm",
      "--badge-radius",
      "--badge-success-border",
      "--badge-success-surface",
      "--badge-success-text",
      "--badge-warning-border",
      "--badge-warning-surface",
      "--badge-warning-text",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-sm",
      "--glass-mix-sm",
      "--glass-mix-sm-fallback"
    ],
    relatedComponents: [
      { label: "Alert \u2014 persistent inline messages", href: "/components/alert" },
      { label: "Validation Message \u2014 field-level feedback only", href: "/components/validation-message" }
    ],
    relatedTokens: [
      { label: "--badge-warning-text \u2192 color/warning/800", href: "/foundations" },
      { label: "color/warning/800", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.shape, sharedConcepts4.surface],
    openQuestions: [
      "Removable Badge behavior is deferred \u2014 use Content/Tag when user-generated removable labels are required.",
      "Warning text is shared with Figma: React --badge-warning-text \u2192 color/warning/800 (#8A4F00); Figma component/badge/warning/text \u2192 color/warning/800 (#8A4F00).",
      "Neutral/Info/Success/Error Badge foregrounds remain accessibility-safe React divergences from Figma component/badge/*/text \u2014 do not lighten to the finalized Figma hexes for parity alone.",
      "React has no Primary Badge variant (Figma does). Primary is a future enhancement, not Stable-v1 scope.",
      "Stable-v1 intentional React extensions (not parity defects): 1px borders, size lg, optional status/leading icons, count mode, and API variant name error (maps to Figma Danger). Figma masters are label-only Small/Medium without borders. React tinted surfaces vs Figma opaque /100 remain a deferred visual sync, not a Stable-v1 blocker."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Static badges do not use live regions. Dynamic count updates may use a separate polite strategy.",
    anatomy: "Badge = optional status icon + compact label or numeric count.",
    keyboardBehavior: "Not focusable or interactive by default.",
    comparisons: [
      {
        title: "What is the difference between Badge and Alert?",
        body: "Badge is a compact read-only label. Alert is a persistent message block with title, description, and optional actions."
      },
      {
        title: "Is a Badge interactive?",
        body: "No. Badge is a span by default. Use Button or Tag patterns for interactive controls."
      }
    ],
    apiProps: [
      { name: "variant", type: '"neutral" | "info" | "success" | "warning" | "error"', default: '"neutral"', description: "Status style." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Compact sizing." },
      { name: "count", type: "number", description: "Numeric count badge." },
      { name: "countMax", type: "number", default: "99", description: "Abbreviation threshold." },
      { name: "showStatusIcon", type: "boolean", default: "false", description: "Shows leading status icon." }
    ],
    reactExample: `import { Badge } from "@/components/ui/Badge";

export function Example() {
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="success" showStatusIcon>Beta</Badge>
      <Badge variant="info" count={128} />
    </div>
  );
}`
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    category: "Feedback",
    summary: "Tooltip is a brief supplementary label for a trigger, shown on keyboard focus or pointer hover.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Tooltip \u2014 Position (Top/Bottom/Left/Right)",
    documentationUrl: getComponentDocumentationUrl("tooltip"),
    supportedVariants: ["top", "right", "bottom", "left"],
    supportedSizes: [],
    tokensUsed: [
      "color/neutral/900",
      "component/radius/container",
      "semantic/text/inverse"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/tooltip-position.ts",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/useTooltipController.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/useLatestRef.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Tooltip.tsx", "components/ui/tooltip.module.css"],
    cssTokens: [
      "--tooltip-max-width",
      "--tooltip-motion-duration",
      "--tooltip-padding-x",
      "--tooltip-padding-y",
      "--tooltip-radius",
      "--tooltip-shadow",
      "--tooltip-surface",
      "--tooltip-text",
      "--tooltip-z-index"
    ],
    relatedComponents: [
      { label: "Popover \u2014 richer supplementary content", href: "/components/popover" },
      { label: "Form Field \u2014 helper text for essential guidance", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.surface],
    openQuestions: [
      "Arrow pointer position remains a fixed Figma approximation \u2014 not dynamically bound to label width."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Tooltip content is exposed through aria-describedby while open \u2014 not a live region.",
    anatomy: "Tooltip = trigger + floating label associated with aria-describedby.",
    keyboardBehavior: "Opens on trigger focus. Escape closes. Tooltip does not receive focus.",
    comparisons: [
      {
        title: "What is the difference between Tooltip and Popover?",
        body: "Tooltip holds one concise string. Popover supports richer content and intentional interaction."
      },
      {
        title: "Why should essential information not appear only in Tooltip?",
        body: "Touch users and many assistive technology workflows cannot rely on hover-only discovery."
      }
    ],
    apiProps: [
      { name: "content", type: "React.ReactNode", description: "Tooltip label." },
      { name: "placement", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "Preferred placement." },
      { name: "openDelay", type: "number", description: "Open delay in ms." },
      { name: "closeDelay", type: "number", description: "Close delay in ms." }
    ],
    reactExample: `"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Tooltip content="Save changes">
      <Button aria-label="Save">\u{1F4BE}</Button>
    </Tooltip>
  );
}`
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    category: "Feedback",
    summary: "Skeleton is temporary placeholder shapes that preserve layout while known content is loading.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE4,
    reactLastUpdated: REACT_DATE4,
    figmaReference: "Feedback / Skeleton \u2014 Shape (Text/Circle/Rectangle)",
    documentationUrl: getComponentDocumentationUrl("skeleton"),
    supportedVariants: ["text", "circle", "rectangle"],
    supportedSizes: [],
    tokensUsed: ["color/neutral/300", "semantic/border/default", "component/radius/control"],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Skeleton.tsx", "components/ui/skeleton.module.css"],
    cssTokens: [
      "--skeleton-animation-duration",
      "--skeleton-base-surface",
      "--skeleton-circle-size",
      "--skeleton-highlight-surface",
      "--skeleton-line-height",
      "--skeleton-radius",
      "--skeleton-rectangle-height",
      "--skeleton-text-width"
    ],
    relatedComponents: [
      { label: "Spinner \u2014 indeterminate loading without layout placeholder", href: "/components/spinner" },
      { label: "Progress Bar \u2014 measurable completion", href: "/components/progress-bar" }
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts4.shape, sharedConcepts4.surface],
    openQuestions: [
      "Composite skeleton layouts remain documentation examples until Figma confirms reusable list-item presets."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Skeleton shapes are aria-hidden. Loading containers expose aria-busy and optional loading text.",
    anatomy: "Skeleton = aria-hidden placeholder shape. SkeletonLoading wraps busy region + screen-reader loading label.",
    keyboardBehavior: "Not interactive.",
    comparisons: [
      {
        title: "What is the difference between Skeleton and Spinner?",
        body: "Skeleton preserves layout for known content shapes. Spinner signals activity without mimicking final layout."
      },
      {
        title: "Is Skeleton announced by screen readers?",
        body: "Individual skeleton shapes are hidden. Provide loading text at the container level with aria-busy."
      }
    ],
    apiProps: [
      { name: "shape", type: '"text" | "circle" | "rectangle"', default: '"text"', description: "Placeholder geometry." },
      { name: "width", type: "string | number", description: "Custom width." },
      { name: "height", type: "string | number", description: "Custom height." }
    ],
    reactExample: `import { Skeleton, SkeletonLoading } from "@/components/ui/Skeleton";

export function Example() {
  return (
    <SkeletonLoading
      loading
      loadingLabel="Loading profile"
      skeleton={
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <Skeleton shape="circle" />
          <Skeleton shape="text" width="80%" />
          <Skeleton shape="text" width="60%" />
        </div>
      }
    >
      <p>Loaded content</p>
    </SkeletonLoading>
  );
}`
  }
];

// lib/combobox-figma-metadata.ts
var COMBOBOX_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";
var COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID = "2024:2480";

// lib/date-picker-figma-metadata.ts
var DATE_PICKER_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2596";
var DATE_PICKER_FIGMA_COMPONENT_SET_NODE_ID = "2024:2596";

// lib/file-upload-figma-metadata.ts
var FILE_UPLOAD_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365";
var FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID = "2024:2649";

// lib/search-field-figma-metadata.ts
var SEARCH_FIELD_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2109";
var SEARCH_FIELD_FIGMA_COMPONENT_SET_NODE_ID = "2024:2109";

// lib/slider-figma-metadata.ts
var SLIDER_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2373";
var SLIDER_FIGMA_COMPONENT_SET_NODE_ID = "2024:2373";
var SLIDER_FIGMA_STATES = ["Default", "Hover", "Focused", "Disabled"];
var SLIDER_FIGMA_VARIANT_COUNT = SLIDER_FIGMA_STATES.length;

// lib/credit-card-field-figma-metadata.ts
var CREDIT_CARD_FIELD_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2714";
var CREDIT_CARD_FIELD_FIGMA_COMPONENT_SET_NODE_ID = "2024:2714";
var CREDIT_CARD_FIELD_FIGMA_STATES = [
  "Default",
  "Focused",
  "Error",
  "Disabled"
];
var CREDIT_CARD_FIELD_FIGMA_VARIANT_COUNT = CREDIT_CARD_FIELD_FIGMA_STATES.length;

// lib/phone-number-field-figma-metadata.ts
var PHONE_NUMBER_FIELD_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2776";
var PHONE_NUMBER_FIELD_FIGMA_COMPONENT_SET_NODE_ID = "2024:2776";
var PHONE_NUMBER_FIELD_FIGMA_STATES = [
  "Default",
  "Focused",
  "Error",
  "Disabled"
];
var PHONE_NUMBER_FIELD_FIGMA_VARIANT_COUNT = PHONE_NUMBER_FIELD_FIGMA_STATES.length;

// lib/component-registry-forms.ts
var sharedConcepts5 = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var REACT_DATE5 = "2026-07-13";
var DOCS_DATE5 = "2026-06-01";
var formsRegistryEntries = [
  {
    slug: "form-field",
    name: "Form Field",
    category: "Forms",
    summary: "Form Field is a shared field wrapper for label, description, required indicator, and validation placement \u2014 not a visual input.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Form Field Wrapper \u2014 State (Default/Error)",
    documentationUrl: getComponentDocumentationUrl("form-field"),
    supportedVariants: ["default", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/text/danger"
    ],
    // Real dependency contract, verified against actual source (2026-08-09):
    // FormField.tsx imports and renders ValidationMessage directly for its
    // error path (a real code dependency, independently public and
    // registry-slugged — not folded into internalDependencies). No
    // third-party npm package of its own; no next import.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/validation-message", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/FormField.tsx", "components/ui/form-field.module.css"],
    cssTokens: ["--semantic-text-danger", "--semantic-text-primary", "--semantic-text-secondary"],
    relatedComponents: [
      { label: "Validation Message \u2014 typed inline feedback", href: "/components/validation-message" },
      { label: "Text Input \u2014 control composed with FormField", href: "/components/text-input" },
      { label: "Textarea \u2014 multi-line control composition", href: "/components/textarea" },
      { label: "Select \u2014 native dropdown composition", href: "/components/select" },
      { label: "Search Field \u2014 search-specific composition", href: "/components/search-field" },
      { label: "Checkbox \u2014 inline label control", href: "/components/checkbox" }
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    openQuestions: [
      "Horizontal label layout is unresolved in Figma \u2014 vertical layout only.",
      "React name is FormField; Figma name is Form Field Wrapper."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "FormField = label + control slot + supporting text or ValidationMessage. The nested control owns its own input semantics.",
    keyboardBehavior: "FormField does not introduce keyboard behavior \u2014 focus moves to the nested control using native tab order.",
    comparisons: [],
    apiProps: [
      { name: "label", type: "string", description: "Visible or visually hidden field label." },
      { name: "controlId", type: "string", description: "Stable id passed to the nested control." },
      { name: "required", type: "boolean", default: "false", description: "Shows required indicator." },
      { name: "supportingText", type: "string", description: "Helper/description linked with aria-describedby." },
      { name: "error", type: "string", description: "Static validation message rendered through ValidationMessage." },
      { name: "children", type: "(args) => ReactNode", description: "Render prop receiving controlId, describedBy, invalid." }
    ],
    reactExample: `import { TextInput } from "@/components/ui/TextInput";

export function Example() {
  return (
    <TextInput
      label="Workspace name"
      supportingText="Visible to your team."
      placeholder="Acme Design"
    />
  );
}`
  },
  {
    slug: "validation-message",
    name: "Validation Message",
    category: "Forms",
    summary: "Validation Message is inline typed feedback paired with a field \u2014 error, warning, success, or info \u2014 with icon and text.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: "2026-08-30",
    figmaReference: "Forms / Validation Message \u2014 Type (Error/Warning/Success/Info)",
    documentationUrl: getComponentDocumentationUrl("validation-message"),
    supportedVariants: ["error", "warning", "success", "info"],
    supportedSizes: [],
    tokensUsed: [
      "component/validation-message/error/text",
      "component/validation-message/warning/text",
      "component/validation-message/success/text",
      "component/validation-message/info/text",
      "component/validation-message/text",
      "semantic/feedback/warning",
      "semantic/feedback/success",
      "semantic/feedback/info"
    ],
    // Real dependency contract, verified against actual source (2026-08-09):
    // ValidationMessage.tsx imports 4 icons from
    // @phosphor-icons/react/dist/ssr — a real, installed npm package
    // (package.json dependencies, ^2.1.10), the first genuinely nonempty
    // `dependencies` array in this registry's CLI-resolution fields. No
    // next import.
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ValidationMessage.tsx", "components/ui/validation-message.module.css"],
    cssTokens: [
      "--component-validation-message-error-text",
      "--component-validation-message-info-text",
      "--component-validation-message-success-text",
      "--component-validation-message-text",
      "--component-validation-message-warning-text",
      "--semantic-feedback-info",
      "--semantic-feedback-success",
      "--semantic-feedback-warning"
    ],
    relatedComponents: [
      { label: "Form Field \u2014 positions validation below controls", href: "/components/form-field" },
      { label: "Text Input \u2014 common consumer of validation output", href: "/components/text-input" }
    ],
    relatedTokens: [
      { label: "component/validation-message/error/text", href: "/foundations" },
      { label: "component/validation-message/warning/text", href: "/foundations" },
      { label: "component/validation-message/success/text", href: "/foundations" },
      { label: "component/validation-message/info/text", href: "/foundations" },
      { label: "component/validation-message/text", href: "/foundations" },
      { label: "semantic/feedback/warning", href: "/foundations" }
    ],
    relatedConcepts: [],
    openQuestions: [
      "Info type icon swap to dedicated Info icon is pending Figma confirmation.",
      "Warning icon contrast remains a separate Figma-first task; React icons stay on semantic-feedback-warning."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "ValidationMessage = Phosphor icon + message text. Icons are decorative; meaning comes from text.",
    keyboardBehavior: "Not focusable. Live announcement behavior is controlled by the announce prop.",
    comparisons: [],
    apiProps: [
      { name: "type", type: '"error" | "warning" | "success" | "info"', default: '"error"', description: "Visual and semantic feedback type." },
      { name: "announce", type: '"off" | "polite" | "assertive"', default: '"off"', description: "Live region behavior. Use assertive only for dynamically introduced errors." },
      { name: "id", type: "string", description: "Used by aria-describedby on the related control." }
    ],
    reactExample: `import { ValidationMessage } from "@/components/ui/ValidationMessage";

export function Example() {
  return (
    <ValidationMessage id="email-error" type="error" announce="assertive">
      Enter a valid email address.
    </ValidationMessage>
  );
}`
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    category: "Forms",
    summary: "Checkbox is a native checkbox for independent or multi-select choices, including indeterminate group states.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Checkbox \u2014 Value \xD7 State (12 variants)",
    documentationUrl: getComponentDocumentationUrl("checkbox"),
    supportedVariants: ["unchecked", "checked", "indeterminate", "disabled", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/focus-ring",
      "semantic/action/danger"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Checkbox.tsx", "components/ui/checkbox.module.css"],
    cssTokens: [
      "--control-checkbox-radius-max",
      "--control-checkbox-size",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-action-primary",
      "--semantic-border-default",
      "--semantic-border-disabled",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-surface-disabled",
      "--semantic-text-inverse",
      "--semantic-text-primary",
      "--shape-radius-control",
      "--squircle-clip-path-checkbox",
      "--surface-fill-control"
    ],
    relatedComponents: [
      { label: "Switch \u2014 immediate settings toggle", href: "/components/switch" },
      { label: "Radio \u2014 mutually exclusive choice", href: "/components/radio" },
      { label: "Form Field \u2014 group label and validation", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    openQuestions: [
      "Figma does not define a separate Checkbox size variant \u2014 single control size implemented.",
      "Checkbox controls intentionally ignore decorative Gradient/Glass surfaces."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Checkbox = native input[type=checkbox] + inline label text.",
    keyboardBehavior: "Space toggles when focused. Standard tab order to the native input.",
    comparisons: [
      {
        title: "When should a Switch be used instead of a Checkbox?",
        body: "Use Checkbox for form selections and consent that submit with a form. Use Switch for settings that apply immediately without a separate submit action."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible label associated with the native checkbox." },
      { name: "checked", type: "boolean", description: "Controlled checked state." },
      { name: "defaultChecked", type: "boolean", description: "Uncontrolled initial checked state." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Sets native indeterminate property." },
      { name: "disabled", type: "boolean", default: "false", description: "Native disabled state." },
      { name: "aria-invalid", type: "boolean", description: "Error state when composed with FormField validation." }
    ],
    reactExample: `import { Checkbox } from "@/components/ui/Checkbox";

export function Example() {
  return <Checkbox label="Email me product updates" defaultChecked />;
}`
  },
  {
    slug: "radio",
    name: "Radio",
    category: "Forms",
    summary: "Radio is a native radio button for a single option inside a mutually exclusive group.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Radio \u2014 Value \xD7 State (8 variants)",
    documentationUrl: getComponentDocumentationUrl("radio"),
    supportedVariants: ["unselected", "selected", "disabled", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/focus-ring"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Radio.tsx", "components/ui/radio.module.css"],
    cssTokens: [
      "--control-radio-size",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-action-primary",
      "--semantic-border-default",
      "--semantic-border-disabled",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-surface-disabled",
      "--semantic-text-danger",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--surface-fill-control"
    ],
    relatedComponents: [
      { label: "Radio Group \u2014 group label and selection management", href: "/components/radio-group" },
      { label: "Select \u2014 long option lists", href: "/components/select" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    openQuestions: [
      "Radio indicator remains circular in all shape personalities by design."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Radio = native input[type=radio] + inline label text.",
    keyboardBehavior: "Arrow keys move selection within a named group using native radio behavior.",
    comparisons: [],
    apiProps: [
      { name: "label", type: "string", description: "Visible option label." },
      { name: "name", type: "string", description: "Shared group name \u2014 required for grouping." },
      { name: "value", type: "string", description: "Option value." },
      { name: "checked", type: "boolean", description: "Controlled selected state." },
      { name: "disabled", type: "boolean", default: "false", description: "Native disabled state." }
    ],
    reactExample: `import { Radio } from "@/components/ui/Radio";

export function Example() {
  return <Radio name="plan" value="pro" label="Pro" defaultChecked />;
}`
  },
  {
    slug: "radio-group",
    name: "Radio Group",
    category: "Forms",
    summary: "Radio Group is an accessible grouping layer for mutually exclusive radio options with legend, helper text, and errors.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "partial",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Radio \u2014 composed as a named set",
    documentationUrl: getComponentDocumentationUrl("radio-group"),
    supportedVariants: ["default", "disabled", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/focus-ring",
      "semantic/action/danger",
      "semantic/text/danger"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts"],
    registryDependencies: ["@skrewww/radio", "@skrewww/validation-message", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/RadioGroup.tsx"],
    relatedComponents: [
      { label: "Radio \u2014 individual option control", href: "/components/radio" },
      { label: "Select \u2014 hidden long option lists", href: "/components/select" },
      { label: "Form Field \u2014 shared validation pattern", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    openQuestions: [
      "Figma documents Radio variants but not a separate Radio Group component frame \u2014 group behavior inferred from accessibility requirements."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "RadioGroup = fieldset + legend + Radio options + helper or ValidationMessage.",
    keyboardBehavior: "Native radio group arrow-key navigation within the shared name.",
    comparisons: [
      {
        title: "When should a Select be used instead of a Radio Group?",
        body: "Use Radio Group when every option should remain visible and the list is short (roughly 2\u20136 items). Use Select when space is limited or the list is too long to scan comfortably."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Group label rendered as legend." },
      { name: "options", type: "{ value, label, disabled? }[]", description: "Radio options in the group." },
      { name: "value", type: "string", description: "Controlled selected value." },
      { name: "defaultValue", type: "string", description: "Initial uncontrolled value." },
      { name: "error", type: "string", description: "Group-level validation message." }
    ],
    reactExample: `import { RadioGroup } from "@/components/ui/RadioGroup";

export function Example() {
  return (
    <RadioGroup
      label="Billing cycle"
      defaultValue="monthly"
      options={[
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly" },
      ]}
    />
  );
}`
  },
  {
    slug: "switch",
    name: "Switch",
    category: "Forms",
    summary: "Switch is a boolean settings control for immediate on/off changes \u2014 not a substitute for Checkbox in forms.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Switch \u2014 Value (Off/On) \xD7 State (8 variants)",
    documentationUrl: getComponentDocumentationUrl("switch"),
    supportedVariants: ["off", "on", "disabled"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/border/strong",
      "semantic/action/primary",
      "semantic/surface/default",
      "semantic/focus-ring"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Switch.tsx", "components/ui/switch.module.css"],
    cssTokens: [
      "--control-gap",
      "--control-switch-thumb-offset",
      "--control-switch-thumb-size",
      "--control-switch-track-height",
      "--control-switch-track-width",
      "--opacity-disabled",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--semantic-text-primary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Checkbox \u2014 form and multi-select choices", href: "/components/checkbox" },
      { label: "Form Field \u2014 settings section descriptions", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    // Geometry verified against the canonical Figma contract (2026-09):
    // 40×24 track, 18×18 thumb, 2px inset, 18px travel, 8px label gap,
    // Shape-aware Track via the shared runtime radius token, Thumb always
    // circular. No longer an open question.
    openQuestions: ["Switch surfaces remain functionally flat in Gradient/Glass modes."],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Switch = role=switch button + track + thumb + visible label.",
    keyboardBehavior: 'Space and Enter activate the native button, which toggles aria-checked through click handling. type="button" prevents form submission.',
    comparisons: [
      {
        title: "What is the difference between Checkbox and Switch?",
        body: "Checkbox records a choice that usually submits with a form. Switch applies a setting immediately, such as notifications or theme preferences."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Accessible name via aria-labelledby." },
      { name: "checked", type: "boolean", description: "Controlled on state." },
      { name: "defaultChecked", type: "boolean", description: "Initial uncontrolled on state." },
      { name: "disabled", type: "boolean", default: "false", description: "Prevents toggling." }
    ],
    reactExample: `import { Switch } from "@/components/ui/Switch";

export function Example() {
  return <Switch label="Email notifications" defaultChecked />;
}`
  },
  {
    slug: "textarea",
    name: "Textarea",
    category: "Forms",
    summary: "Textarea is a multi-line native textarea for longer free-text content, composed with FormField for label and validation.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Textarea \u2014 State \xD7 Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("textarea"),
    supportedVariants: ["default", "error", "disabled", "read-only"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/focus-ring",
      "semantic/surface/default"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/text-input.module.css",
      "public/right-bottom-icon.svg"
    ],
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Textarea.tsx", "components/ui/textarea.module.css"],
    cssTokens: [
      "--control-padding-x-lg",
      "--control-padding-x-md",
      "--control-padding-x-sm",
      "--control-textarea-min-height-lg",
      "--control-textarea-min-height-md",
      "--control-textarea-min-height-sm"
    ],
    relatedComponents: [
      { label: "Form Field \u2014 label and validation placement", href: "/components/form-field" },
      { label: "Text Input \u2014 single-line counterpart", href: "/components/text-input" },
      { label: "Validation Message \u2014 typed inline feedback", href: "/components/validation-message" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "Minimum height uses temporary tokens \u2014 Figma has no numeric height property.",
      "Vertical resize enabled as temporary default pending Figma confirmation."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Textarea = native textarea with shared field border/radius tokens. FormField supplies label and validation.",
    keyboardBehavior: "Native textarea keyboard behavior. Tab moves focus in and out.",
    comparisons: [
      {
        title: "When should I use Textarea instead of Text Input?",
        body: "Use Textarea when users need multiple lines \u2014 descriptions, comments, or messages. Text Input is for single-line values."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "rows", type: "number", default: "4", description: "Initial visible row count." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Control sizing token set." },
      { name: "readOnly", type: "boolean", description: "Focusable but not editable." },
      { name: "error", type: "string", description: "Validation message rendered through FormField." }
    ],
    reactExample: `import { Textarea } from "@/components/ui/Textarea";

export function Example() {
  return (
    <Textarea
      label="Description"
      placeholder="Tell us about your project\u2026"
      supportingText="Plain text only."
      rows={4}
    />
  );
}`
  },
  {
    slug: "select",
    name: "Select",
    category: "Forms",
    summary: "Select is a combobox-style single-select with a Popover listbox trigger and hidden native select for form submission.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Select \u2014 State \xD7 Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("select"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/icon/muted",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts", "components/ui/text-input.module.css"],
    registryDependencies: ["@skrewww/form-field", "@skrewww/popover", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Select.tsx", "components/ui/select.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-md",
      "--glass-mix-md",
      "--glass-mix-md-fallback",
      "--popover-border",
      "--popover-elevation",
      "--popover-surface",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-elevated",
      "--semantic-surface-subtle",
      "--semantic-text-disabled",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Form Field \u2014 label and validation placement", href: "/components/form-field" },
      { label: "Radio Group \u2014 visible mutually exclusive options", href: "/components/radio-group" },
      { label: "Combobox \u2014 searchable predefined option selection", href: "/components/combobox" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "Decorative CaretDown icon overlays native appearance:none styling."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Select = combobox trigger + Popover listbox + hidden native select + FormField label/validation.",
    keyboardBehavior: "Combobox opens the listbox. Arrow keys, Home, and End move between options. Native select remains for form fallback.",
    comparisons: [
      {
        title: "Why is this not a Combobox?",
        body: "Select preserves a non-editable trigger and native select fallback. Combobox is the searchable editable input for long predefined lists."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "options", type: "SelectOption[]", description: "Flat list of value/label pairs." },
      { name: "placeholder", type: "string", description: "Empty disabled hidden placeholder option." },
      { name: "required", type: "boolean", description: "Requires a non-placeholder selection." },
      { name: "error", type: "string", description: "Validation message rendered through FormField." }
    ],
    reactExample: `import { Select } from "@/components/ui/Select";

export function Example() {
  return (
    <Select
      label="Role"
      placeholder="Choose a role"
      options={[
        { value: "viewer", label: "Viewer" },
        { value: "editor", label: "Editor" },
      ]}
    />
  );
}`
  },
  {
    slug: "combobox",
    name: "Combobox",
    category: "Forms",
    summary: "Combobox is an editable searchable single-select with a filterable listbox \u2014 distinct from non-searchable Select and query-only Search Field.",
    status: "beta",
    version: "0.2.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: "2026-08-31",
    figmaReference: "Forms / Combobox \u2014 State (5 variants)",
    figmaSourceUrl: COMBOBOX_FIGMA_FILE_URL,
    figmaNodeId: COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID ?? void 0,
    documentationUrl: getComponentDocumentationUrl("combobox"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "combobox/popup-surface",
      "menu/surface",
      "menu/border",
      "component/menu/item-hover",
      "combobox/option-active-surface",
      "combobox/option-selected-surface",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/text-input.module.css",
      "components/ui/internal/combobox-filter.ts",
      "components/ui/internal/combobox-list-status.ts",
      "components/ui/internal/combobox-keyboard.ts",
      "components/ui/internal/combobox-scroll.ts"
    ],
    registryDependencies: ["@skrewww/form-field", "@skrewww/popover", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Combobox.tsx", "components/ui/combobox.module.css"],
    cssTokens: [
      "--combobox-empty-min-height",
      "--combobox-empty-padding",
      "--combobox-empty-text",
      "--combobox-icon",
      "--combobox-option-active-surface",
      "--combobox-option-disabled-text",
      "--combobox-option-height",
      "--combobox-option-padding",
      "--combobox-option-radius",
      "--combobox-option-selected-surface",
      "--combobox-option-text",
      "--combobox-popup-border",
      "--combobox-popup-elevation",
      "--combobox-popup-max-height",
      "--combobox-popup-padding",
      "--combobox-popup-radius",
      "--combobox-popup-surface",
      "--component-surface-backdrop-filter",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg",
      "--semantic-focus-ring"
    ],
    relatedComponents: [
      { label: "Select \u2014 non-searchable predefined choice", href: "/components/select" },
      { label: "Search Field \u2014 query input without option picking", href: "/components/search-field" },
      { label: "Form Field \u2014 label and validation placement", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "menu/surface", href: "/foundations" },
      { label: "component/menu/item-hover", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "No multi-select / chips mode \u2014 Figma Multi-select property was removed 2026-07-15 to match React single-select.",
      "Option leading icons and descriptions remain out of scope for ComboboxOption.",
      "Remote/async fetching is not implemented.",
      "Free-form custom values are not supported \u2014 closed predefined option list only.",
      "Diacritic-insensitive filtering is not implemented \u2014 locale lowercase only."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Combobox = editable text input + filterable Popover listbox + hidden submitted value + FormField label/validation.",
    keyboardBehavior: "Focus remains in the input. Arrow keys move aria-activedescendant. Enter commits the active option. Escape closes without clearing. Tab closes without implicit selection.",
    focusBehavior: "DOM focus stays in the native text input; active option is exposed with aria-activedescendant.",
    dismissalBehavior: "Outside pointer, Escape, and Tab close the listbox without trapping focus or submitting arbitrary text.",
    announcementBehavior: "Polite role=status region announces on open, when results become empty, and when results return after empty. No role=option for empty rows.",
    comparisons: [
      {
        title: "What is the difference between Combobox and Select?",
        body: "Select uses a button-like combobox trigger with a non-editable display label. Combobox uses an editable input to filter predefined options."
      },
      {
        title: "What is the difference between Combobox and Search Field?",
        body: "Search Field captures a query string. Combobox commits one predefined option value for forms and selection workflows."
      },
      {
        title: "Does Combobox allow custom values?",
        body: "No in Beta. Unmatched blur text reverts to the last committed option label rather than creating a new value."
      },
      {
        title: "How does blur matching work?",
        body: "Case-insensitive exact label match commits one unique option. Duplicate labels never commit on blur. Disabled options never commit on blur."
      },
      {
        title: "How are no-results announced?",
        body: "A polite visually hidden status region announces when the list opens, when results become empty, and when results return \u2014 not on every keystroke."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "options", type: "ComboboxOption[]", description: "Predefined value/label pairs." },
      { name: "value", type: "string", description: "Controlled selected option value." },
      { name: "inputValue", type: "string", description: "Controlled input text while editing." },
      { name: "open", type: "boolean", description: "Controlled popup open state." },
      { name: "filterMode", type: '"prefix" | "substring"', default: '"prefix"', description: "Local filtering strategy." },
      { name: "required", type: "boolean", description: "Requires a committed option value." }
    ],
    reactExample: `"use client";

import { Combobox } from "@/components/ui/Combobox";

export function Example() {
  return (
    <Combobox
      label="Country"
      name="country"
      placeholder="Search countries"
      options={[
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
      ]}
    />
  );
}`
  },
  {
    slug: "search-field",
    name: "Search Field",
    category: "Forms",
    summary: "Search Field is a search-specific text field with leading magnifying-glass icon and optional clear action \u2014 built on shared text-input control behavior.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Search Field \u2014 State \xD7 Size (12 variants)",
    figmaSourceUrl: SEARCH_FIELD_FIGMA_FILE_URL,
    figmaNodeId: SEARCH_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("search-field"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/icon/muted",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css"
    ],
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/SearchField.tsx", "components/ui/search-field.module.css"],
    cssTokens: [
      "--component-surface-content-muted",
      "--opacity-disabled",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-subtle",
      "--semantic-text-primary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Text Input \u2014 general single-line entry", href: "/components/text-input" },
      { label: "Form Field \u2014 label and validation placement", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "No autocomplete, suggestions, or result popover in this phase.",
      "Escape clears the field when a value is present and showClear is enabled."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "SearchField = FormField + search input + MagnifyingGlass icon + optional clear button.",
    keyboardBehavior: "Native search input behavior. Escape clears when enabled. Clear button is a separate focusable control.",
    comparisons: [
      {
        title: "Search Field vs Text Input with a leading icon",
        body: "Search Field is the documented Figma component for search/filter use cases. It adds search semantics, the approved icon, and optional clear behavior without duplicating TextInput implementation."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "showClear", type: "boolean", default: "true", description: "Shows clear button when value is non-empty." },
      { name: "onValueChange", type: "(value: string) => void", description: "Controlled value change callback." },
      { name: "error", type: "string", description: "Validation message rendered through FormField." }
    ],
    reactExample: `import { SearchField } from "@/components/ui/SearchField";

export function Example() {
  return (
    <SearchField
      label="Search components"
      placeholder="Search the design system\u2026"
      defaultValue=""
    />
  );
}`
  },
  {
    slug: "credit-card-field",
    name: "Credit Card Field",
    category: "Forms",
    summary: "Credit Card Field is a compound UI control for card number, expiry, and CVC in one shell \u2014 visual pattern only, not a payment processor or PCI vault.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "Forms / Credit Card Field \u2014 State Default/Focused/Error/Disabled (4)",
    figmaSourceUrl: CREDIT_CARD_FIELD_FIGMA_FILE_URL,
    figmaNodeId: CREDIT_CARD_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("credit-card-field"),
    supportedVariants: ["default", "focused", "error", "disabled"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/focus-ring",
      "semantic/action/danger",
      "semantic/text/primary",
      "semantic/text/secondary",
      "color/neutral/200"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts", "lib/credit-card-field-format.ts"],
    registryDependencies: ["@skrewww/validation-message", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/CreditCardField.tsx", "components/ui/credit-card-field.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--control-font-size-md",
      "--control-height-md",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--primitive-color-neutral-200",
      "--semantic-action-danger",
      "--semantic-border-default",
      "--semantic-border-disabled",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-disabled",
      "--semantic-text-danger",
      "--semantic-text-disabled",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-control",
      "--squircle-clip-path-control",
      "--surface-fill-control"
    ],
    relatedComponents: [
      { label: "Text Input \u2014 single-line field chrome family", href: "/components/text-input" },
      { label: "Form Field \u2014 label/description/error pattern", href: "/components/form-field" },
      { label: "Validation Message \u2014 error text", href: "/components/validation-message" }
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "Figma default TEXT shows masked demo digits (\u2022\u2022\u2022\u2022) \u2014 React does not mask PANs; apps must not treat UI masking as security.",
      "No Size axis in Figma \u2014 shell matches Text Input md height.",
      "Production card capture should prefer hosted/tokenized provider fields; this component is the visual pattern only."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "CreditCardField = fieldset/legend + shared shell (generic CreditCard icon + number input + divider + expiry input + divider + CVC input) + optional supporting/error text.",
    keyboardBehavior: "Standard text editing in each segment. Tab moves between number, expiry, and CVC. Shell focus-within shows the Focused chrome.",
    focusBehavior: "Focus ring is on the shared shell (:focus-within), matching Figma State=Focused. Segments themselves do not draw a second ring.",
    comparisons: [
      {
        title: "Is this a payment integration?",
        body: "No. It does not tokenize, authorize, store, or transmit card data. Prefer Stripe Elements / equivalent hosted fields for PCI-sensitive capture."
      },
      {
        title: "Does it detect Visa/Mastercard?",
        body: "No. Figma uses a generic Icon/CreditCard deliberately \u2014 network logos are not reproduced."
      }
    ],
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible fieldset legend for the compound control."
      },
      {
        name: "value",
        type: "{ number: string; expiry: string; cvc: string }",
        description: "Controlled digit-only values (no spaces/slash). Display formatting is presentation-only."
      },
      {
        name: "defaultValue",
        type: "{ number: string; expiry: string; cvc: string }",
        description: "Uncontrolled initial digit-only values."
      },
      {
        name: "onValueChange",
        type: "(value: { number; expiry; cvc }) => void",
        description: "Fires with digit-only values after edits/paste."
      },
      {
        name: "numberLabel",
        type: "string",
        default: '"Card number"',
        description: "Accessible name for the number segment."
      },
      {
        name: "expiryLabel",
        type: "string",
        default: '"Expiry"',
        description: "Accessible name for the expiry segment."
      },
      {
        name: "cvcLabel",
        type: "string",
        default: '"CVC"',
        description: "Accessible name for the CVC segment."
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables all segments and dims the shell."
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only segments; shell remains interactive for focus."
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Marks the group and each segment required."
      },
      {
        name: "error",
        type: "string",
        description: "Error message; sets invalid chrome on the shared shell."
      },
      {
        name: "supportingText",
        type: "string",
        description: "Help text when no error is present."
      }
    ],
    reactExample: `import { useState } from "react";
import { CreditCardField } from "@/components/ui/CreditCardField";

export function Example() {
  const [value, setValue] = useState({ number: "", expiry: "", cvc: "" });
  return (
    <CreditCardField
      label="Card details"
      value={value}
      onValueChange={setValue}
      supportingText="UI pattern only \u2014 use a payment provider for real card capture."
    />
  );
}`
  },
  {
    slug: "phone-number-field",
    name: "Phone Number Field",
    category: "Forms",
    summary: "Phone Number Field pairs a country/dial-code selector with a phone number input \u2014 UI pattern only, not SMS verification or carrier lookup.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "Forms / Phone Number Field \u2014 State Default/Focused/Error/Disabled (4)",
    figmaSourceUrl: PHONE_NUMBER_FIELD_FIGMA_FILE_URL,
    figmaNodeId: PHONE_NUMBER_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("phone-number-field"),
    supportedVariants: ["default", "focused", "error", "disabled"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/focus-ring",
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/text/danger",
      "semantic/surface/default"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "lib/phone-number-field-countries.ts"
    ],
    registryDependencies: ["@skrewww/select", "@skrewww/validation-message", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/PhoneNumberField.tsx", "components/ui/phone-number-field.module.css"],
    cssTokens: [
      "--primitive-color-neutral-300",
      "--primitive-color-neutral-500",
      "--semantic-border-default",
      "--semantic-surface-default",
      "--semantic-text-danger",
      "--semantic-text-primary",
      "--semantic-text-secondary"
    ],
    relatedComponents: [
      { label: "Select \u2014 country / dial-code control", href: "/components/select" },
      { label: "Text Input \u2014 number segment chrome family", href: "/components/text-input" },
      { label: "Form Field \u2014 label/description/error pattern", href: "/components/form-field" },
      { label: "Validation Message \u2014 error text", href: "/components/validation-message" }
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "Figma flag is a generic two-stripe placeholder \u2014 React keeps it decorative (aria-hidden); country identity comes from Select option text.",
      "Default country list is illustrative (12 entries) \u2014 pass `countries` for production datasets.",
      "No national formatting engine \u2014 sanitization only allows digits and common phone punctuation."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "PhoneNumberField = fieldset/legend + Country Selector (decorative flag placeholder + Select dial-code) + Number Input (type=tel) + optional supporting/error text.",
    keyboardBehavior: "Tab moves between country Select and phone number input. Select opens listbox with arrow keys; number input uses standard text editing.",
    focusBehavior: "Each control owns its own focus chrome (Select trigger / Text Input), matching Figma\u2019s two adjacent bordered controls.",
    comparisons: [
      {
        title: "Does this verify the phone number?",
        body: "No. It does not send SMS, check ownership, look up carriers, or confirm reachability. It is a UI input pattern only."
      },
      {
        title: "Are the flags real national flags?",
        body: "No. Figma and React use a generic two-stripe placeholder. Accessible country identity is the Select option label (name + dial code)."
      }
    ],
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible fieldset legend for the compound control."
      },
      {
        name: "country",
        type: "string",
        description: "Controlled country option value (e.g. ISO alpha-2)."
      },
      {
        name: "defaultCountry",
        type: "string",
        description: "Uncontrolled initial country option value."
      },
      {
        name: "onCountryChange",
        type: "(country: string) => void",
        description: "Fires when the selected country changes."
      },
      {
        name: "value",
        type: "string",
        description: "Controlled phone number string (sanitized punctuation allowed)."
      },
      {
        name: "defaultValue",
        type: "string",
        description: "Uncontrolled initial phone number string."
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Fires with the sanitized phone number after edits/paste."
      },
      {
        name: "countries",
        type: "PhoneCountryOption[]",
        description: "Country options ({ value, dialCode, label }). Defaults to a small illustrative list."
      },
      {
        name: "countryLabel",
        type: "string",
        default: '"Country"',
        description: "Accessible name for the country selector."
      },
      {
        name: "numberLabel",
        type: "string",
        default: '"Phone number"',
        description: "Accessible name for the phone number input."
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Phone number"',
        description: "Placeholder for the number input."
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables country selector and number input."
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only number input; country selector is non-editable."
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Marks the group and both controls required."
      },
      {
        name: "error",
        type: "string",
        description: "Error message; sets invalid chrome on both controls."
      },
      {
        name: "supportingText",
        type: "string",
        description: "Help text when no error is present."
      }
    ],
    reactExample: `import { useState } from "react";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";

export function Example() {
  const [country, setCountry] = useState("US");
  const [value, setValue] = useState("");
  return (
    <PhoneNumberField
      label="Mobile number"
      country={country}
      onCountryChange={setCountry}
      value={value}
      onValueChange={setValue}
      supportingText="UI pattern only \u2014 not SMS verification or carrier lookup."
    />
  );
}`
  },
  {
    slug: "number-input",
    name: "Number Input",
    category: "Forms",
    summary: "Number Input is direct numeric entry with optional steppers and min/max/step \u2014 not currency, quantity business logic, or a Slider.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "None yet \u2014 React-first CE-2B; Figma master pending",
    documentationUrl: getComponentDocumentationUrl("number-input"),
    supportedVariants: ["default", "error", "disabled", "readOnly"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/focus-ring",
      "semantic/icon/muted",
      "semantic/action/danger",
      "semantic/text/primary",
      "semantic/text/secondary"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "lib/number-input-value.ts"
    ],
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/NumberInput.tsx", "components/ui/number-input.module.css"],
    cssTokens: [
      "--opacity-disabled",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-subtle",
      "--semantic-text-primary"
    ],
    relatedComponents: [
      { label: "Text Input \u2014 field chrome family", href: "/components/text-input" },
      { label: "Form Field \u2014 label/description/error", href: "/components/form-field" },
      { label: "Slider \u2014 bounded visual numeric adjustment", href: "/components/slider" },
      { label: "Validation Message \u2014 error text", href: "/components/validation-message" }
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "Figma master not created yet \u2014 intentional React-first CE-2 sequence; design follow-up later.",
      "Locale/currency formatting explicitly out of scope for 0.1.0-beta."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "NumberInput = FormField + TextInputControl (type=text, role=spinbutton) + optional Increment/Decrement stepper buttons.",
    keyboardBehavior: "Type digits/decimal/minus. Arrow Up/Down step by `step`. Enter commits. Blur clamps/snaps to min/max/step. Intermediate drafts (-, 1.) allowed while focused.",
    focusBehavior: "Focus ring on the text control. Stepper buttons are mouse/pointer aids (tabIndex=-1) and do not steal focus from the input.",
    comparisons: [
      {
        title: "Number Input vs Slider?",
        body: "Use Number Input for direct numeric entry and stepping. Use Slider when a bounded visual adjustment is the primary interaction."
      },
      {
        title: "Is this a currency field?",
        body: "No. There is no locale, currency symbol, or money-precision API. Build currency on top of app logic, not this primitive."
      },
      {
        title: "Why not input type=number?",
        body: "Native number inputs have inconsistent spinner chrome, awkward intermediate values, and weaker styling control. Skrewww uses text + spinbutton ARIA with optional steppers."
      }
    ],
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible Form Field label."
      },
      {
        name: "value",
        type: "number | null",
        description: "Controlled value. null means empty."
      },
      {
        name: "defaultValue",
        type: "number | null",
        description: "Uncontrolled initial value. null means empty."
      },
      {
        name: "onValueChange",
        type: "(value: number | null) => void",
        description: "Fires when the committed numeric value changes."
      },
      {
        name: "min",
        type: "number",
        description: "Minimum. Applied on blur/step/arrows, not every keystroke."
      },
      {
        name: "max",
        type: "number",
        description: "Maximum. Applied on blur/step/arrows, not every keystroke."
      },
      {
        name: "step",
        type: "number",
        default: "1",
        description: "Step size for arrows and steppers; used for snap on commit."
      },
      {
        name: "showSteppers",
        type: "boolean",
        default: "true",
        description: "Shows increment/decrement controls."
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Control size matching Text Input."
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables input and steppers."
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only input; steppers disabled."
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Marks the field required."
      },
      {
        name: "error",
        type: "string",
        description: "Error message via Form Field."
      },
      {
        name: "supportingText",
        type: "string",
        description: "Help text when no error is present."
      }
    ],
    reactExample: `import { useState } from "react";
import { NumberInput } from "@/components/ui/NumberInput";

export function Example() {
  const [value, setValue] = useState<number | null>(1);
  return (
    <NumberInput
      label="Quantity"
      value={value}
      onValueChange={setValue}
      min={0}
      max={99}
      step={1}
      supportingText="Direct numeric entry \u2014 not currency formatting."
    />
  );
}`
  },
  {
    slug: "date-picker",
    name: "Date Picker",
    category: "Forms",
    summary: "Date Picker is a date-only field with editable D MMM YYYY text entry (en-GB) and calendar popover for single-date selection.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / Date Picker \u2014 text-input-style trigger + calendar popover",
    figmaSourceUrl: DATE_PICKER_FIGMA_FILE_URL,
    figmaNodeId: DATE_PICKER_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("date-picker"),
    supportedVariants: ["single-date"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/icon/muted",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "components/ui/internal/calendar-date.ts"
    ],
    registryDependencies: ["@skrewww/calendar-grid", "@skrewww/popover", "@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/DatePicker.tsx", "components/ui/date-picker.module.css"],
    cssTokens: [
      "--calendar-grid-width",
      "--date-picker-trigger-icon-size",
      "--glass-backdrop-filter-md",
      "--glass-mix-md",
      "--glass-mix-md-fallback",
      "--opacity-disabled",
      "--popover-border",
      "--popover-elevation",
      "--popover-surface",
      "--popover-viewport-padding",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Calendar Grid \u2014 month selection surface", href: "/components/calendar-grid" },
      { label: "Calendar Day \u2014 day cell building block", href: "/components/calendar-day" },
      { label: "Form Field \u2014 label and validation wrapper", href: "/components/form-field" },
      { label: "Popover \u2014 non-modal calendar shell", href: "/components/popover" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    openQuestions: [
      "Custom formatDate/parseDate pairs override locale display when both are provided."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Date Picker composes FormField + editable text input + calendar button + Popover + Calendar Grid + hidden YYYY-MM-DD input.",
    keyboardBehavior: "Calendar button opens the popover. Text field accepts D MMM YYYY entry (blur/Enter to commit). Calendar Grid handles day navigation. Escape closes and restores trigger focus.",
    focusBehavior: "Opening moves focus into Calendar Grid on the selected date, today, or first day of visible month.",
    dismissalBehavior: "Escape closes with focus restoration. Outside pointer closes without stealing clicked-target focus. Date selection closes the popover.",
    comparisons: [
      {
        title: "Should Date Picker allow direct text entry?",
        body: "Yes \u2014 the text field accepts D MMM YYYY (en-GB only, e.g. 11 Jul 2026). Invalid, out-of-range, or disabled dates show a visible validation error. Numeric regional formats are not accepted."
      },
      {
        title: "How is the selected date submitted in a form?",
        body: "A hidden input submits canonical YYYY-MM-DD. Display text is not submitted."
      },
      {
        title: "What is the difference between Date Picker and Calendar Grid?",
        body: "Calendar Grid is the month selection surface. Date Picker wraps it in a labelled field with popover trigger behavior."
      },
      {
        title: "How does Date Picker avoid time-zone date shifts?",
        body: "Values are stored and submitted as date-only YYYY-MM-DD strings using local calendar arithmetic \u2014 never UTC midnight conversion."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Field label via FormField." },
      { name: "value", type: "YYYY-MM-DD", description: "Controlled selected date." },
      { name: "defaultValue", type: "YYYY-MM-DD", description: "Initial selected date." },
      { name: "onValueChange", type: "(date) => void", description: "Selection callback." },
      { name: "name", type: "string", description: "Hidden input name for form submission." },
      { name: "required", type: "boolean", description: "Required field indicator." },
      { name: "disabled", type: "boolean", description: "Prevents opening and submission." },
      { name: "readOnly", type: "boolean", description: "Prevents editing and opening while remaining perceivable." },
      { name: "error", type: "string", description: "Validation message via FormField." },
      { name: "minDate", type: "YYYY-MM-DD", description: "Earliest selectable date, inclusive." },
      { name: "maxDate", type: "YYYY-MM-DD", description: "Latest selectable date, inclusive." },
      { name: "isDateDisabled", type: "(date) => boolean", description: "Additional disabled-date predicate." }
    ],
    reactExample: `import { DatePicker } from "@/components/ui/DatePicker";

export function Example() {
  return (
    <DatePicker
      label="Release date"
      name="release-date"
      defaultValue="2026-07-11"
    />
  );
}`
  },
  {
    slug: "file-upload",
    name: "File Upload",
    category: "Forms",
    summary: "File Upload is a native file input with drag-and-drop dropzone, advisory validation, selected-file list, and multipart form submission \u2014 selection only, not network upload.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE5,
    reactLastUpdated: REACT_DATE5,
    figmaReference: "Forms / File Upload \u2014 State (Empty/Dragging/Filled/Error/Disabled)",
    figmaSourceUrl: FILE_UPLOAD_FIGMA_FILE_URL,
    figmaNodeId: FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID ?? void 0,
    documentationUrl: getComponentDocumentationUrl("file-upload"),
    supportedVariants: ["empty", "dragging", "filled", "error", "disabled"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/card/border",
      "component/file-upload/dragging-surface",
      "component/surface/blur",
      "component/surface/content-muted",
      "opacity/disabled",
      "semantic/action/danger",
      "semantic/action/primary",
      "semantic/icon/danger",
      "semantic/text/danger",
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/border/default",
      "semantic/surface/elevated"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/file-upload-file-list.ts",
      "components/ui/internal/file-upload-validation.ts"
    ],
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/FileUpload.tsx", "components/ui/file-upload.module.css"],
    cssTokens: [
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--component-surface-gradient-overlay",
      "--file-upload-border",
      "--file-upload-border-dragging",
      "--file-upload-border-error",
      "--file-upload-border-style",
      "--file-upload-description-text",
      "--file-upload-dragging-surface",
      "--file-upload-file-name-text",
      "--file-upload-icon",
      "--file-upload-icon-size",
      "--file-upload-item-border",
      "--file-upload-item-padding",
      "--file-upload-item-surface",
      "--file-upload-list-gap",
      "--file-upload-metadata-text",
      "--file-upload-min-height",
      "--file-upload-padding",
      "--file-upload-radius",
      "--file-upload-remove-size",
      "--file-upload-surface",
      "--file-upload-title-text",
      "--opacity-disabled",
      "--primitive-opacity-disabled",
      "--semantic-action-primary",
      "--semantic-border-default",
      "--semantic-focus-ring",
      "--semantic-icon-danger",
      "--semantic-surface-elevated",
      "--semantic-text-danger",
      "--semantic-text-disabled",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Form Field \u2014 label and validation wrapper", href: "/components/form-field" },
      { label: "Validation Message \u2014 inline field feedback", href: "/components/validation-message" },
      { label: "Progress Bar \u2014 deferred consumer-owned upload progress", href: "/components/progress-bar" },
      { label: "Button \u2014 not duplicated; remove uses native button styling", href: "/components/button" }
    ],
    relatedTokens: [
      { label: "component/card/surface", href: "/foundations" },
      { label: "component/card/border", href: "/foundations" },
      { label: "component/file-upload/dragging-surface", href: "/foundations" },
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/action/danger", href: "/foundations" },
      { label: "semantic/icon/danger", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape, sharedConcepts5.surface],
    openQuestions: [
      "Controlled files prop is intentionally unsupported in this MVP.",
      "Upload progress, retry, preview, and async behavior are deferred."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "FileUpload = FormField + native file input overlay + dropzone + selected-file list + remove buttons + polite status region.",
    keyboardBehavior: "Tab reaches the native file input over the dropzone. Enter/Space in the file picker opens the OS chooser. Remove buttons are independently focusable.",
    focusBehavior: "Focus-visible ring appears on the dropzone through :focus-within. Removing the final file returns focus to the file input.",
    announcementBehavior: "Polite status region announces selection, rejection, removal, and clear events \u2014 not every dragenter/dragleave.",
    comparisons: [
      {
        title: "What does File Upload own?",
        body: "File Upload selects, validates, lists, and removes files locally. Your application performs the network upload."
      },
      {
        title: "Does File Upload perform the network upload?",
        body: "No. There are no uploadUrl, autoUpload, or storage props. Consumers read files from onFilesChange, the input, or FormData."
      },
      {
        title: "Can File Upload submit through a native form?",
        body: "Yes. Files submit through the real input[type=file] using native multipart encoding when synchronized via DataTransfer."
      },
      {
        title: "How are rejected files reported?",
        body: "Invalid type, size, or count rejections render as text messages and fire onRejectedFiles once per batch. Valid files in mixed batches are kept."
      },
      {
        title: "Why is server-side validation still required?",
        body: "accept is a picker hint, MIME values can be spoofed, and client size checks are advisory only."
      }
    ],
    apiProps: [
      { name: "name", type: "string", description: "Native file input name for multipart submission." },
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "accept", type: "string", description: "Native accept attribute (MIME, wildcard, or extension)." },
      { name: "multiple", type: "boolean", default: "false", description: "Allows selecting more than one file." },
      { name: "maxFiles", type: "number", description: "Maximum accepted files in multiple mode." },
      { name: "maxSize", type: "number", description: "Maximum file size in bytes." },
      { name: "required", type: "boolean", description: "Native required validation on the file input." },
      { name: "disabled", type: "boolean", description: "Disables selection, drop, and remove actions." },
      { name: "error", type: "string", description: "Consumer-owned field error via FormField." },
      { name: "onFilesChange", type: "(files: File[]) => void", description: "Fires once with accepted files after each replacement selection." },
      { name: "onRejectedFiles", type: "(rejections) => void", description: "Fires once with advisory rejection details." }
    ],
    reactExample: `import { FileUpload } from "@/components/ui/FileUpload";

export function Example() {
  return (
    <FileUpload
      label="Upload documents"
      name="documents"
      accept="image/png,image/jpeg,.pdf"
      multiple
      maxFiles={3}
      maxSize={5_000_000}
      supportingText="PNG, JPG, or PDF up to 5 MB. Your app owns the upload request."
    />
  );
}`
  },
  {
    slug: "slider",
    name: "Slider",
    category: "Forms",
    summary: "Slider is a single-value control for selecting a number within min/max by dragging or keyboard-adjusting a thumb along a track.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-13",
    reactLastUpdated: "2026-09-13",
    figmaReference: "Forms / Slider \u2014 State (Default/Hover/Focused/Disabled)",
    figmaSourceUrl: SLIDER_FIGMA_FILE_URL,
    figmaNodeId: SLIDER_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("slider"),
    supportedVariants: ["default", "hover", "focused", "disabled"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/action/primary-hover",
      "semantic/surface/default",
      "semantic/focus-ring",
      "opacity/disabled"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Slider.tsx", "components/ui/slider.module.css"],
    cssTokens: [
      "--opacity-disabled",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-border-default",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--semantic-text-primary",
      "--slider-control-height",
      "--slider-fill-percent",
      "--slider-thumb-left",
      "--slider-thumb-size",
      "--slider-thumb-stroke",
      "--slider-track-height"
    ],
    relatedComponents: [
      { label: "Progress Bar \u2014 read-only completion, not value selection", href: "/components/progress-bar" },
      { label: "Switch \u2014 boolean settings toggle", href: "/components/switch" },
      { label: "Text Input \u2014 precise numeric entry", href: "/components/text-input" },
      { label: "Form Field \u2014 label and validation composition", href: "/components/form-field" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts5.shape],
    openQuestions: [
      "Figma Style (Success/Warning/Danger) prose in older docs is superseded by verified State variants \u2014 no status-color Style prop in Beta.",
      "Dual-thumb range and vertical orientation are not in the verified Figma component set.",
      "Individual /r manifest deferred to CE-3 \u2014 not part of the current 8-component + foundation distribution cut."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Slider = visible label + role=slider control (track + fill + thumb).",
    keyboardBehavior: "Arrow keys adjust by step; Home/End jump to min/max; Page Up/Down move by ~10% of the range (snapped to step). Pointer drag and track click set the value.",
    focusBehavior: "Focus-visible paints the thumb stroke with semantic/focus-ring and a matching outline ring.",
    comparisons: [
      {
        title: "When should Progress Bar be used instead?",
        body: "Use Progress Bar for read-only completion. Use Slider when the user must choose a value."
      },
      {
        title: "Does Beta Slider support a dual-thumb range?",
        body: "No. The verified Figma set is a single thumb. Range selection is deferred."
      }
    ],
    apiProps: [
      { name: "label", type: "string", description: "Accessible name via aria-labelledby." },
      { name: "value", type: "number", description: "Controlled numeric value." },
      { name: "defaultValue", type: "number", default: "0", description: "Uncontrolled initial value." },
      { name: "onValueChange", type: "(value: number) => void", description: "Fires when the value changes." },
      { name: "min", type: "number", default: "0", description: "Minimum value (aria-valuemin)." },
      { name: "max", type: "number", default: "100", description: "Maximum value (aria-valuemax)." },
      { name: "step", type: "number", default: "1", description: "Increment for keyboard and snapped pointer changes." },
      { name: "disabled", type: "boolean", default: "false", description: "Prevents interaction and dims via opacity/disabled." }
    ],
    reactExample: `import { Slider } from "@/components/ui/Slider";

export function Example() {
  return <Slider label="Volume" defaultValue={40} min={0} max={100} step={1} />;
}`
  }
];

// lib/stepper-figma-metadata.ts
var STEPPER_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2944";
var STEPPER_FIGMA_COMPONENT_SET_NODE_ID = "2024:2944";
var STEPPER_FIGMA_STATES = ["Completed", "Current", "Upcoming"];
var STEPPER_FIGMA_VARIANT_COUNT = STEPPER_FIGMA_STATES.length;

// lib/component-registry-navigation.ts
var sharedConcepts6 = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var REACT_DATE6 = "2026-07-11";
var DOCS_DATE6 = "2026-06-01";
var navigationRegistryEntries = [
  {
    slug: "link",
    name: "Link",
    category: "Actions",
    summary: "Link is semantic navigational text styled as inline or standalone links \u2014 not for primary actions.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: DOCS_DATE6,
    reactLastUpdated: REACT_DATE6,
    figmaReference: "Actions / Link \u2014 Style \xD7 Size \xD7 State (45 variants)",
    documentationUrl: getComponentDocumentationUrl("link"),
    supportedVariants: ["default", "subtle", "danger"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "semantic/text/secondary",
      "semantic/text/primary",
      "semantic/action/primary",
      "semantic/text/danger",
      "semantic/icon/danger",
      "color/brand/700",
      "semantic/focus-ring"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/link-utils.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Link.tsx", "components/ui/link.module.css"],
    cssTokens: [
      "--link-font-size-lg",
      "--link-font-size-md",
      "--link-font-size-sm",
      "--link-icon-gap",
      "--link-text-default",
      "--link-text-hover",
      "--link-underline-offset",
      "--link-underline-thickness",
      "--primitive-color-brand-700",
      "--primitive-color-danger-700",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-focus-ring",
      "--semantic-icon-danger",
      "--semantic-text-danger",
      "--semantic-text-primary",
      "--semantic-text-secondary"
    ],
    relatedComponents: [
      { label: "Button \u2014 primary actions", href: "/components/button" },
      { label: "Breadcrumb \u2014 hierarchical location trail", href: "/components/breadcrumb" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts6.surface],
    openQuestions: [
      "Visited link styling is not confirmed in Figma \u2014 omitted in Beta.",
      "Disabled link styling is not confirmed \u2014 use non-navigating text instead."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Link = semantic anchor + underlined label + optional leading/trailing icon.",
    keyboardBehavior: "Native link focus and activation. Visible focus ring via semantic/focus-ring.",
    comparisons: [
      {
        title: "When should a Link be used instead of a Button?",
        body: "Use Link for navigation that changes location. Use Button for actions that submit, confirm, or mutate state."
      },
      {
        title: "How should external links be identified?",
        body: 'Adjacent text should communicate destination when possible. External targets use safe rel defaults with target="_blank".'
      },
      {
        title: "Why does Subtle Default differ from Figma Secondary?",
        body: "React Subtle Default keeps semantic/text/secondary (#5B5F68) for WCAG AA normal-text contrast. Figma Secondary Default uses content-muted (#A0A3AC), which fails AA on white. Subtle Hover and Pressed use semantic/text/primary (#17181B)."
      }
    ],
    apiProps: [
      { name: "href", type: "string", description: "Destination URL." },
      { name: "variant", type: '"default" | "subtle" | "danger"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Text size." },
      { name: "leadingIcon", type: "ReactNode", description: "Decorative leading icon (React extension; Figma exposes trailing only)." },
      { name: "trailingIcon", type: "ReactNode", description: "Decorative trailing icon." }
    ],
    reactExample: `import { Link } from "@/components/ui/Link";

export function Example() {
  return (
    <p>
      Read the <Link href="/components/button">Button documentation</Link> for action patterns.
    </p>
  );
}`
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    category: "Navigation",
    summary: "Breadcrumb is an ordered hierarchical trail showing location with navigable ancestors and a current-page indicator.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE6,
    reactLastUpdated: REACT_DATE6,
    figmaReference: "Navigation / Breadcrumb \u2014 composed from Breadcrumb Item (Default/Hover/Current)",
    documentationUrl: getComponentDocumentationUrl("breadcrumb"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/secondary",
      "semantic/text/primary",
      "semantic/action/primary"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/link", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Breadcrumb.tsx", "components/ui/breadcrumb.module.css"],
    cssTokens: [
      "--breadcrumb-current-text",
      "--breadcrumb-font-size",
      "--breadcrumb-gap",
      "--breadcrumb-icon-size",
      "--breadcrumb-max-item-width",
      "--breadcrumb-separator",
      "--component-surface-content-muted"
    ],
    relatedComponents: [
      { label: "Link \u2014 inline navigational text", href: "/components/link" },
      { label: "Tabs \u2014 related in-context views", href: "/components/tabs" }
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts6.shape],
    openQuestions: [
      "Collapsed breadcrumb ellipsis is not confirmed in Figma \u2014 deferred."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Breadcrumb = nav landmark + ordered list + ancestor links + current page text.",
    keyboardBehavior: 'Ancestor links are focusable anchors. Current page is plain text with aria-current="page".',
    comparisons: [
      {
        title: "How does Breadcrumb communicate the current page?",
        body: 'The final item renders as text with aria-current="page" and is not a link.'
      },
      {
        title: "What is the difference between Breadcrumb and Stepper?",
        body: "Breadcrumb shows location in a hierarchy. Stepper shows progress through a linear process."
      }
    ],
    apiProps: [
      { name: "items", type: "BreadcrumbItem[]", description: "Trail items with label and optional href." },
      { name: "homeLabel", type: "string", default: '"Home"', description: "Accessible name for icon-only Home." }
    ],
    reactExample: `import { Breadcrumb } from "@/components/ui/Breadcrumb";

export function Example() {
  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "/", home: true },
        { label: "Components", href: "/components" },
        { label: "Breadcrumb" },
      ]}
    />
  );
}`
  },
  {
    slug: "tabs",
    name: "Tabs",
    category: "Navigation",
    summary: "Tabs is a navigation pattern that switches between related in-context views using tablist/tab/tabpanel semantics and roving focus.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE6,
    reactLastUpdated: REACT_DATE6,
    figmaReference: "Navigation / Tabs \u2014 State \xD7 Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("tabs"),
    supportedVariants: ["automatic", "manual"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "semantic/text/secondary",
      "semantic/action/primary",
      "semantic/focus-ring"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts", "components/ui/internal/tab-keyboard.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Tabs.tsx", "components/ui/tabs.module.css"],
    cssTokens: [
      "--semantic-focus-ring",
      "--semantic-text-disabled",
      "--tab-active-indicator",
      "--tab-active-text",
      "--tab-border",
      "--tab-font-size",
      "--tab-gap",
      "--tab-height",
      "--tab-indicator-thickness",
      "--tab-padding-x",
      "--tab-text",
      "--tab-transition-duration"
    ],
    relatedComponents: [
      { label: "Breadcrumb \u2014 hierarchical location", href: "/components/breadcrumb" },
      { label: "Top Nav Item \u2014 primary app navigation", href: "/components/top-nav-item" }
    ],
    relatedTokens: [
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts6.shape, sharedConcepts6.surface],
    openQuestions: [
      "Vertical Tabs orientation is documented in APG but not confirmed as a Figma variant \u2014 horizontal default only."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Tabs = tablist + tab triggers + tabpanels with aria-controls/aria-labelledby.",
    keyboardBehavior: "Arrow keys move focus between tabs. Home/End jump to first/last tab. Automatic activation on focus by default.",
    comparisons: [
      {
        title: "Should Tabs activate automatically or manually?",
        body: "Automatic activation suits immediate lightweight panels. Manual activation suits expensive panel loads."
      },
      {
        title: "What is the difference between Tabs and navigation links?",
        body: "Tabs switch related content in the same context. Links navigate to distinct URLs or destinations."
      }
    ],
    apiProps: [
      { name: "value", type: "string", description: "Controlled active tab value." },
      { name: "defaultValue", type: "string", description: "Initial tab value." },
      { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "Focus activation behavior." }
    ],
    reactExample: `"use client";

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";

export function Example() {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Example tabs">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsPanel value="overview">Overview content</TabsPanel>
      <TabsPanel value="details">Details content</TabsPanel>
    </Tabs>
  );
}`
  },
  {
    slug: "pagination",
    name: "Pagination",
    category: "Navigation",
    summary: "Pagination is a paged navigation control with Previous/Next boundaries, numbered pages, and optional ellipsis.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE6,
    reactLastUpdated: REACT_DATE6,
    figmaReference: "Navigation / Page Item \u2014 canonical Default/Hover/Current/Disabled masters; Pagination Trail is composition-only evidence",
    documentationUrl: getComponentDocumentationUrl("pagination"),
    supportedVariants: ["link", "button"],
    supportedSizes: [],
    tokensUsed: [
      "component/button/primary/background",
      "component/surface/content",
      "component/surface/blur",
      "component/menu/item-hover",
      "component/surface/content-muted",
      "semantic/text/primary",
      "semantic/text/disabled",
      "opacity/disabled",
      "component/radius/control"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/link-utils.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Pagination.tsx", "components/ui/pagination.module.css"],
    cssTokens: [
      "--component-brand-fill-glass",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg",
      "--glass-backdrop-filter-sm",
      "--glass-mix-sm",
      "--glass-mix-sm-fallback",
      "--opacity-disabled",
      "--pagination-border",
      "--pagination-control-size",
      "--pagination-current-surface",
      "--pagination-current-text",
      "--pagination-disabled-text",
      "--pagination-ellipsis-content",
      "--pagination-ellipsis-width",
      "--pagination-font-size",
      "--pagination-gap",
      "--pagination-page-content",
      "--pagination-page-hover-content",
      "--pagination-page-hover-surface",
      "--pagination-page-radius",
      "--pagination-text",
      "--semantic-action-primary",
      "--semantic-border-disabled",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--shape-radius-control",
      "--squircle-clip-path-control"
    ],
    relatedComponents: [
      { label: "Link \u2014 URL-addressable navigation", href: "/components/link" },
      { label: "Spinner \u2014 loading changed results", href: "/components/spinner" }
    ],
    relatedTokens: [
      { label: "component/button/primary/background (Current)", href: "/foundations" },
      { label: "component/menu/item-hover (Hover)", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" },
      { label: "component/surface/content-muted (ellipsis evidence)", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts6.shape, sharedConcepts6.surface],
    openQuestions: [
      "Responsive collapsed pagination is not confirmed in Figma \u2014 sibling/boundary range only.",
      "Previous/Next appear only in the composition example as Secondary Small Icon Button instances; aligning React's textual boundary controls requires a separate public presentation decision."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Pagination = nav landmark + previous + numbered pages + ellipsis + next.",
    keyboardBehavior: "Focusable page links/buttons and boundary controls. Current page is non-interactive text.",
    comparisons: [
      {
        title: "Should Pagination use links or buttons?",
        body: "Use links when pages have real URLs. Use buttons for client-managed collections without addressable pages."
      },
      {
        title: "What is the difference between Pagination and infinite scroll?",
        body: "Pagination exposes discrete pages with explicit current location. Infinite scroll appends content without page landmarks."
      }
    ],
    apiProps: [
      { name: "items", type: "PaginationItem[]", description: "Explicit pagination controls." },
      { name: "onPageChange", type: "(page: number) => void", description: "Button-based page changes." }
    ],
    reactExample: `import { Pagination, buildPaginationItems } from "@/components/ui/Pagination";

export function Example() {
  const items = buildPaginationItems({
    currentPage: 3,
    totalPages: 12,
    hrefBuilder: (page) => \`/results?page=\${page}\`,
  });

  return <Pagination items={items} />;
}`
  },
  {
    slug: "menu",
    name: "Menu",
    category: "Navigation",
    summary: "Menu is a compact command surface for contextual actions \u2014 distinct from Select (form values) and Popover (supplementary content).",
    status: "beta",
    version: "0.4.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE6,
    reactLastUpdated: "2026-08-31",
    figmaReference: "Navigation / Menu Item + Dropdown Trigger \u2014 composed Menu pattern (Dropdown Menu is a usage alias, not a separate component)",
    documentationUrl: getComponentDocumentationUrl("menu"),
    supportedVariants: ["default", "destructive"],
    supportedSizes: [],
    tokensUsed: [
      "menu/surface",
      "menu/border",
      "menu/elevation",
      "menu/backdrop-filter",
      "menu/item-text",
      "menu/item-hover-surface",
      "menu/item-destructive-text",
      "semantic/text/danger",
      "semantic/focus-ring",
      "component/surface/blur"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/menu-typeahead.ts"],
    registryDependencies: ["@skrewww/popover", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Menu.tsx", "components/ui/menu.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg",
      "--menu-backdrop-filter",
      "--menu-border",
      "--menu-elevation",
      "--menu-item-destructive-hover-surface",
      "--menu-item-destructive-text",
      "--menu-item-disabled-text",
      "--menu-item-focused-surface",
      "--menu-item-gap",
      "--menu-item-height",
      "--menu-item-hover-surface",
      "--menu-item-icon",
      "--menu-item-padding",
      "--menu-item-radius",
      "--menu-item-text",
      "--menu-label-padding",
      "--menu-label-text",
      "--menu-max-height",
      "--menu-max-width",
      "--menu-min-width",
      "--menu-padding",
      "--menu-radius",
      "--menu-separator-color",
      "--menu-separator-margin",
      "--menu-shortcut-text",
      "--menu-surface",
      "--menu-viewport-padding",
      "--semantic-focus-ring",
      "--semantic-text-disabled"
    ],
    relatedComponents: [
      { label: "Popover \u2014 supplementary non-command content", href: "/components/popover" },
      { label: "Select \u2014 form field value selection", href: "/components/select" },
      { label: "Button \u2014 primary actions", href: "/components/button" },
      { label: "Menu Item \u2014 Figma building block (compound subcomponent)", href: "/components/menu-item" }
    ],
    relatedTokens: [
      { label: "menu/surface (panel-surface)", href: "/foundations" },
      { label: "menu/border (panel-border)", href: "/foundations" },
      { label: "menu/item-destructive-text", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts6.shape, sharedConcepts6.surface],
    openQuestions: [
      "Checkbox and radio menu items are not confirmed in Figma \u2014 deferred.",
      "Submenus and Context Menu are separate future components.",
      "Dropdown Menu is documented as a usage pattern, not a duplicate public component.",
      "Destructive MenuItem styling is a React-only product contract \u2014 Figma Menu Item has no verified destructive variant."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Menu = trigger button + floating menu surface + menuitem rows with optional icons, shortcuts, groups, labels, and separators.",
    keyboardBehavior: "Arrow Up/Down move between enabled items. Home/End jump to boundaries. Enter and Space activate. Printable keys typeahead-match item labels. Escape closes and restores trigger focus. Tab and Shift+Tab close without trapping focus.",
    focusBehavior: "Roving DOM focus on enabled menuitem elements. Arrow Down/Up from a closed trigger opens and focuses the first/last enabled item.",
    dismissalBehavior: "Closes on item selection (configurable), Escape, outside pointer, and Tab. Background remains interactive \u2014 no modal trap or inert.",
    comparisons: [
      {
        title: "What is the difference between Menu and Popover?",
        body: "Menu contains commands with menuitem semantics and a managed keyboard model. Popover holds supplementary or interactive content without command-list semantics."
      },
      {
        title: "What is the difference between Menu and Select?",
        body: "Select chooses one form field value with combobox/listbox semantics. Menu executes commands and does not submit a single canonical field value."
      },
      {
        title: "Should ordinary navigation links use Menu semantics?",
        body: "No. Persistent navigation belongs in nav landmarks, breadcrumbs, or tabs. Menu is for transient command lists."
      },
      {
        title: "Does Tab move through Menu items?",
        body: "No. Tab closes the Menu and continues normal document focus order."
      }
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      { name: "onOpenChange", type: "(open: boolean) => void", description: "Open state callback." },
      { name: "placement", type: "PopoverPlacement", default: '"bottom"', description: "Preferred placement." },
      { name: "align", type: "PopoverAlign", default: '"start"', description: "Alignment relative to trigger." },
      { name: "loop", type: "boolean", default: "false", description: "Whether arrow navigation wraps." },
      { name: "closeOnSelect", type: "boolean", default: "true", description: "Close after item activation." },
      {
        name: "MenuItem.onSelect",
        type: "(event: Event) => void",
        description: "MenuItem activation callback (not a Menu root prop)."
      }
    ],
    reactExample: `"use client";

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Menu>
      <MenuTrigger>
        <Button type="button">Project actions</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={() => {}}>Edit profile</MenuItem>
        <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem destructive onSelect={() => {}}>
          Delete project
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}`
  },
  {
    slug: "stepper",
    name: "Stepper",
    category: "Navigation",
    summary: "Stepper shows progress through a fixed, known-length, ordered sequence of named steps \u2014 a compound Stepper + Step API built against the verified live Navigation/Step Item component set.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: 'Navigation / Step Item \u2014 State Completed/Current/Upcoming (3); composed "Stepper Trail (example)" frame for multi-step layout/connector reference. No separate Figma "Stepper" component exists.',
    figmaSourceUrl: STEPPER_FIGMA_FILE_URL,
    figmaNodeId: STEPPER_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("stepper"),
    supportedVariants: ["completed", "current", "upcoming"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/action/primary",
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/text/inverse",
      "component/surface/content-muted",
      "radius/full",
      "semantic/focus-ring"
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Stepper.tsx", "components/ui/stepper.module.css"],
    cssTokens: [
      "--component-surface-content-muted",
      "--radius-full",
      "--semantic-action-primary",
      "--semantic-border-default",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--semantic-text-inverse",
      "--semantic-text-primary"
    ],
    relatedComponents: [
      { label: "Progress Bar \u2014 quantitative percentage, not named steps", href: "/components/progress-bar" },
      { label: "Tabs \u2014 peer content views, not sequential progress", href: "/components/tabs" },
      { label: "Breadcrumb \u2014 hierarchy/location, not a fixed sequence", href: "/components/breadcrumb" },
      { label: "Pagination \u2014 page navigation, no completion state", href: "/components/pagination" },
      { label: "Timeline \u2014 open-ended chronological history, not a fixed known-length process", href: "/components/timeline" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [],
    openQuestions: [
      "Narrow-viewport and long (5+ step) sequence behavior is not defined by the verified Figma contract \u2014 Figma's own composed example is a fixed-width demo. Deferred pending real evidence (Reference App).",
      "Vertical orientation is not part of the verified contract \u2014 no orientation axis exists in Figma at all.",
      "Whether onStepClick should be provided by default (fully interactive) versus omitted (read-only) is an app-level product decision Figma does not resolve."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Stepper = ordered list (ol) of Step items, each a 24\xD724px circle indicator (Check icon when Completed, step number when Current/Upcoming) + label, joined by 32\xD71.5px connector rectangles between consecutive steps.",
    keyboardBehavior: "Read-only by default (no onStepClick): steps are not focusable controls. With onStepClick: Completed and Current steps become real buttons in natural Tab order, activated by Enter/Space; Upcoming steps are never focusable or clickable, regardless of onStepClick.",
    focusBehavior: "Natural DOM tab order across interactive (Completed/Current) steps only \u2014 no roving tabindex or arrow-key navigation; Stepper does not use a radiogroup/listbox model. focus-visible ring on interactive steps, offset to avoid clipping.",
    comparisons: [
      {
        title: "What is the difference between Stepper and Progress Bar?",
        body: "Progress Bar shows a raw percentage with no per-step identity. Stepper shows named, discrete steps with Completed/Current/Upcoming state."
      },
      {
        title: "What is the difference between Stepper and Breadcrumb?",
        body: "Breadcrumb shows location in a hierarchy. Stepper shows progress through a linear process \u2014 see also Breadcrumb's own documented distinction."
      },
      {
        title: "What is the difference between Stepper and Timeline?",
        body: 'Timeline is an open-ended chronological log of events. Stepper is a fixed, known-length process with a clear "you are here" progress state \u2014 semantically different despite visual similarity.'
      },
      {
        title: "Does Stepper own routing or wizard state?",
        body: "No. Stepper only derives Completed/Current/Upcoming from currentStep and relays onStepClick(index). The app owns navigation, routing, and advancing currentStep."
      },
      {
        title: "Can Upcoming steps be clicked?",
        body: "Never. Even when onStepClick is provided, only Completed and Current steps become interactive \u2014 Upcoming steps cannot be used to skip ahead."
      }
    ],
    apiProps: [
      {
        name: "currentStep",
        type: "number",
        description: "Zero-based index of the current step. Stepper reads this to derive each Step's status \u2014 it never mutates it."
      },
      {
        name: "onStepClick",
        type: "(index: number) => void",
        description: "Fires when a Completed or Current step is activated. Omit for a fully read-only Stepper. Upcoming steps never fire this."
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the stepper when no visible label exists."
      },
      {
        name: "aria-labelledby",
        type: "string",
        description: "Accessible name reference when a visible label element exists."
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Step children, in order."
      },
      {
        name: "Step.children",
        type: "ReactNode",
        description: "The step's label \u2014 the only content Step accepts (no description/state/orientation prop)."
      }
    ],
    reactExample: `import { useState } from "react";
import { Stepper, Step } from "@/components/ui/Stepper";

export function Example() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <Stepper
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      aria-label="Checkout progress"
    >
      <Step>Account</Step>
      <Step>Shipping</Step>
      <Step>Payment</Step>
      <Step>Complete</Step>
    </Stepper>
  );
}`
  }
];

// lib/button-group-figma-metadata.ts
var BUTTON_GROUP_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2022-1013";
var BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID = "2022:1013";
var BUTTON_GROUP_FIGMA_STYLES = ["Primary", "Secondary", "Danger"];
var BUTTON_GROUP_FIGMA_COUNTS = ["2", "3", "4"];
var BUTTON_GROUP_FIGMA_VARIANT_COUNT = BUTTON_GROUP_FIGMA_STYLES.length * BUTTON_GROUP_FIGMA_COUNTS.length;

// lib/split-button-figma-metadata.ts
var SPLIT_BUTTON_FIGMA_FILE_URL = "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2022-1086";
var SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID = "2022:1086";
var SPLIT_BUTTON_FIGMA_STYLES = ["Primary", "Secondary", "Danger"];
var SPLIT_BUTTON_FIGMA_SIZES = ["Small", "Medium", "Large"];
var SPLIT_BUTTON_FIGMA_VARIANT_COUNT = SPLIT_BUTTON_FIGMA_STYLES.length * SPLIT_BUTTON_FIGMA_SIZES.length;

// lib/component-registry.ts
var sharedConcepts7 = {
  foundations: { label: "Foundations \u2014 token collections", href: "/foundations" },
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape"
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface"
  }
};
var componentRegistry = [
  {
    slug: "button",
    name: "Button",
    category: "Actions",
    summary: "Button is a primary interactive trigger for user actions \u2014 submit, confirm, navigate, or initiate a process.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Actions / Button \u2014 Style \xD7 Size \xD7 State (45 variants)",
    documentationUrl: getComponentDocumentationUrl("button"),
    supportedVariants: ["primary", "secondary", "danger"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "component/button/primary/background",
      "component/button/danger/background",
      "component/button/primary/border",
      "component/button/primary/border-mid",
      "component/button/primary/border-end",
      "component/button/danger/border",
      "component/button/danger/border-mid",
      "component/button/danger/border-end",
      "component/surface/content",
      "component/surface/blur",
      "semantic/action/primary",
      "semantic/action/danger",
      "semantic/surface/default",
      "semantic/text/inverse",
      "semantic/text/primary",
      "semantic/focus-ring",
      "opacity/disabled"
    ],
    // Proof-of-concept for the planned CLI-resolution schema — derived directly
    // from components/ui/Button.tsx and button.module.css, not guessed.
    // Real dependency contract, verified against actual source (2026-08-08):
    // Button's own source imports no third-party npm package of its own —
    // "react"/"react-dom"/"next" are host/framework assumptions, not
    // packages the registry should install (see `hostRequirements`).
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    // lib/cn.ts (class-name join helper), the `LoadingSpinner` export from
    // components/ui/icons.tsx, and button-group-context.ts (Button reads
    // useButtonGroupItem() to apply joined-item geometry inside a Button
    // Group / Split Button) — copied alongside Button, never public
    // Skrewww registry components in their own right. The
    // button-group-context.ts entry was added in CE-3H after a real
    // consumer smoke test (empty-state, which composes Button) surfaced
    // a "Module not found" build failure — Button.tsx has imported this
    // context since CE-1B, but it was never declared here.
    internalDependencies: ["lib/cn.ts", "components/ui/icons.tsx", "components/ui/button-group-context.ts"],
    // The shared Foundation resource (universal Primitive/Semantic/Brand/
    // Shape/Surface/control-sizing tier + the shared accessibility utility
    // in styles/foundation.css) — does not have its own registry entry
    // yet; declared here because it is Button's real, verified dependency
    // regardless of whether a transport manifest exists yet.
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/Button.tsx", "components/ui/button.module.css"],
    cssTokens: [
      "--component-brand-fill-glass",
      "--component-button-primary-fill",
      "--component-button-primary-fill-hover",
      "--component-button-primary-fill-hover-glass",
      "--component-button-primary-fill-pressed",
      "--component-button-primary-fill-pressed-glass",
      "--component-button-radius-control",
      "--component-button-secondary-fill-elevated-glass",
      "--component-button-secondary-fill-glass",
      "--component-card-border-highlight-1",
      "--component-card-border-highlight-2",
      "--component-card-border-highlight-3",
      "--component-button-danger-border-end",
      "--component-button-danger-border-mid",
      "--component-button-danger-border-start",
      "--component-button-primary-border-end",
      "--component-button-primary-border-mid",
      "--component-button-primary-border-start",
      "--component-danger-fill",
      "--component-danger-fill-glass",
      "--component-danger-fill-hover",
      "--component-danger-fill-hover-glass",
      "--component-danger-fill-pressed",
      "--component-danger-fill-pressed-glass",
      "--component-surface-content",
      "--component-surface-gradient-overlay",
      "--control-font-size-lg",
      "--control-font-size-md",
      "--control-font-size-sm",
      "--control-gap",
      "--control-height-lg",
      "--control-height-md",
      "--control-height-sm",
      "--control-padding-x-lg",
      "--control-padding-x-md",
      "--control-padding-x-sm",
      "--glass-backdrop-filter-lg",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-action-danger-hover",
      "--semantic-action-danger-pressed",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-action-primary-pressed",
      "--semantic-border-disabled",
      "--semantic-focus-ring",
      "--semantic-surface-disabled",
      "--semantic-surface-default",
      "--semantic-surface-elevated",
      "--semantic-surface-subtle",
      "--semantic-text-disabled",
      "--semantic-text-inverse",
      "--semantic-text-primary",
      "--shape-radius-control",
      "--squircle-clip-path-control",
      "--surface-fill-control"
    ],
    relatedComponents: [
      { label: "Icon Button \u2014 compact icon-only actions", href: "/components/icon-button" },
      { label: "Button Group \u2014 joined related actions", href: "/components/button-group" },
      { label: "Link \u2014 inline navigational text", href: "/components/link" },
      { label: "Split Button \u2014 default action plus menu", href: "/components/split-button" }
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts7.shape, sharedConcepts7.surface],
    openQuestions: [
      "Confirm exact control height and horizontal padding per size from Figma.",
      "Trailing icon is not defined as a separate Figma property on Button \u2014 supported in code for composition; confirm with design.",
      "UNRESOLVED DESIGN REVIEW: Primary Glass Hover dark content can appear visually muddy over high-frequency/complex backgrounds. Current #17181B content and 24% hover fill match live Figma; any readability adjustment must be approved in Figma first."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Button = native button or link + visual surface + content row (optional leading/trailing icon + label). Icons are consumer-supplied nodes; Button does not wrap them in SVG or change their paths.",
    comparisons: [
      {
        title: "How do Button icons get their color?",
        body: "Button sets CSS color only. Primary and Danger use surface-content semantics: inverse/light on Flat and Gradient, dark on Glass. Secondary uses primary text color on every surface. Compatible icons inherit that color through SVG currentColor \u2014 Phosphor defaults fill to currentColor; stroke icons should use stroke=currentColor. Button does not set fill, stroke, or icon-specific paint, and it does not rewrite icon artwork. Any compatible icon inherits the same foreground automatically. Icon-only actions use this same Button with an aria-label; there is no separate Icon Button implementation."
      }
    ],
    apiProps: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "danger"',
        default: '"primary"',
        description: "Visual style mapped to semantic action tokens."
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Control height and typography scale."
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Disables interaction, sets aria-busy, and shows a spinner with screen-reader text."
      },
      {
        name: "fullWidth",
        type: "boolean",
        default: "false",
        description: "Stretches the control to the width of its container."
      },
      {
        name: "leadingIcon",
        type: "ReactNode",
        description: "Optional icon before the label (Figma: Has Icon + Icon)."
      },
      {
        name: "trailingIcon",
        type: "ReactNode",
        description: "Optional icon after the label. Not confirmed as a Figma Button property."
      },
      {
        name: "href",
        type: "string",
        description: "When set, renders as a semantic link (Next.js Link or native anchor for external URLs)."
      },
      {
        name: "target",
        type: "string",
        description: 'Link target. `_blank` automatically adds `rel="noopener noreferrer"` when rel is omitted.'
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Native disabled for buttons; aria-disabled non-navigating link for href variant."
      },
      {
        name: "aria-label",
        type: "string",
        description: "Required accessible name for icon-only buttons."
      }
    ],
    reactExample: `import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Button variant="primary" leadingIcon={<Plus size={16} />} type="button">
      Create project
    </Button>
  );
}`
  },
  {
    slug: "button-group",
    name: "Button Group",
    category: "Actions",
    summary: "Button Group joins related independent Buttons with shared outer chrome and a 2px divider gap \u2014 layout only; each Button keeps its own behavior.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-09-13",
    reactLastUpdated: "2026-09-13",
    figmaReference: "Actions / Button Group \u2014 Style \xD7 Count (9 variants)",
    figmaSourceUrl: BUTTON_GROUP_FIGMA_FILE_URL,
    figmaNodeId: BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("button-group"),
    supportedVariants: ["neutral", "primary", "danger"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "color/brand/700",
      "color/danger/700"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/button-group-context.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ButtonGroup.tsx", "components/ui/button-group.module.css"],
    cssTokens: [
      "--button-group-divider",
      "--component-button-radius-control",
      "--primitive-color-brand-700",
      "--primitive-color-danger-700",
      "--semantic-border-default",
      "--shape-radius-control"
    ],
    relatedComponents: [
      { label: "Button \u2014 each action in the group", href: "/components/button" },
      { label: "Split Button \u2014 primary action plus related menu", href: "/components/split-button" },
      { label: "Tabs \u2014 mutually exclusive view panels", href: "/components/tabs" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts7.shape, sharedConcepts7.surface],
    openQuestions: [
      "Figma description recommends role=radiogroup for mutually exclusive selection; Beta React ships independent Buttons with role=group (CE-1B product decision). Use Toggle Group for exclusive selection.",
      "Vertical orientation, equal-width, and wrapping are not in the verified Figma set.",
      "Squircle Shape on joined children disables per-button squircle clip so shared outer chrome stays coherent."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "ButtonGroup = role=group wrapper (shared border + divider gap + outer radius) + Button children. Divider tone is group chrome only.",
    keyboardBehavior: "Standard Tab order across child Buttons. Enter/Space activate the focused Button. No arrow-key roving focus \u2014 this is not a toolbar or radiogroup.",
    focusBehavior: "Child focus-visible rings are not clipped (group does not use overflow:hidden). Focused child stacks above neighbors (z-index).",
    comparisons: [
      {
        title: "How is Button Group different from Split Button?",
        body: "Button Group arranges multiple independent actions with joined chrome. Split Button pairs one primary default action with a related secondary/menu control \u2014 not Button Group."
      },
      {
        title: "Is Button Group a segmented control?",
        body: "No. Figma labels can look like List/Grid or Day/Week/Month, but Button Group does not implement selection state. Use Toggle Group for exclusive segmented selection (Segmented Control is that presentation, not a separate component)."
      }
    ],
    apiProps: [
      {
        name: "children",
        type: "ReactNode",
        description: "Independent Skrewww Button (or Button-as-link) children."
      },
      {
        name: "divider",
        type: '"neutral" | "primary" | "danger"',
        default: '"neutral"',
        description: "Chrome color in the 2px gap \u2014 matches Figma Style gap fill (neutral=Secondary, primary, danger). Not a Button variant."
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the group when no visible group label exists."
      },
      {
        name: "aria-labelledby",
        type: "string",
        description: "ID of a visible label element for the group."
      }
    ],
    reactExample: `import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";

export function Example() {
  return (
    <ButtonGroup aria-label="View mode" divider="primary">
      <Button variant="primary">List</Button>
      <Button variant="primary">Grid</Button>
    </ButtonGroup>
  );
}`
  },
  {
    slug: "toggle-group",
    name: "Toggle Group",
    category: "Actions",
    summary: "Toggle Group is exclusive segmented selection (radiogroup) with joined chrome \u2014 Segmented Control is this presentation, not a separate component.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "None yet \u2014 React-first CE-2C; Figma master pending",
    documentationUrl: getComponentDocumentationUrl("toggle-group"),
    supportedVariants: ["single"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/border/strong",
      "semantic/focus-ring",
      "semantic/surface/subtle",
      "semantic/text/primary"
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/toggle-group-keyboard.ts"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ToggleGroup.tsx", "components/ui/toggle-group.module.css"],
    cssTokens: [
      "--component-button-radius-control",
      "--component-surface-gradient-overlay",
      "--control-font-size-lg",
      "--control-font-size-md",
      "--control-font-size-sm",
      "--control-height-lg",
      "--control-height-md",
      "--control-height-sm",
      "--control-padding-x-lg",
      "--control-padding-x-md",
      "--control-padding-x-sm",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-border-default",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--semantic-surface-elevated",
      "--semantic-surface-subtle",
      "--semantic-text-primary",
      "--shape-radius-container",
      "--shape-radius-control",
      "--surface-fill-control"
    ],
    relatedComponents: [
      { label: "Button Group \u2014 joined peer actions (no selection)", href: "/components/button-group" },
      { label: "Radio Group \u2014 form-field exclusive radios", href: "/components/radio-group" },
      { label: "Tabs \u2014 switches content panels", href: "/components/tabs" },
      { label: "Switch \u2014 single binary toggle", href: "/components/switch" }
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts7.shape, sharedConcepts7.surface],
    openQuestions: [
      "Figma master not created yet \u2014 intentional React-first CE-2 sequence.",
      "Multiple selection intentionally deferred; 0.1.0-beta is single-only."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "ToggleGroup = role=radiogroup (joined outer chrome) + ToggleGroupItem children (role=radio).",
    keyboardBehavior: "Tab lands on the selected item (or first item if none). Arrow keys move focus and select. Home/End jump ends. Space/Enter select the focused item. Re-clicking the selected item does not clear selection.",
    focusBehavior: "Roving tabindex among radios. Focus-visible ring on the focused segment.",
    comparisons: [
      {
        title: "Toggle Group vs Segmented Control?",
        body: "Same capability. Skrewww ships Toggle Group as the semantic component; segmented/joined appearance is the default presentation. There is no separate Segmented Control export."
      },
      {
        title: "Toggle Group vs Button Group?",
        body: "Button Group joins independent peer actions with no selection state. Toggle Group selects exactly one value among segments."
      },
      {
        title: "Toggle Group vs Radio Group?",
        body: "Radio Group is a form-field control with radio indicators, legend, and validation. Toggle Group is compact segmented chrome for toolbar/settings selection."
      },
      {
        title: "Toggle Group vs Tabs?",
        body: "Tabs switch associated content panels (tablist/tabpanel). Toggle Group only selects a value \u2014 it does not own panels."
      }
    ],
    apiProps: [
      {
        name: "value",
        type: "string",
        description: "Controlled selected value. Empty string means none selected yet."
      },
      {
        name: "defaultValue",
        type: "string",
        description: "Uncontrolled initial selected value."
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Fires when the selected value changes."
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables the entire group."
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout and arrow-key orientation."
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Segment size matching control height tokens."
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the radiogroup when no visible label exists."
      },
      {
        name: "children",
        type: "ReactNode",
        description: "ToggleGroupItem children."
      }
    ],
    reactExample: `import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";

export function Example() {
  const [value, setValue] = useState("list");
  return (
    <ToggleGroup
      aria-label="View mode"
      value={value}
      onValueChange={setValue}
    >
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>
  );
}`
  },
  {
    slug: "split-button",
    name: "Split Button",
    category: "Actions",
    summary: "Split Button joins one primary Button action with a related Menu trigger using shared outer chrome \u2014 composition only; Button and Menu keep their own APIs.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "Actions / Split Button \u2014 Style \xD7 Size (9 variants)",
    figmaSourceUrl: SPLIT_BUTTON_FIGMA_FILE_URL,
    figmaNodeId: SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("split-button"),
    supportedVariants: ["neutral", "primary", "danger"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "color/brand/700",
      "color/danger/700"
    ],
    // SplitButton.tsx documents Menu as a composed peer (prose only — see
    // its own JSDoc) but does not import Menu.tsx or any Menu type at all;
    // CE-3J's own real-import verification found no @skrewww/menu edge, so
    // it is intentionally not declared as a registryDependency here — a
    // corrected departure from the CE-3G plan's aspirational "menu becomes
    // one for split-button" note, matching real source evidence instead.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/button-group-context.ts",
      "components/ui/button-group.module.css"
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/SplitButton.tsx"],
    relatedComponents: [
      { label: "Button \u2014 primary action and menu trigger chrome", href: "/components/button" },
      { label: "Menu \u2014 secondary popup and items", href: "/components/menu" },
      { label: "Button Group \u2014 peer joined actions without a menu", href: "/components/button-group" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts7.shape, sharedConcepts7.surface],
    openQuestions: [
      "Figma set has no State / Shape / Surface / menu-open variants \u2014 those remain Button + Menu responsibilities.",
      "Chevron trigger padding follows Button control padding (Figma chevron segment is slightly tighter horizontally).",
      "Disabled/loading combinations are independent per segment; no group-level loading API."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "SplitButton = role=group wrapper (shared border + divider gap + outer radius) + primary Button + Menu (MenuTrigger Button + MenuContent). Divider tone is chrome only.",
    keyboardBehavior: "Tab between primary Button and MenuTrigger Button. Enter/Space activate the focused control. Menu owns ArrowDown/ArrowUp open, item navigation, and Escape close.",
    focusBehavior: "Two independent focusable buttons. Focus-visible rings are not clipped (no overflow:hidden). Opening the menu restores focus per Menu/Popover.",
    comparisons: [
      {
        title: "How is Split Button different from Button Group?",
        body: "Button Group joins peer independent actions. Split Button pairs one primary default action with a related secondary menu trigger \u2014 not interchangeable APIs."
      },
      {
        title: "Does Split Button own menu items?",
        body: "No. Compose Menu, MenuTrigger, MenuContent, and MenuItem. Split Button only provides joined chrome between the primary Button and the trigger Button."
      }
    ],
    apiProps: [
      {
        name: "children",
        type: "ReactNode",
        description: "Primary Skrewww Button plus a Menu whose MenuTrigger wraps a secondary Button (typically CaretDown with aria-label). Do not put Button/Menu props on SplitButton."
      },
      {
        name: "divider",
        type: '"neutral" | "primary" | "danger"',
        default: '"neutral"',
        description: "Chrome color in the 2px gap \u2014 matches Figma Style gap fill (neutral=Secondary, primary, danger). Not a Button variant."
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the primary+menu pair when no visible group label exists."
      },
      {
        name: "aria-labelledby",
        type: "string",
        description: "ID of a visible label element for the pair."
      }
    ],
    reactExample: `import { CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import { SplitButton } from "@/components/ui/SplitButton";

export function Example() {
  return (
    <SplitButton aria-label="Save options" divider="primary">
      <Button type="button" variant="primary" onClick={() => {}}>
        Save
      </Button>
      <Menu>
        <MenuTrigger>
          <Button type="button" variant="primary" aria-label="More save options">
            <CaretDown size={16} weight="bold" />
          </Button>
        </MenuTrigger>
        <MenuContent aria-label="More save options">
          <MenuItem onSelect={() => {}}>Save as draft</MenuItem>
          <MenuItem onSelect={() => {}}>Save and publish</MenuItem>
        </MenuContent>
      </Menu>
    </SplitButton>
  );
}`
  },
  {
    slug: "card",
    name: "Card",
    category: "Containers & Overlays",
    summary: "Card is a general-purpose content container grouping related information with a clear visual boundary.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Containers / Card \u2014 Elevation (Flat/Raised); node 2044:25756. Title/Body are Figma TEXT; Footer is a hardcoded Button frame. React children + footer ReactNode are ahead of that contract.",
    documentationUrl: getComponentDocumentationUrl("card"),
    supportedVariants: ["flat", "raised"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "component/radius/container",
      "shadow-blur/3",
      "shadow-color/3"
    ],
    // Proof-of-concept for the planned CLI-resolution schema — derived directly
    // from components/ui/Card.tsx and card.module.css, not guessed.
    // Real dependency contract, verified against actual source (2026-08-09):
    // Card's own source imports no third-party npm package of its own —
    // "react"/"react-dom" are host/framework assumptions, not packages the
    // registry should install (see `hostRequirements`). Unlike Button, Card
    // has no next/link import, so "next" is correctly excluded here.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    // lib/cn.ts (class-name join helper) — copied alongside Card, never a
    // public Skrewww registry component in its own right.
    internalDependencies: ["lib/cn.ts"],
    // The shared Foundation resource — does not have its own registry entry
    // yet; declared here because it is Card's real, verified dependency
    // regardless of whether a transport manifest exists yet.
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/Card.tsx", "components/ui/card.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-md",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-container",
      "--squircle-clip-path-container",
      "--surface-border-default",
      "--surface-fill-default",
      "--surface-shadow-raised"
    ],
    relatedComponents: [
      { label: "Dialog \u2014 modal attention pattern", href: "/components/dialog" },
      { label: "Accordion \u2014 collapsible sections", href: "/components/accordion" }
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "shadow-blur/3", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts7.shape, sharedConcepts7.surface],
    openQuestions: [
      "Confirm raised elevation shadow offset/spread values from Figma shadow tokens.",
      "Clickable-card pattern (single interactive target) not implemented \u2014 TODO before using Card as a link surface.",
      "REACT AHEAD OF FIGMA \u2014 Figma Card 2044:25756 still uses Title/Body TEXT and a hardcoded Footer. A follow-up should audit native Content/Actions Slots without blocking React."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    apiProps: [
      {
        name: "as",
        type: '"div" | "article" | "section" | "li"',
        default: '"div"',
        description: "Semantic wrapper. Use article only for independently meaningful content."
      },
      {
        name: "elevation",
        type: '"flat" | "raised"',
        default: '"flat"',
        description: "Flat uses border; Raised uses shadow-blur/3 and shadow-color/3."
      },
      {
        name: "title",
        type: "string",
        description: "Optional card header title."
      },
      {
        name: "children",
        type: "React.ReactNode",
        description: "Arbitrary body content. Optional. Does not render Figma instructional placeholders. React is ahead of Figma Card Body TEXT."
      },
      {
        name: "headingLevel",
        type: '"h2" | "h3" | "h4"',
        default: '"h3"',
        description: "Heading level for the optional title."
      },
      {
        name: "footer",
        type: "ReactNode",
        description: "Optional footer composition \u2014 typically Button instances. React is ahead of Figma\u2019s hardcoded Footer frame."
      }
    ],
    reactExample: `import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Card
      as="article"
      title="Billing"
      elevation="raised"
      footer={<Button size="sm">Manage plan</Button>}
    >
      Your next invoice is due on April 1.
    </Card>
  );
}`
  },
  {
    slug: "text-input",
    name: "Text Input",
    category: "Forms",
    summary: "Text Input is a single-line text entry for short, free-form data such as names, emails, or search terms.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Forms / Text Input \u2014 State \xD7 Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("text-input"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/border/strong",
      "semantic/focus-ring",
      "semantic/action/danger",
      "semantic/surface/default"
    ],
    // Real dependency contract, verified against actual source (2026-08-09):
    // TextInput.tsx composes FormField internally (a real, documented
    // architectural dependency — see docs/architecture/form-field.md, not
    // a conceptual pairing) and imports the private, unexported
    // TextInputControl for its native input visuals. No third-party npm
    // package of its own; "react"/"react-dom" are host assumptions, no
    // next import exists anywhere in TextInput.tsx/TextInputControl.tsx.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    // TextInputControl.tsx (private control primitive, never independently
    // installable — see docs/architecture/form-field.md) and lib/cn.ts.
    internalDependencies: ["components/ui/TextInputControl.tsx", "lib/cn.ts"],
    // FormField is a real code dependency (TextInput.tsx imports and
    // renders it), not merely conceptually related — it is independently
    // public and independently registry-slugged, so it is declared here
    // rather than folded into internalDependencies. Foundation is declared
    // directly too, matching the existing Button/Card convention of
    // declaring it wherever a component's own CSS consumes its tokens.
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/TextInput.tsx", "components/ui/text-input.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--control-font-size-lg",
      "--control-font-size-md",
      "--control-font-size-sm",
      "--control-height-lg",
      "--control-height-md",
      "--control-height-sm",
      "--control-padding-x-lg",
      "--control-padding-x-md",
      "--control-padding-x-sm",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-border-default",
      "--semantic-border-disabled",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-disabled",
      "--semantic-surface-subtle",
      "--semantic-text-disabled",
      "--semantic-text-primary",
      "--shape-radius-control",
      "--squircle-clip-path-control",
      "--surface-fill-control"
    ],
    relatedComponents: [
      { label: "Form Field \u2014 shared label and helper pattern", href: "/components/form-field" },
      { label: "Validation Message \u2014 typed inline feedback", href: "/components/validation-message" },
      { label: "Textarea \u2014 multi-line entry", href: "/components/textarea" },
      { label: "Search Field \u2014 search-specific input", href: "/components/search-field" }
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" }
    ],
    relatedConcepts: [sharedConcepts7.shape, sharedConcepts7.surface],
    openQuestions: [
      "FormField composes label/helper/error internally \u2014 confirm parity with Figma Form Field Wrapper split.",
      "Hover state token mapping not explicitly documented \u2014 uses semantic/border/strong on hover.",
      "Trailing action slot is a documentation convenience; confirm Figma trailing icon property semantics."
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible or visually hidden label associated via FormField."
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Control height and typography scale."
      },
      {
        name: "supportingText",
        type: "string",
        description: "Helper text linked with aria-describedby when no error is present."
      },
      {
        name: "error",
        type: "string",
        description: "Error message; sets aria-invalid and aria-describedby via ValidationMessage."
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Shows required indicator and sets aria-required."
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only state \u2014 distinct from disabled; remains focusable."
      },
      {
        name: "leadingIcon",
        type: "ReactNode",
        description: "Optional leading icon (Figma: Show leading icon + Leading Icon)."
      },
      {
        name: "trailingIcon",
        type: "ReactNode",
        description: "Optional trailing icon (Figma: Show trailing icon + Trailing Icon)."
      },
      {
        name: "trailingAction",
        type: "ReactNode",
        description: "Interactive trailing control such as an apply button."
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Native disabled input with non-opacity-only visual treatment."
      }
    ],
    reactExample: `import { TextInput } from "@/components/ui/TextInput";

export function Example() {
  return (
    <TextInput
      label="Email address"
      type="email"
      placeholder="you@example.com"
      supportingText="Used for account notifications only."
      required
    />
  );
}`
  },
  ...formsRegistryEntries,
  ...feedbackRegistryEntries,
  ...navigationRegistryEntries,
  ...containersRegistryEntries,
  ...contentDataRegistryEntries,
  ...calendarRegistryEntries
];

// lib/agent-kit/project-context.ts
function isDistributedViaSkrewwwRegistry(slug) {
  const entry = componentRegistry.find((candidate) => candidate.slug === slug);
  return Boolean(entry?.files && entry.files.length > 0);
}

// lib/guard/component-facts.ts
function loadInternalComponentFacts() {
  const facts = new Map(
    componentRegistry.map((entry) => [
      entry.slug,
      {
        slug: entry.slug,
        displayName: entry.name,
        status: entry.status,
        installable: isDistributedViaSkrewwwRegistry(entry.slug),
        publicPropertyNames: entry.apiProps.map((prop) => prop.name)
      }
    ])
  );
  return {
    getBySlug: (slug) => facts.get(slug),
    listSlugs: () => Array.from(facts.keys())
  };
}

// lib/guard/paths.ts
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
function toProjectRelativePath(targetPath, projectRoot) {
  const root = resolve(projectRoot);
  const absolute = isAbsolute(targetPath) ? resolve(targetPath) : resolve(root, targetPath);
  const rel = relative(root, absolute);
  if (rel === "") return ".";
  if (rel.startsWith(`..${sep}`) || rel === "..") {
    return basename(absolute);
  }
  return rel.split(sep).join("/");
}
function sanitizePathInMessage(message, projectRoot) {
  let out = message;
  const root = resolve(projectRoot).split(sep).join("/");
  const withSlash = root.endsWith("/") ? root : `${root}/`;
  out = out.split(withSlash).join("").split(root).join(".");
  out = out.replace(/(?:\/Users\/[^/\s]+|\/home\/[^/\s]+|\/tmp|\/var\/folders\/[^\s]*)(?:\/[^\s:]*)+/g, (match) => {
    const base = match.split("/").filter(Boolean).pop();
    return base ?? "file";
  });
  return out;
}

// lib/guard/diagnostics.ts
var REMEDIATION_BY_RULE = {
  "component/nonexistent-slug": () => "Use a canonical Skrewww component slug, or remove the Skrewww-path import claim.",
  "maturity/false-stable-claim": (finding) => `Correct the structured maturity metadata for "${finding.subject.id}" to match its canonical status, or promote the component first.`,
  "distribution/false-installable-claim": (finding) => `Do not claim "${finding.subject.id}" is installable via the Skrewww registry until it is distributed.`,
  "token/undeclared-css-var": (finding) => `Declare ${finding.subject.id} in the component's canonical cssTokens metadata.`,
  "distribution/hostrequirements-leak": () => "Remove hostRequirements from the public registry projection (keep it internal-only).",
  "distribution/hosthost-schema-consistency": (finding) => finding.subject.kind === "contract" ? "Remove shadcn-transport fields (e.g. $schema) from Agent Kit contracts." : "Remove Agent-Kit-only fields (guidance, tokens) from shadcn manifests."
};
function messageFor(finding) {
  if (finding.details && finding.details.trim().length > 0) {
    return finding.details.trim();
  }
  switch (finding.ruleId) {
    case "component/nonexistent-slug":
      return `Component slug "${finding.subject.id}" is not present in the canonical Skrewww registry.`;
    case "maturity/false-stable-claim":
      return `"${finding.subject.id}" was claimed Stable, but that conflicts with its canonical maturity status.`;
    case "distribution/false-installable-claim":
      return `"${finding.subject.id}" is not distributed through the Skrewww registry, but was claimed installable.`;
    case "token/undeclared-css-var":
      return `CSS variable ${finding.subject.id} is referenced but not declared in canonical cssTokens metadata.`;
    case "distribution/hostrequirements-leak":
      return `Generated manifest "${finding.subject.id}" leaks hostRequirements into public registry output.`;
    case "distribution/hosthost-schema-consistency":
      return `Generated artifact "${finding.subject.id}" mixes shadcn and Agent Kit schema fields.`;
    case "api/nonexistent-prop":
      return `Deferred rule api/nonexistent-prop produced a finding (should not ship in v0.1).`;
  }
}
function findingToDiagnostic(finding, options) {
  const projectRoot = options?.projectRoot ?? process.cwd();
  const remediation = finding.ruleId === "api/nonexistent-prop" ? void 0 : REMEDIATION_BY_RULE[finding.ruleId](finding);
  let location;
  if (finding.location?.path) {
    const file = toProjectRelativePath(finding.location.path, projectRoot);
    const start = finding.location.range?.start;
    location = {
      file,
      ...start ? { line: start.line + 1, column: start.column + 1 } : {}
    };
  }
  return {
    ruleId: finding.ruleId,
    severity: finding.severity,
    message: messageFor(finding),
    location,
    subject: finding.subject,
    evidence: {
      source: finding.canonicalEvidence,
      ...options?.sourceGitSha ? { sourceGitSha: options.sourceGitSha } : {}
    },
    remediation
  };
}
function findingsToDiagnostics(findings, options) {
  return sortDiagnostics(findings.map((f) => findingToDiagnostic(f, options)));
}
function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((a, b) => {
    const fileA = a.location?.file ?? "";
    const fileB = b.location?.file ?? "";
    if (fileA !== fileB) return fileA < fileB ? -1 : 1;
    const lineA = a.location?.line ?? -1;
    const lineB = b.location?.line ?? -1;
    if (lineA !== lineB) return lineA - lineB;
    const colA = a.location?.column ?? -1;
    const colB = b.location?.column ?? -1;
    if (colA !== colB) return colA - colB;
    if (a.ruleId !== b.ruleId) return a.ruleId < b.ruleId ? -1 : 1;
    if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1;
    return 0;
  });
}
function severityAffectsExit(severity) {
  return severity === "error";
}

// lib/guard/discover.ts
import { lstatSync, readdirSync, statSync } from "node:fs";
import { join, relative as relative2, resolve as resolve2, sep as sep2 } from "node:path";
var SKIP_DIR_NAMES = /* @__PURE__ */ new Set([
  "node_modules",
  ".next",
  ".next-playwright",
  "dist",
  "build",
  "coverage",
  ".git",
  ".turbo",
  "out"
]);
var SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([".ts", ".tsx"]);
function isSkippedDir(name) {
  return SKIP_DIR_NAMES.has(name);
}
function isSourceFile(name) {
  if (name.endsWith(".d.ts")) return false;
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return SOURCE_EXTENSIONS.has(name.slice(dot));
}
function discoverSourceFiles(target, projectRoot) {
  const absoluteTarget = resolve2(projectRoot, target);
  const st = statSync(absoluteTarget);
  if (st.isFile()) {
    if (!isSourceFile(absoluteTarget)) {
      return [];
    }
    return [toProjectRelativePath(absoluteTarget, projectRoot)];
  }
  if (!st.isDirectory()) {
    return [];
  }
  const results = [];
  const seenRealPaths = /* @__PURE__ */ new Set();
  function walk(dir) {
    let real;
    try {
      real = lstatSync(dir).isSymbolicLink() ? resolve2(dir) : dir;
    } catch {
      return;
    }
    if (seenRealPaths.has(real)) return;
    seenRealPaths.add(real);
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    entries.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    for (const name of entries) {
      if (isSkippedDir(name)) continue;
      const full = join(dir, name);
      let entryStat;
      try {
        entryStat = lstatSync(full);
      } catch {
        continue;
      }
      if (entryStat.isSymbolicLink()) {
        continue;
      }
      if (entryStat.isDirectory()) {
        walk(full);
      } else if (entryStat.isFile() && isSourceFile(name)) {
        results.push(toProjectRelativePath(full, projectRoot));
      }
    }
  }
  walk(absoluteTarget);
  results.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return Array.from(new Set(results));
}

// lib/guard/provenance.ts
import { existsSync, readFileSync } from "node:fs";
import { join as join2 } from "node:path";
import * as ts3 from "typescript";

// lib/guard/parse-source.ts
import * as ts from "typescript";
function scriptKindFor(path) {
  if (path.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (path.endsWith(".ts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.TSX;
}
function toGuardRange(sourceFile, start, end) {
  const startPos = sourceFile.getLineAndCharacterOfPosition(start);
  const endPos = sourceFile.getLineAndCharacterOfPosition(end);
  return {
    start: { line: startPos.line, column: startPos.character },
    end: { line: endPos.line, column: endPos.character }
  };
}
function parseSource(path, content) {
  const scriptKind = scriptKindFor(path);
  const compilerOptions = {
    target: ts.ScriptTarget.Latest,
    jsx: ts.JsxEmit.ReactJSX,
    allowJs: true,
    noResolve: true
  };
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind);
  const host = {
    getSourceFile: (fileName) => fileName === path ? sourceFile : void 0,
    getDefaultLibFileName: () => "lib.d.ts",
    writeFile: () => {
    },
    getCurrentDirectory: () => "",
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (fileName) => fileName === path,
    readFile: (fileName) => fileName === path ? content : void 0
  };
  const program = ts.createProgram([path], compilerOptions, host);
  const programSourceFile = program.getSourceFile(path);
  if (!programSourceFile) {
    return {
      ok: false,
      errors: [
        {
          kind: "parse-error",
          message: `TypeScript could not produce a source file for "${path}".`,
          range: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
        }
      ]
    };
  }
  const diagnostics = program.getSyntacticDiagnostics(programSourceFile);
  if (diagnostics.length > 0) {
    const errors = diagnostics.map((diagnostic) => {
      const start = diagnostic.start ?? 0;
      const length = diagnostic.length ?? 0;
      return {
        kind: "parse-error",
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        range: toGuardRange(programSourceFile, start, start + length)
      };
    });
    return { ok: false, errors };
  }
  return {
    ok: true,
    sourceFile: programSourceFile,
    toRange: (start, end) => toGuardRange(programSourceFile, start, end)
  };
}

// lib/guard/extract-imports.ts
import * as ts2 from "typescript";
function extractFromNamedImports(namedImports, moduleSpecifier, toRange) {
  return namedImports.elements.map((specifier) => {
    const localName = specifier.name.text;
    const isAliased = specifier.propertyName !== void 0;
    const importedName = isAliased ? specifier.propertyName.text : localName;
    const kind = isAliased ? "named-aliased" : "named";
    return {
      localName,
      importedName,
      moduleSpecifier,
      kind,
      range: toRange(specifier.getStart(), specifier.getEnd())
    };
  });
}
function extractImports(parsed) {
  const { sourceFile, toRange } = parsed;
  const facts = [];
  for (const statement of sourceFile.statements) {
    if (!ts2.isImportDeclaration(statement)) continue;
    if (!ts2.isStringLiteral(statement.moduleSpecifier)) continue;
    const moduleSpecifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) {
      facts.push({
        localName: clause.name.text,
        importedName: "default",
        moduleSpecifier,
        kind: "default",
        range: toRange(clause.name.getStart(), clause.name.getEnd())
      });
    }
    if (clause.namedBindings) {
      if (ts2.isNamedImports(clause.namedBindings)) {
        facts.push(...extractFromNamedImports(clause.namedBindings, moduleSpecifier, toRange));
      } else if (ts2.isNamespaceImport(clause.namedBindings)) {
        facts.push({
          localName: clause.namedBindings.name.text,
          importedName: "*",
          moduleSpecifier,
          kind: "namespace",
          range: toRange(clause.namedBindings.getStart(), clause.namedBindings.getEnd())
        });
      }
    }
  }
  return facts;
}

// lib/guard/provenance.ts
var KNOWN_INTERNAL_UI_BARREL = "@/components/ui";
var KNOWN_INTERNAL_UI_DIRECT_PREFIX = "@/components/ui/";
function classifyInternalImportProvenance(moduleSpecifier) {
  if (moduleSpecifier === KNOWN_INTERNAL_UI_BARREL) {
    return { kind: "internal-ui-barrel" };
  }
  if (moduleSpecifier.startsWith(KNOWN_INTERNAL_UI_DIRECT_PREFIX)) {
    const fileBaseName = moduleSpecifier.slice(KNOWN_INTERNAL_UI_DIRECT_PREFIX.length);
    if (fileBaseName.length > 0 && !fileBaseName.includes("/")) {
      return { kind: "internal-ui-direct", fileBaseName };
    }
  }
  return { kind: "unknown" };
}
var fileBaseNameToSlugCache;
function fileBaseNameToSlug() {
  if (fileBaseNameToSlugCache) return fileBaseNameToSlugCache;
  const map = /* @__PURE__ */ new Map();
  for (const entry of componentRegistry) {
    if (!entry.hasImplementation) continue;
    const ownFiles = (entry.files ?? []).filter(
      (relPath) => relPath.startsWith("components/ui/") && relPath.endsWith(".tsx") && !relPath.includes("/internal/")
    );
    if (ownFiles.length > 0) {
      for (const relPath of ownFiles) {
        const fileBaseName = relPath.slice("components/ui/".length, -".tsx".length);
        map.set(fileBaseName, entry.slug);
      }
      continue;
    }
    const expectedFileBaseName = entry.name.replace(/\s+/g, "");
    const expectedDirectSpecifier = `@/components/ui/${expectedFileBaseName}`;
    const parsed = parseSource(`${entry.slug}--react-example.tsx`, entry.reactExample);
    if (!parsed.ok) continue;
    const imports = extractImports(parsed);
    const ownImport = imports.find(
      (imp) => imp.moduleSpecifier === expectedDirectSpecifier || imp.moduleSpecifier === KNOWN_INTERNAL_UI_BARREL && imp.importedName === expectedFileBaseName
    );
    if (ownImport) {
      map.set(expectedFileBaseName, entry.slug);
    }
  }
  fileBaseNameToSlugCache = map;
  return map;
}
var barrelReexportToFileBaseNameCache;
function barrelReexportToFileBaseName() {
  if (barrelReexportToFileBaseNameCache) return barrelReexportToFileBaseNameCache;
  const map = /* @__PURE__ */ new Map();
  const barrelPath = join2(process.cwd(), "components/ui/index.ts");
  if (existsSync(barrelPath)) {
    const content = readFileSync(barrelPath, "utf8");
    const parsed = parseSource("components/ui/index.ts", content);
    if (parsed.ok) {
      for (const statement of parsed.sourceFile.statements) {
        if (!ts3.isExportDeclaration(statement)) continue;
        if (!statement.moduleSpecifier || !ts3.isStringLiteral(statement.moduleSpecifier)) continue;
        if (!statement.exportClause || !ts3.isNamedExports(statement.exportClause)) continue;
        const moduleSpecifier = statement.moduleSpecifier.text;
        if (!moduleSpecifier.startsWith(KNOWN_INTERNAL_UI_DIRECT_PREFIX)) continue;
        const fileBaseName = moduleSpecifier.slice(KNOWN_INTERNAL_UI_DIRECT_PREFIX.length);
        if (fileBaseName.length === 0 || fileBaseName.includes("/")) continue;
        for (const specifier of statement.exportClause.elements) {
          if (specifier.isTypeOnly) continue;
          const exportedName = specifier.name.text;
          map.set(exportedName, fileBaseName);
        }
      }
    }
  }
  barrelReexportToFileBaseNameCache = map;
  return map;
}
function isKnownInternalHelperPath(candidatePath) {
  return componentRegistry.some((entry) => entry.internalDependencies?.includes(candidatePath));
}
function resolveImportedFileBaseName(fact) {
  const provenance = classifyInternalImportProvenance(fact.moduleSpecifier);
  if (provenance.kind === "internal-ui-direct") {
    return provenance.fileBaseName;
  }
  if (provenance.kind === "internal-ui-barrel") {
    return barrelReexportToFileBaseName().get(fact.importedName) ?? fact.importedName;
  }
  return void 0;
}
function resolveInternalComponentSlug(fact) {
  const candidateFileBaseName = resolveImportedFileBaseName(fact);
  if (!candidateFileBaseName || candidateFileBaseName === "*" || candidateFileBaseName === "default") {
    return void 0;
  }
  return fileBaseNameToSlug().get(candidateFileBaseName);
}

// lib/guard/provenance-marker.ts
var MARKER_RE = /\/\*\*\s*@skrewww-component\s+([a-z0-9-]+)\s*\*\//;
function extractSkrewwwComponentMarker(content) {
  const match = MARKER_RE.exec(content);
  return match?.[1];
}

// lib/guard/resolve-import.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { dirname, isAbsolute as isAbsolute2, join as join3, normalize, relative as relative3, resolve as resolve3, sep as sep3 } from "node:path";
import * as ts4 from "typescript";
function tryReadSource(candidate) {
  const normalized = normalize(candidate);
  const candidates = [
    normalized,
    `${normalized}.tsx`,
    `${normalized}.ts`,
    join3(normalized, "index.tsx"),
    join3(normalized, "index.ts")
  ];
  for (const path of candidates) {
    if (!existsSync2(path)) continue;
    try {
      return { absolutePath: path, content: readFileSync2(path, "utf8") };
    } catch {
      continue;
    }
  }
  return void 0;
}
function loadTsconfigPaths(projectRoot) {
  const configPath = join3(projectRoot, "tsconfig.json");
  if (!existsSync2(configPath)) {
    return { baseUrl: projectRoot, paths: {} };
  }
  const text = readFileSync2(configPath, "utf8");
  const parsed = ts4.parseConfigFileTextToJson(configPath, text);
  if (!parsed.config || typeof parsed.config !== "object") {
    return { baseUrl: projectRoot, paths: {} };
  }
  const config = parsed.config;
  const baseUrlRel = config.compilerOptions?.baseUrl ?? ".";
  const baseUrl = resolve3(projectRoot, baseUrlRel);
  const paths = config.compilerOptions?.paths ?? {};
  return { baseUrl, paths };
}
function applyPathMapping(moduleSpecifier, baseUrl, paths) {
  for (const [pattern, targets] of Object.entries(paths)) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1);
      if (moduleSpecifier.startsWith(prefix)) {
        const rest = moduleSpecifier.slice(prefix.length);
        const target = targets[0];
        if (!target) continue;
        const mapped = target.endsWith("/*") ? `${target.slice(0, -1)}${rest}` : target.replace("*", rest);
        return resolve3(baseUrl, mapped);
      }
    } else if (moduleSpecifier === pattern) {
      const target = targets[0];
      if (!target) continue;
      return resolve3(baseUrl, target);
    }
  }
  return void 0;
}
function resolveImportToFile(importerPath, moduleSpecifier, projectRoot) {
  if (moduleSpecifier.startsWith(".")) {
    const fromDir = dirname(resolve3(projectRoot, importerPath));
    return tryReadSource(resolve3(fromDir, moduleSpecifier));
  }
  const { baseUrl, paths } = loadTsconfigPaths(projectRoot);
  const mapped = applyPathMapping(moduleSpecifier, baseUrl, paths);
  if (mapped) {
    return tryReadSource(mapped);
  }
  if (moduleSpecifier.startsWith("@/")) {
    return tryReadSource(resolve3(projectRoot, moduleSpecifier.slice(2)));
  }
  return void 0;
}

// lib/guard/rules/component-nonexistent-slug.ts
function evaluateComponentNonexistentSlug(facts, options = {}) {
  if (!facts.ok) return [];
  const mode = options.provenanceMode ?? "internal-paths";
  return facts.jsxElements.map(
    (element) => mode === "origin-marker" ? evaluateElementOriginMarker(facts.path, element, options) : evaluateElementInternalPaths(facts.path, element)
  );
}
function evaluateElementInternalPaths(path, element) {
  const ruleId = "component/nonexistent-slug";
  if (element.resolution.kind !== "imported") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `JSX tag resolution is "${element.resolution.kind}" \u2014 no import binds this tag, so no Skrewww identity claim exists to check.`
    };
  }
  const provenance = classifyInternalImportProvenance(element.resolution.import.moduleSpecifier);
  if (provenance.kind === "unknown") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Import module specifier "${element.resolution.import.moduleSpecifier}" is not a known Skrewww path \u2014 no Skrewww identity claim established, regardless of the imported name.`
    };
  }
  const slug = resolveInternalComponentSlug(element.resolution.import);
  const claimedName = element.resolution.import.importedName;
  if (slug) {
    return { status: "pass", ruleId, subject: { kind: "component", id: slug } };
  }
  const candidateFileBaseName = resolveImportedFileBaseName(element.resolution.import) ?? claimedName;
  const candidatePath = `components/ui/${candidateFileBaseName}.tsx`;
  if (isKnownInternalHelperPath(candidatePath)) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `"${candidatePath}" is a real, canonically-acknowledged internal helper (bundled as another component's internalDependencies) \u2014 never an independently public component, so this is not an invented-component claim.`
    };
  }
  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: claimedName },
      location: { path, range: element.range },
      canonicalEvidence: `lib/component-registry.ts: no entry has an owned file matching "${element.resolution.import.moduleSpecifier}" for the name "${claimedName}"`,
      details: `Claimed a Skrewww component "${claimedName}" via "${element.resolution.import.moduleSpecifier}", but no such component exists in the canonical registry.`
    }
  };
}
function evaluateElementOriginMarker(path, element, options) {
  const ruleId = "component/nonexistent-slug";
  if (element.resolution.kind !== "imported") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `JSX tag resolution is "${element.resolution.kind}" \u2014 no import binds this tag, so no Skrewww origin claim exists.`
    };
  }
  const projectRoot = options.projectRoot ?? process.cwd();
  const resolved = resolveImportToFile(
    path,
    element.resolution.import.moduleSpecifier,
    projectRoot
  );
  if (!resolved) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Could not resolve import "${element.resolution.import.moduleSpecifier}" to a local file \u2014 unknown provenance; no Skrewww origin claim.`
    };
  }
  const markerSlug = extractSkrewwwComponentMarker(resolved.content);
  if (!markerSlug) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Resolved file has no @skrewww-component origin marker \u2014 unknown provenance (local/user-owned source), regardless of import path or tag name.`
    };
  }
  const known = options.knownSlugs;
  if (!known) {
    return {
      status: "unknown",
      ruleId,
      subject: { kind: "component", id: markerSlug },
      reason: "Origin marker found but no packaged fact set was provided for existence checks."
    };
  }
  if (known.has(markerSlug)) {
    return { status: "pass", ruleId, subject: { kind: "component", id: markerSlug } };
  }
  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: markerSlug },
      location: { path, range: element.range },
      canonicalEvidence: `packaged consumer facts: no component with slug "${markerSlug}"`,
      details: `Origin marker claims Skrewww component slug "${markerSlug}", but that slug is not present in the packaged Skrewww consumer facts.`
    }
  };
}

// lib/guard/rules/maturity-false-stable-claim.ts
function evaluateMaturityFalseStableClaim(claims, components) {
  return claims.map((claim) => evaluateClaim(claim, components));
}
function evaluateClaim(claim, components) {
  const ruleId = "maturity/false-stable-claim";
  const fact = components.getBySlug(claim.componentSlug);
  if (!fact) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Component slug "${claim.componentSlug}" does not exist \u2014 see component/nonexistent-slug, not this rule.`
    };
  }
  if (claim.claimedStatus !== "stable") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Claimed status "${claim.claimedStatus}" is not "stable" \u2014 this rule only checks false Stable claims, not generic status validation.`
    };
  }
  if (fact.status === "stable") {
    return { status: "pass", ruleId, subject: { kind: "component", id: claim.componentSlug } };
  }
  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: claim.componentSlug },
      location: claim.location ? { path: claim.location } : void 0,
      canonicalEvidence: `lib/component-registry.ts: "${claim.componentSlug}" has status "${fact.status}"`,
      details: `Claimed "${claim.componentSlug}" is Stable, but its real canonical status is "${fact.status}".`
    }
  };
}

// lib/guard/rules/distribution-false-installable-claim.ts
function evaluateDistributionFalseInstallableClaim(claims, components) {
  return claims.map((claim) => evaluateClaim2(claim, components));
}
function evaluateClaim2(claim, components) {
  const ruleId = "distribution/false-installable-claim";
  const fact = components.getBySlug(claim.componentSlug);
  if (!fact) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Component slug "${claim.componentSlug}" does not exist \u2014 see component/nonexistent-slug, not this rule.`
    };
  }
  if (!claim.claimedInstallable) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Claim does not assert installability \u2014 this rule only checks false claims that a component IS installable.`
    };
  }
  if (fact.installable) {
    return { status: "pass", ruleId, subject: { kind: "component", id: claim.componentSlug } };
  }
  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: claim.componentSlug },
      location: claim.location ? { path: claim.location } : void 0,
      canonicalEvidence: `isDistributedViaSkrewwwRegistry("${claim.componentSlug}") === false (lib/agent-kit/project-context.ts)`,
      details: `Claimed "${claim.componentSlug}" is installable via the @skrewww registry, but it is implemented and deliberately not distributed.`
    }
  };
}

// lib/guard/rules/token-undeclared-css-var.ts
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "node:fs";
import { join as join4 } from "node:path";

// lib/css-custom-properties.ts
function extractCssVarRefs(css) {
  const matches = css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g);
  return Array.from(new Set(Array.from(matches, (m) => m[1])));
}

// lib/guard/rules/token-undeclared-css-var.ts
var defaultReadCssFile = (absolutePath) => existsSync3(absolutePath) ? readFileSync3(absolutePath, "utf8") : void 0;
function evaluateTokenUndeclaredCssVar(root = process.cwd(), registry = componentRegistry, readCssFile = defaultReadCssFile) {
  const ruleId = "token/undeclared-css-var";
  const evaluations = [];
  for (const entry of registry) {
    const cssFiles = (entry.files ?? []).filter((relPath) => relPath.endsWith(".css"));
    if (cssFiles.length === 0) {
      evaluations.push({ status: "not-applicable", ruleId, reason: `"${entry.slug}" owns no CSS files.` });
      continue;
    }
    const found = /* @__PURE__ */ new Set();
    for (const relPath of cssFiles) {
      const content = readCssFile(join4(root, relPath));
      if (content === void 0) continue;
      for (const token of extractCssVarRefs(content)) {
        found.add(token);
      }
    }
    const declared = new Set(entry.cssTokens ?? []);
    const missing = Array.from(found).filter((token) => !declared.has(token)).sort();
    if (missing.length === 0) {
      evaluations.push({ status: "pass", ruleId, subject: { kind: "component", id: entry.slug } });
      continue;
    }
    for (const token of missing) {
      evaluations.push({
        status: "violation",
        finding: {
          ruleId,
          severity: "error",
          subject: { kind: "token", id: token },
          canonicalEvidence: `${cssFiles.join(", ")}: references var(${token}); "${entry.slug}"'s cssTokens does not list it`,
          details: `"${entry.slug}"'s own CSS references ${token}, which is missing from its canonical cssTokens declaration.`
        }
      });
    }
  }
  return evaluations;
}

// lib/guard/rules/distribution-hostrequirements-leak.ts
function evaluateDistributionHostrequirementsLeak(manifests) {
  const ruleId = "distribution/hostrequirements-leak";
  return manifests.map((manifest) => {
    const serialized = JSON.stringify(manifest.json);
    if (!serialized.includes("hostRequirements")) {
      return { status: "pass", ruleId, subject: { kind: "manifest", id: manifest.fileName } };
    }
    return {
      status: "violation",
      finding: {
        ruleId,
        severity: "error",
        subject: { kind: "manifest", id: manifest.fileName },
        canonicalEvidence: `public/r/${manifest.fileName}: serialized manifest contains the string "hostRequirements"`,
        details: `Generated manifest "${manifest.fileName}" leaks hostRequirements \u2014 canonical/internal-only metadata must never appear in public distributed output.`
      }
    };
  });
}

// lib/guard/rules/distribution-hosthost-schema-consistency.ts
function evaluateDistributionHosthostSchemaConsistency(contracts, manifests) {
  const ruleId = "distribution/hosthost-schema-consistency";
  const evaluations = [];
  for (const contract of contracts) {
    if ("$schema" in contract.json) {
      evaluations.push({
        status: "violation",
        finding: {
          ruleId,
          severity: "error",
          subject: { kind: "contract", id: contract.fileName },
          canonicalEvidence: `public/agent/contracts/${contract.fileName}: has a "$schema" field \u2014 a shadcn-transport-only field`,
          details: `Agent Kit contract "${contract.fileName}" carries "$schema", which must only ever appear on shadcn manifests.`
        }
      });
    } else {
      evaluations.push({ status: "pass", ruleId, subject: { kind: "contract", id: contract.fileName } });
    }
  }
  for (const manifest of manifests) {
    const leakedFields = ["guidance", "tokens"].filter((field) => field in manifest.json);
    if (leakedFields.length > 0) {
      evaluations.push({
        status: "violation",
        finding: {
          ruleId,
          severity: "error",
          subject: { kind: "manifest", id: manifest.fileName },
          canonicalEvidence: `public/r/${manifest.fileName}: has field(s) [${leakedFields.join(", ")}] \u2014 Agent-Kit-contract-only fields`,
          details: `Shadcn manifest "${manifest.fileName}" carries [${leakedFields.join(", ")}], which must only ever appear on Agent Kit contracts.`
        }
      });
    } else {
      evaluations.push({ status: "pass", ruleId, subject: { kind: "manifest", id: manifest.fileName } });
    }
  }
  return evaluations;
}

// lib/guard/generated-artifacts.ts
import { existsSync as existsSync4, readdirSync as readdirSync2, readFileSync as readFileSync4 } from "node:fs";
import { join as join5 } from "node:path";
function loadGeneratedManifests(root = process.cwd()) {
  const dir = join5(root, "public", "r");
  if (!existsSync4(dir)) return [];
  return readdirSync2(dir).filter((fileName) => fileName.endsWith(".json") && fileName !== "registry.json").map((fileName) => ({
    fileName,
    json: JSON.parse(readFileSync4(join5(dir, fileName), "utf8"))
  }));
}
function loadGeneratedContracts(root = process.cwd()) {
  const dir = join5(root, "public", "agent", "contracts");
  if (!existsSync4(dir)) return [];
  return readdirSync2(dir).filter((fileName) => fileName.endsWith(".json")).map((fileName) => ({
    fileName,
    json: JSON.parse(readFileSync4(join5(dir, fileName), "utf8"))
  }));
}

// lib/guard/evaluate.ts
function evaluateSourceRules(facts, options) {
  return [...evaluateComponentNonexistentSlug(facts, options)];
}
function evaluateStructuredClaims(claims, components) {
  return [
    ...evaluateMaturityFalseStableClaim(claims.maturity ?? [], components),
    ...evaluateDistributionFalseInstallableClaim(claims.installability ?? [], components)
  ];
}
function evaluateInternalRegistryRules(options) {
  const root = options?.root ?? process.cwd();
  const manifests = options?.manifests ?? loadGeneratedManifests(root);
  const contracts = options?.contracts ?? loadGeneratedContracts(root);
  return [
    ...evaluateTokenUndeclaredCssVar(root),
    ...evaluateDistributionHostrequirementsLeak(manifests),
    ...evaluateDistributionHosthostSchemaConsistency(contracts, manifests)
  ];
}

// lib/guard/extract-jsx.ts
import * as ts5 from "typescript";
function resolveTagName(tagNode, importsByLocalName) {
  if (ts5.isIdentifier(tagNode)) {
    const name = tagNode.text;
    if (name.length > 0 && name[0] === name[0].toLowerCase() && name[0] !== name[0].toUpperCase()) {
      return { kind: "intrinsic", tagName: name };
    }
    const imported = importsByLocalName.get(name);
    if (imported) {
      return { kind: "imported", import: imported };
    }
    return { kind: "local-or-unresolved", tagName: name };
  }
  return { kind: "member-expression", text: tagNode.getText() };
}
function extractAttributes(attributes, toRange) {
  return attributes.properties.map((prop) => {
    if (ts5.isJsxSpreadAttribute(prop)) {
      return { valueKind: "spread", range: toRange(prop.getStart(), prop.getEnd()) };
    }
    const name = prop.name.getText();
    const range = toRange(prop.getStart(), prop.getEnd());
    if (!prop.initializer) {
      return { valueKind: "boolean-shorthand", name, range };
    }
    if (ts5.isStringLiteral(prop.initializer)) {
      return { valueKind: "static-string", name, value: prop.initializer.text, range };
    }
    return { valueKind: "dynamic", name, range };
  });
}
function extractJsxElements(parsed, imports) {
  const { sourceFile, toRange } = parsed;
  const importsByLocalName = new Map(imports.map((fact) => [fact.localName, fact]));
  const facts = [];
  function recordElement(tagNode, attributesNode, range) {
    const attributes = extractAttributes(attributesNode, toRange);
    facts.push({
      resolution: resolveTagName(tagNode, importsByLocalName),
      attributes,
      hasSpreadAttributes: attributes.some((attr) => attr.valueKind === "spread"),
      range: toRange(range.start, range.end)
    });
  }
  function visit(node) {
    if (ts5.isJsxSelfClosingElement(node)) {
      recordElement(node.tagName, node.attributes, { start: node.getStart(), end: node.getEnd() });
    } else if (ts5.isJsxElement(node)) {
      const opening = node.openingElement;
      recordElement(opening.tagName, opening.attributes, {
        start: opening.getStart(),
        end: opening.getEnd()
      });
    }
    ts5.forEachChild(node, visit);
  }
  visit(sourceFile);
  return facts;
}

// lib/guard/facts.ts
function extractSourceFacts(input) {
  const parsed = parseSource(input.path, input.content);
  if (!parsed.ok) {
    return { ok: false, path: input.path, errors: parsed.errors };
  }
  const imports = extractImports(parsed);
  const jsxElements = extractJsxElements(parsed, imports);
  return { ok: true, path: input.path, imports, jsxElements };
}

// lib/guard/claims-file.ts
import { readFileSync as readFileSync5 } from "node:fs";
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseMaturityClaim(value, index) {
  if (!isPlainObject(value)) return `maturity[${index}] must be an object`;
  if (typeof value.componentSlug !== "string" || value.componentSlug.length === 0) {
    return `maturity[${index}].componentSlug must be a non-empty string`;
  }
  if (typeof value.claimedStatus !== "string") {
    return `maturity[${index}].claimedStatus must be a string`;
  }
  if (value.location !== void 0 && typeof value.location !== "string") {
    return `maturity[${index}].location must be a string when present`;
  }
  const claim = {
    componentSlug: value.componentSlug,
    claimedStatus: value.claimedStatus
  };
  if (typeof value.location === "string") claim.location = value.location;
  return claim;
}
function parseInstallabilityClaim(value, index) {
  if (!isPlainObject(value)) return `installability[${index}] must be an object`;
  if (typeof value.componentSlug !== "string" || value.componentSlug.length === 0) {
    return `installability[${index}].componentSlug must be a non-empty string`;
  }
  if (typeof value.claimedInstallable !== "boolean") {
    return `installability[${index}].claimedInstallable must be a boolean`;
  }
  if (value.location !== void 0 && typeof value.location !== "string") {
    return `installability[${index}].location must be a string when present`;
  }
  const claim = {
    componentSlug: value.componentSlug,
    claimedInstallable: value.claimedInstallable
  };
  if (typeof value.location === "string") claim.location = value.location;
  return claim;
}
function parseStructuredClaimsJson(raw) {
  if (!isPlainObject(raw)) {
    return { ok: false, message: "Structured claims JSON must be an object" };
  }
  const claims = {};
  if (raw.maturity !== void 0) {
    if (!Array.isArray(raw.maturity)) {
      return { ok: false, message: "maturity must be an array when present" };
    }
    const maturity = [];
    for (let i = 0; i < raw.maturity.length; i++) {
      const parsed = parseMaturityClaim(raw.maturity[i], i);
      if (typeof parsed === "string") return { ok: false, message: parsed };
      maturity.push(parsed);
    }
    claims.maturity = maturity;
  }
  if (raw.installability !== void 0) {
    if (!Array.isArray(raw.installability)) {
      return { ok: false, message: "installability must be an array when present" };
    }
    const installability = [];
    for (let i = 0; i < raw.installability.length; i++) {
      const parsed = parseInstallabilityClaim(raw.installability[i], i);
      if (typeof parsed === "string") return { ok: false, message: parsed };
      installability.push(parsed);
    }
    claims.installability = installability;
  }
  for (const key of Object.keys(raw)) {
    if (key !== "maturity" && key !== "installability") {
      return {
        ok: false,
        message: `Unknown structured-claims field "${key}" \u2014 only maturity and installability are allowed`
      };
    }
  }
  return { ok: true, claims };
}
function loadStructuredClaimsFromFile(filePath) {
  let text;
  try {
    text = readFileSync5(filePath, "utf8");
  } catch {
    return { ok: false, message: `Could not read structured claims file: ${filePath}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: `Structured claims file is not valid JSON: ${filePath}` };
  }
  return parseStructuredClaimsJson(parsed);
}

// lib/guard/load-consumer-facts.ts
import { existsSync as existsSync5, readFileSync as readFileSync6 } from "node:fs";
import { dirname as dirname2, join as join6 } from "node:path";
import { fileURLToPath } from "node:url";

// lib/guard/version.ts
var GUARD_TOOL_VERSION = "0.1.0-beta.1";

// lib/guard/consumer-facts-schema.ts
var GUARD_CONSUMER_FACTS_SCHEMA_VERSION = 1;

// lib/guard/load-consumer-facts.ts
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseEntry(value, index) {
  if (!isPlainObject2(value)) return `components[${index}] must be an object`;
  if (typeof value.slug !== "string" || value.slug.length === 0) {
    return `components[${index}].slug must be a non-empty string`;
  }
  if (typeof value.displayName !== "string") {
    return `components[${index}].displayName must be a string`;
  }
  if (typeof value.status !== "string" || value.status.length === 0) {
    return `components[${index}].status must be a non-empty string`;
  }
  if (typeof value.installable !== "boolean") {
    return `components[${index}].installable must be a boolean`;
  }
  return {
    slug: value.slug,
    displayName: value.displayName,
    status: value.status,
    installable: value.installable
  };
}
function parseConsumerFactsBundle(raw) {
  if (!isPlainObject2(raw)) {
    return { ok: false, message: "Consumer facts bundle must be a JSON object" };
  }
  if (raw.schemaVersion !== GUARD_CONSUMER_FACTS_SCHEMA_VERSION) {
    return {
      ok: false,
      message: `Unsupported consumer facts schemaVersion (expected ${GUARD_CONSUMER_FACTS_SCHEMA_VERSION})`
    };
  }
  if (typeof raw.guardToolVersion !== "string" || raw.guardToolVersion.length === 0) {
    return { ok: false, message: "guardToolVersion must be a non-empty string" };
  }
  if (typeof raw.source !== "string" || raw.source.length === 0) {
    return { ok: false, message: "source must be a non-empty string" };
  }
  if (!Array.isArray(raw.components)) {
    return { ok: false, message: "components must be an array" };
  }
  const components = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < raw.components.length; i++) {
    const parsed = parseEntry(raw.components[i], i);
    if (typeof parsed === "string") return { ok: false, message: parsed };
    if (seen.has(parsed.slug)) {
      return { ok: false, message: `Duplicate component slug in facts bundle: ${parsed.slug}` };
    }
    seen.add(parsed.slug);
    components.push(parsed);
  }
  const bundle = {
    schemaVersion: GUARD_CONSUMER_FACTS_SCHEMA_VERSION,
    guardToolVersion: raw.guardToolVersion,
    source: raw.source,
    components
  };
  const facts = new Map(
    components.map((entry) => [
      entry.slug,
      {
        slug: entry.slug,
        displayName: entry.displayName,
        status: entry.status,
        installable: entry.installable,
        publicPropertyNames: []
      }
    ])
  );
  return {
    ok: true,
    bundle,
    source: {
      getBySlug: (slug) => facts.get(slug),
      listSlugs: () => Array.from(facts.keys())
    }
  };
}
function loadConsumerFactsFromFile(filePath) {
  if (!existsSync5(filePath)) {
    return { ok: false, message: `Consumer facts file not found: ${filePath}` };
  }
  let text;
  try {
    text = readFileSync6(filePath, "utf8");
  } catch {
    return { ok: false, message: `Could not read consumer facts file: ${filePath}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: `Consumer facts file is not valid JSON: ${filePath}` };
  }
  return parseConsumerFactsBundle(parsed);
}
function defaultRepoConsumerFactsPath(repoRoot = process.cwd()) {
  return join6(repoRoot, "lib/guard/generated/consumer-facts.json");
}
function defaultPackagedConsumerFactsPath(fromModuleUrl = import.meta.url) {
  const here = dirname2(fileURLToPath(fromModuleUrl));
  const candidate = join6(here, "..", "facts", "consumer-facts.json");
  if (existsSync5(candidate)) return candidate;
  return join6(here, "generated", "consumer-facts.json");
}

// lib/guard/rules/index.ts
var GUARD_RULE_CATALOG = [
  { id: "component/nonexistent-slug", severity: "error", domain: "public" },
  { id: "maturity/false-stable-claim", severity: "error", domain: "public" },
  { id: "distribution/false-installable-claim", severity: "error", domain: "public" },
  { id: "token/undeclared-css-var", severity: "error", domain: "internal" },
  { id: "distribution/hostrequirements-leak", severity: "error", domain: "internal" },
  { id: "distribution/hosthost-schema-consistency", severity: "error", domain: "internal" }
];

// lib/guard/run.ts
function collectFindings(evaluations) {
  const findings = [];
  for (const evaluation of evaluations) {
    if (evaluation.status === "violation" && evaluation.finding) {
      findings.push(evaluation.finding);
    }
  }
  return findings;
}
function buildSummary(diagnostics) {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  const files = /* @__PURE__ */ new Set();
  for (const d of diagnostics) {
    if (d.severity === "error") errorCount += 1;
    else if (d.severity === "warning") warningCount += 1;
    else infoCount += 1;
    if (d.location?.file) files.add(d.location.file);
  }
  return { errorCount, warningCount, infoCount, fileCount: files.size };
}
function exitCodeFor(diagnostics, executionErrors) {
  if (executionErrors.length > 0) return 2;
  if (diagnostics.some((d) => severityAffectsExit(d.severity))) return 1;
  return 0;
}
function publicRuleIds() {
  return GUARD_RULE_CATALOG.filter((e) => e.domain === "public").map((e) => e.id);
}
function internalRuleIds() {
  return GUARD_RULE_CATALOG.filter((e) => e.domain === "internal").map((e) => e.id);
}
function resolvePackagedFacts(options, projectRoot) {
  const path = options.consumerFactsPath ?? (existsSync6(defaultRepoConsumerFactsPath(projectRoot)) ? defaultRepoConsumerFactsPath(projectRoot) : defaultPackagedConsumerFactsPath());
  const loaded = loadConsumerFactsFromFile(path);
  if (!loaded.ok) {
    return { ok: false, message: loaded.message, file: toProjectRelativePath(path, projectRoot) };
  }
  return { ok: true, source: loaded.source };
}
function runConsumerSource(projectRoot, target, factKind, components) {
  const executionErrors = [];
  const findings = [];
  const absoluteTarget = resolve4(projectRoot, target);
  if (!existsSync6(absoluteTarget)) {
    executionErrors.push({
      kind: "io",
      message: `Target path does not exist: ${toProjectRelativePath(absoluteTarget, projectRoot)}`,
      file: toProjectRelativePath(absoluteTarget, projectRoot)
    });
    return { findings, executionErrors, filesScanned: [] };
  }
  let files;
  try {
    const st = statSync2(absoluteTarget);
    if (st.isFile() && !absoluteTarget.endsWith(".ts") && !absoluteTarget.endsWith(".tsx")) {
      executionErrors.push({
        kind: "io",
        message: `Target is not a .ts/.tsx source file: ${toProjectRelativePath(absoluteTarget, projectRoot)}`,
        file: toProjectRelativePath(absoluteTarget, projectRoot)
      });
      return { findings, executionErrors, filesScanned: [] };
    }
    files = discoverSourceFiles(target, projectRoot);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    executionErrors.push({
      kind: "io",
      message: sanitizePathInMessage(`Could not read target: ${msg}`, projectRoot)
    });
    return { findings, executionErrors, filesScanned: [] };
  }
  const knownSlugs = new Set(components.listSlugs());
  const provenanceMode = factKind === "packaged" ? "origin-marker" : "internal-paths";
  for (const relPath of files) {
    const abs = resolve4(projectRoot, relPath);
    let content;
    try {
      content = readFileSync7(abs, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      executionErrors.push({
        kind: "io",
        message: sanitizePathInMessage(`Unreadable file: ${msg}`, projectRoot),
        file: relPath
      });
      continue;
    }
    const facts = extractSourceFacts({ path: relPath, content });
    if (!facts.ok) {
      const first = facts.errors[0];
      const loc = first !== void 0 ? `${relPath}:${first.range.start.line + 1}:${first.range.start.column + 1}` : relPath;
      executionErrors.push({
        kind: "parse",
        message: first?.message ? `Source parse failed: ${first.message}` : "Source parse failed",
        file: loc
      });
      continue;
    }
    findings.push(
      ...collectFindings(
        evaluateSourceRules(facts, {
          provenanceMode,
          projectRoot,
          knownSlugs: factKind === "packaged" ? knownSlugs : void 0
        })
      )
    );
  }
  return { findings, executionErrors, filesScanned: files };
}
function runClaims(projectRoot, claims, components) {
  return collectFindings(evaluateStructuredClaims(claims, components)).map((finding) => {
    if (!finding.location?.path) return finding;
    return {
      ...finding,
      location: {
        ...finding.location,
        path: toProjectRelativePath(finding.location.path, projectRoot)
      }
    };
  });
}
function runGuard(options = {}) {
  const projectRoot = resolve4(options.projectRoot ?? process.cwd());
  const mode = options.mode ?? "consumer";
  const target = options.target ?? ".";
  if (mode === "internal") {
    const evaluatedRuleIds2 = internalRuleIds();
    try {
      const absoluteTarget = resolve4(projectRoot, target);
      if (!existsSync6(absoluteTarget)) {
        const executionErrors3 = [
          {
            kind: "io",
            message: `Target path does not exist: ${toProjectRelativePath(absoluteTarget, projectRoot)}`,
            file: toProjectRelativePath(absoluteTarget, projectRoot)
          }
        ];
        return {
          diagnostics: [],
          executionErrors: executionErrors3,
          evaluatedRuleIds: evaluatedRuleIds2,
          summary: buildSummary([]),
          exitCode: 2,
          mode
        };
      }
      const findings = collectFindings(evaluateInternalRegistryRules({ root: absoluteTarget }));
      const diagnostics2 = findingsToDiagnostics(findings, { projectRoot });
      const executionErrors2 = [];
      return {
        diagnostics: diagnostics2,
        executionErrors: executionErrors2,
        evaluatedRuleIds: evaluatedRuleIds2,
        summary: buildSummary(diagnostics2),
        exitCode: exitCodeFor(diagnostics2, executionErrors2),
        mode
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const executionErrors2 = [
        {
          kind: "internal",
          message: sanitizePathInMessage(`Internal Guard failure: ${msg}`, projectRoot)
        }
      ];
      return {
        diagnostics: [],
        executionErrors: executionErrors2,
        evaluatedRuleIds: evaluatedRuleIds2,
        summary: buildSummary([]),
        exitCode: 2,
        mode
      };
    }
  }
  const factSource = options.factSource ?? "internal";
  const evaluatedRuleIds = publicRuleIds();
  const executionErrors = [];
  let components;
  if (factSource === "packaged") {
    const loaded = resolvePackagedFacts(options, projectRoot);
    if (!loaded.ok) {
      return {
        diagnostics: [],
        executionErrors: [
          {
            kind: "io",
            message: sanitizePathInMessage(loaded.message, projectRoot),
            file: loaded.file
          }
        ],
        evaluatedRuleIds,
        summary: buildSummary([]),
        exitCode: 2,
        mode,
        factSource
      };
    }
    components = loaded.source;
  } else {
    components = loadInternalComponentFacts();
  }
  const { findings: sourceFindings, executionErrors: sourceErrors, filesScanned } = runConsumerSource(
    projectRoot,
    target,
    factSource,
    components
  );
  executionErrors.push(...sourceErrors);
  let claimFindings = [];
  if (options.claimsPath) {
    const loaded = loadStructuredClaimsFromFile(resolve4(projectRoot, options.claimsPath));
    if (!loaded.ok) {
      executionErrors.push({
        kind: "claims",
        message: sanitizePathInMessage(loaded.message, projectRoot),
        file: toProjectRelativePath(resolve4(projectRoot, options.claimsPath), projectRoot)
      });
    } else {
      claimFindings = runClaims(projectRoot, loaded.claims, components);
    }
  } else if (options.claims) {
    claimFindings = runClaims(projectRoot, options.claims, components);
  }
  void filesScanned;
  const diagnostics = findingsToDiagnostics([...sourceFindings, ...claimFindings], {
    projectRoot
  });
  return {
    diagnostics,
    executionErrors,
    evaluatedRuleIds,
    summary: buildSummary(diagnostics),
    exitCode: exitCodeFor(diagnostics, executionErrors),
    mode,
    factSource
  };
}

// lib/guard/cli-public.ts
function printPublicHelp() {
  return `Skrewww Guard ${GUARD_TOOL_VERSION} (public consumer package)

Offline, local checks for Skrewww canonical-contract violations (Beta).
Does not replace TypeScript. Does not validate accessibility, Figma,
Shape/Surface, or visual parity.

Public consumer rules (3):
  component/nonexistent-slug
  maturity/false-stable-claim
  distribution/false-installable-claim

Usage:
  skrewww-guard [path]
  skrewww-guard [path] --claims <claims.json>

Arguments:
  path              File or directory (.ts/.tsx). Default: current directory.

Options:
  --claims <file>   Structured claims JSON (maturity / installability data).
                    Not a Guard config file.
  --help, -h        Show this help
  --version, -v     Show Guard tool version

Exit codes:
  0  no ERROR findings
  1  one or more ERROR findings
  2  tool / parse / input / facts failure

Provenance (v0.1):
  Only files carrying an @skrewww-component origin marker (from a Skrewww
  registry install) establish a Skrewww claim. Path/name alone never does.

Notes:
  - Zero-config. No suppressions. Offline/local only.
  - api/nonexistent-prop is deferred (not a prop-type checker).
  - Internal Skrewww-repo rules are not included in this package.
`;
}
function parsePublicCliArgs(argv) {
  const args = [...argv];
  let claimsPath;
  let target;
  let wantHelp = false;
  let wantVersion = false;
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--help" || arg === "-h") {
      wantHelp = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      wantVersion = true;
      continue;
    }
    if (arg === "--internal") {
      return {
        kind: "usage-error",
        message: "--internal is not available in the public Guard package (Skrewww-repo invariants only)"
      };
    }
    if (arg === "--claims") {
      const next = args.shift();
      if (!next || next.startsWith("-")) {
        return { kind: "usage-error", message: "--claims requires a JSON file path" };
      }
      claimsPath = next;
      continue;
    }
    if (arg === "--json") {
      return {
        kind: "usage-error",
        message: "--json is deferred; use the programmatic runGuard() API for structured results"
      };
    }
    if (arg.startsWith("-")) {
      return { kind: "usage-error", message: `Unknown option: ${arg}` };
    }
    if (target !== void 0) {
      return { kind: "usage-error", message: `Unexpected extra argument: ${arg}` };
    }
    target = arg;
  }
  if (wantHelp) return { kind: "help" };
  if (wantVersion) return { kind: "version" };
  return { kind: "run", target: target ?? ".", claimsPath };
}
function runPublicGuardCli(argv, options) {
  const parsed = parsePublicCliArgs(argv);
  if (parsed.kind === "help") {
    return { exitCode: 0, stdout: printPublicHelp(), stderr: "" };
  }
  if (parsed.kind === "version") {
    return { exitCode: 0, stdout: `${GUARD_TOOL_VERSION}
`, stderr: "" };
  }
  if (parsed.kind === "usage-error") {
    return {
      exitCode: 2,
      stdout: "",
      stderr: `${parsed.message}

${printPublicHelp()}`
    };
  }
  const projectRoot = resolve5(options?.projectRoot ?? process.cwd());
  const result = runGuard({
    target: parsed.target,
    projectRoot,
    mode: "consumer",
    factSource: "packaged",
    consumerFactsPath: options?.consumerFactsPath,
    claimsPath: parsed.claimsPath
  });
  const text = formatGuardResult({
    diagnostics: result.diagnostics,
    executionErrors: result.executionErrors
  });
  if (result.exitCode === 2) {
    return { exitCode: 2, stdout: "", stderr: text };
  }
  return { exitCode: result.exitCode, stdout: text, stderr: "" };
}
function mainPublic(argv = process.argv.slice(2)) {
  const here = dirname3(fileURLToPath2(import.meta.url));
  const besideDist = join7(here, "..", "facts", "consumer-facts.json");
  const repoFacts = defaultRepoConsumerFactsPath(process.cwd());
  const consumerFactsPath = existsSync7(besideDist) ? besideDist : existsSync7(repoFacts) ? repoFacts : void 0;
  const result = runPublicGuardCli(argv, {
    projectRoot: process.cwd(),
    consumerFactsPath
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.exitCode;
}

// packages/guard/src/cli.ts
var code = mainPublic(process.argv.slice(2));
process.exit(code);
