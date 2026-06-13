---
name: explain
description: Show examples and rationale for a specific Plumbline check code or tag. Use to teach a project's contributors what a tag means and when to use it, or to look up the format of a specific violation.
---

# /plumbline:explain

Look up the meaning, examples, and recommended use of a specific Plumbline concept — a check code (`comment-hygiene`, `source-missing-file`, etc.) or a tag (`@constraint:`, `@deliberate:`, `@agent-contract`, etc.).

## Usage

```
/plumbline:explain                          # list available topics
/plumbline:explain comment-hygiene
/plumbline:explain @constraint:
/plumbline:explain @blessed-invariant:
```

## Run

```bash
topic="${1:-}"
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" explain "$topic"
```

## After the script runs

Surface the explanation directly to the user. If they're trying to decide between two tags (e.g. `@constraint:` vs `@deliberate:`), suggest running `/plumbline:explain` for both and comparing the rationale sections.
