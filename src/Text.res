let stripFence = (t: string): string => {
  if t->String.startsWith("```") && t->String.endsWith("```") && String.length(t) > 6 {
    let inner = t->String.slice(~start=3, ~end=String.length(t) - 3)
    let inner = switch inner->String.split("\n") {
    | [] => inner
    | [only] => only
    | lines =>
      switch lines[0] {
      | Some(first)
        if first->String.trim->String.length < 16 && !(first->String.includes(" ")) =>
        lines->Array.slice(~start=1)->Array.join("\n")
      | _ => inner
      }
    }
    inner->String.trim
  } else {
    t
  }
}

let stripQuotes = (t: string): string => {
  if t->String.startsWith("\"") && t->String.endsWith("\"") && String.length(t) >= 2 {
    let inner = t->String.slice(~start=1, ~end=String.length(t) - 1)
    if inner->String.includes("\"") {
      t
    } else {
      inner
    }
  } else {
    t
  }
}

let unwrap = (raw: string): string => raw->String.trim->stripFence->stripQuotes->String.trim
