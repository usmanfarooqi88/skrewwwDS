/**
 * Skrewww Agent Kit's own product/release version — distinct from, and
 * never collapsed into, the three other version concepts already in
 * play (see docs/architecture/agent-kit.md's "AK-6" section):
 *
 * - a component's own `version` (lib/component-registry*.ts) — that
 *   component's maturity/implementation version.
 * - `CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION` (contract-schema.ts) —
 *   versions the shape of a compiled Agent Kit contract.
 * - `AGENT_CONTRACT_GENERATOR_VERSION` (contract-schema.ts) — versions
 *   the compiler's own generation logic.
 *
 * This constant is deliberately NOT part of any compiled contract/
 * system/recipe JSON — adding it there would mean touching
 * contract-schema.ts, the file AK-6 is explicitly instructed to leave
 * behaviorally untouched to protect AK-5's evaluation evidence. It is
 * documentation-surface metadata only (the public Agent Kit page,
 * changelog, project status).
 */
export const AGENT_KIT_PRODUCT_VERSION = "0.1.0-beta.1";
export const AGENT_KIT_RELEASE_STAGE = "beta" as const;
