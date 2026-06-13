# Plumbline Style Guide

This guide defines how to write code for AI agent-assisted development under the Plumbline methodology. Follow these rules when writing new code or modifying existing code.

For the philosophy behind these rules, see the [Plumbline Manifesto](./plumbline-manifesto.md). The one-line summary: **comprehension is cheap for current agents; verification is not.** Every rule here either makes wrong edits fail mechanically, keeps blast radius enumerable, or keeps behavior visible where it is written.

---

## File Organization

### One Feature Per File

Each distinct feature, endpoint, or operation gets its own file. Group code by what it does, not by what technical role it plays.

```
features/
  orders/
    create.py          # POST /orders
    list.py            # GET /orders
    cancel.py          # POST /orders/:id/cancel
    types.py           # shared types for the orders feature
```

Do **not** split by abstraction layer (`controllers/`, `services/`, `repositories/`).

### Shallow, Feature-Shaped Directories

Keep the tree as shallow as the project's real structure allows. Directory structure should mirror the project's module and layer architecture (which dependency lint enforces) — never an abstraction taxonomy. `src/modules/features/orders/services/create/handler.py` is five levels of taxonomy; `features/orders/create.py` is the same code.

### Co-locate Related Files

Tests, types, and helpers live next to the code they support.

```
features/orders/
  create.py
  create_test.py
  types.py
```

Do not separate tests into a parallel directory tree.

### Feature Index

Maintain a `feature-index.md` at the repository root mapping features to their primary directories, layer, dependencies, and one-line purpose. Update it when adding a feature, changing a feature's dependencies, or changing ownership. It is the cheap navigation surface for a cold session.

---

## Code Structure

### File Length Guideline: ~500 Lines

A guideline, not a hard rule — semantic cohesion beats line counts. The rationale is **edit granularity, not readability**: agents read large files selectively without trouble, but a large file is a contention hotspot when multiple agents work in parallel, and a larger blast surface per edit. Split oversized files by sub-feature, never by abstraction layer.

### Function Length Guideline: ~100 Lines

Extract helpers into the same file when needed. A 120-line function that does one clear thing beats an artificial split.

### Maximum Nesting Depth: 3 Levels

Use early returns to flatten control flow.

```python
def process(data):
    if not data:
        return Error("no data")
    if not data.valid:
        return Error("invalid data")
    # actual logic here, at depth 1
```

---

## Abstraction and DRY

### One Place Per Behavior

Semantically identical logic lives in exactly one place. When you find yourself writing logic that exists elsewhere, share it — do not copy it. The threshold for extraction is **semantic identity**, not a call-site count: if two sites must always change together, they are one behavior and belong in one definition.

Do not extract trivia. A one-line comprehension inlined at two sites is not a shared behavior; wrapping it in a utility adds a hop for nothing.

### Shared Code Must Resolve Statically

Every abstraction must be reachable by symbol search and declared types — from any call site to the behavior, and from the definition to every consumer.

**Allowed:**
- Named functions and methods, called directly
- Interfaces whose implementations are statically enumerable
- Explicit composition — dependencies passed as parameters
- Generics with visible instantiation sites

**Forbidden:**
- Behavior-modifying decorators (`@retry`, `@cached`, `@transactional`)
- Dependency-injection containers and runtime wiring by type
- Reflection-driven dispatch, string-built symbol lookup
- Convention-based registration (file path determines route, name determines binding)
- Implicit middleware chains
- Base classes that must be read to understand a subclass's behavior; anything named "Base", "Abstract", or "Manager"

Deep call chains through *named, searchable* functions are fine. The forbidden list is about runtime wiring that grep and the type checker cannot see — not about depth.

### Shared Code Carries an Isolated Contract Check

Shared code earns its sharing by being verifiable without booting the world. Before extracting or widening shared code, ensure:

