type document
type element
type classList
type clipboard
type keyboardEvent
type dialog = element

@val external document: document = "document"
@scope("navigator") @val external clipboard: clipboard = "clipboard"
@scope("navigator") @val external platform: string = "platform"

@send @return(nullable)
external getElementById: (document, string) => option<element> = "getElementById"
@send @return(nullable)
external querySelector: (document, string) => option<element> = "querySelector"
@send
external addEventListener: (element, string, 'e => unit) => unit = "addEventListener"
@send
external addDocListener: (document, string, 'e => unit) => unit = "addEventListener"

@get external value: element => string = "value"
@set external setValue: (element, string) => unit = "value"
@get external disabled: element => bool = "disabled"
@set external setDisabled: (element, bool) => unit = "disabled"
@set external setTextContent: (element, string) => unit = "textContent"
@set external setHidden: (element, bool) => unit = "hidden"
@set external setInnerHTML: (element, string) => unit = "innerHTML"
@get external classList: element => classList = "classList"
@send external addClass: (classList, string) => unit = "add"
@send external removeClass: (classList, string) => unit = "remove"
@send external focus: element => unit = "focus"
@send external select: element => unit = "select"
@send external showModal: dialog => unit = "showModal"
@send external closeDialog: dialog => unit = "close"

@send external readText: clipboard => promise<string> = "readText"
@send external writeText: (clipboard, string) => promise<unit> = "writeText"

@get external key: keyboardEvent => string = "key"
@get external metaKey: keyboardEvent => bool = "metaKey"
@get external ctrlKey: keyboardEvent => bool = "ctrlKey"
@send external preventDefault: keyboardEvent => unit = "preventDefault"

@val external setTimeout: (unit => unit, int) => unit = "setTimeout"

let el = (id: string): element =>
  switch document->getElementById(id) {
  | Some(node) => node
  | None => panic(`Clear Reply: missing #${id}`)
  }

let isMac = platform->String.includes("Mac")
let modKey = if isMac {
  "⌘"
} else {
  "Ctrl"
}

let setStatus = (node: element, ~kind: string, text: string): unit => {
  node->classList->removeClass("ok")
  node->classList->removeClass("err")
  node->classList->removeClass("busy")
  if kind != "" {
    node->classList->addClass(kind)
  }
  node->setTextContent(text)
}
