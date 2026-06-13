---
name: slug
description: Turn a prose invariant description into a stable kebab-case slug suitable for @blessed-invariant: identifiers. Deterministic — same input always yields the same slug.
---

# /plumbline:slug

Generate a slug from a prose description. Useful during `@blessed-invariant:` migrations when each existing prose annotation needs a stable identifier.

Algorithm: lowercase, strip stop-words (a, the, must, etc.), take up to 5 remaining significant words, kebab-case them. The result is the same every time — if the slug looks wrong, edit the prose; the slug responds.

## Usage

```
/plumbline:slug Callback determinism — phase-check + state transition must occur in same tx
→ callback-determinism-phase-check-state-transition
```

## Run

```bash
prose="$*"
if [ -z "$prose" ]; then
  echo "usage: /plumbline:slug <prose description>" >&2
  exit 1
fi
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" slug "$prose"
```

## After the script runs

The slug is a draft — the user can shorten it (the full thing is often too long) or replace it with a hand-picked name. Common refinements: drop trailing modifiers ("callback-determinism" instead of "callback-determinism-phase-check-state-transition"), use domain terms over implementation terms.
