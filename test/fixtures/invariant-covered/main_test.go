package covered

import "testing"

// @blessed-invariant: covered-id-42 — exercised here.
func TestCoveredId42(t *testing.T) {
	ReleaseClaim("alice", "claim-1")
}