1. **A contract suite exists** — fast, unit-level tests at the abstraction boundary, runnable in isolation, pinning the behavior consumers rely on.
2. **Consumers are enumerable** — the type system or a symbol search yields the complete consumer set.
3. **An `@agent-contract` block states the negative space** — what the code does NOT handle (see Comments and Annotations).

When multiple implementations satisfy one interface, the contract suite runs against **all** of them (a conformance suite). This is what keeps parallel implementations honest without copy-tracking discipline.

### Check Speed Is a Placement Criterion

When deciding where logic lives, ask: *what is the cheapest check that covers it there?* Logic placed where only a slow integration suite exercises it forces every future edit through that slow loop, and slow loops make agents batch changes, which makes failures harder to attribute. Prefer placements covered by fast, isolated suites; treat "only testable end-to-end" as a design smell.

### The Narrow Survival of `@source:`

Copying code is permitted in exactly one situation: two pieces of code are **coincidentally similar but semantically independent** — future divergence is *expected*, and a shared abstraction would couple things that must be free to differ. The canonical example: two database drivers implementing one interface with intentionally different SQL, kept honest by a shared conformance suite.

In that situation:

- Annotate the copy: `@source: path/to/file::symbol` (`::` is preferred; single `:` is accepted for back-compat)
- When the copy diverges, mark it: `@diverged: true` + `@reason: <why>`
- When modifying a canonical source, grep for its `@source:` references and visit each copy — apply, or mark diverged with a reason.

If you cannot articulate why the two sites are expected to diverge, they are one behavior — share them instead.

---

## Mechanical Checks

Every written-down constraint needs a check that fails when an agent violates it. The conversion table:

| Constraint | Required check |
| --- | --- |
| Import / layering rules | Dependency lint (e.g. depguard). Lint config is authoritative; if prose and lint disagree, lint wins. |
| Behavioral invariant | `@blessed-invariant` annotation at the enforcement site **plus** a test that exercises the invariant. An annotation without a test is an unfinished invariant. |
| Wire / protocol contract | Conformance suite runnable against any implementation. |
| Data shape at a boundary | Explicit type or schema — the compiler is the check. |
| Style and idiom | Formatter + lint rules, not reviewer vigilance. |
| Comment hygiene | Lint: every comment opens with a structured tag or a machine directive (see below). |

### Blessed Invariants

A blessed invariant is a cross-cutting correctness or security property that must hold system-wide. Requirements:

1. `@blessed-invariant` annotation at the code site that enforces it, naming the invariant
2. A test that fails if the invariant is violated
3. An `@agent-contract` block if the enforcing code is shared infrastructure

```python
# @blessed-invariant: claimant-guarded-release — only the holder recorded on the
# claim row may release it; enforced here by the claimant_id guard in the UPDATE.
def release_claim(db, claim_id, claimant_id):
    ...
```

---

## Comments and Annotations

### Every Comment Is Tagged or Deleted

Prose comments restating what code does are noise to an agent and a drift hazard: agents weight comments as intent signals, so a stale comment can pull an agent toward "fixing" correct code to match it. Most comment volume in agent-written code is **generation residue** — narration addressed to the change's reviewer ("handle the error case", "this ensures X") — and must be cleaned up after writing. No ad hoc agentic reasoning persists in the codebase.

The rule, which is lint-enforceable:

- **Every comment begins with a structured tag** from the vocabulary below (projects may extend it).
- **Machine directives are exempt**: build tags, generate directives, lint suppressions, license headers (Copyright/SPDX/Licensed-under/Dual-licensed lines).
- **Language documentation conventions are exempt**: for Go, the lint recognizes GoDoc-style comments (a comment whose first word names the declaration on the next non-comment line — `func Foo`, `type Bar`, `var Baz`, `const Quux`, struct fields, or the program-name comment preceding `package main`). For TypeScript/JavaScript, block comments (`/* */` / `/** */`) that open with a capitalized word and directly precede an exported or top-level declaration (`function`, `class`, `interface`, `type`, `const`/`let`/`var`, `enum`, `namespace`, methods, fields) are recognized as JSDoc-style documentation.
- **Anything else is residue** — delete it on sight, including in code you didn't write (it will be regenerated as precedent otherwise).

