let escapeAttr = (s: string): string =>
  s
  ->String.replaceAll("&", "&amp;")
  ->String.replaceAll("<", "&lt;")
  ->String.replaceAll("\"", "&quot;")

let fillModels = (ids: array<string>, current: string): unit => {
  let list = Page.el("model-list")
  let merged = Models.merge(ids, current)
  list->Page.setInnerHTML(
    merged
    ->Array.map(id => `<option value="${escapeAttr(id)}"></option>`)
    ->Array.join(""),
  )
}

let readForm = (): Settings.t => {
  apiKey: Page.el("api-key")->Page.value->String.trim,
  model: switch Page.el("model")->Page.value->String.trim {
  | "" => Models.defaultId
  | m => m
  },
  systemPrompt: switch Page.el("system-prompt")->Page.value->String.trim {
  | "" => Prompt.system
  | prompt => prompt
  },
}

let writeForm = (s: Settings.t): unit => {
  Page.el("api-key")->Page.setValue(s.apiKey)
  Page.el("model")->Page.setValue(s.model)
  Page.el("system-prompt")->Page.setValue(s.systemPrompt)
}

let setNote = (text: string, ~kind: string): unit =>
  Page.setStatus(Page.el("settings-status"), ~kind, text)

let refreshModels = async (apiKey: string, current: string): unit => {
  if apiKey == "" {
    fillModels([], current)
    setNote("Add a Groq API key to load models.", ~kind="")
  } else {
    setNote("Loading models…", ~kind="busy")
    switch await Groq.listModels({apiKey: apiKey}) {
    | Ok(ids) =>
      fillModels(ids, current)
      setNote(
        if Array.length(ids) == 0 {
          "No chat models returned. You can still type a model id."
        } else {
          `${Int.toString(Array.length(ids))} models from Groq.`
        },
        ~kind="ok",
      )
    | Error(msg) =>
      fillModels([], current)
      setNote(msg, ~kind="err")
    }
  }
}

let mount = (): unit => {
  let saveBtn = Page.el("save-settings")
  let refreshBtn = Page.el("refresh-models")

  let boot = async () => {
    let s = await Settings.load()
    writeForm(s)
    fillModels([], s.model)
    if Settings.hasKey(s) {
      await refreshModels(s.apiKey, s.model)
    } else {
      setNote("Key stays on this computer.", ~kind="")
    }
  }

  refreshBtn->Page.addEventListener("click", _ => {
    let form = readForm()
    refreshModels(form.apiKey, form.model)->ignore
  })

  saveBtn->Page.addEventListener("click", _ => {
    let save = async () => {
      let s = readForm()
      await Settings.save(s)
      setNote("Saved.", ~kind="ok")
      if Settings.hasKey(s) {
        await refreshModels(s.apiKey, s.model)
      }
      switch Page.document->Page.querySelector("dialog#settings") {
      | Some(dialog) => dialog->Page.closeDialog
      | None => ()
      }
    }
    save()->ignore
  })

  boot()->ignore
}
