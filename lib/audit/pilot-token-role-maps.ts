import type { PilotTokenRoleMap, TokenRoleMapping } from "@/lib/audit/audit-types";

/**
 * AG-1F — explicit token-ROLE maps for Audit Agent pilots. AUDIT INTERPRETATION
 * METADATA ONLY, like `pilot-property-maps.ts`: pilot-scoped, human-verified,
 * not canonical product metadata, never compiled into Agent contracts, and
 * never itself a parity claim or a status.
 *
 * A role records that three independent sources describe the same design
 * responsibility: where Figma binds a token on the master, which registry
 * `tokensUsed` entry is meant to implement it, and which CSS custom property
 * the stylesheet reads. The comparator then OBSERVES each side and decides.
 * Nothing here says the sides agree, and no Figma-name ↔ CSS-name correspondence
 * is inferred anywhere else from string similarity.
 *
 * Each entry cites the exact sources it was verified against. A role may only
 * be added after reading those sources; an uncertain correspondence is simply
 * not added (the comparator then leaves CSS parity `unknown`).
 */

export const PILOT_TOKEN_ROLE_MAP_VERSION = "1.0.0";

const ALERT_CAPTURED_AT = "2026-09-29T10:14:52Z";

const SHAPE_ATTRIBUTE = "data-skrewww-shape";

/** Figma Shape mode ↔ `data-skrewww-shape` value. "Brand Shape" has no CSS counterpart and is deliberately absent. */
const SHAPE_MODES = [
  { figmaMode: "Rounded", attributeValue: "rounded" },
  { figmaMode: "Sharp", attributeValue: "sharp" },
  { figmaMode: "Pill", attributeValue: "pill" },
  { figmaMode: "Squircle", attributeValue: "squircle" },
];

const ROOT_ATTRIBUTE_ASSUMPTION =
  'Static resolution assumes data-skrewww-shape is set on the root element (app/layout.tsx puts it on <html>), so a `:root` alias such as --feedback-radius re-resolves under the mode selector. A descendant wrapper would not re-resolve a root-declared alias; that rendering is not evaluated.';

const ALERT_CORNER_RADIUS: TokenRoleMapping = {
  claimKey: "surface-corner-radius",
  description: "Corner radius of the Alert surface",
  figma: { path: "", properties: ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"] },
  registry: { tokens: ["component/radius/container"] },
  css: {
    customProperty: "--feedback-radius",
    modeAttribute: SHAPE_ATTRIBUTE,
    modes: SHAPE_MODES,
    cascadeAssumption: ROOT_ATTRIBUTE_ASSUMPTION,
  },
  rationale:
    "FeedbackSurface (the only surface Alert renders) sets its border-radius from --feedback-radius, and registry tokensUsed lists component/radius/container as Alert's only radius dependency (the CSS chain ends at --component-radius-container, whose tokens.css comment names component/radius/container). On the Figma master the four corner radii are the surface's corners.",
  sources: [
    "components/ui/internal/feedback-surface.module.css:7 (.feedback { border-radius: var(--feedback-radius) })",
    "components/ui/Alert.tsx (renders FeedbackSurface)",
    "styles/tokens.css:122 (--component-radius-container: 12px; /* component/radius/container */)",
    "styles/tokens.css:284 (--feedback-radius: var(--shape-radius-container))",
    "app/layout.tsx:68 (<html data-skrewww-shape=\"rounded\">)",
  ],
};

export const PILOT_TOKEN_ROLE_MAPS: Record<string, PilotTokenRoleMap> = {
  alert: {
    version: PILOT_TOKEN_ROLE_MAP_VERSION,
    componentSlug: "alert",
    verifiedAgainst: {
      figmaCapturedAt: ALERT_CAPTURED_AT,
      sources: ["agent/figma-snapshots/U6KUuNf7DF4CP9QBOkLSUx/alert.json", ...ALERT_CORNER_RADIUS.sources],
    },
    roles: [ALERT_CORNER_RADIUS],
  },
};

const CLAIM_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CUSTOM_PROPERTY = /^--[A-Za-z0-9-]+$/;

/** Schema validation for a token-role map. Returns problems; empty means valid. */
export function validateTokenRoleMap(map: PilotTokenRoleMap, slug: string): string[] {
  const problems: string[] = [];
  if (map.componentSlug !== slug) problems.push(`map is for "${map.componentSlug}", not "${slug}"`);
  if (!map.version) problems.push("version is required");
  if (!map.verifiedAgainst?.figmaCapturedAt) problems.push("verifiedAgainst.figmaCapturedAt is required");
  if (!Array.isArray(map.verifiedAgainst?.sources) || map.verifiedAgainst.sources.length === 0) problems.push("verifiedAgainst.sources is required");
  const seen = new Set<string>();
  for (const role of map.roles) {
    const label = `role "${role.claimKey}"`;
    if (!CLAIM_KEY.test(role.claimKey)) problems.push(`${label}: claimKey must be lower-kebab-case`);
    if (seen.has(role.claimKey)) problems.push(`${label}: duplicate claimKey`);
    seen.add(role.claimKey);
    if (!role.description || !role.rationale) problems.push(`${label}: description and rationale are required`);
    if (!Array.isArray(role.sources) || role.sources.length === 0) problems.push(`${label}: sources are required`);
    if (role.figma.properties.length === 0) problems.push(`${label}: figma.properties is empty`);
    if (role.registry.tokens.length === 0) problems.push(`${label}: registry.tokens is empty`);
    if (!CUSTOM_PROPERTY.test(role.css.customProperty)) problems.push(`${label}: css.customProperty "${role.css.customProperty}" is not a custom property`);
    if (!role.css.modeAttribute.startsWith("data-")) problems.push(`${label}: css.modeAttribute must be a data- attribute`);
    if (!role.css.cascadeAssumption) problems.push(`${label}: css.cascadeAssumption is required`);
    const figmaModes = new Set<string>();
    for (const mode of role.css.modes) {
      if (figmaModes.has(mode.figmaMode)) problems.push(`${label}: duplicate figmaMode "${mode.figmaMode}"`);
      figmaModes.add(mode.figmaMode);
      if (!mode.attributeValue) problems.push(`${label}: figmaMode "${mode.figmaMode}" has no attributeValue`);
    }
  }
  return problems;
}
