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

export const feedbackRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "alert",
    name: "Alert",
    category: "Feedback",
    summary:
      "Alert is a persistent inline feedback block for contextual status tied to page content — not auto-dismissing.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Alert — Type (Info/Success/Warning/Error)",
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
      "semantic/action/danger",
    ],
    relatedComponents: [
      { label: "Toast — transient notifications", href: "/components/toast" },
      { label: "Validation Message — field-level feedback only", href: "/components/validation-message" },
    ],
    relatedTokens: [
      { label: "semantic/feedback/info", href: "/foundations" },
      { label: "semantic/action/danger", href: "/foundations" },
      { label: "semantic/text/secondary (Alert description)", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Optional action slot semantics pending Figma confirmation for primary action placement.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior:
      "Default off. Use polite for non-urgent dynamic updates. Use assertive only for dynamically introduced urgent errors.",
    anatomy: "Alert = status icon + title + description + optional action + optional dismiss.",
    keyboardBehavior: "Dismiss and action controls follow native button keyboard behavior. Alert container is not focusable by default.",
    comparisons: [
      {
        title: "What is the difference between Alert and Toast?",
        body: "Alert stays in page content for persistent contextual messages. Toast floats temporarily above the page for transient confirmations.",
      },
    ],
    apiProps: [
      { name: "type", type: '"info" | "success" | "warning" | "error"', default: '"info"', description: "Status variant." },
      { name: "title", type: "string", description: "Optional alert title." },
      { name: "announce", type: '"off" | "polite" | "assertive"', default: '"off"', description: "Live region behavior." },
      { name: "dismissible", type: "boolean", default: "false", description: "Shows dismiss control." },
      { name: "onDismiss", type: "() => void", description: "Called when dismissed." },
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
}`,
  },
  {
    slug: "toast",
    name: "Toast",
    category: "Feedback",
    summary:
      "Toast is a transient floating notification for confirming actions or reporting short-lived events.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Toast — Type (4 variants)",
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
      "semantic/feedback/success",
    ],
    relatedComponents: [
      { label: "Alert — persistent inline feedback", href: "/components/alert" },
      { label: "Dialog — decisions requiring explicit confirmation", href: "/components/dialog" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "component/card/surface", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.surface],
    openQuestions: [
      "Undo action pattern pending Figma confirmation for Toast action slot.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior:
      "Success and info use polite live regions. Error may use assertive when urgent. Toasts do not steal focus.",
    anatomy: "Toast = viewport + queued toast surfaces with title/description, close, optional action.",
    keyboardBehavior: "Close button is focusable. Escape dismisses focused toast when supported. New toasts do not move focus.",
    comparisons: [
      {
        title: "When should a Toast remain visible?",
        body: "Keep Toasts visible long enough to read the message. Critical persistent errors belong in Alert, not Toast.",
      },
    ],
    apiProps: [
      { name: "type", type: '"info" | "success" | "warning" | "error"', default: '"info"', description: "Status variant." },
      { name: "title", type: "string", description: "Optional toast title." },
      { name: "duration", type: "number", default: "5000", description: "Auto-dismiss ms. Set 0 to persist." },
      { name: "announce", type: '"polite" | "assertive"', default: '"polite"', description: "Live region politeness." },
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
}`,
  },
  {
    slug: "progress-bar",
    name: "Progress Bar",
    category: "Feedback",
    summary:
      "Progress Bar is determinate or indeterminate progress toward a known or unknown completion point.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Progress Bar — Style (Default/Success/Warning/Danger)",
    documentationUrl: getComponentDocumentationUrl("progress-bar"),
    supportedVariants: ["default", "success", "warning", "danger"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/feedback/success",
      "semantic/feedback/warning",
      "semantic/action/danger",
    ],
    relatedComponents: [
      { label: "Spinner — indeterminate loading without measurable progress", href: "/components/spinner" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Figma has no numeric value property — React exposes value/max for determinate usage.",
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
        body: "Use Progress Bar when completion is measurable or indeterminate progress must be communicated semantically. Spinner covers decorative or standalone loading indicators.",
      },
    ],
    apiProps: [
      { name: "value", type: "number", description: "Current progress value." },
      { name: "max", type: "number", default: "100", description: "Maximum progress value." },
      { name: "label", type: "string", description: "Accessible name." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Unknown-duration progress." },
      { name: "variant", type: '"default" | "success" | "warning" | "danger"', default: '"default"', description: "Semantic style." },
    ],
    reactExample: `import { ProgressBar } from "@/components/ui/ProgressBar";

export function Example() {
  return <ProgressBar label="Uploading files" value={42} max={100} showValue />;
}`,
  },
  {
    slug: "spinner",
    name: "Spinner",
    category: "Feedback",
    summary:
      "Spinner is an indeterminate loading indicator for operations without a meaningful completion percentage.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Spinner — Size (Small/Medium/Large)",
    documentationUrl: getComponentDocumentationUrl("spinner"),
    supportedVariants: ["decorative", "labeled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: ["semantic/border/default", "semantic/action/primary"],
    relatedComponents: [
      { label: "Progress Bar — measurable progress", href: "/components/progress-bar" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Reduced-motion fallback uses stepped opacity pulse rather than rotation.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior:
      "Decorative spinners are aria-hidden. Standalone spinners expose one status label.",
    anatomy: "Spinner = rotating arc indicator with optional visible or screen-reader-only label.",
    keyboardBehavior: "Not interactive.",
    comparisons: [
      {
        title: "When should Spinner be hidden from screen readers?",
        body: "Hide the spinner when visible loading text already communicates status. Provide a label when the spinner is the only loading indicator.",
      },
    ],
    apiProps: [
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Spinner dimensions." },
      { name: "label", type: "string", description: "Accessible name for standalone usage." },
      { name: "decorative", type: "boolean", default: "false", description: "Hides spinner from assistive technology." },
    ],
    reactExample: `import { Spinner } from "@/components/ui/Spinner";

export function Example() {
  return <Spinner label="Loading results" />;
}`,
  },
  {
    slug: "badge",
    name: "Badge",
    category: "Feedback",
    summary:
      "Badge is a compact non-interactive label for status, classification, or numeric counts at a glance.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Badge — Style × Size (Figma: 6 styles × Small/Medium; React: 5 styles × sm/md/lg, no Primary)",
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
      "component/radius/control",
    ],
    relatedComponents: [
      { label: "Alert — persistent inline messages", href: "/components/alert" },
      { label: "Validation Message — field-level feedback only", href: "/components/validation-message" },
    ],
    relatedTokens: [
      { label: "--badge-warning-text → color/warning/800", href: "/foundations" },
      { label: "color/warning/800", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Removable Badge behavior is deferred — use Content/Tag when user-generated removable labels are required.",
      "Warning text is shared with Figma: React --badge-warning-text → color/warning/800 (#8A4F00); Figma component/badge/warning/text → color/warning/800 (#8A4F00).",
      "Neutral/Info/Success/Error Badge foregrounds remain accessibility-safe React divergences from Figma component/badge/*/text — do not lighten to the finalized Figma hexes for parity alone.",
      "React has no Primary Badge variant (Figma does). Primary is a future enhancement, not Stable-v1 scope.",
      "Stable-v1 intentional React extensions (not parity defects): 1px borders, size lg, optional status/leading icons, count mode, and API variant name error (maps to Figma Danger). Figma masters are label-only Small/Medium without borders. React tinted surfaces vs Figma opaque /100 remain a deferred visual sync, not a Stable-v1 blocker.",
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
        body: "Badge is a compact read-only label. Alert is a persistent message block with title, description, and optional actions.",
      },
      {
        title: "Is a Badge interactive?",
        body: "No. Badge is a span by default. Use Button or Tag patterns for interactive controls.",
      },
    ],
    apiProps: [
      { name: "variant", type: '"neutral" | "info" | "success" | "warning" | "error"', default: '"neutral"', description: "Status style." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Compact sizing." },
      { name: "count", type: "number", description: "Numeric count badge." },
      { name: "countMax", type: "number", default: "99", description: "Abbreviation threshold." },
      { name: "showStatusIcon", type: "boolean", default: "false", description: "Shows leading status icon." },
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
}`,
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    category: "Feedback",
    summary:
      "Tooltip is a brief supplementary label for a trigger, shown on keyboard focus or pointer hover.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Tooltip — Position (Top/Bottom/Left/Right)",
    documentationUrl: getComponentDocumentationUrl("tooltip"),
    supportedVariants: ["top", "right", "bottom", "left"],
    supportedSizes: [],
    tokensUsed: [
      "color/neutral/900",
      "component/radius/container",
      "semantic/text/inverse",
    ],
    relatedComponents: [
      { label: "Popover — richer supplementary content", href: "/components/popover" },
      { label: "Form Field — helper text for essential guidance", href: "/components/form-field" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.surface],
    openQuestions: [
      "Arrow pointer position remains a fixed Figma approximation — not dynamically bound to label width.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    announcementBehavior: "Tooltip content is exposed through aria-describedby while open — not a live region.",
    anatomy: "Tooltip = trigger + floating label associated with aria-describedby.",
    keyboardBehavior: "Opens on trigger focus. Escape closes. Tooltip does not receive focus.",
    comparisons: [
      {
        title: "What is the difference between Tooltip and Popover?",
        body: "Tooltip holds one concise string. Popover supports richer content and intentional interaction.",
      },
      {
        title: "Why should essential information not appear only in Tooltip?",
        body: "Touch users and many assistive technology workflows cannot rely on hover-only discovery.",
      },
    ],
    apiProps: [
      { name: "content", type: "React.ReactNode", description: "Tooltip label." },
      { name: "placement", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "Preferred placement." },
      { name: "openDelay", type: "number", description: "Open delay in ms." },
      { name: "closeDelay", type: "number", description: "Close delay in ms." },
    ],
    reactExample: `"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Tooltip content="Save changes">
      <Button aria-label="Save">💾</Button>
    </Tooltip>
  );
}`,
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    category: "Feedback",
    summary:
      "Skeleton is temporary placeholder shapes that preserve layout while known content is loading.",
    status: "beta",
    version: "0.3.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/feedback.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Feedback / Skeleton — Shape (Text/Circle/Rectangle)",
    documentationUrl: getComponentDocumentationUrl("skeleton"),
    supportedVariants: ["text", "circle", "rectangle"],
    supportedSizes: [],
    tokensUsed: ["color/neutral/300", "semantic/border/default", "component/radius/control"],
    relatedComponents: [
      { label: "Spinner — indeterminate loading without layout placeholder", href: "/components/spinner" },
      { label: "Progress Bar — measurable completion", href: "/components/progress-bar" },
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Composite skeleton layouts remain documentation examples until Figma confirms reusable list-item presets.",
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
        body: "Skeleton preserves layout for known content shapes. Spinner signals activity without mimicking final layout.",
      },
      {
        title: "Is Skeleton announced by screen readers?",
        body: "Individual skeleton shapes are hidden. Provide loading text at the container level with aria-busy.",
      },
    ],
    apiProps: [
      { name: "shape", type: '"text" | "circle" | "rectangle"', default: '"text"', description: "Placeholder geometry." },
      { name: "width", type: "string | number", description: "Custom width." },
      { name: "height", type: "string | number", description: "Custom height." },
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
}`,
  },
];
