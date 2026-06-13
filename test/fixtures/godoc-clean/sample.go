// Package godocclean exercises the Go GoDoc exemption: every comment below
// is untagged prose but follows Go's documentation convention, so the
// comment-hygiene check should pass without complaint.
package godocclean

// Foo does the foo thing for an integer.
func Foo(x int) int {
	return x + 1
}

// Bar is a typed value.
type Bar struct {
	// Name is the name field.
	Name string
}

// Method is a method on Bar.
func (b Bar) Method() string {
	return b.Name
}

// Threshold is a package-level constant.
const Threshold = 5

// Defaults is a package-level variable.
var Defaults = []int{1, 2, 3}

// helperLower is an unexported function with a doc comment.
func helperLower() int {
	return 0
}
