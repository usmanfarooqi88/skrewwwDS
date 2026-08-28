const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Project-specific ignore not covered by eslint-config-next's own defaults
  // (.next/**, out/**, build/**, next-env.d.ts, node_modules/ are already
  // ignored by the preset below / ESLint's own defaults). ".claude/**" covers
  // isolated agent worktrees (.claude/worktrees/<name>/) — each is a full
  // nested copy of this repo (its own app/, components/, lib/, and often a
  // stale .next-playwright build) with no ignore pattern of its own; without
  // this, a leftover worktree gets linted as if it were real source, both
  // duplicating warnings and pulling in generated build output as errors.
  { ignores: [".next-playwright/**", ".claude/**"] },
  ...nextCoreWebVitals,
  {
    // Flat config drops the legacy nearest-.eslintrc rootDir auto-detection
    // that @next/eslint-plugin-next relied on; declare it explicitly so
    // rules like no-html-link-for-pages can resolve the app directory.
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },
  {
    // Test files render markup in jsdom via Vitest, never as real Next.js
    // routes — no-html-link-for-pages doesn't apply (e.g. Table.test.tsx
    // deliberately renders a plain <a> to verify Table's cell composition
    // works with a real anchor, not to test routing).
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
