/**
 * CCV-2 — exact consumer tool pins and time limits for the clean-consumer runner.
 *
 * Never `latest`: a contract-defining run must not let an upstream release
 * silently redefine what Skrewww promises. Bumping a pin is a reviewed change
 * that re-runs CCV. A floating-`latest` canary is CCV-7 territory.
 *
 * Choices (docs/architecture/consumer-contract-verification.md §23):
 * - create-next-app 16.3.7 — the version used for the verified zero-config flow
 *   (2026-09-30) and the newest known-good 16.3.x; replaces smoke:consumer's 16.3.0.
 * - shadcn 4.21.1 — the CLI version on which CCV-0 reproduced the F1 marker drop
 *   against a hand-written, Tailwind-free components.json; replaces 4.16.2.
 * - Node — the repository's own engines range (`.nvmrc` 24.14.0 is the reference).
 * - npm — whatever ships with that Node; recorded, not pinned.
 */

export const CCV_TOOL_PINS = {
  createNextApp: "16.3.7",
  shadcn: "4.21.1",
  /** Same range as the repository and the published packages. */
  nodeRange: ">=22.13.0 <23 || >=24 <25",
} as const;

export type CcvToolPins = { createNextApp: string; shadcn: string; nodeRange: string };

const MINUTE = 60_000;

/** Upper bounds per external command, and for a whole run. No phase may run indefinitely. */
export const CCV_TIME_LIMITS = {
  scaffoldMs: 15 * MINUTE,
  installMs: 15 * MINUTE,
  typegenMs: 5 * MINUTE,
  typecheckMs: 15 * MINUTE,
  buildMs: 15 * MINUTE,
  probeMs: 2 * MINUTE,
  /** Target ceiling for a full verification run; each command's limit is clamped to what remains. */
  runMs: 30 * MINUTE,
} as const;

export type CcvTimeLimits = { [K in keyof typeof CCV_TIME_LIMITS]: number };

const VERSION = /^v?(\d+)\.(\d+)\.(\d+)/;

/** True when `version` (e.g. `v24.14.0`) satisfies the simple `>=a.b.c <d || …` range form the pins use. */
export function satisfiesNodeRange(version: string, range: string = CCV_TOOL_PINS.nodeRange): boolean {
  const parsed = VERSION.exec(version);
  if (!parsed) return false;
  const value = parsed.slice(1, 4).map(Number);
  const compare = (other: number[]) => value[0] - other[0] || value[1] - other[1] || value[2] - other[2];
  const parse = (text: string) => {
    const [major, minor = "0", patch = "0"] = text.split(".");
    return [Number(major), Number(minor), Number(patch)];
  };
  return range.split("||").some((alternative) =>
    alternative
      .trim()
      .split(/\s+/)
      .every((comparator) => {
        const match = /^(>=|<=|>|<|=)?(\d+(?:\.\d+){0,2})$/.exec(comparator);
        if (!match) return false;
        const diff = compare(parse(match[2]));
        switch (match[1]) {
          case ">=": return diff >= 0;
          case "<=": return diff <= 0;
          case ">": return diff > 0;
          case "<": return diff < 0;
          default: return diff === 0;
        }
      }),
  );
}
