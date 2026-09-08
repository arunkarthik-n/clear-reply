open NodeTest

testPromise("empty draft does not call Groq", async () => {
  let result = await Rewrite.run(~apiKey="gsk", ~model=Models.defaultId, ~draft="   ")
  deepEqual(result, Rewrite.EmptyDraft)
})

testPromise("missing key does not call Groq", async () => {
  let result = await Rewrite.run(~apiKey="  ", ~model=Models.defaultId, ~draft="please wait")
  deepEqual(result, Rewrite.MissingKey)
})
