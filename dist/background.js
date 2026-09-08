(() => {
  // src/Background.res.mjs
  async function setup() {
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: "rewrite-selection",
      title: "Rewrite with Clear Reply",
      contexts: ["selection"]
    });
  }
  setup();
  chrome.runtime.onInstalled.addListener(() => {
    setup();
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    let text = info.selectionText;
    if (text === void 0) {
      return;
    }
    if (text.trim() === "") {
      return;
    }
    let stash = async () => {
      await chrome.storage.session.set({
        pendingDraft: text.trim()
      });
      let tabId = tab.id;
      if (tabId !== void 0) {
        return await chrome.sidePanel.open({
          tabId
        });
      }
      let windowId = tab.windowId;
      if (windowId !== void 0) {
        return await chrome.sidePanel.open({
          windowId
        });
      }
    };
    stash();
  });
})();
