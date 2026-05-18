import { Settings, DEFAULT_SETTINGS, LocalState, DEFAULT_LOCAL_STATE } from "./types";

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.sync.set({ settings: { ...current, ...settings } });
}

export async function getLocalState(): Promise<LocalState> {
  const result = await chrome.storage.local.get("localState");
  return { ...DEFAULT_LOCAL_STATE, ...result.localState };
}

export async function saveLocalState(state: Partial<LocalState>): Promise<void> {
  const current = await getLocalState();
  await chrome.storage.local.set({ localState: { ...current, ...state } });
}
