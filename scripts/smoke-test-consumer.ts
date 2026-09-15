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
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
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

async function waitUntilReady(url: string, timeoutMs = 5000, intervalMs = 200): Promise<void> {
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
  throw new Error(`Local registry server never became ready at ${url} within ${timeoutMs}ms.`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
function run(
  command: string,
  args: string[],
  options: { cwd?: string; captureStdout?: boolean; closeStdin?: boolean } = {},
): Promise<{ stdout: string }> {
  return new Promise((resolve, reject) => {
    const stdin = options.closeStdin ? "ignore" : options.captureStdout ? "ignore" : "inherit";
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: [stdin, options.captureStdout ? "pipe" : "inherit", "inherit"],
    });
    let stdout = "";
    if (options.captureStdout) {
      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
    }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout });
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
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
      assert(
        `installed ${relPath} is byte-identical to the canonical content every contributing manifest embeds`,
        onDiskContent === canonicalContent,
      );
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
