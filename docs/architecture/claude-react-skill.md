# Claude React skill (`skrewww-react`)

Internal note. Not public documentation and not marketing material.

## What it is

A Claude Code skill that encodes the **stable engineering rules** for working
in this repository: authority order, API/token semantics, Figma↔React boundary,
distribution and generated-file rules, Agent Kit and Guard boundaries,
validation, git/parallel-work safety, phase discipline, and release policy.

It deliberately contains **no project state** (phase, counts, versions, SHAs,
CI status, blockers). Those stay in [`../project-status.md`](../project-status.md)
and the canonical sources, and the skill tells Claude to read them at task time.

## Where it lives

- Canonical, reviewed source: [`skills/skrewww-react/SKILL.md`](../../skills/skrewww-react/SKILL.md)
- Live install (per developer, **gitignored** because `.claude/` is ignored
  repo-wide): `.claude/skills/skrewww-react/SKILL.md`

Install or refresh the live copy from the repository root:

```bash
mkdir -p .claude/skills/skrewww-react && cp skills/skrewww-react/SKILL.md .claude/skills/skrewww-react/SKILL.md
```

The installed file is a copy. Edit the canonical file, then re-copy. This mirrors
the existing `skrewww-ui` convention (canonical source in the repo, ignored
adapter under `.claude/skills/`).

The same command syncs a fresh clone, and re-running it refreshes an existing
install. There is no installer script, symlink, or `package.json` entry yet.

### Drift check

Run after pulling, or after editing the canonical file. It prints `STALE` when
the installed copy differs from the reviewed source (or is missing):

```bash
cmp -s skills/skrewww-react/SKILL.md \
  .claude/skills/skrewww-react/SKILL.md \
  || echo "STALE"
```

If it prints `STALE`, re-run the install command above. Start a new Claude Code
session afterwards: a session can keep serving a copy it loaded earlier.

## How to use it

Claude Code loads it automatically when a task matches its `description`, or you
can invoke it by name (`/skrewww-react`). It works in five modes: BUILD, AUDIT,
FIX, DISTRIBUTE, VALIDATE.

## Scope

In scope: code-side work in this repository.

Outside it:

- Consuming Skrewww in a consumer app — use `skrewww-ui` (`agent/skill/SKILL.md`).
- Figma-side work — the separately maintained Figma Community skill.
- Live project status — [`../project-status.md`](../project-status.md).
- Guard rule design — the Guard docs and readiness audit; this skill only
  describes Guard's boundaries.
- Building Consumer Contract Verification (real installed-consumer validation) —
  a separate validation layer from Guard; the skill records the boundary and
  points at the existing `smoke:consumer` harness, but does not implement it.

## Updating it

Change the skill only when a **stable** rule changes: authority order, registry
field semantics, generator contract, git/release policy. When you do, verify the
new wording against the canonical source (registry type, generator, CI) rather
than memory. Never add counts, versions, SHAs, phase names, or blockers. If a
fact could go stale within weeks, it belongs in `project-status.md`.
