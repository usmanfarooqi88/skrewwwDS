/**
 * Deterministic origin marker injected into registry-transported source.
 * Meaning (v0.1): "this file originated from a Skrewww registry install"
 * — NOT "byte-identical to canonical Skrewww today."
 *
 * Format (single-line block comment, machine-readable):
 *   /** @skrewww-component <slug> *\/
 */
export const SKREWWW_COMPONENT_MARKER_PREFIX = "@skrewww-component";

const MARKER_RE = /\/\*\*\s*@skrewww-component\s+([a-z0-9-]+)\s*\*\//;

export function formatSkrewwwComponentMarker(slug: string): string {
  return `/** @skrewww-component ${slug} */`;
}

/** Prepend marker to transported TS/TSX content if not already present. */
export function withSkrewwwComponentMarker(content: string, slug: string): string {
  if (MARKER_RE.test(content)) return content;
  return `${formatSkrewwwComponentMarker(slug)}\n${content}`;
}

export function extractSkrewwwComponentMarker(content: string): string | undefined {
  const match = MARKER_RE.exec(content);
  return match?.[1];
}

export function isTypeScriptSourcePath(relPath: string): boolean {
  return relPath.endsWith(".tsx") || relPath.endsWith(".ts");
}
