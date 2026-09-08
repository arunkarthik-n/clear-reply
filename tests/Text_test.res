open NodeTest

test("unwrap trims", () => {
  equal(Text.unwrap("  hello  "), "hello")
})

test("unwrap strips a wrapping markdown fence", () => {
  equal(Text.unwrap("```\nThanks for waiting.\n```"), "Thanks for waiting.")
})

test("unwrap strips a fenced language tag", () => {
  equal(Text.unwrap("```text\nThanks for waiting.\n```"), "Thanks for waiting.")
})

test("unwrap strips one layer of wrapping quotes", () => {
  equal(Text.unwrap("\"Thanks for waiting.\""), "Thanks for waiting.")
})

test("unwrap leaves quotes that are part of the reply", () => {
  equal(Text.unwrap("Use the code \"ABC\" please."), "Use the code \"ABC\" please.")
})
