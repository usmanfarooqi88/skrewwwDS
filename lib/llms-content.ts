import { getImplementedRegistryEntries, getRegistryEntry } from "@/lib/component-registry";
import { getIndexableComponentSlugs } from "@/lib/indexing-policy";
import { categoryPageContent, getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { industries, getIndustryPageHref, INDUSTRIES_INDEX_HREF } from "@/lib/industry-content";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getComponentHref } from "@/lib/routes";

/**
 * Components whose Forms-architecture role is worth restating in the
 * compact llms.txt beyond the plain implemented-components list — each
 * line is derived from the registry's own (self-contained) summary, so
 * it can't drift from what every other section already says.
 */
const FORMS_ARCHITECTURE_HIGHLIGHT_SLUGS = [
  "form-field",
  "search-field",
  "combobox",
  "file-upload",
  "table",
  "data-table",
  "select",
] as const;

function buildFormsArchitectureLines(): string[] {
  const highlights = FORMS_ARCHITECTURE_HIGHLIGHT_SLUGS.flatMap((slug) => {
    const entry = getRegistryEntry(slug);
    return entry ? [`- ${entry.name}: ${entry.documentationUrl} — ${entry.summary}`] : [];
  });

  return [
    // Cross-cutting architectural rules with no single registry entry to
    // derive from — genuinely hand-authored policy, not per-component data.
    "- Controls use native HTML semantics (input, textarea, select, checkbox, radio, switch).",
    "- ValidationMessage's inline feedback is linked to its field via aria-describedby — an accessibility-wiring detail not tracked as a discrete registry field.",
    ...highlights,
  ];
}

/**
 * Components whose real openQuestions are worth surfacing in the compact
 * llms.txt (not just the full llms-full.txt detail blocks). Derived live
 * from the registry so it can't silently drift from the same facts
 * documented everywhere else.
 */
const LIMITATIONS_HIGHLIGHT_SLUGS = ["file-upload", "table", "data-table", "combobox"] as const;

function buildLimitationsLines(): string[] {
  const derived = LIMITATIONS_HIGHLIGHT_SLUGS.flatMap((slug) => {
    const entry = getRegistryEntry(slug);
    if (!entry) return [];
    return entry.openQuestions.map((question) => `- ${entry.name}: ${question}`);
  });

  return [
    ...derived,
    // Select's non-searchability is a contrast with the nearby searchable
    // Combobox, not a tracked openQuestion of Select's own — kept hand-written.
    "- Select uses a Popover listbox with a hidden native select for form submission — not searchable (see Combobox for the searchable equivalent).",
    // Cross-cutting facts with no single registry entry to derive from —
    // genuinely hand-authored, not per-component data.
    "- Multi-select Combobox and advanced overlays remain documented but not implemented.",
    "- Control-only composition exports are internal implementation details and are not public registry components.",
  ];
}

