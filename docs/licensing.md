# Licensing boundary

**This document is a technical summary of how this repository is licensed, not
legal advice.** Where it says "needs legal review," that is a genuine open
item, not a formality.

## Repository code — MIT

The source in this repository is licensed under the [MIT License](../LICENSE):
React/TypeScript components, CSS/tokens, the documentation platform, tests,
the registry and shadcn distribution infrastructure, Agent Kit (contracts,
compiler, Skill, ProjectContext, Recipes/Feature Kits), and development
tooling/scripts.

You may fork, modify, and redistribute that code, commercially included,
subject to the MIT terms (keep the copyright and permission notice).

## Third-party dependencies keep their own licenses

MIT here covers this repository's own code. Everything installed from npm
remains under its own license, unchanged.

As audited at the time of writing (505 resolved packages in the installed
tree): 425 MIT, 28 Apache-2.0, 25 ISC, 13 BSD-family, and a small number of
reciprocal-licensed packages consumed as ordinary dependencies —
`axe-core` and `lightningcss` (MPL-2.0), and `@img/sharp-libvips-*`
(LGPL-3.0-or-later, an optional platform binary pulled in by Next.js image
optimization). None of these is vendored or copied into this repository's
source; they are consumed as installed packages, and their obligations
attach to those packages, not to this project's own MIT grant.

No third-party source has been copied into this repository and relicensed.
Icons come from `@phosphor-icons/react` as a dependency; the small SVGs in
`components/ui/icons.tsx` are original primitives. Fonts (Inter, JetBrains
Mono) are fetched and self-hosted at build time by `next/font/google` under
the SIL Open Font License — no font binaries are tracked here.

Re-audit this list when dependencies change materially.

## Skrewww branding and trademarks are not granted by the MIT license

The Skrewww name, logo, wordmark, and visual brand identity are **not**
licensed to you by the MIT grant on the code. See [`TRADEMARKS.md`](../TRADEMARKS.md).

The brand assets currently tracked in this repository (`public/logo.svg`,
`public/light-logo.svg`, `public/dark-logo.svg`, `public/fav.svg`,
`public/right-bottom-icon.svg`) exist so the documentation site can build and
render. Their presence in an MIT-licensed repository is not a grant of
trademark rights.

## Figma files and commercial assets are separate

The MIT license covers **this repository's code only**. It does not cover, and
must not be read as granting any rights to:

- **Skrewww Pro** — the paid Figma library and any Gumroad deliverables.
- **Skrewww Free** — the Community Figma file, which carries whatever terms
  are stated where it is published.

No paid Figma source, exported Pro asset, or Gumroad deliverable is included
in this repository. Some `lib/*-figma-metadata.ts` files and architecture
docs reference Figma node IDs and a Figma file key as **parity metadata** —
records of which design node a React component was verified against. Those
references are not the design files, do not grant access to them, and do not
place them under MIT.

**Open item:** the licensing terms attached to the Free Figma file itself have
not been decided/recorded here. Do not assert terms for it until that decision
is made.

## Contributions

Contributions are accepted under the same MIT license as the rest of the
repository (the standard inbound=outbound convention). There is currently no
separate CLA.

**Open item for legal review:** much of this repository's history includes
AI-assisted commits (`Co-Authored-By` trailers). Copyright treatment of
AI-assisted contributions is an evolving area; a rights-holder review before
the public launch is advisable rather than assumed settled here.
