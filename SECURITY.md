# Security policy

## Security vulnerability vs. normal bug

Please use the right channel — it determines how the report is handled.

**A security vulnerability** is something that could let someone compromise a
user, their data, or their build. For this project, realistically:

- A way to make a published component or the documentation site execute
  attacker-controlled script (XSS) or leak data cross-origin.
- A supply-chain problem in what the shadcn registry (`/r/*`) installs — for
  example a manifest that writes files outside its declared targets.
- A generated Agent Kit artifact (`/agent/*`) exposing secrets, credentials,
  or private paths.
- A dependency vulnerability that this project's own usage actually exposes.

**A normal bug** is everything else: a wrong prop, a broken style, an
accessibility defect, an incorrect component contract, a bad Recipe, a
documentation error. Those belong in the public issue tracker — please do not
route them here.

## Reporting a vulnerability

**Open item — no private reporting channel is available yet.**

This is a genuine gap, stated plainly rather than papered over with a contact
address that does not exist:

- GitHub's private vulnerability reporting is **not currently enabled** for
  this repository (verified, not assumed) — and GitHub only offers it for
  public repositories, so it cannot be enabled while this repository is
  private.
- No dedicated security email or form has been established.

**Planned resolution:** enable GitHub private vulnerability reporting
(Settings → Code security → Private vulnerability reporting) as part of making
this repository public, and update this file with that route in the same
change. Tracked in
[`docs/open-source-readiness.md`](docs/open-source-readiness.md).

Until that is in place, please **do not** open a public issue containing
exploit details for a genuine vulnerability. Contact the maintainer through
whatever direct channel you already have, and a private route will be
established for the exchange.

## Supported versions

This project is pre-1.0 in its Agent Kit layer and evolving elsewhere. Only
the current `main` branch receives fixes; there are no maintained release
branches or backports yet.

| Component | Status |
|---|---|
| Design system platform | 1.0.0 — current `main` supported |
| Agent Kit | 0.1.0-beta.1 — Beta, current `main` supported |

## Scope notes

- Generated artifacts under `public/agent/` and `public/r/` are produced at
  build time from tracked source. Report the **source** problem rather than
  the generated output.
- Automated leakage guards already run in the test suite for generated Agent
  Kit artifacts (absolute paths, env-var references, credential-shaped
  strings). If you find a gap those checks miss, that is a genuinely useful
  report.
