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

**Use GitHub Private Vulnerability Reporting** — verified enabled for this
repository:
[github.com/usmanfarooqi88/skrewwwDS/security/advisories/new](https://github.com/usmanfarooqi88/skrewwwDS/security/advisories/new).
This opens a private advisory visible only to you and the maintainer, with
its own discussion thread, so you can share exploit details and reproduction
steps safely.

**Do not open a public GitHub Issue for a security vulnerability.** Public
issues are for normal bugs (see the distinction above) — a public issue
containing exploit details for a genuine vulnerability puts other users at
risk before a fix ships.

If you are unable to use private reporting for some reason, do not post
exploit details publicly; open a minimal public issue asking for a private
contact route instead, and the maintainer will follow up through GitHub's
private advisory flow.

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
