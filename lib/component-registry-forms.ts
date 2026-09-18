import type { ComponentRegistryEntry } from "@/lib/component-registry";
import {
  COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID,
  COMBOBOX_FIGMA_FILE_URL,
} from "@/lib/combobox-figma-metadata";
import {
  DATE_PICKER_FIGMA_COMPONENT_SET_NODE_ID,
  DATE_PICKER_FIGMA_FILE_URL,
} from "@/lib/date-picker-figma-metadata";
import {
  FILE_UPLOAD_FIGMA_FILE_URL,
  FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID,
} from "@/lib/file-upload-figma-metadata";
import {
  SEARCH_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
  SEARCH_FIELD_FIGMA_FILE_URL,
} from "@/lib/search-field-figma-metadata";
import {
  SLIDER_FIGMA_COMPONENT_SET_NODE_ID,
  SLIDER_FIGMA_FILE_URL,
} from "@/lib/slider-figma-metadata";
import {
  CREDIT_CARD_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
  CREDIT_CARD_FIELD_FIGMA_FILE_URL,
} from "@/lib/credit-card-field-figma-metadata";
import {
  PHONE_NUMBER_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
  PHONE_NUMBER_FIELD_FIGMA_FILE_URL,
} from "@/lib/phone-number-field-figma-metadata";
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

const REACT_DATE = "2026-07-13";
const DOCS_DATE = "2026-06-01";

