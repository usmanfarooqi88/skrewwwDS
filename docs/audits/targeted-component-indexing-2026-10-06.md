# Progress Bar and Banking Account Card indexing investigation

Audit date: 2026-10-06. Changes are limited to documentation and registry content for `/components/progress-bar` and `/components/banking-account-card`, plus a focused regression test. No component implementation, visual styling, shared rendering, indexing policy, or routing change.

## Conclusion and evidence limits

Neither target has a confirmed technical indexing block. Progress Bar has confirmed documentation inaccuracies and missing implementation guidance. Banking Account Card has an opportunity to differentiate its account-overview use case and improve its example; it is not demonstrably a duplicate of Transaction Row. These are useful documentation corrections, not proof of why Google excluded either URL.

The supplied Search Console evidence establishes `Crawled, currently not indexed`, historical visibility, and the last known Account Card crawl around 2026-08-30. This investigation does not establish what exact page revision Google saw at that crawl. Page-filtered GSC Wizard queries for both URLs, web search, 2026-07-01 through 2026-10-03, returned zero query rows. That does not disprove the supplied clicks/impressions: query reporting can omit anonymized searches. No measured search-volume or query-level claim supports the wording changes. “React progress bar,” “upload progress,” and “bank account summary card” describe the actual product and intended task.

## Comparison with indexed controls

The index/ranking classification below comes from the supplied URL Inspection evidence. Live HTTP and HTML were independently fetched on the audit date. Related-link counts count distinct inbound **registry related-component sources**, not global navigation, hubs, or a complete external crawl.

| Page | Existing intent and information | Inbound related sources | Assessment |
| --- | --- | ---: | --- |
| Progress Bar | Generic one-sentence intro; five API rows; one comparison. “When not to use” excludes unknown-duration work despite an implemented indeterminate mode. Figma's missing numeric property is not clearly separated from React. | 5: File Upload, Slider, Spinner, Skeleton, Stepper | Confirmed content accuracy/completeness gap; no discovery deficit relative to controls. |
| Banking Account Card | One account, balance, sparkline, action. Two explanatory sections repeat surface inheritance and chart implementation history already described elsewhere on the page. Example uses a no-op action without a client-boundary declaration. | 1: Banking Transaction Row | Product is distinct; use-case and integration guidance are weaker than the volume of text suggests. |
| Combobox | Explicitly distinguishes editable selection from Select and Search Field; five explanations cover custom values, blur matching, and announcements. | 2 | Strong task distinctions and behavior-specific answers. |
| File Upload | Intro distinguishes local selection from network upload; five explanations cover ownership, submission, rejection, and server validation. | 0 | Demonstrates that few registry backlinks alone do not explain exclusion. |
| Calendar Grid | Single/range selection and keyboard navigation; five explanations cover focus, outside days, locale assumptions, and range behavior. | 2 | Specific operational guidance beyond the API table. |
| Banking Transaction Row | Merchant/date/amount/status and transaction details; explains its popover and trigger composition. Shares Banking pilot/Figma caveats with Account Card. | 2 | Shared pilot boilerplate does not make the two components interchangeable. |
| Button Group | Independent actions, not selection state; comparisons distinguish Split Button and segmented controls. | 3 | Clear limits and alternatives. |
| Avatar | Shorter documentation with three practical explanations: informative/decorative naming, initials, and image failure. | 2 | Useful specificity matters more than a word-count target. |

All eight use a component-name title with one Skrewww brand suffix and a matching single H1. All have server-rendered purpose, usage, accessibility, API, examples, and related links. The common “X is…” description pattern and standard documentation headings are template similarities, not evidence of near-duplicate main content. Account Card's balance history and account action differ materially from Transaction Row's individual transaction status/detail interaction.

The shared heading outline uses H3 documentation sections after the H2 status/open-questions section, followed by H2 related sections; previews add their own headings. This shared outline is imperfect, but also occurs on the indexed controls. It is not evidence of a target-specific indexing cause and was not refactored.

## Technical and discovery checks

