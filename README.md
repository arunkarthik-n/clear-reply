# Clear Reply

Chrome side panel for support agents who write English and want a grammar pass before sending.

```
chat tab                         side panel
---------                        ----------
copy draft  ──paste/⌘V──▶        your draft
                                 Rewrite ⌘↵
paste reply ◀──auto-copy──       clear English
```

The panel stays open next to the ticket. A popup would close the moment you click back into chat.

## Load

```sh
npm install
npm run build
```

Chrome → `chrome://extensions` → Developer mode → Load unpacked → `dist/`.

Shortcut: ⌘⇧Y / Ctrl+Shift+Y. Toolbar icon also opens the panel. Right-click selected text → Rewrite with Clear Reply.

## Settings

1. Create a key at [console.groq.com/keys](https://console.groq.com/keys).
2. Paste it in the panel's Settings (or the extension options page).
3. Model defaults to `qwen/qwen3.8-27b`. The dropdown lists Groq chat models for that key; any id can be typed.
4. The rewrite system prompt can be edited in Settings.

The key and settings are stored in `chrome.storage.local` on this computer.

## Rewrite contract

Fix grammar. Keep meaning, names, numbers, links. Do not add greetings, promises, or facts that were not in the draft. Output is the reply only — auto-copied so the next paste goes into the customer thread.
