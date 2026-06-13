package clean

// @agent-contract
// - Returns true when the slice is non-empty, false otherwise.
// - Does NOT: validate element contents.
func NonEmpty(items []int) bool {
	return len(items) > 0
}
