package missingsymbol

// @agent-contract
// - Defines a different symbol than the mirror's stale reference; that mismatch is the violation we expect.
// - Does NOT: define what the mirror points at.
func ActualSymbol() int {
	return 0
}
