# Porting an existing codebase to Plumbline

This guide is for project maintainers who have an existing codebase and want to adopt Plumbline. It describes the typical migration arc and is meant to be consumable by a planner (human or orchestrator like ok-planner) as the structural input to a port plan.

For methodology, read the [Manifesto](./plumbline-manifesto.md). For day-to-day rules, read the [Style Guide](./plumbline-style-guide.md). This document is specifically about the **trajectory** from "we just decided to adopt Plumbline" to "Plumbline is enforced on every change."

---

## The trajectory in one paragraph

Plumbline adoption goes through five phases. **Adopt**: install the plugin, materialize the cheatsheet, generate a project-shaped `.plumbline.json`. **Audit**: turn each check on briefly, see how big the backlog is per check, record the numbers. **Sweep the mechanical**: for `source_validity` and `blessed_invariant_test_coverage`, the violations are addressable in one pass each — normalize paths, slugify prose, link tests, enable the check. **Ratchet the unmechanical**: for `comment_hygiene` on a mature codebase, the violation count is too large for a single sweep — record a baseline in `.plumbline-budget.json` and let CI enforce the one-way slope down. **Maintain**: the `PostToolUse` hook catches new violations in flight; CI's `plumbline budget check` prevents regression; the ratchet converges over time.

The rest of this document expands each phase, names the tool sequence, identifies the decision points, and provides a plan template a planner can use to generate concrete tasks.

---

## Phase 0: Adopt

**Goal**: Plumbline is installed in the project, sessions read the cheatsheet, the config reflects the project's actual shape.

**Tasks** (one commit per task; can be combined):

1. **Install the plugin.** From a Claude Code session in the project:
   ```
   /plugin marketplace add fallguyconsulting/plumbline
   /plugin install plumbline@fallguy
   ```
   For local development of plumbline itself, point the marketplace at a local path.

2. **Materialize the cheatsheet.** Run `/plumbline:affirm`. This writes `.claude/rules/plumbline-cheatsheet.md`. Commit it. (The committed copy is what contributors without the plugin will read.)

3. **Generate the project config.** Run `/plumbline:starter`. It scans the repo (detects Go module, Node package, ok-planner sibling, generated dirs) and emits a `.plumbline.json` to stdout. Review with the user, save at the repo root, commit. Default check state: `source_validity` and `blessed_invariant_test_coverage` on, `comment_hygiene` off — the right starting point for most codebases.

4. **Record the decision.** Add an `as-is` decision artifact stating that this project uses Plumbline as its coding methodology. If the project uses ok-planner, this is a `decision:` slug; if it uses some other system, follow that system's convention. The decision body should name the plugin, the materialized cheatsheet path, and the current check selection — not the methodology's rules themselves (those live in the plugin, not the project).

**Decision points in this phase**:
- *Should `comment_hygiene` start enabled?* Only if the codebase is small enough (under ~500 source files, or built greenfield with Plumbline in mind from day one). For everything else, leave it off and address it in Phase 3 via the ratchet. The default `/plumbline:starter` output is correct for the typical case.
- *Should generated directories be in the ignore list?* Yes, always. The starter detects common ones (`gen/`, `proto/gen/`, `.next/`, etc.); add anything specific to your build.
- *Should the `tags_extend` field include design-citation tags?* If the project uses `@concept:` / `@story:` / `@decision:` annotations (the ok-planner shape), yes — `/plumbline:starter` adds them automatically when it sees `.ok-planner/`.

**Phase 0 exit criteria**:
- `/plumbline:doctor` reports `healthy`.
- `.plumbline.json` is committed at the repo root.
- `.claude/rules/plumbline-cheatsheet.md` is committed.
- The methodology decision is recorded.

---

## Phase 1: Audit

**Goal**: Know the size of each check's backlog before deciding how to attack it.

**Tasks**:

1. **Run the full lint** with all three checks temporarily on (edit `.plumbline.json` to enable, run `plumbline .`, count by category, then revert the edit). Concretely:
   ```bash
   cp .plumbline.json /tmp/cfg.bak
   sed -i '' 's/"comment_hygiene": false/"comment_hygiene": true/' .plumbline.json
   plumbline . > /tmp/audit.out 2>&1
   cp /tmp/cfg.bak .plumbline.json
   grep -oE "plumbline/[a-z-]+" /tmp/audit.out | sort | uniq -c | sort -rn
   ```

2. **Cluster the violations.** Run `/plumbline:patterns` for the same atomic enable/audit/restore dance. This groups violations by shape — path-prefix clusters for `source-missing-file`, slug clusters for `blessed-invariant-uncovered`, kind clusters for `comment-hygiene`. The cluster sizes tell you which mechanical sweep is real work vs. an afternoon.

3. **Record the numbers.** Put the per-check baseline counts somewhere the planner will see — a checklist file, a tracking issue, or a `## Migration backlog` section in the project's CLAUDE.md / readme.

