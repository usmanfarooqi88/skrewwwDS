# Bar Chart discoverability and SEO regression pass

Date: 2026-10-06. Production was inspected read-only; today's uncommitted changes were verified using a fresh production build served at `http://127.0.0.1:4191`. Nothing was committed or deployed.

## A. Bar Chart diagnosis

**Confirmed: the lower link count is intentional contextual navigation, not a missing sidebar or rendering defect.** NAV-2 explicitly replaced the universal sidebar with section-specific navigation on 2026-09-22 (`docs/project-status.md`, NAV-2 completion entry).

`app/layout.tsx` uses `DocsChrome` for all these pages. `DocsChrome` builds canonical models on the server; `DocsChromeClient` uses `resolveSection()` to select one model. Chart paths intentionally take precedence over `/components/*`. `SectionSidebar` and `SectionNav` render the same markup for either model:

- Charts: Overview, Bar Chart, Line Chart, Area Chart, Chart Card, Chart Metric — **6 sidebar links**.
- Components: overview, category overviews, ordinary component documentation, industry overviews and banking documentation — **72 sidebar links**.
- Global navigation provides access to the other sections. The old `SidebarNav` component is not the current docs-shell renderer.

The model and precedence are explicitly covered by `lib/section-nav.test.ts` and `e2e/global-navigation.spec.ts`. Increasing the chart sidebar to match ordinary component pages would reverse the approved navigation architecture.

### Link measurements

Counts below are `<a href>` occurrences whose resolved origin is `https://skrewww.com`, excluding fragment-only anchors such as the skip link. Repeated destinations count separately; external/social links do not. These are **outgoing links in the page**, not inbound-link counts.

| Page | Live internal links | Built internal links | Sidebar links | Explanation |
| --- | ---: | ---: | ---: | --- |
| Bar Chart | 21 | 21 | 6 | 5 global/home links + 6 chart-sidebar links + 10 article/breadcrumb/footer links |
| Line Chart | 21 | 21 | 6 | Same Charts section and sibling relationships |
| Area Chart | 21 | 21 | 6 | Same Charts section and sibling relationships |
| Chart Card | 25 | 25 | 6 | Same sidebar, additional composition-related links |
| Chart Metric | 20 | 20 | 6 | Same sidebar, fewer article links |
| Combobox | 90 | 90 | 72 | Full Components contextual sidebar |
| File Upload | 95 | 95 | 72 | Full Components contextual sidebar |
| Calendar Grid | 88 | 88 | 72 | Full Components contextual sidebar |
| Progress Bar | 84 | 86 | 72 | Earlier targeted edit adds File Upload and Stepper relationships |

Including the skip anchor makes Bar Chart's count 22. Its **21** navigable internal anchors were reproduced both in raw production HTML and after hydration (`data-live-preview-state="ready"`), and again on the local production build.

### Other architectural checks

- Bar Chart uses the same `app/components/[slug]/page.tsx` as the controls. There is no chart-specific page layout that drops navigation or documentation.
- Its canonical registry category remains **Content & Data**. Its breadcrumbs and footer correctly link that category; the page also has a contextual Charts overview link. The Charts hub and Content & Data category both link to Bar Chart.
- Its related-components block links to Line Chart and Area Chart. Those relationships are reciprocal. The Charts sidebar also supplies Chart Card and Chart Metric destinations. No missing canonical relationship was found.
- Chart-specific lazy/Suspense loading belongs to the interactive preview. The navigation, purpose, guidance, API, and example are already in the HTTP HTML. The chart preview's client rendering does not gate SEO content.
- Desktop section links are server-rendered despite their client-component boundary. On mobile, the section drawer uses the same model and opens on interaction; this is intentional responsive behavior, not a hydration-only crawl dependency.
- All inspected Bar Chart anchors are real, correctly formed links. The source contains no hidden SEO link block and no duplicate global sidebar.

**Hypothesis not established:** a smaller outgoing-link count might affect visibility. The count alone supplies no evidence for that claim, and Bar Chart remains indexed according to the supplied GSC observation.

## B. Changes made

No Bar Chart content, navigation, registry, layout, or implementation changes were needed. This pass adds:

- `e2e/seo-regression.spec.ts`: nine production-browser checks covering eight representative HTTP documents plus sitemap/robots. It parses raw responses in an inert DOM, removes scripts/styles/templates before testing documentation text, and compares canonical navigation and metadata with hydrated pages.
- This audit report.

The preceding Organization fix and targeted Progress Bar/Account Card documentation edits are preserved. Unrelated consumer-verification work is untouched.

## C. SEO regression matrix

This matrix describes the **new local production build**, not deployment status. Every row passed checks for one expected title, a nonempty/correct description, one H1, meaningful server-rendered text, real internal navigation, and one self-canonical. Component titles use `<H1> — Skrewww Design System` once. `/` uses `Skrewww Design System`; `/components` uses `Components — Skrewww Design System`.

`O` = one complete Organization with the production logo and stable identity; `B` = BreadcrumbList; `T` = TechArticle. References to Organization use its `@id` rather than defining another entity. A dash is intentional absence, not a failure.

| Route | HTTP | Robots | Canonical | Organization / page schema | H1 | Sitemap | Internal links |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| `/` | 200 | default index/follow | self | O / WebSite + SoftwareApplication | One foundation.Every surface. | Yes | 17 |
| `/components` | 200 | default index/follow | self | — / — | Components | Yes | 145 |
| `/components/combobox` | 200 | index, follow | self | O / B + T | Combobox | Yes | 90 |
| `/components/progress-bar` | 200 | index, follow | self | O / B + T | Progress Bar | Yes | 86 |
| `/components/banking-account-card` | 200 | index, follow | self | O / B + T | Banking Account Card | Yes | 91 |
| `/components/bar-chart` | 200 | index, follow | self | O / B + T | Bar Chart | Yes | 21 |
| `/components/file-upload` | 200 | index, follow | self | O / B + T | File Upload | Yes | 95 |
| `/components/menu-item` | 200 | noindex, follow | self | — / — | Menu Item | No | 81 |

