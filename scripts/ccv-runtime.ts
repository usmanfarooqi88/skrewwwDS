/**
 * CCV-4 — representative runtime for one or both distributions.
 *
 *   npm run ccv:runtime -- npm       ccv:npm --runtime (LOCAL_TARBALL)
 *   npm run ccv:runtime -- shadcn    ccv:shadcn --runtime (LOCAL_CANONICAL, full distribution)
 *   npm run ccv:runtime -- all       both, sequentially; exit = the worst of the two
 *
 * Extra arguments after the target are passed through (e.g. `-- shadcn --item button`).
 * Exit codes are the verifiers' own: 0 · 1 usage · 2 environment · 3 contract failures.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const [target, ...rest] = process.argv.slice(2);
const TARGETS: Record<string, string[]> = { npm: ["scripts/ccv-npm.ts"], shadcn: ["scripts/ccv-shadcn.ts"], all: ["scripts/ccv-npm.ts", "scripts/ccv-shadcn.ts"] };
if (!target || !TARGETS[target] || (target === "all" && rest.length > 0)) {
  process.stderr.write("usage: npm run ccv:runtime -- npm|shadcn|all [verifier flags]   (flags are not accepted with all)\n");
  process.exit(1);
}
const tsx = join(process.cwd(), "node_modules", ".bin", "tsx");
const rank = (code: number) => (code === 1 ? 4 : code === 3 ? 3 : code === 2 ? 2 : code === 0 ? 0 : 2);
let worst = 0;
for (const script of TARGETS[target]) {
  const outcome = spawnSync(tsx, [script, "--runtime", ...rest], { stdio: "inherit" });
  const code = outcome.status ?? 2;
  if (rank(code) > rank(worst)) worst = code;
}
process.exit(worst);
