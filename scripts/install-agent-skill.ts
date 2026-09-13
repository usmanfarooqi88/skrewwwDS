/**
 * Installs the canonical Skrewww UI Skill (agent/skill/SKILL.md) as a
 * byte-identical Claude Code adapter under .claude/skills/skrewww-ui/.
 *
 * This is intentionally the only logic here: read the one canonical file,
 * write it verbatim to the adapter path. No independent adapter content is
 * authored anywhere — see docs/architecture/agent-kit.md. The output is
 * not committed (.claude/ is gitignored repo-wide); rerun this script
 * after editing agent/skill/SKILL.md.
 *
 * Run via `npm run install:agent-skill`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CLAUDE_ADAPTER_SKILL_PATH, readCanonicalSkill } from "../lib/agent-kit/skill-adapter";

const content = readCanonicalSkill();
const targetPath = join(process.cwd(), CLAUDE_ADAPTER_SKILL_PATH);

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, content);

console.log("Installed Claude adapter Skill (byte-identical to agent/skill/SKILL.md):");
console.log(" -", targetPath);
