import { getImplementedRegistryEntries } from "@/lib/component-registry";
import { getIndexableComponentSlugs } from "@/lib/indexing-policy";
import { categoryPageContent, getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getComponentHref } from "@/lib/routes";

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
    "4. Industry Systems — future industry-specific layers inheriting from the core.",
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
    "## Component categories",
    ...(Object.keys(categoryPageContent) as CategoryName[]).map(
      (category) =>
        `- ${category}: ${absoluteUrl(getCategoryPageHref(category))}`,
    ),
    "",
    "## Implemented components",
    ...implemented.map(
      (entry) =>
        `- ${entry.name} (${entry.status}): ${entry.documentationUrl} — ${entry.summary}`,
    ),
    "",
    "## Forms architecture (important)",
    "- FormField owns label, description, required indication, and validation placement.",
    "- Controls use native HTML semantics (input, textarea, select, checkbox, radio, switch).",
    "- ValidationMessage provides typed inline feedback linked with aria-describedby.",
    "- Search Field is the canonical search-specific component: /components/search-field",
    "- Combobox is the searchable editable single-select: /components/combobox — predefined options only; local prefix/substring filtering; polite filter status announcements; not multi-select or free-form.",
    "- File Upload selects and validates files locally: /components/file-upload — native multipart submission; drag-and-drop; no network upload or progress UI in Beta.",
    "- Table is the native HTML tabular foundation: /components/table — React-first; captions, headers, footers, alignment, overflow, RTL, print-friendly scrolling; interactive cells via composition; empty/loading/error via composition; not the interactive Data Table pattern; no sorting, selection, or spreadsheet keyboard navigation.",
    "- Select is non-searchable: /components/select",
    "- Figma Form Field Wrapper maps to React FormField at /components/form-field",
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
    "- File Upload is implemented in React Beta with native file input, drag-and-drop, advisory validation, selected-file removal, and native multipart form submission.",
    "- File Upload does not perform network uploads, progress UI, retry, preview thumbnails, or controlled files in this MVP.",
    "- Live Figma verification for File Upload tokens and component-set node ID remains pending.",
    "- Table is implemented in React Beta as a React-first native HTML table foundation — captions, column/row headers, multi-level native attrs, alignment, footers, responsive overflow with Temporary edge fades, RTL logical CSS, print-friendly overflow, and composition patterns for empty/loading/error. It does not use role=\"grid\" and does not own sorting, selection, pagination, or editing. TableScrollArea tabIndex is consumer-controlled.",
    "- Data Table composes Table and is approved for a narrow MVP scope (sorting only, external Pagination composition) — not yet implemented (see /docs/architecture/data-table-discovery.md).",
    "- Multi-select Combobox and advanced overlays remain documented but not implemented.",
    "- Combobox Beta supports local filtering only — no remote/async search, no free-form custom values, no multi-select chips.",
    "- Select uses a Popover listbox with a hidden native select for form submission — not searchable.",
    "- Control-only composition exports are internal implementation details and are not public registry components.",
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
