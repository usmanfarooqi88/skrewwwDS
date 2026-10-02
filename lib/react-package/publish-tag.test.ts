import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkPublishTag, expectedPublishTag } from "../../scripts/check-react-publish-tag.mjs";

const script = join(process.cwd(), "scripts/check-react-publish-tag.mjs");
/** The guard reports the manifest version; derive it so a version bump does not break this test. */
const manifestVersion: string = JSON.parse(readFileSync(join(process.cwd(), "packages/react/package.json"), "utf8")).version;

/** Runs the real guard script the way npm's prepublishOnly lifecycle would, with a controlled environment. */
function runGuard(env: Record<string, string>) {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key))) as NodeJS.ProcessEnv;
  const result = spawnSync(process.execPath, [script], { env: { ...clean, ...env } as NodeJS.ProcessEnv, encoding: "utf8" });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}

describe("expectedPublishTag", () => {
  it.each([
    ["0.1.0-beta.1", "beta"],
    ["0.1.0-beta", "beta"],
    ["1.2.3-alpha.4", "alpha"],
    ["1.0.0-rc.1", "rc"],
    ["1.0.0-0.beta.2", "beta"],
    ["0.1.0", null],
    ["2.0.0", null],
  ])("%s -> %s", (version, expected) => {
    expect(expectedPublishTag(version)).toBe(expected);
  });
});

describe("checkPublishTag", () => {
  const base = { version: "0.1.0-beta.1", lifecycleEvent: "prepublishOnly" };

  it("accepts a prerelease only when npm resolved its own tag", () => {
    expect(checkPublishTag({ ...base, resolvedTag: "beta" }).ok).toBe(true);
  });

  it("rejects latest (npm exposes no tag when it resolves to latest, which is what plain `npm publish` does on npm 11.12.1)", () => {
    const result = checkPublishTag({ ...base, resolvedTag: undefined });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/npm publish --tag beta/);
  });

  it("rejects any other tag", () => {
    expect(checkPublishTag({ ...base, resolvedTag: "next" }).ok).toBe(false);
    expect(checkPublishTag({ ...base, resolvedTag: "latest" }).ok).toBe(false);
  });

  it("does not constrain stable versions or runs outside the publish lifecycle", () => {
    expect(checkPublishTag({ version: "1.0.0", lifecycleEvent: "prepublishOnly", resolvedTag: undefined }).ok).toBe(true);
    expect(checkPublishTag({ ...base, lifecycleEvent: undefined, resolvedTag: undefined }).ok).toBe(true);
  });
});

describe("the real guard script, as npm's prepublishOnly would run it", () => {
  it("fails when no tag is resolved (plain npm publish => latest)", () => {
    const result = runGuard({ npm_lifecycle_event: "prepublishOnly" });
    expect(result.status).toBe(1);
    expect(result.out).toContain(`Refusing to publish ${manifestVersion}`);
  });

  it("fails for a non-beta explicit tag", () => {
    expect(runGuard({ npm_lifecycle_event: "prepublishOnly", npm_config_tag: "next" }).status).toBe(1);
  });

  it("passes for --tag beta", () => {
    expect(runGuard({ npm_lifecycle_event: "prepublishOnly", npm_config_tag: "beta" }).status).toBe(0);
  });

  it("is informational outside a publish", () => {
    expect(runGuard({}).status).toBe(0);
  });

  it("does not trust NPM_CONFIG_TAG alone (npm does not export it as npm_config_tag, and a --tag flag overrides it)", () => {
    expect(runGuard({ npm_lifecycle_event: "prepublishOnly", NPM_CONFIG_TAG: "beta" }).status).toBe(1);
  });
});
