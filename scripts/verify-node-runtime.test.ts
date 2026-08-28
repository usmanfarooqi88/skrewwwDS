import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { satisfiesEngineRange } from "./verify-node-runtime.mjs";

const RANGE = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
).engines.node;

describe("verify-node engine range", () => {
  it("uses the disjoint 22.13+ / 24 policy", () => {
    expect(RANGE).toBe(">=22.13.0 <23 || >=24 <25");
  });

  it("accepts supported Node 22.13+ and Node 24", () => {
    expect(satisfiesEngineRange("22.13.0", RANGE)).toBe(true);
    expect(satisfiesEngineRange("22.14.0", RANGE)).toBe(true);
    expect(satisfiesEngineRange("24.0.0", RANGE)).toBe(true);
    expect(satisfiesEngineRange("24.14.0", RANGE)).toBe(true);
  });

  it("rejects EOL Node 20, odd majors, pre-22.13 Node 22, and Node 25+", () => {
    expect(satisfiesEngineRange("20.19.0", RANGE)).toBe(false);
    expect(satisfiesEngineRange("21.0.0", RANGE)).toBe(false);
    expect(satisfiesEngineRange("21.7.3", RANGE)).toBe(false);
    expect(satisfiesEngineRange("22.12.0", RANGE)).toBe(false);
    expect(satisfiesEngineRange("23.0.0", RANGE)).toBe(false);
    expect(satisfiesEngineRange("23.11.0", RANGE)).toBe(false);
    expect(satisfiesEngineRange("25.0.0", RANGE)).toBe(false);
  });
});
