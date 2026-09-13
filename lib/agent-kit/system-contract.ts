import { CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION, AGENT_CONTRACT_GENERATOR_VERSION } from "@/lib/agent-kit/contract-schema";
import type { SystemAgentContract } from "@/lib/agent-kit/contract-schema";

/**
 * The one hand-authored Agent Kit policy artifact (AK-0 §"AUTHORED" class).
 * Everything else in lib/agent-kit is compiled from existing canonical
 * sources — this file exists because these rules cannot be derived from
 * any single registry field. Keep it compact and system-level; it must
 * never restate a per-component fact that belongs in a compiled contract.
 */
export const systemAgentContract: SystemAgentContract = {
  schemaVersion: CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,

  principles: [
    "Compile facts. Author judgment. Validate outcomes.",
    "The canonical registry (lib/component-registry*.ts) and authored docs (content/*.ts) are the source of truth. This contract set is a compiled projection of them, never a replacement.",
    "When registry/docs and model memory disagree, registry/docs win.",
    "A sparse or absent field means 'not modeled / not verified' — never infer a plausible answer to fill it.",
  ],

  neverInvent: [
    "Do not invent a Skrewww component, prop, or variant that is not present in the current component contract's api.properties/variants/sizes.",
    "Do not invent component states, Slots, or composition structures — this schema does not model them yet.",
    "Do not treat a Figma variant name as an automatic public React prop; only api.properties reflects the real React API.",
    "Only names in api.properties may be used as React props. api.variants/api.sizes are value or scenario metadata — never invent a variant prop from them unless variant itself appears in api.properties.",
    "Do not claim a Figma reference is verified when figma.verified is false.",
    "Do not recreate a canonical component with a raw element (e.g. a styled div instead of Dialog) merely because its real API seems inconvenient.",
    "Do not use a raw hex/brand color where a semantic token exists in tokens.used.",
  ],

  tokenPolicy: [
    "tokens.used on every contract is registry-derived only — it is never merged with, unioned with, or overridden by any editorial/docs token list.",
    "A token appearing in tokens.used is confirmed consumed by the component's real implementation, traced to source at reconciliation time — not aspirational or inferred.",
    "Prefer an existing semantic token over a primitive/raw one when both would work for the same purpose.",
  ],

  shapePolicy: [
    "Shape (Sharp/Rounded/Pill/Squircle) is a document-wide or parent-context mode for most components, not a per-component property — check the component's own contract/docs before assuming Shape applies to it at all.",
    "A component consuming a fixed corner-radius token is not automatically 'Shape-capable' — only treat Shape as supported when the component's docs/contract says so explicitly.",
  ],

  surfacePolicy: [
    "Surface (Flat/Gradient/Glass) is ambient/parent context for most components, not a per-component property.",
    "Do not assume a component supports Glass, Gradient, or any Surface mode from visual appearance alone — several components are explicitly Surface N/A (fixed fill, no blur) and must not be presented as mode-switching.",
  ],

  accessibilityBaseline: [
    "Every interactive component must have an accessible name and visible focus state; contracts that omit specific keyboard/focus/dismissal behavior (sparse fields) do not mean the component has none — verify against real behavior before asserting it in generated UI copy.",
    "Never rely on color alone to convey state (error, disabled, selected).",
    "Prefer real semantic HTML/ARIA roles the component already provides over reimplementing behavior.",
  ],

  namingRules: [
    "Use the component's registry `slug` and `name` exactly as given — do not pluralize, abbreviate, or rename.",
    "A docs-only ComponentDoc with no matching registry entry (react availability: unavailable) is not an installable React component — never present it as one.",
  ],

  provenance: {
    schemaVersion: CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION,
    generatorVersion: AGENT_CONTRACT_GENERATOR_VERSION,
  },
};
