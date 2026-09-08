type completeArgs = {
  apiKey: string,
  model: string,
  systemPrompt?: string,
  draft: string,
  signal?: Fetch.signal,
}

type listArgs = {
  apiKey: string,
  signal?: Fetch.signal,
}

let completionsUrl = "https://api.groq.com/openai/v1/chat/completions"
let modelsUrl = "https://api.groq.com/openai/v1/models"

let jsonString = (dict: dict<JSON.t>, key: string): option<string> =>
  switch dict->Dict.get(key) {
  | Some(String(s)) => Some(s)
  | _ => None
  }

let errorMessage = (json: JSON.t): option<string> =>
  switch json {
  | Object(d) =>
    switch d->Dict.get("error") {
    | Some(Object(err)) => jsonString(err, "message")
    | Some(String(m)) => Some(m)
    | _ => jsonString(d, "message")
    }
  | _ => None
  }

let explainHttp = (status: int, body: string): string => {
  let parsed = try Some(JSON.parseOrThrow(body)) catch {
  | _ => None
  }
  let fromBody = parsed->Option.flatMap(errorMessage)
  switch status {
  | 401 => "That API key was rejected. Check it at console.groq.com/keys."
  | 403 => "Groq refused this key. Check the key and model access."
  | 404 => "Unknown model. Pick another in Settings."
  | 429 => "Groq rate limit. Wait a few seconds and try again."
  | _ =>
    switch fromBody {
    | Some(m) => m
    | None => `Groq error (${Int.toString(status)}).`
    }
  }
}

let parseCompletion = (json: JSON.t): result<string, string> =>
  switch json {
  | Object(dict) =>
    switch dict->Dict.get("error") {
    | Some(_) =>
      switch errorMessage(json) {
      | Some(m) => Error(m)
      | None => Error("Groq request failed.")
      }
    | None =>
      switch dict->Dict.get("choices") {
      | Some(Array(choices)) =>
        switch choices[0] {
        | Some(Object(choice)) =>
          switch choice->Dict.get("message") {
          | Some(Object(message)) =>
            switch jsonString(message, "content") {
            | Some(s) =>
              switch s->String.trim {
              | "" => Error("The model returned an empty rewrite.")
              | t => Ok(t)
              }
            | None => Error("The model returned an empty rewrite.")
            }
          | _ => Error("Unexpected Groq response.")
          }
        | _ => Error("Unexpected Groq response.")
        }
      | _ => Error("Unexpected Groq response.")
      }
    }
  | _ => Error("Unexpected Groq response.")
  }

let parseModelIds = (json: JSON.t): array<string> =>
  switch json {
  | Object(dict) =>
    switch dict->Dict.get("data") {
    | Some(Array(items)) =>
      items->Array.filterMap(item =>
        switch item {
        | Object(m) =>
          switch jsonString(m, "id") {
          | Some(id) if Models.isChat(id) => Some(id)
          | _ => None
          }
        | _ => None
        }
      )
    | _ => []
    }
  | _ => []
  }

let message = (role: string, content: string): JSON.t =>
  [
    ("role", JSON.Encode.string(role)),
    ("content", JSON.Encode.string(content)),
  ]
  ->Dict.fromArray
  ->JSON.Encode.object

let requestBody = (
  model: string,
  draft: string,
  ~systemPrompt: string=Prompt.system,
): string => {
  let fields = [
    ("model", JSON.Encode.string(model)),
    ("temperature", JSON.Encode.float(0.3)),
    ("max_tokens", JSON.Encode.int(2048)),
    (
      "messages",
      JSON.Encode.array([message("system", systemPrompt), message("user", draft)]),
    ),
  ]
  let fields = if Models.usesInstructReasoning(model) {
    fields->Array.concat([("reasoning_effort", JSON.Encode.string("none"))])
  } else {
    fields
  }
  fields->Dict.fromArray->JSON.Encode.object->JSON.stringify
}

let readJson = async (response: Fetch.response): result<JSON.t, string> => {
  let body = await response->Fetch.text
  if !(response->Fetch.ok) {
    Error(explainHttp(response->Fetch.status, body))
  } else {
    try {
      Ok(JSON.parseOrThrow(body))
    } catch {
    | _ => Error("Groq returned invalid JSON.")
    }
  }
}

let complete = async (args: completeArgs): result<string, string> => {
  let fetched = try {
    Ok(
      await Fetch.fetch(
        completionsUrl,
        Fetch.makeInit(
          ~method="POST",
          ~headers=Dict.fromArray([
            ("Authorization", `Bearer ${args.apiKey}`),
            ("Content-Type", "application/json"),
          ]),
          ~body=requestBody(
            args.model,
            args.draft,
            ~systemPrompt=args.systemPrompt->Option.getOr(Prompt.system),
          ),
          ~signal=?args.signal,
          (),
        ),
      ),
    )
  } catch {
  | _ => Error("Could not reach Groq. Check your connection.")
  }
  switch fetched {
  | Error(msg) => Error(msg)
  | Ok(response) =>
    switch await readJson(response) {
    | Error(msg) => Error(msg)
    | Ok(json) => parseCompletion(json)
    }
  }
}

let listModels = async (args: listArgs): result<array<string>, string> => {
  let fetched = try {
    Ok(
      await Fetch.fetch(
        modelsUrl,
        Fetch.makeInit(
          ~method="GET",
          ~headers=Dict.fromArray([("Authorization", `Bearer ${args.apiKey}`)]),
          ~signal=?args.signal,
          (),
        ),
      ),
    )
  } catch {
  | _ => Error("Could not reach Groq. Check your connection.")
  }
  switch fetched {
  | Error(msg) => Error(msg)
  | Ok(response) =>
    switch await readJson(response) {
    | Error(msg) => Error(msg)
    | Ok(json) => Ok(parseModelIds(json))
    }
  }
}