If information feels like it needs a comment but fits no tag, it belongs in a better name, a type, or nowhere.

### Tag Vocabulary

| Tag | Carries | Example |
| --- | --- | --- |
| `@constraint:` | A requirement imposed from outside that the code cannot express — lock ordering, an external system's behavior, a wire-format fact | `# @constraint: postgres requires acquiring instance locks before frame locks; reversing deadlocks under load` |
| `@deliberate:` | A guard on intentionally surprising code — why the obvious alternative is wrong, so a cleanup pass doesn't break it | `# @deliberate: not batched — each row must commit independently per invariant 4` |
| `@agent-contract` | The contract of shared code, weighted toward negative space: guarantees, and what the caller must handle | see below |
| `@blessed-invariant:` | A named cross-cutting invariant at its enforcement site | see Mechanical Checks |
| `@source:` / `@diverged:` / `@reason:` | Tracked mirror of semantically independent code | see Abstraction and DRY |

Projects extend the vocabulary with their own structured tags (e.g. design-model citations like `@concept:`); the requirement is only that every tag is declared, greppable, and lintable.

### `@agent-contract` Blocks

Write them on shared infrastructure. Weight them toward what an agent **cannot learn by reading the implementation** — guarantees, non-guarantees, and caller responsibilities. Do not write usage tutorials; agents read implementations cheaply.

```python
# @agent-contract
# - Guarantees: transactions roll back on unhandled exception; safe for concurrent use
# - Does NOT handle: retries (caller's responsibility), async contexts (use async_database)
# - Pool size: cfg database.pool_size
class Database:
    ...
```

---

## Uniformity

### One Idiom Per Job

Agents write by precedent: new code is generated to resemble the surrounding corpus, so every pattern in the repo propagates. Consequences:

- **Idiom decisions are repo-level decisions.** Never introduce a second way to do something one way already exists for — error shapes, test layout, config access, logging — however locally appealing.
- **The first instance of a new pattern is load-bearing.** Write it as the template it will become.
- **No coexisting dialects.** When an idiom is improved, sweep the old one out everywhere in the same change. Two live styles read to a cold agent as two sanctioned options, and drift compounds.
- **Prefer plain over clever.** A clever construction is a second dialect; the plain version costs an agent nothing to read.

Whatever uniformity can be lint-enforced, lint-enforce — lint is the only thing that holds style across sessions that never met each other.

---

## Explicit Code

### Dependencies as Parameters

```python
def create_order(db: Database, cache: Cache, data: OrderInput) -> Order:
    ...
```

Not injected fields, not ambient globals, not container-resolved.

### Explicit Registration

Routes, handlers, subscriptions, and bindings are registered in visible code, in one findable place — never derived from file paths or naming conventions.

### Configuration as Visible Values

One explicit configuration object, read at the edge and passed in — not environment lookups scattered through logic.

```python
@dataclass
class OrderConfig:
    timeout: int = 30
    retries: int = 3
```

---

## Types at Boundaries

Define explicit types for API inputs and outputs, database models, interfaces between features, external service contracts, and configuration. The boundary type is the contract's mechanical check — the compiler enforcing what prose cannot.

Inside a feature, be pragmatic; typing every internal variable is not required.

---

## Error Handling

- Prefer explicit error returns (or result types) over exceptions for expected failure cases.
- Never catch a bare top-level exception type; catch specific errors, re-raise what you can't handle.

---

## Testing

- Test files live next to the code they test.
- Each test file is runnable independently — no shared fixture files that must be understood to read the tests.
- Name tests for the scenario, not the implementation: `test_create_order_fails_when_inventory_insufficient`.
- Shared code's contract suite is fast and isolated (see Abstraction and DRY); integration suites confirm, unit contracts discover.

---

## Repo-Wide Changes

