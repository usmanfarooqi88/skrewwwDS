/**
 * Structured source for the /compare page.
 *
 * Evidence: docs/audits/compare-research-2026-10-17.md (verified 2026-10-17).
 *
 * Rules (enforced by lib/comparison.test.ts):
 * - Every value other than "unverified" carries at least one source id and a
 *   `verifiedAt` date. Source ids resolve through `comparisonSources` to public
 *   first-party URLs, so a URL is written once and reused.
 * - A missing value renders as "Not yet verified". It is never recorded as "No".
 * - Skrewww values are derived from canonical repo sources where one exists
 *   (registry, siteConfig, package manifest, Guard rule catalog, pilot maps).
 * - No scores, rankings or winner fields exist by design.
 */
import {
  getImplementedComponentCount,
  getImplementedMaturityCounts,
  getImplementedRegistryEntries,
} from "@/lib/component-registry";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import { PILOT_PROPERTY_MAPS } from "@/lib/audit/pilot-property-maps";
import { siteConfig } from "@/lib/site-config";
import reactPackage from "@/packages/react/package.json";

export type ComparisonSystemId = "skrewww" | "carbon" | "fluent-2" | "spectrum" | "atlassian";

/**
 * yes / partial / no / na — capability states (see the methodology note on the page).
 * fact — a descriptive label with no capability judgement (a count, a release stage).
 * unverified — no verified value is recorded; shown as a neutral state.
 */
export type ComparisonStatus = "yes" | "partial" | "no" | "na" | "fact" | "unverified";

export type ComparisonValue = {
  status: ComparisonStatus;
  /** Short factual label shown in the cell. Carries any scope qualifier that must stay visible. */
  label?: string;
  /** Supporting detail, shown with the source details. */
  note?: string;
  /** Ids from `comparisonSources`. Required for every status except "unverified". */
  sources?: readonly string[];
  /** ISO date (YYYY-MM-DD) the value was last checked against its sources. */
  verifiedAt?: string;
};

export type ComparisonSource = { name: string; url: string };

export type ComparisonSystem = {
  id: ComparisonSystemId;
  name: string;
  /** The system the page is about; its column gets a quiet emphasis. */
  isSubject: boolean;
};

export type ComparisonGroupId =
  | "implementation"
  | "styling"
  | "distribution"
  | "agent-readiness"
  | "accessibility-docs"
  | "ecosystem";

export type ComparisonGroup = { id: ComparisonGroupId; label: string };

export type ComparisonCategory = {
  id: string;
  group: ComparisonGroupId;
  label: string;
  /** One line clarifying what is being compared. Shown only where useful. */
  description?: string;
  values: Partial<Record<ComparisonSystemId, ComparisonValue>>;
};

/** Verification date for the current research set. */
export const VERIFIED_AT = "2026-10-17";

export const comparisonSystems: readonly ComparisonSystem[] = [
  { id: "skrewww", name: "Skrewww", isSubject: true },
  { id: "carbon", name: "Carbon", isSubject: false },
  { id: "fluent-2", name: "Fluent 2", isSubject: false },
  { id: "spectrum", name: "Spectrum", isSubject: false },
  { id: "atlassian", name: "Atlassian", isSubject: false },
];

export const comparisonGroups: readonly ComparisonGroup[] = [
  { id: "implementation", label: "Implementation" },
  { id: "styling", label: "Styling" },
  { id: "distribution", label: "Distribution" },
  { id: "agent-readiness", label: "Agent readiness" },
  { id: "accessibility-docs", label: "Accessibility & documentation" },
  { id: "ecosystem", label: "Ecosystem" },
];

