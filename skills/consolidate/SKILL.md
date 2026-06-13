---
name: consolidate
description: Find @source: mirrors whose content is now very similar to their canonical (line-overlap ≥ 60%) — candidates for collapsing into a shared definition per strict DRY. Read-only — proposes consolidations.
---

# /plumbline:consolidate

Identify `@source:` mirror sites whose actual content has drifted very little from the canonical they cite. High similarity is a strong signal that the "divergence is expected" justification for the copy no longer holds — the right action is either to consolidate into a single shared definition (per strict DRY), or to explicitly mark the mirror `@diverged: true` with a `@reason:`.

## What this does

1. For every file containing `@source:` references, compute line-level Jaccard similarity against the cited canonical.
2. Skip mirrors that already carry `@diverged: true`.
3. Sort by similarity descending; print all pairs at ≥60% line-overlap.

## Run

```bash
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" consolidate .
```

## After the script runs

For each high-similarity pair:

- Read both files side-by-side and identify the actual differences.
- If the differences are accidental (typo, ordering, formatting), propose collapsing the mirror into a call to the canonical and removing the `@source:` annotation.
- If the differences are real but small, propose either parameterizing the shared definition to handle both cases, OR marking the mirror `@diverged: true` with a concrete reason.

Do not consolidate without confirming with the user; semantic equivalence (which the similarity heuristic only approximates) requires human judgment.
