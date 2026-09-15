/**
 * Tier B external-consumer smoke test (see
 * docs/architecture/shadcn-distribution.md's "Verified External Consumer
 * Test" section for the manual run this automates).
 *
 * Scaffolds a real, pinned, Tailwind-free create-next-app project into
 * os.tmpdir() (never inside this repo), serves the @skrewww registry
 * locally from manifests built in-memory via lib/shadcn-registry-generator.ts
 * (no write to public/r/ — the Skrewww working tree is never touched),
 * installs the requested @skrewww component via the real, pinned shadcn
 * CLI, wires and verifies Foundation CSS activation, renders the component
 * in a real page using its actual public API, and confirms `next build`
 * succeeds.
 *
 * Run: npm run smoke:consumer [-- <component>] [-- --keep]
 * <component> defaults to "button" when omitted, for backward
 * compatibility with the original Button-only smoke test. Currently
 * selectable: button, card, text-input (see COMPONENT_DESCRIPTORS below —
 * adding another component means adding a descriptor there, not touching
 * the orchestration logic itself, which is already component-agnostic).
 * form-field and validation-message are registered in MANIFEST_BUILDERS
 * as transitive-only dependencies (needed for recursive graph resolution
 * when text-input is selected) but have no descriptor of their own,
 * exactly like foundation never has one.
 * --keep preserves the OS-temp working directory and prints its path
 * instead of deleting it on exit.
 *
 * Deliberately NOT part of `npm test` / `npm run test:all` — this spins up
 * a real create-next-app + shadcn CLI install over the network and is far
 * heavier than anything else in that chain. See the architecture doc for
 * the tiering rationale (Tier A = pure-function unit tests, already in
 * test:all; Tier B = this script, manual/CI-optional; Tier C = production
 * registry, Tier D = real-browser interaction — both explicitly excluded
 * from the normal per-commit chain).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  openSync,
  closeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { chromium, type Page as PlaywrightPage } from "@playwright/test";
import {
  buildButtonManifest,
  buildCardManifest,
  buildCheckboxManifest,
  buildDividerManifest,
  buildFormFieldManifest,
  buildFoundationManifest,
  buildLinkManifest,
  buildPaginationManifest,
  buildProgressBarManifest,
  buildRadioManifest,
  buildRadioGroupManifest,
  buildAvatarManifest,
  buildBreadcrumbManifest,
  buildSkeletonManifest,
  buildSpinnerManifest,
  buildSwitchManifest,
  buildSliderManifest,
  buildStepperManifest,
  buildTableManifest,
  buildTextareaManifest,
  buildTextInputManifest,
  buildValidationMessageManifest,
  buildBadgeManifest,
  buildTagManifest,
  buildListItemManifest,
  buildTimelineManifest,
  buildEmptyStateManifest,
  buildAlertManifest,
  buildToastManifest,
  buildButtonGroupManifest,
  buildToggleGroupManifest,
  buildAccordionManifest,
  buildTabsManifest,
  buildSearchFieldManifest,
  buildCreditCardFieldManifest,
  buildNumberInputManifest,
  buildFileUploadManifest,
  buildPopoverManifest,
  buildTooltipManifest,
  buildDialogManifest,
  buildDrawerManifest,
  buildMenuManifest,
  buildSplitButtonManifest,
  buildComboboxManifest,
  buildSelectManifest,
  buildCalendarDayManifest,
  buildCalendarGridManifest,
  buildDatePickerManifest,
  buildPhoneNumberFieldManifest,
  buildTreeViewManifest,
  buildDataTableManifest,
  buildBarChartManifest,
  buildLineChartManifest,
  type ShadcnRegistryItem,
} from "../lib/shadcn-registry-generator";

const CREATE_NEXT_APP_VERSION = "16.3.0";
const SHADCN_VERSION = "4.16.2";

const cliArgs = process.argv.slice(2);
const KEEP = cliArgs.includes("--keep");

const MANIFEST_BUILDERS: Record<string, () => ShadcnRegistryItem> = {
  foundation: buildFoundationManifest,
  button: buildButtonManifest,
  card: buildCardManifest,
  "text-input": buildTextInputManifest,
  "form-field": buildFormFieldManifest,
  "validation-message": buildValidationMessageManifest,
  spinner: buildSpinnerManifest,
  divider: buildDividerManifest,
  link: buildLinkManifest,
  checkbox: buildCheckboxManifest,
  "progress-bar": buildProgressBarManifest,
  skeleton: buildSkeletonManifest,
  radio: buildRadioManifest,
  switch: buildSwitchManifest,
  textarea: buildTextareaManifest,
  pagination: buildPaginationManifest,
  avatar: buildAvatarManifest,
  breadcrumb: buildBreadcrumbManifest,
  "radio-group": buildRadioGroupManifest,
  slider: buildSliderManifest,
  stepper: buildStepperManifest,
  table: buildTableManifest,
  badge: buildBadgeManifest,
  tag: buildTagManifest,
  "list-item": buildListItemManifest,
  timeline: buildTimelineManifest,
  "empty-state": buildEmptyStateManifest,
  alert: buildAlertManifest,
  toast: buildToastManifest,
  "button-group": buildButtonGroupManifest,
  "toggle-group": buildToggleGroupManifest,
  accordion: buildAccordionManifest,
  tabs: buildTabsManifest,
  "search-field": buildSearchFieldManifest,
  "credit-card-field": buildCreditCardFieldManifest,
  "number-input": buildNumberInputManifest,
  "file-upload": buildFileUploadManifest,
  popover: buildPopoverManifest,
  tooltip: buildTooltipManifest,
  dialog: buildDialogManifest,
  drawer: buildDrawerManifest,
  menu: buildMenuManifest,
  "split-button": buildSplitButtonManifest,
  combobox: buildComboboxManifest,
  select: buildSelectManifest,
  "calendar-day": buildCalendarDayManifest,
  "calendar-grid": buildCalendarGridManifest,
  "date-picker": buildDatePickerManifest,
  "phone-number-field": buildPhoneNumberFieldManifest,
  "tree-view": buildTreeViewManifest,
  "data-table": buildDataTableManifest,
  "bar-chart": buildBarChartManifest,
  "line-chart": buildLineChartManifest,
};

/**
 * Everything that differs between components under smoke test: the static
 * independent critical-path safety net (deliberately separate from the
 * dynamically-derived target set — see the assertions in main() for why
 * both exist), and a minimal consumer page exercising the component's
 * REAL public API (never an invented compound API).
 *
 * expectedSharedTargets: consumer-relative paths (already run through
 * targetToRelPath — never "~/...") that this component's resolved graph
 * is expected to contribute from more than one manifest (e.g. lib/cn.ts
 * from both text-input and form-field). Defaults to none — Button/Card's
 * graphs never share a target across manifests.
 *
 * closeStdinOnAdd: closes stdin specifically for this component's
 * `shadcn add` invocation (see the closeStdin option on run()) — opt-in
 * per component so a first-of-its-kind interactive-prompt risk can be
 * hardened against without changing behavior for already-proven
 * components.
 *
 * browserAssert: optional installed-runtime browser verification (CE-3I) —
 * when present, main() starts `next start` against the built consumer,
 * opens a real headless Chromium page against it via Playwright, and
 * invokes this callback with a live Page + the server's base URL. Generic
 * and opt-in: every descriptor without it behaves exactly as before (build
 * success is still the only proof). Use this for components whose real
 * behavior (drag/drop, File API, keyboard interaction) cannot be proven by
 * a static page-source regex alone.
 */
type ComponentSmokeDescriptor = {
  criticalPaths: string[];
  renderHarness: () => string;
  assertHarness: (pageSource: string) => boolean;
  harnessAssertionLabel: string;
  expectedSharedTargets?: string[];
  closeStdinOnAdd?: boolean;
  /** Additional @skrewww/* items to install after the primary (composed proofs). */
  extraAdds?: string[];
  browserAssert?: (ctx: { page: PlaywrightPage; baseUrl: string }) => Promise<void>;
};

