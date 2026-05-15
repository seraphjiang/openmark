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
