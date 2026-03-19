chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "hyphenate-selection",
    title: "✨ Hyphenate Selection",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "hyphenate-selection") {
    chrome.tabs.sendMessage(tab.id, { action: "hyphenate" });
  }
});
