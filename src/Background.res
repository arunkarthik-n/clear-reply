let setup = async (): unit => {
  await Chrome.SidePanel.setPanelBehavior({openPanelOnActionClick: true})
  await Chrome.ContextMenus.removeAll()
  Chrome.ContextMenus.create({
    id: "rewrite-selection",
    title: "Rewrite with Clear Reply",
    contexts: ["selection"],
  })
}

setup()->ignore

Chrome.Runtime.addInstalledListener(() => {
  setup()->ignore
})

Chrome.ContextMenus.addClickedListener((info, tab) => {
  switch info.selectionText {
  | Some(text) if text->String.trim != "" =>
    let stash = async () => {
      await Chrome.Storage.session->Chrome.Storage.set({
        pendingDraft: text->String.trim,
      })
      switch tab.id {
      | Some(tabId) => await Chrome.SidePanel.open_({tabId: tabId})
      | None =>
        switch tab.windowId {
        | Some(windowId) => await Chrome.SidePanel.open_({windowId: windowId})
        | None => ()
        }
      }
    }
    stash()->ignore
  | _ => ()
  }
})
