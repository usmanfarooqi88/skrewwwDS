import { formatSkrewwwComponentMarker, extractSkrewwwComponentMarker } from "@/lib/guard/provenance-marker";
import { sha256OfBytes, type SnapshotDiff } from "@/lib/ccv/shadcn/fs-snapshot";
import type { ExpectedInstalledFile } from "@/lib/ccv/shadcn/expected";

/**
 * CCV-2 — installed bytes vs expected bytes.
 *
 * The expected hash is never changed and installed bytes are never normalized.
 * When bytes differ, the verifier tries to PROVE what happened by applying each
 * known installer transformation to the EXPECTED content and comparing for exact
 * equality with the installed bytes. A proof yields `UPSTREAM_TRANSFORM`; no
 * proof yields `FILE_CONTENT_MISMATCH`. Either way the file check FAILS.
 *
 * `ACCEPTED_INSTALLER_TRANSFORMS` would list transformations proven to have no
 * Skrewww contract consequence. It is empty: no such transformation is needed,
 * and the origin-marker removal (F1) has a consequence — Guard's public
 * provenance contract reads that marker — so it can never be accepted.
 */

export type InstallerTransformId = "origin-marker-line-removed" | "leading-block-comments-removed";

type InstallerTransform = { id: InstallerTransformId; apply: (expected: string) => string | undefined; description: string };

const LEADING_BLOCK_COMMENT_AND_WHITESPACE = /^\/\*[\s\S]*?\*\/\s*/;

/** Checked in order, most specific first. Each is applied to the EXPECTED content; only exact equality with the installed bytes is a proof. */
export const INSTALLER_TRANSFORMS: readonly InstallerTransform[] = [
  {
    id: "origin-marker-line-removed",
    description: "exactly the leading `/** @skrewww-component <slug> */` line was removed; nothing else changed",
    apply: (expected) => {
      const slug = extractSkrewwwComponentMarker(expected);
      const line = slug ? `${formatSkrewwwComponentMarker(slug)}\n` : undefined;
      return line && expected.startsWith(line) ? expected.slice(line.length) : undefined;
    },
  },
  {
    id: "leading-block-comments-removed",
    description: "every leading block comment (and the whitespace after each) was removed; nothing else changed",
    apply: (expected) => {
      if (!LEADING_BLOCK_COMMENT_AND_WHITESPACE.test(expected)) return undefined;
      let out = expected;
      while (LEADING_BLOCK_COMMENT_AND_WHITESPACE.test(out)) out = out.replace(LEADING_BLOCK_COMMENT_AND_WHITESPACE, "");
      return out;
    },
  },
];

/** Transformations proven harmless to every Skrewww contract. Deliberately empty. */
export const ACCEPTED_INSTALLER_TRANSFORMS: readonly InstallerTransformId[] = [];

export type FileVerdict =
  | { kind: "match"; actualSha: string; bytes: number }
  | { kind: "missing" }
  | { kind: "contributors-disagree"; actualSha?: string }
  | {
      kind: "upstream-transform";
      transform: InstallerTransformId;
      actualSha: string;
      bytes: number;
      markerExpected: boolean;
      markerPresent: boolean;
    }
  | {
      kind: "content-mismatch";
      actualSha: string;
      bytes: number;
      markerExpected: boolean;
      markerPresent: boolean;
      firstDifference: { line: number; expected: string; actual: string };
    };

export type ClassifyInput = {
  expected: Pick<ExpectedInstalledFile, "sha256" | "originMarker">;
  /** Installed bytes, or undefined when the file does not exist. */
  actual: Buffer | undefined;
  /**
   * The expected content (LOCAL_CANONICAL: the generator output whose hash the
   * contract records). Used only to PROVE a transformation; it must hash to the
   * contract's expected value or the classifier refuses it.
   */
  expectedContent?: string;
};

function firstDifference(expected: string, actual: string): { line: number; expected: string; actual: string } {
  const a = expected.split("\n");
  const b = actual.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) return { line: i + 1, expected: (a[i] ?? "<end of file>").slice(0, 120), actual: (b[i] ?? "<end of file>").slice(0, 120) };
  }
  return { line: 0, expected: "", actual: "" };
}

export function classifyInstalledFile(input: ClassifyInput): FileVerdict {
  if (input.actual === undefined) return { kind: "missing" };
  const actualSha = sha256OfBytes(input.actual);
  if (input.expected.sha256.length !== 1) return { kind: "contributors-disagree", actualSha };
  const expectedSha = input.expected.sha256[0];
  const bytes = input.actual.length;
  if (actualSha === expectedSha) return { kind: "match", actualSha, bytes };

  const actualText = input.actual.toString("utf8");
  const markerExpected = input.expected.originMarker !== undefined;
  const markerPresent = markerExpected && extractSkrewwwComponentMarker(actualText) === input.expected.originMarker;
  const content = input.expectedContent;
  if (content !== undefined) {
    if (sha256OfBytes(content) !== expectedSha) throw new Error("expected content does not match the contract hash; refusing to classify");
    for (const transform of INSTALLER_TRANSFORMS) {
      const candidate = transform.apply(content);
      if (candidate !== undefined && candidate === actualText) {
        return { kind: "upstream-transform", transform: transform.id, actualSha, bytes, markerExpected, markerPresent };
      }
    }
  }
  return { kind: "content-mismatch", actualSha, bytes, markerExpected, markerPresent, firstDifference: firstDifference(content ?? "", actualText) };
}

export type FileSetVerdict = {
  /** Added files that no expected install path explains. */
  unexpectedAdded: string[];
  removed: string[];
  /** Modified files other than the package manifests the declared dependencies explain. */
  unexpectedModified: string[];
  /** Expected paths that already existed before the install (the consumer was not clean). */
  preExisting: string[];
};

const PACKAGE_FILES = ["package.json", "package-lock.json"];

export function evaluateFileSet(diff: SnapshotDiff, expectedPaths: ReadonlySet<string>, options: { dependenciesExpected: boolean; before: ReadonlySet<string> }): FileSetVerdict {
  return {
    unexpectedAdded: diff.added.filter((path) => !expectedPaths.has(path) && !(options.dependenciesExpected && path === "package-lock.json")),
    removed: diff.removed,
    unexpectedModified: diff.modified.filter((path) => !(options.dependenciesExpected && PACKAGE_FILES.includes(path))),
    preExisting: Array.from(expectedPaths).filter((path) => options.before.has(path)).sort(),
  };
}
