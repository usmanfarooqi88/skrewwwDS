/** Figma source for Slider parity (CE-1A). */
export const SLIDER_FIGMA_FILE_URL =
  "https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2024-2373";

/** Component-set node ID — verified via Figma MCP (Forms/Slider). */
export const SLIDER_FIGMA_COMPONENT_SET_NODE_ID = "2024:2373";

/** Presentation section on Forms page. */
export const SLIDER_FIGMA_SECTION_NODE_ID = "2024:2374";

/**
 * Verified geometry (State=Default), 2026-09-13:
 * - Control height 24px; track 4px tall, always radius/full
 * - Thumb 16×16 ellipse, 2px stroke, surface fill
 * - Demo fill ~40% (80/200) — Figma has no numeric value property
 */
export const SLIDER_FIGMA_TRACK_HEIGHT_PX = 4;
export const SLIDER_FIGMA_THUMB_SIZE_PX = 16;
export const SLIDER_FIGMA_CONTROL_HEIGHT_PX = 24;
export const SLIDER_FIGMA_THUMB_STROKE_PX = 2;

/** Variant axis: State only — Default / Hover / Focused / Disabled. */
export const SLIDER_FIGMA_STATES = ["Default", "Hover", "Focused", "Disabled"] as const;

export const SLIDER_FIGMA_VARIANT_COUNT = SLIDER_FIGMA_STATES.length;

export const SLIDER_FIGMA_AUDIT_STATUS = "verified-2026-09-13" as const;