/** Public first-party sources, each written once. Names are shown to readers; keep them short. */
export const comparisonSources: Readonly<Record<string, ComparisonSource>> = {
  // Skrewww
  "skrewww-repo": { name: "Skrewww repository", url: "https://github.com/usmanfarooqi88/skrewwwDS" },
  "skrewww-components": { name: "Skrewww components", url: "https://skrewww.com/components" },
  "skrewww-docs": { name: "Skrewww documentation", url: "https://skrewww.com/docs" },
  "skrewww-foundations": { name: "Skrewww foundations", url: "https://skrewww.com/foundations" },
  "skrewww-agent-kit": { name: "Skrewww Agent Kit", url: "https://skrewww.com/agent-kit" },
  "skrewww-guard": { name: "Skrewww Guard", url: "https://skrewww.com/guard" },
  "skrewww-registry": { name: "Skrewww registry catalog", url: "https://skrewww.com/r/registry.json" },
  "skrewww-npm": { name: "@skrewww/react on npm", url: "https://www.npmjs.com/package/@skrewww/react" },
  "skrewww-figma": { name: "Skrewww free Figma file", url: siteConfig.figmaFreeFileUrl },
  "shadcn-registries": { name: "shadcn registry directory index", url: "https://ui.shadcn.com/r/registries.json" },
  "shadcn-pr": { name: "shadcn-ui/ui pull request 12059", url: "https://github.com/shadcn-ui/ui/pull/12059" },
  "awesome-shadcn-pr": {
    name: "Awesome shadcn/ui pull request 626",
    url: "https://github.com/birobirobiro/awesome-shadcn-ui/pull/626",
  },
  // Carbon
  "carbon-docs": { name: "Carbon documentation", url: "https://www.carbondesignsystem.com" },
  "carbon-npm": { name: "@carbon/react on npm", url: "https://www.npmjs.com/package/@carbon/react" },
  "carbon-github": { name: "Carbon on GitHub", url: "https://github.com/carbon-design-system/carbon" },
  "carbon-design-resources": {
    name: "Carbon design resources",
    url: "https://www.carbondesignsystem.com/getting-started/designing/design-resources",
  },
  "carbon-themes": {
    name: "Carbon themes",
    url: "https://www.carbondesignsystem.com/building-blocks/foundations/themes",
  },
  "carbon-accessibility": {
    name: "Carbon accessibility",
    url: "https://www.carbondesignsystem.com/building-blocks/foundations/accessibility",
  },
  "carbon-mcp": {
    name: "Carbon MCP overview",
    url: "https://www.carbondesignsystem.com/getting-started/carbon-mcp/overview",
  },
  "carbon-llms": { name: "Carbon llms.txt", url: "https://www.carbondesignsystem.com/llms.txt" },
  // Fluent 2
  "fluent-docs": { name: "Fluent 2 documentation", url: "https://fluent2.microsoft.design" },
  "fluent-npm": { name: "@fluentui/react-components on npm", url: "https://www.npmjs.com/package/@fluentui/react-components" },
  "fluent-github": { name: "Fluent UI on GitHub", url: "https://github.com/microsoft/fluentui" },
  "fluent-figma": { name: "Fluent 2 design kits", url: "https://fluent2.microsoft.design/get-started/design" },
  "fluent-tokens": { name: "Fluent 2 design tokens", url: "https://fluent2.microsoft.design/design-tokens" },
  "fluent-shapes": { name: "Fluent 2 shapes", url: "https://fluent2.microsoft.design/shapes" },
  "fluent-material": { name: "Fluent 2 material", url: "https://fluent2.microsoft.design/material" },
  "fluent-accessibility": { name: "Fluent 2 accessibility", url: "https://fluent2.microsoft.design/accessibility" },
  "fluent-eslint": {
    name: "Fluent UI ESLint plugin",
    url: "https://github.com/microsoft/fluentui/tree/master/packages/react-components/eslint-plugin-react-components",
  },
  "fluent-llms": { name: "Fluent UI React llms.txt", url: "https://storybooks.fluentui.dev/react/llms.txt" },
  // Spectrum
  "spectrum-docs": { name: "Spectrum documentation", url: "https://spectrum.adobe.com" },
  "spectrum-npm": { name: "@react-spectrum/s2 on npm", url: "https://www.npmjs.com/package/@react-spectrum/s2" },
  "spectrum-github": { name: "React Spectrum on GitHub", url: "https://github.com/adobe/react-spectrum" },
  "spectrum-tokens": { name: "Spectrum design tokens", url: "https://spectrum.adobe.com/page/design-tokens/" },
  "spectrum-token-catalog": {
    name: "Spectrum token catalog",
    url: "https://opensource.adobe.com/spectrum-design-data/tokens/",
  },
  "spectrum-drop-shadow": {
    name: "Spectrum drop shadow",
    url: "https://spectrum.adobe.com/foundations/styles/object-styles/drop-shadow",
  },
  "spectrum-ai": { name: "React Spectrum: Working with AI", url: "https://react-spectrum.adobe.com/ai" },
  "spectrum-design-data-ai": {
    name: "Spectrum Design Data: Using AI",
    url: "https://opensource.adobe.com/spectrum-design-data/ai/",
  },
  "spectrum-skills-index": {
    name: "React Spectrum skills index",
    url: "https://react-spectrum.adobe.com/.well-known/skills/index.json",
  },
  "react-aria-quality": { name: "React Aria quality", url: "https://react-aria.adobe.com/quality" },
  "react-aria-registry": {
    name: "React Aria registry",
    url: "https://react-aria.adobe.com/registry/registry.json",
  },
  "react-aria-getting-started": {
    name: "React Aria getting started",
    url: "https://react-aria.adobe.com/getting-started",
  },
  // Atlassian
  "atlassian-docs": { name: "Atlassian Design System", url: "https://atlassian.design" },
  "atlassian-llms": { name: "Atlassian Design System llms.txt", url: "https://atlassian.design/llms.txt" },
  "atlassian-npm": { name: "@atlaskit/button on npm", url: "https://www.npmjs.com/package/@atlaskit/button" },
  "atlassian-mcp-npm": { name: "@atlaskit/ads-mcp on npm", url: "https://www.npmjs.com/package/@atlaskit/ads-mcp" },
  "atlassian-eslint-npm": {
    name: "@atlaskit/eslint-plugin-design-system on npm",
    url: "https://www.npmjs.com/package/@atlaskit/eslint-plugin-design-system",
  },
  "atlassian-figma": {
    name: "Atlassian Figma libraries",
    url: "https://atlassian.design/get-started/design/figma-libraries/marketplace-partners",
  },
  "atlassian-mirror": {
    name: "Atlassian Frontend public mirror",
    url: "https://bitbucket.org/atlassian/atlassian-frontend-mirror",
  },
  "atlassian-radius": { name: "Atlassian radius", url: "https://atlassian.design/foundations/radius" },
  "atlassian-elevation": { name: "Atlassian elevation", url: "https://atlassian.design/foundations/elevation" },
};

