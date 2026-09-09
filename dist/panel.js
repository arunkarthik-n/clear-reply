(() => {
  // node_modules/@rescript/runtime/lib/es6/Stdlib_JsError.js
  function panic(msg) {
    throw new Error(`Panic! ` + msg);
  }

  // node_modules/@rescript/runtime/lib/es6/Stdlib.js
  var panic2 = panic;

  // src/Page.res.mjs
  function el(id) {
    let node = document.getElementById(id);
    if (node == null) {
      return panic2(`Clear Reply: missing #` + id);
    } else {
      return node;
    }
  }
  var isMac = navigator.platform.includes("Mac");
  var modKey = isMac ? "\u2318" : "Ctrl";
  function setStatus(node, kind, text) {
    node.classList.remove("ok");
    node.classList.remove("err");
    node.classList.remove("busy");
    if (kind !== "") {
      node.classList.add(kind);
    }
    node.textContent = text;
  }

  // src/Models.res.mjs
  var defaultId = "qwen/qwen3.8-27b";
  var fallback = [
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
  ];
  function isChat(id) {
    let lower = id.toLowerCase();
    return !(lower.includes("whisper") || lower.includes("tts") || lower.includes("orpheus") || lower.includes("guard") || lower.includes("prompt-guard"));
  }
  function usesInstructReasoning(id) {
    return id.toLowerCase().includes("qwen");
  }
  function merge(fetched, current) {
    let base = fetched.length === 0 ? fallback : fetched.filter(isChat);
    let trimmed = current.trim();
    let withCurrent = trimmed === "" || base.includes(trimmed) ? base : [trimmed].concat(base);
    if (withCurrent.includes(defaultId)) {
      return [defaultId].concat(withCurrent.filter((id) => id !== defaultId));
    } else {
      return withCurrent;
    }
  }

  // src/Prompt.res.mjs
  var system = `You rewrite customer-support replies written in English by a non-native speaker.

Output only the rewritten reply. No quotes, no preamble, no explanation.

You can highlight the button names and page paths, page names in bold.

Fix grammar, spelling, punctuation, and word order.
Keep the same meaning, facts, names, numbers, links, and constraints.
You can add a polite greeting if the draft includes Hi or Hello.
Do not add sign-offs, questions, or offers that were not in the draft.
Do not invent product details, policies, or promises.
Keep a polite, clear, professional support tone.
Stay in English.
Prefer short, direct sentences. Do not inflate length.
Think and act like an experienced customer support executive.
Use the following tone: Human, polite, helpful, professional, clear, calm.`;
  var previous = `You rewrite customer-support replies written in English by a non-native speaker.

Output only the rewritten reply. No quotes, no preamble, no explanation, no markdown.

Fix grammar, spelling, punctuation, and word order.
Keep the same meaning, facts, names, numbers, links, and constraints.
Do not add greetings, sign-offs, questions, or offers that were not in the draft.
Do not invent product details, policies, or promises.
Keep a polite, clear, professional support tone.
Stay in English.
Prefer short, direct sentences. Do not inflate length.`;

  // node_modules/@rescript/runtime/lib/es6/Primitive_option.js
  function some(x) {
    if (x === void 0) {
      return {
        BS_PRIVATE_NESTED_SOME_NONE: 0
      };
    } else if (x !== null && x.BS_PRIVATE_NESTED_SOME_NONE !== void 0) {
      return {
        BS_PRIVATE_NESTED_SOME_NONE: x.BS_PRIVATE_NESTED_SOME_NONE + 1 | 0
      };
    } else {
      return x;
    }
  }
  function valFromOption(x) {
    if (x === null || x.BS_PRIVATE_NESTED_SOME_NONE === void 0) {
      return x;
    }
    let depth = x.BS_PRIVATE_NESTED_SOME_NONE;
    if (depth === 0) {
      return;
    } else {
      return {
        BS_PRIVATE_NESTED_SOME_NONE: depth - 1 | 0
      };
    }
  }

  // node_modules/@rescript/runtime/lib/es6/Stdlib_Array.js
  function filterMap(a, f) {
    let l = a.length;
    let r = new Array(l);
    let j = 0;
    for (let i = 0; i < l; ++i) {
      let v = a[i];
      let v$1 = f(v);
      if (v$1 !== void 0) {
        r[j] = valFromOption(v$1);
        j = j + 1 | 0;
      }
    }
    r.length = j;
    return r;
  }

  // node_modules/@rescript/runtime/lib/es6/Stdlib_Option.js
  function flatMap(opt, f) {
    if (opt !== void 0) {
      return f(valFromOption(opt));
    }
  }
  function getOr(opt, $$default) {
    if (opt !== void 0) {
      return valFromOption(opt);
    } else {
      return $$default;
    }
  }

  // src/Groq.res.mjs
  var completionsUrl = "https://api.groq.com/openai/v1/chat/completions";
  var modelsUrl = "https://api.groq.com/openai/v1/models";
  function jsonString(dict, key) {
    let match = dict[key];
    if (typeof match === "string") {
      return match;
    }
  }
  function errorMessage(json) {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      return;
    }
    let match = json["error"];
    if (match === void 0) {
      return jsonString(json, "message");
    }
    if (match === null || Array.isArray(match)) {
      return jsonString(json, "message");
    }
    switch (typeof match) {
      case "string":
        return match;
      case "object":
        return jsonString(match, "message");
      default:
        return jsonString(json, "message");
    }
  }
  function explainHttp(status, body) {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (exn) {
      parsed = void 0;
    }
    let fromBody = flatMap(parsed, errorMessage);
    if (status >= 405) {
      if (status === 429) {
        return "Groq rate limit. Wait a few seconds and try again.";
      }
    } else if (status >= 401) {
      switch (status) {
        case 401:
          return "That API key was rejected. Check it at console.groq.com/keys.";
        case 402:
          break;
        case 403:
          return "Groq refused this key. Check the key and model access.";
        case 404:
          return "Unknown model. Pick another in Settings.";
      }
    }
    if (fromBody !== void 0) {
      return fromBody;
    } else {
      return `Groq error (` + status.toString() + `).`;
    }
  }
  function parseCompletion(json) {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    let match = json["error"];
    if (match !== void 0) {
      let m = errorMessage(json);
      if (m !== void 0) {
        return {
          TAG: "Error",
          _0: m
        };
      } else {
        return {
          TAG: "Error",
          _0: "Groq request failed."
        };
      }
    }
    let match$1 = json["choices"];
    if (match$1 === void 0) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    if (!Array.isArray(match$1)) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    let match$2 = match$1[0];
    if (match$2 === void 0) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    if (typeof match$2 !== "object" || match$2 === null || Array.isArray(match$2)) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    let match$3 = match$2["message"];
    if (match$3 === void 0) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    if (typeof match$3 !== "object" || match$3 === null || Array.isArray(match$3)) {
      return {
        TAG: "Error",
        _0: "Unexpected Groq response."
      };
    }
    let s = jsonString(match$3, "content");
    if (s === void 0) {
      return {
        TAG: "Error",
        _0: "The model returned an empty rewrite."
      };
    }
    let t = s.trim();
    if (t === "") {
      return {
        TAG: "Error",
        _0: "The model returned an empty rewrite."
      };
    } else {
      return {
        TAG: "Ok",
        _0: t
      };
    }
  }
  function parseModelIds(json) {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      return [];
    }
    let match = json["data"];
    if (match !== void 0) {
      if (Array.isArray(match)) {
        return filterMap(match, (item) => {
          if (typeof item !== "object" || item === null || Array.isArray(item)) {
            return;
          }
          let id = jsonString(item, "id");
          if (id !== void 0 && isChat(id)) {
            return id;
          }
        });
      } else {
        return [];
      }
    } else {
      return [];
    }
  }
  function message(role, content) {
    return Object.fromEntries([
      [
        "role",
        role
      ],
      [
        "content",
        content
      ]
    ]);
  }
  function requestBody(model, draft, systemPromptOpt) {
    let systemPrompt = systemPromptOpt !== void 0 ? systemPromptOpt : system;
    let fields = [
      [
        "model",
        model
      ],
      [
        "temperature",
        0.3
      ],
      [
        "max_tokens",
        2048
      ],
      [
        "messages",
        [
          message("system", systemPrompt),
          message("user", draft)
        ]
      ]
    ];
    let fields$1 = usesInstructReasoning(model) ? fields.concat([[
      "reasoning_effort",
      "none"
    ]]) : fields;
    return JSON.stringify(Object.fromEntries(fields$1));
  }
  async function readJson(response) {
    let body = await response.text();
    if (!response.ok) {
      return {
        TAG: "Error",
        _0: explainHttp(response.status, body)
      };
    }
    try {
      return {
        TAG: "Ok",
        _0: JSON.parse(body)
      };
    } catch (exn) {
      return {
        TAG: "Error",
        _0: "Groq returned invalid JSON."
      };
    }
  }
  async function complete(args) {
    let fetched;
    try {
      let tmp = {
        method: "POST",
        headers: Object.fromEntries([
          [
            "Authorization",
            `Bearer ` + args.apiKey
          ],
          [
            "Content-Type",
            "application/json"
          ]
        ]),
        body: requestBody(args.model, args.draft, getOr(args.systemPrompt, system))
      };
      if (args.signal !== void 0) {
        tmp.signal = valFromOption(args.signal);
      }
      fetched = {
        TAG: "Ok",
        _0: await fetch(completionsUrl, tmp)
      };
    } catch (exn) {
      fetched = {
        TAG: "Error",
        _0: "Could not reach Groq. Check your connection."
      };
    }
    if (fetched.TAG !== "Ok") {
      return {
        TAG: "Error",
        _0: fetched._0
      };
    }
    let msg = await readJson(fetched._0);
    if (msg.TAG === "Ok") {
      return parseCompletion(msg._0);
    } else {
      return {
        TAG: "Error",
        _0: msg._0
      };
    }
  }
  async function listModels(args) {
    let fetched;
    try {
      let tmp = {
        method: "GET",
        headers: Object.fromEntries([[
          "Authorization",
          `Bearer ` + args.apiKey
        ]])
      };
      if (args.signal !== void 0) {
        tmp.signal = valFromOption(args.signal);
      }
      fetched = {
        TAG: "Ok",
        _0: await fetch(modelsUrl, tmp)
      };
    } catch (exn) {
      fetched = {
        TAG: "Error",
        _0: "Could not reach Groq. Check your connection."
      };
    }
    if (fetched.TAG !== "Ok") {
      return {
        TAG: "Error",
        _0: fetched._0
      };
    }
    let msg = await readJson(fetched._0);
    if (msg.TAG === "Ok") {
      return {
        TAG: "Ok",
        _0: parseModelIds(msg._0)
      };
    } else {
      return {
        TAG: "Error",
        _0: msg._0
      };
    }
  }

  // src/Text.res.mjs
  function stripFence(t) {
    if (!(t.startsWith("```") && t.endsWith("```") && t.length > 6)) {
      return t;
    }
    let inner = t.slice(3, t.length - 3 | 0);
    let lines = inner.split("\n");
    let len = lines.length;
    let tmp;
    if (len !== 1) {
      if (len !== 0) {
        let first = lines[0];
        tmp = first !== void 0 && first.trim().length < 16 && !first.includes(" ") ? lines.slice(1).join("\n") : inner;
      } else {
        tmp = inner;
      }
    } else {
      tmp = lines[0];
    }
    return tmp.trim();
  }
  function stripQuotes(t) {
    if (!(t.startsWith('"') && t.endsWith('"') && t.length >= 2)) {
      return t;
    }
    let inner = t.slice(1, t.length - 1 | 0);
    if (inner.includes('"')) {
      return t;
    } else {
      return inner;
    }
  }
  function unwrap(raw) {
    return stripQuotes(stripFence(raw.trim())).trim();
  }

  // src/Rewrite.res.mjs
  async function run(apiKey, model, systemPromptOpt, draft, signalOpt) {
    let systemPrompt = systemPromptOpt !== void 0 ? systemPromptOpt : system;
    let signal = signalOpt !== void 0 ? valFromOption(signalOpt) : void 0;
    let draft$1 = draft.trim();
    let apiKey$1 = apiKey.trim();
    if (draft$1 === "") {
      return "EmptyDraft";
    }
    if (apiKey$1 === "") {
      return "MissingKey";
    }
    let text = await complete({
      apiKey: apiKey$1,
      model,
      systemPrompt,
      draft: draft$1,
      signal
    });
    if (text.TAG !== "Ok") {
      return {
        TAG: "Failed",
        _0: text._0
      };
    }
    let out = unwrap(text._0);
    if (out === "") {
      return {
        TAG: "Failed",
        _0: "The model returned an empty rewrite."
      };
    } else {
      return {
        TAG: "Rewritten",
        _0: out
      };
    }
  }

  // src/Settings.res.mjs
  function fromBag(bag) {
    let m = getOr(bag.model, "").trim();
    let tmp = m === "" ? defaultId : m;
    let prompt = getOr(bag.systemPrompt, "").trim();
    let tmp$1 = prompt === "" || prompt === previous ? system : prompt;
    return {
      apiKey: getOr(bag.apiKey, "").trim(),
      model: tmp,
      systemPrompt: tmp$1
    };
  }
  function hasKey(s) {
    return s.apiKey !== "";
  }
  async function load() {
    return fromBag(await chrome.storage.local.get({
      apiKey: "",
      model: defaultId,
      systemPrompt: system
    }));
  }
  async function save(s) {
    return await chrome.storage.local.set({
      apiKey: s.apiKey,
      model: s.model,
      systemPrompt: s.systemPrompt
    });
  }

  // src/SettingsUi.res.mjs
  function escapeAttr(s) {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
  }
  function fillModels(ids, current) {
    let list = el("model-list");
    let merged = merge(ids, current);
    list.innerHTML = merged.map((id) => `<option value="` + escapeAttr(id) + `"></option>`).join("");
  }
  function readForm() {
    let m = el("model").value.trim();
    let tmp = m === "" ? defaultId : m;
    let prompt = el("system-prompt").value.trim();
    let tmp$1 = prompt === "" ? system : prompt;
    return {
      apiKey: el("api-key").value.trim(),
      model: tmp,
      systemPrompt: tmp$1
    };
  }
  function writeForm(s) {
    el("api-key").value = s.apiKey;
    el("model").value = s.model;
    el("system-prompt").value = s.systemPrompt;
  }
  function setNote(text, kind) {
    setStatus(el("settings-status"), kind, text);
  }
  async function refreshModels(apiKey, current) {
    if (apiKey === "") {
      fillModels([], current);
      return setNote("Add a Groq API key to load models.", "");
    }
    setNote("Loading models\u2026", "busy");
    let ids = await listModels({
      apiKey
    });
    if (ids.TAG === "Ok") {
      let ids$1 = ids._0;
      fillModels(ids$1, current);
      return setNote(ids$1.length === 0 ? "No chat models returned. You can still type a model id." : ids$1.length.toString() + ` models from Groq.`, "ok");
    }
    fillModels([], current);
    return setNote(ids._0, "err");
  }
  function mount() {
    let saveBtn = el("save-settings");
    let refreshBtn = el("refresh-models");
    let boot2 = async () => {
      let s = await load();
      writeForm(s);
      fillModels([], s.model);
      if (hasKey(s)) {
        return await refreshModels(s.apiKey, s.model);
      } else {
        return setNote("Key stays on this computer.", "");
      }
    };
    refreshBtn.addEventListener("click", (param) => {
      let form = readForm();
      refreshModels(form.apiKey, form.model);
    });
    saveBtn.addEventListener("click", (param) => {
      let save2 = async () => {
        let s = readForm();
        await save(s);
        setNote("Saved.", "ok");
        if (hasKey(s)) {
          await refreshModels(s.apiKey, s.model);
        }
        let dialog = document.querySelector("dialog#settings");
        if (!(dialog == null)) {
          dialog.close();
          return;
        }
      };
      save2();
    });
    boot2();
  }

  // src/Panel.res.mjs
  function draftEl() {
    return el("draft");
  }
  function resultEl() {
    return el("result");
  }
  function rewriteBtn() {
    return el("rewrite");
  }
  function copyBtn() {
    return el("copy");
  }
  function pasteBtn() {
    return el("paste");
  }
  function setupEl() {
    return el("setup");
  }
  function statusEl() {
    return el("status");
  }
  var abortRef = {
    contents: void 0
  };
  function setBusy(busy) {
    el("rewrite").disabled = busy;
    el("paste").disabled = busy;
    el("rewrite-label").textContent = busy ? "Rewriting\u2026" : "Rewrite";
    el("rewrite-hint").hidden = busy;
  }
  function setResultButtons(hasResult) {
    el("copy").disabled = !hasResult;
  }
  async function persistSession() {
    return await chrome.storage.session.set({
      draft: el("draft").value,
      result: el("result").value
    });
  }
  function showSetup(needsKey) {
    el("setup").hidden = !needsKey;
  }
  function note(kind, text) {
    setStatus(el("status"), kind, text);
  }
  async function copyResult() {
    let text = el("result").value.trim();
    if (text === "") {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      note("ok", "Copied \u2014 paste it into the chat.");
      return true;
    } catch (exn) {
      el("result").focus();
      el("result").select();
      note("err", "Copy failed. Select the reply and copy it.");
      return false;
    }
  }
  async function applyResult(text) {
    el("result").value = text;
    setResultButtons(true);
    el("result").focus();
    el("result").select();
    await persistSession();
    await copyResult();
  }
  async function pasteClipboard() {
    try {
      let text = await navigator.clipboard.readText();
      let t = text.trim();
      if (t === "") {
        return;
      } else {
        return t;
      }
    } catch (exn) {
      return;
    }
  }
  async function rewriteNow() {
    let settings = await load();
    showSetup(!hasKey(settings));
    if (!hasKey(settings)) {
      return note("err", "Add a Groq API key in Settings.");
    }
    let current = el("draft").value.trim();
    let draft;
    if (current === "") {
      let t = await pasteClipboard();
      if (t !== void 0) {
        el("draft").value = t;
        draft = t;
      } else {
        draft = "";
      }
    } else {
      draft = current;
    }
    let c = abortRef.contents;
    if (c !== void 0) {
      c.abort();
    }
    let controller = new AbortController();
    abortRef.contents = controller;
    setBusy(true);
    note("busy", "Rewriting\u2026");
    let outcome = await run(settings.apiKey, settings.model, settings.systemPrompt, draft, some(some(controller.signal)));
    abortRef.contents = void 0;
    setBusy(false);
    if (typeof outcome === "object") {
      if (outcome.TAG === "Rewritten") {
        return await applyResult(outcome._0);
      } else {
        return note("err", outcome._0);
      }
    }
    if (outcome !== "MissingKey") {
      return note("err", "Paste a draft first.");
    }
    showSetup(true);
    return note("err", "Add a Groq API key in Settings.");
  }
  function openSettings() {
    let dialog = document.getElementById("settings");
    if (dialog == null) {
      chrome.runtime.openOptionsPage();
    } else {
      dialog.showModal();
    }
  }
  async function consumePending() {
    let bag = await chrome.storage.session.get({
      pendingDraft: ""
    });
    let t = bag.pendingDraft;
    if (t !== void 0 && t.trim() !== "") {
      await chrome.storage.session.remove(["pendingDraft"]);
      return t.trim();
    }
  }
  async function boot() {
    el("rewrite-hint").textContent = modKey + `\u21B5`;
    mount();
    let settings = await load();
    showSetup(!hasKey(settings));
    let session = await chrome.storage.session.get({
      draft: "",
      result: ""
    });
    el("draft").value = getOr(session.draft, "");
    let text = getOr(session.result, "");
    if (text === "") {
      setResultButtons(false);
    } else {
      el("result").value = text;
      setResultButtons(true);
    }
    let text$1 = await consumePending();
    if (text$1 !== void 0) {
      el("draft").value = text$1;
      await persistSession();
      await rewriteNow();
    }
    el("draft").focus();
  }
  el("rewrite").addEventListener("click", (param) => {
    rewriteNow();
  });
  el("paste").addEventListener("click", (param) => {
    let go = async () => {
      let t = await pasteClipboard();
      if (t !== void 0) {
        el("draft").value = t;
        await persistSession();
        el("draft").focus();
        return note("", "");
      } else {
        return note("err", "Clipboard is empty. Copy the draft, then paste.");
      }
    };
    go();
  });
  el("copy").addEventListener("click", (param) => {
    copyResult();
  });
  el("settings-btn").addEventListener("click", (param) => openSettings());
  el("open-settings").addEventListener("click", (param) => openSettings());
  el("draft").addEventListener("input", (param) => {
    persistSession();
  });
  el("result").addEventListener("input", (param) => {
    setResultButtons(el("result").value.trim() !== "");
    persistSession();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      rewriteNow();
      return;
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "session") {
      let change = changes["pendingDraft"];
      if (change !== void 0) {
        let match = change.newValue;
        if (match !== void 0 && typeof match === "string" && match.trim() !== "") {
          let go = async () => {
            await chrome.storage.session.remove(["pendingDraft"]);
            el("draft").value = match.trim();
            return await rewriteNow();
          };
          go();
        }
      }
    }
    if (area !== "local") {
      return;
    }
    let sync = async () => {
      let s = await load();
      return showSetup(!hasKey(s));
    };
    sync();
  });
  boot();
})();
