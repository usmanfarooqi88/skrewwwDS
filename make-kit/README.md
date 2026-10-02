# make-kit

Source for the Figma Make Kit **guidelines** (not the kit itself — no Make Kit exists yet; assembly is a manual Figma Make step, see the architecture note).

- `setup.md` — the only hand-written file. Environment setup for Figma Make / Vite.
- `dist/` — **generated, gitignored.** `npm run build:make-guidelines` writes `dist/guidelines/**` and `dist/manifest.json` from canonical sources. Never edit it.

Architecture, source hierarchy and commands: `docs/architecture/make-kit-guidelines.md`.
