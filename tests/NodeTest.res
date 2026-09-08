@module("node:test")
external test: (string, @uncurry (unit => unit)) => unit = "test"

@module("node:test")
external testPromise: (string, @uncurry (unit => promise<unit>)) => unit = "test"

@module("node:assert/strict")
external equal: ('a, 'a) => unit = "equal"

@module("node:assert/strict")
external deepEqual: ('a, 'a) => unit = "deepEqual"
