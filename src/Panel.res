let draftEl = () => Page.el("draft")
let resultEl = () => Page.el("result")
let rewriteBtn = () => Page.el("rewrite")
let copyBtn = () => Page.el("copy")
let pasteBtn = () => Page.el("paste")
let useDraftBtn = () => Page.el("use-draft")
let setupEl = () => Page.el("setup")
let statusEl = () => Page.el("status")

let abortRef: ref<option<Fetch.abortController>> = ref(None)

let setBusy = (busy: bool): unit => {
  rewriteBtn()->Page.setDisabled(busy)
  pasteBtn()->Page.setDisabled(busy)
  Page.el("rewrite-label")->Page.setTextContent(
    if busy {
      "Rewriting…"
    } else {
      "Rewrite"
    },
  )
  Page.el("rewrite-hint")->Page.setHidden(busy)
}

let setResultButtons = (hasResult: bool): unit => {
  copyBtn()->Page.setDisabled(!hasResult)
  useDraftBtn()->Page.setDisabled(!hasResult)
}

let persistSession = async (): unit =>
  await Chrome.Storage.session->Chrome.Storage.set({
    draft: draftEl()->Page.value,
    result: resultEl()->Page.value,
  })

let showSetup = (needsKey: bool): unit => setupEl()->Page.setHidden(!needsKey)

let note = (~kind: string, text: string): unit => Page.setStatus(statusEl(), ~kind, text)

let copyResult = async (): bool => {
  let text = resultEl()->Page.value->String.trim
  if text == "" {
    false
  } else {
    try {
      await Page.clipboard->Page.writeText(text)
      copyBtn()->Page.setTextContent("Copied")
      note(~kind="ok", "Copied — paste it into the chat.")
      true
    } catch {
    | _ =>
      resultEl()->Page.focus
      resultEl()->Page.select
      note(~kind="err", "Copy failed. Select the reply and copy it.")
      false
    }
  }
}

let applyResult = async (text: string): unit => {
  resultEl()->Page.setValue(text)
  setResultButtons(true)
  resultEl()->Page.focus
  resultEl()->Page.select
  await persistSession()
  let _ = await copyResult()
}

let pasteClipboard = async (): option<string> =>
  try {
    let text = await Page.clipboard->Page.readText
    switch text->String.trim {
    | "" => None
    | t => Some(t)
    }
  } catch {
  | _ => None
  }

let rewriteNow = async (): unit => {
  let settings = await Settings.load()
  showSetup(!Settings.hasKey(settings))
  if !Settings.hasKey(settings) {
    note(~kind="err", "Add a Groq API key in Settings.")
  } else {
    let current = draftEl()->Page.value->String.trim
    let draft = if current == "" {
      switch await pasteClipboard() {
      | Some(t) =>
        draftEl()->Page.setValue(t)
        t
      | None => ""
      }
    } else {
      current
    }
    switch abortRef.contents {
    | Some(c) => c.abort()
    | None => ()
    }
    let controller = Fetch.makeAbortController()
    abortRef := Some(controller)
    setBusy(true)
    note(~kind="busy", "Rewriting…")
    let outcome = await Rewrite.run(
      ~apiKey=settings.apiKey,
      ~model=settings.model,
      ~systemPrompt=settings.systemPrompt,
      ~draft,
      ~signal=Some(controller.signal),
    )
    abortRef := None
    setBusy(false)
    switch outcome {
    | Rewritten(text) => await applyResult(text)
    | MissingKey =>
      showSetup(true)
      note(~kind="err", "Add a Groq API key in Settings.")
    | EmptyDraft => note(~kind="err", "Paste a draft first.")
    | Failed(msg) => note(~kind="err", msg)
    }
  }
}

let openSettings = (): unit =>
  switch Page.document->Page.getElementById("settings") {
  | Some(dialog) => dialog->Page.showModal
  | None => Chrome.Runtime.openOptionsPage()->ignore
  }

let consumePending = async (): option<string> => {
  let bag = await Chrome.Storage.session->Chrome.Storage.get({pendingDraft: ""})
  switch bag.pendingDraft {
  | Some(t) if t->String.trim != "" =>
    await Chrome.Storage.session->Chrome.Storage.remove(["pendingDraft"])
    Some(t->String.trim)
  | _ => None
  }
}

let boot = async (): unit => {
  Page.el("rewrite-hint")->Page.setTextContent(`${Page.modKey}↵`)
  SettingsUi.mount()

  let settings = await Settings.load()
  showSetup(!Settings.hasKey(settings))

  let session = await Chrome.Storage.session->Chrome.Storage.get({
    draft: "",
    result: "",
  })
  draftEl()->Page.setValue(session.draft->Option.getOr(""))
  switch session.result->Option.getOr("") {
  | "" => setResultButtons(false)
  | text =>
    resultEl()->Page.setValue(text)
    setResultButtons(true)
  }

  switch await consumePending() {
  | Some(text) =>
    draftEl()->Page.setValue(text)
    await persistSession()
    await rewriteNow()
  | None => ()
  }

  draftEl()->Page.focus
}

rewriteBtn()->Page.addEventListener("click", _ => rewriteNow()->ignore)
pasteBtn()->Page.addEventListener("click", _ => {
  let go = async () => {
    switch await pasteClipboard() {
    | Some(t) =>
      draftEl()->Page.setValue(t)
      await persistSession()
      draftEl()->Page.focus
      note(~kind="", "")
    | None => note(~kind="err", "Clipboard is empty. Copy the draft, then paste.")
    }
  }
  go()->ignore
})
copyBtn()->Page.addEventListener("click", _ => copyResult()->ignore)
useDraftBtn()->Page.addEventListener("click", _ => {
  draftEl()->Page.setValue(resultEl()->Page.value)
  persistSession()->ignore
  draftEl()->Page.focus
  note(~kind="", "Ready for another pass.")
})
Page.el("settings-btn")->Page.addEventListener("click", _ => openSettings())
Page.el("open-settings")->Page.addEventListener("click", _ => openSettings())

draftEl()->Page.addEventListener("input", _ => persistSession()->ignore)
resultEl()->Page.addEventListener("input", _ => {
  setResultButtons(resultEl()->Page.value->String.trim != "")
  persistSession()->ignore
})

Page.document->Page.addDocListener("keydown", (e: Page.keyboardEvent) => {
  if e->Page.key == "Enter" && (e->Page.metaKey || e->Page.ctrlKey) {
    e->Page.preventDefault
    rewriteNow()->ignore
  }
})

Chrome.Storage.addChangedListener((changes, area) => {
  if area == "session" {
    switch changes->Dict.get("pendingDraft") {
    | Some(change) =>
      switch change.newValue {
      | Some(String(t)) if t->String.trim != "" =>
        let go = async () => {
          await Chrome.Storage.session->Chrome.Storage.remove(["pendingDraft"])
          draftEl()->Page.setValue(t->String.trim)
          await rewriteNow()
        }
        go()->ignore
      | _ => ()
      }
    | None => ()
    }
  }
  if area == "local" {
    let sync = async () => {
      let s = await Settings.load()
      showSetup(!Settings.hasKey(s))
    }
    sync()->ignore
  }
})

boot()->ignore
