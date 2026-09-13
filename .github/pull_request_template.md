## What this changes

<!-- One or two sentences. What problem does this solve? -->

## How it was verified

<!-- Which of these actually ran, and what the result was. Please don't tick
     a box you didn't run — "not run" is a fine answer. -->

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:browser` (if behavior/interaction changed)

## Checklist

- [ ] Scope is as small as the change allows — no unrelated refactors.
- [ ] No generated artifacts committed (`public/r/`, `public/agent/`, `.next/` stay gitignored).
- [ ] Public component APIs unchanged, or the change is the explicit goal and is called out below.
- [ ] Accessibility preserved (semantics, accessible names, keyboard/focus) for any UI change.
- [ ] Docs/registry metadata updated if this changes component behavior, props, or status.
- [ ] No Figma claims invented — node IDs, variants, and token bindings come from real inspection, or are marked parity-pending.

## Notes for reviewers

<!-- Anything deliberately out of scope, known follow-ups, or decisions you'd
     like a second opinion on. -->
