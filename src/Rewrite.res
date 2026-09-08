type outcome =
  | Rewritten(string)
  | MissingKey
  | EmptyDraft
  | Failed(string)

let run = async (
  ~apiKey: string,
  ~model: string,
  ~systemPrompt: string=Prompt.system,
  ~draft: string,
  ~signal: option<Fetch.signal>=None,
): outcome => {
  let draft = draft->String.trim
  let apiKey = apiKey->String.trim
  if draft == "" {
    EmptyDraft
  } else if apiKey == "" {
    MissingKey
  } else {
    switch await Groq.complete({apiKey, model, systemPrompt, draft, signal: ?signal}) {
    | Ok(text) =>
      switch text->Text.unwrap {
      | "" => Failed("The model returned an empty rewrite.")
      | out => Rewritten(out)
      }
    | Error(msg) => Failed(msg)
    }
  }
}
