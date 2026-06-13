---
name: patterns
description: Cluster Plumbline lint violations by shape so a hundred similar violations surface as one cluster with a proposed bulk fix. Read-only — proposes, does not apply.
---

# /plumbline:patterns

Run the Plumbline lint and group violations by shared shape (path prefix, missing slug, etc.) so cleanup can target classes of problems at once instead of one violation at a time.

## What this does

1. Runs `plumbline patterns .` from the project root.
2. The binary clusters violations: `source-missing-file` / `source-missing-symbol` by leading path token; `blessed-invariant-uncovered` by slug; `comment-hygiene` by overall kind.
3. Prints each cluster with count + up to three example sites.

## Run

```bash
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" patterns .
```

## After the script runs

For each cluster:
- If it's a path-prefix cluster (e.g. `prefix:runtime/`), the fix is usually a bulk path rewrite — surface the proposed substitution to the user.
- If it's a slug cluster (uncovered `@blessed-invariant:` for a single ID), the fix is adding the slug to one test file.
- If it's an untagged-comment cluster, point at `/plumbline:suggest` for per-comment tag proposals.

Do not apply bulk substitutions without confirming the substitution with the user.
