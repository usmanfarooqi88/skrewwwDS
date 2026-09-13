import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Path constants + a tiny read helper for the canonical Skrewww UI Skill
 * and its Claude Code adapter install target. Kept separate from
 * contract-compiler.ts because this concerns the Skill file itself, not
 * component contract compilation — see docs/architecture/agent-kit.md.
 *
 * There is exactly one canonical Skill source (CANONICAL_SKILL_PATH). The
 * Claude adapter (CLAUDE_ADAPTER_SKILL_PATH) is always a byte-identical
 * generated copy, written by scripts/install-agent-skill.ts — never a
 * second hand-maintained rulebook.
 */

export const CANONICAL_SKILL_PATH = join("agent", "skill", "SKILL.md");
export const CLAUDE_ADAPTER_SKILL_DIR = join(".claude", "skills", "skrewww-ui");
export const CLAUDE_ADAPTER_SKILL_PATH = join(CLAUDE_ADAPTER_SKILL_DIR, "SKILL.md");

export function readCanonicalSkill(root: string = process.cwd()): string {
  return readFileSync(join(root, CANONICAL_SKILL_PATH), "utf8");
}