### Changing Shared Code

1. Edit the single definition.
2. Let the toolchain enumerate the blast radius — compiler errors, contract-suite failures, caller searches.
3. Fix all consumers in the same change.

This is the normal, preferred mode of cross-cutting change. It produces mechanical failures that announce themselves, rather than silent drift.

### Changing an Idiom

1. Decide the new idiom once, repo-level.
2. Sweep every instance of the old idiom in the same change — no coexisting generations.
3. Add or update a lint rule so the old idiom cannot return.

### Changing a Tracked Mirror

Only relevant to the narrow `@source:` case: grep for `@source:` references to the canonical site, visit each copy, apply or mark diverged with a reason.

---

## Enforcement

Configure lint/CI to check, at minimum:

- **Dependency direction and purity** — the project's layering rules as lint (depguard or equivalent)
- **Comment hygiene** — every comment opens with a structured tag or machine directive
- **`@source:` validity** — referenced files and symbols exist
- **`@blessed-invariant` coverage** — each annotation has a corresponding test (greppable pairing)
- **Formatter + style lint** — uniformity held mechanically
- **File length** — warn above the guideline

---

## PR Review Checklist

### Structure
- [ ] Features in their own files; no layer-split
- [ ] Files ~500 lines or less (or good reason); functions ~100 or less; nesting ≤ 3
- [ ] Dependencies are explicit parameters; registration is explicit
- [ ] Types at all boundaries

### DRY and Abstraction
- [ ] No semantically identical logic in two places
- [ ] New/changed shared code resolves statically (no dynamic indirection)
- [ ] Shared code has an isolated contract suite and an `@agent-contract` block
- [ ] Any `@source:` copy has an articulated divergence-expectation; diverged copies carry `@reason`

### Checks
- [ ] Every new constraint has a mechanical check (lint / test / type / conformance)
- [ ] New `@blessed-invariant` annotations have exercising tests
- [ ] Fast isolated checks cover the changed logic; the change was verified with them

### Comments and Uniformity
- [ ] Every comment opens with a structured tag; no narration residue
- [ ] No second idiom introduced for a job that has one; idiom changes swept repo-wide
- [ ] Tests co-located and independently runnable

---

## Quick Reference

| Do | Don't |
| --- | --- |
| One place per behavior (strict DRY) | Copy logic between sites |
| Named, searchable abstraction | Reflection, DI containers, convention magic |
| Contract suite isolated at the boundary | Shared code testable only end-to-end |
| Constraint → lint / test / type | Constraint as prose only |
| One idiom per job, swept on change | Coexisting style generations |
| Tagged comments only | Narration, restating code, untagged prose |
| `@agent-contract` = guarantees + negative space | Usage tutorials in comments |
| Types at boundaries | Types on every internal variable |
| Explicit parameters and registration | Injected, ambient, or path-derived wiring |
| Co-located tests | Parallel test tree |
| Early returns | Deep nesting |
| `@source:` only for expected divergence | `@source:` as a license to copy |

---

## Annotation Reference

### @constraint:
An externally imposed requirement the code cannot express.
```python
# @constraint: external API returns 429 with no Retry-After; poll interval must stay >= 1s
```

### @deliberate:
Guards intentionally surprising code against cleanup.
```python
# @deliberate: sequential on purpose — parallel writes violate the per-instance ordering invariant
```

### @agent-contract
Contract of shared code: guarantees, non-guarantees, caller responsibilities.
```python
# @agent-contract
# - Guarantees: ...
# - Does NOT handle: ...
```

### @blessed-invariant:
Named cross-cutting invariant at its enforcement site; must have an exercising test.
```python
# @blessed-invariant: <name> — <one-line statement>; enforced here by <mechanism>
```

### @source: / @diverged: / @reason:
Tracked mirror of semantically independent code (narrow use only).
```python
# @source: path/to/file::symbol
# @diverged: true
# @reason: drivers intentionally differ in SQL dialect
```
