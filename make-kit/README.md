# make-kit

Source for the Figma Make Kit **guidelines** (not the kit itself). The first kit (Kit 1) is published privately to the owner's team from these generated guidelines plus the exact-pinned published `@skrewww/react`, with no attached Figma library; see the architecture note.

- `setup.md` — the only hand-written file. Environment setup for Figma Make / Vite.
- `dist/` — **generated, gitignored.** `npm run build:make-guidelines` writes `dist/guidelines/**` and `dist/manifest.json` from canonical sources. Never edit it.

Architecture, source hierarchy and commands: `docs/architecture/make-kit-guidelines.md`.
