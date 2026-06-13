---
name: suggest
description: Walk Plumbline lint violations and propose a fix for each — a specific tag, a path correction, a test-side slug reference. Read-only — proposes, does not apply.
---

# /plumbline:suggest

Per violation, propose a specific fix based on simple heuristics — keyword matches that suggest `@constraint:` vs `@deliberate:`, path-prefix patterns that suggest the canonical fix, slug-to-test matches. The suggestions are deterministic and noisy; treat them as a starting point, not an oracle.

## What this does

1. Runs the Plumbline lint on the current project.
2. For each violation, applies a heuristic:
   - Comment containing "must"/"always"/"requires" → propose `@constraint:`
   - Comment containing "intentionally"/"deliberate"/"on purpose" → propose `@deliberate:`
   - Comment containing "handle the error/case" → flag as residue
   - `source-missing-file`: propose `grep` for the basename and update the path
   - `blessed-invariant-uncovered`: propose the exact test-side reference line
3. Prints suggestions as proposed actions with rationale.

## Run

```bash
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" suggest .
```

## After the script runs

Walk the output with the user. For each suggestion:

- Confirm the proposed tag fits the comment's actual purpose (the heuristic gets it wrong sometimes — a comment about Postgres locking that happens to say "must" might still be a regular `@deliberate:`).
- For path suggestions, run the proposed `grep` to verify the target file exists.
- For test-side slug references, propose adding the line to the test file the user names.

Never bulk-apply suggestions; each one is a draft proposal.