const COMPONENT_DESCRIPTORS: Record<string, ComponentSmokeDescriptor> = {
  button: {
    criticalPaths: [
      "components/ui/Button.tsx",
      "components/ui/button.module.css",
      "lib/cn.ts",
      "components/ui/icons.tsx",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Button } from "@/components/ui/Button";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12 }}>',
        '      <Button variant="primary">Smoke test default</Button>',
        '      <Button variant="primary" disabled>',
        "        Smoke test disabled",
        "      </Button>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Button"/.test(pageSource) && /disabled/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Button and renders default + disabled instances",
  },
  card: {
    criticalPaths: ["components/ui/Card.tsx", "components/ui/card.module.css", "lib/cn.ts", "styles/skrewww-foundation.css"],
    renderHarness: () =>
      [
        'import { Card } from "@/components/ui/Card";',
        "",
        "export default function Home() {",
        "  return (",
        '    <Card title="Smoke test" footer="Footer content">',
        "      Smoke test body content",
        "    </Card>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Card"/.test(pageSource) && /title="Smoke test"/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Card and renders it with a title + footer",
  },
  "text-input": {
    criticalPaths: [
      "components/ui/TextInput.tsx",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "components/ui/FormField.tsx",
      "components/ui/form-field.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts is independently declared by text-input, form-field, and
    // validation-message (all three real registry items in this graph) —
    // the first multi-manifest graph where a target is genuinely
    // contributed more than once. See the shared-target assertions in
    // main() for what this proves.
    expectedSharedTargets: ["lib/cn.ts"],
    // First-ever multi-hop graph (text-input -> form-field ->
    // validation-message -> foundation) and first-ever nonempty real npm
    // `dependencies` install (@phosphor-icons/react) — closing stdin is
    // defense-in-depth against an unforeseen interactive prompt hanging
    // the smoke test on unverified territory, on top of `--yes`.
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { TextInput } from "@/components/ui/TextInput";',
        "",
        "export default function Home() {",
        "  return (",
        "    <TextInput",
        '      label="Smoke test input"',
        '      placeholder="Type something"',
        '      error="Smoke test error"',
        "    />",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/TextInput"/.test(pageSource) &&
      /label="Smoke test input"/.test(pageSource) &&
      /error="Smoke test error"/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports TextInput and renders it with a real label + error, exercising TextInput -> FormField -> ValidationMessage -> @phosphor-icons/react",
  },
  spinner: {
    criticalPaths: [
      "components/ui/Spinner.tsx",
      "components/ui/spinner.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Spinner } from "@/components/ui/Spinner";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12, alignItems: "center" }}>',
        '      <Spinner label="Smoke loading" />',
        "      <Spinner decorative />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Spinner"/.test(pageSource) && /Smoke loading/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Spinner and renders labeled + decorative instances",
  },
  divider: {
    criticalPaths: [
      "components/ui/Divider.tsx",
      "components/ui/divider.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Divider } from "@/components/ui/Divider";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        "      <p>Above</p>",
        "      <Divider />",
        "      <p>Below</p>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) => /from "@\/components\/ui\/Divider"/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Divider and renders a thematic separator",
  },
  link: {
    criticalPaths: [
      "components/ui/Link.tsx",
      "components/ui/link.module.css",
      "components/ui/internal/link-utils.ts",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Link } from "@/components/ui/Link";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 16, flexDirection: "column" }}>',
        '      <Link href="/components/button">Internal docs link</Link>',
        '      <Link href="https://example.com" target="_blank">External example</Link>',
        '      <Link href="mailto:hello@example.com">Mail link</Link>',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Link"/.test(pageSource) &&
      /Internal docs link/.test(pageSource) &&
      /example\.com/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Link and renders internal, external, and mailto destinations",
  },
  checkbox: {
    criticalPaths: [
      "components/ui/Checkbox.tsx",
      "components/ui/checkbox.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Checkbox } from "@/components/ui/Checkbox";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12, flexDirection: "column" }}>',
        '      <Checkbox label="Smoke accept terms" defaultChecked />',
        '      <Checkbox label="Smoke indeterminate" indeterminate />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Checkbox"/.test(pageSource) && /Smoke accept terms/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Checkbox and renders labeled instances",
  },
  switch: {
    criticalPaths: [
      "components/ui/Switch.tsx",
      "components/ui/switch.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Switch } from "@/components/ui/Switch";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12, flexDirection: "column" }}>',
        '      <Switch label="Smoke notifications" defaultChecked />',
        '      <Switch label="Smoke dark mode" />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Switch"/.test(pageSource) && /Smoke notifications/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Switch and renders labeled instances",
  },
  textarea: {
    criticalPaths: [
      "components/ui/Textarea.tsx",
      "components/ui/textarea.module.css",
      "components/ui/text-input.module.css",
      "public/right-bottom-icon.svg",
      "components/ui/FormField.tsx",
      "components/ui/form-field.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { Textarea } from "@/components/ui/Textarea";',
        "",
        "export default function Home() {",
        "  return (",
        "    <Textarea",
        '      label="Smoke description"',
        '      placeholder="Type something"',
        '      error="Smoke validation"',
        "      rows={3}",
        "    />",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Textarea"/.test(pageSource) && /Smoke description/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Textarea and renders labeled control with validation",
  },
  avatar: {
    criticalPaths: [
      "components/ui/Avatar.tsx",
      "components/ui/avatar.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { Avatar } from "@/components/ui/Avatar";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12 }}>',
        '      <Avatar initials="SK" label="Smoke avatar" />',
        '      <Avatar decorative />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Avatar"/.test(pageSource) && /Smoke avatar/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Avatar and renders labeled initials",
  },
  slider: {
    criticalPaths: [
      "components/ui/Slider.tsx",
      "components/ui/slider.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Slider } from "@/components/ui/Slider";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        '      <Slider label="Smoke volume" defaultValue={40} min={0} max={100} />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Slider"/.test(pageSource) && /Smoke volume/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Slider and renders labeled control",
  },
  // CE-3H — safe compound batch: one descriptor per genuinely new transport
  // pattern (not one per slug — matches CE-3D/E/F precedent).
  badge: {
    criticalPaths: [
      "components/ui/Badge.tsx",
      "components/ui/badge.module.css",
      "components/ui/internal/feedback-types.ts",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Badge } from "@/components/ui/Badge";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", gap: 12 }}>',
        '      <Badge variant="success">Smoke active</Badge>',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Badge"/.test(pageSource) && /Smoke active/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Badge and renders it, exercising the shared internal/feedback-types.ts type-only helper",
  },
  // First-ever zero-owned-CSS component: Alert.tsx transports no CSS of its
  // own, only the internal FeedbackSurface cluster (its own CSS + icons +
  // types) — proves cn.ts's transitive-only inclusion resolves correctly.
  alert: {
    criticalPaths: [
      "components/ui/Alert.tsx",
      "components/ui/internal/FeedbackSurface.tsx",
      "components/ui/internal/feedback-surface.module.css",
      "components/ui/internal/feedback-icons.tsx",
      "components/ui/internal/feedback-types.ts",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Alert } from "@/components/ui/Alert";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        '      <Alert type="info" title="Smoke alert" description="Smoke description" />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Alert"/.test(pageSource) && /Smoke alert/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Alert (no owned CSS) and renders it, proving the shared FeedbackSurface helper cluster transports correctly",
  },
  // First-ever multi-registryDependency composition without file
  // re-transport: EmptyState imports the real Button and Link components,
  // resolved as @skrewww/button + @skrewww/link registry deps, never
  // re-transported as files inside empty-state's own manifest.
  "empty-state": {
    criticalPaths: [
      "components/ui/EmptyState.tsx",
      "components/ui/empty-state.module.css",
      "components/ui/Button.tsx",
      "components/ui/Link.tsx",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { EmptyState } from "@/components/ui/EmptyState";',
        "",
        "export default function Home() {",
        "  return (",
        "    <EmptyState",
        '      title="Smoke empty state"',
        '      description="Smoke description"',
        '      primaryAction={{ label: "Smoke action", href: "/" }}',
        "    />",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/EmptyState"/.test(pageSource) && /Smoke empty state/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports EmptyState and renders it, exercising the two-registryDependency (@skrewww/button + @skrewww/link) composition graph",
  },
  // Compound context + dedicated keyboard-helper pattern (also covers
  // accordion/toggle-group's identical shape — inline context, no separate
  // context file, plus one keyboard helper + use-controllable).
  tabs: {
    criticalPaths: [
      "components/ui/Tabs.tsx",
      "components/ui/tabs.module.css",
      "components/ui/internal/tab-keyboard.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    renderHarness: () =>
      [
        'import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/Tabs";',
        "",
        "export default function Home() {",
        "  return (",
        '    <Tabs defaultValue="one">',
        '      <TabsList aria-label="Smoke tabs">',
        '        <TabsTrigger value="one">Smoke tab one</TabsTrigger>',
        '        <TabsTrigger value="two">Smoke tab two</TabsTrigger>',
        "      </TabsList>",
        '      <TabsPanel value="one">Smoke panel one</TabsPanel>',
        '      <TabsPanel value="two">Smoke panel two</TabsPanel>',
        "    </Tabs>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Tabs"/.test(pageSource) && /Smoke tab one/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports the Tabs compound family and renders a real tablist, exercising the inline-context + tab-keyboard.ts helper pattern",
  },
  // CE-3I — form/composite batch: search-field represents the
  // form-field-registryDep + already-mapped-TextInputControl transport
  // shape (number-input shares this exact shape plus one already-proven
  // pure-helper pattern from credit-card-field, so it is not independently
  // scaffolded here — see docs/distribution-expansion.md's CE-3I section).
  "search-field": {
    criticalPaths: [
      "components/ui/SearchField.tsx",
      "components/ui/search-field.module.css",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "components/ui/FormField.tsx",
      "components/ui/form-field.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { SearchField } from "@/components/ui/SearchField";',
        "",
        "export default function Home() {",
        "  return (",
        "    <SearchField",
        '      label="Smoke search"',
        '      placeholder="Search…"',
        "    />",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/SearchField"/.test(pageSource) && /Smoke search/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports SearchField and renders it, exercising the @skrewww/form-field registryDependency + already-mapped TextInputControl.tsx/text-input.module.css internal files (no Popover pulled in)",
  },
  // Represents the ValidationMessage-registryDep + own-format-helper shape
  // (credit-card-field-format.ts has zero imports of its own, so no further
  // transitive closure risk beyond what this proves).
  "credit-card-field": {
    criticalPaths: [
      "components/ui/CreditCardField.tsx",
      "components/ui/credit-card-field.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "lib/credit-card-field-format.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts is independently declared by both credit-card-field and its
    // @skrewww/validation-message registryDependency.
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { CreditCardField } from "@/components/ui/CreditCardField";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        '      <CreditCardField label="Smoke card details" />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/CreditCardField"/.test(pageSource) && /Smoke card details/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports CreditCardField and renders it, exercising the @skrewww/validation-message registryDependency + its own credit-card-field-format.ts helper",
  },
  // ATTENDED_ONLY per CE-3G: drag/drop + File API + real browser
  // interaction cannot be proven by page-source regex alone. Reuses the
  // exact selectors/behaviors from e2e/file-upload.spec.ts (the existing
  // authoritative File Upload browser suite) rather than inventing new
  // scenarios — native input[type=file], the "Selected files" list role,
  // "Remove <name>" buttons, the oversized-file rejection message, and the
  // DataTransfer/DragEvent drop sequence.
  "file-upload": {
    criticalPaths: [
      "components/ui/FileUpload.tsx",
      "components/ui/file-upload.module.css",
      "components/ui/internal/file-upload-file-list.ts",
      "components/ui/internal/file-upload-validation.ts",
      "components/ui/FormField.tsx",
      "components/ui/form-field.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts is independently declared by both file-upload and its
    // @skrewww/form-field registryDependency.
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    // Two separate FileUpload instances — mirroring e2e/file-upload.spec.ts's
    // own structure exactly (that suite never re-selects on the same input
    // right after a rejection; it uses distinct named inputs per scenario).
    // "smoke-reject" only ever proves the oversized-file rejection path;
    // "smoke-select" proves select/remove/drag-drop on a field that is
    // never driven into a rejected state. This is reuse of the existing
    // authoritative flows, not an invented combined scenario.
    renderHarness: () =>
      [
        'import { FileUpload } from "@/components/ui/FileUpload";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 24 }}>',
        "      <FileUpload",
        '        name="smoke-select"',
        '        label="Smoke file upload"',
        '        accept="image/png"',
        "        multiple",
        "      />",
        "      <FileUpload",
        '        name="smoke-reject"',
        '        label="Smoke file upload (size-limited)"',
        '        accept="image/png"',
        "        maxSize={5000}",
        "      />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/FileUpload"/.test(pageSource) &&
      /name="smoke-select"/.test(pageSource) &&
      /name="smoke-reject"/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports FileUpload and renders two instances (select/remove/drag-drop + size-limited reject), exercising the @skrewww/form-field registryDependency + its own file-list/validation helpers",
    browserAssert: async ({ page }) => {
      const selectInput = page.locator('input[type="file"][name="smoke-select"]');
      const rejectInput = page.locator('input[type="file"][name="smoke-reject"]');
      const WAIT_MS = 5000;

      // Keyboard-accessible file selection: native input is focusable and
      // the dropzone shows a visible focus-within ring — same assertion as
      // e2e/file-upload.spec.ts's "exposes keyboard focus" test.
      await selectInput.focus();
      const isFocused = await selectInput.evaluate((el) => el === document.activeElement);
      if (!isFocused) throw new Error("Installed File Upload: native file input did not receive keyboard focus.");
      await page
        .locator('[class*="dropzone"]:focus-within')
        .waitFor({ state: "visible", timeout: WAIT_MS })
        .catch(() => {
          throw new Error("Installed File Upload: dropzone has no visible focus-within state.");
        });

      // Real File API selection (setInputFiles is Playwright's real
      // browser-level file-selection primitive, not a JSDOM simulation).
      const selectedList = page.getByRole("list", { name: "Selected files" }).first();
      await selectInput.setInputFiles({ name: "smoke.png", mimeType: "image/png", buffer: Buffer.from("smoke") });
      await selectedList
        .getByText("smoke.png")
        .waitFor({ state: "visible", timeout: WAIT_MS })
        .catch(() => {
          throw new Error("Installed File Upload: selected file \"smoke.png\" did not appear in the Selected files list.");
        });

      // Existing state transition: remove control for a selected file.
      await page.getByRole("button", { name: "Remove smoke.png" }).click();
      await selectedList
        .getByText("smoke.png")
        .waitFor({ state: "detached", timeout: WAIT_MS })
        .catch(() => {
          throw new Error("Installed File Upload: \"smoke.png\" was not removed from the Selected files list.");
        });

      // Real browser drag/drop, dispatched via a live DataTransfer — same
      // sequence as e2e/file-upload.spec.ts's "supports drag and drop
      // replacement" test.
      await page.evaluate(() => {
        const uploadInput = document.querySelector('input[name="smoke-select"]') as HTMLInputElement | null;
        const zone = uploadInput?.parentElement;
        if (!uploadInput || !zone) throw new Error("Missing file upload dropzone in installed consumer page");
        const transfer = new DataTransfer();
        transfer.items.add(new File(["dropped"], "dropped.png", { type: "image/png" }));
        zone.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
        zone.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: transfer }));
        zone.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
      });
      await selectedList
        .getByText("dropped.png")
        .waitFor({ state: "visible", timeout: WAIT_MS })
        .catch(() => {
          throw new Error("Installed File Upload: drag-and-drop file \"dropped.png\" did not appear in the Selected files list.");
        });

      // Existing state transition: oversized-file rejection message, on
      // the dedicated size-limited field (never given an accepted file).
      await rejectInput.setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(6000) });
      await page
        .getByText(/exceeds the/i)
        .waitFor({ state: "visible", timeout: WAIT_MS })
        .catch(() => {
          throw new Error("Installed File Upload: oversized-file rejection message did not appear.");
        });
    },
  },
  // CE-3J — overlay/navigation batch (all T4: real installed-consumer
  // browser proof, not just manifest generation). Render harnesses use
  // plain native <button> trigger children (never the Skrewww Button
  // component) since none of these 6 components' own registryDependencies
  // include @skrewww/button — matching what a consumer who installs only
  // e.g. `shadcn add @skrewww/popover` actually gets. Behaviors reused
  // directly from the existing authoritative suites: e2e/overlays.spec.ts,
  // e2e/popover.spec.ts, e2e/drawer.spec.ts, e2e/menu.spec.ts,
  // e2e/split-button.spec.ts.
  popover: {
    criticalPaths: [
      "components/ui/Popover.tsx",
      "components/ui/popover.module.css",
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
      "components/ui/internal/assign-ref.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { Popover, PopoverBody, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/Popover";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 200 }}>',
        '      <Popover placement="bottom">',
        "        <PopoverTrigger>",
        '          <button type="button">View details</button>',
        "        </PopoverTrigger>",
        '        <PopoverContent aria-label="Smoke popover">',
        "          <PopoverTitle>Smoke popover</PopoverTitle>",
        "          <PopoverBody>Smoke popover body content</PopoverBody>",
        "        </PopoverContent>",
        "      </Popover>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Popover"/.test(pageSource) && /View details/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Popover and renders a real trigger/content pair, exercising the full overlay helper stack",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const trigger = page.getByRole("button", { name: "View details" });
      const content = page.getByRole("dialog", { name: "Smoke popover" });

      await trigger.click();
      await content.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Popover: content did not become visible after trigger click.");
      });
      const expanded = await trigger.getAttribute("aria-expanded");
      if (expanded !== "true") throw new Error(`Installed Popover: trigger aria-expanded was "${expanded}", expected "true".`);

      await page.keyboard.press("Escape");
      await content.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Popover: content did not close on Escape.");
      });
      const focusReturned = await trigger.evaluate((el) => el === document.activeElement);
      if (!focusReturned) throw new Error("Installed Popover: focus did not return to trigger after Escape.");

      await trigger.click();
      await content.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.locator("body").click({ position: { x: 5, y: 5 } });
      await content.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Popover: content did not close on outside click.");
      });
    },
  },
  tooltip: {
    criticalPaths: [
      "components/ui/Tooltip.tsx",
      "components/ui/tooltip.module.css",
      "components/ui/internal/tooltip-position.ts",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/useIsClient.ts",
      "components/ui/internal/useTooltipController.ts",
      "components/ui/internal/useOverlayEscape.ts",
      "components/ui/internal/overlay-stack.ts",
      "components/ui/internal/useLatestRef.ts",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { Tooltip } from "@/components/ui/Tooltip";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 100 }}>',
        '      <Tooltip content="Smoke tooltip content">',
        '        <button type="button" aria-label="Save">Save</button>',
        "      </Tooltip>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Tooltip"/.test(pageSource) && /Smoke tooltip content/.test(pageSource),
    harnessAssertionLabel: "consumer page imports Tooltip and renders a real trigger, exercising its own portal + position/controller helpers",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const trigger = page.getByRole("button", { name: "Save" });
      const tooltip = page.getByRole("tooltip");

      await trigger.focus();
      await tooltip.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Tooltip: tooltip did not become visible on trigger focus.");
      });

      await page.keyboard.press("Escape");
      await tooltip.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Tooltip: tooltip did not close on Escape.");
      });
    },
  },
  dialog: {
    criticalPaths: [
      "components/ui/Dialog.tsx",
      "components/ui/dialog.module.css",
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
      "components/ui/internal/overlay-types.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import {',
        "  Dialog,",
        "  DialogBody,",
        "  DialogClose,",
        "  DialogContent,",
        "  DialogHeader,",
        "  DialogTitle,",
        "  DialogTrigger,",
        '} from "@/components/ui/Dialog";',
        "",
        "export default function Home() {",
        "  return (",
        "    <Dialog>",
        "      <DialogTrigger>",
        '        <button type="button">Open dialog</button>',
        "      </DialogTrigger>",
        "      <DialogContent>",
        "        <DialogHeader>",
        "          <DialogTitle>Smoke dialog</DialogTitle>",
        "          <DialogClose />",
        "        </DialogHeader>",
        "        <DialogBody>Smoke dialog body</DialogBody>",
        "      </DialogContent>",
        "    </Dialog>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Dialog"/.test(pageSource) && /Smoke dialog/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports the Dialog compound family and renders a real modal, exercising focus trap/scroll-lock/background-inert",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const trigger = page.getByRole("button", { name: "Open dialog" });
      const dialog = page.getByRole("dialog", { name: "Smoke dialog" });

      await trigger.click();
      await dialog.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Dialog: dialog did not become visible after trigger click.");
      });

      // Focus trap: initial focus moved inside the dialog (not left on the trigger/body).
      const focusInsideDialog = await page.evaluate(() => {
        const dialogEl = document.querySelector('[role="dialog"]');
        return Boolean(dialogEl && dialogEl.contains(document.activeElement));
      });
      if (!focusInsideDialog) throw new Error("Installed Dialog: initial focus did not move inside the dialog.");

      // Background inert (when supported by the browser).
      const inertCount = await page.evaluate(() => {
        if (!("inert" in HTMLElement.prototype)) return -1;
        return Array.from(document.body.children).filter((child) => child instanceof HTMLElement && child.inert).length;
      });
      if (inertCount === 0) throw new Error("Installed Dialog: no background sibling was made inert while open.");

      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Dialog: dialog did not close on Escape.");
      });
      const focusReturned = await trigger.evaluate((el) => el === document.activeElement);
      if (!focusReturned) throw new Error("Installed Dialog: focus did not return to trigger after Escape.");

      await trigger.click();
      await dialog.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.getByRole("button", { name: "Close dialog" }).click();
      await dialog.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Dialog: dialog did not close on DialogClose button click.");
      });
    },
  },
  drawer: {
    criticalPaths: [
      "components/ui/Drawer.tsx",
      "components/ui/drawer.module.css",
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
      "components/ui/internal/overlay-types.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import {',
        "  Drawer,",
        "  DrawerBody,",
        "  DrawerClose,",
        "  DrawerContent,",
        "  DrawerHeader,",
        "  DrawerTitle,",
        "  DrawerTrigger,",
        '} from "@/components/ui/Drawer";',
        "",
        "export default function Home() {",
        "  return (",
        "    <Drawer>",
        "      <DrawerTrigger>",
        '        <button type="button">Open drawer</button>',
        "      </DrawerTrigger>",
        "      <DrawerContent>",
        "        <DrawerHeader>",
        "          <DrawerTitle>Smoke drawer</DrawerTitle>",
        "          <DrawerClose />",
        "        </DrawerHeader>",
        "        <DrawerBody>Smoke drawer body</DrawerBody>",
        "      </DrawerContent>",
        "    </Drawer>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Drawer"/.test(pageSource) && /Smoke drawer/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports the Drawer compound family and renders a real left-edge panel, exercising the identical modal helper stack to Dialog",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const trigger = page.getByRole("button", { name: "Open drawer" });
      const drawer = page.getByRole("dialog", { name: "Smoke drawer" });

      await trigger.click();
      await drawer.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Drawer: drawer did not become visible after trigger click.");
      });

      // Left-edge placement (only supported placement per current contract).
      const box = await drawer.boundingBox();
      if (!box || box.x > 8) throw new Error(`Installed Drawer: expected left-edge placement (x<=8), got x=${box?.x}.`);

      // Focus trap: close button receives initial focus (per e2e/drawer.spec.ts).
      const closeFocused = await page.getByRole("button", { name: "Close drawer" }).evaluate((el) => el === document.activeElement);
      if (!closeFocused) throw new Error("Installed Drawer: close button did not receive initial focus.");

      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Drawer: drawer did not close on Escape.");
      });
      const focusReturned = await trigger.evaluate((el) => el === document.activeElement);
      if (!focusReturned) throw new Error("Installed Drawer: focus did not return to trigger after Escape.");
    },
  },
  menu: {
    criticalPaths: [
      "components/ui/Menu.tsx",
      "components/ui/menu.module.css",
      "components/ui/internal/menu-typeahead.ts",
      "lib/cn.ts",
      // Menu's registryDependency (@skrewww/popover) resolves the full
      // overlay stack via the shadcn CLI's own recursive install — not
      // re-listed here as a "critical path" since it is Popover's own
      // manifest that owns these files, not Menu's.
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts is independently declared by both menu and its
    // @skrewww/popover registryDependency.
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useState } from "react";',
        'import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/Menu";',
        "",
        "export default function Home() {",
        '  const [lastAction, setLastAction] = useState("No action yet");',
        "  return (",
        '    <div style={{ padding: 100 }}>',
        "      <Menu>",
        "        <MenuTrigger>",
        '          <button type="button">Project actions</button>',
        "        </MenuTrigger>",
        '        <MenuContent aria-label="Project actions">',
        '          <MenuItem onSelect={() => setLastAction("Edit profile")}>Edit profile</MenuItem>',
        '          <MenuItem onSelect={() => setLastAction("Duplicate")}>Duplicate</MenuItem>',
        '          <MenuItem disabled onSelect={() => setLastAction("Should not fire")}>',
        "            Export (disabled)",
        "          </MenuItem>",
        "        </MenuContent>",
        "      </Menu>",
        '      <p data-testid="last-action">Last action: {lastAction}</p>',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Menu"/.test(pageSource) && /Project actions/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports the Menu compound family and renders a real command list, exercising the @skrewww/popover registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const trigger = page.getByRole("button", { name: "Project actions" });
      const menu = page.getByRole("menu", { name: "Project actions" });

      await trigger.click();
      await menu.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Menu: menu did not become visible after trigger click.");
      });
      const expanded = await trigger.getAttribute("aria-expanded");
      if (expanded !== "true") throw new Error(`Installed Menu: trigger aria-expanded was "${expanded}", expected "true".`);

      // Opening via click already focuses the first item (matches
      // e2e/menu.spec.ts's "navigates with arrow keys" test, which asserts
      // this immediately after a trigger click with no ArrowDown press).
      const firstItem = page.getByRole("menuitem", { name: "Edit profile" });
      await firstItem.waitFor({ state: "visible", timeout: WAIT_MS });
      const firstFocused = await firstItem.evaluate((el) => el === document.activeElement);
      if (!firstFocused) throw new Error("Installed Menu: first menu item was not focused after opening via click.");

      await page.keyboard.press("Enter");
      await menu.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Menu: menu did not close after Enter selection.");
      });
      await page.getByTestId("last-action").getByText("Edit profile").waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Menu: onSelect callback did not fire for the selected item.");
      });

      await trigger.click();
      await menu.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Menu: menu did not close on Escape.");
      });
      const focusReturned = await trigger.evaluate((el) => el === document.activeElement);
      if (!focusReturned) throw new Error("Installed Menu: focus did not return to trigger after Escape.");

      await trigger.click();
      await menu.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.getByRole("menuitem", { name: "Export (disabled)" }).click({ force: true });
      const stillOpen = await menu.isVisible();
      if (!stillOpen) throw new Error("Installed Menu: disabled item execution closed the menu (it should not execute).");
    },
  },
  "split-button": {
    criticalPaths: [
      "components/ui/SplitButton.tsx",
      "components/ui/button-group-context.ts",
      "components/ui/button-group.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    // Real intended usage composes Menu (documented peer, not imported) —
    // installed together here, matching e2e/split-button.spec.ts's own
    // "primary Button + Menu trigger" structure.
    extraAdds: ["menu"],
    // lib/cn.ts is independently declared by split-button, menu, and menu's
    // own @skrewww/popover registryDependency.
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useState } from "react";',
        'import { SplitButton } from "@/components/ui/SplitButton";',
        'import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/Menu";',
        "",
        "export default function Home() {",
        '  const [lastAction, setLastAction] = useState("No action yet");',
        "  return (",
        '    <div style={{ padding: 100 }}>',
        '      <SplitButton aria-label="Save options">',
        '        <button type="button" onClick={() => setLastAction("Saved")}>',
        "          Save",
        "        </button>",
        "        <Menu>",
        "          <MenuTrigger>",
        '            <button type="button" aria-label="Save options menu">',
        "              ▾",
        "            </button>",
        "          </MenuTrigger>",
        '          <MenuContent aria-label="Save options menu">',
        '            <MenuItem onSelect={() => setLastAction("Saved as draft")}>Save as draft</MenuItem>',
        "          </MenuContent>",
        "        </Menu>",
        "      </SplitButton>",
        '      <p data-testid="last-action">Last action: {lastAction}</p>',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/SplitButton"/.test(pageSource) && /Save options/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports SplitButton composed with a real installed Menu, exercising adjacency chrome + the documented (not imported) peer composition",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const group = page.getByRole("group", { name: "Save options" });
      const primary = group.getByRole("button", { name: "Save", exact: true });
      const menuTrigger = group.getByRole("button", { name: "Save options menu" });
      const menu = page.getByRole("menu", { name: "Save options menu" });

      await primary.click();
      await page.getByTestId("last-action").filter({ hasText: "Last action: Saved" }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Split Button: primary click did not fire the primary action.");
      });
      const menuOpenedByPrimary = await menu.isVisible();
      if (menuOpenedByPrimary) throw new Error("Installed Split Button: primary click incorrectly opened the menu.");

      await menuTrigger.click();
      await menu.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Split Button: menu trigger click did not open the menu.");
      });
      const expanded = await menuTrigger.getAttribute("aria-expanded");
      if (expanded !== "true") throw new Error(`Installed Split Button: menu trigger aria-expanded was "${expanded}", expected "true".`);

      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Split Button: menu did not close on Escape.");
      });
    },
  },
  // CE-3K — search/date interaction batch (all T4). Behaviors reused
  // directly from the existing authoritative suites: e2e/select.spec.ts,
  // e2e/combobox.spec.ts, e2e/calendar-day.spec.ts, e2e/calendar-grid.spec.ts,
  // e2e/date-picker.spec.ts, e2e/phone-number-field.spec.ts. Calendar/date
  // fixtures are pinned via defaultValue/defaultVisibleMonth (not wall-clock
  // "today") so assertions never drift with real-date rollover.
  "calendar-day": {
    criticalPaths: [
      "components/ui/CalendarDay.tsx",
      "components/ui/calendar-day.module.css",
      "components/ui/internal/calendar-date.ts",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useState } from "react";',
        'import { CalendarDay } from "@/components/ui/CalendarDay";',
        "",
        "export default function Home() {",
        "  const [selected, setSelected] = useState(false);",
        "  return (",
        '    <div style={{ padding: 100 }}>',
        "      <CalendarDay",
        '        date="2026-07-14"',
        "        selected={selected}",
        "        onDateSelect={() => setSelected(true)}",
        "      />",
        '      <p data-testid="day-selected">{selected ? "Selected" : "Not selected"}</p>',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/CalendarDay"/.test(pageSource) && /2026-07-14/.test(pageSource),
    harnessAssertionLabel: "consumer page imports CalendarDay standalone and renders a real day button",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const day = page.getByRole("button", { name: "14 July 2026" });
      await day.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Calendar Day: day button with the computed accessible date label did not render.");
      });
      await day.click();
      await page.getByTestId("day-selected").getByText("Selected", { exact: true }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Calendar Day: onDateSelect did not fire on click.");
      });
    },
  },
  "calendar-grid": {
    criticalPaths: [
      "components/ui/CalendarGrid.tsx",
      "components/ui/calendar-grid.module.css",
      "components/ui/CalendarMonthCell.tsx",
      "components/ui/CalendarYearCell.tsx",
      "components/ui/calendar-period-cell.module.css",
      "components/ui/internal/assign-ref.ts",
      "components/ui/internal/calendar-date.ts",
      "components/ui/internal/calendar-math.ts",
      "components/ui/internal/useCalendarKeyboard.ts",
      "components/ui/internal/useCalendarCellGridKeyboard.ts",
      "components/ui/CalendarDay.tsx",
      "components/ui/calendar-day.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts and components/ui/internal/calendar-date.ts are
    // independently declared by both calendar-grid and its
    // @skrewww/calendar-day registryDependency.
    expectedSharedTargets: ["lib/cn.ts", "components/ui/internal/calendar-date.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useState } from "react";',
        'import { CalendarGrid } from "@/components/ui/CalendarGrid";',
        "",
        "export default function Home() {",
        '  const [value, setValue] = useState("2026-07-14");',
        "  return (",
        '    <div style={{ padding: 40 }}>',
        "      <CalendarGrid",
        '        aria-label="Choose date"',
        '        value={value}',
        "        onValueChange={setValue}",
        "        defaultVisibleMonth={{ year: 2026, month: 7 }}",
        "      />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/CalendarGrid"/.test(pageSource) && /Choose date/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports CalendarGrid and renders a real month grid, exercising the @skrewww/calendar-day registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const grid = page.getByRole("grid", { name: "Choose date" });
      await grid.waitFor({ state: "visible", timeout: WAIT_MS });

      // Arrow-key roving focus.
      const selectedDay = page.getByRole("button", { name: "14 July 2026" });
      await selectedDay.focus();
      await page.keyboard.press("ArrowRight");
      await page.getByRole("button", { name: "15 July 2026" }).waitFor({ state: "visible", timeout: WAIT_MS });
      const movedFocused = await page.getByRole("button", { name: "15 July 2026" }).evaluate((el) => el === document.activeElement);
      if (!movedFocused) throw new Error("Installed Calendar Grid: ArrowRight did not move focus to the next day.");

      // Month navigation via header controls.
      await page.getByRole("button", { name: "Next month" }).click();
      await page.getByRole("heading", { name: /August 2026/i }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Calendar Grid: Next month header control did not advance the visible month.");
      });
      await page.getByRole("button", { name: "Previous month" }).click();
      await page.getByRole("heading", { name: /July 2026/i }).waitFor({ state: "visible", timeout: WAIT_MS });

      // Selection with Enter.
      await selectedDay.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await page.getByRole("gridcell", { selected: true }).getByText("15").waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Calendar Grid: Enter did not select the focused day.");
      });

      // Month/year drill-up and back down (real public behavior).
      await page.getByRole("button", { name: "July 2026", exact: true }).click();
      const monthGrid = page.getByRole("grid", { name: "Choose month, 2026" });
      await monthGrid.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Calendar Grid: clicking the month/year header did not drill up to the month grid.");
      });
      await page.getByRole("button", { name: "August", exact: true }).click();
      await page.getByRole("heading", { name: /August 2026/i }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Calendar Grid: selecting a month in the drill-up grid did not navigate to it.");
      });
    },
  },
  select: {
    criticalPaths: [
      "components/ui/Select.tsx",
      "components/ui/select.module.css",
      "components/ui/text-input.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts and lib/use-controllable.ts are each independently declared
    // by select and its @skrewww/popover registryDependency.
    expectedSharedTargets: ["lib/cn.ts", "lib/use-controllable.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useState } from "react";',
        'import { Select } from "@/components/ui/Select";',
        "",
        "export default function Home() {",
        '  const [value, setValue] = useState("viewer");',
        "  return (",
        '    <div style={{ padding: 100 }}>',
        "      <Select",
        '        label="Role"',
        "        value={value}",
        '        onChange={(event) => setValue(event.target.value)}',
        "        options={[",
        '          { value: "viewer", label: "Viewer" },',
        '          { value: "editor", label: "Editor" },',
        '          { value: "admin", label: "Admin" },',
        "        ]}",
        "      />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Select"/.test(pageSource) && /"Viewer"/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Select and renders a real listbox trigger, exercising the @skrewww/popover registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const trigger = page.getByRole("combobox", { name: "Role", exact: true });
      const listbox = page.getByRole("listbox", { name: "Role" });

      await trigger.click();
      await listbox.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Select: listbox did not open on trigger click.");
      });
      const firstFocused = await page.getByRole("option", { name: "Viewer" }).evaluate((el) => el === document.activeElement);
      if (!firstFocused) throw new Error("Installed Select: current value's option was not focused after opening.");

      await page.keyboard.press("End");
      const lastFocused = await page.getByRole("option", { name: "Admin" }).evaluate((el) => el === document.activeElement);
      if (!lastFocused) throw new Error("Installed Select: End did not move focus to the last option.");
      await page.keyboard.press("Home");
      const firstAgainFocused = await page.getByRole("option", { name: "Viewer" }).evaluate((el) => el === document.activeElement);
      if (!firstAgainFocused) throw new Error("Installed Select: Home did not move focus back to the first option.");

      await page.keyboard.press("Escape");
      await listbox.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Select: listbox did not close on Escape.");
      });
      const triggerFocused = await trigger.evaluate((el) => el === document.activeElement);
      if (!triggerFocused) throw new Error("Installed Select: focus did not return to the trigger after Escape.");

      await trigger.click();
      await listbox.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await listbox.waitFor({ state: "detached", timeout: WAIT_MS });
      await trigger.getByText("Editor", { exact: true }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Select: Enter did not commit the newly focused option as the value.");
      });
    },
  },
  combobox: {
    criticalPaths: [
      "components/ui/Combobox.tsx",
      "components/ui/combobox.module.css",
      "components/ui/internal/combobox-filter.ts",
      "components/ui/internal/combobox-list-status.ts",
      "components/ui/internal/combobox-keyboard.ts",
      "components/ui/internal/combobox-scroll.ts",
      "components/ui/text-input.module.css",
      "components/ui/FormField.tsx",
      "components/ui/form-field.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts and lib/use-controllable.ts are each independently declared
    // by combobox and its @skrewww/popover registryDependency.
    expectedSharedTargets: ["lib/cn.ts", "lib/use-controllable.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { Combobox } from "@/components/ui/Combobox";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 100 }}>',
        "      <Combobox",
        '        label="Country"',
        "        options={[",
        '          { value: "ca", label: "Canada" },',
        '          { value: "us", label: "United States" },',
        '          { value: "gb", label: "United Kingdom" },',
        "        ]}",
        "      />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Combobox"/.test(pageSource) && /"Canada"/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports Combobox and renders a real filterable listbox, exercising the @skrewww/form-field + @skrewww/popover registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const input = page.getByRole("combobox", { name: "Country" });
      const listbox = page.getByRole("listbox", { name: "Country" });

      // Combobox opens on focus (see its own onFocus handler), not a
      // dedicated click handler — .focus() exercises that exact mechanism
      // directly rather than relying on click-triggered focus transfer.
      await input.focus();
      await listbox.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Combobox: listbox did not open on input focus.");
      });

      await input.fill("Can");
      await page.getByRole("option", { name: "Canada" }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Combobox: typing did not filter to the matching option.");
      });
      const usaCount = await page.getByRole("option", { name: "United States" }).count();
      if (usaCount !== 0) throw new Error("Installed Combobox: filtering left a non-matching option visible.");

      await page.keyboard.press("Enter");
      await listbox.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Combobox: Enter did not commit the filtered option and close the listbox.");
      });
      const inputFocused = await input.evaluate((el) => el === document.activeElement);
      if (!inputFocused) throw new Error("Installed Combobox: focus did not remain in the input after Enter selection.");

      // Escape closes without clearing the committed value. The input is
      // already focused from the Enter-selection above, so blur then
      // refocus to force a real focus transition (re-opens the listbox).
      await input.blur();
      await input.focus();
      await listbox.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.keyboard.press("Escape");
      await listbox.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Combobox: Escape did not close the listbox.");
      });
      await input.evaluate((el) => (el as HTMLInputElement).value).then((val) => {
        if (!val.includes("Canada")) throw new Error(`Installed Combobox: Escape cleared the committed value (got "${val}").`);
      });
    },
  },
  "date-picker": {
    criticalPaths: [
      "components/ui/DatePicker.tsx",
      "components/ui/date-picker.module.css",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "components/ui/internal/calendar-date.ts",
      "components/ui/CalendarGrid.tsx",
      "components/ui/calendar-grid.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts, lib/use-controllable.ts, and internal/calendar-date.ts are
    // each independently declared by date-picker and its @skrewww/calendar-grid
    // registryDependency (which itself pulls @skrewww/calendar-day).
    // internal/assign-ref.ts is shared between @skrewww/calendar-grid and
    // @skrewww/popover (both declare it directly).
    expectedSharedTargets: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/calendar-date.ts",
      "components/ui/internal/assign-ref.ts",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useState } from "react";',
        'import { DatePicker } from "@/components/ui/DatePicker";',
        "",
        "export default function Home() {",
        '  const [value, setValue] = useState<string | undefined>("2026-07-14");',
        "  return (",
        '    <div style={{ padding: 100 }}>',
        "      <DatePicker",
        '        label="Release date"',
        "        value={value}",
        "        onValueChange={setValue}",
        "      />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/DatePicker"/.test(pageSource) && /Release date/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports DatePicker and renders a real field+popover+calendar composition, exercising @skrewww/calendar-grid + @skrewww/popover registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const openButton = page.getByRole("button", { name: "Open calendar" });
      const grid = page.getByRole("grid", { name: "Choose date" });

      await openButton.click();
      await grid.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Date Picker: calendar grid did not open on trigger click.");
      });

      await page.getByRole("button", { name: "15 July 2026" }).click();
      await grid.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Date Picker: calendar did not close after selecting a day.");
      });
      const trigger = page.getByRole("textbox", { name: "Release date" });
      const triggerValue = await trigger.inputValue();
      if (!/15/.test(triggerValue) || !/2026/.test(triggerValue)) {
        throw new Error(`Installed Date Picker: text field did not update to reflect the selected date (got "${triggerValue}").`);
      }

      await openButton.click();
      await grid.waitFor({ state: "visible", timeout: WAIT_MS });
      await page.keyboard.press("Escape");
      await grid.waitFor({ state: "detached", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Date Picker: Escape did not close the calendar.");
      });
      const openButtonFocused = await openButton.evaluate((el) => el === document.activeElement);
      if (!openButtonFocused) throw new Error("Installed Date Picker: focus did not return to the trigger after Escape.");

      await openButton.click();
      await page.getByRole("button", { name: "Next month" }).click();
      await grid.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Date Picker: month navigation closed the popover unexpectedly.");
      });
    },
  },
  "phone-number-field": {
    criticalPaths: [
      "components/ui/PhoneNumberField.tsx",
      "components/ui/phone-number-field.module.css",
      "components/ui/TextInputControl.tsx",
      "components/ui/text-input.module.css",
      "lib/phone-number-field-countries.ts",
      "components/ui/Select.tsx",
      "components/ui/select.module.css",
      "components/ui/ValidationMessage.tsx",
      "components/ui/validation-message.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts, lib/use-controllable.ts, and text-input.module.css are
    // each independently declared by phone-number-field and its
    // @skrewww/select registryDependency (which itself pulls
    // @skrewww/popover) — Select reuses text-input.module.css directly for
    // its own trigger chrome. TextInputControl.tsx itself is NOT shared —
    // Select never imports the TextInputControl component, only its CSS,
    // so phone-number-field is the only source for that one file.
    expectedSharedTargets: ["lib/cn.ts", "lib/use-controllable.ts", "components/ui/text-input.module.css"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { PhoneNumberField } from "@/components/ui/PhoneNumberField";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 100 }}>',
        '      <PhoneNumberField label="Mobile number" />',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/PhoneNumberField"/.test(pageSource) && /Mobile number/.test(pageSource),
    harnessAssertionLabel:
      "consumer page imports PhoneNumberField and renders a real country selector + number input, exercising the @skrewww/select registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const group = page.getByRole("group", { name: "Mobile number" });
      const country = group.getByRole("combobox", { name: "Country" });
      const number = group.getByRole("textbox", { name: "Phone number" });

      await number.waitFor({ state: "visible", timeout: WAIT_MS });
      const type = await number.getAttribute("type");
      if (type !== "tel") throw new Error(`Installed Phone Number Field: number input type was "${type}", expected "tel".`);

      await number.click();
      await number.pressSequentially("555 0100");
      await number.evaluate((el) => (el as HTMLInputElement).value).then((val) => {
        if (!val.includes("555")) throw new Error(`Installed Phone Number Field: typed digits did not appear in the number input (got "${val}").`);
      });

      await country.click();
      const ukOption = page.getByRole("option", { name: "United Kingdom (+44)" });
      await ukOption.waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Phone Number Field: country listbox did not open with the default illustrative country list.");
      });
      await ukOption.click();
      await country.getByText("United Kingdom (+44)", { exact: false }).waitFor({ state: "visible", timeout: WAIT_MS }).catch(() => {
        throw new Error("Installed Phone Number Field: selecting a country option did not update the country selector display.");
      });
    },
  },
  // CE-3L — data/tree batch. Behaviors reused directly from the existing
  // authoritative suites: e2e/tree-view.spec.ts, e2e/data-table.spec.ts.
  "tree-view": {
    criticalPaths: [
      "components/ui/TreeView.tsx",
      "components/ui/tree-view.module.css",
      "components/ui/internal/TreeItem.tsx",
      "components/ui/internal/tree-item.module.css",
      "components/ui/internal/tree-flatten.ts",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { TreeView } from "@/components/ui/TreeView";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        "      <TreeView",
        '        aria-label="Project files"',
        '        defaultExpanded={["src"]}',
        '        defaultSelected="index"',
        "        data={[",
        "          {",
        '            id: "src",',
        '            label: "src",',
        "            children: [",
        "              {",
        '                id: "components",',
        '                label: "components",',
        "                children: [",
        '                  { id: "button", label: "Button.tsx" },',
        '                  { id: "card", label: "Card.tsx" },',
        "                ],",
        "              },",
        '              { id: "index", label: "index.tsx" },',
        "            ],",
        "          },",
        '          { id: "readme", label: "README.md" },',
        "        ]}",
        "      />",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/TreeView"/.test(pageSource) && /Project files/.test(pageSource),
    harnessAssertionLabel: "consumer page imports TreeView and renders a real hierarchical tree with its own TreeItem/tree-flatten helpers",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const tree = page.getByRole("tree", { name: "Project files" });
      const src = tree.getByRole("treeitem", { name: "src" });
      const components = tree.getByRole("treeitem", { name: "components" });
      const buttonFile = tree.getByRole("treeitem", { name: "Button.tsx" });
      const indexFile = tree.getByRole("treeitem", { name: "index.tsx" });
      const readme = tree.getByRole("treeitem", { name: "README.md" });

      await src.waitFor({ state: "visible", timeout: WAIT_MS });
      const srcExpanded = await src.getAttribute("aria-expanded");
      if (srcExpanded !== "true") throw new Error(`Installed Tree View: "src" aria-expanded was "${srcExpanded}", expected "true" (default expanded).`);
      if ((await buttonFile.count()) !== 0) throw new Error("Installed Tree View: \"components\" should be collapsed by default, but its child \"Button.tsx\" is already visible.");
      const indexSelected = await indexFile.getAttribute("aria-selected");
      if (indexSelected !== "true") throw new Error(`Installed Tree View: "index.tsx" aria-selected was "${indexSelected}", expected "true" (default selected).`);
      const srcTabindex = await src.getAttribute("tabindex");
      const readmeTabindex = await readme.getAttribute("tabindex");
      if (srcTabindex !== "0" || readmeTabindex !== "-1") {
        throw new Error(`Installed Tree View: roving tabindex incorrect (src="${srcTabindex}", readme="${readmeTabindex}"), expected src="0", readme="-1".`);
      }

      await src.focus();
      await page.keyboard.press("ArrowDown");
      const componentsFocusedAfterDown = await components.evaluate((el) => el === document.activeElement);
      if (!componentsFocusedAfterDown) throw new Error("Installed Tree View: ArrowDown from \"src\" did not move focus to \"components\".");

      await page.keyboard.press("ArrowRight");
      const componentsExpanded = await components.getAttribute("aria-expanded");
      if (componentsExpanded !== "true") throw new Error(`Installed Tree View: ArrowRight did not expand "components" (aria-expanded="${componentsExpanded}").`);
      await buttonFile.waitFor({ state: "visible", timeout: WAIT_MS });
      const buttonFocusedAfterRight = await buttonFile.evaluate((el) => el === document.activeElement);
      if (!buttonFocusedAfterRight) throw new Error("Installed Tree View: ArrowRight did not move focus onto the first child \"Button.tsx\".");

      await page.keyboard.press("ArrowLeft");
      const componentsFocusedAfterLeft1 = await components.evaluate((el) => el === document.activeElement);
      if (!componentsFocusedAfterLeft1) throw new Error("Installed Tree View: ArrowLeft on a leaf did not move focus to its parent \"components\".");

      await page.keyboard.press("ArrowLeft");
      const componentsCollapsed = await components.getAttribute("aria-expanded");
      if (componentsCollapsed !== "false") throw new Error(`Installed Tree View: second ArrowLeft did not collapse "components" (aria-expanded="${componentsCollapsed}").`);
      if ((await buttonFile.count()) !== 0) throw new Error("Installed Tree View: \"Button.tsx\" is still visible after \"components\" collapsed.");

      await readme.focus();
      await page.keyboard.press("Enter");
      const readmeSelected = await readme.getAttribute("aria-selected");
      if (readmeSelected !== "true") throw new Error(`Installed Tree View: Enter did not select "README.md" (aria-selected="${readmeSelected}").`);
      const indexDeselected = await indexFile.getAttribute("aria-selected");
      if (indexDeselected !== "false") throw new Error(`Installed Tree View: selecting "README.md" did not deselect "index.tsx" (aria-selected="${indexDeselected}").`);
    },
  },
  "data-table": {
    criticalPaths: [
      "components/ui/DataTableSortHeader.tsx",
      "components/ui/data-table-sort-header.module.css",
      "lib/use-data-table-sort.ts",
      "components/ui/Table.tsx",
      "components/ui/table.module.css",
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "styles/skrewww-foundation.css",
    ],
    // lib/cn.ts is independently declared by both data-table and its
    // @skrewww/table registryDependency. lib/use-controllable.ts is NOT
    // shared — Table.tsx is purely presentational (no controllable state);
    // only data-table's own bundled use-data-table-sort.ts needs it.
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { useDataTableSort } from "@/lib/use-data-table-sort";',
        'import { DataTableSortHeader } from "@/components/ui/DataTableSortHeader";',
        'import {',
        "  Table,",
        "  TableHeader,",
        "  TableBody,",
        "  TableRow,",
        "  TableHead,",
        "  TableCell,",
        "  TableScrollArea,",
        '} from "@/components/ui/Table";',
        "",
        'const rows = [',
        '  { id: "1", name: "Atlas", value: 3 },',
        '  { id: "2", name: "Voyager", value: 1 },',
        '  { id: "3", name: "Anchor", value: 2 },',
        "];",
        "",
        "export default function Home() {",
        '  const { getSortDirection, toggleSort } = useDataTableSort<"name">();',
        '  const sortDirection = getSortDirection("name");',
        "  const sortedRows = [...rows];",
        '  if (sortDirection !== "none") {',
        "    sortedRows.sort((a, b) =>",
        '      sortDirection === "ascending" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),',
        "    );",
        "  }",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        '      <TableScrollArea>',
        '        <Table data-testid="data-table-preview">',
        "          <TableHeader>",
        "            <TableRow>",
        "              <DataTableSortHeader",
        "                sortDirection={sortDirection}",
        '                onSort={() => toggleSort("name")}',
        "              >",
        "                Name",
        "              </DataTableSortHeader>",
        "              <TableHead>Value</TableHead>",
        "            </TableRow>",
        "          </TableHeader>",
        "          <TableBody>",
        "            {sortedRows.map((row) => (",
        "              <TableRow key={row.id}>",
        "                <TableCell>{row.name}</TableCell>",
        "                <TableCell>{row.value}</TableCell>",
        "              </TableRow>",
        "            ))}",
        "          </TableBody>",
        "        </Table>",
        "      </TableScrollArea>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/DataTableSortHeader"/.test(pageSource) && /useDataTableSort/.test(pageSource),
    harnessAssertionLabel:
      "consumer page composes DataTableSortHeader + useDataTableSort over a real installed Table, exercising the @skrewww/table registryDependency resolution",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 5000;
      const header = page.getByRole("columnheader", { name: "Name" });
      const sortButton = page.getByRole("button", { name: "Name" });
      const firstDataCell = () =>
        page.locator('[data-testid="data-table-preview"] tbody tr').first().locator("td").first();

      await header.waitFor({ state: "visible", timeout: WAIT_MS });
      const initialSort = await header.getAttribute("aria-sort");
      if (initialSort !== "none") throw new Error(`Installed Data Table: initial aria-sort was "${initialSort}", expected "none".`);

      await sortButton.click();
      let sort = await header.getAttribute("aria-sort");
      if (sort !== "ascending") throw new Error(`Installed Data Table: aria-sort after first click was "${sort}", expected "ascending".`);
      let firstCellText = await firstDataCell().textContent();
      if (firstCellText !== "Anchor") throw new Error(`Installed Data Table: ascending sort did not reorder rows (first cell "${firstCellText}", expected "Anchor").`);

      await sortButton.click();
      sort = await header.getAttribute("aria-sort");
      if (sort !== "descending") throw new Error(`Installed Data Table: aria-sort after second click was "${sort}", expected "descending".`);
      firstCellText = await firstDataCell().textContent();
      if (firstCellText !== "Voyager") throw new Error(`Installed Data Table: descending sort did not reorder rows (first cell "${firstCellText}", expected "Voyager").`);

      await sortButton.click();
      sort = await header.getAttribute("aria-sort");
      if (sort !== "none") throw new Error(`Installed Data Table: aria-sort after third click was "${sort}", expected "none".`);
      firstCellText = await firstDataCell().textContent();
      if (firstCellText !== "Atlas") throw new Error(`Installed Data Table: third click did not cycle back to the original row order (first cell "${firstCellText}", expected "Atlas").`);

      // Keyboard operability: Enter then Space.
      await sortButton.focus();
      await page.keyboard.press("Enter");
      sort = await header.getAttribute("aria-sort");
      if (sort !== "ascending") throw new Error(`Installed Data Table: Enter did not sort ascending (aria-sort="${sort}").`);
      await page.keyboard.press(" ");
      sort = await header.getAttribute("aria-sort");
      if (sort !== "descending") throw new Error(`Installed Data Table: Space did not advance the sort cycle to descending (aria-sort="${sort}").`);
    },
  },
  // CE-3M — charts batch. Behaviors reused from e2e/bar-chart.spec.ts and
  // e2e/line-chart.spec.ts. Fixture owns container dimensions; production
  // component sizing is unchanged. First real `recharts` npm install path.
  "bar-chart": {
    criticalPaths: [
      "components/ui/BarChart.tsx",
      "components/ui/bar-chart.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { BarChart } from "@/components/ui/BarChart";',
        "",
        "const data = [",
        '  { label: "Jan", value: 58 },',
        '  { label: "Feb", value: 72 },',
        '  { label: "Mar", value: 91 },',
        '  { label: "Apr", value: 84 },',
        '  { label: "May", value: 110 },',
        '  { label: "Jun", value: 140 },',
        "];",
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        '      <div id="chart-fixture" style={{ width: 600 }}>',
        '        <BarChart data={data} label="Monthly signups" height={320} />',
        "      </div>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/BarChart"/.test(pageSource) && /Monthly signups/.test(pageSource),
    harnessAssertionLabel: "consumer page imports BarChart and renders single-series monthly signup data",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 8000;
      const chart = page.getByRole("img", { name: "Monthly signups" });
      await chart.waitFor({ state: "visible", timeout: WAIT_MS });

      const svg = chart.locator("svg").first();
      await svg.waitFor({ state: "visible", timeout: WAIT_MS });
      const bars = chart.locator(".recharts-bar-rectangle path");
      await bars.first().waitFor({ state: "attached", timeout: WAIT_MS });
      const barCount = await bars.count();
      if (barCount !== 6) {
        throw new Error(`Installed Bar Chart: expected 6 bar paths, found ${barCount}.`);
      }

      const heights = await bars.evaluateAll((paths) =>
        paths.map((p) => {
          const d = p.getAttribute("d") ?? "";
          const match = d.match(/v (-?[\d.]+)/);
          return match ? Math.abs(Number(match[1])) : 0;
        }),
      );
      if (heights.some((h) => !(h > 0))) {
        throw new Error(`Installed Bar Chart: expected positive bar geometry, got [${heights.join(", ")}].`);
      }
      const maxIdx = heights.indexOf(Math.max(...heights));
      const minIdx = heights.indexOf(Math.min(...heights));
      if (maxIdx !== 5 || minIdx !== 0) {
        throw new Error(
          `Installed Bar Chart: proportional heights wrong (maxIdx=${maxIdx}, minIdx=${minIdx}, heights=[${heights.join(", ")}]).`,
        );
      }

      const table = page.locator("table.sr-only");
      if ((await table.count()) !== 1) throw new Error("Installed Bar Chart: expected one visually-hidden data table.");
      const jan = await table.getByRole("row", { name: /Jan/ }).textContent();
      const jun = await table.getByRole("row", { name: /Jun/ }).textContent();
      if (!jan?.includes("58") || !jun?.includes("140")) {
        throw new Error(`Installed Bar Chart: hidden table data mismatch (jan="${jan}", jun="${jun}").`);
      }

      // ResponsiveContainer contract: fluid width fills the fixture parent.
      const beforeWidth = await svg.evaluate((el) => el.getBoundingClientRect().width);
      await page.locator("#chart-fixture").evaluate((el) => {
        (el as HTMLElement).style.width = "360px";
        window.dispatchEvent(new Event("resize"));
      });
      await page.waitForFunction(
        (previous) => {
          const node = document.querySelector("#chart-fixture svg");
          if (!node) return false;
          return Math.abs(node.getBoundingClientRect().width - previous) > 40;
        },
        beforeWidth,
        { timeout: WAIT_MS },
      );
      const afterWidth = await svg.evaluate((el) => el.getBoundingClientRect().width);
      if (!(afterWidth > 0) || !(await chart.isVisible())) {
        throw new Error("Installed Bar Chart: chart disappeared after container resize.");
      }
      if (!(afterWidth < beforeWidth)) {
        throw new Error(
          `Installed Bar Chart: expected SVG to shrink after narrowing the fixture (before=${beforeWidth}, after=${afterWidth}).`,
        );
      }
    },
  },
  "line-chart": {
    criticalPaths: [
      "components/ui/LineChart.tsx",
      "components/ui/line-chart.module.css",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        '"use client";',
        "",
        'import { LineChart } from "@/components/ui/LineChart";',
        "",
        "const data = [",
        '  { label: "Jan", value: 58 },',
        '  { label: "Feb", value: 72 },',
        '  { label: "Mar", value: 91 },',
        '  { label: "Apr", value: 84 },',
        '  { label: "May", value: 110 },',
        '  { label: "Jun", value: 140 },',
        "];",
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40 }}>',
        '      <div id="chart-fixture" style={{ width: 600 }}>',
        '        <LineChart data={data} label="Monthly signups trend" height={320} />',
        "      </div>",
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/LineChart"/.test(pageSource) && /Monthly signups trend/.test(pageSource),
    harnessAssertionLabel: "consumer page imports LineChart and renders single-series monthly signup trend data",
    browserAssert: async ({ page }) => {
      const WAIT_MS = 8000;
      const chart = page.getByRole("img", { name: "Monthly signups trend" });
      await chart.waitFor({ state: "visible", timeout: WAIT_MS });

      const svg = chart.locator("svg").first();
      await svg.waitFor({ state: "visible", timeout: WAIT_MS });
      const curve = chart.locator(".recharts-line-curve");
      await curve.first().waitFor({ state: "attached", timeout: WAIT_MS });
      if ((await curve.count()) !== 1) {
        throw new Error(`Installed Line Chart: expected 1 line curve, found ${await curve.count()}.`);
      }
      const dots = chart.locator(".recharts-line-dots circle");
      await dots.first().waitFor({ state: "attached", timeout: WAIT_MS });
      if ((await dots.count()) !== 6) {
        throw new Error(`Installed Line Chart: expected 6 point markers, found ${await dots.count()}.`);
      }

      const cys = await dots.evaluateAll((els) => els.map((d) => Number(d.getAttribute("cy"))));
      if (cys.indexOf(Math.min(...cys)) !== 5 || cys.indexOf(Math.max(...cys)) !== 0) {
        throw new Error(`Installed Line Chart: proportional point positions wrong (cys=[${cys.join(", ")}]).`);
      }

      const table = page.locator("table.sr-only");
      if ((await table.count()) !== 1) throw new Error("Installed Line Chart: expected one visually-hidden data table.");
      const jan = await table.getByRole("row", { name: /Jan/ }).textContent();
      const jun = await table.getByRole("row", { name: /Jun/ }).textContent();
      if (!jan?.includes("58") || !jun?.includes("140")) {
        throw new Error(`Installed Line Chart: hidden table data mismatch (jan="${jan}", jun="${jun}").`);
      }

      if ((await chart.locator(".recharts-cartesian-axis").count()) !== 0) {
        throw new Error("Installed Line Chart: unexpected cartesian axis rendered.");
      }
      if ((await chart.locator(".recharts-legend-wrapper").count()) !== 0) {
        throw new Error("Installed Line Chart: unexpected legend rendered.");
      }

      const beforeWidth = await svg.evaluate((el) => el.getBoundingClientRect().width);
      await page.locator("#chart-fixture").evaluate((el) => {
        (el as HTMLElement).style.width = "360px";
        window.dispatchEvent(new Event("resize"));
      });
      await page.waitForFunction(
        (previous) => {
          const node = document.querySelector("#chart-fixture svg");
          if (!node) return false;
          return Math.abs(node.getBoundingClientRect().width - previous) > 40;
        },
        beforeWidth,
        { timeout: WAIT_MS },
      );
      const afterWidth = await svg.evaluate((el) => el.getBoundingClientRect().width);
      if (!(afterWidth > 0) || !(await chart.isVisible())) {
        throw new Error("Installed Line Chart: chart disappeared after container resize.");
      }
      if (!(afterWidth < beforeWidth)) {
        throw new Error(
          `Installed Line Chart: expected SVG to shrink after narrowing the fixture (before=${beforeWidth}, after=${afterWidth}).`,
        );
      }
    },
  },
  "spinner-divider-link": {
    criticalPaths: [
      "components/ui/Spinner.tsx",
      "components/ui/spinner.module.css",
      "components/ui/Divider.tsx",
      "components/ui/divider.module.css",
      "components/ui/Link.tsx",
      "components/ui/link.module.css",
      "components/ui/internal/link-utils.ts",
      "lib/cn.ts",
      "styles/skrewww-foundation.css",
    ],
    extraAdds: ["spinner", "divider"],
    expectedSharedTargets: ["lib/cn.ts"],
    closeStdinOnAdd: true,
    renderHarness: () =>
      [
        'import { Divider } from "@/components/ui/Divider";',
        'import { Link } from "@/components/ui/Link";',
        'import { Spinner } from "@/components/ui/Spinner";',
        "",
        "export default function Home() {",
        "  return (",
        '    <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 16 }}>',
        '      <Spinner label="Composed loading" />',
        "      <Divider />",
        '      <Link href="/components/button">Composed internal link</Link>',
        '      <Link href="https://example.com" target="_blank">Composed external link</Link>',
        "    </div>",
        "  );",
        "}",
        "",
      ].join("\n"),
    assertHarness: (pageSource) =>
      /from "@\/components\/ui\/Spinner"/.test(pageSource) &&
      /from "@\/components\/ui\/Divider"/.test(pageSource) &&
      /from "@\/components\/ui\/Link"/.test(pageSource) &&
      /Composed loading/.test(pageSource),
    harnessAssertionLabel:
      "composed consumer installs Link+Spinner+Divider and renders them together without manual repair",
  },
};

