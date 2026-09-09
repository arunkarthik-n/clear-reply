open NodeTest

test("fromBag trims and defaults the model", () => {
  deepEqual(
    Settings.fromBag({apiKey: "  gsk_abc  ", model: "  "}),
    {apiKey: "gsk_abc", model: Models.defaultId, systemPrompt: Prompt.system},
  )
})

test("fromBag keeps chosen model and system prompt", () => {
  let settings = Settings.fromBag({
    apiKey: "k",
    model: "llama-3.1-8b-instant",
    systemPrompt: "  Rewrite concisely.  ",
  })
  equal(settings.model, "llama-3.1-8b-instant")
  equal(settings.systemPrompt, "Rewrite concisely.")
})

test("fromBag defaults a missing or blank system prompt", () => {
  equal(Settings.fromBag({}).systemPrompt, Prompt.system)
  equal(Settings.fromBag({systemPrompt: "  "}).systemPrompt, Prompt.system)
})

test("fromBag upgrades the previous default system prompt", () => {
  equal(Settings.fromBag({systemPrompt: Prompt.previous}).systemPrompt, Prompt.system)
})

test("hasKey is false for a blank key", () => {
  equal(Settings.hasKey({...Settings.default, apiKey: ""}), false)
  equal(Settings.hasKey({...Settings.default, apiKey: "gsk_abc"}), true)
})
