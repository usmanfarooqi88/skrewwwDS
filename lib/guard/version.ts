/**
 * Skrewww Guard tool version — standalone constant, zero schema coupling,
 * matching `lib/agent-kit/beta-version.ts` and docs/architecture/
 * guard-readiness-audit.md §16 (one version dimension for v0.1).
 *
 * Documentation-surface metadata for the public Guard page, changelog,
 * package identity, and CLI --version / --help.
 */
export const GUARD_TOOL_VERSION = "0.1.0-beta.1";
export const GUARD_RELEASE_STAGE = "beta" as const;
