/**
 * Figma identity — which exact Figma entity a Skrewww component corresponds
 * to (AG-1A, docs/architecture/agent-readiness.md §7/§18).
 *
 * IDENTITY, NOT PARITY. A record here answers "which Figma file and node is
 * the canonical design entity for this slug?" It never answers "does Figma
 * match React?" — parity is an audit result and must not be stored as
 * registry metadata.
 *
 * A node ID alone is not an identity: the Free file was forked from Pro and
 * shares node IDs for shared components, so an identity is always the
 * (fileKey, nodeId) pair. Records are only added from live-Figma evidence
 * (MCP/plugin read), never from name matching.
 *
 * `slug` stays the primary component key; this module keys records by slug
 * and the registry entry carries the record as `figmaIdentity`.
 */

import { CHART_CARD_FIGMA_COMPONENT_NODE_ID } from "@/lib/charts-figma-metadata";

/** Figma node types an identity may point at (Figma Plugin API vocabulary). */
export const FIGMA_IDENTITY_NODE_TYPES = ["COMPONENT_SET", "COMPONENT", "FRAME"] as const;
export type FigmaIdentityNodeType = (typeof FIGMA_IDENTITY_NODE_TYPES)[number];

/**
 * What the Figma entity is, for this slug:
 * - `master` — the reusable component master (component set or standalone component).
 * - `static-reference` — a plain frame that is only a visual reference (e.g. chart examples).
 * - `composition-only` — the component exists in Figma only as a composition of other masters.
 */
export const FIGMA_IDENTITY_ROLES = ["master", "static-reference", "composition-only"] as const;
export type FigmaIdentityRole = (typeof FIGMA_IDENTITY_ROLES)[number];

export type FigmaIdentity = {
  /** Figma file key (not a URL). */
  fileKey: string;
  /** Node ID in `<number>:<number>` form, unique only within `fileKey`. */
  nodeId: string;
  nodeType: FigmaIdentityNodeType;
  role: FigmaIdentityRole;
  /** ISO date (YYYY-MM-DD) the pair was confirmed against the live file. */
  verifiedAt: string;
};

/** Skrewww Pro — the canonical design reference file. */
export const SKREWWW_PRO_FIGMA_FILE_KEY = "U6KUuNf7DF4CP9QBOkLSUx";

/**
 * AG-1A pilot identities, verified 2026-09-29 against the live Pro file via
 * the Figma plugin API (read-only). For each: exactly one local master with
 * that name in the file, sitting in its own canonical SECTION (not a
 * presentation frame), with live instances. The registry's older
 * `figmaReference` prose is left unchanged — where it disagrees (Dialog), that
 * is an audit finding, not something this identity map resolves.
 */
export const PILOT_FIGMA_IDENTITIES = {
  /** "Actions/Button" — 45 variants (Style × Size × State). */
  button: {
    fileKey: SKREWWW_PRO_FIGMA_FILE_KEY,
    nodeId: "2012:7752",
    nodeType: "COMPONENT_SET",
    role: "master",
    verifiedAt: "2026-09-29",
  },
  /** "Forms/Text Input" — 15 variants (State × Size). */
  "text-input": {
    fileKey: SKREWWW_PRO_FIGMA_FILE_KEY,
    nodeId: "2022:1151",
    nodeType: "COMPONENT_SET",
    role: "master",
    verifiedAt: "2026-09-29",
  },
  /** "Feedback/Alert" — 4 variants (Type). */
  alert: {
    fileKey: SKREWWW_PRO_FIGMA_FILE_KEY,
    nodeId: "2034:25402",
    nodeType: "COMPONENT_SET",
    role: "master",
    verifiedAt: "2026-09-29",
  },
  /** "Containers/Dialog" — a single standalone component master (no variants). */
  dialog: {
    fileKey: SKREWWW_PRO_FIGMA_FILE_KEY,
    nodeId: "2044:25869",
    nodeType: "COMPONENT",
    role: "master",
    verifiedAt: "2026-09-29",
  },
  /** "Containers/Chart Card" — standalone component master (Beta). Same node as the existing chart metadata constant. */
  "chart-card": {
    fileKey: SKREWWW_PRO_FIGMA_FILE_KEY,
    nodeId: CHART_CARD_FIGMA_COMPONENT_NODE_ID,
    nodeType: "COMPONENT",
    role: "master",
    verifiedAt: "2026-09-29",
  },
} as const satisfies Record<string, FigmaIdentity>;

const FILE_KEY_PATTERN = /^[A-Za-z0-9]{10,64}$/;
const NODE_ID_PATTERN = /^\d+:\d+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const NODE_TYPES_BY_ROLE: Record<FigmaIdentityRole, readonly FigmaIdentityNodeType[]> = {
  master: ["COMPONENT_SET", "COMPONENT"],
  "static-reference": ["FRAME"],
  "composition-only": ["FRAME"],
};

/** The unique key of an identity: file key + node ID. */
export function figmaIdentityKey(identity: Pick<FigmaIdentity, "fileKey" | "nodeId">): string {
  return `${identity.fileKey}/${identity.nodeId}`;
}

/**
 * Returns human-readable problems with an identity record; empty when valid.
 * Deterministic and offline — checks the checked-in record, never live Figma.
 */
export function validateFigmaIdentity(identity: FigmaIdentity): string[] {
  const problems: string[] = [];
  if (!FILE_KEY_PATTERN.test(identity.fileKey)) problems.push(`fileKey "${identity.fileKey}" is not a Figma file key`);
  if (!NODE_ID_PATTERN.test(identity.nodeId)) problems.push(`nodeId "${identity.nodeId}" is not in "<number>:<number>" form`);
  if (!FIGMA_IDENTITY_NODE_TYPES.includes(identity.nodeType)) problems.push(`nodeType "${identity.nodeType}" is not allowed`);
  if (!FIGMA_IDENTITY_ROLES.includes(identity.role)) {
    problems.push(`role "${identity.role}" is not allowed`);
  } else if (!NODE_TYPES_BY_ROLE[identity.role].includes(identity.nodeType)) {
    problems.push(`role "${identity.role}" cannot point at a ${identity.nodeType}`);
  }
  if (!ISO_DATE_PATTERN.test(identity.verifiedAt) || Number.isNaN(Date.parse(identity.verifiedAt))) {
    problems.push(`verifiedAt "${identity.verifiedAt}" is not an ISO date`);
  }
  return problems;
}
