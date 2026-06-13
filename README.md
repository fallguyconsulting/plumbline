# Plumbline

**Code that runs true under agentic maintenance.**

Plumbline is a methodology for writing code that AI coding agents can safely maintain in parallel, across model generations, and at scale. It packages as a Claude Code plugin that installs the project rules into any consuming codebase, with lint tooling to follow.

## Install

This repository is its own single-plugin marketplace (the catalog lives at `.claude-plugin/marketplace.json` under the marketplace name `fallguy`). In Claude Code:

```
/plugin marketplace add fallguyconsulting/plumbline
/plugin install plumbline@fallguy
```

## Quick start

In any project:

```
/plumbline:affirm
```

This writes `.claude/rules/plumbline-cheatsheet.md` into the current project — the rules file every Claude Code session in the project will read. Commit it. Re-run `/plumbline:affirm` after a plugin upgrade to pick up the latest canonical cheatsheet.

With the plugin installed, the `PostToolUse` hook runs `plumbline` on every Edit/Write automatically and blocks (exit 2) when violations are found, so the agent sees the message and fixes in the same turn.

## Documents

- [docs/plumbline-manifesto.md](docs/plumbline-manifesto.md) — the philosophy: why agentic maintenance needs different design priorities and the cost model the methodology serves.
- [docs/plumbline-style-guide.md](docs/plumbline-style-guide.md) — the actionable rules: how to write Plumbline code, examples, the tag vocabulary, and a PR checklist.
- [docs/plumbline-cheatsheet.md](docs/plumbline-cheatsheet.md) — the compact form materialized into consuming projects by `/plumbline:affirm`.

## Lineage

Plumbline grew out of the Cold Read methodology. Cold Read v1 optimized for AI agents whose binding constraint was comprehension — fresh-context reading of unfamiliar code — and its prescriptions were context-complete files, tracked duplication instead of shared code, and a hard cap on import depth. Cold Read v2 reweighted the same goals around verification, since comprehension stopped being the bottleneck and verification did not. Plumbline v1 takes Cold Read v2's content forward under a name that describes the goal — code that runs true — rather than the agent's reading condition.

## Status

- **v0.3 (current)** — A full compliance toolchain on top of the lint: `/plumbline:patterns` clusters violations by shape, `/plumbline:budget` ratchets too-noisy checks down over time, `/plumbline:suggest` proposes per-violation fixes, `/plumbline:slug` deterministically generates `@blessed-invariant:` slugs from prose, `/plumbline:starter` generates a project-shaped `.plumbline.json` from a repo scan, `/plumbline:doctor` diagnoses the installation, `/plumbline:explain` looks up the meaning and examples for each check or tag, `/plumbline:ci` emits a workflow for GitHub Actions / GitLab CI / pre-commit, `/plumbline:link-tests` proposes test-side `@blessed-invariant:` slug references, `/plumbline:consolidate` finds `@source:` mirrors that have grown too similar to their canonical to justify the copy. The lint also gained GoDoc + JSDoc convention exemptions for the comment-hygiene check.
- **v0.2** — Lint binary (comment hygiene, `@source:` validity, `@blessed-invariant:` test coverage), `PostToolUse` hook on Edit/Write, `/plumbline:audit`.
- **v0.1** — Manifesto, style guide, cheatsheet, `/plumbline:affirm`.

## Subcommands

The `plumbline` binary is a multi-tool CLI. The default (no subcommand) is the lint:

```
plumbline                              # lint cwd
plumbline <path>                       # lint a path
plumbline patterns [path]              # cluster violations by shape
plumbline budget save|check [path]     # ratchet baseline
plumbline suggest [path]               # propose per-violation fixes
plumbline slug "<prose>"               # generate a kebab-case slug
plumbline starter [path]               # generate a starter .plumbline.json
plumbline doctor [path]                # diagnose installation
plumbline explain [<topic>]            # show docs for a check or tag
plumbline ci github|gitlab|pre-commit  # emit a CI workflow
plumbline link-tests [path]            # propose test-side slug references
plumbline consolidate [path]           # find @source: mirrors to collapse
```

Each subcommand is also wrapped as a Claude Code skill: `/plumbline:patterns`, `/plumbline:budget`, and so on.

## Lint, config, and CI

The lint binary lives at `bin/plumbline` (Node.js, no build step). Invoke it directly:

```
node /path/to/plumbline-plugin/bin/plumbline [path]
```

Or from a hooked Claude Code session, it runs automatically after every Edit/Write.

Project config lives in `.plumbline.json` at the repo root (optional):

```json
{
  "tags_extend": ["@concept:", "@story:", "@decision:"],
  "ignore": ["generated/", "test/fixtures/"],
  "checks": {
    "comment_hygiene": true,
    "source_validity": true,
    "blessed_invariant_test_coverage": true
  }
}
```

For CI, run `node bin/plumbline .` from the project root and treat any non-zero exit as a failure.

## License

Apache-2.0. The methodology, docs, and tooling are designed for adoption — copy, modify, ship.