const componentArg = cliArgs.find((arg) => !arg.startsWith("--"));
const COMPONENT_NAME = componentArg ?? "button";
const descriptor = COMPONENT_DESCRIPTORS[COMPONENT_NAME];
if (!descriptor) {
  console.error(
    `Unsupported component "${COMPONENT_NAME}" for smoke:consumer. ` +
      `Supported components: ${Object.keys(COMPONENT_DESCRIPTORS).join(", ")}.`,
  );
  process.exit(1);
}

/** Composed descriptors install a primary registry item plus extras. */
const PRIMARY_ADD_BY_DESCRIPTOR: Record<string, string> = {
  "spinner-divider-link": "link",
};
const PRIMARY_ADD = PRIMARY_ADD_BY_DESCRIPTOR[COMPONENT_NAME] ?? COMPONENT_NAME;

function log(line: string): void {
  console.log(line);
}

const failures: string[] = [];

function assert(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    log(`  ✔ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    log(`  ✖ ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
    throw new Error(`Assertion failed: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function targetToRelPath(target: string): string {
  if (!target.startsWith("~/")) {
    throw new Error(`Unexpected shadcn target shape (expected "~/..."): ${target}`);
  }
  return target.slice(2);
}

/**
 * Removes a leading standalone `/** ... *\/` first line (and the newline
 * after it), if present — used only to recognize the diagnosed shadcn
 * CLI quirk documented at the call site, never to "fix" arbitrary content.
 * Returns the input unchanged if it doesn't start with exactly that shape.
 */
function stripLeadingBlockCommentLine(content: string): string {
  const match = /^\/\*\*.*\*\/\r?\n/.exec(content);
  return match ? content.slice(match[0].length) : content;
}

/** Resolves the full @skrewww registry dependency graph from a root item name, using the same pure builders the real generator script uses — no network, no filesystem write. */
function resolveGraph(rootName: string): ShadcnRegistryItem[] {
  const seen = new Set<string>();
  const items: ShadcnRegistryItem[] = [];
  function visit(name: string): void {
    if (seen.has(name)) return;
    seen.add(name);
    const builder = MANIFEST_BUILDERS[name];
    if (!builder) {
      throw new Error(
        `No local manifest builder registered for "${name}" in smoke-test-consumer.ts's MANIFEST_BUILDERS — ` +
          "the smoke test's registry graph is out of date relative to lib/shadcn-registry-generator.ts.",
      );
    }
    const item = builder();
    items.push(item);
    for (const dep of item.registryDependencies) {
      visit(dep.replace(/^@skrewww\//, ""));
    }
  }
  visit(rootName);
  return items;
}

function walkFiles(root: string, dir: string = root): string[] {
  const exclude = new Set(["node_modules", ".git", ".next"]);
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(root, full));
    } else {
      out.push(relative(root, full));
    }
  }
  return out;
}

function snapshotDir(root: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const relPath of walkFiles(root)) {
    const content = readFileSync(join(root, relPath));
    map.set(relPath, createHash("sha256").update(content).digest("hex"));
  }
  return map;
}

function diffSnapshots(
  pre: Map<string, string>,
  post: Map<string, string>,
): { added: string[]; removed: string[]; modified: string[] } {
  const added: string[] = [];
  const modified: string[] = [];
  post.forEach((hash, relPath) => {
    if (!pre.has(relPath)) added.push(relPath);
    else if (pre.get(relPath) !== hash) modified.push(relPath);
  });
  const removed = Array.from(pre.keys()).filter((relPath) => !post.has(relPath));
  return { added, removed, modified };
}

function readPackageDependencyNames(consumerDir: string): Set<string> {
  const pkg = JSON.parse(readFileSync(join(consumerDir, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
}

function startRegistryServer(rootDir: string): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      // Explicit Connection: close on every response — without it, this
      // server's default keep-alive leaves the socket open after the
      // response completes, and shadcn's own fetch client does not
      // proactively drop the pooled connection, which keeps its process
      // alive indefinitely even though the actual request/response
      // already finished. A throwaway single-purpose local server for one
      // CLI invocation has no legitimate use for persistent connections.
      res.setHeader("Connection", "close");
      try {
        const urlPath = new URL(req.url ?? "/", "http://localhost").pathname;
        const filePath = join(rootDir, urlPath);
        if (!filePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const data = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    });
    server.keepAliveTimeout = 0;
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Registry server failed to bind to a dynamic loopback port."));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function waitUntilReady(
  url: string,
  timeoutMs = 5000,
  intervalMs = 200,
  label = "Local registry server",
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`${label} never became ready at ${url} within ${timeoutMs}ms.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Starts `next start` against an already-built consumer app on a
 * pseudo-random high port (loopback only), waits for it to answer "/", and
 * returns a stop() to SIGTERM it. Generic — knows nothing about which
 * component is being tested; only used when a descriptor defines
 * `browserAssert`. Kept deliberately separate from startRegistryServer
 * (which serves static JSON in-process) since this spawns a real Next.js
 * server as a child process.
 */
async function startNextServer(consumerDir: string): Promise<{ baseUrl: string; stop: () => Promise<void> }> {
  const port = 4100 + Math.floor(Math.random() * 900);
  const baseUrl = `http://127.0.0.1:${port}`;
  const child: ChildProcess = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: consumerDir,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  try {
    await waitUntilReady(baseUrl, 20000, 300, "Installed consumer's next start server");
  } catch (cause) {
    child.kill("SIGTERM");
    await exited;
    throw cause;
  }
  return {
    baseUrl,
    stop: async () => {
      child.kill("SIGTERM");
      await exited;
    },
  };
}

/**
 * Non-blocking subprocess runner. Deliberately NOT execFileSync: this
 * script's local registry server runs in-process (same event loop), and
 * a synchronous child-process call would freeze that event loop for its
 * entire duration — including while `shadcn` is trying to make an HTTP
 * request back to that same process's server, which would then never be
 * accepted. Discovered the hard way: execFileSync here produced a
 * same-process deadlock indistinguishable from a hung CLI.
 *
 * closeStdin (optional, default false) forces stdin to "ignore" instead
 * of the default resolution below — for every existing caller this option
 * is omitted, so their resolved stdin is byte-identical to before this
 * option existed. Used only for the text-input `shadcn add` call: `--yes`
 * already suppresses most prompts, but a stray interactive prompt on
 * unverified territory (first multi-manifest shared-target graph) should
 * fail fast on EOF rather than hang on inherited terminal input.
 */
/**
 * captureStdout redirects the child's stdout to a real temp FILE (via an
 * fs.openSync file descriptor passed directly into `stdio`), then reads it
 * back after the process exits — never a Node "pipe". Discovered the hard
 * way on calendar-grid's manifest (~66KB, the largest `shadcn view` output
 * in this repo so far): piped stdout capture (`stdio: [..., "pipe", ...]`
 * + accumulating 'data' chunks) silently truncated at a consistent ~64KB
 * boundary — a real upstream non-blocking-pipe-write bug in the `shadcn`/
 * `npx` toolchain, reproduced independently of this script (bypassed by
 * plain shell `>` file redirection, which is exactly what a real fd
 * accomplishes). `add`'s own stdout is unaffected because it always uses
 * "inherit" (terminal-to-terminal), never captured through this path.
 */
function run(
  command: string,
  args: string[],
  options: { cwd?: string; captureStdout?: boolean; closeStdin?: boolean } = {},
): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    const stdin = options.closeStdin ? "ignore" : options.captureStdout ? "ignore" : "inherit";
    const stdoutCapturePath = options.captureStdout
      ? join(mkdtempSync(join(tmpdir(), "skrewww-smoke-stdout-")), "stdout.txt")
      : undefined;
    const stdoutFd = stdoutCapturePath ? openSync(stdoutCapturePath, "w") : undefined;
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: [stdin, stdoutFd ?? "inherit", "inherit"],
    });
    child.on("error", (error) => {
      if (stdoutFd !== undefined) closeSync(stdoutFd);
      reject(error);
    });
    child.on("close", (code) => {
      if (stdoutFd !== undefined) closeSync(stdoutFd);
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
        return;
      }
      const stdout = stdoutCapturePath ? readFileSync(stdoutCapturePath, "utf8") : "";
      resolve({ stdout });
    });
  });
}

