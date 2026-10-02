/**
 * Public changelog — the canonical source of what ships to
 * /changelog. This is user-facing release communication, not an
 * internal audit trail. Do not put Figma node IDs, commit hashes,
 * file paths, internal test/batch names, or raw token/hex values in
 * here — see docs/project-status.md for that internal detail.
 *
 * To add a new release, add a new entry to the top of
 * `changelogEntries` below. Nothing else needs to change — the page
 * reads this file directly and sorts by `date`.
 */

export type ChangelogItemType = "new" | "improved" | "fixed";

export type ChangelogItem = {
  type: ChangelogItemType;
  text: string;
};

export type ChangelogEntry = {
  /** Stable, unique identifier — safe to reference externally (e.g. for social copy). */
  id: string;
  /**
   * Internal ISO date (YYYY-MM-DD), used only to sort entries
   * deterministically. Not necessarily rendered verbatim — see
   * `displayDate` for what's shown publicly.
   */
  date: string;
  /** Public-facing date label, e.g. "August 2026". */
  displayDate: string;
  title: string;
  summary?: string;
  items: ChangelogItem[];
};

export const changelogEntries: ChangelogEntry[] = [
  {
    id: "2026-10-figma-spacing-release",
    date: "2026-10-03",
    displayDate: "October 2026",
    title: "Figma spacing release (Pro and Free)",
    summary:
      "The Pro and Free Figma libraries are updated with a consistent spacing foundation: a 4px base grid with an 8px-preferred macro rhythm. The Free Community file and the Skrewww Pro product are updated too. These are Figma changes and are separate from the @skrewww/react package release.",
    items: [
      {
        type: "improved",
        text: "Small Button, Text Input and Select now use an explicit 32px height in both Pro and Free; Small Search Field matches in Pro.",
      },
      {
        type: "improved",
        text: "Button Small and Link icon gaps are aligned with the canonical component rhythm in both Pro and Free.",
      },
      {
        type: "fixed",
        text: "Tabs: the active indicator no longer changes a tab's height when it is selected, in both Pro and Free.",
      },
      {
        type: "improved",
        text: "Pro: Split Button Small segments now align at 32px, and the Validation Message icon-to-text gap is refined.",
      },
      {
        type: "new",
        text: "Pro: Combobox now comes in Small, Medium and Large sizes.",
      },
    ],
  },
  {
    id: "2026-10-react-beta-2",
    date: "2026-10-03",
    displayDate: "October 2026",
    title: "@skrewww/react 0.1.0-beta.2",
    summary:
      "Second public beta of the framework-agnostic React package. Install with @skrewww/react@beta, or pin 0.1.0-beta.2. A bare npm install of the package still resolves to the first beta, so prefer the beta tag or an exact version. No public API change and no new dependency.",
    items: [
      {
        type: "fixed",
        text: "Validation Message icon-to-text spacing now follows the 4px micro rhythm.",
      },
      {
        type: "fixed",
        text: "Form Field spacing between the label, the control and the supporting or error text now follows the 8px structural rhythm.",
      },
    ],
  },
  {
    id: "2026-09-shadcn-directory-listing",
    date: "2026-09-30",
    displayDate: "September 2026",
    title: "Listed in the shadcn community registry directory",
    summary:
      "Skrewww is listed in the official shadcn community registry directory, so the shadcn CLI resolves the @skrewww namespace without any components.json setup.",
    items: [
      {
        type: "new",
        text: "Install directly with npx shadcn@latest add @skrewww/button — Foundation installs automatically, and no registry entry needs to be added first.",
      },
      {
        type: "new",
        text: "Browse every installable Skrewww item from the CLI with npx shadcn@latest search @skrewww.",
      },
    ],
  },
  {
    id: "2026-09-figma-stabilization",
    date: "2026-09-28",
    displayDate: "September 2026",
    title: "Free/Pro Figma parity and Dark-mode contrast",
    summary:
      "The Free Figma library now matches Pro's presentation quality and shared component behavior, and Alert's Dark-mode colors now meet accessible contrast. Figma component counts stay separate from the open-source React library (23 Free / 52 Pro components in Figma).",
    items: [
      {
        type: "improved",
        text: "Free Figma component pages now use the same presentation structure and quality as Pro across all 23 components.",
      },
      {
        type: "improved",
        text: "Gradient surface treatment is now consistent across shared Free and Pro components.",
      },
      {
        type: "improved",
        text: "Alert Dark-mode colors reworked for accessible contrast on title, description, and status icon, across Info, Success, Warning, and Error.",
      },
      {
        type: "fixed",
        text: "Button's focused-state outline, restored in the Free file.",
      },
      {
        type: "fixed",
        text: "A pagination item's default-state text was hard to read; corrected.",
      },
      {
        type: "fixed",
        text: "Alert and Toast corner radius now behaves consistently across Shape modes.",
      },
      {
        type: "fixed",
        text: "Outdated token references in a few component descriptions, corrected to match current behavior.",
      },
    ],
  },
  {
    id: "2026-09-guard-beta",
    date: "2026-09-17",
    displayDate: "September 2026",
    title: "Skrewww Guard (Beta)",
    summary:
      "Public Beta of an offline local CLI that validates selected Skrewww canonical-contract claims. Install with @skrewww/guard@beta. Guard is Beta — not a TypeScript, accessibility, Figma, or visual checker. Details on the Guard page.",
    items: [
      {
        type: "new",
        text: "Public package @skrewww/guard with the skrewww-guard CLI — offline, local, zero-config validation after install.",
      },
      {
        type: "new",
        text: "Three public consumer rules: nonexistent component slug, false Stable maturity claims, and false installable-via-registry claims.",
      },
      {
        type: "new",
        text: "Provenance-aware checks via @skrewww-component origin markers from Skrewww registry installs (unmarked local files stay unknown — no false errors).",
      },
      {
        type: "improved",
        text: "Docs surface at /guard with install, rule list, limitations, and links to npm and the GitHub release.",
      },
    ],
  },
  {
    id: "2026-09-open-source-launch",
    date: "2026-09-13",
    displayDate: "September 2026",
    title: "Skrewww is now open source",
    summary:
      "The Skrewww codebase is now open source under the MIT license, with a public contribution workflow. Agent Kit remains available in Beta. Skrewww Pro (the paid Figma library and Gumroad deliverables) and Skrewww Free (the Community Figma file) remain separate from this repository.",
    items: [
      {
        type: "new",
        text: "Repository source is public under the MIT license — components, tokens, docs platform, tests, registry infrastructure, and Agent Kit.",
      },
      {
        type: "new",
        text: "Public contribution workflow: issue templates for bugs, component issues, Agent Kit issues, documentation issues, and feature requests, plus a pull request template.",
      },
      {
        type: "improved",
        text: "Agent Kit's public Feedback section now points to the live issue tracker instead of an informal contact route.",
      },
    ],
  },
  {
    id: "2026-09-agent-kit-beta",
    date: "2026-09-13",
    displayDate: "September 2026",
    title: "Skrewww Agent Kit (Beta)",
    summary:
      "Public Beta: helps AI coding agents understand and use Skrewww from current machine-readable contracts instead of relying on model memory. Agent Kit's own release stage is Beta — independent of individual component maturity. Known limitations are listed on the Agent Kit page.",
    items: [
      {
        type: "new",
        text: "Machine-readable component contracts (API, tokens, usage guidance, accessibility) for every implemented component.",
      },
      {
        type: "new",
        text: "A canonical Agent Skill teaching coding agents to check a real contract before using a Skrewww component, instead of relying on memorized APIs.",
      },
      {
        type: "new",
        text: "Project context detection — a conservative, evidence-only read of what a consumer project actually has configured.",
      },
      {
        type: "new",
        text: "Recipes and one Feature Kit for common multi-component patterns.",
      },
      {
        type: "new",
        text: "Public retrieval for all of the above, plus a documented relationship to the existing @skrewww shadcn registry.",
      },
      {
        type: "improved",
        text: "In a 14-case internal Beta evaluation, Agent Kit reduced hard design-system errors from 35 to 1 under the tested setup.",
      },
    ],
  },
  {
    id: "2026-08-analytics-consent",
    date: "2026-08-29",
    displayDate: "August 2026",
    title: "Analytics preferences",
    items: [
      {
        type: "new",
        text: "Added analytics preferences so visitors can choose whether Google Analytics measurement is enabled.",
      },
      {
        type: "improved",
        text: "Analytics preferences can be reopened at any time using the Analytics preferences control to change your choice.",
      },
    ],
  },
  {
    id: "2026-08-skrewww-1-0",
    date: "2026-08-21",
    displayDate: "August 2026",
    title: "Skrewww 1.0",
    summary:
      "Skrewww Design System 1.0 — platform and documentation release. Individual React components retain their own Beta or Stable maturity and are promoted independently from the platform release.",
    items: [
      {
        type: "new",
        text: "Skrewww Design System 1.0 platform release.",
      },
      {
        type: "new",
        text: "Verified shadcn registry distribution for the supported install surface.",
      },
      {
        type: "new",
        text: "Production-ready foundation, token, and accessibility contracts for the platform release.",
      },
      {
        type: "improved",
        text: "Core Figma and React parity, including interaction-state alignment.",
      },
      {
        type: "improved",
        text: "Glass Menu panel parity.",
      },
      {
        type: "improved",
        text: "Link interaction and state parity.",
      },
      {
        type: "improved",
        text: "Foundation brand interaction ramp.",
      },
      {
        type: "improved",
        text: "Registry dependency validation and clean consumer install path.",
      },
      {
        type: "fixed",
        text: "Stable-v1 component and state parity defects closed during hardening.",
      },
      {
        type: "fixed",
        text: "Foundations page-specific canonical and SEO metadata.",
      },
    ],
  },
  {
    id: "2026-08-foundation-and-distribution",
    date: "2026-08-15",
    displayDate: "August 2026",
    title: "Foundation refinements and component distribution",
    summary:
      "Closer color parity with the design source, a new Gradient surface option, several accessibility and rendering fixes, and a new way to install components directly into a project.",
    items: [
      {
        type: "new",
        text: "Added a Getting Started guide for developers working in the Skrewww repository.",
      },
      {
        type: "new",
        text: "Components can now be installed directly into a project through the shadcn CLI.",
      },
      {
        type: "new",
        text: "Introduced a Gradient surface option for supported components, alongside the existing Flat and Glass modes.",
      },
      {
        type: "improved",
        text: "Brought core text colors closer in line between the design source and the React components.",
      },
      {
        type: "improved",
        text: "Refined how several components render in Gradient and Glass modes — including containers, feedback messages, file upload, and list items — to more closely match the approved designs.",
      },
      {
        type: "improved",
        text: "Improved supporting-text readability across Accordion, Dialog, Drawer, Empty State, Popover, and Table headers.",
      },
      {
        type: "fixed",
        text: "Fixed the button focus indicator not always being visible across every surface mode.",
      },
      {
        type: "fixed",
        text: "Fixed the current-page indicator in Pagination not displaying correctly in Glass mode.",
      },
      {
        type: "fixed",
        text: "Fixed low-contrast supporting text in the File Upload empty state.",
      },
      {
        type: "fixed",
        text: "Fixed inconsistent behavior for disabled items with keyboard shortcuts in Menu.",
      },
    ],
  },
];

/** Entries sorted newest first, by internal ISO date. */
export function getSortedChangelogEntries(): ChangelogEntry[] {
  return [...changelogEntries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