### Exact verified descriptions

- `/`: React and TypeScript design system with accessible, token-driven components, a shadcn-compatible registry, a paired Figma library, and machine-readable contracts for AI coding agents.
- `/components`: Browse the Skrewww React component library — documented design-system primitives for actions, forms, navigation, feedback, overlays, and data display.
- Combobox: Combobox is an editable searchable single-select with a filterable listbox — distinct from non-searchable Select and query-only Search Field.
- Progress Bar: React progress bar for uploads and background tasks, with measured value/max progress, an indeterminate mode, a visible label, and optional percentage text.
- Banking Account Card: React bank account summary card for banking dashboards: show one account's balance, balance-history sparkline, account type, and action to view transactions.
- Bar Chart: Bar Chart compares categories with vertical or horizontal bars — a single series by default, or several series grouped, stacked, or stacked to 100%. Static and non-tabbable, with the data also exposed as a hidden table.
- File Upload: File Upload is a native file input with drag-and-drop dropzone, advisory validation, selected-file list, and multipart form submission — selection only, not network upload.
- Menu Item: Menu Item is a single row within any dropdown, context, or command menu — the shared building block behind Dropdown Menu, Command Menu, and context menus alike.

### Broader regression proof

A separate HTTP crawl checked **all 68 canonical component routes**, not just the matrix:

- All returned **200**, had distinct titles and self-canonicals, and matched canonical registry/document metadata.
- **59 remained indexable**. The same **9** docs-only building blocks remained noindex: Breadcrumb Item, Page Item, Menu Item, Step Item, Dropdown Trigger, Sidebar Nav Item, Top Nav Item, Tree Item, and Timeline Item. These are policy states, not claims that Google currently indexes all 59.
- All 68 raw documents contained their actual purpose text after removing scripts, styles, and templates. Serialized props alone were not accepted as content.
- Each complete sidebar matched its canonical section model exactly.
- The sitemap had **75 unique URLs**, identical to both the canonical source and live production in membership and order.
- `robots.txt` matched live production **byte-for-byte**. General crawlers remain allowed, `/_next/` is not blocked, and the intentional GPTBot restriction is preserved.
- Only eight sitemap dates changed under the existing derivation: the two edited component pages, home, Components, Industries, Feedback category, Content & Data category, and Banking hub. Each advanced to 2026-10-06 from real documentation changes; sitemap generation logic was not edited.
- The existing unit checks also cover redirect aliases, intentional noindex exclusions, title branding, canonical resolution, and structured-data scope.

There was no mass noindex, canonical collision, duplicated title branding, sitemap membership regression, robots regression, broken canonical component route, or client-only documentation regression in these checks.

## D. Test/build results

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test -- --maxWorkers=4` | **2,211 passed, 2 skipped; 194 files passed, 1 skipped** |
| `npm run build` | Passed; 96 static pages generated |
| Registry and agent-context generation | Passed as part of production build |
| New SEO browser suite + existing global/contextual navigation suite | **18 passed**, including desktop/mobile behavior |
| All-canonical-component HTTP audit | **68/68 passed** |
| Representative raw HTML vs hydrated metadata/sidebar checks | Passed |
| `git diff --check` | Passed |

The two skipped unit tests were not counted as passes. Existing JSDOM navigation notices and Edge Runtime build warnings did not fail their commands. Initial sandbox restrictions blocked the browser CLI download and one local HTTP audit; both were rerun with approved access and completed successfully.

## E. Remaining confirmed issues and observations

- **P0: none found** within this pass.
- **P1: none found** within this pass.
- **P2, confirmed deployment gap:** live home and Bar Chart still emit the old name-only Organization objects without `logo` or shared identity. The uncommitted production build emits one complete Organization per applicable document with `https://skrewww.com/logo.svg`. The prior fix must be committed/deployed before production benefits; this is not evidence of an indexing block.
- **Observation, not a confirmed SEO defect:** shared H3 documentation sections follow the H2 open-questions block. This is an existing semantic-outline improvement opportunity also present on indexed controls; no causal SEO claim or shared-template change is warranted here.
- **Unresolved external observation:** the supplied GSC exclusions for Progress Bar and Banking Account Card remain unexplained by a technical blocker. This pass does not claim recovery or prove Google's selection rationale.

Preserve the six-link Charts navigation, Banking industry grouping, intentional noindex building blocks, registry-derived canonical architecture, and deliberate absence of sitewide JSON-LD in the root layout. Do not add Organization markup to every route merely to make the matrix uniform.

## F. Recommended commit boundary

One SEO-only commit can include exactly these ten files from today's work:

1. `lib/structured-data.ts`
2. `lib/seo-structured-data.test.ts`
3. `content/feedback.ts`
4. `content/content-data.ts`
5. `lib/component-registry-feedback.ts`
6. `lib/component-registry-content-data.ts`
7. `lib/seo-target-component-docs.test.ts`
8. `e2e/seo-regression.spec.ts`
9. `docs/audits/targeted-component-indexing-2026-10-06.md`
10. `docs/audits/bar-chart-seo-regression-2026-10-06.md`

Suggested message: `fix(seo): complete organization schema and clarify component docs`

Exclude the pre-existing CCV, consumer-scenario, package/script, community, and skill changes. No production navigation, robots, sitemap, indexing-policy, or component-implementation files belong in this commit. Nothing has been staged or committed by this pass.