**Decision points in this phase**:
- *Which check has the largest backlog?* That one probably needs the budget ratchet (Phase 3); the smaller ones get mechanical sweeps (Phase 2).
- *Are any clusters unexpectedly large?* That can signal a systemic issue (e.g. a whole module using non-standard annotations). May warrant its own commit before the broader sweep.

**Phase 1 exit criteria**:
- Per-check violation counts are recorded.
- Pattern clusters are reviewed; large surprises are understood.
- The plan for which check goes to "sweep" vs "ratchet" is decided.

---

## Phase 2: Sweep what's mechanical

**Goal**: Land `source_validity` and `blessed_invariant_test_coverage` as enforced checks. They almost always sweep cleanly.

### 2a: `@source:` path-prefix normalization

Most legacy `@source:` annotations were written with paths relative to a module root rather than the repo root. The lint expects repo-root paths.

1. **Enable** `source_validity: true` in `.plumbline.json`.
2. **Cluster**: `/plumbline:patterns` groups violations by leading path token (e.g. `prefix:runtime/`, `prefix:foundation/`).
3. **Map**: for each cluster, identify the canonical repo-root prefix. The natural mapping (e.g. `runtime/` → `lib/runtime/`) is usually obvious.
4. **Sweep**: bulk-rewrite via `sed`. Drive the file list from the lint output, not from `find` — the lint already enumerated every file containing a violating annotation.
5. **Verify**: re-run `plumbline .`; iterate on remaining stragglers (mid-prose annotations, trailing punctuation, etc.).
6. **Commit**.

### 2b: `@blessed-invariant:` slug normalization

Legacy annotations often use prose-after-colon (`@blessed-invariant: Callback determinism...`) rather than slug-first form. The lint needs slugs to perform the test-coverage join.

1. **Enable** `blessed_invariant_test_coverage: true`.
2. **List unique annotations**: `grep -rh "@blessed-invariant:" --include="*.go" | sort -u`.
3. **Slugify**: for each unique prose, run `/plumbline:slug "<prose>"` to get a kebab-case slug. The slug is deterministic; the user can refine.
4. **Rewrite**: `sed` each prose form into `<slug> — <prose>` form. The slug becomes the parsed identifier; the original prose stays as descriptive continuation.
5. **Link tests**: run `/plumbline:link-tests` to find slugs without test references. For each uncovered slug, add a `// @blessed-invariant: <slug> — exercised here` line in the closest test file.
6. **Verify**: re-run `plumbline .` clean.
7. **Commit**.

**Decision points in Phase 2**:
- *What if `@source:` references a file that no longer exists?* Either consolidate (the mirror should disappear with the canonical) or remove the annotation (the mirror has been independently rewritten).
- *What if `/plumbline:slug` produces an ugly slug?* Edit the prose to be more concise — the slug responds to the prose shape. Or hand-pick a slug; the algorithm is a draft, not an oracle.
- *What if a test file doesn't obviously exist for an uncovered slug?* The invariant may be implicit / untested. Either add a real test that exercises it, or remove the annotation if the invariant is no longer load-bearing.

**Phase 2 exit criteria**:
- `source_validity: true` in `.plumbline.json`, committed.
- `blessed_invariant_test_coverage: true` in `.plumbline.json`, committed.
- `plumbline .` exits 0 with both checks on.

---

## Phase 3: Ratchet what's not

**Goal**: Address `comment_hygiene` (or any other check whose backlog is too large to sweep) via the budget ratchet. The check stays off in `.plumbline.json`; CI enforces a one-way-down baseline instead.

1. **Set the baseline**. With `comment_hygiene: true` temporarily enabled:
   ```
   /plumbline:budget save
   ```
   This writes `.plumbline-budget.json` with the current violation count + per-check breakdown.
2. **Disable the check** in `.plumbline.json`; commit both the budget file and the config change together.
3. **Wire CI**. Run `/plumbline:ci <platform>` to emit a workflow that runs both `plumbline .` (always must pass — the non-budget checks) and `plumbline budget check` (must not exceed baseline).
4. **Begin incremental cleanup**. Contributors tag comments as they touch them; periodically run `/plumbline:budget save` to ratchet the baseline down. The ratchet converges as long as PRs don't regress.

**Decision points in Phase 3**:
- *Should we hand-tag a chunk of comments now, or rely purely on incremental cleanup?* For a project that's actively being modified, incremental is fine. For a project on maintenance mode, a one-time bulk pass may be cheaper. Use `/plumbline:suggest` to get fix proposals for the most prevalent comment shapes.
- *Should we enable the check once the count reaches 0?* Yes — remove `.plumbline-budget.json`, flip `comment_hygiene: true`, commit. The ratchet becomes a permanent check.

