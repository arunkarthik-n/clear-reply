open NodeTest

let json = (s: string): JSON.t => JSON.parseOrThrow(s)

test("parseCompletion reads choices[0].message.content", () => {
  deepEqual(
    Groq.parseCompletion(
      json(`{"choices":[{"message":{"role":"assistant","content":"  Thanks for waiting.  "}}]}`),
    ),
    Ok("Thanks for waiting."),
  )
})

test("parseCompletion maps API error objects", () => {
  deepEqual(
    Groq.parseCompletion(json(`{"error":{"message":"Invalid API Key"}}`)),
    Error("Invalid API Key"),
  )
})

test("parseCompletion rejects empty content", () => {
  deepEqual(
    Groq.parseCompletion(json(`{"choices":[{"message":{"content":"   "}}]}`)),
    Error("The model returned an empty rewrite."),
  )
})

test("parseModelIds keeps chat models only", () => {
  deepEqual(
    Groq.parseModelIds(
      json(
        `{"data":[{"id":"qwen/qwen3.8-27b"},{"id":"whisper-large-v3"},{"id":"llama-3.1-8b-instant"}]}`,
      ),
    ),
    ["qwen/qwen3.8-27b", "llama-3.1-8b-instant"],
  )
})

test("requestBody disables Qwen reasoning and omits it for Llama", () => {
  let qwen = Groq.requestBody("qwen/qwen3.8-27b", "pls wait")
  let llama = Groq.requestBody("llama-3.1-8b-instant", "pls wait")
  equal(qwen->String.includes("\"reasoning_effort\":\"none\""), true)
  equal(llama->String.includes("reasoning_effort"), false)
  equal(qwen->String.includes("pls wait"), true)
  equal(qwen->String.includes("system"), true)
})

test("requestBody uses a custom system prompt", () => {
  let body = Groq.requestBody(
    "llama-3.1-8b-instant",
    "pls wait",
    ~systemPrompt="Rewrite more formally.",
  )
  equal(body->String.includes("Rewrite more formally."), true)
  equal(body->String.includes(Prompt.system), false)
})

test("explainHttp maps auth and rate-limit statuses", () => {
  equal(
    Groq.explainHttp(401, "{}")->String.includes("console.groq.com/keys"),
    true,
  )
  equal(Groq.explainHttp(429, "{}")->String.includes("rate limit"), true)
  equal(Groq.explainHttp(500, `{"error":{"message":"boom"}}`), "boom")
})
