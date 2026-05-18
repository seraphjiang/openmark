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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: "Unauthorized sender" });
    return true;
  }

  if (message.type === "FETCH_FILE" && typeof message.url === "string") {
    if (!message.url.startsWith("file://")) {
      sendResponse({ ok: false, error: "Only file:// URLs allowed" });
      return true;
    }
    fetch(message.url)
      .then((r) => r.text())
      .then((text) => sendResponse({ ok: true, text }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === "LIST_DIRECTORY" && typeof message.url === "string") {
    if (!message.url.startsWith("file://")) {
      sendResponse({ ok: false, error: "Only file:// URLs allowed" });
      return true;
    }
    const dirUrl = message.url.endsWith("/") ? message.url : message.url + "/";
    fetch(dirUrl)
      .then((r) => r.text())
      .then((html) => {
        const entries = parseDirectoryListing(html);
        sendResponse({ ok: true, entries });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  return false;
});

function parseDirectoryListing(html: string): { name: string; isDirectory: boolean }[] {
  const entries: { name: string; isDirectory: boolean }[] = [];

  // Chrome uses addRow(filename, url, isdir, size, date) in its directory listing
  const addRowRegex = /addRow\("([^"]+)","([^"]*)",(\d)/g;
  let match;
  while ((match = addRowRegex.exec(html)) !== null) {
    const name = match[1];
    const isDirectory = match[3] === "1";
    if (name === "." || name === "..") continue;
    entries.push({ name, isDirectory });
  }

  // Fallback: parse <a> tags for other browsers or older Chrome
  if (entries.length === 0) {
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (href === "../" || href === "." || href === ".." || href === "../") continue;
      const isDirectory = href.endsWith("/");
      const name = isDirectory ? href.slice(0, -1) : href;
      if (name && name !== "..") {
        entries.push({ name: decodeURIComponent(name), isDirectory });
      }
    }
  }

  entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return entries;
}
