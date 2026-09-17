# Guard v0.1.0-beta.1 — social drafts (NOT PUBLISHED)

**Status:** draft only. Publish LinkedIn / Instagram **after** `/guard` and the
changelog entry are live on skrewww.com.

Canonical docs: https://skrewww.com/guard  
Changelog: https://skrewww.com/changelog  
npm: https://www.npmjs.com/package/@skrewww/guard  
GitHub: https://github.com/usmanfarooqi88/skrewwwDS/releases/tag/guard-v0.1.0-beta.1

Follow Skrewww visual/social rules for assets (no generic purple gradients,
no invented screenshots of unverified UI). Prefer product-honest copy over hype.

---

## LinkedIn (draft)

**Skrewww Guard is in public Beta.**

Offline, local CLI validation for selected Skrewww canonical-contract claims —
without uploading your source, calling an LLM, or connecting to Figma.

Install:

```
npm install --save-dev @skrewww/guard@beta
npx skrewww-guard .
```

What it checks today (exactly three public rules):

1. Nonexistent Skrewww component slugs  
2. False “Stable” maturity claims  
3. False “installable via registry” claims  

What it does **not** do: replace TypeScript, accessibility/WCAG review, Shape/Surface
checks, Figma parity, or visual QA.

Provenance note: Guard recognizes Skrewww-origin via `@skrewww-component` markers from
registry installs. Unmarked local files stay unknown — no false errors.

Docs: https://skrewww.com/guard  
Release: https://github.com/usmanfarooqi88/skrewwwDS/releases/tag/guard-v0.1.0-beta.1

---

## Instagram (draft — caption)

Skrewww Guard · public Beta

Offline checks for a few Skrewww contract claims.
Not TypeScript. Not a11y. Not Figma parity.

npm i -D @skrewww/guard@beta
npx skrewww-guard .

skrewww.com/guard

(Carousel suggestion: 1 brand/wordmark · 2 “what it checks” · 3 “what it doesn’t” ·
4 install command · 5 link sticker to /guard — no fake dashboards.)

---

## Publish checklist (human)

- [ ] https://skrewww.com/guard live
- [ ] https://skrewww.com/changelog shows Guard Beta entry
- [ ] Visuals follow Skrewww social rules
- [ ] Post LinkedIn
- [ ] Post Instagram
- [ ] Do **not** claim CI enforcement or full design-system correctness
