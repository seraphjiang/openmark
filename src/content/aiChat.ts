import { AiProvider } from "../shared/types";
import { getSettings, saveSettings } from "../shared/storage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

let messages: ChatMessage[] = [];
let chatListEl: HTMLElement;
let inputEl: HTMLTextAreaElement;
let sendBtn: HTMLElement;

export function createChatTab(): HTMLElement {
  const el = document.createElement("div");
  el.className = "tab-panel chat-panel";

  // Config section (collapsible)
  const configToggle = document.createElement("button");
  configToggle.className = "chat-config-toggle";
  configToggle.textContent = "⚙ AI Settings";
  const configSection = document.createElement("div");
  configSection.className = "chat-config";
  configSection.style.display = "none";
  configToggle.addEventListener("click", () => {
    configSection.style.display = configSection.style.display === "none" ? "" : "none";
  });

  buildConfigUI(configSection);
  el.appendChild(configToggle);
  el.appendChild(configSection);

  // Chat messages
  chatListEl = document.createElement("div");
  chatListEl.className = "chat-messages";
  el.appendChild(chatListEl);

  // Input area
  const inputArea = document.createElement("div");
  inputArea.className = "chat-input-area";

  inputEl = document.createElement("textarea");
  inputEl.className = "chat-input";
  inputEl.placeholder = "Ask about this document...";
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn = document.createElement("button");
  sendBtn.className = "chat-send-btn";
  sendBtn.textContent = "Send";
  sendBtn.addEventListener("click", sendMessage);

  inputArea.appendChild(inputEl);
  inputArea.appendChild(sendBtn);
  el.appendChild(inputArea);

  return el;
}

async function buildConfigUI(container: HTMLElement): Promise<void> {
  const settings = await getSettings();
  const config = settings.aiConfig;
  container.innerHTML = "";

  // Provider select
  container.appendChild(createField("Provider", () => {
    const sel = document.createElement("select");
    const providers: { value: AiProvider; label: string }[] = [
      { value: "openai", label: "OpenAI (ChatGPT)" },
      { value: "gemini", label: "Google Gemini" },
      { value: "deepseek", label: "DeepSeek" },
      { value: "anthropic", label: "Anthropic (Claude)" },
    ];
    for (const p of providers) {
      const opt = document.createElement("option");
      opt.value = p.value;
      opt.textContent = p.label;
      if (p.value === config.provider) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", async () => {
      const provider = sel.value as AiProvider;
      const model = getDefaultModel(provider);
      await saveSettings({ aiConfig: { ...config, provider, model } });
      buildConfigUI(container);
    });
    return sel;
  }));

  // API Key
  container.appendChild(createField("API Key", () => {
    const input = document.createElement("input");
    input.type = "password";
    input.className = "chat-key-input";
    input.value = config.apiKey;
    input.placeholder = "Enter your API key";
    input.addEventListener("change", async () => {
      const current = (await getSettings()).aiConfig;
      await saveSettings({ aiConfig: { ...current, apiKey: input.value } });
    });
    return input;
  }));

  // Model
  container.appendChild(createField("Model", () => {
    const sel = document.createElement("select");
    const models = getModels(config.provider);
    for (const m of models) {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;
      if (m.value === config.model) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener("change", async () => {
      const current = (await getSettings()).aiConfig;
      await saveSettings({ aiConfig: { ...current, model: sel.value } });
    });
    return sel;
  }));
}

function createField(label: string, buildControl: () => HTMLElement): HTMLElement {
  const field = document.createElement("div");
  field.className = "setting-field";
  const lbl = document.createElement("label");
  lbl.textContent = label;
  field.appendChild(lbl);
  field.appendChild(buildControl());
  return field;
}

function getDefaultModel(provider: AiProvider): string {
  switch (provider) {
    case "openai": return "gpt-4o-mini";
    case "gemini": return "gemini-2.0-flash";
    case "deepseek": return "deepseek-chat";
    case "anthropic": return "claude-3-5-haiku-20241022";
  }
}

function getModels(provider: AiProvider): { value: string; label: string }[] {
  switch (provider) {
    case "openai": return [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { value: "gpt-4.1", label: "GPT-4.1" },
    ];
    case "gemini": return [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ];
    case "deepseek": return [
      { value: "deepseek-chat", label: "DeepSeek Chat" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
    ];
    case "anthropic": return [
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { value: "claude-opus-4-5", label: "Claude Opus 4.5" },
    ];
  }
}

function getDocumentContext(): string {
  const content = document.querySelector<HTMLElement>(".openmark-content");
  if (!content) return "";
  const text = content.innerText || content.textContent || "";
  return text.length > 4000 ? text.slice(0, 4000) + "\n...(truncated)" : text;
}

async function sendMessage(): Promise<void> {
  const text = inputEl.value.trim();
  if (!text) return;

  const settings = await getSettings();
  const { apiKey, provider, model } = settings.aiConfig;

  if (!apiKey) {
    appendMessage("assistant", "Please set your API key in AI Settings (⚙) above.");
    return;
  }

  messages.push({ role: "user", content: text });
  appendMessage("user", text);
  inputEl.value = "";
  inputEl.disabled = true;
  sendBtn.classList.add("disabled");

  try {
    const reply = await callAiKey(provider, apiKey, model, messages);
    messages.push({ role: "assistant", content: reply });
    appendMessage("assistant", reply);
  } catch (err: any) {
    appendMessage("assistant", `Error: ${err.message || "Request failed"}`);
  } finally {
    inputEl.disabled = false;
    sendBtn.classList.remove("disabled");
    inputEl.focus();
  }
}

function appendMessage(role: "user" | "assistant", content: string): void {
  const msg = document.createElement("div");
  msg.className = `chat-message ${role}`;
  msg.textContent = content;
  chatListEl.appendChild(msg);
  chatListEl.scrollTop = chatListEl.scrollHeight;
}

async function callAiKey(provider: AiProvider, apiKey: string, model: string, msgs: ChatMessage[]): Promise<string> {
  const docContext = getDocumentContext();
  const systemMsg = `You are a helpful assistant. The user is reading the following document:\n\n${docContext}\n\nAnswer questions about this document concisely.`;

  switch (provider) {
    case "openai": return callOpenAi(apiKey, model, systemMsg, msgs);
    case "gemini": return callGemini(apiKey, model, systemMsg, msgs);
    case "deepseek": return callDeepSeek(apiKey, model, systemMsg, msgs);
    case "anthropic": return callAnthropic(apiKey, model, systemMsg, msgs);
  }
}

async function callOpenAi(apiKey: string, model: string, systemMsg: string, msgs: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemMsg }, ...msgs] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response";
}

async function callGemini(apiKey: string, model: string, systemMsg: string, msgs: ChatMessage[]): Promise<string> {
  const contents = msgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemMsg }] }, contents }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

async function callDeepSeek(apiKey: string, model: string, systemMsg: string, msgs: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemMsg }, ...msgs] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response";
}

async function callAnthropic(apiKey: string, model: string, systemMsg: string, msgs: ChatMessage[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemMsg,
      messages: msgs,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "No response";
}
