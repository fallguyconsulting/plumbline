#!/usr/bin/env bash
set -uo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
plumbline="$here/../bin/plumbline"
fixtures="$here/fixtures"
fail=0

run_case() {
  local name=$1
  local dir=$2
  local expected_exit=$3
  local expected_substr=$4

  local output
  output=$(node "$plumbline" "$dir" 2>&1)
  local actual_exit=$?

  if [ "$actual_exit" -ne "$expected_exit" ]; then
    echo "FAIL: $name — expected exit $expected_exit, got $actual_exit"
    echo "$output" | sed 's/^/    /'
    fail=1
    return
  fi

  if [ -n "$expected_substr" ] && ! echo "$output" | grep -q -- "$expected_substr"; then
    echo "FAIL: $name — expected output to contain '$expected_substr'"
    echo "$output" | sed 's/^/    /'
    fail=1
    return
  fi

  echo "ok: $name"
}

run_case "clean"                  "$fixtures/clean"                  0 ""
run_case "invariant-covered"      "$fixtures/invariant-covered"      0 ""
run_case "godoc-clean"            "$fixtures/godoc-clean"            0 ""
run_case "jsdoc-clean"            "$fixtures/jsdoc-clean"            0 ""
run_case "comment-hygiene"        "$fixtures/comment-hygiene"        2 "plumbline/comment-hygiene"
run_case "source-missing-file"    "$fixtures/source-missing-file"    2 "plumbline/source-missing-file"
run_case "source-missing-symbol"  "$fixtures/source-missing-symbol"  2 "plumbline/source-missing-symbol"
run_case "source-missing-symbol-doublecolon" "$fixtures/source-missing-symbol-doublecolon" 2 "plumbline/source-missing-symbol"
run_case "invariant-uncovered"    "$fixtures/invariant-uncovered"    2 "plumbline/blessed-invariant-uncovered"

if [ $fail -eq 0 ]; then
  echo "---"
  echo "all tests passed"
fi
exit $fail
