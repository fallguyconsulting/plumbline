# Plumbline

**Code that runs true under agentic maintenance.**

Plumbline is a methodology for writing code that AI coding agents can safely maintain in parallel, across model generations, and at scale. It packages as a Claude Code plugin that installs the project rules into any consuming codebase, with lint tooling to follow.

## Quick start

Install the plugin via your Claude Code marketplace, then in any project run:

```
/plumbline:affirm
```

This writes `.claude/rules/plumbline-cheatsheet.md` into the current project — the rules file every Claude Code session in the project will read. Commit it. Re-run `/plumbline:affirm` after a plugin upgrade to pick up the latest canonical cheatsheet.

## Documents

- [docs/plumbline-manifesto.md](docs/plumbline-manifesto.md) — the philosophy: why agentic maintenance needs different design priorities and the cost model the methodology serves.
- [docs/plumbline-style-guide.md](docs/plumbline-style-guide.md) — the actionable rules: how to write Plumbline code, examples, the tag vocabulary, and a PR checklist.
- [docs/plumbline-cheatsheet.md](docs/plumbline-cheatsheet.md) — the compact form materialized into consuming projects by `/plumbline:affirm`.

## Lineage

Plumbline grew out of the Cold Read methodology. Cold Read v1 optimized for AI agents whose binding constraint was comprehension — fresh-context reading of unfamiliar code — and its prescriptions were context-complete files, tracked duplication instead of shared code, and a hard cap on import depth. Cold Read v2 reweighted the same goals around verification, since comprehension stopped being the bottleneck and verification did not. Plumbline v1 takes Cold Read v2's content forward under a name that describes the goal — code that runs true — rather than the agent's reading condition.

## Status

- **v0.1 (current)** — Manifesto, style guide, cheatsheet, and the `/plumbline:affirm` skill that materializes the cheatsheet into a consuming project.
- **v0.2 (planned)** — The `plumbline` lint binary (comment-hygiene check, `@source:` validity, the blessed-invariant registry join), a `PostToolUse` hook that runs the lint on every edit, and `/plumbline:audit` for sweeping an existing codebase into compliance.

## License

Apache-2.0. The methodology, docs, and tooling are designed for adoption — copy, modify, ship.