- Both targets and all six controls returned HTTP 200, `index, follow`, one self-canonical, and no `X-Robots-Tag` response header.
- Both targets appear once in the live sitemap. Robots allows Google/general crawlers and does not block `/_next/`.
- Each target's trailing-slash URL returns 308 to the clean URL. A `?ref=seo-audit` variant remains 200 but canonicalizes to the clean URL. No alternate target slug exists in the canonical redirect registry. No accidental duplicate-URL defect was found in these checks.
- Progress Bar has a content link from `/components/category/feedback`; Account Card has one from `/components/industries/banking`. Both appear in global navigation. Banking is intentionally grouped under Industries rather than the general Content & Data listing.
- Existing breadcrumbs match these groupings. File Upload already links to Progress Bar, and Transaction Row already links to Account Card. Neither target is orphan-like.
- Live JSON-LD shares the pre-existing incomplete Organization author/publisher definitions with the controls. The earlier, separately requested uncommitted Organization-logo fix remains intact. No further schema change or FAQ schema was added here.
- Production-build HTML contains the new documentation and examples without client execution. Each target retains its canonical TechArticle URL and the centralized Organization with the production logo. Component previews do not gate the documentation text.

## Changes and expected effect

| Page | Problem found | Evidence | Change made | Expected SEO effect | Confidence |
| --- | --- | --- | --- | --- | --- |
| Progress Bar | Inaccurate mode guidance; thin explanation of real behavior; incomplete API documentation | `ProgressBar.tsx` implements native determinate progress, an indeterminate branch, `showValue`, clamping, and required labeling; CSS handles reduced motion. Existing prose contradicted or omitted these. | Explain measured vs unknown totals, operation ownership, accessible naming/announcements, reduced motion, and alternatives. Document `showValue` and wrapper `className`. Provide a data-driven example and contextual links to File Upload and Stepper. Clarify that the existing fixed-fill Figma caveat does not restrict React. | More accurate and useful documentation for progress implementation intent. | High confidence in the corrections; moderate confidence in improved relevance; indexing outcome unknown. |
| Banking Account Card | Implementation-history emphasis; limited account-overview differentiation; inert example action | Actual API takes one account's formatted balance, numeric history, chart label, and callback. It neither fetches account data nor implements a ledger or time-range selector. | Replace the two repeated implementation-history explanations with sibling comparisons and data/action guidance. Clarify formatted balance vs numeric history and accessible account/currency labels. Use a client example accepting a real consumer callback. Add the relevant Balance Summary link. | Clearer account-summary intent and integration guidance, without claiming new capabilities. | High confidence in product accuracy; moderate confidence that differentiation is the relevant weakness; indexing outcome unknown. |

The two registry summaries now identify React use cases and flow into their existing meta/intro consumers, including derived social descriptions and hub listings. Titles/H1s remain unchanged. Documentation dates alone advance to 2026-10-06; React dates and maturity do not change. Existing sitemap `lastModified` derivation can therefore advance the targets and affected hub dates naturally; URL membership, ordering, exclusions, and sitemap code are unchanged.

Source material: `components/ui/ProgressBar.tsx`, `components/ui/progress-bar.module.css`, `components/ui/BankingAccountCard.tsx`, `components/ui/Card.tsx`, `components/ui/LineChart.tsx`, their existing tests, and the canonical content/registry entries. No new Figma inspection or parity claim was made; existing recorded Figma availability/reference metadata is preserved.

## Validation

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- Selected SEO/metadata, registry, routes, public-example, Progress Bar, and Account Card tests — **203 passed across 16 files**. Includes two new documentation regression tests.
- Both published React example strings separately typechecked against the real component APIs using TypeScript.
- `npm run build` — passed, including registry and agent-context generation; 96 static pages generated. Existing Edge Runtime deprecation/static-generation warnings remain unrelated.
- Generated HTML checked for both targets and all six controls. Target documentation/examples, canonical URLs, robots directives, and JSON-LD passed; all control titles, H1s, descriptions, canonicals, and robots match the live baseline.
- All implemented-component metadata compared before/after: only the two target descriptions and their derived social descriptions changed. Sitemap URL membership/order is identical.
- Hash comparison confirms routing, indexing policy, robots/sitemap code, shared layout/rendering, the prior structured-data fix, and both component implementations remain unchanged.
- `git diff --check` — passed.

## Intentional architecture retained

Keep the canonical registry as the metadata and indexing source, the noindex building-block pages, the Banking industry grouping, and Account Card's beta/React-first/Figma-unavailable status. No forced indexing, duplicate landing pages, synthetic dates on unrelated entries, keyword lists, or additional structured-data types were introduced. Unrelated working-tree changes and the preceding Organization-schema work were preserved. Nothing was committed or deployed.
