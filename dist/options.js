(() => {
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

  // node_modules/@rescript/runtime/lib/es6/Stdlib_JsError.js
  function panic(msg) {
    throw new Error(`Panic! ` + msg);
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
  function setStatus(node, kind, text) {
    node.classList.remove("ok");
    node.classList.remove("err");
    node.classList.remove("busy");
    if (kind !== "") {
      node.classList.add(kind);
    }
    node.textContent = text;
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
    let boot = async () => {
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
    boot();
  }

  // src/Options.res.mjs
  mount();
})();
