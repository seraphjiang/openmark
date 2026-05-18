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

  if (message.type === "SAVE_FILE" && typeof message.url === "string" && typeof message.content === "string") {
    if (!message.url.startsWith("file://")) {
      sendResponse({ ok: false, error: "Only file:// URLs allowed" });
      return true;
    }
    // Convert file:// URL to filesystem path
    const path = decodeURIComponent(message.url.replace("file:///", ""));
    const blob = new Blob([message.content], { type: "text/markdown" });
    const dataUrl = URL.createObjectURL(blob);
    chrome.downloads.download(
      { url: dataUrl, filename: path, conflictAction: "overwrite", saveAs: false },
      (downloadId) => {
        URL.revokeObjectURL(dataUrl);
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, downloadId });
        }
      },
    );
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

  if (message.type === "AI_CHAT_SESSION") {
    handleAiSession(message)
      .then((reply) => sendResponse({ ok: true, reply }))
      .catch((err) => sendResponse({ ok: false, error: String(err.message || err) }));
    return true;
  }

  return false;
});

async function handleAiSession(message: any): Promise<string> {
  const { provider, model, systemMsg, messages } = message;

  switch (provider) {
    case "openai":
      return sessionOpenAi(model, systemMsg, messages);
    case "gemini":
      return sessionGemini(model, systemMsg, messages);
    case "deepseek":
      return sessionDeepSeek(model, systemMsg, messages);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function sessionOpenAi(model: string, systemMsg: string, msgs: any[]): Promise<string> {
  // Use ChatGPT's backend API with session cookies
  const res = await fetch("https://chatgpt.com/backend-api/conversation", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "next",
      model,
      messages: [
        { role: "system", content: { content_type: "text", parts: [systemMsg] } },
        ...msgs.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: { content_type: "text", parts: [m.content] },
        })),
      ],
    }),
  });
  if (!res.ok) {
    // Fallback: try the official API without key (won't work, but gives clear error)
    throw new Error(`ChatGPT session failed (HTTP ${res.status}). Make sure you're logged in to chatgpt.com.`);
  }
  const text = await res.text();
  // ChatGPT streams responses as multiple JSON lines prefixed with "data: "
  const lines = text.split("\n").filter((l) => l.startsWith("data: ") && !l.includes("[DONE]"));
  const lastLine = lines[lines.length - 1];
  if (!lastLine) throw new Error("Empty response from ChatGPT");
  try {
    const data = JSON.parse(lastLine.slice(6));
    return data.message?.content?.parts?.[0] || "No response";
  } catch {
    throw new Error("Failed to parse ChatGPT response");
  }
}

async function sessionGemini(model: string, systemMsg: string, msgs: any[]): Promise<string> {
  // Gemini's web API with Google session cookies
  const lastMsg = msgs[msgs.length - 1]?.content || "";
  const fullPrompt = systemMsg + "\n\nUser: " + lastMsg;

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini session failed (HTTP ${res.status}). Make sure you're logged in to Google.`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

async function sessionDeepSeek(model: string, systemMsg: string, msgs: any[]): Promise<string> {
  // DeepSeek's chat API with session cookies
  const res = await fetch("https://chat.deepseek.com/api/v0/chat/completions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemMsg },
        ...msgs,
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek session failed (HTTP ${res.status}). Make sure you're logged in to chat.deepseek.com.`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response";
}

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
