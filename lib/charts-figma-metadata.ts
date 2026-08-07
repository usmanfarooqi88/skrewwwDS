/**
 * Intentionally unimported by TypeScript: most of these constants exist
 * only as the canonical, version-controlled record of a confirmed Figma
 * fact — cited by name in prose (docs/architecture/*.md,
 * docs/project-status.md), not consumed by any import. A dead-code tool
 * (e.g. knip) will flag several as "unused exports"; that's expected and
 * correct for its own definition of "used," not a reason to delete them.
 * Deleting one removes the single source of truth it records, leaving
 * only prose with nothing to keep it honest.
 */

/**
 * Figma metadata for Bar Chart / Line Chart — node IDs confirmed via direct
 * Figma inspection on 2026-07-18. Both examples are illustrative/minimal,
 * not full chart specs: Figma establishes visual style (color, stroke
 * weight, marker style) but says nothing about axes beyond the bar chart's
 * month labels, legends, or multi-series — anything beyond what's recorded
 * here is this implementation's own decision, not a Figma-derived fact.
 */
export const CHARTS_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-2568";

/** Parent page section "Content/Charts", confirmed 2026-07-18. */
export const CHARTS_FIGMA_SECTION_NODE_ID = "2058:2568";

/**
 * "Bar Chart (example)" frame, confirmed 2026-07-18: 6 bars (Jan-Jun),
 * single semantic/action/primary fill, real proportional heights (58/95/
 * 76/128/108/140 out of a 160px-tall plot area), X-axis month labels in
 * semantic/text/secondary. No Y-axis, gridlines, legend, or tooltip.
 */
export const BAR_CHART_FIGMA_EXAMPLE_NODE_ID = "2058:2532";

/**
 * "Line Chart (example)" frame, confirmed 2026-07-18: single 2px
 * semantic/action/primary stroke, 7 data points as 6px hollow-ring markers
 * (fill: semantic/surface/default, stroke: semantic/action/primary, 2px).
 * No axis labels at all, no gridlines, no legend.
 */
export const LINE_CHART_FIGMA_EXAMPLE_NODE_ID = "2058:2559";

export const CHARTS_FIGMA_AUDIT_STATUS = "verified-2026-07-18" as const;
