---
name: audit
description: Audit the current project against the Plumbline lint. Runs the lint across the whole codebase, groups violations by check category and by file, and surfaces a remediation plan distinguishing mechanical fixes from structural issues. Read-only — proposes fixes; does not apply them.
---

# /plumbline:audit

Run the Plumbline lint across the current project and analyze the findings.

## What this does

1. Run `plumbline .` from the project root.
2. Capture the violation report (exit 0 = clean, 2 = violations, 1 = internal error).
3. Group violations by check category and by file.
4. Distinguish:
   - **Mechanical** — `comment-hygiene` violations clear by tagging or removing prose; an agent can usually batch-fix these in one pass.
   - **Structural** — `source-missing-file` and `source-missing-symbol` indicate stale `@source:` citations; `blessed-invariant-uncovered` indicates missing test coverage. Both require judgment to fix correctly.
5. Surface a summary back to the user with a proposed remediation plan; do not apply fixes without confirmation.

## Run

```bash
set +e
output=$(node "${CLAUDE_PLUGIN_ROOT}/bin/plumbline" . 2>&1)
exit_code=$?

echo "$output"
echo "---"

if [ "$exit_code" -eq 0 ]; then
  echo "audit: clean — no Plumbline violations"
  exit 0
fi

if [ "$exit_code" -ne 2 ]; then
  echo "audit: lint failed with internal error (exit $exit_code)"
  exit "$exit_code"
fi

total=$(echo "$output" | grep -c "plumbline/")
echo "audit: $total violation(s)"

echo
echo "by category:"
echo "$output" | grep -oE "plumbline/[a-z-]+" | sort | uniq -c | sort -rn | sed 's/^/  /'

echo
echo "top files:"
echo "$output" | grep "plumbline/" | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -10 | sed 's/^/  /'

exit 0
```

## Reporting to the user

After the script completes, present:

- The totals and category breakdown the script printed.
- For each violation category, propose a remediation approach the user can authorize:
  - **comment-hygiene** — usually a mechanical sweep; offer to batch-fix by tagging or removing prose.
  - **source-missing-file / source-missing-symbol** — for each, propose either updating the `@source:` reference to the current canonical, marking `@diverged: true` with a reason, or removing the annotation if the mirror has been consolidated.
  - **blessed-invariant-uncovered** — for each identifier, propose either adding a test that exercises it or removing the annotation if the invariant has been retired.

Do not begin applying fixes until the user authorizes a specific category or file scope.