**Phase 3 exit criteria** (for the long-term):
- `.plumbline-budget.json` is committed.
- CI runs `plumbline budget check`.
- The baseline is ratcheting down over time (track via the file's history).

**Phase 3 exit criteria** (for "fully migrated"):
- The baseline reaches 0.
- The budget file is removed; the check is enabled.

---

## Phase 4: Maintain

**Goal**: New code can't regress; legacy backlog converges.

This phase is structural, not task-based. Three mechanisms are in place:

- The `PostToolUse` hook runs `plumbline` on every edit and blocks (exit 2) on violations — the agent sees the message and fixes in the same turn.
- CI runs `plumbline .` on every PR — full lint + budget check.
- `/plumbline:consolidate` runs periodically (manual or scheduled) to find `@source:` mirrors that have grown too similar to their canonical to justify the copy. Each candidate is reviewed; the mirror either collapses or carries a `@diverged: true` + `@reason:`.

---

## Plan template

A planner generating a plumbline-port plan can use this template directly. Numbers in `<>` get filled in from a `/plumbline:port` run; the structure is invariant.

```
# Plumbline adoption plan

## Pass 1 — Adopt
- Install plumbline plugin
- Run /plumbline:affirm; commit .claude/rules/plumbline-cheatsheet.md
- Run /plumbline:starter; review; save .plumbline.json; commit
- Record decision: coding methodology is Plumbline

## Pass 2 — Audit
- Run full lint with all three checks (atomic enable/audit/restore)
- Record per-check baselines: source_validity=<N>, blessed_invariant=<M>, comment_hygiene=<K>
- Decide: sweeps vs ratchets per check

## Pass 3 — @source: sweep
- Enable source_validity in .plumbline.json
- Run /plumbline:patterns to identify path-prefix clusters
- For each cluster, bulk-sed the canonical path prefix
- Verify clean; commit

## Pass 4 — @blessed-invariant: slug sweep
- Enable blessed_invariant_test_coverage in .plumbline.json
- Slugify each unique prose annotation via /plumbline:slug
- Rewrite annotations to slug-first form
- Run /plumbline:link-tests; add test references for uncovered slugs
- Verify clean; commit

## Pass 5 — comment_hygiene ratchet
- Save baseline via /plumbline:budget save
- Confirm comment_hygiene: false in .plumbline.json; commit budget + config
- Run /plumbline:ci <platform>; integrate into project's CI
- Document the migration backlog in the project's CLAUDE.md

## Pass 6 (ongoing) — consolidate review
- Run /plumbline:consolidate periodically
- Per high-similarity pair: consolidate or mark diverged with reason
```

Adapt the per-pass detail to your orchestrator's task shape. For ok-planner: each pass above is one `## Pass N` in a plan file under `.ok-planner/plans/`. The `## Design changes` section captures the coding-style decision and the per-pass config updates.

---

## Reference: tool-by-tool quick map

When you need to... | Use this tool
:--- | :---
Install the rules into a project | `/plumbline:affirm`
Generate a starter config from a repo scan | `/plumbline:starter`
Check installation state | `/plumbline:doctor`
Look up what a tag means | `/plumbline:explain <tag>`
Look up what a check code means | `/plumbline:explain <code>`
See full lint output | `/plumbline:audit` (or plain `plumbline .`)
Group violations by shape for bulk action | `/plumbline:patterns`
Get per-violation fix proposals | `/plumbline:suggest`
Generate a slug from prose | `/plumbline:slug "<prose>"`
Find test files for uncovered slugs | `/plumbline:link-tests`
Find mirrors to consolidate | `/plumbline:consolidate`
Set the budget baseline | `/plumbline:budget save`
Enforce the budget in CI | `/plumbline:budget check`
Emit a CI workflow | `/plumbline:ci <platform>`

---

## Worked example: rimsky's adoption

The plumbline plugin was developed in parallel with rimsky's adoption of it; rimsky is the canonical worked example.

- **Phase 0**: One commit (`refactor: adopt Plumbline as rimsky's coding methodology`) — installed plugin, ran `/plumbline:affirm`, generated `.plumbline.json` via `/plumbline:starter`, retired the previous in-tree style docs, recorded `decision:coding-style`.
- **Phase 1**: Quick audit: source_validity=69, blessed_invariant=many, comment_hygiene=14,860. Decided to sweep #1 and #2, ratchet #3.
- **Phase 2a** (`refactor(@source): normalize all 78 @source: paths to repo-root form`): One commit. Path-prefix sweep across 24 files: `runtime/` → `lib/runtime/`, `foundation/` → `lib/foundation/`, etc.
- **Phase 2b** (`refactor(@blessed-invariant): slug-form prose annotations + test coverage`): One commit. Twelve unique invariants slugified, prose preserved as em-dash continuation, six test files gained slug references.
- **Phase 3** (`docs(coding-style): defer comment-hygiene; document GoDoc rationale`): Initially documented the deferral without a budget. (At plumbline v0.2.2 the GoDoc + license exemptions dropped the count from 14,860 to 6,934; at v0.3.0 the budget ratchet became available and is the next move when rimsky chooses to commit to the cleanup.)
- **Phase 4**: Two checks live; the hook + lint defend against regression. Comment-hygiene migration is queued as a long-running incremental effort once the budget is set.

The plumbline upstream gained five releases (v0.2.1 → v0.3.0) over the course of rimsky's adoption, each triggered by a problem the sweep surfaced. That feedback loop — using the tool on a real codebase and improving the tool from what the use revealed — is the recommended pattern for plumbline's continued development.
