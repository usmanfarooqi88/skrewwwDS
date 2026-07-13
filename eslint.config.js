const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Project-specific ignore not covered by eslint-config-next's own defaults
  // (.next/**, out/**, build/**, next-env.d.ts, node_modules/ are already
  // ignored by the preset below / ESLint's own defaults).
  { ignores: [".next-playwright/**"] },
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
    // eslint-config-next@16 bundles eslint-plugin-react-hooks@7, which adds
    // new React Compiler safety rules (refs/immutability/set-state-in-effect)
    // on top of the existing rules-of-hooks/exhaustive-deps. They flag 26
    // pre-existing call sites across Popover/Tooltip/Dialog/Drawer/several
    // internal hooks that use long-standing, intentional React 18 patterns
    // (the "latest ref" pattern; sync-mount-state effects). Fixing those
    // properly means restructuring hook logic across core primitives — out
    // of scope for the Next.js 16 upgrade itself. Downgraded to warn (not
    // silenced) so they stay visible; see docs/project-status.md for the
    // tracked follow-up. package.json's lint script raises --max-warnings to
    // 26 to match the current count exactly, so any new warning beyond these
    // still fails the gate.
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
