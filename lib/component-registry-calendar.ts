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

const REACT_DATE = "2026-07-12";
const DOCS_DATE = "2026-06-01";

export const calendarRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "calendar-day",
    name: "Calendar Day",
    category: "Content & Data",
    summary: "Single selectable day cell inside a month calendar grid.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Calendar Day — Default/Today/Selected/Disabled/Outside",
    documentationUrl: getComponentDocumentationUrl("calendar-day"),
    supportedVariants: ["default", "today", "selected", "disabled", "outside"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/text/disabled",
      "semantic/action/primary",
      "semantic/focus-ring",
      "component/radius/control",
    ],
    relatedComponents: [
      { label: "Calendar Grid — month composition", href: "/components/calendar-grid" },
      { label: "Date Picker — popover field composition", href: "/components/date-picker" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Multi-select and event-indicator states are not confirmed. Range start/middle/end states are implemented — see Calendar Grid's range mode.",
      "Calendar Day should be composed inside Calendar Grid — not used standalone without grid context.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Calendar Day = native button + visible day number + optional today indicator.",
    comparisons: [
      {
        title: "What is the difference between today and selected?",
        body: "Today marks the current calendar date. Selected marks the chosen value. They are independent and use separate visual indicators.",
      },
      {
        title: "How is a Calendar Day labelled for screen readers?",
        body: "Each day exposes a full understandable date such as “14 July 2026”, not only the visible numeral.",
      },
      {
        title: "Can Calendar Day be used outside Calendar Grid?",
        body: "Only for previews or documentation. Production usage should compose Calendar Day through Calendar Grid for keyboard and grid semantics.",
      },
    ],
    apiProps: [
      { name: "date", type: "YYYY-MM-DD", description: "Canonical date-only value." },
      { name: "selected", type: "boolean", description: "Selected state." },
      { name: "today", type: "boolean", description: "Highlights current date." },
      { name: "disabled", type: "boolean", description: "Non-selectable day." },
      { name: "outsideMonth", type: "boolean", description: "Adjacent-month day styling." },
      { name: "onDateSelect", type: "(date) => void", description: "Pointer selection callback." },
    ],
    reactExample: `import { CalendarDay } from "@/components/ui/CalendarDay";

export function Example() {
  return <CalendarDay date="2026-07-14" selected />;
}`,
  },
  {
    slug: "calendar-grid",
    name: "Calendar Grid",
    category: "Content & Data",
    summary: "Composed month-view calendar with single-date or range selection and grid keyboard navigation.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "partial",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Calendar Day composition — 7×6 month grid (inferred)",
    documentationUrl: getComponentDocumentationUrl("calendar-grid"),
    supportedVariants: ["single-date", "range"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/text/secondary",
      "component/radius/container",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Calendar Day — day cell building block", href: "/components/calendar-day" },
      { label: "Date Picker — field + popover composition", href: "/components/date-picker" },
      { label: "Popover — non-modal calendar shell in Date Picker", href: "/components/popover" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Month/year drill-up and range selection are implemented on Calendar Grid.",
      "Six-week grid with outside-month days visible is an initial policy — not fully verified in Figma Month Grid.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Calendar Grid composes Calendar Day: header + previous/next month buttons + weekday row + week rows. Clicking the header drills up to a month grid, then a year grid, for fast month/year navigation.",
    keyboardBehavior:
      "Arrow keys move by day; Home/End move within week; Page Up/Page Down change month; Enter/Space selects focused day. Roving tabindex keeps one day in tab order. The month and year drill-up grids use the same roving-tabindex model with arrow keys, Home/End, and Enter/Space over their own cells.",
    focusBehavior:
      "Month navigation buttons remain in tab order. Arrow-key navigation does not move focus back to the trigger.",
    comparisons: [
      {
        title: "How does Calendar Grid work with a keyboard?",
        body: "The grid uses role=\"grid\" with roving tabindex on day buttons and explicit arrow/Home/End/Page Up/Page Down handling.",
      },
      {
        title: "How does focus move between months?",
        body: "Page Up/Page Down and month buttons update the visible month while preserving the focused weekday where possible through date clamping.",
      },
      {
        title: "How are outside-month dates handled?",
        body: "Outside-month days remain visible and selectable unless disabled. They use muted styling.",
      },
      {
        title: "What week-start and locale assumptions are used?",
        body: "Initial batch uses en-GB formatting and Monday week start. Stored values remain locale-neutral YYYY-MM-DD strings.",
      },
      {
        title: "How does range selection work?",
        body: "Set mode=\"range\" and use rangeValue/defaultRangeValue/onRangeValueChange ({ start, end }) instead of value. First click sets start; second click commits end (swapped into chronological order if picked backwards); clicking inside a completed range starts fresh. Hovering or moving keyboard focus after start is set shows a live provisional preview of the range before it's committed.",
      },
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
      { name: "defaultVisibleMonth", type: "{ year, month }", description: "Initial visible month." },
    ],
    reactExample: `import { CalendarGrid } from "@/components/ui/CalendarGrid";

export function Example() {
  return <CalendarGrid defaultValue="2026-07-14" />;
}`,
  },
];
