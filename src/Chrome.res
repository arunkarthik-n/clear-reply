type storageArea
type tab = {id?: int, windowId?: int}
type menuInfo = {menuItemId: string, selectionText?: string}
type menuCreate = {
  id: string,
  title: string,
  contexts: array<string>,
}
type panelBehavior = {openPanelOnActionClick: bool}
type openPanel = {
  tabId?: int,
  windowId?: int,
}
type bag = {
  apiKey?: string,
  model?: string,
  systemPrompt?: string,
  pendingDraft?: string,
  draft?: string,
  result?: string,
}
type change = {newValue?: JSON.t, oldValue?: JSON.t}

module Storage = {
  @send external get: (storageArea, bag) => promise<bag> = "get"
  @send external set: (storageArea, bag) => promise<unit> = "set"
  @send external remove: (storageArea, array<string>) => promise<unit> = "remove"
  @scope(("chrome", "storage")) @val external local: storageArea = "local"
  @scope(("chrome", "storage")) @val external session: storageArea = "session"
  @scope(("chrome", "storage", "onChanged"))
  external addChangedListener: ((dict<change>, string) => unit) => unit = "addListener"
}

module SidePanel = {
  @scope(("chrome", "sidePanel"))
  external setPanelBehavior: panelBehavior => promise<unit> = "setPanelBehavior"
  @scope(("chrome", "sidePanel"))
  external open_: openPanel => promise<unit> = "open"
}

module ContextMenus = {
  @scope(("chrome", "contextMenus"))
  external create: menuCreate => unit = "create"
  @scope(("chrome", "contextMenus"))
  external removeAll: unit => promise<unit> = "removeAll"
  @scope(("chrome", "contextMenus", "onClicked"))
  external addClickedListener: ((menuInfo, tab) => unit) => unit = "addListener"
}

module Runtime = {
  @scope(("chrome", "runtime"))
  external openOptionsPage: unit => promise<unit> = "openOptionsPage"
  @scope(("chrome", "runtime", "onInstalled"))
  external addInstalledListener: (unit => unit) => unit = "addListener"
}
