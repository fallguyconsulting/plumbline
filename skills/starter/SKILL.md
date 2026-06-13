---
name: starter
description: Generate a project-shaped .plumbline.json by scanning the repo for known patterns (Go module, Node package, ok-planner sibling, generated dirs). Output to stdout; user reviews and saves.
---

# /plumbline:starter

Print a starter `.plumbline.json` configured for the project's actual shape. Detects:

- Go module (`go.mod`) — adds known generated-code dirs to ignore
- Node package (`package.json`) — adds .next, .turbo, storybook-static to ignore
- ok-planner sibling (`.ok-planner/`) — adds `@concept:`, `@story:`, `@decision:` to the tag vocabulary; adds `.ok-planner/` to ignore
- Generated-code dirs (`gen/`, `generated/`, `mocks/`, etc.) anywhere in the tree

Default check selection: `source_validity` and `blessed_invariant_test_coverage` on; `comment_hygiene` off (typically too noisy on a mature codebase — see `/plumbline:budget` for the ratcheted-cleanup path).

## Run

```bash
node "${CLAUDE_PLUGIN_ROOT%/}/bin/plumbline" starter .
```

## After the script runs

Review the proposed config with the user. Common adjustments:

- Add project-specific tags they use (e.g. `@story:`, `@status:`).
- Add directories the heuristic missed (e.g. an internal `dist/` location).
- Toggle `comment_hygiene` on if the codebase is small enough to enforce strictly from day one.

Propose saving as `.plumbline.json` at the repo root once the user is happy.
