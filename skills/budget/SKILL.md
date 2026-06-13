---
name: budget
description: One-way violation ratchet for too-big-to-fix-now Plumbline checks. Records a baseline violation count in .plumbline-budget.json; CI fails any change that increases the count, accepts any that holds or decreases it.
---

# /plumbline:budget

Manage the Plumbline violation budget — the ratchet mechanism for incrementally cleaning up checks too noisy to enable outright (typically `comment_hygiene` on a mature codebase).

The budget file (`.plumbline-budget.json`) records the current violation count and per-check breakdown. CI invokes `plumbline budget check`; the lint exits 2 only if the count went UP, so PRs that hold or reduce the count pass.

## Usage

Without args, the skill checks current usage against the saved baseline. Pass `save` to record a new (typically lower) baseline.

```
/plumbline:budget          # report current vs baseline (CI-suitable)
/plumbline:budget save     # record current count as the new baseline
```

## Run

```bash
action="${1:-check}"
case "$action" in
  save)
    node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" budget save .
    ;;
  check)
    node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" budget check .
    ;;
  *)
    echo "usage: /plumbline:budget [save|check]" >&2
    exit 1
    ;;
esac
```

## After the script runs

- **Below baseline:** propose committing the new lower baseline with `/plumbline:budget save`. The ratchet is one-way; once committed, future increases fail CI.
- **At baseline:** no action needed.
- **Above baseline:** the lint has already exited 2; the change introduced new violations. Investigate which (the script breaks down by check code), propose fixes, or surface the design decision (sometimes new violations come from new code paths that genuinely need new tags).
