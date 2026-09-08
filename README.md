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

## Install

No cloning or build tools are needed:

1. [Download Clear Reply](https://github.com/arunkarthik-n/clear-reply/releases/latest/download/clear-reply.zip).
2. Unzip the download.
3. Open `chrome://extensions` in Chrome and enable **Developer mode**.
4. Click **Load unpacked** and select the unzipped `clear-reply` folder.

Chrome only supports one-click installation through the Chrome Web Store. Until Clear Reply is published there, Developer mode is required.

Shortcut: ⌘⇧Y / Ctrl+Shift+Y. Toolbar icon also opens the panel. Right-click selected text → Rewrite with Clear Reply.

### Build from source

```sh
git clone https://github.com/arunkarthik-n/clear-reply.git
cd clear-reply
npm install
npm run build
```

Then load the generated `dist/` folder from `chrome://extensions`.

## Settings

1. Create a key at [console.groq.com/keys](https://console.groq.com/keys).
2. Paste it in the panel's Settings (or the extension options page).
3. Model defaults to `qwen/qwen3.8-27b`. The dropdown lists Groq chat models for that key; any id can be typed.
4. The rewrite system prompt can be edited in Settings.

The key and settings are stored in `chrome.storage.local` on this computer.

## Rewrite contract

Fix grammar. Keep meaning, names, numbers, links. Do not add greetings, promises, or facts that were not in the draft. Output is the reply only — auto-copied so the next paste goes into the customer thread.
