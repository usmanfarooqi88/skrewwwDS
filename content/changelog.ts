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
