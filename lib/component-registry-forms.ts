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
    relatedComponents: [
      { label: "Text Input — general single-line entry", href: "/components/text-input" },
      { label: "Form Field — label and validation placement", href: "/components/form-field" },
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
    anatomy: "SearchField = FormField + search input + MagnifyingGlass icon + optional clear button.",
    keyboardBehavior: "Native search input behavior. Escape clears when enabled. Clear button is a separate focusable control.",
    comparisons: [
      {
        title: "Search Field vs Text Input with a leading icon",
        body: "Search Field is the documented Figma component for search/filter use cases. It adds search semantics, the approved icon, and optional clear behavior without duplicating TextInput implementation.",
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
];