/** Finds the prerendered HTML for the "/" route and returns the stylesheet hrefs it actually links, so activation is proven against what the built route really references — not every CSS file next happens to emit. */
function findRootRouteStylesheetHrefs(consumerDir: string): string[] {
  const appServerDir = join(consumerDir, ".next", "server", "app");
  const candidates = ["page.html", "index.html"];
  let htmlPath: string | undefined;
  for (const candidate of candidates) {
    const candidatePath = join(appServerDir, candidate);
    if (existsSync(candidatePath)) {
      htmlPath = candidatePath;
      break;
    }
  }
  if (!htmlPath) {
    const found = existsSync(appServerDir) ? readdirSync(appServerDir) : [];
    throw new Error(
      `Could not find a prerendered HTML file for the "/" route under ${appServerDir}. ` +
        `Directory contents: ${found.join(", ") || "(missing)"}`,
    );
  }
  const html = readFileSync(htmlPath, "utf8");
  const hrefs: string[] = [];
  const linkTagPattern = /<link[^>]+href="([^"]+\.css)"[^>]*>/g;
  let match: RegExpExecArray | null;
  while ((match = linkTagPattern.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  if (hrefs.length === 0) {
    throw new Error(`No <link ...href="*.css"> tags found in the prerendered "/" route HTML at ${htmlPath}.`);
  }
  return hrefs;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const tmpRoot = mkdtempSync(join(tmpdir(), "skrewww-smoke-"));
  const consumerDir = join(tmpRoot, "consumer");
  const registryRoot = join(tmpRoot, "registry-serve");
  const registryRDir = join(registryRoot, "r");
  let server: Server | undefined;

  log(`Temp root: ${tmpRoot}`);

  try {
    log(`\n[1/13] Building manifests in-memory from the current skrewwwDS working tree (no filesystem writes to the repo)`);
    const graphNames = [PRIMARY_ADD, ...(descriptor.extraAdds ?? [])];
    const graphByName = new Map<string, ShadcnRegistryItem>();
    for (const name of graphNames) {
      for (const item of resolveGraph(name)) {
        graphByName.set(item.name, item);
      }
    }
    const graph = Array.from(graphByName.values());
    const componentItem = graph.find((item) => item.name === PRIMARY_ADD);
    if (!componentItem) throw new Error(`${PRIMARY_ADD} item missing from resolved graph`);
    mkdirSync(registryRDir, { recursive: true });
    for (const item of graph) {
      writeFileSync(join(registryRDir, `${item.name}.json`), JSON.stringify(item, null, 2));
    }
    assert(
      `manifests built for ${PRIMARY_ADD} + foundation`,
      graph.some((item) => item.name === PRIMARY_ADD) && graph.some((item) => item.name === "foundation"),
      `graph: ${graph.map((i) => i.name).join(", ")}`,
    );

    log("\n[2/13] Starting local registry server (loopback-only, dynamic port)");
    const started = await startRegistryServer(registryRoot);
    server = started.server;
    const registryBaseUrl = started.baseUrl;
    log(`  Registry base URL: ${registryBaseUrl}`);

    log(`\n[3/13] Readiness check on /r/${PRIMARY_ADD}.json`);
    await waitUntilReady(`${registryBaseUrl}/r/${PRIMARY_ADD}.json`);
    assert("local registry server ready", true);

    log(`\n[4/13] Scaffolding Tailwind-free consumer (create-next-app@${CREATE_NEXT_APP_VERSION}, pinned)`);
    await run("npx", [
      `create-next-app@${CREATE_NEXT_APP_VERSION}`,
      consumerDir,
      "--typescript",
      "--eslint",
      "--app",
      "--no-tailwind",
      "--no-src-dir",
      "--import-alias",
      "@/*",
      "--use-npm",
      "--yes",
    ]);

    const scaffoldDepNames = readPackageDependencyNames(consumerDir);

    log("\n[5/13] Confirming Tailwind-free scaffold");
    const pkgRaw = readFileSync(join(consumerDir, "package.json"), "utf8");
    assert("no tailwind* dependency in package.json", !/"tailwind/i.test(pkgRaw));
    assert(
      "no tailwind.config.* / postcss.config.*",
      !existsSync(join(consumerDir, "tailwind.config.js")) &&
        !existsSync(join(consumerDir, "tailwind.config.ts")) &&
        !existsSync(join(consumerDir, "postcss.config.js")) &&
        !existsSync(join(consumerDir, "postcss.config.mjs")),
    );
    const globalsCssPath = join(consumerDir, "app", "globals.css");
    assert("no @tailwind directives in app/globals.css", !/@tailwind/.test(readFileSync(globalsCssPath, "utf8")));

    log("\n[6/13] Writing components.json (shadcn init is never invoked — it hard-requires Tailwind; see docs/architecture/shadcn-distribution.md)");
    writeFileSync(
      join(consumerDir, "components.json"),
      JSON.stringify(
        {
          $schema: "https://ui.shadcn.com/schema.json",
          style: "new-york",
          rsc: true,
          tsx: true,
          tailwind: { config: "", css: "app/globals.css", baseColor: "neutral", cssVariables: true },
          aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
          registries: { "@skrewww": `${registryBaseUrl}/r/{name}.json` },
        },
        null,
        2,
      ),
    );

    log(`\n[7/13] shadcn@${SHADCN_VERSION} view @skrewww/${PRIMARY_ADD} (before any files are written)`);
    const { stdout: viewOutput } = await run("npx", [`shadcn@${SHADCN_VERSION}`, "view", `@skrewww/${PRIMARY_ADD}`], {
      cwd: consumerDir,
      captureStdout: true,
    });
    let viewJson: unknown;
    try {
      viewJson = JSON.parse(viewOutput);
    } catch (cause) {
      throw new Error(`shadcn view output did not parse as JSON:\n${viewOutput}`, { cause });
    }
    assert("view resolves to a JSON array with one item", Array.isArray(viewJson) && viewJson.length === 1);
    const viewedItem = (viewJson as ShadcnRegistryItem[])[0];
    assert(`view item name is ${PRIMARY_ADD}`, viewedItem.name === PRIMARY_ADD);
    assert(
      "view item declares @skrewww/foundation as a registryDependency",
      viewedItem.registryDependencies.includes("@skrewww/foundation"),
    );

    log("\n[8/13] Pre-add filesystem snapshot");
    const preAddSnapshot = snapshotDir(consumerDir);

    log(`\n[9/13] shadcn@${SHADCN_VERSION} add @skrewww/${PRIMARY_ADD}`);
    await run("npx", [`shadcn@${SHADCN_VERSION}`, "add", `@skrewww/${PRIMARY_ADD}`, "--yes"], {
      cwd: consumerDir,
      closeStdin: descriptor.closeStdinOnAdd,
    });
    for (const extra of descriptor.extraAdds ?? []) {
      log(`\n[9b/13] shadcn@${SHADCN_VERSION} add @skrewww/${extra}`);
      await run("npx", [`shadcn@${SHADCN_VERSION}`, "add", `@skrewww/${extra}`, "--yes"], {
        cwd: consumerDir,
        closeStdin: descriptor.closeStdinOnAdd,
      });
    }

    log("\n[10/13] Post-add filesystem + package.json snapshot, diff, and assertions");
    const postAddSnapshot = snapshotDir(consumerDir);
    const postAddDepNames = readPackageDependencyNames(consumerDir);
    const { added, removed, modified } = diffSnapshots(preAddSnapshot, postAddSnapshot);

    // Not deduped — used below to detect which consumer-relative targets
    // are genuinely contributed by more than one manifest in the graph,
    // before expectedTargets collapses them into a Set.
    const allTargetContributions = graph.flatMap((item) => item.files.map((f) => targetToRelPath(f.target)));
    const expectedTargets = new Set(allTargetContributions);
    const expectedNpmDependencies = new Set(graph.flatMap((item) => item.dependencies));

    const addedExcludingPackageFiles = added.filter((p) => p !== "package.json" && p !== "package-lock.json");
    const unexpectedAdded = addedExcludingPackageFiles.filter((p) => !expectedTargets.has(p));
    assert(
      "every newly-added file matches the recursively derived registry target set",
      unexpectedAdded.length === 0,
      unexpectedAdded.length ? `unexpected: ${unexpectedAdded.join(", ")}` : `${addedExcludingPackageFiles.length} file(s) added, all expected`,
    );
    const missingExpected = Array.from(expectedTargets).filter((t) => !addedExcludingPackageFiles.includes(t));
    assert(
      "every expected registry target file was actually created",
      missingExpected.length === 0,
      missingExpected.length ? `missing: ${missingExpected.join(", ")}` : "all present",
    );

    for (const criticalPath of descriptor.criticalPaths) {
      assert(`critical path exists on disk: ${criticalPath}`, existsSync(join(consumerDir, criticalPath)));
    }

    const addedNpmPackages = Array.from(postAddDepNames).filter((name) => !scaffoldDepNames.has(name));
    const unexpectedNpmPackages = addedNpmPackages.filter((name) => !expectedNpmDependencies.has(name));
    const missingNpmPackages = Array.from(expectedNpmDependencies).filter((name) => !addedNpmPackages.includes(name));
    assert(
      "npm dependency delta matches the recursively resolved registry graph's declared dependencies",
      unexpectedNpmPackages.length === 0 && missingNpmPackages.length === 0,
      `expected: [${Array.from(expectedNpmDependencies).join(", ")}], actual new: [${addedNpmPackages.join(", ")}]`,
    );

    const unexplainedRemoved = removed;
    const unexplainedModified = modified.filter((p) => {
      if (p === "package.json" || p === "package-lock.json") {
        return expectedNpmDependencies.size > 0 ? false : true;
      }
      return true;
    });
    const unexpectedChanges = [...unexplainedRemoved.map((p) => `removed:${p}`), ...unexplainedModified.map((p) => `modified:${p}`)];
    assert(
      "no unexplained removed/modified files outside node_modules",
      unexpectedChanges.length === 0,
      unexpectedChanges.length ? unexpectedChanges.join(", ") : "none",
    );

    // Shared-target verification: some graphs (first seen with text-input,
    // where text-input, form-field, and validation-message all
    // independently declare lib/cn.ts) genuinely contribute the same
    // consumer-relative target from more than one manifest. This proves
    // the FINAL installed state is correct — exactly one file at that
    // path, with content matching every contributing manifest's own
    // embedded content — not how many times the shadcn CLI wrote to disk
    // internally while resolving the graph.
    const targetContributionCounts = new Map<string, number>();
    for (const relPath of allTargetContributions) {
      targetContributionCounts.set(relPath, (targetContributionCounts.get(relPath) ?? 0) + 1);
    }
    const actualSharedTargets = Array.from(targetContributionCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([relPath]) => relPath)
      .sort();
    const expectedSharedTargets = [...(descriptor.expectedSharedTargets ?? [])].sort();
    assert(
      "shared-target contribution matches expectation (a target genuinely declared by more than one manifest in the resolved graph)",
      JSON.stringify(actualSharedTargets) === JSON.stringify(expectedSharedTargets),
      `expected: [${expectedSharedTargets.join(", ")}], actual: [${actualSharedTargets.join(", ")}]`,
    );

    for (const relPath of actualSharedTargets) {
      const onDiskPath = join(consumerDir, relPath);
      assert(`shared target present as exactly one final file on disk: ${relPath}`, existsSync(onDiskPath));

      const contributingContents = new Set(
        graph.flatMap((item) =>
          item.files.filter((f) => targetToRelPath(f.target) === relPath).map((f) => f.content),
        ),
      );
      assert(
        `every manifest contributing ${relPath} embeds identical content`,
        contributingContents.size === 1,
        `${contributingContents.size} distinct content value(s) found across contributing manifests`,
      );

      const onDiskContent = readFileSync(onDiskPath, "utf8");
      const canonicalContent = Array.from(contributingContents)[0];
      if (onDiskContent === canonicalContent) {
        assert(`installed ${relPath} is byte-identical to the canonical content every contributing manifest embeds`, true);
      } else if (onDiskContent === stripLeadingBlockCommentLine(canonicalContent)) {
        // Diagnosed, reproducible shadcn@4.16.2 CLI behavior (confirmed
        // independent of sharing — happens even for a single-source,
        // non-shared install): a file whose very first line is a
        // standalone `/** ... */` block comment gets that line silently
        // dropped during `add`. Zero functional impact (comment-only,
        // TypeScript-invisible) — every other line, including all real
        // code, transports byte-for-byte. Verified via direct reproduction
        // outside this harness (isolated server + `npx shadcn view`/`add`)
        // before accepting this narrow, generic tolerance — not a
        // Skrewww registry/generator defect, not weakened for convenience.
        log(`  ⚠ installed ${relPath} is missing its leading standalone block-comment line — known shadcn@4.16.2 CLI behavior, zero functional impact, not a Skrewww defect (see run() docs above)`);
      } else {
        assert(
          `installed ${relPath} is byte-identical to the canonical content every contributing manifest embeds`,
          false,
        );
      }
    }
    // addedExcludingPackageFiles/unexpectedAdded above already prove no
    // alternate/suffixed duplicate (e.g. lib/cn-1.ts) was created — such a
    // path would not be in expectedTargets and would already have failed
    // that assertion, so no separate check is needed here.

    log("\n[11/13] Wiring Foundation CSS import (before consumer globals.css, exactly once) and rendering a real consumer page");
    const layoutPath = join(consumerDir, "app", "layout.tsx");
    const layoutSrc = readFileSync(layoutPath, "utf8");
    const globalsImportPattern = /import\s+["']\.\/globals\.css["'];/;
    if (!globalsImportPattern.test(layoutSrc)) {
      throw new Error(`Could not find the default \`import "./globals.css";\` line in ${layoutPath} to wire Foundation ahead of it.`);
    }
    const foundationImportLine = 'import "@/styles/skrewww-foundation.css";';
    const wiredLayoutSrc = layoutSrc.replace(globalsImportPattern, (match) => `${foundationImportLine}\n${match}`);
    writeFileSync(layoutPath, wiredLayoutSrc);
    const foundationImportOccurrences = (wiredLayoutSrc.match(new RegExp(escapeRegExp(foundationImportLine), "g")) ?? []).length;
    assert("Foundation CSS import present exactly once", foundationImportOccurrences === 1);
    const foundationIdx = wiredLayoutSrc.indexOf(foundationImportLine);
    const globalsIdx = wiredLayoutSrc.search(globalsImportPattern);
    assert("Foundation CSS import precedes consumer globals.css import", foundationIdx !== -1 && foundationIdx < globalsIdx);

    writeFileSync(join(consumerDir, "app", "page.tsx"), descriptor.renderHarness());
    assert(
      descriptor.harnessAssertionLabel,
      descriptor.assertHarness(readFileSync(join(consumerDir, "app", "page.tsx"), "utf8")),
    );

    log("\n[12/13] npm run build");
    await run("npm", ["run", "build"], { cwd: consumerDir });
    assert("next build succeeded", true);

    if (descriptor.browserAssert) {
      log("\n[12b/13] Installed-runtime browser verification (next start + headless Chromium)");
      const { baseUrl, stop } = await startNextServer(consumerDir);
      try {
        const browser = await chromium.launch();
        try {
          const page = await browser.newPage();
          const consoleErrors: string[] = [];
          page.on("console", (message) => {
            if (message.type() === "error") consoleErrors.push(message.text());
          });
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await descriptor.browserAssert({ page, baseUrl });
          const realErrors = consoleErrors.filter((entry) => !entry.includes("favicon"));
          assert(
            "no critical browser console errors on the installed consumer page",
            realErrors.length === 0,
            realErrors.length ? realErrors.join(" | ") : "none",
          );
        } finally {
          await browser.close();
        }
      } finally {
        await stop();
      }
    }

    log("\n[13/13] Foundation CSS activation proof (asset actually referenced by the built \"/\" route)");
    const stylesheetHrefs = findRootRouteStylesheetHrefs(consumerDir);
    let activationConfirmed = false;
    const inspected: string[] = [];
    for (const href of stylesheetHrefs) {
      const cssPath = join(consumerDir, ".next", href.replace(/^\/_next\//, ""));
      if (!existsSync(cssPath)) continue;
      const cssContent = readFileSync(cssPath, "utf8");
      inspected.push(href);
      if (cssContent.includes("--shape-radius-control") || cssContent.includes(".sr-only")) {
        activationConfirmed = true;
        break;
      }
    }
    assert(
      "Foundation CSS signature found in a stylesheet actually referenced by the built \"/\" route",
      activationConfirmed,
      `inspected: ${inspected.join(", ") || "(none resolved on disk)"}`,
    );

    const durationMs = Date.now() - startedAt;
    log(`\nAll assertions passed in ${(durationMs / 1000).toFixed(1)}s.`);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    if (KEEP) {
      log(`\n--keep passed: preserving temp directory at ${tmpRoot}`);
    } else {
      rmSync(tmpRoot, { recursive: true, force: true });
      log(`\nCleaned up temp directory: ${tmpRoot}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(`\nSmoke test FAILED: ${failures.length ? failures[failures.length - 1] : "(see error below)"}`);
    console.error(error);
    process.exit(1);
  });