export function buildLlmsTxt(): string {
  const implemented = getImplementedRegistryEntries().filter(
    (entry) => entry.indexing === "index",
  );

  const lines = [
    `# ${siteConfig.name}`,
    "",
    "> Machine-readable overview for search engines and AI answer systems.",
    "",
    "## What Skrewww is",
    siteConfig.description,
    "",
    "## Who it is for",
    "Designers, frontend engineers, design-system maintainers, and coding agents building product UI with token-driven components.",
    "",
    "## Four-layer architecture",
    "1. Foundation — tokens, color, type, spacing, radius, elevation, motion, icons, accessibility.",
    "2. Component Library — Actions, Forms, Navigation, Feedback, Containers & Overlays, Content & Data.",
    "3. Style Systems — Shape and Surface personalities applied through tokens, not forks.",
    `4. Industry Systems — ${industries.join("/")} pilot shipped (${implemented.filter((entry) => entry.industry).length} components); additional industries planned via the CLI preset model, composing Layer 2 rather than forking it.`,
    "",
    "## Current status",
    `- Design system version: ${siteConfig.designSystemVersion}`,
    `- Implemented React components: ${implemented.length} (Beta)`,
    `- Accessibility baseline: ${siteConfig.accessibilityBaseline}`,
    `- Last updated: ${siteConfig.lastUpdated}`,
    "",
    "## Canonical documentation",
    `- Homepage: ${absoluteUrl("/")}`,
    `- Components index: ${absoluteUrl("/components")}`,
    `- Foundations: ${absoluteUrl("/foundations")}`,
    `- Component registry JSON: ${absoluteUrl("/registry.json")}`,
    `- Expanded machine index: ${absoluteUrl("/llms-full.txt")}`,
    "",
    "## Agent Kit (Beta) — for AI coding agents",
    `- Overview and Getting Started: ${absoluteUrl("/agent-kit")}`,
    `- Component contract index (allow-list): ${absoluteUrl("/agent/index.json")}`,
    `- Compiled system policy: ${absoluteUrl("/agent/system.json")}`,
    `- One contract per component: ${absoluteUrl("/agent/contracts/<slug>.json")}`,
    `- Recipe index: ${absoluteUrl("/agent/recipes/index.json")}`,
    `- Canonical Agent Skill (plain Markdown): ${absoluteUrl("/agent/skill/SKILL.md")}`,
    "- Read the relevant contract before using a Skrewww component in generated code — do not rely on memorized APIs. No custom Skrewww MCP server exists; shadcn's own MCP tooling works against the @skrewww registry.",
    "",
    "## Guard (Beta) — offline local validation",
    `- Overview and install: ${absoluteUrl("/guard")}`,
    "- npm: @skrewww/guard@beta (bin: skrewww-guard)",
    "- Public consumer rules (exactly 3): component/nonexistent-slug, maturity/false-stable-claim, distribution/false-installable-claim",
    "- Does not replace TypeScript, accessibility, Figma parity, Shape/Surface, or visual QA. Offline after install; no source upload.",
    "",
    "## Component categories",
    ...(Object.keys(categoryPageContent) as CategoryName[]).map(
      (category) =>
        `- ${category}: ${absoluteUrl(getCategoryPageHref(category))}`,
    ),
    "",
    "## Industries (Layer 4 — distinct from Component categories above)",
    `- Industries index: ${absoluteUrl(INDUSTRIES_INDEX_HREF)}`,
    ...industries.map(
      (industry) => `- ${industry}: ${absoluteUrl(getIndustryPageHref(industry))}`,
    ),
    "",
    "## Implemented components",
    ...implemented.map(
      (entry) =>
        `- ${entry.name} (${entry.status}): ${entry.documentationUrl} — ${entry.summary}`,
    ),
    "",
    "## Forms architecture (important)",
    ...buildFormsArchitectureLines(),
    "",
    "## Figma and React relationship",
    "Figma documents component intent, variants, and tokens. React implementations track Figma where confirmed and document open questions when parity is incomplete. Beta status means production use is possible but APIs and visuals may change.",
    "",
    "## Documented components (indexable)",
    ...getIndexableComponentSlugs()
      .filter((slug) => !implemented.some((entry) => entry.slug === slug))
      .map((slug) => `- ${slug}: ${absoluteUrl(getComponentHref(slug))}`),
    "",
    "## Limitations",
    ...buildLimitationsLines(),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

export function buildLlmsFullTxt(): string {
  const implemented = getImplementedRegistryEntries();
  const sections = [
    buildLlmsTxt(),
    "",
    "## Registry detail (generated)",
    "",
    ...implemented.flatMap((entry) => [
      `### ${entry.name}`,
      `- Slug: ${entry.slug}`,
      `- Category: ${entry.category}`,
      `- Status: ${entry.status}`,
      `- Version: ${entry.version}`,
      `- URL: ${entry.documentationUrl}`,
      `- React availability: ${entry.reactAvailability}`,
      `- Figma availability: ${entry.figmaAvailability}`,
      `- Accessibility: ${entry.accessibilityLevel}`,
      `- Summary: ${entry.summary}`,
      `- Variants: ${entry.supportedVariants.join(", ") || "none"}`,
      `- Sizes: ${entry.supportedSizes.join(", ") || "none"}`,
      `- Tokens: ${entry.tokensUsed.join(", ")}`,
      ...(entry.openQuestions.length
        ? [`- Open questions: ${entry.openQuestions.join(" | ")}`]
        : []),
      ...(entry.relatedComponents.length
        ? [
            "- Related:",
            ...entry.relatedComponents.map((link) => `  - ${link.label}: ${absoluteUrl(link.href)}`),
          ]
        : []),
      "",
    ]),
  ];

  return sections.join("\n");
}
