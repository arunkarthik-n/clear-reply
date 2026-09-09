type t = {
  apiKey: string,
  model: string,
  systemPrompt: string,
}

let default: t = {
  apiKey: "",
  model: Models.defaultId,
  systemPrompt: Prompt.system,
}

let fromBag = (bag: Chrome.bag): t => {
  apiKey: bag.apiKey->Option.getOr("")->String.trim,
  model: switch bag.model->Option.getOr("")->String.trim {
  | "" => Models.defaultId
  | m => m
  },
  systemPrompt: switch bag.systemPrompt->Option.getOr("")->String.trim {
  | "" => Prompt.system
  | prompt if prompt == Prompt.previous => Prompt.system
  | prompt => prompt
  },
}

let hasKey = (s: t): bool => s.apiKey != ""

let load = async (): t => {
  let bag = await Chrome.Storage.local->Chrome.Storage.get({
    apiKey: "",
    model: Models.defaultId,
    systemPrompt: Prompt.system,
  })
  fromBag(bag)
}

let save = async (s: t): unit =>
  await Chrome.Storage.local->Chrome.Storage.set({
    apiKey: s.apiKey,
    model: s.model,
    systemPrompt: s.systemPrompt,
  })
