chrome.runtime.onInstalled.addListener(() => {
  console.log("OpenMark extension installed");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch {
    // content script may already be injected
  }
});

// Proxy file:// fetch requests from content scripts.
// Content scripts running on file:// pages have null origin and cannot
// fetch file:// URLs directly. The background service worker has
// host_permissions for file:// and can fetch on their behalf.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "FETCH_FILE" && typeof message.url === "string") {
    fetch(message.url)
      .then((r) => r.text())
      .then((text) => sendResponse({ ok: true, text }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep channel open for async response
  }
});
