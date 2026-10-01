/**
 * The only authored (not compiled) text in the Make guideline generator.
 * Everything else is derived from canonical sources. Each statement names the
 * canonical document it restates, and `compiler.test.ts` checks that those
 * documents still exist and still contain the anchor phrase, so this text
 * cannot silently drift into a second source of truth.
 */
export type PolicyStatement = { text: string; source: string; anchor: string };

export const SOURCE_PRECEDENCE: PolicyStatement[] = [
  {
    text: "Which components exist, their maturity status and whether they have a React implementation: the canonical component registry.",
    source: "docs/architecture/source-of-truth.md",
    anchor: "canonical list of components",
  },
  {
    text: "Runtime API and semantics: the React implementation. Only props listed in a component's API table are declared props, and npm imports come from the package entry recorded in manifest.json.",
    source: "docs/architecture/react-package.md",
    anchor: "canonical source",
  },
  {
    text: "Token runtime values: the design-token stylesheet shipped in the package.",
    source: "docs/architecture/source-of-truth.md",
    anchor: "React runtime value",
  },
  {
    text: "Visual and component behavior: Figma, only where a verified Figma reference exists. A recorded Figma reference means a node is identified, not that React and Figma are in parity.",
    source: "docs/architecture/source-of-truth.md",
    anchor: "Figma MCP inspection",
  },
  {
    text: "This guideline set is a compiled projection of the sources above. It is not an authority and never overrides them; when it disagrees with them, they win.",
    source: "docs/architecture/make-kit-guidelines.md",
    anchor: "not a source of truth",
  },
];

export const FIGMA_BOUNDARY: PolicyStatement[] = [
  {
    text: "Figma references in these guidelines are optional reference metadata only.",
    source: "docs/architecture/make-kit-guidelines.md",
    anchor: "Figma boundary",
  },
  {
    text: "Captured Figma snapshots are not included in these guidelines and are not authority.",
    source: "docs/architecture/agent-readiness.md",
    anchor: "snapshot",
  },
  {
    text: "Live Figma access is not required to use these guidelines.",
    source: "docs/architecture/make-kit-guidelines.md",
    anchor: "Figma boundary",
  },
  {
    text: "React owns runtime API and semantics. Figma owns visual and component behavior where verified. Do not claim a visual capability the attached Figma library cannot represent.",
    source: "docs/architecture/source-of-truth.md",
    anchor: "Figma status",
  },
];

export const STATUS_RULES: PolicyStatement[] = [
  {
    text: "Component status is copied from the canonical registry (`stable` or `beta`) and is never changed by these guidelines.",
    source: "docs/architecture/source-of-truth.md",
    anchor: "canonical list of components",
  },
  {
    text: "A Beta component may change props, visuals or keyboard behavior until it is promoted. Do not present a Beta component as Stable, and do not promote it.",
    source: "docs/architecture/versioning.md",
    anchor: "May change props, visuals, or keyboard behavior",
  },
];
