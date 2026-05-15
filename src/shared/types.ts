export interface Settings {
  theme: "light" | "dark" | "auto";
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  fontFamily: string;
  showToc: boolean;
  enableMermaid: boolean;
  enableKatex: boolean;
  enableHighlight: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "auto",
  fontSize: 16,
  lineHeight: 1.6,
  maxWidth: 900,
  fontFamily: "system-ui",
  showToc: true,
  enableMermaid: true,
  enableKatex: true,
  enableHighlight: true,
  autoRefresh: true,
  refreshInterval: 1000,
};
