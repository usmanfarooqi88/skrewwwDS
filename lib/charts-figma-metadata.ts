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
 * Figma chart strategy (re-verified 2026-09-26 against the live Pro file
 * U6KUuNf7DF4CP9QBOkLSUx). Figma now has two different kinds of chart support
 * and they must not be conflated:
 *
 * - REUSABLE COMPONENTS: Content/Chart Metric and Containers/Chart Card
 *   (both Beta). Registry `figmaAvailability: "available"`.
 * - STATIC VISUAL REFERENCES: Bar Chart, Line Chart and Area Chart. These are
 *   plain frames on the Content/Charts page: not components, no properties,
 *   no data binding, no runtime behavior. Registry `figmaAvailability:
 *   "partial"`. Figma is the visual reference; React owns data and behavior.
 *
 * `figma.verified` in an Agent contract only means "a real Figma node ID is
 * recorded" (Boolean(figmaNodeId)); it is not a claim of full API parity.
 *
 * Bar Chart / Line Chart node IDs were first confirmed 2026-07-18. Both
 * examples are illustrative/minimal, not full chart specs: Figma establishes
 * visual style (color, stroke weight, marker style) but says nothing about
 * axes beyond the bar chart's month labels, legends, or multi-series. The
 * Area Chart reference below records the visual decisions approved for it.
 * Anything beyond what is recorded here is this implementation's own
 * decision, not a Figma-derived fact.
 */
export const CHARTS_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2058-2568";

/** Parent page section "Content/Charts", confirmed 2026-07-18. */
export const CHARTS_FIGMA_SECTION_NODE_ID = "2058:2568";

/**
 * "Bar Chart (example)" frame — STATIC VISUAL REFERENCE, confirmed 2026-07-18,
 * re-verified 2026-09-26: 6 bars (Jan-Jun), single semantic/action/primary
 * fill, bar corner radius bound to radius/xs, real proportional heights
 * (58/95/76/128/108/140 out of a 160px-tall plot area), X-axis month labels in
 * the Caption text style, semantic/text/secondary. No Y-axis, gridlines,
 * legend, or tooltip. Not a component: no properties.
 */
export const BAR_CHART_FIGMA_EXAMPLE_NODE_ID = "2058:2532";

/**
 * "Line Chart (example)" frame — STATIC VISUAL REFERENCE, confirmed
 * 2026-07-18, re-verified 2026-09-26: single 2px semantic/action/primary
 * stroke with round cap and join, SIX 6px hollow-ring markers (fill:
 * semantic/surface/default, stroke: semantic/action/primary, 2px). The
 * earlier note of 7 data points was wrong: the live frame has 6 markers. No
 * axis labels at all, no gridlines, no legend. Not a component: no properties.
 */
export const LINE_CHART_FIGMA_EXAMPLE_NODE_ID = "2058:2559";

/** Marker (data point) count on the live Line Chart reference frame, verified 2026-09-26. */
export const LINE_CHART_FIGMA_EXAMPLE_MARKER_COUNT = 6;

/**
 * Area Chart — STATIC VISUAL REFERENCE frames added to the Content/Charts
 * page and verified 2026-09-26. Not a component, not data-bound. Figma-side
 * visual guidance approved for Area: 2px stroke, series color at 20% fill
 * opacity, category axis shown by default, value axis and grid hidden by
 * default, legend used when multiple series need identification, a four-slot
 * categorical palette that mirrors React (semantic/action/primary,
 * semantic/text/primary, color/warning/700, color/success/700; the slots carry
 * NO success/warning/status meaning), and a documentation-only tooltip
 * visual. Stacking examples: overlap, stacked, 100% stacked. Tooltip and data
 * behavior are React-only.
 */
export const AREA_CHART_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=3237-6726";

/** Primary Area Chart reference frame: single series. */
export const AREA_CHART_FIGMA_REFERENCE_NODE_ID = "3237:6726";

export const AREA_CHART_FIGMA_REFERENCE_NODE_IDS = {
  singleSeries: "3237:6726",
  multiSeriesOverlap: "3237:6743",
  stacked: "3237:6769",
  percentStacked: "3237:6795",
} as const;

/**
 * Content/Chart Metric — REUSABLE Figma component set (Beta), verified
 * 2026-09-26. Variants: Direction=Up 3236:6112, Direction=Down 3236:6122,
 * Direction=Flat 3236:6132. Properties: Direction (Up/Down/Flat), Label,
 * Value, Delta value, Comparison label, Show delta, Show comparison. Direction
 * changes the icon only; no green/red status coloring. Intentional current
 * non-parity with React: Figma label/delta use the 12px Caption style (React:
 * 13px), Figma delta is Caption Regular (React: weight 500), and Figma cannot
 * represent tabular numerals.
 */
export const CHART_METRIC_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=3236-6141";
export const CHART_METRIC_FIGMA_COMPONENT_SET_NODE_ID = "3236:6141";

/**
 * Containers/Chart Card — REUSABLE Figma component (Beta), verified
 * 2026-09-26. Composition: a nested Containers/Card whose Content holds the
 * Figma-internal Chart Card Content. Chart Card Content owns State (Ready /
 * Loading / Empty / Error), Title, Description and the Header Actions slot;
 * the nested Card supplies Elevation (Flat/Raised), Shape and Surface. The
 * previous node 3237:6424 no longer exists. Intentional current non-parity
 * with React: Figma title is Heading/S (18 Bold) vs React 16/600, and Figma
 * description is Body/S (14) vs React 13px.
 */
export const CHART_CARD_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=3239-8017";
export const CHART_CARD_FIGMA_COMPONENT_NODE_ID = "3239:8017";

/**
 * Containers/Chart Card Content — Figma-INTERNAL helper (3239:7976). It is not
 * a public component: it must never be a registry entry, an Agent contract,
 * or counted. Recorded only so it is not mistaken for the public Chart Card
 * node.
 */
export const CHART_CARD_CONTENT_FIGMA_INTERNAL_HELPER_NODE_ID = "3239:7976";

export const CHARTS_FIGMA_AUDIT_STATUS = "verified-2026-09-26" as const;
