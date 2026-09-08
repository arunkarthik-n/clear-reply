let defaultId = "qwen/qwen3.8-27b"

let fallback = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]

let isChat = (id: string): bool => {
  let lower = id->String.toLowerCase
  !(
    lower->String.includes("whisper") ||
    lower->String.includes("tts") ||
    lower->String.includes("orpheus") ||
    lower->String.includes("guard") ||
    lower->String.includes("prompt-guard")
  )
}

let usesInstructReasoning = (id: string): bool =>
  id->String.toLowerCase->String.includes("qwen")

let merge = (fetched: array<string>, current: string): array<string> => {
  let base = if Array.length(fetched) == 0 {
    fallback
  } else {
    fetched->Array.filter(isChat)
  }
  let withCurrent = {
    let trimmed = current->String.trim
    if trimmed == "" || base->Array.includes(trimmed) {
      base
    } else {
      [trimmed]->Array.concat(base)
    }
  }
  if withCurrent->Array.includes(defaultId) {
    [defaultId]->Array.concat(withCurrent->Array.filter(id => id != defaultId))
  } else {
    withCurrent
  }
}
