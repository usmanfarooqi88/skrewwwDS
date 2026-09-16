# Skrewww Figma Community Skill — Publishing Prep

**Status:** Internal only — **not** part of the uploaded skill file  
**Skill version:** `0.1.0`  
**Upload-ready file:** [`skills/skrewww-design-system.md`](../../skills/skrewww-design-system.md)  
**Branch:** `feat/figma-community-skill`  
**Official Figma docs verified:** Custom skills for the Figma agent and Figma Make
(Help Center) — Community upload is a **single Markdown `.md` file**; no
`scripts/`, `references/`, or `assets/` directories.

---

## Community metadata

### Community name

**Skrewww Design System**

### Slash command

`/skrewww-design-system`

(Matches skill frontmatter `name: skrewww-design-system`.)

### Tagline options

1. **Build, audit, and refine UI with Skrewww in Figma Agent + Make**
2. **Use real Skrewww components, tokens, Shape, and Surface — don’t invent them**
3. **AI-first design-system rules for consistent Figma Agent and Make work**

**Recommended:** Option 1

### Description (Community-ready)

Skrewww is an AI-first design system. This skill teaches the Figma Agent and
Figma Make how to build, audit, and refine product UI with Skrewww components,
semantic variables, and Shape/Surface architecture.

It prefers real library assets over lookalikes, treats application patterns as
compositions unless a component already exists, and stops instead of inventing
unsupported components or properties. Works best with the Skrewww Figma
library. Design-level accessibility checks are included; this skill does not
replace human review or prove runtime WCAG compliance.

### Category

**Recommended:** Design systems

(Official Community AI skills categories include: generation, brand,
**design systems**, handoff, review, orchestrate & prompt, research.)

Secondary fit if the UI forces a single choice between close options: Review —
but primary intent is design-system usage, so prefer **Design systems**.

### Support

https://skrewww.com

Do not invent an email address.

### Verified public links (include only these)

| Resource | URL |
|----------|-----|
| Product / docs | https://skrewww.com |
| Agent Kit overview | https://skrewww.com/agent-kit |
| Figma Community Free | https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free |
| React / GitHub | https://github.com/usmanfarooqi88/skrewwwDS |

**Not included (no confirmed public URL in repo metadata for Community copy):**
Skrewww Pro / Gumroad purchase link — mention “Pro library” only as a product
concept if needed; do not invent a URL.

---

## Upload checklist

1. Upload **only** `skills/skrewww-design-system.md`
2. Confirm name becomes slash command `/skrewww-design-system`
3. Confirm description triggers Build / Audit / Refine + Figma Design + Make
4. Add thumbnail + carousel (1920 × 1080)
5. Set category **Design systems**
6. Support = https://skrewww.com
7. Smoke-test slash invoke in Figma Design and Figma Make after publish

---

## Media storyboard (plan only — no graphics generated)

Recommended dimensions: **1920 × 1080**. Up to 1 thumbnail + 9 images.

| # | Title | Message |
|---|-------|---------|
| 1 | Cover | “Build with Skrewww” — AI-first design system for Figma Agent + Make |
| 2 | Use real components | Don’t rebuild what already exists |
| 3 | One foundation | Shape: Sharp / Rounded / Pill / Squircle |
| 4 | Surface | Flat / Gradient / Glass — where supported |
| 5 | Tokens | Semantic variables over arbitrary values |
| 6 | Compose | Build product UI from system primitives |
| 7 | Audit | Detect drift, detached components, raw styling |
| 8 | Accessibility | Design-level checks (not runtime certification) |
| 9 | Humans + AI | Same system, shared rules |

---

## Scenario dry-run (reasoning only — no Figma edits)

| # | Prompt | Expected skill behavior | Result |
|---|--------|-------------------------|--------|
| 1 | “Build a SaaS settings page using Skrewww.” | Inspect library/tokens → compose with real components → realistic content | **PASS** |
| 2 | “Make every card Glass and Pill.” | Verify Card Shape/Surface support before applying; do not force unsupported combos | **PASS** |
| 3 | “Create a Skrewww Command Palette.” | Do not claim a canonical searchable Command Palette; treat as gap/composition; Menu/Popover may exist | **PASS** |
| 4 | “Review this screen and fix the design system.” | Audit first; group FIX NOW / REVIEW / INFORMATION; no silent foundation rewrite | **PASS** |
| 5 | “Skrewww isn’t installed. Build this screen anyway.” | State library unavailable; offer labeled Skrewww-inspired draft only if user wants it | **PASS** |
| 6 | “Detach all components and clean them up.” | Refuse default detach; explain tradeoff; require explicit confirmation | **PASS** |
| 7 | “Make a new component for this filter bar.” | Prefer Advanced Filters-style composition of primitives first; ask before promoting to DS | **PASS** |

---

## Hallucination review notes

Checked and encoded safeguards against:

- inventing components / properties / tokens
- claiming universal Shape/Surface support
- claiming runtime WCAG proof from Figma
- claiming Make library usage when assets are absent
- implying this skill adds MCP capabilities
- depending on private repo paths at runtime

---

## Ambiguities recorded (do not fix in this task)

1. **Searchable Command Palette** — intentionally deferred / a11y-constrained;
   skill must not present it as a shipped canonical component.
2. **Searchable Multi Select** — composition (Checkbox + Tags) is the safe
   default unless a real Multi Select exists in the file.
3. **Per-component Shape/Surface matrices** change over time — skill requires
   inspection rather than embedding a frozen matrix.
4. **Skrewww Pro public purchase URL** — not confirmed in site-config for
   Community copy; Free Community file URL is confirmed.

---

## Changelog

### 0.1.0

- Initial Community-ready single-file skill
- Modes: Build / Audit / Refine
- Encode Shape, Surface, tokens, composition vs component, missing-library,
  detach, and design-level a11y rules
- Internal publishing prep doc added

---

## Explicit non-goals for this task

- No Guard changes
- No React / registry / token / Agent Kit / Reference App / Figma library edits
- No `docs/project-status.md` edits (parallel-work safety)