/**
 * Shape and Surface modes, mirroring the `data-skrewww-shape` / `data-skrewww-surface`
 * values used in the CSS. lib/comparison.test.ts fails if the CSS and these lists drift.
 */
export const SHAPE_MODES = ["Sharp", "Rounded", "Pill", "Squircle"] as const;
export const SURFACE_MODES = ["Flat", "Gradient", "Glass"] as const;

/**
 * Number of public (consumer) Guard rules. Kept as a constant because importing GUARD_RULE_CATALOG
 * pulls the Guard evaluators, which use dynamic filesystem access, into this page's bundle.
 * lib/comparison.test.ts fails if it drifts from the catalog.
 */
export const GUARD_CONSUMER_RULE_COUNT = 3;

const NUMBER_WORDS =["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const numberWord = (n: number): string => NUMBER_WORDS[n] ?? String(n);
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Skrewww facts derived from canonical repo sources. Pure; safe at build time. */
export function getSkrewwwFacts() {
  const implemented = getImplementedComponentCount();
  const installable = getImplementedRegistryEntries().filter((entry) =>
    isDistributedViaSkrewwwRegistry(entry.slug),
  ).length;
  const { stable } = getImplementedMaturityCounts();
  return {
    implemented,
    installable,
    stable,
    shapeModes: SHAPE_MODES,
    surfaceModes: SURFACE_MODES,
    guardConsumerRules: GUARD_CONSUMER_RULE_COUNT,
    pilotCount: Object.keys(PILOT_PROPERTY_MAPS).length,
    license: reactPackage.license,
  };
}

function val(
  status: ComparisonStatus,
  label: string,
  sources: readonly string[],
  note?: string,
): ComparisonValue {
  return { status, label, note, sources, verifiedAt: VERIFIED_AT };
}

export function getComparisonCategories(): ComparisonCategory[] {
  const f = getSkrewwwFacts();
  const shapeList = f.shapeModes.join(", ");
  const surfaceList = f.surfaceModes.join(", ");

  return [
    {
      id: "component-coverage",
      group: "implementation",
      label: "Component coverage",
      description: "Counts are not like-for-like across systems, so other systems are not counted.",
      values: {
        skrewww: val("fact", `${f.implemented} React components`, ["skrewww-components"], "Implemented components in this project's registry."),
      },
    },
    {
      id: "react-implementation",
      group: "implementation",
      label: "React implementation",
      values: {
        skrewww: val("yes", "React and TypeScript", ["skrewww-repo"]),
        carbon: val("yes", "@carbon/react", ["carbon-npm"], "Published on npm under Apache-2.0."),
        "fluent-2": val("yes", "@fluentui/react-components", ["fluent-npm"], "Fluent UI React v9, published on npm under MIT."),
        spectrum: val("yes", "React Spectrum S2", ["spectrum-npm"], "Also publishes @adobe/react-spectrum and react-aria-components."),
        atlassian: val("yes", "@atlaskit React packages", ["atlassian-llms", "atlassian-npm"], "Components are documented as React components built on primitives and tokens."),
      },
    },
    {
      id: "figma-support",
      group: "implementation",
      label: "Figma support",
      values: {
        skrewww: val("yes", "Free and Pro libraries", ["skrewww-figma"], "Free and Pro Figma libraries. Pro is a paid product."),
        carbon: val("yes", "Figma libraries", ["carbon-design-resources"], "Some content is restricted to IBM staff. Figma Community versions require a Figma license."),
        "fluent-2": val("yes", "Fluent 2 UI kits", ["fluent-figma"], "Core UI kits for Web, iOS and Android, built in Figma."),
        atlassian: val("yes", "Public Figma Community libraries", ["atlassian-figma"], "ADS Foundations and Components libraries. Anyone with a Figma account can use the public-access libraries; access paths differ for Atlassians and Marketplace partners."),
      },
    },
    {
      id: "design-tokens",
      group: "styling",
      label: "Design tokens",
      values: {
        skrewww: val("yes", "Layered CSS tokens", ["skrewww-foundations"], "Primitive, semantic and component layers, then brand, shape and surface layers."),
        carbon: val("yes", "Themed design tokens", ["carbon-themes"], "Four built-in themes change token values, not component code."),
        "fluent-2": val("yes", "Global and alias tokens", ["fluent-tokens"], "Two token layers, with theming for light, dark and high contrast."),
        spectrum: val("yes", "Design tokens", ["spectrum-tokens"], "Published as the @adobe/spectrum-tokens package."),
        atlassian: val("yes", "@atlaskit/tokens", ["atlassian-llms"], "Color, typography, spacing, radius and elevation tokens."),
      },
    },
    {
      id: "shape-system",
      group: "styling",
      label: "Shape system",
      description: "Selectable modes versus corner-radius tokens.",
      values: {
        skrewww: val("fact", `${f.shapeModes.length} selectable modes`, ["skrewww-foundations"], `${shapeList}. Set on an ancestor; support is documented per component.`),
        "fluent-2": val("partial", "Corner-radius tokens", ["fluent-shapes"], "Four shape forms and radius tokens. No selectable shape modes are documented."),
        spectrum: val("partial", "Corner-radius tokens", ["spectrum-token-catalog"], "Corner radius is listed among layout primitives. No selectable shape modes are documented."),
        atlassian: val("partial", "Radius tokens", ["atlassian-radius"], "A scale of radius tokens. No selectable shape modes are documented."),
      },
    },
    {
      id: "surface-system",
      group: "styling",
      label: "Surface system",
      description: "Selectable modes versus elevation or material guidance.",
      values: {
        skrewww: val("fact", `${f.surfaceModes.length} selectable modes`, ["skrewww-foundations"], `${surfaceList}. Set on an ancestor; some components have a fixed surface.`),
        "fluent-2": val("partial", "Material guidance", ["fluent-material"], "Documents solid, acrylic, mica and smoke materials. No selectable surface modes are documented."),
        spectrum: val("partial", "Drop-shadow styles", ["spectrum-drop-shadow"], "Shadow styles for elevation. No selectable surface modes are documented."),
        atlassian: val("partial", "Elevation surfaces", ["atlassian-elevation"], "Sunken, default, raised and overlay surfaces, paired with shadows."),
      },
    },
    {
      id: "shadcn-distribution",
      group: "distribution",
      label: "shadcn-compatible distribution",
      description: "A registry the shadcn CLI can read. Directory listings are separate facts.",
      values: {
        skrewww: val(
          "yes",
          "@skrewww registry",
          ["skrewww-registry", "shadcn-registries", "shadcn-pr", "awesome-shadcn-pr"],
          "Indexed in the shadcn registry directory. Separately, listed in the community-curated Awesome shadcn/ui directory, which is not a shadcn endorsement.",
        ),
        spectrum: val(
          "partial",
          "React Aria Components registry",
          ["react-aria-registry", "react-aria-getting-started", "shadcn-registries"],
          "Adobe's React Aria publishes a first-party shadcn-compatible registry. It covers React Aria Components, not React Spectrum S2.",
        ),
      },
    },
    {
      id: "npm-distribution",
      group: "distribution",
      label: "npm distribution",
      values: {
        skrewww: val("yes", "@skrewww/react (beta)", ["skrewww-npm"], "Published under the beta dist-tag. A bare install resolves to an earlier beta, so use @beta or an exact version."),
        carbon: val("yes", "@carbon/react", ["carbon-npm"]),
        "fluent-2": val("yes", "@fluentui/react-components", ["fluent-npm"]),
        spectrum: val("yes", "@react-spectrum/s2", ["spectrum-npm"], "Also @adobe/react-spectrum and react-aria-components."),
        atlassian: val("yes", "@atlaskit packages", ["atlassian-npm"], "Published per component, for example @atlaskit/button."),
      },
    },
    {
      id: "registry-installability",
      group: "distribution",
      label: "Registry installability",
      description: "Components installable through a registry, out of those implemented.",
      values: {
        skrewww: val("partial", `${f.installable} of ${f.implemented} components`, ["skrewww-registry"], "A supported subset is installable today."),
        spectrum: val(
          "partial",
          "React Aria Components examples",
          ["react-aria-registry", "react-aria-getting-started"],
          "Installable with the shadcn CLI. This covers React Aria Components, not React Spectrum S2.",
        ),
      },
    },
    {
      id: "agent-contracts",
      group: "agent-readiness",
      label: "Agent-readable contracts",
      description: "Machine-readable component specifications published for agents.",
      values: {
        skrewww: val("yes", "Agent Kit contracts (Beta)", ["skrewww-agent-kit"], "Public Beta."),
        carbon: val("partial", "Hosted MCP server", ["carbon-mcp", "carbon-llms"], "Serves components, tokens, icons, guidance and code examples after an IBMid sign-in. Component-level contract specifications are not confirmed."),
        "fluent-2": val("partial", "llms.txt docs index", ["fluent-llms"], "An index of the React v9 documentation. No official MCP server was found in this review."),
        spectrum: val("partial", "Design-data MCP with component schemas", ["spectrum-design-data-ai", "spectrum-ai"], "Serves tokens, guidelines and component schemas (variants, sizes, states, boolean props). The data is design-level and does not plug into React Spectrum. React Spectrum's own MCP server serves documentation."),
        atlassian: val("partial", "Official ADS MCP server", ["atlassian-llms", "atlassian-mcp-npm"], "Covers tokens, icons, components, primitives and accessibility tooling. Prop-level contracts are not confirmed."),
      },
    },
    {
      id: "agent-skill",
      group: "agent-readiness",
      label: "Agent Skill / AI guidance",
      values: {
        skrewww: val("yes", "Agent Skill and Recipes (Beta)", ["skrewww-agent-kit"], "Public Beta. The Skill is served at /agent/skill/SKILL.md."),
        carbon: val("partial", "MCP prompt guidance", ["carbon-llms"], "Documents prompting and token-conservation for Carbon MCP. No public skill was found."),
        spectrum: val("yes", "React Spectrum S2 agent skill", ["spectrum-ai", "spectrum-skills-index", "spectrum-design-data-ai"], "A public skill installed with npx skills add. Spectrum Design Data ships a separate design-data skill."),
        atlassian: val("partial", "Public llms.txt, internal skill", ["atlassian-llms"], "The atlassian-design-system skill is published for Atlassian staff."),
      },
    },
    {
      id: "deterministic-validation",
      group: "agent-readiness",
      label: "Deterministic validation",
      description: "Official static checks of design-system usage.",
      values: {
        skrewww: val(
          "partial",
          `Guard Beta, ${f.guardConsumerRules} consumer rules`,
          ["skrewww-guard"],
          "Offline checks of selected contract claims. Does not replace TypeScript, linting, accessibility review or visual validation.",
        ),
        "fluent-2": val("partial", "ESLint plugin", ["fluent-eslint"], "An official ESLint plugin for Fluent UI React Components with a documented setup. Rules include prefer-fluentui-v9 and enforce-use-client."),
        atlassian: val("yes", "ESLint plugins", ["atlassian-llms", "atlassian-eslint-npm"], "Design-system and UI styling-standard rules."),
      },
    },
    {
      id: "accessibility-guidance",
      group: "accessibility-docs",
      label: "Accessibility guidance",
      description: "Each system states its own target; they are not identical.",
      values: {
        skrewww: val("yes", "Per-component notes", ["skrewww-components"], `${siteConfig.accessibilityBaseline}.`),
        carbon: val("yes", "IBM Accessibility Checklist", ["carbon-accessibility"], "Based on WCAG AA, Section 508 and European standards."),
        "fluent-2": val("yes", "WCAG 2.1 AA stated", ["fluent-accessibility"], "States that components meet or surpass WCAG 2.1 AA."),
        spectrum: val("yes", "React Aria accessibility guidance", ["react-aria-quality"], "Tested with screen readers and aligned with the ARIA Authoring Practices. It does not claim WCAG conformance."),
        atlassian: val("yes", "WCAG 2.1 AA guidance", ["atlassian-llms"], "Covers ARIA usage and keyboard navigation."),
      },
    },
    {
      id: "documentation",
      group: "accessibility-docs",
      label: "Documentation",
      values: {
        skrewww: val("yes", "Public documentation site", ["skrewww-docs"]),
        carbon: val("yes", "Public documentation site", ["carbon-docs"]),
        "fluent-2": val("yes", "Public documentation site", ["fluent-docs"]),
        spectrum: val("yes", "Public documentation site", ["spectrum-docs"]),
        atlassian: val("yes", "Public documentation site", ["atlassian-docs"]),
      },
    },
    {
      id: "open-source",
      group: "ecosystem",
      label: "Open-source availability",
      values: {
        skrewww: val("yes", f.license ? `${f.license} license` : "Open source", ["skrewww-repo"], "Applies to the repository code. Figma Pro is a paid product."),
        carbon: val("yes", "Apache-2.0 license", ["carbon-github"]),
        "fluent-2": val("yes", "MIT license", ["fluent-github"]),
        spectrum: val("yes", "Apache-2.0 license", ["spectrum-github"], "React Spectrum repository."),
        atlassian: val("yes", "Apache-2.0 license", ["atlassian-mirror", "atlassian-npm"], "Source for publicly published packages is mirrored daily to a public Bitbucket repository."),
      },
    },
    {
      id: "maturity",
      group: "ecosystem",
      label: "Maturity / ecosystem status",
      description: "A release-stage description, not a measure of capability.",
      values: {
        skrewww: val(
          "fact",
          `Beta packages; ${f.stable} of ${f.implemented} components Stable`,
          ["skrewww-agent-kit", "skrewww-npm", "skrewww-components"],
          "@skrewww/react, Agent Kit and Guard are in beta. Each component carries its own Stable or Beta status in the registry. The documentation site is at platform release 1.0.0, which is separate from package versions.",
        ),
      },
    },
  ];
}

export type BuildNote = { title: string; body: string; href: string; cta: string };

/** "How Skrewww is built" cards. Descriptive of Skrewww's own architecture; no claims about other systems. */
export function getBuildNotes(): BuildNote[] {
  const f = getSkrewwwFacts();
  return [
    {
      title: "Figma and React, paired",
      body: `Skrewww ships Figma libraries and a React implementation. A parity audit has been completed on ${numberWord(f.pilotCount)} pilot components; full parity is not claimed.`,
      href: "/components",
      cta: "Explore components",
    },
    {
      title: "Selectable Shape modes",
      body: `${capitalize(numberWord(f.shapeModes.length))} modes (${f.shapeModes.join(", ")}) are set once on an ancestor. Per-component support is documented rather than assumed.`,
      href: "/foundations",
      cta: "Read foundations",
    },
    {
      title: "Selectable Surface modes",
      body: `${capitalize(numberWord(f.surfaceModes.length))} modes (${f.surfaceModes.join(", ")}) are ambient context. Some components have a fixed surface by design and are documented that way.`,
      href: "/foundations",
      cta: "Read foundations",
    },
    {
      title: "shadcn-compatible distribution",
      body: "A supported subset of components installs with the shadcn CLI, and the @skrewww registry is indexed in the shadcn registry directory. Separately, Skrewww is listed in the community-curated Awesome shadcn/ui directory, which is not a shadcn endorsement.",
      href: "/agent-kit#distribution",
      cta: "See distribution",
    },
    {
      title: "Agent-readable contracts",
      body: "Components publish machine-readable contracts, so coding agents can read the declared API instead of relying on memory.",
      href: "/agent-kit",
      cta: "Read Agent Kit docs",
    },
    {
      title: "AI workflow orientation",
      body: "A public Skill and Recipes sit on top of the contracts to guide how components are chosen and composed. Agent Kit is in Beta.",
      href: "/agent-kit",
      cta: "Read Agent Kit docs",
    },
    {
      title: "Guard verification",
      body: `Guard is an offline CLI in Beta with ${numberWord(f.guardConsumerRules)} consumer rules that check selected contract claims. It does not replace TypeScript, linting, accessibility review or visual validation.`,
      href: "/guard",
      cta: "Read about Guard",
    },
  ];
}

/** Neutral value used wherever no verified value is recorded. */
export const UNVERIFIED_VALUE: ComparisonValue = { status: "unverified", label: "Not yet verified" };

export function getComparisonValue(
  category: ComparisonCategory,
  systemId: ComparisonSystemId,
): ComparisonValue {
  return category.values[systemId] ?? UNVERIFIED_VALUE;
}

/** Text equivalent of each status, used for visible labels and accessible names. */
export const STATUS_LABEL: Record<ComparisonStatus, string> = {
  yes: "Yes",
  partial: "Partial",
  no: "No",
  na: "N/A",
  fact: "Info",
  unverified: "Not yet verified",
};

/** "2026-10-17" -> "Oct 17, 2026". Fixed locale and timezone so server and tests agree. */
export function formatVerifiedDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
