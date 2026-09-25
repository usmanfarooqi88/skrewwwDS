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
  {
    ignores: [
      ".next-playwright/**",
      ".claude/**",
      // Guard extraction-layer fixtures are deliberately isolated test
      // inputs, not real application source — one (malformed-source.tsx)
      // is intentionally invalid syntax, proving the extractor's own
      // parse-error handling (lib/guard/facts.test.ts). Linting/
      // typechecking them as project code would fail the build on
      // content that's supposed to be broken.
      "lib/guard/__fixtures__/**",
    ],
  },
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
  {
    // Previews are lazy per-slug chunks. The @/components/ui barrel re-exports
    // the chart components, so one barrel import pulls Recharts into a
    // non-chart preview (Data Table went ~211 KB → ~382 KB JS). Flag it in the
    // editor/lint before lib/preview-bundle-isolation.test.ts catches it.
    // Scoped to previews only: the barrel remains the public consumer import
    // path used in registry examples.
    files: ["components/previews/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/ui",
              message:
                "Import from the component's own module (e.g. @/components/ui/Table). The barrel re-exports the chart components and pulls Recharts into this preview's chunk.",
            },
          ],
          patterns: [
            {
              // The same barrel via its index file or a relative path.
              regex: "^(@/components/ui/index(\\.tsx?)?|\\.\\./ui(/index(\\.tsx?)?)?)$",
              message:
                "Import from the component's own module, not the @/components/ui barrel.",
            },
          ],
        },
      ],
    },
  },
];
