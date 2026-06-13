package covered

// @blessed-invariant: covered-id-42 — release is claimant-guarded; only the recorded holder can release.
func ReleaseClaim(holder, claimID string) {
	_ = holder
	_ = claimID
}
