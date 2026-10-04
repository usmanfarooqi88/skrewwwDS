import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { deriveShadcnContract } from "@/lib/ccv/derive-shadcn-contract";
import { serializeConsumerContract } from "@/lib/ccv/serialize";
import { validateConsumerContract } from "@/lib/ccv/validate";

const root = process.cwd();
const tsx = join(root, "node_modules", ".bin", "tsx");
const run = (...args: string[]) => spawnSync(tsx, ["scripts/ccv-contract.ts", ...args], { cwd: root, encoding: "utf8" });
const head = () => spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();

describe("npm run ccv:contract (read-only debug CLI)", () => {
  it("prints the same deterministic JSON the library derives, writes nothing and exits 0", () => {
    const statusBefore = spawnSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" }).stdout;
    const shadcn = run("shadcn", "button");
    expect(shadcn.status).toBe(0);
    expect(shadcn.stdout).toBe(serializeConsumerContract(deriveShadcnContract("button", { gitSha: head() })!));
    const npm = run("npm", "@skrewww/react", "--mode", "PUBLIC_NPM");
    expect(npm.status).toBe(0);
    const parsed = JSON.parse(npm.stdout);
    expect(validateConsumerContract(parsed)).toEqual({ ok: true });
    expect(npm.stdout).toBe(serializeConsumerContract(deriveNpmContract({ gitSha: head(), mode: "PUBLIC_NPM" })));
    expect(run("shadcn", "--list").stdout.split("\n").filter(Boolean)).toContain("foundation");
    expect(spawnSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8" }).stdout).toBe(statusBefore);
  }, 180_000);

  it("exits non-zero for an unknown subject, distribution or mode", () => {
    expect(run("shadcn", "no-such-item").status).toBe(1);
    expect(run("npm", "@skrewww/other").status).toBe(1);
    expect(run("pip", "x").status).toBe(1);
    expect(run("shadcn", "button", "--mode", "PUBLIC_NPM").status).toBe(1);
    expect(run("npm", "@skrewww/react", "--mode", "LOCAL_CANONICAL").status).toBe(1);
    expect(run().status).toBe(1);
  }, 180_000);
});
