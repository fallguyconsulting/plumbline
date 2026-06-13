---
name: link-tests
description: For each @blessed-invariant: slug that has no test coverage, suggest the closest test files that probably exercise it (by package co-location), and propose the exact comment line to add.
---

# /plumbline:link-tests

Walk every `@blessed-invariant: <slug>` annotation in the codebase. For each whose slug doesn't appear in any test file, find the closest test files by walking up from the annotation site toward the repo root and propose them as candidates for adding a slug reference.

## What this does

1. Run a partial lint that collects every `@blessed-invariant:` annotation.
2. For each slug whose ID has no mention in any test file, walk the annotation site's directory tree upward until test files appear; surface the closest set.
3. Print the proposed fix line: `// @blessed-invariant: <slug> — exercised here`.

## Run

```bash
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" link-tests .
```

## After the script runs

For each uncovered slug:

- Present the candidate test files to the user.
- If only one candidate is plausible, propose adding the line at the top of that file.
- If multiple candidates, ask the user which test actually exercises the invariant (the heuristic is co-location, not semantic — the closest test isn't always the right one).

Do not modify files without confirmation.
