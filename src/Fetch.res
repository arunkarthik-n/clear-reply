type signal
type abortController = {
  signal: signal,
  abort: unit => unit,
}
type response
type init

@new external makeAbortController: unit => abortController = "AbortController"

@obj
external makeInit: (
  ~method: string,
  ~headers: dict<string>,
  ~body: string=?,
  ~signal: signal=?,
  unit,
) => init = ""

@val external fetch: (string, init) => promise<response> = "fetch"
@get external ok: response => bool = "ok"
@get external status: response => int = "status"
@send external text: response => promise<string> = "text"
