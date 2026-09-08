open NodeTest

test("default model is Qwen 3.8 27B on Groq", () => {
  equal(Models.defaultId, "qwen/qwen3.8-27b")
})

test("chat denylist drops audio, tts, and guard models", () => {
  equal(Models.isChat("qwen/qwen3.8-27b"), true)
  equal(Models.isChat("llama-3.1-8b-instant"), true)
  equal(Models.isChat("whisper-large-v3"), false)
  equal(Models.isChat("canopylabs/orpheus-v1-english"), false)
  equal(Models.isChat("meta-llama/llama-prompt-guard-2-22m"), false)
})

test("qwen models get instruct-mode reasoning_effort", () => {
  equal(Models.usesInstructReasoning("qwen/qwen3.8-27b"), true)
  equal(Models.usesInstructReasoning("llama-3.1-8b-instant"), false)
  equal(Models.usesInstructReasoning("openai/gpt-oss-20b"), false)
})

test("merge puts default first and keeps the current id", () => {
  deepEqual(
    Models.merge(["llama-3.1-8b-instant", "qwen/qwen3.8-27b"], "my/custom"),
    ["qwen/qwen3.8-27b", "my/custom", "llama-3.1-8b-instant"],
  )
})

test("empty fetch falls back to the curated list", () => {
  equal(Models.merge([], "")->Array.includes(Models.defaultId), true)
  equal(Models.merge([], "")->Array.includes("whisper-large-v3"), false)
})