export const formsRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "form-field",
    name: "Form Field",
    category: "Forms",
    summary:
      "Form Field is a shared field wrapper for label, description, required indicator, and validation placement — not a visual input.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Form Field Wrapper — State (Default/Error)",
    documentationUrl: getComponentDocumentationUrl("form-field"),
    supportedVariants: ["default", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/text/danger",
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
      { label: "Validation Message — typed inline feedback", href: "/components/validation-message" },
      { label: "Text Input — control composed with FormField", href: "/components/text-input" },
      { label: "Textarea — multi-line control composition", href: "/components/textarea" },
      { label: "Select — native dropdown composition", href: "/components/select" },
      { label: "Search Field — search-specific composition", href: "/components/search-field" },
      { label: "Checkbox — inline label control", href: "/components/checkbox" },
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Horizontal label layout is unresolved in Figma — vertical layout only.",
      "React name is FormField; Figma name is Form Field Wrapper.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "FormField = label + control slot + supporting text or ValidationMessage. The nested control owns its own input semantics.",
    keyboardBehavior:
      "FormField does not introduce keyboard behavior — focus moves to the nested control using native tab order.",
    comparisons: [],
    apiProps: [
      { name: "label", type: "string", description: "Visible or visually hidden field label." },
      { name: "controlId", type: "string", description: "Stable id passed to the nested control." },
      { name: "required", type: "boolean", default: "false", description: "Shows required indicator." },
      { name: "supportingText", type: "string", description: "Helper/description linked with aria-describedby." },
      { name: "error", type: "string", description: "Static validation message rendered through ValidationMessage." },
      { name: "children", type: "(args) => ReactNode", description: "Render prop receiving controlId, describedBy, invalid." },
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
}`,
  },
  {
    slug: "validation-message",
    name: "Validation Message",
    category: "Forms",
    summary:
      "Validation Message is inline typed feedback paired with a field — error, warning, success, or info — with icon and text.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: "2026-08-30",
    figmaReference: "Forms / Validation Message — Type (Error/Warning/Success/Info)",
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
      "semantic/feedback/info",
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
      "--semantic-feedback-warning",
    ],
    relatedComponents: [
      { label: "Form Field — positions validation below controls", href: "/components/form-field" },
      { label: "Text Input — common consumer of validation output", href: "/components/text-input" },
    ],
    relatedTokens: [
      { label: "component/validation-message/error/text", href: "/foundations" },
      { label: "component/validation-message/warning/text", href: "/foundations" },
      { label: "component/validation-message/success/text", href: "/foundations" },
      { label: "component/validation-message/info/text", href: "/foundations" },
      { label: "component/validation-message/text", href: "/foundations" },
      { label: "semantic/feedback/warning", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "Info type icon swap to dedicated Info icon is pending Figma confirmation.",
      "Warning icon contrast remains a separate Figma-first task; React icons stay on semantic-feedback-warning.",
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
      { name: "id", type: "string", description: "Used by aria-describedby on the related control." },
    ],
    reactExample: `import { ValidationMessage } from "@/components/ui/ValidationMessage";

export function Example() {
  return (
    <ValidationMessage id="email-error" type="error" announce="assertive">
      Enter a valid email address.
    </ValidationMessage>
  );
}`,
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    category: "Forms",
    summary:
      "Checkbox is a native checkbox for independent or multi-select choices, including indeterminate group states.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Checkbox — Value × State (12 variants)",
    documentationUrl: getComponentDocumentationUrl("checkbox"),
    supportedVariants: ["unchecked", "checked", "indeterminate", "disabled", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/focus-ring",
      "semantic/action/danger",
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
      "--surface-fill-control",
    ],
    relatedComponents: [
      { label: "Switch — immediate settings toggle", href: "/components/switch" },
      { label: "Radio — mutually exclusive choice", href: "/components/radio" },
      { label: "Form Field — group label and validation", href: "/components/form-field" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Figma does not define a separate Checkbox size variant — single control size implemented.",
      "Checkbox controls intentionally ignore decorative Gradient/Glass surfaces.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Checkbox = native input[type=checkbox] + inline label text.",
    keyboardBehavior: "Space toggles when focused. Standard tab order to the native input.",
    comparisons: [
      {
        title: "When should a Switch be used instead of a Checkbox?",
        body: "Use Checkbox for form selections and consent that submit with a form. Use Switch for settings that apply immediately without a separate submit action.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible label associated with the native checkbox." },
      { name: "checked", type: "boolean", description: "Controlled checked state." },
      { name: "defaultChecked", type: "boolean", description: "Uncontrolled initial checked state." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Sets native indeterminate property." },
      { name: "disabled", type: "boolean", default: "false", description: "Native disabled state." },
      { name: "aria-invalid", type: "boolean", description: "Error state when composed with FormField validation." },
    ],
    reactExample: `import { Checkbox } from "@/components/ui/Checkbox";

export function Example() {
  return <Checkbox label="Email me product updates" defaultChecked />;
}`,
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
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Radio — Value × State (8 variants)",
    documentationUrl: getComponentDocumentationUrl("radio"),
    supportedVariants: ["unselected", "selected", "disabled", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/focus-ring",
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
      "--surface-fill-control",
    ],
    relatedComponents: [
      { label: "Radio Group — group label and selection management", href: "/components/radio-group" },
      { label: "Select — long option lists", href: "/components/select" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Radio indicator remains circular in all shape personalities by design.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Radio = native input[type=radio] + inline label text.",
    keyboardBehavior: "Arrow keys move selection within a named group using native radio behavior.",
    comparisons: [],
    apiProps: [
      { name: "label", type: "string", description: "Visible option label." },
      { name: "name", type: "string", description: "Shared group name — required for grouping." },
      { name: "value", type: "string", description: "Option value." },
      { name: "checked", type: "boolean", description: "Controlled selected state." },
      { name: "disabled", type: "boolean", default: "false", description: "Native disabled state." },
    ],
    reactExample: `import { Radio } from "@/components/ui/Radio";

export function Example() {
  return <Radio name="plan" value="pro" label="Pro" defaultChecked />;
}`,
  },
  {
    slug: "radio-group",
    name: "Radio Group",
    category: "Forms",
    summary:
      "Radio Group is an accessible grouping layer for mutually exclusive radio options with legend, helper text, and errors.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "partial",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Radio — composed as a named set",
    documentationUrl: getComponentDocumentationUrl("radio-group"),
    supportedVariants: ["default", "disabled", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/action/primary",
      "semantic/focus-ring",
      "semantic/action/danger",
      "semantic/text/danger",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts"],
    registryDependencies: ["@skrewww/radio", "@skrewww/validation-message", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/RadioGroup.tsx"],
    relatedComponents: [
      { label: "Radio — individual option control", href: "/components/radio" },
      { label: "Select — hidden long option lists", href: "/components/select" },
      { label: "Form Field — shared validation pattern", href: "/components/form-field" },
    ],
    relatedTokens: [
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Figma documents Radio variants but not a separate Radio Group component frame — group behavior inferred from accessibility requirements.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "RadioGroup = fieldset + legend + Radio options + helper or ValidationMessage.",
    keyboardBehavior: "Native radio group arrow-key navigation within the shared name.",
    comparisons: [
      {
        title: "When should a Select be used instead of a Radio Group?",
        body: "Use Radio Group when every option should remain visible and the list is short (roughly 2–6 items). Use Select when space is limited or the list is too long to scan comfortably.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Group label rendered as legend." },
      { name: "options", type: "{ value, label, disabled? }[]", description: "Radio options in the group." },
      { name: "value", type: "string", description: "Controlled selected value." },
      { name: "defaultValue", type: "string", description: "Initial uncontrolled value." },
      { name: "error", type: "string", description: "Group-level validation message." },
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
}`,
  },
  {
    slug: "switch",
    name: "Switch",
    category: "Forms",
    summary:
      "Switch is a boolean settings control for immediate on/off changes — not a substitute for Checkbox in forms.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Switch — Value (Off/On) × State (8 variants)",
    documentationUrl: getComponentDocumentationUrl("switch"),
    supportedVariants: ["off", "on", "disabled"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/border/strong",
      "semantic/action/primary",
      "semantic/surface/default",
      "semantic/focus-ring",
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
      "--shape-radius-control",
    ],
    relatedComponents: [
      { label: "Checkbox — form and multi-select choices", href: "/components/checkbox" },
      { label: "Form Field — settings section descriptions", href: "/components/form-field" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    // Geometry verified against the canonical Figma contract (2026-09):
    // 40×24 track, 18×18 thumb, 2px inset, 18px travel, 8px label gap,
    // Shape-aware Track via the shared runtime radius token, Thumb always
    // circular. No longer an open question.
    openQuestions: ["Switch surfaces remain functionally flat in Gradient/Glass modes."],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Switch = role=switch button + track + thumb + visible label.",
    keyboardBehavior:
      "Space and Enter activate the native button, which toggles aria-checked through click handling. type=\"button\" prevents form submission.",
    comparisons: [
      {
        title: "What is the difference between Checkbox and Switch?",
        body: "Checkbox records a choice that usually submits with a form. Switch applies a setting immediately, such as notifications or theme preferences.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Accessible name via aria-labelledby." },
      { name: "checked", type: "boolean", description: "Controlled on state." },
      { name: "defaultChecked", type: "boolean", description: "Initial uncontrolled on state." },
      { name: "disabled", type: "boolean", default: "false", description: "Prevents toggling." },
    ],
    reactExample: `import { Switch } from "@/components/ui/Switch";

export function Example() {
  return <Switch label="Email notifications" defaultChecked />;
}`,
  },
  {
    slug: "textarea",
    name: "Textarea",
    category: "Forms",
    summary:
      "Textarea is a multi-line native textarea for longer free-text content, composed with FormField for label and validation.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Textarea — State × Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("textarea"),
    supportedVariants: ["default", "error", "disabled", "read-only"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/focus-ring",
      "semantic/surface/default",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/text-input.module.css",
      "public/right-bottom-icon.svg",
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
      "--control-textarea-min-height-sm",
    ],
    relatedComponents: [
      { label: "Form Field — label and validation placement", href: "/components/form-field" },
      { label: "Text Input — single-line counterpart", href: "/components/text-input" },
      { label: "Validation Message — typed inline feedback", href: "/components/validation-message" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Minimum height uses temporary tokens — Figma has no numeric height property.",
      "Vertical resize enabled as temporary default pending Figma confirmation.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Textarea = native textarea with shared field border/radius tokens. FormField supplies label and validation.",
    keyboardBehavior: "Native textarea keyboard behavior. Tab moves focus in and out.",
    comparisons: [
      {
        title: "When should I use Textarea instead of Text Input?",
        body: "Use Textarea when users need multiple lines — descriptions, comments, or messages. Text Input is for single-line values.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "rows", type: "number", default: "4", description: "Initial visible row count." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Control sizing token set." },
      { name: "readOnly", type: "boolean", description: "Focusable but not editable." },
      { name: "error", type: "string", description: "Validation message rendered through FormField." },
    ],
    reactExample: `import { Textarea } from "@/components/ui/Textarea";

export function Example() {
  return (
    <Textarea
      label="Description"
      placeholder="Tell us about your project…"
      supportingText="Plain text only."
      rows={4}
    />
  );
}`,
  },
  {
    slug: "select",
    name: "Select",
    category: "Forms",
    summary:
      "Select is a combobox-style single-select with a Popover listbox trigger and hidden native select for form submission.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Select — State × Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("select"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/icon/muted",
      "semantic/focus-ring",
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
      "--shape-radius-control",
    ],
    relatedComponents: [
      { label: "Form Field — label and validation placement", href: "/components/form-field" },
      { label: "Radio Group — visible mutually exclusive options", href: "/components/radio-group" },
      { label: "Combobox — searchable predefined option selection", href: "/components/combobox" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Decorative CaretDown icon overlays native appearance:none styling.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Select = combobox trigger + Popover listbox + hidden native select + FormField label/validation.",
    keyboardBehavior:
      "Combobox opens the listbox. Arrow keys, Home, and End move between options. Native select remains for form fallback.",
    comparisons: [
      {
        title: "Why is this not a Combobox?",
        body: "Select preserves a non-editable trigger and native select fallback. Combobox is the searchable editable input for long predefined lists.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "options", type: "SelectOption[]", description: "Flat list of value/label pairs." },
      { name: "placeholder", type: "string", description: "Empty disabled hidden placeholder option." },
      { name: "required", type: "boolean", description: "Requires a non-placeholder selection." },
      { name: "error", type: "string", description: "Validation message rendered through FormField." },
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
}`,
  },
  {
    slug: "combobox",
    name: "Combobox",
    category: "Forms",
    summary:
      "Combobox is an editable searchable single-select with a filterable listbox — distinct from non-searchable Select and query-only Search Field.",
    status: "beta",
    version: "0.2.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: "2026-08-31",
    figmaReference: "Forms / Combobox — State (5 variants)",
    figmaSourceUrl: COMBOBOX_FIGMA_FILE_URL,
    figmaNodeId: COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
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
      "semantic/focus-ring",
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
      "components/ui/internal/combobox-scroll.ts",
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
      "--semantic-focus-ring",
    ],
    relatedComponents: [
      { label: "Select — non-searchable predefined choice", href: "/components/select" },
      { label: "Search Field — query input without option picking", href: "/components/search-field" },
      { label: "Form Field — label and validation placement", href: "/components/form-field" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "menu/surface", href: "/foundations" },
      { label: "component/menu/item-hover", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "No multi-select / chips mode — Figma Multi-select property was removed 2026-07-15 to match React single-select.",
      "Option leading icons and descriptions remain out of scope for ComboboxOption.",
      "Remote/async fetching is not implemented.",
      "Free-form custom values are not supported — closed predefined option list only.",
      "Diacritic-insensitive filtering is not implemented — locale lowercase only.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Combobox = editable text input + filterable Popover listbox + hidden submitted value + FormField label/validation.",
    keyboardBehavior:
      "Focus remains in the input. Arrow keys move aria-activedescendant. Enter commits the active option. Escape closes without clearing. Tab closes without implicit selection.",
    focusBehavior:
      "DOM focus stays in the native text input; active option is exposed with aria-activedescendant.",
    dismissalBehavior:
      "Outside pointer, Escape, and Tab close the listbox without trapping focus or submitting arbitrary text.",
    announcementBehavior:
      "Polite role=status region announces on open, when results become empty, and when results return after empty. No role=option for empty rows.",
    comparisons: [
      {
        title: "What is the difference between Combobox and Select?",
        body: "Select uses a button-like combobox trigger with a non-editable display label. Combobox uses an editable input to filter predefined options.",
      },
      {
        title: "What is the difference between Combobox and Search Field?",
        body: "Search Field captures a query string. Combobox commits one predefined option value for forms and selection workflows.",
      },
      {
        title: "Does Combobox allow custom values?",
        body: "No in Beta. Unmatched blur text reverts to the last committed option label rather than creating a new value.",
      },
      {
        title: "How does blur matching work?",
        body: "Case-insensitive exact label match commits one unique option. Duplicate labels never commit on blur. Disabled options never commit on blur.",
      },
      {
        title: "How are no-results announced?",
        body: "A polite visually hidden status region announces when the list opens, when results become empty, and when results return — not on every keystroke.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "options", type: "ComboboxOption[]", description: "Predefined value/label pairs." },
      { name: "value", type: "string", description: "Controlled selected option value." },
      { name: "inputValue", type: "string", description: "Controlled input text while editing." },
      { name: "open", type: "boolean", description: "Controlled popup open state." },
      { name: "filterMode", type: '"prefix" | "substring"', default: '"prefix"', description: "Local filtering strategy." },
      { name: "required", type: "boolean", description: "Requires a committed option value." },
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
}`,
  },
  {
    slug: "search-field",
    name: "Search Field",
    category: "Forms",
    summary:
      "Search Field is a search-specific text field with leading magnifying-glass icon and optional clear action — built on shared text-input control behavior.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Search Field — State × Size (12 variants)",
    figmaSourceUrl: SEARCH_FIELD_FIGMA_FILE_URL,
    figmaNodeId: SEARCH_FIELD_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("search-field"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/icon/muted",
      "semantic/focus-ring",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
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
      "--shape-radius-control",
    ],
    relatedComponents: [
      { label: "Text Input — general single-line entry", href: "/components/text-input" },
      { label: "Form Field — label and validation placement", href: "/components/form-field" },
      { label: "Combobox — select from a filterable option list", href: "/components/combobox" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "No autocomplete, suggestions, or result popover in this phase.",
      "Escape clears the field when a value is present and showClear is enabled.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "SearchField = FormField + native <input type=\"search\"> + MagnifyingGlass icon + optional clear button (accessible name \"Clear search\").",
    keyboardBehavior:
      "Native search input behavior. Escape clears when showClear is enabled and the field has a value. Clear button is a separate focusable control.",
    comparisons: [
      {
        title: "Search Field vs Text Input with a leading icon",
        body: "Search Field is the documented Figma component for search/filter use cases. It adds search semantics, the approved icon, and optional clear behavior without duplicating TextInput implementation.",
      },
      {
        title: "Search Field vs Combobox",
        body: "Search Field captures a free-form search query string with native search semantics — it is not a constrained option-selection model and does not present selectable suggestions. Combobox connects an editable input to a list of predefined options so users can filter and commit one option value. Use Combobox when selecting from available options; use Search Field when the query itself is the value.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Visible field label via FormField." },
      { name: "showClear", type: "boolean", default: "true", description: "Shows clear button when value is non-empty." },
      { name: "onValueChange", type: "(value: string) => void", description: "Controlled value change callback." },
      { name: "error", type: "string", description: "Validation message rendered through FormField." },
    ],
    reactExample: `import { SearchField } from "@/components/ui/SearchField";

export function Example() {
  return (
    <SearchField
      label="Search components"
      placeholder="Search the design system…"
      defaultValue=""
    />
  );
}`,
  },
  {
    slug: "credit-card-field",
    name: "Credit Card Field",
    category: "Forms",
    summary:
      "Credit Card Field is a compound UI control for card number, expiry, and CVC in one shell — visual pattern only, not a payment processor or PCI vault.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "Forms / Credit Card Field — State Default/Focused/Error/Disabled (4)",
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
      "color/neutral/200",
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
      "--surface-fill-control",
    ],
    relatedComponents: [
      { label: "Text Input — single-line field chrome family", href: "/components/text-input" },
      { label: "Form Field — label/description/error pattern", href: "/components/form-field" },
      { label: "Validation Message — error text", href: "/components/validation-message" },
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma default TEXT shows masked demo digits (••••) — React does not mask PANs; apps must not treat UI masking as security.",
      "No Size axis in Figma — shell matches Text Input md height.",
      "Production card capture should prefer hosted/tokenized provider fields; this component is the visual pattern only.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "CreditCardField = fieldset/legend + shared shell (generic CreditCard icon + number input + divider + expiry input + divider + CVC input) + optional supporting/error text.",
    keyboardBehavior:
      "Standard text editing in each segment. Tab moves between number, expiry, and CVC. Shell focus-within shows the Focused chrome.",
    focusBehavior:
      "Focus ring is on the shared shell (:focus-within), matching Figma State=Focused. Segments themselves do not draw a second ring.",
    comparisons: [
      {
        title: "Is this a payment integration?",
        body: "No. It does not tokenize, authorize, store, or transmit card data. Prefer Stripe Elements / equivalent hosted fields for PCI-sensitive capture.",
      },
      {
        title: "Does it detect Visa/Mastercard?",
        body: "No. Figma uses a generic Icon/CreditCard deliberately — network logos are not reproduced.",
      },
      {
        title: "What validation does Credit Card Field perform?",
        body: "Consumers can supply an error string to show invalid chrome and message text. Skrewww does not run Luhn checks or card-network validation. This remains a UI/input pattern for card details — not a payment processor.",
      },
    ],
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible fieldset legend for the compound control.",
      },
      {
        name: "value",
        type: "{ number: string; expiry: string; cvc: string }",
        description:
          "Controlled digit-only values (no spaces/slash). Display formatting is presentation-only.",
      },
      {
        name: "defaultValue",
        type: "{ number: string; expiry: string; cvc: string }",
        description: "Uncontrolled initial digit-only values.",
      },
      {
        name: "onValueChange",
        type: "(value: { number; expiry; cvc }) => void",
        description: "Fires with digit-only values after edits/paste.",
      },
      {
        name: "numberLabel",
        type: "string",
        default: '"Card number"',
        description: "Accessible name for the number segment.",
      },
      {
        name: "expiryLabel",
        type: "string",
        default: '"Expiry"',
        description: "Accessible name for the expiry segment.",
      },
      {
        name: "cvcLabel",
        type: "string",
        default: '"CVC"',
        description: "Accessible name for the CVC segment.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables all segments and dims the shell.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only segments; shell remains interactive for focus.",
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Marks the group and each segment required.",
      },
      {
        name: "error",
        type: "string",
        description: "Error message; sets invalid chrome on the shared shell.",
      },
      {
        name: "supportingText",
        type: "string",
        description: "Help text when no error is present.",
      },
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
      supportingText="UI pattern only — use a payment provider for real card capture."
    />
  );
}`,
  },
  {
    slug: "phone-number-field",
    name: "Phone Number Field",
    category: "Forms",
    summary:
      "Phone Number Field pairs a country/dial-code selector with a phone number input — UI pattern only, not SMS verification or carrier lookup.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "Forms / Phone Number Field — State Default/Focused/Error/Disabled (4)",
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
      "semantic/surface/default",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "lib/phone-number-field-countries.ts",
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
      "--semantic-text-secondary",
    ],
    relatedComponents: [
      { label: "Select — country / dial-code control", href: "/components/select" },
      { label: "Text Input — number segment chrome family", href: "/components/text-input" },
      { label: "Form Field — label/description/error pattern", href: "/components/form-field" },
      { label: "Validation Message — error text", href: "/components/validation-message" },
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma flag is a generic two-stripe placeholder — React keeps it decorative (aria-hidden); country identity comes from Select option text.",
      "Default country list is illustrative (12 entries) — pass `countries` for production datasets.",
      "No national formatting engine — sanitization only allows digits and common phone punctuation.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "PhoneNumberField = fieldset/legend + Country Selector (decorative flag placeholder + Select dial-code) + Number Input (type=tel) + optional supporting/error text.",
    keyboardBehavior:
      "Tab moves between country Select and phone number input. Select opens listbox with arrow keys; number input uses standard text editing.",
    focusBehavior:
      "Each control owns its own focus chrome (Select trigger / Text Input), matching Figma’s two adjacent bordered controls.",
    comparisons: [
      {
        title: "Does this verify the phone number?",
        body: "No. It does not send SMS, check ownership, look up carriers, or confirm reachability. It is a UI input pattern only.",
      },
      {
        title: "Are the flags real national flags?",
        body: "No. Figma and React use a generic two-stripe placeholder. Accessible country identity is the Select option label (name + dial code).",
      },
    ],
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible fieldset legend for the compound control.",
      },
      {
        name: "country",
        type: "string",
        description: "Controlled country option value (e.g. ISO alpha-2).",
      },
      {
        name: "defaultCountry",
        type: "string",
        description: "Uncontrolled initial country option value.",
      },
      {
        name: "onCountryChange",
        type: "(country: string) => void",
        description: "Fires when the selected country changes.",
      },
      {
        name: "value",
        type: "string",
        description: "Controlled phone number string (sanitized punctuation allowed).",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "Uncontrolled initial phone number string.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Fires with the sanitized phone number after edits/paste.",
      },
      {
        name: "countries",
        type: "PhoneCountryOption[]",
        description:
          "Country options ({ value, dialCode, label }). Defaults to a small illustrative list.",
      },
      {
        name: "countryLabel",
        type: "string",
        default: '"Country"',
        description: "Accessible name for the country selector.",
      },
      {
        name: "numberLabel",
        type: "string",
        default: '"Phone number"',
        description: "Accessible name for the phone number input.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Phone number"',
        description: "Placeholder for the number input.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables country selector and number input.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only number input; country selector is non-editable.",
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Marks the group and both controls required.",
      },
      {
        name: "error",
        type: "string",
        description: "Error message; sets invalid chrome on both controls.",
      },
      {
        name: "supportingText",
        type: "string",
        description: "Help text when no error is present.",
      },
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
      supportingText="UI pattern only — not SMS verification or carrier lookup."
    />
  );
}`,
  },
  {
    slug: "number-input",
    name: "Number Input",
    category: "Forms",
    summary:
      "Number Input is direct numeric entry with optional steppers and min/max/step — not currency, quantity business logic, or a Slider.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "None yet — React-first CE-2B; Figma master pending",
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
      "semantic/text/secondary",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "lib/number-input-value.ts",
    ],
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/NumberInput.tsx", "components/ui/number-input.module.css"],
    cssTokens: [
      "--opacity-disabled",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-subtle",
      "--semantic-text-primary",
    ],
    relatedComponents: [
      { label: "Text Input — field chrome family", href: "/components/text-input" },
      { label: "Form Field — label/description/error", href: "/components/form-field" },
      { label: "Slider — bounded visual numeric adjustment", href: "/components/slider" },
      { label: "Validation Message — error text", href: "/components/validation-message" },
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma master not created yet — intentional React-first CE-2 sequence; design follow-up later.",
      "Locale/currency formatting explicitly out of scope for 0.1.0-beta.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "NumberInput = FormField + TextInputControl (type=text, role=spinbutton) + optional Increment/Decrement stepper buttons.",
    keyboardBehavior:
      "Type digits/decimal/minus. Arrow Up/Down step by `step`. Enter commits. Blur clamps/snaps to min/max/step. Intermediate drafts (-, 1.) allowed while focused.",
    focusBehavior:
      "Focus ring on the text control. Stepper buttons are mouse/pointer aids (tabIndex=-1) and do not steal focus from the input.",
    comparisons: [
      {
        title: "Number Input vs Slider?",
        body: "Use Number Input for direct numeric entry and stepping. Use Slider when a bounded visual adjustment is the primary interaction.",
      },
      {
        title: "Is this a currency field?",
        body: "No. There is no locale, currency symbol, or money-precision API. Build currency on top of app logic, not this primitive.",
      },
      {
        title: "Why not input type=number?",
        body: "Native number inputs have inconsistent spinner chrome, awkward intermediate values, and weaker styling control. Skrewww uses text + spinbutton ARIA with optional steppers.",
      },
    ],
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible Form Field label.",
      },
      {
        name: "value",
        type: "number | null",
        description: "Controlled value. null means empty.",
      },
      {
        name: "defaultValue",
        type: "number | null",
        description: "Uncontrolled initial value. null means empty.",
      },
      {
        name: "onValueChange",
        type: "(value: number | null) => void",
        description: "Fires when the committed numeric value changes.",
      },
      {
        name: "min",
        type: "number",
        description: "Minimum. Applied on blur/step/arrows, not every keystroke.",
      },
      {
        name: "max",
        type: "number",
        description: "Maximum. Applied on blur/step/arrows, not every keystroke.",
      },
      {
        name: "step",
        type: "number",
        default: "1",
        description: "Step size for arrows and steppers; used for snap on commit.",
      },
      {
        name: "showSteppers",
        type: "boolean",
        default: "true",
        description: "Shows increment/decrement controls.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Control size matching Text Input.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables input and steppers.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only input; steppers disabled.",
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Marks the field required.",
      },
      {
        name: "error",
        type: "string",
        description: "Error message via Form Field.",
      },
      {
        name: "supportingText",
        type: "string",
        description: "Help text when no error is present.",
      },
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
      supportingText="Direct numeric entry — not currency formatting."
    />
  );
}`,
  },
  {
    slug: "date-picker",
    name: "Date Picker",
    category: "Forms",
    summary:
      "Date Picker is a date-only field with editable D MMM YYYY text entry (en-GB) and calendar popover for single-date selection.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / Date Picker — text-input-style trigger + calendar popover",
    figmaSourceUrl: DATE_PICKER_FIGMA_FILE_URL,
    figmaNodeId: DATE_PICKER_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("date-picker"),
    supportedVariants: ["single-date"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/icon/muted",
      "semantic/focus-ring",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "components/ui/internal/calendar-date.ts",
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
      "--shape-radius-control",
    ],
    relatedComponents: [
      { label: "Calendar Grid — month selection surface", href: "/components/calendar-grid" },
      { label: "Calendar Day — day cell building block", href: "/components/calendar-day" },
      { label: "Form Field — label and validation wrapper", href: "/components/form-field" },
      { label: "Popover — non-modal calendar shell", href: "/components/popover" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Custom formatDate/parseDate pairs override locale display when both are provided.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Date Picker composes FormField + editable text input + calendar button + Popover + Calendar Grid + hidden YYYY-MM-DD input.",
    keyboardBehavior:
      "Calendar button opens the popover. Text field accepts D MMM YYYY entry (blur/Enter to commit). Calendar Grid handles day navigation. Escape closes and restores trigger focus.",
    focusBehavior:
      "Opening moves focus into Calendar Grid on the selected date, today, or first day of visible month.",
    dismissalBehavior:
      "Escape closes with focus restoration. Outside pointer closes without stealing clicked-target focus. Date selection closes the popover.",
    comparisons: [
      {
        title: "Should Date Picker allow direct text entry?",
        body: "Yes — the text field accepts D MMM YYYY (en-GB only, e.g. 11 Jul 2026). Invalid, out-of-range, or disabled dates show a visible validation error. Numeric regional formats are not accepted.",
      },
      {
        title: "How is the selected date submitted in a form?",
        body: "A hidden input submits canonical YYYY-MM-DD. Display text is not submitted.",
      },
      {
        title: "What is the difference between Date Picker and Calendar Grid?",
        body: "Calendar Grid is the month selection surface. Date Picker wraps it in a labelled field with popover trigger behavior.",
      },
      {
        title: "How does Date Picker avoid time-zone date shifts?",
        body: "Values are stored and submitted as date-only YYYY-MM-DD strings using local calendar arithmetic — never UTC midnight conversion.",
      },
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
      { name: "isDateDisabled", type: "(date) => boolean", description: "Additional disabled-date predicate." },
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
}`,
  },
  {
    slug: "file-upload",
    name: "File Upload",
    category: "Forms",
    summary:
      "File Upload is a native file input with drag-and-drop dropzone, advisory validation, selected-file list, and multipart form submission — selection only, not network upload.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Forms / File Upload — State (Empty/Dragging/Filled/Error/Disabled)",
    figmaSourceUrl: FILE_UPLOAD_FIGMA_FILE_URL,
    figmaNodeId: FILE_UPLOAD_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
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
      "semantic/surface/elevated",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/file-upload-file-list.ts",
      "components/ui/internal/file-upload-validation.ts",
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
      "--shape-radius-control",
    ],
    relatedComponents: [
      { label: "Form Field — label and validation wrapper", href: "/components/form-field" },
      { label: "Validation Message — inline field feedback", href: "/components/validation-message" },
      { label: "Progress Bar — deferred consumer-owned upload progress", href: "/components/progress-bar" },
      { label: "Button — not duplicated; remove uses native button styling", href: "/components/button" },
    ],
    relatedTokens: [
      { label: "component/card/surface", href: "/foundations" },
      { label: "component/card/border", href: "/foundations" },
      { label: "component/file-upload/dragging-surface", href: "/foundations" },
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/action/danger", href: "/foundations" },
      { label: "semantic/icon/danger", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Controlled files prop is intentionally unsupported in this MVP.",
      "Upload progress, retry, preview, and async behavior are deferred.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "FileUpload = FormField + native file input overlay + dropzone + selected-file list + remove buttons + polite status region.",
    keyboardBehavior:
      "Tab reaches the native file input over the dropzone. Enter/Space in the file picker opens the OS chooser. Remove buttons are independently focusable.",
    focusBehavior:
      "Focus-visible ring appears on the dropzone through :focus-within. Removing the final file returns focus to the file input.",
    announcementBehavior:
      "Polite status region announces selection, rejection, removal, and clear events — not every dragenter/dragleave.",
    comparisons: [
      {
        title: "What does File Upload own?",
        body: "File Upload selects, validates, lists, and removes files locally. Your application performs the network upload.",
      },
      {
        title: "Does File Upload perform the network upload?",
        body: "No. There are no uploadUrl, autoUpload, or storage props. Consumers read files from onFilesChange, the input, or FormData.",
      },
      {
        title: "Can File Upload submit through a native form?",
        body: "Yes. Files submit through the real input[type=file] using native multipart encoding when synchronized via DataTransfer.",
      },
      {
        title: "How are rejected files reported?",
        body: "Invalid type, size, or count rejections render as text messages and fire onRejectedFiles once per batch. Valid files in mixed batches are kept.",
      },
      {
        title: "Why is server-side validation still required?",
        body: "accept is a picker hint, MIME values can be spoofed, and client size checks are advisory only.",
      },
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
      { name: "onRejectedFiles", type: "(rejections) => void", description: "Fires once with advisory rejection details." },
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
}`,
  },
  {
    slug: "slider",
    name: "Slider",
    category: "Forms",
    summary:
      "Slider is a single-value control for selecting a number within min/max by dragging or keyboard-adjusting a thumb along a track.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-09-13",
    reactLastUpdated: "2026-09-13",
    figmaReference: "Forms / Slider — State (Default/Hover/Focused/Disabled)",
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
      "opacity/disabled",
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
      "--slider-track-height",
    ],
    relatedComponents: [
      { label: "Progress Bar — read-only completion, not value selection", href: "/components/progress-bar" },
      { label: "Switch — boolean settings toggle", href: "/components/switch" },
      { label: "Text Input — precise numeric entry", href: "/components/text-input" },
      { label: "Form Field — label and validation composition", href: "/components/form-field" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Figma Style (Success/Warning/Danger) prose in older docs is superseded by verified State variants — no status-color Style prop in Beta.",
      "Dual-thumb range and vertical orientation are not in the verified Figma component set.",
      "Individual /r manifest deferred to CE-3 — not part of the current 8-component + foundation distribution cut.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Slider = visible label + role=slider control (track + fill + thumb).",
    keyboardBehavior:
      "Arrow keys adjust by step; Home/End jump to min/max; Page Up/Down move by ~10% of the range (snapped to step). Pointer drag and track click set the value.",
    focusBehavior:
      "Focus-visible paints the thumb stroke with semantic/focus-ring and a matching outline ring.",
    comparisons: [
      {
        title: "When should Progress Bar be used instead?",
        body: "Use Progress Bar for read-only completion. Use Slider when the user must choose a value.",
      },
      {
        title: "Does Beta Slider support a dual-thumb range?",
        body: "No. The verified Figma set is a single thumb. Range selection is deferred.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "Accessible name via aria-labelledby." },
      { name: "value", type: "number", description: "Controlled numeric value." },
      { name: "defaultValue", type: "number", default: "0", description: "Uncontrolled initial value." },
      { name: "onValueChange", type: "(value: number) => void", description: "Fires when the value changes." },
      { name: "min", type: "number", default: "0", description: "Minimum value (aria-valuemin)." },
      { name: "max", type: "number", default: "100", description: "Maximum value (aria-valuemax)." },
      { name: "step", type: "number", default: "1", description: "Increment for keyboard and snapped pointer changes." },
      { name: "disabled", type: "boolean", default: "false", description: "Prevents interaction and dims via opacity/disabled." },
    ],
    reactExample: `import { Slider } from "@/components/ui/Slider";

export function Example() {
  return <Slider label="Volume" defaultValue={40} min={0} max={100} step={1} />;
}`,
  },
];
